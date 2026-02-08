import Stripe from "stripe";
import { storage } from "./storage";

function toAmountString(amountInCents: number | null | undefined) {
  const cents = typeof amountInCents === "number" ? amountInCents : 0;
  return (cents / 100).toFixed(2);
}

export async function processLocalStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription?.toString();
      if (!subscriptionId) return;

      const sponsorship =
        await storage.getSponsorshipByStripeSubscriptionId(subscriptionId);
      if (!sponsorship) return;

      const stripePaymentId =
        invoice.payment_intent?.toString() || invoice.id;

      const existing =
        await storage.getPaymentByStripePaymentId(stripePaymentId);
      if (existing) return;

      await storage.createPayment({
        sponsorshipId: sponsorship.id,
        amount: toAmountString(invoice.amount_paid ?? invoice.amount_due),
        status: "completed",
        stripePaymentId,
      });
      return;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription?.toString();
      if (!subscriptionId) return;

      const sponsorship =
        await storage.getSponsorshipByStripeSubscriptionId(subscriptionId);
      if (!sponsorship) return;

      const stripePaymentId =
        invoice.payment_intent?.toString() || invoice.id;

      const existing =
        await storage.getPaymentByStripePaymentId(stripePaymentId);
      if (existing) return;

      await storage.createPayment({
        sponsorshipId: sponsorship.id,
        amount: toAmountString(invoice.amount_due ?? invoice.amount_paid),
        status: "failed",
        stripePaymentId,
      });
      return;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      const sponsorship =
        await storage.getSponsorshipByStripeSubscriptionId(subscriptionId);
      if (!sponsorship) return;

      await storage.cancelSponsorship(sponsorship.id);
      return;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.status !== "canceled") return;

      const sponsorship =
        await storage.getSponsorshipByStripeSubscriptionId(subscription.id);
      if (!sponsorship) return;

      await storage.cancelSponsorship(sponsorship.id);
      return;
    }

    default:
      return;
  }
}
