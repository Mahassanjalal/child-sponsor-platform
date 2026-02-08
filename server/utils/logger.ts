/**
 * Logging utility
 */

/**
 * Log a formatted message with timestamp
 */
export function log(message: string, source = "express"): void {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}
