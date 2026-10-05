import { discountPercentage, validCompareAtPrice } from "@/lib/discount-pricing";
import { formatPrice } from "@/lib/utils";

export default function ProductPrice({
  price,
  compareAtPrice,
  quantity = 1,
  className = "",
  priceClassName = "",
}: {
  price: number;
  compareAtPrice?: number | null;
  quantity?: number;
  className?: string;
  priceClassName?: string;
}) {
  const validCompareAt = validCompareAtPrice(price, compareAtPrice);
  const discount = discountPercentage(price, compareAtPrice);

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`.trim()}>
      <span className={priceClassName}>{formatPrice(price * quantity)}</span>
      {validCompareAt !== null && (
        <>
          <del className="text-[0.78em] font-normal text-black/45 decoration-1">
            {formatPrice(validCompareAt * quantity)}
          </del>
          <span className="rounded-full bg-black px-2 py-0.5 text-[9px] font-medium tracking-[0.04em] text-white">
            −{discount}%
          </span>
        </>
      )}
    </div>
  );
}
