"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, ArrowUpRight } from "lucide-react";
import { CONTACT_LEAD_STATUS_LABELS, type ContactLead, type ContactLeadStatus } from "@/lib/contact-leads";
import { PageHeader, StatCard, StatCardSkeleton, Badge, EmptyState, ErrorState, SegmentedControl } from "@/components/admin/ui";

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

function fmtRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  // Inbox convention: opening an item auto-selects the first one, and mirrors
  // a mail client by marking a "new" lead read the moment it's opened.
  useEffect(() => {
    if (filteredLeads.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!filteredLeads.some((l) => l.id === selectedId)) {
      setSelectedId(filteredLeads[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLeads]);

  const selected = filteredLeads.find((l) => l.id === selectedId) ?? null;

  useEffect(() => {
    if (selected && selected.status === "new") {
      updateStatus(selected.id, "read");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

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

      {leads && filteredLeads.length > 0 && (
        <div className="mt-6 flex gap-5 rounded-2xl border border-white/[0.08] bg-[#131316]">
          {/* Inbox list pane */}
          <div className="w-[300px] shrink-0 divide-y divide-white/[0.05] overflow-y-auto border-r border-white/[0.08] py-1">
            {filteredLeads.map((lead) => {
              const active = lead.id === selectedId;
              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setSelectedId(lead.id)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                    active ? "bg-[#0a84ff]/[0.09]" : "hover:bg-white/[0.025]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {lead.status === "new" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a84ff]" />}
                      <span className={`truncate text-[13.5px] ${lead.status === "new" ? "font-semibold text-white" : "text-white/75"}`}>
                        {lead.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10.5px] text-white/30">{fmtRelative(lead.submittedAt)}</span>
                  </div>
                  <p className="truncate text-[12px] text-white/40">{lead.subject || lead.message.slice(0, 60)}</p>
                </button>
              );
            })}
          </div>

          {/* Reading pane */}
          {selected && (
            <div className="min-w-0 flex-1 px-7 py-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-heading text-[20px] tracking-[-0.01em] text-white">{selected.name}</h2>
                    <Badge tone="muted">{selected.enquiryType}</Badge>
                  </div>
                  <p className="mt-1 text-[13px] text-white/35">{fmtDate(selected.submittedAt)}</p>
                </div>
                <Badge tone={statusTone(selected.status)}>{CONTACT_LEAD_STATUS_LABELS[selected.status]}</Badge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-5 text-[13px] sm:grid-cols-4">
                <div>
                  <p className="text-white/35">Email</p>
                  <a href={`mailto:${selected.email}`} className="mt-1 flex items-center gap-1 text-[#0a84ff] underline decoration-white/20">
                    {selected.email}
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <p className="text-white/35">Phone</p>
                  <p className="mt-1 text-white/75">{selected.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-white/35">{selected.enquiryType === "homeowner" ? "City" : "Company"}</p>
                  <p className="mt-1 text-white/75">{selected.cityOrCompany || "—"}</p>
                </div>
                <div>
                  <p className="text-white/35">Subject</p>
                  <p className="mt-1 text-white/75">{selected.subject || "—"}</p>
                </div>
              </div>

              <p className="mt-5 whitespace-pre-wrap border-t border-white/[0.06] pt-5 text-[14.5px] leading-[1.75] text-white/70">
                {selected.message}
              </p>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateStatus(selected.id, status)}
                    className={`rounded-full border px-4 py-1.5 text-[12px] transition ${
                      selected.status === status
                        ? "border-[#0a84ff] bg-[#0a84ff] text-white"
                        : "border-white/15 text-white/55 hover:border-white/30"
                    }`}
                  >
                    {CONTACT_LEAD_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
