import { NextResponse } from "next/server";
import { buildCheckoutUrl, fetchAllProducts } from "@/lib/shopify-client";
import { resolveVariantId } from "@/lib/shopify-product-map";
import { sanitizeAttribution, type Attribution } from "@/lib/checkout-attribution";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: Array<{ slug: string; finish: string; quantity: number }> = body.items;
    // Sent by the cart drawer from what it recorded on arrival. Sanitized
    // rather than trusted: it is client-supplied and ends up in a URL.
    const attribution: Attribution | null = sanitizeAttribution(body.attribution);

    if (!items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const shopifyProducts = await fetchAllProducts();

    const checkoutItems: Array<{ variantId: number; quantity: number }> = [];
    // Structured rather than a display string: the cart drawer resolves these
    // back to product/finish names so the shopper is told exactly which lines
    // cannot be ordered online, instead of them vanishing from the order.
    const unmapped: Array<{ slug: string; finish: string }> = [];

    for (const item of items) {
      const variantId = resolveVariantId(item.slug, item.finish, shopifyProducts);
      if (variantId) {
        checkoutItems.push({ variantId, quantity: item.quantity });
      } else {
        unmapped.push({ slug: item.slug, finish: item.finish });
      }
    }

    if (!checkoutItems.length) {
      return NextResponse.json(
        { error: "No items could be mapped to Shopify products", unmapped },
        { status: 400 }
      );
    }

    const checkoutUrl = buildCheckoutUrl(checkoutItems, attribution);

    return NextResponse.json({ checkoutUrl, unmapped });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
