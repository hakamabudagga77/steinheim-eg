"use client";

import { useTradeProject } from "@/components/catalogue/TradeProjectContext";

export default function TradeOpenButton({
  variant = "primary",
}: {
  variant?: "primary" | "outline" | "white";
}) {
  const { project, setOpen } = useTradeProject();
  const count = project.items.length;

  const base =
    "inline-flex h-[50px] items-center gap-3 px-9 text-[10px] font-medium uppercase tracking-[0.15em] transition cursor-pointer";

  const styles = {
    primary:
      "bg-white text-charcoal hover:bg-white/90",
    outline:
      "border border-charcoal text-charcoal hover:bg-charcoal hover:text-white",
    white:
      "bg-white text-charcoal hover:bg-white/90",
  };

  return (
    <button type="button" onClick={() => setOpen(true)} className={`${base} ${styles[variant]}`}>
      {count > 0 ? (
        <>
          Open project board
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-charcoal text-[9px] text-white">
            {count}
          </span>
        </>
      ) : (
        "Open project board"
      )}
    </button>
  );
}
