"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/layout/PageTransition";
import ProductCard from "@/components/product/ProductCard";
import TradeSetupOpenButton from "@/components/trade/TradeSetupOpenButton";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import {
  hasActiveRoomNeeds,
  REQUIREMENT_TYPE_LABELS,
  type RequirementType,
  type RoomGroup,
} from "@/lib/trade-project";
import { getProductsByType } from "@/lib/utils";

export default function ShopByNeedClient() {
  const { project, addItem } = useTradeProject();
  const hasProject = hasActiveRoomNeeds(project);
  const displayName = project.details.projectName || "your project";

  const activeRooms = useMemo(
    () =>
      (project.roomPlan?.groups ?? []).filter(
        (group) => group.count > 0 && group.productNeeds.some((need) => need.quantity > 0)
      ),
    [project.roomPlan]
  );

  const neededTypes = useMemo(() => {
    const seen = new Set<RequirementType>();
    activeRooms.forEach((group) => {
      group.productNeeds.forEach((need) => {
        if (need.quantity > 0) seen.add(need.type);
      });
    });
    return Array.from(seen);
  }, [activeRooms]);

  function candidatesFor(type: RequirementType): RoomGroup[] {
    return activeRooms.filter((group) => group.productNeeds.some((need) => need.type === type && need.quantity > 0));
  }

  function handleAdd(type: RequirementType, slug: string, finish: string, quantity: number, scopeId?: string) {
    const candidates = candidatesFor(type);
    const target = candidates.find((group) => group.scopeId === scopeId) ?? candidates[0] ?? null;
    addItem(slug, finish, quantity, target ? {
      scopeId: target.scopeId,
      scopeName: target.roomLabel,
      scopeSummary: `${target.count} ${target.count === 1 ? "room" : "rooms"}`,
    } : undefined);
  }

  return (
    <PageTransition>
      <div className="bg-[#ece9e2] text-[#0a0a0a]">
        <div className="px-5 pb-4 pt-[124px] sm:px-8 lg:px-16">
          <div className="mx-auto max-w-[1780px]">
            <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">For {displayName}</p>
            <h1
              className="mt-4 max-w-3xl font-heading text-[clamp(2.4rem,5.5vw,5.6rem)] font-light leading-[0.92] tracking-[-0.045em]"
              style={{ fontStyle: "italic" }}
            >
              Shop by need.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-[1.85] text-black/50">
              Everything {displayName} still needs, grouped by product type across every collection.
            </p>
          </div>
        </div>

        {!hasProject ? (
          <section className="px-5 py-24 sm:px-8 lg:px-16">
            <div className="mx-auto max-w-[1780px]">
              <div className="border border-black/10 bg-white p-10 text-center sm:p-16">
                <p className="font-heading text-[22px] leading-tight text-black" style={{ fontStyle: "italic" }}>
                  Set up your project first
                </p>
                <p className="mx-auto mt-3 max-w-md text-[13px] leading-[1.7] text-black/50">
                  Tell us your rooms and what each one needs — then this page fills in with exactly the products you&apos;re looking for.
                </p>
                <div className="mt-6 flex justify-center">
                  <TradeSetupOpenButton variant="primary" />
                </div>
              </div>
            </div>
          </section>
        ) : (
          neededTypes.map((type, index) => {
            const products = getProductsByType(type);
            if (products.length === 0) return null;
            const candidates = candidatesFor(type);
            return (
              <section
                key={type}
                className={`px-5 py-16 sm:px-8 lg:px-16 lg:py-20 ${index > 0 ? "border-t border-black/8" : ""}`}
              >
                <div className="mx-auto max-w-[1780px]">
                  <div className="mb-16 text-center">
                    <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">Shop</p>
                    <h2 className="mt-4 font-heading text-[clamp(1.8rem,3vw,2.6rem)] font-normal tracking-[-0.03em]">
                      {REQUIREMENT_TYPE_LABELS[type]}
                    </h2>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-2 gap-10 md:gap-12 lg:grid-cols-3 lg:gap-y-20"
                  >
                    {products.map((product) => (
                      <ProductCard
                        key={product.slug}
                        product={product}
                        roomOptions={candidates}
                        onAdd={(slug, finish, quantity, scopeId) => handleAdd(type, slug, finish, quantity, scopeId)}
                      />
                    ))}
                  </motion.div>
                </div>
              </section>
            );
          })
        )}
      </div>
    </PageTransition>
  );
}
