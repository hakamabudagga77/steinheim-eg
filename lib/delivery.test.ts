import { describe, expect, it } from "vitest";
import {
  DEFAULT_WINDOW,
  getDeliveryWindow,
  getOfferShippingDetails,
  getZoneForGovernorate,
} from "@/lib/delivery";

describe("getDeliveryWindow", () => {
  it("maps Cairo and Giza to the 1-3 business-day window", () => {
    expect(getDeliveryWindow("Cairo")).toEqual({ minDays: 1, maxDays: 3 });
    expect(getDeliveryWindow("giza")).toEqual({ minDays: 1, maxDays: 3 });
  });

  it("accepts Arabic governorate names", () => {
    expect(getDeliveryWindow("الإسكندرية")).toEqual({ minDays: 2, maxDays: 4 });
    expect(getDeliveryWindow("أسيوط")).toEqual({ minDays: 4, maxDays: 6 });
  });

  it("gives frontier governorates the longest window", () => {
    expect(getDeliveryWindow("Red Sea")).toEqual({ minDays: 5, maxDays: 7 });
    expect(getDeliveryWindow("Matrouh")).toEqual({ minDays: 5, maxDays: 7 });
  });

  it("falls back to the default window for an unknown governorate", () => {
    expect(getDeliveryWindow("Atlantis")).toEqual(DEFAULT_WINDOW);
    expect(getDeliveryWindow("")).toEqual(DEFAULT_WINDOW);
    expect(getDeliveryWindow(null)).toEqual(DEFAULT_WINDOW);
  });

  it("is case and whitespace tolerant", () => {
    expect(getDeliveryWindow("  NEW VALLEY ")).toEqual({ minDays: 5, maxDays: 7 });
  });
});

describe("getZoneForGovernorate", () => {
  it("resolves known governorates and null otherwise", () => {
    expect(getZoneForGovernorate("Luxor")).toBe("upper");
    expect(getZoneForGovernorate("boring")).toBeNull();
  });
});

describe("getOfferShippingDetails", () => {
  it("targets Egypt and declares DAY unit codes", () => {
    const details = getOfferShippingDetails();
    const destination = details.shippingDestination as Record<string, string>;
    const deliveryTime = details.deliveryTime as Record<string, Record<string, number | string>>;
    expect(details["@type"]).toBe("OfferShippingDetails");
    expect(destination.addressCountry).toBe("EG");
    expect(deliveryTime.handlingTime.unitCode).toBe("DAY");
    expect(deliveryTime.transitTime.unitCode).toBe("DAY");
    expect(deliveryTime.transitTime.minValue).toBe(DEFAULT_WINDOW.minDays);
    expect(deliveryTime.transitTime.maxValue).toBe(DEFAULT_WINDOW.maxDays);
  });
});
