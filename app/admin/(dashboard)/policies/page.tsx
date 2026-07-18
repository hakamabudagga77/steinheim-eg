"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { PageHeader, Panel, ErrorState, Skeleton } from "@/components/admin/ui";

interface ShopPolicy {
  id: string;
  type: string;
  title: string;
  body: string;
}

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<ShopPolicy[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingType, setSavingType] = useState<string | null>(null);
  const [savedType, setSavedType] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/policies")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load policies.");
        }
        return res.json();
      })
      .then((data: { policies: ShopPolicy[] }) => {
        setPolicies(data.policies);
        const initial: Record<string, string> = {};
        data.policies.forEach((p) => (initial[p.type] = stripHtml(p.body)));
        setDrafts(initial);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function save(policy: ShopPolicy) {
    if (!window.confirm(`Publish these changes to the live "${policy.title}" page on the site? This is visible to customers immediately.`)) {
      return;
    }
    setSavingType(policy.type);
    setSavedType(null);
    try {
      const htmlBody = drafts[policy.type]
        .split(/\n{2,}/)
        .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
        .join("\n");
      const res = await fetch("/api/admin/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: policy.type, body: htmlBody }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save.");
      }
      setSavedType(policy.type);
      setTimeout(() => setSavedType(null), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save this policy.");
    } finally {
      setSavingType(null);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Policies" title="Store policies" subtitle="Refund, shipping, privacy, and terms — synced with Shopify" />

      {error && <ErrorState>{error}</ErrorState>}

      {!policies && !error && (
        <div className="mt-8 space-y-4">
          <Panel>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-24 w-full" />
          </Panel>
          <Panel>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-24 w-full" />
          </Panel>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {policies?.map((policy) => (
          <Panel key={policy.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-white/35" />
                <p className="text-[14px] font-medium text-white/90">{policy.title}</p>
              </div>
              <div className="flex items-center gap-3">
                {savedType === policy.type && <span className="text-[12px] text-emerald-400">Saved</span>}
                <button
                  type="button"
                  onClick={() => save(policy)}
                  disabled={savingType === policy.type || drafts[policy.type] === stripHtml(policy.body)}
                  className="rounded-full bg-[#c9a961] px-4 py-1.5 text-[12px] font-medium text-black transition hover:bg-[#d8bb7a] disabled:opacity-30"
                >
                  {savingType === policy.type ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
            <textarea
              value={drafts[policy.type] ?? ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [policy.type]: e.target.value }))}
              rows={6}
              className="mt-4 w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-[13px] leading-[1.6] text-white/80 outline-none focus:border-[#c9a961]"
            />
          </Panel>
        ))}
      </div>
    </div>
  );
}
