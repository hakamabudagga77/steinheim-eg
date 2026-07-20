"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

// Client UI for the Sentry integration check. Kept in its own file so the
// route's page.tsx can stay a server component that gates access before this
// ever renders (see page.tsx).
export default function SentryExampleClient() {
  const [clientState, setClientState] = useState<"idle" | "sent">("idle");
  const [serverState, setServerState] = useState<"idle" | "sent" | "error">("idle");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 pt-[124px] text-center">
      <h1 className="font-heading text-2xl">Sentry integration check</h1>
      <p className="max-w-md text-sm text-warm-gray">
        Two buttons, two deliberate errors. Click one, then check the Sentry dashboard for a
        new issue tagged &quot;sentry-example-page&quot;.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            Sentry.captureException(new Error("Sentry example client error (intentional)"), {
              tags: { source: "sentry-example-page" },
            });
            setClientState("sent");
          }}
          className="rounded-full border border-charcoal px-6 py-3 text-sm font-medium transition hover:bg-charcoal hover:text-white"
        >
          {clientState === "sent" ? "Client error sent ✓" : "Trigger client error"}
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              await fetch("/api/sentry-example-api");
              setServerState("error");
            } catch {
              setServerState("error");
            }
          }}
          className="rounded-full border border-charcoal px-6 py-3 text-sm font-medium transition hover:bg-charcoal hover:text-white"
        >
          {serverState === "error" ? "Server error triggered ✓" : "Trigger server error"}
        </button>
      </div>
    </div>
  );
}
