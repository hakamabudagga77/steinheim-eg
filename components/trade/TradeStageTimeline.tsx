import { TRADE_LEAD_JOURNEY_STAGES, TRADE_LEAD_STATUS_COPY, TRADE_LEAD_STATUS_LABELS, type TradeLeadStatus } from "@/lib/trade-leads";

export default function TradeStageTimeline({ status }: { status: TradeLeadStatus }) {
  if (status === "lost") {
    return (
      <div className="border border-charcoal/10 bg-white p-4">
        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">Project status</p>
        <p className="mt-3 font-heading text-[18px] text-charcoal" style={{ fontStyle: "italic" }}>
          {TRADE_LEAD_STATUS_LABELS.lost}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-warm-gray">{TRADE_LEAD_STATUS_COPY.lost}</p>
      </div>
    );
  }

  const currentIndex = Math.max(0, TRADE_LEAD_JOURNEY_STAGES.indexOf(status));
  const total = TRADE_LEAD_JOURNEY_STAGES.length;

  return (
    <div className="border border-charcoal/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">Project journey</p>
        <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-warm-gray/70">
          Step {currentIndex + 1} of {total}
        </p>
      </div>
      <div className="mt-4 flex gap-1">
        {TRADE_LEAD_JOURNEY_STAGES.map((stage, index) => (
          <div key={stage} className={`h-1 flex-1 rounded-full ${index <= currentIndex ? "bg-charcoal" : "bg-charcoal/10"}`} />
        ))}
      </div>
      <p className="mt-4 font-heading text-[18px] text-charcoal" style={{ fontStyle: "italic" }}>
        {TRADE_LEAD_STATUS_LABELS[status]}
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-warm-gray">{TRADE_LEAD_STATUS_COPY[status]}</p>
    </div>
  );
}
