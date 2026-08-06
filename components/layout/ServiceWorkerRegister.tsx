"use client";

import { useEffect } from "react";

// Registers the offline shell worker in production only — `next dev` hot-
// reloads unbounded file changes, which plays badly with a caching worker.
// Registration happens after load so it never delays first paint.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is progressive — never block the page on it */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
