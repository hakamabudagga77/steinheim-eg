"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { AssistantAction } from "@/lib/assistant/steinheim-assistant";
import { formatPrice, type Finish, type Product, type Series } from "@/lib/utils";

type CollectionStrategy = {
  headline: string;
  position: string;
  projectFit: string;
  specification: string;
  atmosphere: string;
};

type PackageRow = {
  slug: string;
  name: string;
  finish: string;
  model: string;
  quantity: number;
  price: number;
};

type CollectionAssistantPanelProps = {
  series: Series;
  products: Product[];
  finishes: Finish[];
  strategy: CollectionStrategy | undefined;
  packageRows: PackageRow[];
  omittedPackageItems: string[];
  packageFinishName: string;
  onAddPackage: () => void;
};

const suggestedQuestions = [
  "Is this collection better for homes or hotel projects?",
  "Which finish direction should I start with?",
  "Compare this collection with another Steinheim collection.",
  "Build a bathroom from this collection.",
];

function cleanText(text: string) {
  return text.replace(/\n\n\{"type":[\s\S]*$/m, "").trim();
}

function paragraphs(text: string) {
  return cleanText(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function CollectionAssistantPanel({
  series,
  products,
  finishes,
  strategy,
  packageRows,
  omittedPackageItems,
  packageFinishName,
  onAddPackage,
}: CollectionAssistantPanelProps) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [action, setAction] = useState<AssistantAction>(null);
  const [loading, setLoading] = useState(false);
  const streamTextRef = useRef("");
  const streamActionRef = useRef<AssistantAction>(null);

  const totalPackageReference = packageRows.reduce((sum, row) => sum + row.price * row.quantity, 0);

  const collectionContext = useMemo(
    () =>
      [
        "Current collection page context",
        `Collection: ${series.name}`,
        `Series code: ${series.code}`,
        `Collection description: ${series.description}`,
        strategy ? `Positioning: ${strategy.position}` : null,
        strategy ? `Project fit: ${strategy.projectFit}` : null,
        strategy ? `Specification logic: ${strategy.specification}` : null,
        strategy ? `Atmosphere: ${strategy.atmosphere}` : null,
        `Active finishes: ${finishes.map((finish) => finish.name).join(", ")}`,
        `Active product families: ${products.map((product) => product.name).join(", ")}`,
        packageRows.length
          ? `Suggested starter bathroom package in ${packageFinishName}: ${packageRows
              .map((row) => `${row.quantity}x ${row.name} (${row.model})`)
              .join("; ")}`
          : "No starter package rows available.",
        omittedPackageItems.length ? `Starter package omissions: ${omittedPackageItems.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    [finishes, omittedPackageItems, packageFinishName, packageRows, products, series, strategy]
  );

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setAnswer("");
    setAction(null);
    streamTextRef.current = "";
    streamActionRef.current = null;

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: "en",
          projectContext: collectionContext,
          messages: [
            {
              role: "user",
              content: `${collectionContext}\n\nCustomer question about this collection: ${trimmed}`,
            },
          ],
        }),
      });

      if (!response.ok || !response.body) throw new Error("Assistant request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const dataLine = event.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const payload = JSON.parse(dataLine.slice(6));
          if (payload.type === "meta" || payload.type === "done") {
            streamActionRef.current = payload.action ?? streamActionRef.current;
            setAction(streamActionRef.current);
          }
          if (payload.type === "delta") {
            streamTextRef.current = `${streamTextRef.current}${payload.text ?? ""}`;
            setAnswer(streamTextRef.current);
          }
        }
      }
    } catch {
      setAnswer("I could not reach the Steinheim Concierge right now. You can still browse the collection or add the starter package to your project board.");
    } finally {
      setLoading(false);
      setInput("");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <section className="border-y border-border-light bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-10">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-warm-gray">
            Steinheim concierge
          </p>
          <h2 className="mt-4 max-w-xl font-heading text-[clamp(2rem,4vw,4.4rem)] leading-[0.95] text-charcoal">
            Decide if {series.name} is the right language.
          </h2>
          <p className="mt-5 max-w-md text-[14px] leading-[1.85] text-warm-gray">
            Ask how this collection fits a home, hotel, compound, designer brief, or contractor schedule.
          </p>

          {packageRows.length > 0 && (
            <div className="mt-7 border border-charcoal/10 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                    Starter package
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.7] text-stone">
                    A practical first bathroom set in {packageFinishName}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onAddPackage}
                  className="inline-flex h-10 shrink-0 items-center justify-center bg-charcoal px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black"
                >
                  Add package
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                {packageRows.map((row) => (
                  <div
                    key={`${row.slug}-${row.finish}`}
                    className="flex items-center justify-between gap-3 border border-charcoal/6 bg-[#FAFAF8] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-charcoal">{row.name}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-warm-gray">
                        {row.model}
                      </p>
                    </div>
                    <span className="text-[11px] text-stone">×{row.quantity}</span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-warm-gray">
                Retail-reference package total: {formatPrice(totalPackageReference)}. Trade pricing requires confirmation.
              </p>
              {omittedPackageItems.length > 0 && (
                <p className="mt-2 text-[10px] leading-relaxed text-warm-gray">
                  Not active here: {omittedPackageItems.join(", ")}.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border border-charcoal/10 bg-[#FAFAF8] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-heading text-[28px] leading-none text-charcoal">{series.name} guide</p>
              <p className="mt-2 text-[12px] leading-[1.7] text-warm-gray">
                Catalogue-backed guidance for this collection, its active finishes, and its project fit.
              </p>
            </div>
            <span className="w-fit border border-charcoal/10 bg-white px-3 py-2 text-[9px] font-medium uppercase tracking-[0.16em] text-warm-gray">
              Catalogue grounded
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => ask(question)}
                className="border border-charcoal/10 bg-white px-4 py-3 text-left text-[11px] leading-[1.45] text-stone transition hover:border-charcoal/30"
              >
                {question}
              </button>
            ))}
          </div>

          {(answer || loading) && (
            <div className="mt-5 border border-charcoal/8 bg-white p-4">
              <div className="space-y-3 text-[13px] leading-[1.8] text-stone" dir="auto">
                {paragraphs(answer || "Reading the collection, finishes, and project context...").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {action && (
                  <Link
                    href={action.href}
                    className="inline-flex h-9 items-center justify-center bg-charcoal px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black"
                  >
                    {action.label}
                  </Link>
                )}
                {packageRows.length > 0 && (
                  <button
                    type="button"
                    onClick={onAddPackage}
                    className="inline-flex h-9 items-center justify-center border border-charcoal/15 bg-white px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:border-charcoal"
                  >
                    Add starter package
                  </button>
                )}
                <Link
                  href="/trade#smart-room-calculator"
                  className="inline-flex h-9 items-center justify-center border border-charcoal/15 bg-white px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:border-charcoal"
                >
                  Smart room calculator
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Ask about ${series.name}, finishes, project fit, or package logic...`}
              className="h-11 min-w-0 flex-1 border border-charcoal/12 bg-white px-3 text-[13px] outline-none transition focus:border-charcoal"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 bg-charcoal px-5 text-[9px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black disabled:opacity-30"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
