import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "steinheim_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not configured");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(email: string): string {
  const payload = `${email}.${Date.now() + SESSION_TTL_MS}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const [encoded, providedSignature] = token.split(".");
    if (!encoded || !providedSignature) return false;

    const expectedSignature = sign(encoded);
    const a = Buffer.from(providedSignature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    const expiresAt = Number(payload.split(".").pop());
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}
