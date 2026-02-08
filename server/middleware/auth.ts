/**
 * Authentication middleware and Passport.js setup
 */
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "../storage";
import { User as SelectUser } from "@shared/schema";
import { sendWelcomeEmail } from "../services/email.service";
import { loginRateLimiter, registerRateLimiter } from "./rate-limit";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

/**
 * Hash a password using scrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compare a supplied password with a stored hash
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Setup Passport.js authentication and session handling
 */
export function setupAuth(app: Express): void {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (err) {
      done(err);
    }
  });

  // Register endpoint
  app.post("/api/register", registerRateLimiter, async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).send("All fields are required");
      }

      if (typeof email !== 'string' || !email.includes('@') || email.length < 5) {
        return res.status(400).send("Please enter a valid email");
      }

      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).send("Password must be at least 6 characters");
      }

      if (typeof firstName !== 'string' || firstName.trim().length < 1) {
        return res.status(400).send("First name is required");
      }

      if (typeof lastName !== 'string' || lastName.trim().length < 1) {
        return res.status(400).send("Last name is required");
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).send("An account with this email already exists");
      }

      const user = await storage.createUser({
        email: email.toLowerCase().trim(),
        password: await hashPassword(password),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: "sponsor",
      });

      // Send welcome email (don't block registration if it fails)
      sendWelcomeEmail(user.email, user.firstName).catch(err => {
        console.error('Failed to send welcome email:', err);
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", loginRateLimiter, (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).send(info?.message || "Invalid credentials");
      }
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.sendStatus(401);
    return;
  }
  next();
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated() || req.user?.role !== "admin") {
    res.sendStatus(403);
    return;
  }
  next();
}
