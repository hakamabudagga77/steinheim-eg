"use client";

import { useTranslations } from "next-intl";

export default function TrustBadges() {
  const t = useTranslations("trustBadges");
  const badges = [
    {
      key: "warranty",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 2.5l7.5 3v6c0 5-3.2 8.4-7.5 10-4.3-1.6-7.5-5-7.5-10v-6z" />
          <path d="M9 12.2l2 2 4-4.2" />
        </svg>
      ),
    },
    {
      key: "authentic",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.3l2.3 2.3 4.7-5" />
        </svg>
      ),
    },
    {
      key: "securePayment",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="4" y="10.5" width="16" height="10" rx="1.5" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 border-t border-black/8 pt-5 sm:grid-cols-3">
      {badges.map((badge) => (
        <div key={badge.key} className="flex items-center gap-2.5 text-black/55">
          <span className="shrink-0">{badge.icon}</span>
          <span className="text-[11.5px] leading-[1.4]">{t(badge.key)}</span>
        </div>
      ))}
    </div>
  );
}
