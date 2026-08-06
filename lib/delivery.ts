export type DeliveryZone = "cairo" | "delta" | "upper" | "frontier";

export interface DeliveryWindow {
  minDays: number;
  maxDays: number;
}

export interface Governorate {
  id: string;
  nameEn: string;
  nameAr: string;
  zone: DeliveryZone;
}

const ZONE_WINDOWS: Record<DeliveryZone, DeliveryWindow> = {
  cairo: { minDays: 1, maxDays: 3 },
  delta: { minDays: 2, maxDays: 4 },
  upper: { minDays: 4, maxDays: 6 },
  frontier: { minDays: 5, maxDays: 7 },
};

export const GOVERNORATES: ReadonlyArray<Governorate> = [
  { id: "cairo", nameEn: "Cairo", nameAr: "القاهرة", zone: "cairo" },
  { id: "giza", nameEn: "Giza", nameAr: "الجيزة", zone: "cairo" },
  { id: "alexandria", nameEn: "Alexandria", nameAr: "الإسكندرية", zone: "delta" },
  { id: "port-said", nameEn: "Port Said", nameAr: "بورسعيد", zone: "delta" },
  { id: "ismailia", nameEn: "Ismailia", nameAr: "الإسماعيلية", zone: "delta" },
  { id: "suez", nameEn: "Suez", nameAr: "السويس", zone: "delta" },
  { id: "sharqia", nameEn: "Sharqia", nameAr: "الشرقية", zone: "delta" },
  { id: "dakahlia", nameEn: "Dakahlia", nameAr: "الدقهلية", zone: "delta" },
  { id: "qalyubia", nameEn: "Qalyubia", nameAr: "القليوبية", zone: "delta" },
  { id: "beheira", nameEn: "Beheira", nameAr: "البحيرة", zone: "delta" },
  { id: "gharbia", nameEn: "Gharbia", nameAr: "الغربية", zone: "delta" },
  { id: "menoufia", nameEn: "Menoufia", nameAr: "المنوفية", zone: "delta" },
  { id: "kafr-el-sheikh", nameEn: "Kafr El Sheikh", nameAr: "كفر الشيخ", zone: "delta" },
  { id: "damietta", nameEn: "Damietta", nameAr: "دمياط", zone: "delta" },
  { id: "fayoum", nameEn: "Fayoum", nameAr: "الفيوم", zone: "upper" },
  { id: "beni-suef", nameEn: "Beni Suef", nameAr: "بني سويف", zone: "upper" },
  { id: "minya", nameEn: "Minya", nameAr: "المنيا", zone: "upper" },
  { id: "assiut", nameEn: "Assiut", nameAr: "أسيوط", zone: "upper" },
  { id: "sohag", nameEn: "Sohag", nameAr: "سوهاج", zone: "upper" },
  { id: "qena", nameEn: "Qena", nameAr: "قنا", zone: "upper" },
  { id: "luxor", nameEn: "Luxor", nameAr: "الأقصر", zone: "upper" },
  { id: "aswan", nameEn: "Aswan", nameAr: "أسوان", zone: "upper" },
  { id: "red-sea", nameEn: "Red Sea", nameAr: "البحر الأحمر", zone: "frontier" },
  { id: "new-valley", nameEn: "New Valley", nameAr: "الوادي الجديد", zone: "frontier" },
  { id: "matrouh", nameEn: "Matrouh", nameAr: "مطروح", zone: "frontier" },
  { id: "north-sinai", nameEn: "North Sinai", nameAr: "شمال سيناء", zone: "frontier" },
  { id: "south-sinai", nameEn: "South Sinai", nameAr: "جنوب سيناء", zone: "frontier" },
];

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

// Lookup by governorate id and by either localized name, so an Arabic-speaking
// shopper typing (or pasting) "الإسكندرية" gets the same window as "Alexandria".
const ZONE_LOOKUP: Record<string, DeliveryZone> = (() => {
  const map: Record<string, DeliveryZone> = {};
  for (const governorate of GOVERNORATES) {
    map[governorate.id] = governorate.zone;
    map[normalize(governorate.nameEn)] = governorate.zone;
    map[normalize(governorate.nameAr)] = governorate.zone;
  }
  return map;
})();

export const DEFAULT_WINDOW: DeliveryWindow = { minDays: 2, maxDays: 5 };

export function getDeliveryWindow(governorate: string | null | undefined): DeliveryWindow {
  if (!governorate) return DEFAULT_WINDOW;
  const zone = ZONE_LOOKUP[normalize(governorate)];
  return zone ? ZONE_WINDOWS[zone] : DEFAULT_WINDOW;
}

export function getZoneForGovernorate(governorate: string): DeliveryZone | null {
  return ZONE_LOOKUP[normalize(governorate)] ?? null;
}

// schema.org OfferShippingDetails with an ETA in business days. Feeding Google
// a deliveryTime makes the "delivery" attribute eligible in merchant results
// and gives shoppers a concrete estimate before they commit.
export function getOfferShippingDetails(): Record<string, unknown> {
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "EG",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 2,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: DEFAULT_WINDOW.minDays,
        maxValue: DEFAULT_WINDOW.maxDays,
        unitCode: "DAY",
      },
    },
  };
}
