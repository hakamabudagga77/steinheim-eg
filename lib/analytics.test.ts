import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  toGaItem,
  trackAddToCart,
  trackBeginCheckout,
  trackViewCart,
  trackViewItem,
} from "@/lib/analytics";

type Call = [string, string, Record<string, unknown>];

function calls(): Call[] {
  return (window.gtag as unknown as { mock: { calls: Call[] } }).mock.calls;
}

describe("analytics", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis as unknown as Window & typeof globalThis);
    window.gtag = vi.fn();
  });

  afterEach(() => {
    delete window.gtag;
    vi.unstubAllGlobals();
  });

  it("resolves a cart line to a GA4 item using the Shopify model number as id", () => {
    const item = toGaItem({ slug: "joy-basin-mixer", finish: "chrome", quantity: 2 });
    expect(item).toMatchObject({
      item_id: "STM-60-M500-001",
      item_brand: "Steinheim",
      quantity: 2,
    });
    expect(item?.item_name).toContain("Basin Mixer");
  });

  it("prefers the live Shopify price when one is supplied", () => {
    const fallback = toGaItem({ slug: "joy-basin-mixer", finish: "chrome", quantity: 1 });
    const live = toGaItem({ slug: "joy-basin-mixer", finish: "chrome", quantity: 1 }, 9999);
    expect(live?.price).toBe(9999);
    expect(fallback?.price).not.toBe(9999);
  });

  it("returns null for an unknown product instead of throwing", () => {
    expect(toGaItem({ slug: "does-not-exist", finish: "chrome", quantity: 1 })).toBeNull();
  });

  it("sends add_to_cart with currency and a computed value", () => {
    trackAddToCart({ slug: "joy-basin-mixer", finish: "chrome", quantity: 2 }, 100);
    const [event, name, payload] = calls()[0];
    expect(event).toBe("event");
    expect(name).toBe("add_to_cart");
    expect(payload.currency).toBe("EGP");
    expect(payload.value).toBe(200);
  });

  it("tags begin_checkout with the channel so Shopify and WhatsApp can be split", () => {
    const lines = [{ slug: "joy-basin-mixer", finish: "chrome", quantity: 1 }];
    trackBeginCheckout(lines, "whatsapp");
    expect(calls()[0][2].checkout_channel).toBe("whatsapp");

    trackBeginCheckout(lines, "shopify");
    expect(calls()[1][2].checkout_channel).toBe("shopify");
  });

  it("drops unresolvable lines from view_cart rather than sending broken items", () => {
    trackViewCart([
      { slug: "joy-basin-mixer", finish: "chrome", quantity: 1 },
      { slug: "does-not-exist", finish: "chrome", quantity: 1 },
    ]);
    expect((calls()[0][2].items as unknown[]).length).toBe(1);
  });

  it("sends nothing at all when there are no resolvable items", () => {
    trackViewCart([{ slug: "does-not-exist", finish: "chrome", quantity: 1 }]);
    expect(calls().length).toBe(0);
  });

  it("no-ops when gtag is absent, so a GA-less deploy never throws", () => {
    delete window.gtag;
    expect(() => trackViewItem({ slug: "joy-basin-mixer", finish: "chrome", quantity: 1 })).not.toThrow();
  });
});
