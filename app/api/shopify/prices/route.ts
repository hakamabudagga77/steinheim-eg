import { NextResponse } from "next/server";
import { getAllLiveData } from "@/lib/shopify-live-data";

export async function GET() {
  try {
    const liveMap = await getAllLiveData();
    const data: Record<string, { variants: Array<{ finish: string; price: number; inventory: number; inStock: boolean }> }> = {};
    for (const [slug, entry] of liveMap) {
      data[slug] = { variants: entry.variants };
    }
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Prices API error:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
