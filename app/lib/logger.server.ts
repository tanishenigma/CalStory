import fs from "fs/promises";
import path from "path";

/* ────────────────────────────────────────────────────────────
 * Server-only API log file writer.
 *
 * Used by external proxy modules (e.g. FatSecret) to record
 * every upstream API call to `api.log` for audit / debugging.
 * Lives in logger.server.ts so it never gets pulled into the
 * client bundle — the `fs/promises` import is the actual guard
 * (webpack will throw if a client component tries to import it).
 *
 * Server-only modules should be imported ONLY from API routes
 * and server-side data layers.
 * ──────────────────────────────────────────────────────────── */
export async function logApiRequest(
  endpoint: string,
  params: any,
  responseStatus: number,
) {
  try {
    const logFilePath = path.join(process.cwd(), "api.log");
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ENDPOINT: ${endpoint} | PARAMS: ${JSON.stringify(params)} | STATUS: ${responseStatus}\n`;

    await fs.appendFile(logFilePath, logEntry, "utf8");
  } catch (error) {
    console.error("Failed to write to api.log:", error);
  }
}
