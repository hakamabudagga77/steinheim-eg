import "server-only";

// Diagnostic-only surfaces (e.g. the Sentry integration check page/route) are
// useful for verifying the observability pipeline after a deploy or an SDK
// upgrade, but they deliberately throw errors and shouldn't be reachable on
// the live production domain. Blocking on VERCEL_ENV === "production" keeps
// them working in local dev and in Vercel *preview* deployments (where
// VERCEL_ENV is "preview") — so verification still happens against a real
// build — while removing them from the public production site. When not on
// Vercel at all (VERCEL_ENV undefined, e.g. local dev) they stay enabled.
export function diagnosticsBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}
