"use client";

import { useState } from "react";
import type { TradeLead } from "@/lib/trade-leads";

export function DocumentsList({ leadId, initialDocuments }: { leadId: string; initialDocuments: TradeLead["documents"] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!label.trim() || !url.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocuments(data.documents);
      setLabel("");
      setUrl("");
    } catch {
      // Leave the form as-is; admin can retry.
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(documentId: string) {
    if (!window.confirm("Remove this document from the lead? The client will no longer see it.")) return;
    setRemovingId(documentId);
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocuments(data.documents);
    } catch {
      // Leave the list as-is; admin can retry.
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Documents</p>
      <div className="rounded-xl border border-white/[0.08] bg-black/20">
        {documents.length > 0 && (
          <div className="divide-y divide-white/[0.06]">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 p-3">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-[12px] text-[#c9a961] underline decoration-white/20">
                  {doc.label}
                </a>
                <button
                  type="button"
                  disabled={removingId === doc.id}
                  onClick={() => handleRemove(doc.id)}
                  className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-white/35 transition hover:text-red-400 disabled:opacity-40"
                >
                  {removingId === doc.id ? "…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-2 border-t border-white/[0.08] p-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label, e.g. Commercial invoice"
            className="h-9 min-w-[160px] flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 text-[12px] text-white outline-none focus:border-[#c9a961]"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="h-9 min-w-[160px] flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 text-[12px] text-white outline-none focus:border-[#c9a961]"
          />
          <button
            type="button"
            disabled={!label.trim() || !url.trim() || adding}
            onClick={handleAdd}
            className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#c9a961] px-4 text-[11px] font-medium text-black transition hover:bg-[#d8bb7a] disabled:opacity-30"
          >
            {adding ? "…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
