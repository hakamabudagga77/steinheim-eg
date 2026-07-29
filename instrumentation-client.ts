const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

type SentryClient = typeof import("@sentry/nextjs");

let sentryPromise: Promise<SentryClient | null> | null = null;

function loadSentry() {
  if (!dsn) return Promise.resolve(null);
  if (sentryPromise) return sentryPromise;

  sentryPromise = import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      // Sample a slice of transactions rather than all of them — full tracing
      // on every page view isn't needed to catch real errors and adds cost.
      tracesSampleRate: 0.1,
      // Don't attach IP addresses/headers to events by default.
      sendDefaultPii: false,
      debug: false,
    });

    window.removeEventListener("error", captureEarlyError);
    window.removeEventListener("unhandledrejection", captureEarlyRejection);
    return Sentry;
  });

  return sentryPromise;
}

function captureEarlyError(event: ErrorEvent) {
  const error = event.error ?? new Error(event.message || "Unknown browser error");
  void loadSentry().then((Sentry) => Sentry?.captureException(error));
}

function captureEarlyRejection(event: PromiseRejectionEvent) {
  void loadSentry().then((Sentry) => Sentry?.captureException(event.reason));
}

// Keep initial instrumentation deliberately tiny. The full monitoring SDK is
// loaded only if it is needed, so it does not compete with hydration on every
// successful page view. These native listeners still preserve startup errors.
if (dsn) {
  window.addEventListener("error", captureEarlyError);
  window.addEventListener("unhandledrejection", captureEarlyRejection);
}

export function onRouterTransitionStart(href: string, navigationType: string) {
  void loadSentry().then((Sentry) =>
    Sentry?.captureRouterTransitionStart(href, navigationType)
  );
}
