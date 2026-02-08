import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("sponsor"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  address: text("address"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const children = pgTable("children", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  location: text("location").notNull(),
  story: text("story").notNull(),
  needs: text("needs").notNull(),
  photoUrl: text("photo_url"),
  isSponsored: boolean("is_sponsored").default(false).notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull().default("35.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sponsorships = pgTable("sponsorships", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sponsorId: integer("sponsor_id").notNull().references(() => users.id),
  childId: integer("child_id").notNull().references(() => children.id),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: text("payment_type").notNull().default("monthly"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const reports = pgTable("reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  childId: integer("child_id").notNull().references(() => children.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  photoUrl: text("photo_url"),
  reportDate: timestamp("report_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sponsorshipId: integer("sponsorship_id").notNull().references(() => sponsorships.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  stripePaymentId: text("stripe_payment_id"),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings table for admin configuration
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull().default("general"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sponsorships: many(sponsorships),
}));

export const childrenRelations = relations(children, ({ many }) => ({
  sponsorships: many(sponsorships),
  reports: many(reports),
}));

export const sponsorshipsRelations = relations(sponsorships, ({ one, many }) => ({
  sponsor: one(users, {
    fields: [sponsorships.sponsorId],
    references: [users.id],
  }),
  child: one(children, {
    fields: [sponsorships.childId],
    references: [children.id],
  }),
  payments: many(payments),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  child: one(children, {
    fields: [reports.childId],
    references: [children.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  sponsorship: one(sponsorships, {
    fields: [payments.sponsorshipId],
    references: [sponsorships.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const createCheckoutSchema = z.object({
  childId: z.number().int().positive("Invalid child ID"),
  paymentType: z.enum(["monthly", "one-time"], { 
    errorMap: () => ({ message: "Payment type must be 'monthly' or 'one-time'" }) 
  }),
});

export const confirmSponsorshipSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
  isSponsored: true,
});

export const insertSponsorshipSchema = createInsertSchema(sponsorships).omit({
  id: true,
  startDate: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  reportDate: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  paymentDate: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Sponsorship = typeof sponsorships.$inferSelect;
export type InsertSponsorship = z.infer<typeof insertSponsorshipSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Setting = typeof settings.$inferSelect;

// Settings schemas for validation
export const settingsSchema = z.object({
  // General settings
  siteName: z.string().min(1).optional(),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email().optional(),
  supportPhone: z.string().optional(),
  defaultMonthlyAmount: z.string().optional(),
  currency: z.string().optional(),
  // Email settings
  welcomeEmailSubject: z.string().optional(),
  welcomeEmailEnabled: z.boolean().optional(),
  reportNotificationEnabled: z.boolean().optional(),
  paymentReceiptEnabled: z.boolean().optional(),
  paymentFailedAlertEnabled: z.boolean().optional(),
  // Notification settings
  newSponsorNotification: z.boolean().optional(),
  paymentFailureNotification: z.boolean().optional(),
  lowChildAvailabilityAlert: z.boolean().optional(),
  lowChildThreshold: z.string().optional(),
  weeklyReportEnabled: z.boolean().optional(),
});
