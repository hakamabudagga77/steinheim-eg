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

function ContactIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
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
      transition={{ delay: 2, duration: 0.4, type: "spring" }}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-charcoal rounded-full flex items-center justify-center text-off-white shadow-lg shadow-black/10 hover:bg-stone hover:scale-110 transition-all duration-300 group"
      aria-label="Contact Steinheim"
    >
      <ContactIcon size={22} />
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-charcoal text-off-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Contact us
      </span>
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
      className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-charcoal text-off-white text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-stone transition-colors duration-300"
    >
      <ContactIcon />
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
      className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-charcoal text-off-white text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-stone transition-colors duration-300"
    >
      <ContactIcon />
      Discuss availability
    </a>
  );
}
