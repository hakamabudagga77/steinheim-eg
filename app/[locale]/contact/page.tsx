"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/layout/PageTransition";
import ScrollReveal from "@/components/ui/ScrollReveal";

const enquiryTypes = [
  { id: "homeowner", label: "Homeowner", desc: "Product enquiry or order support" },
  { id: "trade", label: "Trade / Professional", desc: "Project specification or bulk pricing" },
  { id: "general", label: "General", desc: "Press, partnerships, or other" },
] as const;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [enquiryType, setEnquiryType] = useState<string>("homeowner");

  const inputBase =
    "w-full border-b border-charcoal/15 bg-transparent px-0 py-4 text-[15px] text-charcoal placeholder:text-warm-gray/40 focus:border-charcoal focus:outline-none transition-colors duration-300";

  return (
    <PageTransition>
      {/* Hero */}
      <section className="bg-charcoal pt-[72px] lg:pt-[80px]">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="py-16 sm:py-20 lg:py-28">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/30"
            >
              Get in touch
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 0.76, 0.2, 1] }}
              className="mt-5 max-w-2xl font-heading text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.05] text-white"
            >
              We&rsquo;d love to hear from you.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/35"
            >
              Whether you&rsquo;re designing a single bathroom or specifying for
              a 200-unit development, we respond within 24 hours.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Form + Info */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-16 py-16 sm:py-20 lg:grid-cols-[1fr_380px] lg:gap-24 lg:py-28">
            {/* Form */}
            <ScrollReveal>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-charcoal/10">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-charcoal">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h2 className="mt-8 font-heading text-[32px] text-charcoal">
                    Message received.
                  </h2>
                  <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-warm-gray">
                    Thank you for reaching out. Our team will review your enquiry
                    and respond within one business day.
                  </p>
                </motion.div>
              ) : (
                <form
                  className="space-y-0"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                >
                  {/* Enquiry type selector */}
                  <div className="mb-10">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                      I am a
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {enquiryTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setEnquiryType(type.id)}
                          className={`border px-5 py-2.5 text-[12px] font-medium tracking-[0.04em] transition-all duration-200 ${
                            enquiryType === type.id
                              ? "border-charcoal bg-charcoal text-white"
                              : "border-charcoal/15 text-charcoal hover:border-charcoal/40"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-warm-gray/60">
                      {enquiryTypes.find((t) => t.id === enquiryType)?.desc}
                    </p>
                  </div>

                  {/* Name + Email row */}
                  <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-8">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                        Name
                      </label>
                      <input
                        type="text"
                        placeholder="Your full name"
                        className={inputBase}
                        required
                      />
                    </div>
                    <div className="mt-8 sm:mt-0">
                      <label className="block text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        className={inputBase}
                        required
                      />
                    </div>
                  </div>

                  {/* Phone + Company row */}
                  <div className="mt-8 grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-8">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                        Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+20 xxx xxx xxxx"
                        className={inputBase}
                      />
                    </div>
                    <div className="mt-8 sm:mt-0">
                      <label className="block text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                        {enquiryType === "homeowner" ? "City" : "Company"}
                      </label>
                      <input
                        type="text"
                        placeholder={enquiryType === "homeowner" ? "Cairo, Alexandria..." : "Company name"}
                        className={inputBase}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mt-8">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="What can we help with?"
                      className={inputBase}
                    />
                  </div>

                  {/* Message */}
                  <div className="mt-8">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Tell us about your project or question..."
                      className={`${inputBase} resize-none`}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-10 flex h-[50px] w-full items-center justify-center gap-3 bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black sm:w-auto sm:px-12"
                  >
                    Send message
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>
              )}
            </ScrollReveal>

            {/* Info sidebar */}
            <ScrollReveal delay={0.15}>
              <div className="space-y-8 lg:pt-[72px]">
                {/* Showroom */}
                <div className="border-l-2 border-charcoal/8 pl-6">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                    Showroom
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-charcoal">
                    El Sharbatly International Group
                  </p>
                  <p className="mt-1 text-[14px] text-warm-gray">
                    Cairo, Egypt
                  </p>
                </div>

                {/* Email */}
                <div className="border-l-2 border-charcoal/8 pl-6">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                    Email
                  </p>
                  <a
                    href="mailto:inquiries@steinheim-eg.com"
                    className="mt-3 block text-[15px] text-charcoal transition hover:text-warm-gray"
                  >
                    inquiries@steinheim-eg.com
                  </a>
                </div>

                {/* WhatsApp */}
                <div className="border-l-2 border-charcoal/8 pl-6">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                    WhatsApp
                  </p>
                  <a
                    href="https://wa.me/201223998124"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-[15px] text-charcoal transition hover:text-warm-gray"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-charcoal/40">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.257-.154-2.871.853.853-2.871-.154-.257A8 8 0 1112 20z" />
                    </svg>
                    Message us directly
                  </a>
                </div>

                {/* Response time */}
                <div className="mt-4 border border-charcoal/6 bg-[#FAFAF8] p-6">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                    Response time
                  </p>
                  <p className="mt-3 font-heading text-[22px] text-charcoal">
                    Under 24 hours
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-warm-gray">
                    Trade enquiries receive a detailed quote with pricing,
                    availability, and lead times. Homeowner enquiries get
                    product guidance and order support.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
