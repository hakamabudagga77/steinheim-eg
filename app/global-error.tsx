"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

// Root-level error boundary. Next renders this (replacing the whole document,
// so it declares its own <html>/<body>) when an error escapes the root layout
// or a page's own error boundary. Reporting here is what makes React render
// errors in the App Router reach Sentry — without this file they aren't
// captured, which is exactly what the Sentry build warning flagged. Styles are
// inline because globals.css isn't guaranteed to be applied at this level, and
// copy is picked by locale because the intl provider can't be used this high.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  // The locale is read lazily at render: on the server this page has no
  // window, so it defaults to English and corrects itself on hydration.
  const [isArabic] = useState(
    () => typeof window !== "undefined" && window.location.pathname.startsWith("/ar")
  );

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const copy = isArabic
    ? {
        eyebrow: "شتاينهايم",
        title: "حدث خطأ غير متوقع",
        body: "حدث خطأ غير متوقع. تم إخطار فريقنا — يرجى المحاولة مرة أخرى.",
        reload: "إعادة المحاولة",
      }
    : {
        eyebrow: "Steinheim",
        title: "Something went wrong",
        body: "An unexpected error occurred. Our team has been notified — please try again.",
        reload: "Try again",
      };

  return (
    <html lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ece9e2",
          fontFamily: "ui-serif, Georgia, serif",
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
              color: "rgba(236,233,226,0.55)",
            }}
          >
            {copy.eyebrow}
          </p>
          <h1 style={{ margin: "16px 0 12px", fontSize: 26, fontWeight: 400, fontStyle: "italic" }}>
            {copy.title}
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: 14, lineHeight: 1.7, color: "rgba(236,233,226,0.6)" }}>
            {copy.body}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              height: 46,
              padding: "0 32px",
              borderRadius: 999,
              border: "1px solid rgba(236,233,226,0.35)",
              background: "#ece9e2",
              color: "#0a0a0a",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {copy.reload}
          </button>
        </div>
      </body>
    </html>
  );
}
