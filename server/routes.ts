import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get("/api/children/featured", async (req, res) => {
    try {
      const children = await storage.getFeaturedChildren();
      res.json(children);
    } catch (error) {
      res.status(500).send("Failed to fetch featured children");
    }
  });

  app.get("/api/children/available", requireAuth, async (req, res) => {
    try {
      const children = await storage.getAvailableChildren();
      res.json(children);
    } catch (error) {
      res.status(500).send("Failed to fetch available children");
    }
  });

  app.get("/api/sponsorships/my", requireAuth, async (req, res) => {
    try {
      const sponsorships = await storage.getSponsorshipsBySponserId(req.user!.id);
      
      const sponsorshipsWithDetails = await Promise.all(
        sponsorships.map(async (sponsorship) => {
          const child = await storage.getChild(sponsorship.childId);
          const allPayments = await storage.getPaymentsBySponsorId(req.user!.id);
          const sponsorshipPayments = allPayments.filter(p => p.sponsorshipId === sponsorship.id);
          return {
            ...sponsorship,
            child,
            payments: sponsorshipPayments,
          };
        })
      );
      
      res.json(sponsorshipsWithDetails);
    } catch (error) {
      res.status(500).send("Failed to fetch sponsorships");
    }
  });

  app.get("/api/reports/my", requireAuth, async (req, res) => {
    try {
      const reports = await storage.getReportsBySponsorId(req.user!.id);
      res.json(reports);
    } catch (error) {
      res.status(500).send("Failed to fetch reports");
    }
  });

  app.get("/api/payments/my", requireAuth, async (req, res) => {
    try {
      const payments = await storage.getPaymentsBySponsorId(req.user!.id);
      res.json(payments);
    } catch (error) {
      res.status(500).send("Failed to fetch payments");
    }
  });

  app.post("/api/sponsorships", requireAuth, async (req, res) => {
    try {
      const { childId, monthlyAmount } = req.body;
      
      const child = await storage.getChild(childId);
      if (!child) {
        return res.status(404).send("Child not found");
      }
      if (child.isSponsored) {
        return res.status(400).send("This child is already sponsored");
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

  app.get("/api/admin/children", requireAdmin, async (req, res) => {
    try {
      const children = await storage.getChildren();
      res.json(children);
    } catch (error) {
      res.status(500).send("Failed to fetch children");
    }
  });

  app.post("/api/admin/children", requireAdmin, async (req, res) => {
    try {
      const { firstName, lastName, dateOfBirth, gender, location, story, needs, photoUrl, monthlyAmount } = req.body;
      
      if (!firstName || !lastName || !dateOfBirth || !gender || !location || !story || !needs) {
        return res.status(400).send("All required fields must be provided");
      }

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

  app.put("/api/admin/children/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const child = await storage.updateChild(id, req.body);
      if (!child) {
        return res.status(404).send("Child not found");
      }
      res.json(child);
    } catch (error) {
      res.status(500).send("Failed to update child");
    }
  });

  app.get("/api/admin/sponsors", requireAdmin, async (req, res) => {
    try {
      const sponsors = await storage.getSponsors();
      const sponsorsWithoutPasswords = sponsors.map(({ password, ...sponsor }) => sponsor);
      res.json(sponsorsWithoutPasswords);
    } catch (error) {
      res.status(500).send("Failed to fetch sponsors");
    }
  });

  app.get("/api/admin/sponsorships", requireAdmin, async (req, res) => {
    try {
      const sponsorships = await storage.getSponsorships();
      
      const sponsorshipsWithDetails = await Promise.all(
        sponsorships.map(async (sponsorship) => {
          const sponsor = await storage.getUser(sponsorship.sponsorId);
          const child = await storage.getChild(sponsorship.childId);
          const sponsorWithoutPassword = sponsor ? (({ password, ...rest }) => rest)(sponsor) : null;
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

  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).send("Failed to fetch reports");
    }
  });

  app.post("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      const { childId, title, content, photoUrl } = req.body;
      
      if (!childId || !title || !content) {
        return res.status(400).send("Child, title, and content are required");
      }

      const child = await storage.getChild(parseInt(childId));
      if (!child) {
        return res.status(404).send("Child not found");
      }

      const report = await storage.createReport({
        childId: parseInt(childId),
        title,
        content,
        photoUrl: photoUrl || null,
      });

      res.status(201).json(report);
    } catch (error) {
      res.status(500).send("Failed to create report");
    }
  });

  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).send("Failed to fetch payments");
    }
  });

  return httpServer;
}
