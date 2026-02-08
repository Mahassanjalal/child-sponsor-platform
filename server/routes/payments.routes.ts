import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware";

const router = Router();

router.get("/my", requireAuth, async (req, res) => {
  try {
    const payments = await storage.getPaymentsBySponsorId(req.user!.id);
    res.json(payments);
  } catch (error) {
    res.status(500).send("Failed to fetch payments");
  }
});

export default router;
