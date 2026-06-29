import { useTranslations } from "next-intl";
import type { Product } from "@/lib/utils";

export default function SpecTable({ product }: { product: Product }) {
  const t = useTranslations("specs");

  const specs: [string, string | undefined][] = [
    [t("material"), product.material],
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
