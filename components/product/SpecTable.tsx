import { useTranslations } from "next-intl";
import type { Product } from "@/lib/utils";

export default function SpecTable({ product }: { product: Product }) {
  const t = useTranslations("specs");
  const tv = useTranslations("specValues");

  // Spec values live in data/products.json in English. Only the material
  // names are words rather than measurements or brand names — "16 bar",
  // "90°C", "35mm Sedal" and "Neoperl" read natively in Arabic technical
  // writing, so they are deliberately passed through untouched.
  const translateValue = (value?: string) => {
    if (!value) return value;
    return tv.has(value) ? tv(value) : value;
  };

  const specs: [string, string | undefined][] = [
    [t("material"), translateValue(product.material)],
    [t("cartridge"), product.cartridge],
    [t("aerator"), product.aerator],
    [t("inletPipe"), product.inletPipe],
    [t("connectionSize"), product.connectionSize],
    [t("pressureRange"), product.pressureRange],
    [t("maxPressure"), product.maxPressure],
    [t("maxTemperature"), product.maxTemperature],
    [t("operatingTemperature"), product.operatingTemperature],
    [t("mountingAperture"), product.mountingAperture],
  ];

  const filteredSpecs = specs.filter(([, value]) => value);

  return (
    <table className="w-full">
      <tbody>
        {filteredSpecs.map(([label, value]) => (
          <tr key={label} className="border-b border-stone/10">
            <td className="py-3 pr-8 text-sm text-warm-gray w-1/3">
              {label}
            </td>
            <td className="py-3 text-sm text-charcoal">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
