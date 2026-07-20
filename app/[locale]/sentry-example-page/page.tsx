import { notFound } from "next/navigation";
import { diagnosticsBlocked } from "@/lib/server/diagnostics-gate";
import SentryExampleClient from "./SentryExampleClient";

// Evaluate the gate at request time rather than baking it in at build — a
// diagnostic page has no reason to be statically cached, and this removes any
// dependence on the build-time value of VERCEL_ENV.
export const dynamic = "force-dynamic";

// Diagnostic page for verifying the Sentry integration end to end (client
// capture, server capture via instrumentation.ts). Not linked from navigation
// or the sitemap — reach it directly by URL. Gated off the live production
// domain (see diagnosticsBlocked); still reachable in local dev and Vercel
// preview deployments so the pipeline can be re-verified against a real build.
export default function SentryExamplePage() {
  if (diagnosticsBlocked()) notFound();
  return <SentryExampleClient />;
}
