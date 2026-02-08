/**
 * Static file serving for production builds
 */
import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Serve static files from the production build directory
 */
export function serveStatic(app: Express): void {
  const distPath = path.resolve(__dirname, "..", "public");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html for SPA routing
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
