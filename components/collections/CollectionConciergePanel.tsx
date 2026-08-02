"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/CartContext";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { useConcierge } from "@/components/assistant/useConcierge";
import { buildStarterPackage } from "@/lib/starter-package";
import { hasActiveRoomNeeds } from "@/lib/trade-project";
import { formatPrice, getFinishById, type Series } from "@/lib/utils";

const QUESTION_KEYS = ["homesOrHotels", "finishDirection", "compare", "buildBathroom"] as const;

/**
 * The in-context concierge for a collection page. All of its copy was already
 * written and translated in `collectionAssistantPanel` — no component had ever
 * consumed it.
 *
 * Two jobs: answer "is this collection right for my project?" against the real
 * catalogue, and turn the answer into a first basket in one action.
 */
export default function CollectionConciergePanel({
  series,
  finish,
  livePrices,
  locale,
}: {
  series: Series;
  finish: string;
  livePrices: Record<string, number>;
  locale: string;
}) {
  const t = useTranslations("collectionAssistantPanel");
  const [input, setInput] = useState("");
  const [added, setAdded] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const { addItem: addToCart } = useCart();
  const { project, addItem: addToProject, setOpen: setProjectOpen } = useTradeProject();
  const isTradeCustomer = hasActiveRoomNeeds(project);

  const pkg = useMemo(
    () => buildStarterPackage(series.id, finish, livePrices),
    [series.id, finish, livePrices]
  );

  const finishName = getFinishById(finish)?.name ?? finish;

  // Without this the assistant received "is this collection better for homes
  // or hotels?" with no idea which collection was meant, and answered
  // generically. The API has always accepted projectContext.
  const projectContext = useMemo(() => {
    const starter = pkg.lines.map((line) => line.product.name).join(", ");
    return [
      `The visitor is on the ${series.name} collection page.`,
      `Selected finish: ${finishName}.`,
      starter && `Starter set shown: ${starter}.`,
      `Treat "this collection" as ${series.name}.`,
    ]
      .filter(Boolean)
      .join(" ");
  }, [series.name, finishName, pkg.lines]);

  const { messages, loading, ask } = useConcierge({
    locale,
    unreachableMessage: t("unreachable"),
    projectContext,
  });

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input;
    setInput("");
    void ask(value);
  }

  // Trade visitors are building a schedule, so the package goes to the project
  // board; everyone else gets a cart. Same branch as the product page.
  function addPackage() {
    for (const line of pkg.lines) {
      if (isTradeCustomer) addToProject(line.product.slug, line.finish, 1);
      else addToCart(line.product.slug, line.finish, 1);
    }
    if (isTradeCustomer) setProjectOpen(true);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <section className="border-y border-charcoal/10 bg-[#f7f5f1] px-5 py-16 sm:px-8 lg:px-16 lg:py-24">
      <div className="mx-auto grid max-w-[1780px] gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        {/* Ask */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">
            {t("concierge")}
          </p>
          <h2
            className="mt-4 max-w-[20ch] font-heading text-[clamp(1.9rem,3.4vw,2.9rem)] leading-tight text-charcoal"
            style={{ fontStyle: "italic" }}
          >
            {t("decideHeadline", { series: series.name })}
          </h2>
          <p className="mt-4 max-w-[54ch] text-[14px] leading-relaxed text-warm-gray">
            {t("askBody")}
          </p>

          {messages.length > 0 && (
            <div
              ref={threadRef}
              data-lenis-prevent
              className="mt-8 max-h-[320px] space-y-4 overflow-y-auto border border-charcoal/10 bg-white p-5"
            >
              {messages.map((message) => (
                <div key={message.id}>
                  <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-warm-gray/70">
                    {message.role === "user" ? "—" : t("concierge")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-charcoal">
                    {message.content ||
                      (loading ? t("readingContext") : "")}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {QUESTION_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                disabled={loading}
                onClick={() => void ask(t(`questions.${key}`))}
                className="border border-charcoal/15 px-4 py-2 text-start text-[11px] leading-snug text-charcoal transition hover:border-charcoal disabled:opacity-50"
              >
                {t(`questions.${key}`)}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("askPlaceholder", { series: series.name })}
              aria-label={t("ask")}
              className="h-11 min-w-0 flex-1 border border-charcoal/15 bg-white px-4 text-[13px] text-charcoal outline-none transition focus:border-charcoal"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 shrink-0 bg-charcoal px-6 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-50"
            >
              {t("ask")}
            </button>
          </form>

          <p className="mt-3 text-[9px] uppercase tracking-[0.14em] text-warm-gray/60">
            {t("catalogueGrounded")}
          </p>
        </div>

        {/* Starter package */}
        <aside className="border border-charcoal/10 bg-white p-6 lg:p-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">
            {t("starterPackage")}
          </p>
          <h3 className="mt-3 font-heading text-[22px] leading-tight text-charcoal">
            {t("guide", { series: series.name })}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-warm-gray">
            {t("starterPackageBody", { finish: finishName })}
          </p>

          {pkg.lines.length > 0 && (
            <ul className="mt-6 divide-y divide-charcoal/8 border-y border-charcoal/8">
              {pkg.lines.map((line) => (
                <li key={line.product.slug} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="text-[13px] text-charcoal">{line.product.name}</span>
                  <span className="shrink-0 text-[13px] font-medium text-charcoal">
                    {formatPrice(line.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {pkg.unavailable.length > 0 && (
            <p className="mt-4 text-[12px] leading-relaxed text-warm-gray">
              {t("notActive", {
                items: pkg.unavailable.map((product) => product.name).join("، "),
              })}
            </p>
          )}

          {pkg.lines.length > 0 && (
            <>
              <p className="mt-4 text-[11px] leading-relaxed text-warm-gray/80">
                {t("packageTotal", { total: formatPrice(pkg.total) })}
              </p>
              <button
                type="button"
                onClick={addPackage}
                className="mt-6 flex h-12 w-full items-center justify-center bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black"
              >
                {added ? t("addPackage") + " ✓" : t("addStarterPackage")}
              </button>
            </>
          )}

          <Link
            href="/trade"
            className="mt-3 flex h-11 w-full items-center justify-center border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
          >
            {t("smartRoomCalculator")}
          </Link>

          <p className="mt-4 text-[11px] leading-relaxed text-warm-gray/70">{t("guideBody")}</p>
        </aside>
      </div>
    </section>
  );
}
