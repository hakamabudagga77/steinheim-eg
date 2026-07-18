import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/server/admin-session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}
