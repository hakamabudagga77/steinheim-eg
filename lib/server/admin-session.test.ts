import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  createSessionToken,
  isAdminRequest,
  isCronRequest,
  verifySessionToken,
} from "@/lib/server/admin-session";

function requestWith(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/test", { headers });
}

function cookieHeader(token: string): Record<string, string> {
  return { cookie: `steinheim_admin_session=${encodeURIComponent(token)}` };
}

afterEach(() => {
  delete process.env.SESSION_SECRET;
  delete process.env.ADMIN_DEV_BYPASS;
  delete process.env.CRON_SECRET;
});

describe("verifySessionToken", () => {
  it("rejects a missing or malformed token", () => {
    process.env.SESSION_SECRET = "test-secret";
    expect(verifySessionToken(undefined)).toBe(false);
    expect(verifySessionToken("no-separator")).toBe(false);
    expect(verifySessionToken("a.b")).toBe(false);
  });

  it("accepts a freshly issued token", () => {
    process.env.SESSION_SECRET = "test-secret";
    const token = createSessionToken("admin@example.com");
    expect(verifySessionToken(token)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    process.env.SESSION_SECRET = "test-secret";
    const token = createSessionToken("admin@example.com");
    const [encoded] = token.split(".");
    expect(verifySessionToken(`${encoded}.deadbeef`)).toBe(false);
  });

  it("rejects an expired token", () => {
    process.env.SESSION_SECRET = "test-secret";
    const encoded = Buffer.from(`admin@example.com.${Date.now() - 60_000}`).toString("base64url");
    const signature = createHmac("sha256", "test-secret").update(encoded).digest("hex");
    expect(verifySessionToken(`${encoded}.${signature}`)).toBe(false);
  });
});

describe("isAdminRequest", () => {
  it("denies anonymous requests without the dev bypass", () => {
    process.env.SESSION_SECRET = "test-secret";
    expect(isAdminRequest(requestWith({}))).toBe(false);
  });

  it("allows a valid session cookie", () => {
    process.env.SESSION_SECRET = "test-secret";
    const token = createSessionToken("admin@example.com");
    expect(isAdminRequest(requestWith(cookieHeader(token)))).toBe(true);
  });

  it("rejects an invalid session cookie", () => {
    process.env.SESSION_SECRET = "test-secret";
    expect(isAdminRequest(requestWith(cookieHeader("not-a-token")))).toBe(false);
  });

  it("opens only when the explicit dev bypass flag is set", () => {
    process.env.ADMIN_DEV_BYPASS = "1";
    expect(isAdminRequest(requestWith({}))).toBe(true);
  });

  it("stays closed in non-production environments without the flag", () => {
    delete process.env.ADMIN_DEV_BYPASS;
    expect(isAdminRequest(requestWith({}))).toBe(false);
  });
});

describe("isCronRequest", () => {
  it("denies anonymous requests without the dev bypass", () => {
    process.env.SESSION_SECRET = "test-secret";
    expect(isCronRequest(requestWith({}))).toBe(false);
  });

  it("accepts the configured CRON_SECRET bearer header", () => {
    process.env.CRON_SECRET = "cron-secret";
    expect(isCronRequest(requestWith({ authorization: "Bearer cron-secret" }))).toBe(true);
  });

  it("rejects a wrong bearer header", () => {
    process.env.CRON_SECRET = "cron-secret";
    expect(isCronRequest(requestWith({ authorization: "Bearer wrong" }))).toBe(false);
  });

  it("accepts a valid admin session as an alternative", () => {
    process.env.SESSION_SECRET = "test-secret";
    const token = createSessionToken("admin@example.com");
    expect(isCronRequest(requestWith(cookieHeader(token)))).toBe(true);
  });
});
