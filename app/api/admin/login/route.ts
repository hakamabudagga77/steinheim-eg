import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { ADMIN_SESSION_COOKIE, createSessionToken } from "@/lib/server/admin-session";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  if (!(await checkRateLimit(request, "admin-login", 10, 15 * 60))) {
    // Hitting the limit means sustained failed attempts from one IP — a real
    // brute-force signal worth surfacing in Sentry, not just the rate-limit
    // response the attacker sees.
    Sentry.captureMessage("Admin login rate limit tripped", {
      level: "warning",
      tags: { source: "admin-login" },
      extra: { ip },
    });
    console.warn(`[admin-login] rate limit tripped ip=${ip}`);
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
    // Structured, greppable audit line in the server logs (Vercel/host log
    // drain). Records the attempt without ever logging the submitted password.
    console.warn(
      `[admin-login] failed attempt ip=${ip} email=${email || "(empty)"} at=${new Date().toISOString()}`
    );
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
