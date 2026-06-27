import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm" as const;
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

const ENC_PREFIX = "enc:";

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
    [
      iv.toString("hex"),
      authTag.toString("hex"),
      encrypted.toString("hex"),
    ].join(":")
  );
}

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
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}
