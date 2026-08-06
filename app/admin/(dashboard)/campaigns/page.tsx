"use client";

import { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, Check } from "lucide-react";
import { PageHeader, Panel, ErrorState, Skeleton, Badge } from "@/components/admin/ui";
import type { CampaignRecord } from "@/lib/campaigns";

const EMPTY_COPY = { eyebrow: "", title: "", body: "", cta: "" };

function blankCampaign(): CampaignRecord {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() + 7);
  const end = new Date(today);
  end.setDate(today.getDate() + 14);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    id: `campaign-${Date.now()}`,
    enabled: true,
    startsAt: iso(start),
    endsAt: iso(end),
    href: "/collections",
    en: { ...EMPTY_COPY },
    ar: { ...EMPTY_COPY },
  };
}

function dateInput(value: string, onChange: (value: string) => void, label: string) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white/80 outline-none focus:border-[#0a84ff]"
      />
    </label>
  );
}

function textInput(value: string, onChange: (value: string) => void, label: string, placeholder = "") {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white/80 outline-none focus:border-[#0a84ff]"
      />
    </label>
  );
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  function reload(list: CampaignRecord[]) {
    setCampaigns(list);
    setNewIds((prev) => {
      const known = new Set(list.map((campaign) => campaign.id));
      return new Set([...prev].filter((id) => known.has(id)));
    });
  }

  useEffect(() => {
    fetch("/api/admin/campaigns")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load campaigns.");
        }
        return res.json();
      })
      .then((data: { campaigns: CampaignRecord[] }) => reload(data.campaigns))
      .catch((err) => setError(err.message));
  }, []);

  function update(id: string, patch: Partial<CampaignRecord>) {
    setCampaigns((prev) => prev?.map((campaign) => (campaign.id === id ? { ...campaign, ...patch } : campaign)) ?? null);
  }

  async function save(campaign: CampaignRecord) {
    const isNew = newIds.has(campaign.id);
    const missing =
      !campaign.en.eyebrow ||
      !campaign.en.title ||
      !campaign.en.body ||
      !campaign.en.cta ||
      !campaign.ar.eyebrow ||
      !campaign.ar.title ||
      !campaign.ar.body ||
      !campaign.ar.cta;
    if (missing) {
      alert("Fill in the copy in both English and Arabic before saving.");
      return;
    }
    setSavingId(campaign.id);
    setSavedId(null);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save.");
      }
      const data = (await res.json()) as { campaign: CampaignRecord };
      setCampaigns((prev) =>
        prev?.map((entry) => (entry.id === campaign.id ? data.campaign : entry)) ?? [data.campaign]
      );
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(campaign.id);
        return next;
      });
      setSavedId(campaign.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save this campaign.");
    } finally {
      setSavingId(null);
    }
  }

  async function remove(campaign: CampaignRecord) {
    if (!window.confirm(`Delete the "${campaign.id}" campaign? This removes it from the live site.`)) return;
    setDeletingId(campaign.id);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaign.id }),
      });
      if (!res.ok) throw new Error("Could not delete.");
      setCampaigns((prev) => prev?.filter((entry) => entry.id !== campaign.id) ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete this campaign.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Merchandising"
        title="Campaigns"
        subtitle="Seasonal banners, no code required. Fill in the dates, copy in English and Arabic, pick the link — and it goes live instantly, then disappears by itself."
      />

      {error && <ErrorState>{error}</ErrorState>}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-[12px] text-white/40">
          {campaigns ? `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"} configured` : "Loading…"}
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setCampaigns((prev) => {
              const next = [...(prev ?? []), blankCampaign()];
              setNewIds((ids) => new Set(ids).add(next[next.length - 1].id));
              return next;
            });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#0a84ff] px-4 py-2 text-[12.5px] font-medium text-white transition hover:bg-[#3d9dff]"
        >
          <Plus className="h-4 w-4" />
          New campaign
        </button>
      </div>

      {!campaigns && !error && (
        <div className="mt-8 space-y-4">
          <Panel>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-20 w-full" />
          </Panel>
          <Panel>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-20 w-full" />
          </Panel>
        </div>
      )}

      {campaigns?.length === 0 && !error && (
        <div className="mt-8">
          <Panel className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Megaphone className="h-8 w-8 text-white/20" />
            <p className="text-[13px] text-white/35">
              No campaigns yet. Press “New campaign” — the banner will appear on the home page automatically on the
              start date.
            </p>
          </Panel>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {campaigns?.map((campaign) => (
          <Panel key={campaign.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Megaphone className="h-4 w-4 text-white/35" />
                <p className="text-[14px] font-medium text-white/90">{campaign.id}</p>
                {newIds.has(campaign.id) && <Badge tone="warning">New</Badge>}
                <Badge tone={campaign.enabled ? "positive" : "neutral"}>{campaign.enabled ? "Live" : "Paused"}</Badge>
              </div>
              <div className="flex items-center gap-3">
                {savedId === campaign.id && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
                <label className="flex cursor-pointer items-center gap-2">
                  <span className="text-[12px] text-white/45">Show</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={campaign.enabled}
                    onClick={() => update(campaign.id, { enabled: !campaign.enabled })}
                    className={`relative h-5 w-9 rounded-full transition ${
                      campaign.enabled ? "bg-[#0a84ff]" : "bg-white/[0.12]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                        campaign.enabled ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </label>
                <button
                  type="button"
                  onClick={() => save(campaign)}
                  disabled={savingId === campaign.id}
                  className="rounded-full bg-[#0a84ff] px-4 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#3d9dff] disabled:opacity-30"
                >
                  {savingId === campaign.id ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(campaign)}
                  disabled={deletingId === campaign.id}
                  aria-label={`Delete ${campaign.id}`}
                  className="rounded-full border border-white/10 p-2 text-white/40 transition hover:border-red-400/40 hover:text-red-400 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {dateInput(campaign.startsAt, (value) => update(campaign.id, { startsAt: value }), "Starts")}
              {dateInput(campaign.endsAt, (value) => update(campaign.id, { endsAt: value }), "Ends")}
              {textInput(campaign.href, (value) => update(campaign.id, { href: value }), "Link", "/collections")}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">English</p>
                <div className="grid grid-cols-1 gap-3">
                  {textInput(campaign.en.eyebrow, (value) => update(campaign.id, { en: { ...campaign.en, eyebrow: value } }), "Eyebrow")}
                  {textInput(campaign.en.title, (value) => update(campaign.id, { en: { ...campaign.en, title: value } }), "Title")}
                  {textInput(campaign.en.body, (value) => update(campaign.id, { en: { ...campaign.en, body: value } }), "Body")}
                  {textInput(campaign.en.cta, (value) => update(campaign.id, { en: { ...campaign.en, cta: value } }), "Button")}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">عربي</p>
                <div className="grid grid-cols-1 gap-3">
                  {textInput(campaign.ar.eyebrow, (value) => update(campaign.id, { ar: { ...campaign.ar, eyebrow: value } }), "العنوان الفرعي")}
                  {textInput(campaign.ar.title, (value) => update(campaign.id, { ar: { ...campaign.ar, title: value } }), "العنوان")}
                  {textInput(campaign.ar.body, (value) => update(campaign.id, { ar: { ...campaign.ar, body: value } }), "النص")}
                  {textInput(campaign.ar.cta, (value) => update(campaign.id, { ar: { ...campaign.ar, cta: value } }), "الزر")}
                </div>
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-white/30">
              Shows on the home page from {campaign.startsAt} through {campaign.endsAt}, and disappears automatically
              the day after it ends — nothing to remember.
            </p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
