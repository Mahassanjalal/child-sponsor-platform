import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware";

const router = Router();

router.get("/my", requireAuth, async (req, res) => {
  try {
    const reports = await storage.getReportsBySponsorId(req.user!.id);
    res.json(reports);
  } catch (error) {
    res.status(500).send("Failed to fetch reports");
  }
});

router.get("/my/detailed", requireAuth, async (req, res) => {
  try {
    const reports = await storage.getReportsBySponsorId(req.user!.id);
    const sponsorships = await storage.getSponsorshipsBySponserId(req.user!.id);
    
    const { password, ...sponsorWithoutPassword } = req.user!;
    
    const detailedReports = await Promise.all(
      reports.map(async (report) => {
        const child = await storage.getChild(report.childId);
        return {
          ...report,
          child,
          sponsor: sponsorWithoutPassword,
        };
      })
    );
    
    res.json(detailedReports);
  } catch (error) {
    res.status(500).send("Failed to fetch detailed reports");
  }
});

router.get("/:reportId/detailed", requireAuth, async (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId as string);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }
    
    const allReports = await storage.getReports();
    const report = allReports.find(r => r.id === reportId);
    
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    
    if (req.user!.role !== "admin") {
      const sponsorships = await storage.getSponsorshipsBySponserId(req.user!.id);
      const hasAccess = sponsorships.some(s => s.childId === report.childId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Not authorized to view this report" });
      }
    }
    
    const child = await storage.getChild(report.childId);
    const { password, ...sponsorWithoutPassword } = req.user!;
    
    res.json({
      ...report,
      child,
      sponsor: sponsorWithoutPassword,
    });
  } catch (error) {
    res.status(500).send("Failed to fetch report details");
  }
});

router.get("/child/:childId", requireAuth, async (req, res) => {
  try {
    const childId = parseInt(req.params.childId as string);
    if (isNaN(childId)) {
      return res.status(400).json({ error: "Invalid child ID" });
    }
    
    if (req.user!.role !== "admin") {
      const sponsorships = await storage.getSponsorshipsBySponserId(req.user!.id);
      const hasAccess = sponsorships.some(s => s.childId === childId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Not authorized to view reports for this child" });
      }
    }
    
    const reports = await storage.getReportsByChildId(childId);
    res.json(reports);
  } catch (error) {
    res.status(500).send("Failed to fetch reports");
  }
});

export default router;
