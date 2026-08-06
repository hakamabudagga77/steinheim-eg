import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-session";
import { listCampaigns, saveCampaign, deleteCampaign } from "@/lib/server/campaign-store";
import { type CampaignCopy, type CampaignRecord } from "@/lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isCopy(value: unknown): value is CampaignCopy {
  if (!value || typeof value !== "object") return false;
  const copy = value as Record<string, unknown>;
  return ["eyebrow", "title", "body", "cta"].every(
    (key) => typeof copy[key] === "string" && copy[key].trim().length > 0
  );
}

function isCampaignRecord(value: unknown): value is CampaignRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<CampaignRecord>;
  if (typeof record.id !== "string" || !record.id.trim()) return false;
  if (typeof record.enabled !== "boolean") return false;
  if (typeof record.startsAt !== "string" || !DATE_RE.test(record.startsAt)) return false;
  if (typeof record.endsAt !== "string" || !DATE_RE.test(record.endsAt)) return false;
  if (record.endsAt < record.startsAt) return false;
  if (typeof record.href !== "string" || !record.href.startsWith("/")) return false;
  return isCopy(record.en) && isCopy(record.ar);
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const campaigns = await listCampaigns();
    return NextResponse.json({ campaigns }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load campaigns:", error);
    return NextResponse.json({ error: "Could not load campaigns." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (!isCampaignRecord(body)) {
      return NextResponse.json({ error: "Invalid campaign. Check the dates, link, and both languages." }, { status: 400 });
    }
    await saveCampaign(body);
    return NextResponse.json({ campaign: body });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ error: "Could not save this campaign." }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    const existing = (await listCampaigns()).find((campaign) => campaign.id === id);
    if (!existing) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

    const merged: CampaignRecord = {
      ...existing,
      ...body,
      en: body.en ?? existing.en,
      ar: body.ar ?? existing.ar,
    };
    if (!isCampaignRecord(merged)) {
      return NextResponse.json({ error: "Invalid campaign. Check the dates, link, and both languages." }, { status: 400 });
    }
    await saveCampaign(merged);
    return NextResponse.json({ campaign: merged });
  } catch (error) {
    console.error("Failed to update campaign:", error);
    return NextResponse.json({ error: "Could not save this campaign." }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body?.id !== "string" || !body.id) {
      return NextResponse.json({ error: "Missing campaign id." }, { status: 400 });
    }
    await deleteCampaign(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    return NextResponse.json({ error: "Could not delete this campaign." }, { status: 502 });
  }
}
