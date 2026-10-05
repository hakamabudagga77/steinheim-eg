export function validCompareAtPrice(
  price: number,
  compareAtPrice: number | null | undefined
): number | null {
  return Number.isFinite(price)
    && typeof compareAtPrice === "number"
    && Number.isFinite(compareAtPrice)
    && compareAtPrice > price
    ? compareAtPrice
    : null;
}

export function discountPercentage(
  price: number,
  compareAtPrice: number | null | undefined
): number | null {
  const validCompareAt = validCompareAtPrice(price, compareAtPrice);
  if (validCompareAt === null) return null;
  return Math.max(1, Math.round(((validCompareAt - price) / validCompareAt) * 100));
}
