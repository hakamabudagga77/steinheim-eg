"use client";

import { motion } from "framer-motion";

const CONTACT_EMAIL = "inquiries@steinheim-eg.com";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

function getContactHref(message: string) {
  if (WHATSAPP_NUMBER) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Steinheim enquiry")}&body=${encodeURIComponent(message)}`;
}

export function WhatsAppFloat() {
  const message = "Hi, I'm interested in Steinheim products. Can you help me?";

  return (
    <motion.a
      href={getContactHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2.5, duration: 0.4, type: "spring" }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-white/15 bg-black/80 px-5 py-3 text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-300 hover:bg-black hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] group"
      aria-label="Contact Steinheim"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span className="text-[12px] font-medium tracking-[0.05em]">Concierge</span>
    </motion.a>
  );
}

export function WhatsAppProductButton({
  productName,
  seriesName,
  finishName,
  model,
  price,
}: {
  productName: string;
  seriesName: string;
  finishName: string;
  model: string;
  price: string;
}) {
  const message = `Hi, I'm interested in the Steinheim ${seriesName} ${productName} in ${finishName} (${model}) - ${price}. Can you tell me more?`;

  return (
    <a
      href={getContactHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-[54px] w-full items-center justify-center gap-3 rounded-full border border-black/15 text-[13px] font-medium transition hover:border-black"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      Enquire via WhatsApp
    </a>
  );
}

export function WhatsAppConfigButton({
  seriesName,
  finishName,
  items,
  total,
}: {
  seriesName: string;
  finishName: string;
  items: { name: string; qty: number; price: string }[];
  total: string;
}) {
  const itemLines = items
    .map((item) => `- ${item.name}${item.qty > 1 ? ` x${item.qty}` : ""} - ${item.price}`)
    .join("\n");
  const message = `Hi, I've configured a Steinheim ${seriesName} bathroom in ${finishName}:\n\n${itemLines}\n\nTotal: ${total}\n\nCan we discuss availability and delivery?`;

  return (
    <a
      href={getContactHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-[54px] w-full items-center justify-center gap-3 rounded-full bg-black text-[13px] font-medium text-white transition hover:bg-black/85"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      Discuss availability
    </a>
  );
}
