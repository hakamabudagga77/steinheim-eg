import { afterEach, describe, expect, it } from "vitest";
import { clientIp } from "@/lib/server/rate-limit";

function requestWith(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/test", { headers });
}

afterEach(() => {
  delete process.env.ADMIN_DEV_BYPASS;
});

describe("clientIp", () => {
  it("falls back to anonymous when no address headers exist", () => {
    expect(clientIp(requestWith({}))).toBe("anonymous");
  });

  it("prefers the platform runtime ip over headers", () => {
    const request = requestWith({ "x-forwarded-for": "1.1.1.1" });
    (request as Request & { ip?: string }).ip = "203.0.113.9";
    expect(clientIp(request)).toBe("203.0.113.9");
  });

  it("prefers the Vercel forwarded header over a spoofed x-forwarded-for", () => {
    const request = requestWith({
      "x-vercel-forwarded-for": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1",
    });
    expect(clientIp(request)).toBe("203.0.113.10");
  });

  it("honours x-real-ip when present", () => {
    const request = requestWith({
      "x-real-ip": "203.0.113.11",
      "x-forwarded-for": "198.51.100.1",
    });
    expect(clientIp(request)).toBe("203.0.113.11");
  });

  it("uses the LAST x-forwarded-for hop, not the client-supplied first one", () => {
    const request = requestWith({ "x-forwarded-for": "198.51.100.1, 203.0.113.12" });
    expect(clientIp(request)).toBe("203.0.113.12");
  });

  it("trims whitespace and empty hops", () => {
    const request = requestWith({ "x-forwarded-for": "  , 203.0.113.13 " });
    expect(clientIp(request)).toBe("203.0.113.13");
  });
});
