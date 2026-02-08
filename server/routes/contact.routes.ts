import { Router } from "express";
import { z } from "zod";
import { sendContactEmail } from "../services";
import { contactRateLimiter } from "../middleware";

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

router.post("/", contactRateLimiter, async (req, res) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { name, email, subject, message } = parsed.data;
    
    const sent = await sendContactEmail(name, email, subject, message);
    
    if (!sent) {
      return res.status(500).json({ error: "Failed to send message. Please try again later." });
    }

    res.json({ message: "Your message has been sent successfully. We'll get back to you soon!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
