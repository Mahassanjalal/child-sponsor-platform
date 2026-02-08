import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware";
import { getUncachableStripeClient, getStripePublishableKey, sendSponsorshipConfirmationEmail } from "../services";
import { createCheckoutSchema, confirmSponsorshipSchema } from "@shared/schema";

const router = Router();

router.get("/publishable-key", async (req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (error) {
    res.status(500).send("Failed to get Stripe key");
  }
});

router.get("/payment-methods", requireAuth, async (req, res) => {
  try {
    const customerId = req.user!.stripeCustomerId;
    
    if (!customerId) {
      return res.json({ paymentMethods: [], defaultPaymentMethodId: null });
    }

    const stripe = await getUncachableStripeClient();
    
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = 
      typeof customer !== 'string' && !customer.deleted 
        ? (customer.invoice_settings?.default_payment_method as string | null)
        : null;

    res.json({
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: pm.id === defaultPaymentMethodId,
      })),
      defaultPaymentMethodId,
    });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).send("Failed to get payment methods");
  }
});

router.post("/billing-portal", requireAuth, async (req, res) => {
  try {
    const stripe = await getUncachableStripeClient();
    let customerId = req.user!.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        name: `${req.user!.firstName} ${req.user!.lastName}`,
      });
      customerId = customer.id;
      await storage.updateUserStripeInfo(req.user!.id, customerId);
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || "5000"}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/profile`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    res.status(500).send("Failed to create billing portal session");
  }
});

router.post("/set-default-payment-method", requireAuth, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ error: "Payment method ID is required" });
    }

    const customerId = req.user!.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }

    const stripe = await getUncachableStripeClient();

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== customerId) {
      return res.status(403).json({ error: "Payment method does not belong to this customer" });
    }

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Set default payment method error:", error);
    res.status(500).send("Failed to set default payment method");
  }
});

router.delete("/payment-methods/:paymentMethodId", requireAuth, async (req, res) => {
  try {
    const paymentMethodId = req.params.paymentMethodId as string;
    
    const customerId = req.user!.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }

    const stripe = await getUncachableStripeClient();

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== customerId) {
      return res.status(403).json({ error: "Payment method does not belong to this customer" });
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete payment method error:", error);
    res.status(500).send("Failed to delete payment method");
  }
});

router.post("/create-checkout", requireAuth, async (req, res) => {
  try {
    const parsed = createCheckoutSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { childId, paymentType } = parsed.data;
    
    const child = await storage.getChild(childId);
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    if (child.isSponsored) {
      return res.status(400).json({ error: "Child is already sponsored" });
    }

    const stripe = await getUncachableStripeClient();
    let customerId = req.user!.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        name: `${req.user!.firstName} ${req.user!.lastName}`,
      });
      customerId = customer.id;
      await storage.updateUserStripeInfo(req.user!.id, customerId);
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || "5000"}`;
    const amount = Math.round(parseFloat(child.monthlyAmount) * 100);

    let session;
    
    if (paymentType === 'one-time') {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `One-time Sponsorship for ${child.firstName} ${child.lastName}`,
                description: `Support ${child.firstName}'s education and needs`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/sponsor-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/children/${childId}`,
        metadata: {
          childId: childId.toString(),
          sponsorId: req.user!.id.toString(),
          paymentType: 'one-time',
        },
      });
    } else {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Monthly Sponsorship for ${child.firstName} ${child.lastName}`,
                description: `Monthly support for ${child.firstName}'s education and needs`,
              },
              unit_amount: amount,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${baseUrl}/sponsor-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/children/${childId}`,
        metadata: {
          childId: childId.toString(),
          sponsorId: req.user!.id.toString(),
          paymentType: 'monthly',
        },
      });
    }

    res.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).send("Failed to create checkout session");
  }
});

router.post("/confirm-sponsorship", requireAuth, async (req, res) => {
  try {
    const parsed = confirmSponsorshipSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { sessionId } = parsed.data;

    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: "Payment not completed" });
    }

    const sessionSponsorId = session.metadata?.sponsorId;
    const sessionChildId = session.metadata?.childId;
    const sessionPaymentType = session.metadata?.paymentType;
    
    if (sessionSponsorId !== req.user!.id.toString()) {
      return res.status(403).json({ error: "Session does not belong to this user" });
    }
    
    if (req.user!.stripeCustomerId && session.customer !== req.user!.stripeCustomerId) {
      return res.status(403).json({ error: "Customer mismatch" });
    }
    
    if (!sessionChildId || !sessionPaymentType) {
      return res.status(400).json({ error: "Invalid session metadata" });
    }
    
    const isSubscription = session.mode === 'subscription';
    const expectedPaymentType = isSubscription ? 'monthly' : 'one-time';
    if (sessionPaymentType !== expectedPaymentType) {
      return res.status(400).json({ error: "Payment type mismatch" });
    }

    const childId = parseInt(sessionChildId);
    const child = await storage.getChild(childId);
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }

    const existingSponsorships = await storage.getSponsorshipsBySponserId(req.user!.id);
    const alreadySponsoring = existingSponsorships.some(s => s.childId === childId);
    
    if (alreadySponsoring) {
      return res.status(400).json({ error: "Already sponsoring this child" });
    }

    const sponsorship = await storage.createSponsorship({
      sponsorId: req.user!.id,
      childId: childId,
      status: "active",
      monthlyAmount: child.monthlyAmount,
      paymentType: sessionPaymentType,
      stripeSubscriptionId: session.subscription?.toString() || null,
    });

    await storage.updateChildSponsoredStatus(childId, true);

    await storage.createPayment({
      sponsorshipId: sponsorship.id,
      amount: child.monthlyAmount,
      status: "completed",
      stripePaymentId: session.payment_intent?.toString() || session.id,
    });

    sendSponsorshipConfirmationEmail(
      req.user!.email,
      req.user!.firstName,
      `${child.firstName} ${child.lastName}`,
      child.monthlyAmount,
      sessionPaymentType
    ).catch(err => console.error('Failed to send sponsorship confirmation email:', err));

    res.json({ sponsorship });
  } catch (error) {
    console.error("Confirm sponsorship error:", error);
    res.status(500).send("Failed to confirm sponsorship");
  }
});

export default router;
