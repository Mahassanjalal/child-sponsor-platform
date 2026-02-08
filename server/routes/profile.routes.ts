import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, comparePasswords, hashPassword } from "../middleware";
import { updateProfileSchema, changePasswordSchema } from "@shared/schema";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).send("Failed to fetch profile");
  }
});

router.put("/", requireAuth, async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
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
      return res.status(404).json({ error: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).send("Failed to update profile");
  }
});

router.put("/password", requireAuth, async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { currentPassword, newPassword } = parsed.data;

    const isValid = await comparePasswords(currentPassword, req.user!.password);
    
    if (!isValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUser(req.user!.id, { password: hashedPassword });
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).send("Failed to update password");
  }
});

router.delete("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    if (req.user!.role === "admin") {
      return res.status(400).json({ 
        error: "Admin accounts cannot be deleted through this endpoint" 
      });
    }
    
    const deleted = await storage.deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error during account deletion:", err);
      }
    });
    
    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    if (error.message?.includes("active sponsorships")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
