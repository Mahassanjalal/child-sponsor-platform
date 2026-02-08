import { Router } from "express";
import { z } from "zod";
import { randomBytes } from "crypto";
import { storage } from "../storage";
import { hashPassword } from "../middleware";
import { sendPasswordResetEmail } from "../services";
import { passwordResetRateLimiter } from "../middleware";

const router = Router();

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

router.post("/forgot-password", passwordResetRateLimiter, async (req, res) => {
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

router.post("/reset-password", async (req, res) => {
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

router.get("/verify-reset-token/:token", async (req, res) => {
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

export default router;
