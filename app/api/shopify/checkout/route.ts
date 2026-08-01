import { NextResponse } from "next/server";
import { buildCheckoutUrl, fetchAllProducts } from "@/lib/shopify-client";
import { resolveVariantId } from "@/lib/shopify-product-map";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: Array<{ slug: string; finish: string; quantity: number }> = body.items;

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

    const checkoutUrl = buildCheckoutUrl(checkoutItems);

    return NextResponse.json({ checkoutUrl, unmapped });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
