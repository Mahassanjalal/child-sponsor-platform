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

// Create Payment Intent for embedded checkout (popup-style payment)
router.post("/create-payment-intent", requireAuth, async (req, res) => {
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

    const amount = Math.round(parseFloat(child.monthlyAmount) * 100);

    // Create a payment intent for embedded checkout
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        childId: childId.toString(),
        sponsorId: req.user!.id.toString(),
        paymentType,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// Complete sponsorship after successful embedded payment
router.post("/complete-sponsorship", requireAuth, async (req, res) => {
  try {
    const { paymentIntentId, childId, paymentType } = req.body;

    if (!paymentIntentId || !childId || !paymentType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const stripe = await getUncachableStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // Verify the payment belongs to this user
    const metadataSponsorId = paymentIntent.metadata?.sponsorId;
    const metadataChildId = paymentIntent.metadata?.childId;
    
    if (metadataSponsorId !== req.user!.id.toString()) {
      return res.status(403).json({ error: "Payment does not belong to this user" });
    }
    
    if (metadataChildId !== childId.toString()) {
      return res.status(400).json({ error: "Child ID mismatch" });
    }

    const child = await storage.getChild(parseInt(childId));
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }

    // Check if already sponsoring
    const existingSponsorships = await storage.getSponsorshipsBySponserId(req.user!.id);
    const alreadySponsoring = existingSponsorships.some(s => s.childId === parseInt(childId));
    
    if (alreadySponsoring) {
      return res.status(400).json({ error: "Already sponsoring this child" });
    }

    // Create the sponsorship
    const sponsorship = await storage.createSponsorship({
      sponsorId: req.user!.id,
      childId: parseInt(childId),
      status: "active",
      monthlyAmount: child.monthlyAmount,
      paymentType,
      stripeSubscriptionId: null, // One-time payments don't have subscriptions
    });

    await storage.updateChildSponsoredStatus(parseInt(childId), true);

    // Record the payment
    await storage.createPayment({
      sponsorshipId: sponsorship.id,
      amount: child.monthlyAmount,
      status: "completed",
      stripePaymentId: paymentIntentId,
    });

    // Send confirmation email
    sendSponsorshipConfirmationEmail(
      req.user!.email,
      req.user!.firstName,
      `${child.firstName} ${child.lastName}`,
      child.monthlyAmount,
      paymentType
    ).catch(err => console.error('Failed to send sponsorship confirmation email:', err));

    res.json({ sponsorship });
  } catch (error) {
    console.error("Complete sponsorship error:", error);
    res.status(500).json({ error: "Failed to complete sponsorship" });
  }
});

// Legacy: Create Checkout Session (redirect-based - keeping for fallback)
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
        success_url: `${baseUrl}/sponsor/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/child/${childId}`,
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
        success_url: `${baseUrl}/sponsor/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/child/${childId}`,
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
