import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createSessionToken } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

function canAttempt(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const bucket = loginBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    loginBuckets.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (bucket.count >= 10) return false;
  bucket.count += 1;
  return true;
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  if (!canAttempt(request)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const configuredEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD || "";

  if (!configuredEmail || !configuredPassword) {
    return NextResponse.json({ error: "Admin login is not configured." }, { status: 503 });
  }

  const emailOk = email.length > 0 && safeEqual(email, configuredEmail);
  const passwordOk = password.length > 0 && safeEqual(password, configuredPassword);

  if (!emailOk || !passwordOk) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const token = createSessionToken(configuredEmail);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
