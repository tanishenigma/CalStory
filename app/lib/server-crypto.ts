/**
 * server-crypto.ts — SERVER ONLY
 *
 * AES-256-GCM symmetric encryption for Gemini API keys stored in Firestore.
 *
 * Why AES-256-GCM?
 *   • AES-256 is the industry-standard symmetric cipher — the same one
 *     banks and governments use for data at rest.
 *   • GCM (Galois/Counter Mode) provides both encryption AND authentication
 *     (via an auth tag). If the ciphertext is tampered with even one bit,
 *     decryption throws — making any Firestore-side mutation detectable.
 *   • The IV (initialisation vector) is random per encryption call, so
 *     encrypting the same key twice produces different ciphertext — no
 *     fingerprinting via pattern matching.
 *
 * Why NOT hashing (bcrypt / SHA)?
 *   Hashing is one-way. We need to recover the original key to pass it
 *   to the Gemini SDK, so hashing is the wrong primitive here.
 *
 * Secret management:
 *   The encryption key lives ONLY in GEMINI_KEY_ENCRYPTION_SECRET (env var).
 *   It is never stored in Firestore, never logged, and never sent to the
 *   client. If the env var is missing or malformed, all encrypt/decrypt
 *   calls throw — the system refuses to operate rather than silently
 *   falling back to plaintext.
 *
 * Ciphertext format stored in Firestore:
 *   enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 *
 *   The "enc:" prefix lets us detect already-encrypted values vs any
 *   plaintext key a user may have saved before this was deployed, so
 *   we can handle migration gracefully.
 *
 * Node.js `crypto` is built-in — no additional packages required.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm" as const;
/** AES-256 requires a 32-byte key → stored as 64 hex chars in env. */
const EXPECTED_SECRET_HEX_LENGTH = 64;

function getEncryptionKey(): Buffer {
  const secret = process.env.GEMINI_KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length !== EXPECTED_SECRET_HEX_LENGTH) {
    throw new Error(
      "GEMINI_KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes). " +
        "Generate one with:\n" +
        "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n" +
        "Then add it to your .env file as GEMINI_KEY_ENCRYPTION_SECRET=<value>",
    );
  }
  return Buffer.from(secret, "hex");
}

/** Prefix that marks an encrypted value — lets us detect plaintext migrations. */
const ENC_PREFIX = "enc:";

/**
 * Encrypt a Gemini API key for storage in Firestore.
 * Returns a string in the format `enc:<iv>:<authTag>:<ciphertext>` (all hex).
 */
export function encryptApiKey(plaintext: string): string {
  const key = getEncryptionKey();
  // 96-bit (12-byte) random IV — the GCM recommended size
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes by default
  return (
    ENC_PREFIX +
    [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":")
  );
}

/**
 * Decrypt a stored ciphertext back to the original API key.
 * Throws if the ciphertext is malformed OR if the auth tag fails
 * (i.e. the data was tampered with in Firestore).
 */
export function decryptApiKey(stored: string): string {
  if (!stored.startsWith(ENC_PREFIX)) {
    throw new Error(
      "Value does not appear to be encrypted (missing enc: prefix).",
    );
  }
  const key = getEncryptionKey();
  const body = stored.slice(ENC_PREFIX.length);
  const parts = body.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted key — expected enc:iv:tag:ciphertext");
  }
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  // If Firestore data was tampered with, this throws — that's intentional.
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Returns true if `value` was produced by encryptApiKey().
 * Used to detect plaintext keys saved before encryption was added
 * so we can prompt the user to re-save.
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}
