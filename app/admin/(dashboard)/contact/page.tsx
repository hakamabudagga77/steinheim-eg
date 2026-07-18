"use client";

import { useEffect, useState } from "react";
import { CONTACT_LEAD_STATUS_LABELS, type ContactLead, type ContactLeadStatus } from "@/lib/contact-leads";

const STATUS_OPTIONS: ContactLeadStatus[] = ["new", "read", "replied", "archived"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminContactLeadsPage() {
  const [leads, setLeads] = useState<ContactLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/contact")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load leads.");
        }
        return res.json();
      })
      .then((data) => setLeads(data.leads))
      .catch((err) => setError(err.message));
  }, []);

  async function updateStatus(id: string, status: ContactLeadStatus) {
    const res = await fetch("/api/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setLeads((prev) => prev?.map((lead) => (lead.id === id ? data.lead : lead)) ?? null);
  }

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-black/40">Contact Leads</p>
      <h1 className="mt-2 font-heading text-[32px] tracking-[-0.02em]">
        {leads ? `${leads.length} enquir${leads.length === 1 ? "y" : "ies"}` : "Loading…"}
      </h1>

      {error && <p className="mt-6 text-[14px] text-red-600">{error}</p>}

      {leads && leads.length === 0 && (
        <p className="mt-6 text-[14px] text-black/45">No contact form submissions yet.</p>
      )}

      <div className="mt-8 space-y-3">
        {leads?.map((lead) => {
          const expanded = expandedId === lead.id;
          return (
            <div key={lead.id} className="rounded-xl border border-black/8 bg-white">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : lead.id)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-medium">{lead.name}</p>
                    <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-black/50">
                      {lead.enquiryType}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[13px] text-black/45">
                    {lead.subject || lead.message.slice(0, 80)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                      lead.status === "new"
                        ? "bg-black text-white"
                        : lead.status === "archived"
                          ? "bg-black/5 text-black/40"
                          : "bg-black/8 text-black/60"
                    }`}
                  >
                    {CONTACT_LEAD_STATUS_LABELS[lead.status]}
                  </span>
                  <span className="text-[12px] text-black/35">{fmtDate(lead.submittedAt)}</span>
                </div>
              </button>

              {expanded && (
                <div className="border-t border-black/8 px-6 py-5">
                  <div className="grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-4">
                    <div>
                      <p className="text-black/40">Email</p>
                      <a href={`mailto:${lead.email}`} className="mt-1 block underline">{lead.email}</a>
                    </div>
                    <div>
                      <p className="text-black/40">Phone</p>
                      <p className="mt-1">{lead.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-black/40">{lead.enquiryType === "homeowner" ? "City" : "Company"}</p>
                      <p className="mt-1">{lead.cityOrCompany || "—"}</p>
                    </div>
                    <div>
                      <p className="text-black/40">Subject</p>
                      <p className="mt-1">{lead.subject || "—"}</p>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-[14px] leading-[1.7] text-black/75">{lead.message}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateStatus(lead.id, status)}
                        className={`rounded-full border px-4 py-1.5 text-[12px] transition ${
                          lead.status === status
                            ? "border-black bg-black text-white"
                            : "border-black/15 text-black/55 hover:border-black/30"
                        }`}
                      >
                        {CONTACT_LEAD_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
