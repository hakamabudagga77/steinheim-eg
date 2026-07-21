"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Root-level error boundary. Next renders this (replacing the whole document,
// so it declares its own <html>/<body>) when an error escapes the root layout
// or a page's own error boundary. Reporting here is what makes React render
// errors in the App Router reach Sentry — without this file they aren't
// captured, which is exactly what the Sentry build warning flagged. Styles are
// inline because globals.css isn't guaranteed to be applied at this level.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          color: "#ffffff",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#c9a961",
            }}
          >
            Steinheim
          </p>
          <h1 style={{ margin: "16px 0 12px", fontSize: 26, fontWeight: 500 }}>
            Something went wrong
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}>
            An unexpected error occurred. Our team has been notified. Please try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              height: 46,
              padding: "0 32px",
              borderRadius: 999,
              border: "none",
              background: "#c9a961",
              color: "#000000",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
