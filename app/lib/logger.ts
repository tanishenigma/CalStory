/* ────────────────────────────────────────────────────────────
 * Level-based dev-aware logger.
 *
 * Safe to import from BOTH server and client code — no Node-only
 * dependencies (see logger.server.ts for the file-writing helper).
 *
 * • `debug` / `info` / `warn` are silent in production builds.
 * • `error` always fires — keep real failures visible in prod.
 *
 * Next.js compiler.removeConsole strips console.* in production
 * regardless, so these dev-only branches never ship to the client.
 * ──────────────────────────────────────────────────────────── */

const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
