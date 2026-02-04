import {
  users,
  children,
  sponsorships,
  reports,
  payments,
  passwordResetTokens,
  type User,
  type InsertUser,
  type Child,
  type InsertChild,
  type Sponsorship,
  type InsertSponsorship,
  type Report,
  type InsertReport,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserStripeInfo(id: number, stripeCustomerId: string): Promise<User | undefined>;
  getSponsors(): Promise<User[]>;
  
  getChildren(): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  getAvailableChildren(): Promise<Child[]>;
  getFeaturedChildren(): Promise<Child[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<InsertChild>): Promise<Child | undefined>;
  updateChildSponsoredStatus(id: number, isSponsored: boolean): Promise<void>;
  
  getSponsorships(): Promise<Sponsorship[]>;
  getSponsorshipsBySponserId(sponsorId: number): Promise<Sponsorship[]>;
  getSponsorship(id: number): Promise<Sponsorship | undefined>;
  createSponsorship(sponsorship: InsertSponsorship): Promise<Sponsorship>;
  updateSponsorship(id: number, sponsorship: Partial<InsertSponsorship>): Promise<Sponsorship | undefined>;
  
  getReports(): Promise<Report[]>;
  getReportsByChildId(childId: number): Promise<Report[]>;
  getReportsBySponsorId(sponsorId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  getPayments(): Promise<Payment[]>;
  getPaymentsBySponsorId(sponsorId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  deleteChild(id: number): Promise<boolean>;
  deleteReport(id: number): Promise<boolean>;
  updateReport(id: number, updates: Partial<InsertReport>): Promise<Report | undefined>;
  
  createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ userId: number; expiresAt: Date } | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  
  cancelSponsorship(id: number): Promise<Sponsorship | undefined>;
  getSponsorshipByStripeSubscriptionId(subscriptionId: string): Promise<Sponsorship | undefined>;
  deleteUser(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async updateUserStripeInfo(id: number, stripeCustomerId: string): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ stripeCustomerId }).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async getSponsors(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "sponsor")).orderBy(desc(users.createdAt));
  }

  async getChildren(): Promise<Child[]> {
    return db.select().from(children).orderBy(desc(children.createdAt));
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child || undefined;
  }

  async getAvailableChildren(): Promise<Child[]> {
    return db.select().from(children).where(eq(children.isSponsored, false)).orderBy(desc(children.createdAt));
  }

  async getFeaturedChildren(): Promise<Child[]> {
    return db.select().from(children).where(eq(children.isSponsored, false)).limit(6);
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db.insert(children).values(child).returning();
    return newChild;
  }

  async updateChild(id: number, child: Partial<InsertChild>): Promise<Child | undefined> {
    const [updated] = await db.update(children).set(child).where(eq(children.id, id)).returning();
    return updated || undefined;
  }

  async updateChildSponsoredStatus(id: number, isSponsored: boolean): Promise<void> {
    await db.update(children).set({ isSponsored }).where(eq(children.id, id));
  }

  async getSponsorships(): Promise<Sponsorship[]> {
    return db.select().from(sponsorships).orderBy(desc(sponsorships.startDate));
  }

  async getSponsorshipsBySponserId(sponsorId: number): Promise<Sponsorship[]> {
    return db.select().from(sponsorships).where(eq(sponsorships.sponsorId, sponsorId));
  }

  async getSponsorship(id: number): Promise<Sponsorship | undefined> {
    const [sponsorship] = await db.select().from(sponsorships).where(eq(sponsorships.id, id));
    return sponsorship || undefined;
  }

  async createSponsorship(sponsorship: InsertSponsorship): Promise<Sponsorship> {
    const [newSponsorship] = await db.insert(sponsorships).values(sponsorship).returning();
    return newSponsorship;
  }

  async updateSponsorship(id: number, sponsorship: Partial<InsertSponsorship>): Promise<Sponsorship | undefined> {
    const [updated] = await db.update(sponsorships).set(sponsorship).where(eq(sponsorships.id, id)).returning();
    return updated || undefined;
  }

  async getReports(): Promise<Report[]> {
    return db.select().from(reports).orderBy(desc(reports.reportDate));
  }

  async getReportsByChildId(childId: number): Promise<Report[]> {
    return db.select().from(reports).where(eq(reports.childId, childId)).orderBy(desc(reports.reportDate));
  }

  async getReportsBySponsorId(sponsorId: number): Promise<Report[]> {
    const sponsorSponsorships = await this.getSponsorshipsBySponserId(sponsorId);
    const childIds = sponsorSponsorships.map(s => s.childId);
    if (childIds.length === 0) return [];
    
    const allReports: Report[] = [];
    for (const childId of childIds) {
      const childReports = await this.getReportsByChildId(childId);
      allReports.push(...childReports);
    }
    return allReports.sort((a, b) => 
      new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
    );
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getPayments(): Promise<Payment[]> {
    return db.select().from(payments).orderBy(desc(payments.paymentDate));
  }

  async getPaymentsBySponsorId(sponsorId: number): Promise<Payment[]> {
    const sponsorSponsorships = await this.getSponsorshipsBySponserId(sponsorId);
    const sponsorshipIds = sponsorSponsorships.map(s => s.id);
    if (sponsorshipIds.length === 0) return [];
    
    const allPayments: Payment[] = [];
    for (const sponsorshipId of sponsorshipIds) {
      const sponsorshipPayments = await db.select().from(payments)
        .where(eq(payments.sponsorshipId, sponsorshipId))
        .orderBy(desc(payments.paymentDate));
      allPayments.push(...sponsorshipPayments);
    }
    return allPayments.sort((a, b) => 
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async deleteChild(id: number): Promise<boolean> {
    const child = await this.getChild(id);
    if (!child) return false;
    
    if (child.isSponsored) {
      throw new Error("Cannot delete a sponsored child");
    }
    
    await db.delete(reports).where(eq(reports.childId, id));
    await db.delete(children).where(eq(children.id, id));
    return true;
  }

  async deleteReport(id: number): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id)).returning();
    return result.length > 0;
  }

  async updateReport(id: number, updates: Partial<InsertReport>): Promise<Report | undefined> {
    const [updated] = await db.update(reports).set(updates).where(eq(reports.id, id)).returning();
    return updated || undefined;
  }

  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
  }

  async getPasswordResetToken(token: string): Promise<{ userId: number; expiresAt: Date } | undefined> {
    const [result] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    if (!result) return undefined;
    return { userId: result.userId, expiresAt: result.expiresAt };
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, new Date()));
  }

  async cancelSponsorship(id: number): Promise<Sponsorship | undefined> {
    const [updated] = await db.update(sponsorships)
      .set({ status: "cancelled", endDate: new Date() })
      .where(eq(sponsorships.id, id))
      .returning();
    
    if (updated) {
      await this.updateChildSponsoredStatus(updated.childId, false);
    }
    
    return updated || undefined;
  }

  async getSponsorshipByStripeSubscriptionId(subscriptionId: string): Promise<Sponsorship | undefined> {
    const [sponsorship] = await db.select().from(sponsorships)
      .where(eq(sponsorships.stripeSubscriptionId, subscriptionId));
    return sponsorship || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;
    
    const activeSponsorships = await db.select().from(sponsorships)
      .where(and(eq(sponsorships.sponsorId, id), eq(sponsorships.status, "active")));
    
    if (activeSponsorships.length > 0) {
      throw new Error("Cannot delete account with active sponsorships. Please cancel all sponsorships first.");
    }
    
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
    
    const userSponsorships = await db.select({ id: sponsorships.id }).from(sponsorships)
      .where(eq(sponsorships.sponsorId, id));
    
    if (userSponsorships.length > 0) {
      const sponsorshipIds = userSponsorships.map(s => s.id);
      await db.delete(payments).where(inArray(payments.sponsorshipId, sponsorshipIds));
    }
    
    await db.delete(sponsorships).where(eq(sponsorships.sponsorId, id));
    await db.delete(users).where(eq(users.id, id));
    
    return true;
  }
}

export const storage = new DatabaseStorage();
