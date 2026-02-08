import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware";

const router = Router();

router.get("/featured", async (req, res) => {
  try {
    const children = await storage.getFeaturedChildren();
    res.json(children);
  } catch (error) {
    res.status(500).send("Failed to fetch featured children");
  }
});

router.get("/available", requireAuth, async (req, res) => {
  try {
    const children = await storage.getAvailableChildren();
    res.json(children);
  } catch (error) {
    res.status(500).send("Failed to fetch available children");
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid child ID" });
    }
    const child = await storage.getChild(id);
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    res.json(child);
  } catch (error) {
    res.status(500).send("Failed to fetch child");
  }
});

export default router;
