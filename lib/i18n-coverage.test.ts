import { describe, expect, it } from "vitest";
import { createTranslator } from "use-intl/core";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import productsData from "@/data/products.json";

const hasArabic = (value: string) => /[؀-ۿ]/.test(value);

/** Values that are correctly identical in both files: brand names, model
 * numbers, units, and format placeholders. Arabic technical writing keeps
 * these in Latin script, so flagging them would be noise. */
const INTENTIONALLY_SHARED = new Set([
  "collections.joy.name",
  "collections.art.name",
  "collections.quatro.name",
  "finishTags.pvd",
  "home.assembly.foundation.spec",
  "home.assembly.structure.spec",
  "home.assembly.control.spec",
  "contactPage.fields.emailPlaceholder",
  "contactPage.fields.phonePlaceholder",
  "getProjectLinkModal.emailPlaceholder",
  "tradePage.howShowcase.mock.introEmail",
  "tradeSetupOverlay.step2.roomCount",
]);

/** Namespaces no component reads. They are dead copy, tracked separately —
 * translating them would be busywork and deleting them is the owner's call. */
const UNUSED_NAMESPACES = new Set([
  "hero",
  "home",
  "featureStrip",
  "product",
  "brandPillars",
  "newsletter",
  "trade",
  "about",
  "journal",
  "contact",
  "cart",
  "finishTags",
]);

function flatten(obj: Record<string, unknown>, prefix = ""): Array<[string, string]> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") return flatten(value as Record<string, unknown>, path);
    return typeof value === "string" ? [[path, value] as [string, string]] : [];
  });
}

describe("Arabic message coverage", () => {
  it("keeps en.json and ar.json structurally identical", () => {
    const enKeys = flatten(en).map(([k]) => k).sort();
    const arKeys = flatten(ar).map(([k]) => k).sort();
    expect(arKeys).toEqual(enKeys);
  });

  it("has no untranslated English left in any namespace a component reads", () => {
    const arEntries = flatten(ar);
    const untranslated = arEntries.filter(([path, value]) => {
      if (INTENTIONALLY_SHARED.has(path)) return false;
      if (UNUSED_NAMESPACES.has(path.split(".")[0])) return false;
      // Latin words with no Arabic characters anywhere = never translated.
      return !hasArabic(value) && /[A-Za-z]{4,}/.test(value);
    });

    expect(untranslated.map(([path]) => path)).toEqual([]);
  });
});

describe("spec table translation", () => {
  const t = createTranslator({ locale: "ar", messages: ar, namespace: "specs" });
  // specValues is keyed by the English source string, which is only known at
  // runtime — the core translator's key type is literal-only, so this test
  // reaches it through a string-keyed view of the same translator.
  const tv = createTranslator({ locale: "ar", messages: ar, namespace: "specValues" }) as unknown as {
    (key: string): string;
    has(key: string): boolean;
  };

  it("renders every spec label in Arabic", () => {
    const labels = [
      "material",
      "cartridge",
      "aerator",
      "inletPipe",
      "connectionSize",
      "pressureRange",
      "maxPressure",
      "maxTemperature",
      "operatingTemperature",
      "mountingAperture",
    ] as const;

    for (const key of labels) {
      const value = t(key);
      expect(hasArabic(value), `specs.${key} is still "${value}"`).toBe(true);
    }
  });

  it("translates material values and passes measurements through unchanged", () => {
    // Mirrors the guard in SpecTable/CompareModal: translate when known,
    // otherwise render the source value.
    const render = (value: string) => (tv.has(value) ? tv(value) : value);

    expect(render("Brass body")).toBe("جسم نحاسي");
    expect(render("Stainless steel")).toBe("صلب مقاوم للصدأ");
    // Units and brand names stay in Latin script on purpose.
    expect(render("16 bar")).toBe("16 bar");
    expect(render("35mm Sedal")).toBe("35mm Sedal");
    expect(render("Neoperl")).toBe("Neoperl");
  });

  it("covers every material value present in the catalogue", () => {
    const materials = [
      ...new Set(
        productsData.products
          .map((product) => (product as { material?: string }).material)
          .filter((value): value is string => Boolean(value))
      ),
    ];

    for (const material of materials) {
      expect(tv.has(material), `no Arabic for material "${material}"`).toBe(true);
    }
  });
});
