"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Pencil, X, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">{eyebrow}</p>
      <h1 className="mt-2 font-heading text-[32px] tracking-[-0.02em] text-white">{title}</h1>
      {subtitle && <p className="mt-2 text-[13px] text-white/40">{subtitle}</p>}
    </div>
  );
}

export function Panel({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-[#131316] shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] ${padded ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  accent = false,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: { direction: "up" | "down" | "flat"; label: string };
  accent?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      <Panel className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">{label}</p>
          {Icon && (
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                accent ? "bg-[#c9a961]/12 text-[#c9a961]" : "bg-white/[0.06] text-white/40"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <p className="mt-3 font-heading text-[28px] tabular-nums tracking-[-0.02em] text-white">{value}</p>
        {(hint || trend) && (
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 font-medium ${
                  trend.direction === "up"
                    ? "text-emerald-400"
                    : trend.direction === "down"
                      ? "text-red-400"
                      : "text-white/40"
                }`}
              >
                {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.label}
              </span>
            )}
            {hint && <span className="text-white/30">{hint}</span>}
          </div>
        )}
      </Panel>
    </motion.div>
  );
}

const BADGE_TONES = {
  neutral: "bg-white/[0.06] text-white/55",
  accent: "bg-[#c9a961]/15 text-[#c9a961]",
  positive: "bg-emerald-400/12 text-emerald-400",
  warning: "bg-amber-400/12 text-amber-300",
  danger: "bg-red-400/12 text-red-400",
  muted: "bg-white/[0.04] text-white/30",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3.5 py-1.5 text-[12px] transition ${
            value === opt.value ? "bg-[#c9a961] text-black font-medium" : "text-white/50 hover:text-white/80"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Panel className="flex items-center justify-center py-14 text-center">
      <p className="text-[13px] text-white/35">{children}</p>
    </Panel>
  );
}

export function ErrorState({ children }: { children: ReactNode }) {
  return (
    <Panel className="border-red-400/20 bg-red-400/[0.04]">
      <p className="text-[13px] text-red-300">{children}</p>
    </Panel>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <Panel>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-4 h-7 w-24" />
      <Skeleton className="mt-3 h-3 w-16" />
    </Panel>
  );
}

export function InlineEdit({
  value,
  onSave,
  type = "text",
  prefix,
  className = "",
  align = "left",
  confirmMessage,
}: {
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "number";
  prefix?: string;
  className?: string;
  align?: "left" | "right";
  /** If provided, shows a native confirm() with this message before saving. Receives the new value. */
  confirmMessage?: (newValue: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function commit() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    if (confirmMessage && !window.confirm(confirmMessage(draft))) {
      return;
    }
    setSaving(true);
    setError(false);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
    setError(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={`group inline-flex items-center gap-1.5 rounded px-1 py-0.5 transition hover:bg-white/[0.06] ${
          align === "right" ? "flex-row-reverse" : ""
        } ${className}`}
      >
        <span className={value ? "" : "text-white/25"}>
          {value ? prefix : ""}
          {value || "—"}
        </span>
        <Pencil className="h-3 w-3 text-white/0 transition group-hover:text-white/35" />
      </button>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <input
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        disabled={saving}
        className={`w-20 rounded border border-[#c9a961]/50 bg-black/40 px-1.5 py-0.5 text-white outline-none focus:border-[#c9a961] ${className}`}
      />
      {saving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
      ) : (
        <>
          <button type="button" onClick={commit} className="text-emerald-400 hover:text-emerald-300">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={cancel} className="text-white/30 hover:text-white/60">
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
      {error && <span className="text-[10px] text-red-400">Failed</span>}
    </span>
  );
}
