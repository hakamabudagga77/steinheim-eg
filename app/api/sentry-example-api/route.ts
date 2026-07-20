import { NextResponse } from "next/server";
import { diagnosticsBlocked } from "@/lib/server/diagnostics-gate";

// Deliberately throws so Sentry's server-side instrumentation
// (instrumentation.ts -> onRequestError) has something real to capture.
// Not linked from anywhere in the UI — see app/[locale]/sentry-example-page.
// Gated off the live production domain to match the page it backs.
export async function GET() {
  if (diagnosticsBlocked()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  throw new Error("Sentry example API route error (intentional, for verifying error monitoring)");
}
