// Deliberately throws so Sentry's server-side instrumentation
// (instrumentation.ts -> onRequestError) has something real to capture.
// Not linked from anywhere in the UI — see app/[locale]/sentry-example-page.
export async function GET() {
  throw new Error("Sentry example API route error (intentional, for verifying error monitoring)");
}
