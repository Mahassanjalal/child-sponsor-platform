import type { Express, Request, Response } from "express";
import express from "express";
import path from "path";
import fs from "fs/promises";
import fssync from "fs";
import { randomUUID } from "crypto";
import { requireAdmin } from "./auth";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_LABEL = "10mb";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

function ensureUploadsDir() {
  if (!fssync.existsSync(UPLOAD_DIR)) {
    fssync.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function getExtensionFromType(contentType: string, fallbackName?: string) {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };

  if (byType[contentType]) {
    return byType[contentType];
  }

  const ext = fallbackName ? path.extname(fallbackName).replace(".", "") : "";
  return ext.toLowerCase();
}

export function registerUploadRoutes(app: Express): void {
  ensureUploadsDir();
  app.use("/uploads", express.static(UPLOAD_DIR));

  app.post("/api/uploads/request-url", requireAdmin, async (req, res) => {
    try {
      const { name, size, contentType } = req.body || {};

      if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
      }

      if (contentType && !ALLOWED_CONTENT_TYPES.includes(contentType)) {
        return res.status(400).json({
          error: `Invalid file type. Allowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
        });
      }

      if (size && size > MAX_FILE_SIZE) {
        return res.status(400).json({
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        });
      }

      const id = randomUUID();
      const ext = getExtensionFromType(
        contentType || "application/octet-stream",
        name
      );
      const fileName = ext ? `${id}.${ext}` : id;

      res.json({
        uploadURL: `/api/uploads/local/${fileName}`,
        objectPath: `/uploads/${fileName}`,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Local upload URL error:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.put(
    "/api/uploads/local/:fileName",
    requireAdmin,
    express.raw({ type: "*/*", limit: MAX_FILE_SIZE_LABEL }),
    async (req: Request, res: Response) => {
      try {
        const contentType =
          (req.headers["content-type"] as string) ||
          "application/octet-stream";

        if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
          return res.status(400).json({
            error: `Invalid file type. Allowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
          });
        }

        if (!Buffer.isBuffer(req.body)) {
          return res.status(400).json({ error: "Invalid upload payload" });
        }

        if (req.body.length > MAX_FILE_SIZE) {
          return res.status(400).json({
            error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          });
        }

        const fileName = path.basename(req.params.fileName);
        const filePath = path.join(UPLOAD_DIR, fileName);

        await fs.writeFile(filePath, req.body);

        res.json({ objectPath: `/uploads/${fileName}` });
      } catch (error) {
        console.error("Local upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    }
  );
}
