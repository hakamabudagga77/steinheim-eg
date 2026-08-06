export const CONCIERGE_NUMBER = "201223998124";

export type ConciergeLocale = "en" | "ar";

export type ConciergeContext =
  | { kind: "product"; productName: string; seriesName?: string; price?: string }
  | { kind: "trade" }
  | { kind: "contact" }
  | { kind: "generic" };

function productMessage(context: Extract<ConciergeContext, { kind: "product" }>, locale: ConciergeLocale): string {
  const label = [context.seriesName, context.productName].filter(Boolean).join(" ") || context.productName;
  if (locale === "ar") {
    return context.price
      ? `مرحبًا شتاينهايم، أود الاستفسار عن ${label} (السعر ${context.price}).`
      : `مرحبًا شتاينهايم، أود الاستفسار عن ${label}.`;
  }
  return context.price
    ? `Hello Steinheim, I'd like to ask about the ${label} (${context.price}).`
    : `Hello Steinheim, I'd like to ask about the ${label}.`;
}

function messageFor(context: ConciergeContext, locale: ConciergeLocale): string {
  if (context.kind === "product") return productMessage(context, locale);
  if (locale === "ar") {
    switch (context.kind) {
      case "trade":
        return "مرحبًا شتاينهايم، أعمل على مشروع وأود مناقشة أسعار المحترفين وجدولة التوريد.";
      case "contact":
        return "مرحبًا شتاينهايم، أود التواصل بخصوص استفسار عن المنتجات.";
      default:
        return "مرحبًا شتاينهايم، أود التحدث مع مستشار تصميم.";
    }
  }
  switch (context.kind) {
    case "trade":
      return "Hello Steinheim, I'm working on a project and would like to discuss trade pricing and scheduling.";
    case "contact":
      return "Hello Steinheim, I'd like to get in touch about a product enquiry.";
    default:
      return "Hello Steinheim, I'd like to speak with a design consultant.";
  }
}

export function buildConciergeLink(context: ConciergeContext, locale: ConciergeLocale): string {
  return `https://wa.me/${CONCIERGE_NUMBER}?text=${encodeURIComponent(messageFor(context, locale))}`;
}
