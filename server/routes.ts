import type { Express } from "express";
import { type Server } from "http";
import { setupAuth } from "./middleware";
import { registerUploadRoutes } from "./utils";
import {
  authRoutes,
  childrenRoutes,
  sponsorshipsRoutes,
  reportsRoutes,
  paymentsRoutes,
  profileRoutes,
  stripeRoutes,
  adminRoutes,
  contactRoutes,
} from "./routes/index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Register upload routes
  registerUploadRoutes(app);

  // Register modular routes
  app.use("/api/auth", authRoutes);
  app.use("/api/children", childrenRoutes);
  app.use("/api/sponsorships", sponsorshipsRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/stripe", stripeRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/contact", contactRoutes);

  return httpServer;
}
