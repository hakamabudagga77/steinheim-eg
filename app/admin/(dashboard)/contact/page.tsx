"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { CONTACT_LEAD_STATUS_LABELS, type ContactLead, type ContactLeadStatus } from "@/lib/contact-leads";
import { PageHeader, Panel, StatCard, StatCardSkeleton, Badge, EmptyState, ErrorState, SegmentedControl } from "@/components/admin/ui";

const STATUS_OPTIONS: ContactLeadStatus[] = ["new", "read", "replied", "archived"];
const FILTER_OPTIONS: Array<{ value: ContactLeadStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function statusTone(status: ContactLeadStatus): "accent" | "muted" | "neutral" | "positive" {
  if (status === "new") return "accent";
  if (status === "archived") return "muted";
  if (status === "replied") return "positive";
  return "neutral";
}

export default function AdminContactLeadsPage() {
  const [leads, setLeads] = useState<ContactLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContactLeadStatus | "all">("all");

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

  const counts = useMemo(() => {
    const c = { new: 0, read: 0, replied: 0, archived: 0 };
    leads?.forEach((l) => c[l.status]++);
    return c;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    if (filter === "all") return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  return (
    <div>
      <PageHeader
        eyebrow="Contact Leads"
        title={leads ? `${leads.length} enquir${leads.length === 1 ? "y" : "ies"}` : "Loading…"}
        subtitle="Submitted through the site's contact form."
      />

      {error && <ErrorState>{error}</ErrorState>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {leads ? (
          <>
            <StatCard icon={Mail} label="New" value={counts.new} accent />
            <StatCard icon={Mail} label="Read" value={counts.read} />
            <StatCard icon={Mail} label="Replied" value={counts.replied} />
            <StatCard icon={Mail} label="Archived" value={counts.archived} />
          </>
        ) : (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        )}
      </div>

      {leads && leads.length > 0 && (
        <div className="mt-6">
          <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        </div>
      )}

      {leads && leads.length === 0 && <EmptyState>No contact form submissions yet.</EmptyState>}
      {leads && leads.length > 0 && filteredLeads.length === 0 && <EmptyState>No leads in this filter.</EmptyState>}

      <div className="mt-6 space-y-3">
        {filteredLeads.map((lead) => {
          const expanded = expandedId === lead.id;
          return (
            <Panel key={lead.id} padded={false} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : lead.id)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-medium text-white/90">{lead.name}</p>
                    <Badge tone="muted">{lead.enquiryType}</Badge>
                  </div>
                  <p className="mt-1 truncate text-[13px] text-white/40">{lead.subject || lead.message.slice(0, 80)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <Badge tone={statusTone(lead.status)}>{CONTACT_LEAD_STATUS_LABELS[lead.status]}</Badge>
                  <span className="text-[12px] text-white/30">{fmtDate(lead.submittedAt)}</span>
                  <ChevronDown className={`h-4 w-4 text-white/30 transition ${expanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {expanded && (
                <div className="border-t border-white/[0.06] px-6 py-5">
                  <div className="grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-4">
                    <div>
                      <p className="text-white/35">Email</p>
                      <a href={`mailto:${lead.email}`} className="mt-1 block text-[#c9a961] underline decoration-white/20">
                        {lead.email}
                      </a>
                    </div>
                    <div>
                      <p className="text-white/35">Phone</p>
                      <p className="mt-1 text-white/75">{lead.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-white/35">{lead.enquiryType === "homeowner" ? "City" : "Company"}</p>
                      <p className="mt-1 text-white/75">{lead.cityOrCompany || "—"}</p>
                    </div>
                    <div>
                      <p className="text-white/35">Subject</p>
                      <p className="mt-1 text-white/75">{lead.subject || "—"}</p>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-[14px] leading-[1.7] text-white/70">{lead.message}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateStatus(lead.id, status)}
                        className={`rounded-full border px-4 py-1.5 text-[12px] transition ${
                          lead.status === status
                            ? "border-[#c9a961] bg-[#c9a961] text-black"
                            : "border-white/15 text-white/55 hover:border-white/30"
                        }`}
                      >
                        {CONTACT_LEAD_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
