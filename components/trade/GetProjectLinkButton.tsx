"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function GetProjectLinkButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const t = useTranslations("getProjectLinkModal");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "invalid">("idle");

  function handleClose() {
    setOpen(false);
    window.setTimeout(() => {
      setEmail("");
      setStatus("idle");
    }, 300);
  }

  async function handleSubmit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setStatus("invalid");
      return;
    }
    setStatus("sending");
    try {
      await fetch("/api/trade/leads/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // The endpoint always reports success either way; a network failure
      // here just means we skip straight to the same reassuring message.
    }
    setStatus("sent");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-[12px] font-medium underline underline-offset-4 transition ${
          variant === "light" ? "text-white/60 hover:text-white" : "text-black/50 hover:text-black"
        }`}
      >
        {t("trigger")}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 0.76, 0.2, 1] }}
              className="fixed inset-x-4 top-1/2 z-[91] mx-auto max-w-[420px] -translate-y-1/2 bg-white sm:inset-x-auto"
            >
              <div className="flex items-center justify-between border-b border-charcoal/8 px-6 py-5">
                <p className="font-heading text-[18px] text-charcoal" style={{ fontStyle: "italic" }}>
                  {t("title")}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center text-warm-gray transition hover:text-charcoal"
                  aria-label={t("close")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-6 py-6">
                {status === "sent" ? (
                  <div className="text-center">
                    <p className="font-heading text-[18px] text-charcoal" style={{ fontStyle: "italic" }}>{t("successTitle")}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-warm-gray">{t("successBody")}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] leading-relaxed text-warm-gray">{t("body")}</p>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (status === "invalid") setStatus("idle"); }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                      placeholder={t("emailPlaceholder")}
                      className="mt-4 h-[46px] w-full border border-charcoal/15 bg-white px-4 text-[14px] outline-none transition focus:border-charcoal/40"
                    />
                    {status === "invalid" && (
                      <p className="mt-2 text-[11px] text-red-700">{t("errorInvalidEmail")}</p>
                    )}
                    <button
                      type="button"
                      disabled={status === "sending"}
                      onClick={handleSubmit}
                      className="mt-4 flex h-[46px] w-full items-center justify-center bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-50"
                    >
                      {status === "sending" ? t("sending") : t("submit")}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
