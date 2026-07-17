"use client";

import { useMemo, useState } from "react";
import { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import ProductCard from "@/components/product/ProductCard";
import RoomProgressPanel from "@/components/trade/RoomProgressPanel";
import { REQUIREMENT_TYPE_LABELS, type RequirementType, type RoomGroup } from "@/lib/trade-project";
import { getProductBySlug, getProductsByType, getSeriesById } from "@/lib/utils";

function sectionId(type: RequirementType) {
  return `shop-type-${type}`;
}

export default function ShopProductsStep() {
  const { project, addItem } = useTradeProject();
  const [targets, setTargets] = useState<Record<string, string>>({});

  const activeRooms = project.roomPlan?.groups.filter((group) => group.count > 0) ?? [];

  const neededTypes = useMemo(() => {
    const seen = new Set<RequirementType>();
    activeRooms.forEach((group) => {
      group.productNeeds.forEach((need) => {
        if (need.quantity > 0) seen.add(need.type);
      });
    });
    return Array.from(seen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.roomPlan]);

  function candidatesFor(type: RequirementType): RoomGroup[] {
    return activeRooms.filter((group) => group.productNeeds.some((need) => need.type === type && need.quantity > 0));
  }

  function targetFor(type: RequirementType): RoomGroup | null {
    const candidates = candidatesFor(type);
    if (candidates.length === 0) return null;
    const explicit = targets[type];
    return candidates.find((room) => room.scopeId === explicit) ?? candidates[0];
  }

  function handleSelectNeed(scopeId: string, type: RequirementType) {
    setTargets((current) => ({ ...current, [type]: scopeId }));
    document.getElementById(sectionId(type))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleAdd(type: RequirementType, slug: string, finish: string, quantity: number) {
    const target = targetFor(type);
    if (!target) return;
    const existingForScope = project.items.filter((item) => item.scopeId === target.scopeId);
    const seriesNames = Array.from(
      new Set(
        [...existingForScope.map((item) => item.slug), slug]
          .map((entrySlug) => getProductBySlug(entrySlug)?.series)
          .filter((series): series is string => Boolean(series))
          .map((series) => getSeriesById(series)?.name ?? series)
      )
    );
    const totalUnits = existingForScope.reduce((sum, item) => sum + item.quantity, 0) + quantity;
    const scopeSummary = `${totalUnits} unit${totalUnits === 1 ? "" : "s"}${
      seriesNames.length ? ` · ${seriesNames.length > 1 ? `across ${seriesNames.join(", ")}` : seriesNames[0]}` : ""
    }`;
    addItem(slug, finish, quantity, {
      scopeId: target.scopeId,
      scopeName: target.roomLabel,
      scopeSummary,
    });
  }

  if (neededTypes.length === 0) {
    return (
      <p className="border border-charcoal/10 bg-white p-6 text-center text-[13px] text-warm-gray">
        Check at least one product need in the previous step before shopping.
      </p>
    );
  }

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2">
      <div className="mx-auto max-w-[1780px] px-5 py-10 sm:px-8 sm:py-14 lg:px-16">
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-16">
          <div className="space-y-20">
            {neededTypes.map((type) => {
              const candidates = candidatesFor(type);
              const target = targetFor(type);
              const products = getProductsByType(type);
              return (
                <section key={type} id={sectionId(type)} className="scroll-mt-24 border-t border-charcoal/8 pt-12 first:border-t-0 first:pt-0">
                  <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">Shop</p>
                      <h3 className="mt-2 font-heading text-[clamp(2rem,4vw,3rem)] leading-tight text-charcoal" style={{ fontStyle: "italic" }}>
                        {REQUIREMENT_TYPE_LABELS[type]}
                      </h3>
                    </div>
                    {candidates.length > 1 && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {candidates.map((room) => (
                          <button
                            key={room.scopeId}
                            type="button"
                            onClick={() => setTargets((current) => ({ ...current, [type]: room.scopeId }))}
                            className={`rounded-full border px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.08em] transition ${
                              target?.scopeId === room.scopeId
                                ? "border-charcoal bg-charcoal text-white"
                                : "border-charcoal/15 bg-white/60 text-warm-gray hover:border-charcoal hover:text-charcoal"
                            }`}
                          >
                            {room.roomLabel}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <StaggerContainer className="grid grid-cols-2 gap-10 md:gap-12 lg:grid-cols-3 lg:gap-y-20">
                    {products.map((product) => (
                      <StaggerItem key={product.slug}>
                        <ProductCard product={product} onAdd={(slug, finish, quantity) => handleAdd(type, slug, finish, quantity)} />
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </section>
              );
            })}
          </div>

          <aside className="mt-14 lg:mt-0 lg:self-start">
            <details className="lg:hidden" open>
              <summary className="cursor-pointer select-none text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                Your rooms
              </summary>
              <div className="mt-3">
                <RoomProgressPanel onSelectNeed={handleSelectNeed} />
              </div>
            </details>
            <div className="hidden lg:block lg:sticky lg:top-24">
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">Your rooms</p>
              <RoomProgressPanel onSelectNeed={handleSelectNeed} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
