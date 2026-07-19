import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Sample a slice of transactions rather than all of them — full tracing
  // on every page view isn't needed to catch real errors and adds cost.
  tracesSampleRate: 0.1,
  // Don't attach IP addresses/headers to events by default.
  sendDefaultPii: false,
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
