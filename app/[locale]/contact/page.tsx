"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import PageTransition from "@/components/layout/PageTransition";

const enquiryTypeIds = ["homeowner", "trade", "general"] as const;

export default function ContactPage() {
  const t = useTranslations("contactPage");
  const [submitted, setSubmitted] = useState(false);
  const [enquiryType, setEnquiryType] = useState<(typeof enquiryTypeIds)[number]>("homeowner");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const inputBase =
    "w-full border-b border-black/15 bg-transparent px-1 py-4 text-[15px] text-[#0a0a0a] placeholder:text-black/25 focus:border-black/40 focus:outline-none transition-colors duration-300";

  return (
    <PageTransition>
      <div className="bg-[#ece9e2] text-[#0a0a0a]">
        {/* Hero */}
        <section className="bg-black pt-[124px]">
          <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
            <div className="py-20 lg:py-28">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-[11px] uppercase tracking-[0.45em] text-white/40"
              >
                {t("hero.eyebrow")}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 0.76, 0.2, 1] }}
                className="mt-5 max-w-3xl font-heading text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.9] tracking-[-0.04em] text-white"
                style={{ fontStyle: "italic" }}
              >
                {t("hero.headline")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="mt-6 max-w-lg text-[16px] leading-[1.85] text-white/40"
              >
                {t("hero.body")}
              </motion.p>
            </div>
          </div>
        </section>

        {/* Form + Info */}
        <section className="px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
          <div className="mx-auto max-w-[1780px]">
            <div className="grid gap-16 lg:grid-cols-[1fr_380px] lg:gap-24">
              {/* Form */}
              <div>
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center rounded-[14px] bg-white py-24 text-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <h2 className="mt-8 font-heading text-[36px] tracking-[-0.03em]">{t("successTitle")}</h2>
                    <p className="mt-4 max-w-sm text-[15px] leading-[1.75] text-black/50">
                      {t("successBody")}
                    </p>
                  </motion.div>
                ) : (
                  <form
                    className="rounded-[14px] bg-white p-8 sm:p-10 lg:p-12"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (honeypot) return;
                      setSubmitError(null);
                      setSubmitting(true);
                      const formData = new FormData(e.currentTarget);
                      try {
                        const res = await fetch("/api/contact", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            enquiryType,
                            name: formData.get("name"),
                            email: formData.get("email"),
                            phone: formData.get("phone"),
                            cityOrCompany: formData.get(enquiryType === "homeowner" ? "city" : "company"),
                            subject: formData.get("subject"),
                            message: formData.get("message"),
                          }),
                        });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          setSubmitError(data.error || "Something went wrong. Please try again.");
                          return;
                        }
                        setSubmitted(true);
                      } catch {
                        setSubmitError("Could not reach the server. Please try again.");
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    <div className="hidden" aria-hidden="true">
                      <input
                        type="text"
                        name="website"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    {/* Enquiry type */}
                    <div className="mb-10">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-black/35">{t("iAm")}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {enquiryTypeIds.map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setEnquiryType(id)}
                            className={`rounded-full border px-6 py-2.5 text-[13px] font-medium transition cursor-pointer ${
                              enquiryType === id
                                ? "border-black bg-black text-white"
                                : "border-black/12 text-black/55 hover:border-black/25"
                            }`}
                          >
                            {t(`enquiryTypes.${id}.label`)}
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-[12px] text-black/35">
                        {t(`enquiryTypes.${enquiryType}.desc`)}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/35">{t("fields.name")}</label>
                        <input type="text" name="name" autoComplete="name" placeholder={t("fields.namePlaceholder")} className={inputBase} required />
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/35">{t("fields.email")}</label>
                        <input type="email" name="email" autoComplete="email" placeholder={t("fields.emailPlaceholder")} className={inputBase} required />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/35">{t("fields.phone")}</label>
                        <input type="tel" name="phone" autoComplete="tel" placeholder={t("fields.phonePlaceholder")} className={inputBase} />
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/35">
                          {enquiryType === "homeowner" ? t("fields.city") : t("fields.company")}
                        </label>
                        <input
                          type="text"
                          name={enquiryType === "homeowner" ? "city" : "company"}
                          autoComplete={enquiryType === "homeowner" ? "address-level2" : "organization"}
                          placeholder={enquiryType === "homeowner" ? t("fields.cityPlaceholder") : t("fields.companyPlaceholder")}
                          className={inputBase}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/35">{t("fields.subject")}</label>
                      <input type="text" name="subject" placeholder={t("fields.subjectPlaceholder")} className={inputBase} />
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/35">{t("fields.message")}</label>
                      <textarea rows={4} name="message" placeholder={t("fields.messagePlaceholder")} className={`${inputBase} resize-none`} required />
                    </div>

                    {submitError && <p className="mt-4 text-[13px] text-red-600">{submitError}</p>}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-8 flex h-[50px] items-center justify-center rounded-full border border-black/30 px-14 text-[13px] font-medium text-black transition hover:bg-black hover:text-white cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? t("sending") : t("send")}
                    </button>
                  </form>
                )}
              </div>

              {/* Info sidebar */}
              <div className="space-y-6 lg:pt-4">
                {[
                  { label: t("info.showroom.label"), lines: t.raw("info.showroom.lines") as string[] },
                  { label: t("info.email.label"), lines: ["inquiries@steinheim-eg.com"], href: "mailto:inquiries@steinheim-eg.com" },
                  { label: t("info.whatsapp.label"), lines: ["+20 122 399 8124"], href: "https://wa.me/201223998124" },
                ].map((block) => (
                  <div key={block.label} className="rounded-[12px] bg-white p-6">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-black/30">{block.label}</p>
                    {block.lines.map((line) =>
                      block.href ? (
                        <a key={line} href={block.href} target={block.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="mt-3 block text-[15px] transition hover:text-black/60">
                          {line}
                        </a>
                      ) : (
                        <p key={line} className="mt-2 text-[15px] text-black/70">{line}</p>
                      )
                    )}
                  </div>
                ))}

                <div className="rounded-[12px] border border-black/6 bg-white p-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-black/30">{t("info.responseTime.label")}</p>
                  <p className="mt-3 font-heading text-[24px]">{t("info.responseTime.value")}</p>
                  <p className="mt-2 text-[13px] leading-[1.7] text-black/45">
                    {t("info.responseTime.note")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
