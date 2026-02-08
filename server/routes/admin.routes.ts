import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAdmin } from "../middleware";
import { sendNewReportEmail } from "../services";
import { getUncachableStripeClient } from "../services";

const router = Router();

// Children routes
router.get("/children", requireAdmin, async (req, res) => {
  try {
    const children = await storage.getChildren();
    res.json(children);
  } catch (error) {
    res.status(500).send("Failed to fetch children");
  }
});

const adminChildSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  location: z.string().min(1, "Location is required"),
  story: z.string().min(1, "Story is required"),
  needs: z.string().min(1, "Needs description is required"),
  photoUrl: z.string().nullable().optional(),
  monthlyAmount: z.string().regex(/^\d+\.\d{2}$/, "Amount must be in format like '35.00'").optional(),
});

const adminChildUpdateSchema = adminChildSchema.partial();

router.post("/children", requireAdmin, async (req, res) => {
  try {
    const parsed = adminChildSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { firstName, lastName, dateOfBirth, gender, location, story, needs, photoUrl, monthlyAmount } = parsed.data;

    const child = await storage.createChild({
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      location,
      story,
      needs,
      photoUrl: photoUrl || null,
      monthlyAmount: monthlyAmount || "35.00",
    });

    res.status(201).json(child);
  } catch (error) {
    res.status(500).send("Failed to create child");
  }
});

router.put("/children/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid child ID" });
    }

    const parsed = adminChildUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { dateOfBirth, ...rest } = parsed.data;
    const updates: Record<string, unknown> = { ...rest };
    if (dateOfBirth) {
      updates.dateOfBirth = new Date(dateOfBirth);
    }

    const child = await storage.updateChild(id, updates);
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    res.json(child);
  } catch (error) {
    res.status(500).send("Failed to update child");
  }
});

router.delete("/children/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid child ID" });
    }

    const deleted = await storage.deleteChild(id);
    if (!deleted) {
      return res.status(404).json({ error: "Child not found" });
    }

    res.json({ message: "Child deleted successfully" });
  } catch (error: any) {
    if (error.message === "Cannot delete a sponsored child") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to delete child" });
  }
});

// Sponsors routes
router.get("/sponsors", requireAdmin, async (req, res) => {
  try {
    const sponsors = await storage.getSponsors();
    const sponsorsWithoutPasswords = sponsors.map(({ password, ...sponsor }) => sponsor);
    res.json(sponsorsWithoutPasswords);
  } catch (error) {
    res.status(500).send("Failed to fetch sponsors");
  }
});

// Sponsorships routes
router.get("/sponsorships", requireAdmin, async (req, res) => {
  try {
    const sponsorships = await storage.getSponsorships();
    
    const sponsorshipsWithDetails = await Promise.all(
      sponsorships.map(async (sponsorship) => {
        const sponsor = await storage.getUser(sponsorship.sponsorId);
        const child = await storage.getChild(sponsorship.childId);
        const { password, ...sponsorWithoutPassword } = sponsor || {};
        return {
          ...sponsorship,
          sponsor: sponsorWithoutPassword,
          child,
        };
      })
    );
    
    res.json(sponsorshipsWithDetails);
  } catch (error) {
    res.status(500).send("Failed to fetch sponsorships");
  }
});

// Reports routes
router.get("/reports", requireAdmin, async (req, res) => {
  try {
    const reports = await storage.getReports();
    res.json(reports);
  } catch (error) {
    res.status(500).send("Failed to fetch reports");
  }
});

const adminReportSchema = z.object({
  childId: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val) : val).pipe(z.number().int().positive("Invalid child ID")),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  photoUrl: z.string().nullable().optional(),
});

const adminReportUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(10, "Content must be at least 10 characters").optional(),
  photoUrl: z.string().nullable().optional(),
});

router.post("/reports", requireAdmin, async (req, res) => {
  try {
    const parsed = adminReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { childId, title, content, photoUrl } = parsed.data;

    const child = await storage.getChild(childId);
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }

    const report = await storage.createReport({
      childId,
      title,
      content,
      photoUrl: photoUrl || null,
    });

    // Send email notifications to all sponsors of this child
    const sponsorships = await storage.getSponsorships();
    const childSponsorships = sponsorships.filter(s => s.childId === childId && s.status === "active");
    
    for (const sponsorship of childSponsorships) {
      const sponsor = await storage.getUser(sponsorship.sponsorId);
      if (sponsor) {
        sendNewReportEmail(
          sponsor.email,
          sponsor.firstName,
          `${child.firstName} ${child.lastName}`,
          title
        ).catch(err => console.error('Failed to send report notification:', err));
      }
    }

    res.status(201).json(report);
  } catch (error) {
    res.status(500).send("Failed to create report");
  }
});

router.put("/reports/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const parsed = adminReportUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const updated = await storage.updateReport(id, parsed.data);
    
    if (!updated) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update report" });
  }
});

router.delete("/reports/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const deleted = await storage.deleteReport(id);
    if (!deleted) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete report" });
  }
});

// Payments routes
router.get("/payments", requireAdmin, async (req, res) => {
  try {
    const payments = await storage.getPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).send("Failed to fetch payments");
  }
});

// Settings routes
router.get("/settings", requireAdmin, async (req, res) => {
  try {
    const allSettings = await storage.getSettings();
    
    const defaults: Record<string, string> = {
      siteName: "Child Sponsor Hub",
      siteDescription: "Connect with children around the world and make a difference through monthly sponsorships.",
      contactEmail: "support@childsponsorhub.org",
      supportPhone: "+1 (555) 123-4567",
      defaultMonthlyAmount: "35.00",
      currency: "USD",
      welcomeEmailSubject: "Welcome to Child Sponsor Hub!",
      welcomeEmailEnabled: "true",
      reportNotificationEnabled: "true",
      paymentReceiptEnabled: "true",
      paymentFailedAlertEnabled: "true",
      newSponsorNotification: "true",
      paymentFailureNotification: "true",
      lowChildAvailabilityAlert: "true",
      lowChildThreshold: "5",
      weeklyReportEnabled: "false",
    };
    
    res.json({ ...defaults, ...allSettings });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/settings", requireAdmin, async (req, res) => {
  try {
    const settingsData = req.body;
    
    const stringifiedSettings: Record<string, string> = {};
    for (const [key, value] of Object.entries(settingsData)) {
      if (typeof value === "boolean") {
        stringifiedSettings[key] = value.toString();
      } else if (value !== null && value !== undefined) {
        stringifiedSettings[key] = String(value);
      }
    }
    
    await storage.updateSettings(stringifiedSettings);
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Failed to update settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Integration status
router.get("/integrations/status", requireAdmin, async (req, res) => {
  try {
    const stripe = await getUncachableStripeClient();
    const stripeConnected = stripe !== null;
    const stripeMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "live" : "test";
    
    const resendConfigured = !!process.env.RESEND_API_KEY;
    
    res.json({
      stripe: {
        connected: stripeConnected,
        mode: stripeMode,
        webhookActive: stripeConnected,
      },
      email: {
        connected: resendConfigured,
        provider: resendConfigured ? "Resend" : "Console (Development)",
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check integration status" });
  }
});

export default router;
