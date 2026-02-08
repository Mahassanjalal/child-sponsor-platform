import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../middleware";
import { getUncachableStripeClient } from "../services";

const router = Router();

const createSponsorshipSchema = z.object({
  childId: z.number().int().positive("Invalid child ID"),
  monthlyAmount: z.string().regex(/^\d+\.\d{2}$/, "Amount must be in format like '35.00'").optional(),
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    const sponsorships = await storage.getSponsorshipsBySponserId(req.user!.id);
    
    const sponsorshipsWithDetails = await Promise.all(
      sponsorships.map(async (sponsorship) => {
        const child = await storage.getChild(sponsorship.childId);
        return {
          ...sponsorship,
          child,
        };
      })
    );
    
    res.json(sponsorshipsWithDetails);
  } catch (error) {
    res.status(500).send("Failed to fetch sponsorships");
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const parsed = createSponsorshipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { childId, monthlyAmount } = parsed.data;
    
    const child = await storage.getChild(childId);
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    if (child.isSponsored) {
      return res.status(400).json({ error: "Child is already sponsored" });
    }

    const sponsorship = await storage.createSponsorship({
      sponsorId: req.user!.id,
      childId,
      status: "active",
      monthlyAmount: monthlyAmount || child.monthlyAmount,
    });

    await storage.updateChildSponsoredStatus(childId, true);

    await storage.createPayment({
      sponsorshipId: sponsorship.id,
      amount: sponsorship.monthlyAmount,
      status: "completed",
    });

    res.status(201).json(sponsorship);
  } catch (error) {
    res.status(500).send("Failed to create sponsorship");
  }
});

router.post("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid sponsorship ID" });
    }

    const sponsorship = await storage.getSponsorship(id);
    if (!sponsorship) {
      return res.status(404).json({ error: "Sponsorship not found" });
    }

    if (sponsorship.sponsorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to cancel this sponsorship" });
    }

    if (sponsorship.status === "cancelled") {
      return res.status(400).json({ error: "Sponsorship is already cancelled" });
    }

    if (sponsorship.stripeSubscriptionId) {
      try {
        const stripe = await getUncachableStripeClient();
        await stripe.subscriptions.cancel(sponsorship.stripeSubscriptionId);
      } catch (stripeError) {
        console.error("Failed to cancel Stripe subscription:", stripeError);
      }
    }

    const cancelled = await storage.cancelSponsorship(id);
    res.json({ message: "Sponsorship cancelled successfully", sponsorship: cancelled });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel sponsorship" });
  }
});

export default router;
