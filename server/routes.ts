import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin, hashPassword } from "./auth";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sendPasswordResetEmail, sendWelcomeEmail, sendSponsorshipConfirmationEmail, sendNewReportEmail } from "./email";
import { randomBytes } from "crypto";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  registerObjectStorageRoutes(app);

  const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email"),
  });

  const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { email } = parsed.data;
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await storage.createPasswordResetToken(user.id, token, expiresAt);
        await sendPasswordResetEmail(email, token, user.firstName);
      }
      
      res.json({ message: "If an account exists with that email, a reset link has been sent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { token, password } = parsed.data;
      const tokenData = await storage.getPasswordResetToken(token);
      
      if (!tokenData) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      if (tokenData.expiresAt < new Date()) {
        await storage.deletePasswordResetToken(token);
        return res.status(400).json({ error: "Reset token has expired" });
      }
      
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(tokenData.userId, { password: hashedPassword });
      await storage.deletePasswordResetToken(token);
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.get("/api/auth/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const tokenData = await storage.getPasswordResetToken(token);
      
      if (!tokenData || tokenData.expiresAt < new Date()) {
        return res.status(400).json({ valid: false, error: "Invalid or expired token" });
      }
      
      res.json({ valid: true });
    } catch (error) {
      res.status(500).json({ valid: false, error: "Failed to verify token" });
    }
  });

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

  app.get("/api/children/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).send("Invalid child ID");
      }
      const child = await storage.getChild(id);
      if (!child) {
        return res.status(404).send("Child not found");
      }
      res.json(child);
    } catch (error) {
      res.status(500).send("Failed to fetch child");
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

  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const { password, ...userWithoutPassword } = req.user!;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).send("Failed to fetch profile");
    }
  });

  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const { updateProfileSchema } = await import("@shared/schema");
      const parsed = updateProfileSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).send(parsed.error.errors[0]?.message || "Invalid profile data");
      }

      const { firstName, lastName, phone, address, avatarUrl } = parsed.data;
      
      const updates: any = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (address !== undefined) updates.address = address;
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

      const updatedUser = await storage.updateUser(req.user!.id, updates);
      if (!updatedUser) {
        return res.status(404).send("User not found");
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).send("Failed to update profile");
    }
  });

  app.put("/api/profile/password", requireAuth, async (req, res) => {
    try {
      const { changePasswordSchema } = await import("@shared/schema");
      const parsed = changePasswordSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).send(parsed.error.errors[0]?.message || "Invalid password data");
      }

      const { currentPassword, newPassword } = parsed.data;

      const { comparePasswords, hashPassword } = await import("./auth");
      const isValid = await comparePasswords(currentPassword, req.user!.password);
      
      if (!isValid) {
        return res.status(400).send("Current password is incorrect");
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(req.user!.id, { password: hashedPassword });
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).send("Failed to update password");
    }
  });

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      res.status(500).send("Failed to get Stripe key");
    }
  });

  app.post("/api/stripe/create-checkout", requireAuth, async (req, res) => {
    try {
      const { createCheckoutSchema } = await import("@shared/schema");
      const parsed = createCheckoutSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).send(parsed.error.errors[0]?.message || "Invalid checkout data");
      }

      const { childId, paymentType } = parsed.data;
      
      const child = await storage.getChild(childId);
      if (!child) {
        return res.status(404).send("Child not found");
      }
      if (child.isSponsored) {
        return res.status(400).send("This child is already sponsored");
      }

      const stripe = await getUncachableStripeClient();
      let customerId = req.user!.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user!.email,
          name: `${req.user!.firstName} ${req.user!.lastName}`,
          metadata: { userId: req.user!.id.toString() },
        });
        await storage.updateUserStripeInfo(req.user!.id, customer.id);
        customerId = customer.id;
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const amount = Math.round(parseFloat(child.monthlyAmount) * 100);

      let session;
      
      if (paymentType === 'one-time') {
        session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Sponsor ${child.firstName} ${child.lastName}`,
                description: `One-time sponsorship contribution for ${child.firstName}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${baseUrl}/sponsor/success?session_id={CHECKOUT_SESSION_ID}&child_id=${childId}&type=one-time`,
          cancel_url: `${baseUrl}/sponsor/child/${childId}`,
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
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Monthly Sponsorship - ${child.firstName} ${child.lastName}`,
                description: `Monthly sponsorship for ${child.firstName} from ${child.location}`,
              },
              unit_amount: amount,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          }],
          mode: 'subscription',
          success_url: `${baseUrl}/sponsor/success?session_id={CHECKOUT_SESSION_ID}&child_id=${childId}&type=monthly`,
          cancel_url: `${baseUrl}/sponsor/child/${childId}`,
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

  app.post("/api/stripe/confirm-sponsorship", requireAuth, async (req, res) => {
    try {
      const { confirmSponsorshipSchema } = await import("@shared/schema");
      const parsed = confirmSponsorshipSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).send(parsed.error.errors[0]?.message || "Invalid confirmation data");
      }

      const { sessionId } = parsed.data;

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).send("Payment not completed");
      }

      // Security: Extract all values from trusted Stripe session metadata
      const sessionSponsorId = session.metadata?.sponsorId;
      const sessionChildId = session.metadata?.childId;
      const sessionPaymentType = session.metadata?.paymentType;
      
      // Verify session belongs to authenticated user by both metadata and customer
      if (sessionSponsorId !== req.user!.id.toString()) {
        return res.status(403).send("Session does not belong to this user");
      }
      
      // Verify session customer matches user's Stripe customer ID
      if (req.user!.stripeCustomerId && session.customer !== req.user!.stripeCustomerId) {
        return res.status(403).send("Session customer mismatch");
      }
      
      // Validate session has required metadata
      if (!sessionChildId || !sessionPaymentType) {
        return res.status(400).send("Invalid session metadata");
      }
      
      // Validate payment type matches session mode for consistency
      const isSubscription = session.mode === 'subscription';
      const expectedPaymentType = isSubscription ? 'monthly' : 'one-time';
      if (sessionPaymentType !== expectedPaymentType) {
        return res.status(400).send("Payment type mismatch with session mode");
      }

      // Use childId from trusted session metadata, not from request
      const childId = parseInt(sessionChildId);
      const child = await storage.getChild(childId);
      if (!child) {
        return res.status(404).send("Child not found");
      }

      const existingSponsorships = await storage.getSponsorshipsBySponserId(req.user!.id);
      const alreadySponsoring = existingSponsorships.some(s => s.childId === childId);
      
      if (alreadySponsoring) {
        return res.json({ message: "Already sponsoring this child" });
      }

      // Use trusted values from session metadata
      const sponsorship = await storage.createSponsorship({
        sponsorId: req.user!.id,
        childId: childId,
        status: "active",
        monthlyAmount: child.monthlyAmount,
        paymentType: sessionPaymentType,
        stripeSubscriptionId: session.subscription?.toString() || null,
      });

      await storage.updateChildSponsoredStatus(parseInt(childId), true);

      await storage.createPayment({
        sponsorshipId: sponsorship.id,
        amount: child.monthlyAmount,
        status: "completed",
        stripePaymentId: session.payment_intent?.toString() || session.id,
      });

      res.json({ sponsorship });
    } catch (error) {
      console.error("Confirm sponsorship error:", error);
      res.status(500).send("Failed to confirm sponsorship");
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

  app.delete("/api/admin/children/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.delete("/api/admin/reports/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.put("/api/admin/reports/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid report ID" });
      }

      const { title, content, photoUrl } = req.body;
      const updated = await storage.updateReport(id, { title, content, photoUrl });
      
      if (!updated) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  app.post("/api/sponsorships/:id/cancel", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
          const stripe = getUncachableStripeClient();
          if (stripe) {
            await stripe.subscriptions.cancel(sponsorship.stripeSubscriptionId);
          }
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

  return httpServer;
}
