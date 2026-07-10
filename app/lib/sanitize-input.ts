/**
 * sanitize-input.ts — SERVER ONLY
 *
 * Utility functions for sanitizing user input before it reaches LLM
 * endpoints. Provides defense-in-depth against prompt injection by
 * stripping control characters and enforcing length limits.
 *
 * @security These functions are called from API route handlers before
 * user messages are forwarded to the Gemini API. They do NOT replace
 * the system prompt's own guardrails — they add a pre-processing layer
 * that reduces the attack surface.
 */

/** Maximum length for a single user message (characters). */
const MAX_MESSAGE_LENGTH = 4000;

/** Maximum length for a single conversation history entry. */
const MAX_HISTORY_ENTRY_LENGTH = 8000;

/** Maximum number of conversation history entries forwarded to the LLM. */
const MAX_HISTORY_ENTRIES = 20;

/**
 * Strip control characters (U+0000–U+001F except \n \r \t, plus U+007F–U+009F)
 * that can be used to smuggle invisible prompt-injection payloads.
 */
function stripControlChars(input: string): string {
  // Allow \n (0x0A), \r (0x0D), \t (0x09) — everything else in C0/C1 is stripped.
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
}

/**
 * Sanitize a single user message before it reaches the LLM.
 *
 * - Trims whitespace
 * - Strips invisible control characters
 * - Enforces a maximum length
 *
 * Returns the sanitized string, or null if the result is empty.
 */
export function sanitizeMessage(raw: string): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = stripControlChars(raw.trim()).slice(0, MAX_MESSAGE_LENGTH);
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Sanitize a conversation history array before forwarding to the LLM.
 *
 * - Limits the number of entries
 * - Strips control characters from each entry
 * - Enforces per-entry length limits
 * - Filters out entries with invalid roles
 */
export function sanitizeHistory(
  history: Array<{ role: string; content: string }> | undefined,
): Array<{ role: "user" | "model"; content: string }> {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-MAX_HISTORY_ENTRIES)
    .filter(
      (m): m is { role: "user" | "model"; content: string } =>
        (m.role === "user" || m.role === "model") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({
      role: m.role,
      content: stripControlChars(m.content.trim()).slice(
        0,
        MAX_HISTORY_ENTRY_LENGTH,
      ),
    }))
    .filter((m) => m.content.length > 0);
}
