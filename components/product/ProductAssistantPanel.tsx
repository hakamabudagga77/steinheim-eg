"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { AssistantAction } from "@/lib/assistant/steinheim-assistant";
import type { Finish, Product, Series, Variant } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

export type ProductPackageItem = {
  slug: string;
  name: string;
  finish: string;
  model: string;
  quantity: number;
};

type ProductAssistantPanelProps = {
  product: Product;
  series: Series | undefined;
  variant: Variant;
  finish: Finish | undefined;
  isInProject: boolean;
  onAddToProject: () => void;
  packageItems: ProductPackageItem[];
  omittedPackageItems: string[];
  onAddPackage: () => void;
};

const suggestedQuestions = [
  "Is this a good choice for a hotel project?",
  "Which bathroom type is this best for?",
  "Is this finish easy to maintain?",
  "What should I pair with it?",
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

export default function ProductAssistantPanel({
  product,
  series,
  variant,
  finish,
  isInProject,
  onAddToProject,
  packageItems,
  omittedPackageItems,
  onAddPackage,
}: ProductAssistantPanelProps) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [action, setAction] = useState<AssistantAction>(null);
  const [loading, setLoading] = useState(false);
  const streamTextRef = useRef("");
  const streamActionRef = useRef<AssistantAction>(null);

  const productContext = useMemo(
    () =>
      [
        `Current product page context`,
        `Collection: ${series?.name ?? product.series}`,
        `Product: ${product.name}`,
        `Slug: ${product.slug}`,
        `Type: ${product.type}`,
        `Selected finish: ${finish?.name ?? variant.finish}`,
        `Selected model: ${variant.model}`,
        `Retail-reference price: ${formatPrice(variant.price)}`,
        product.material ? `Material: ${product.material}` : null,
        product.cartridge ? `Cartridge: ${product.cartridge}` : null,
        product.aerator ? `Aerator: ${product.aerator}` : null,
        product.pressureRange ? `Pressure range: ${product.pressureRange}` : null,
        `Available finishes: ${product.variants.map((entry) => entry.finish).join(", ")}`,
        `Suggested active package: ${
          packageItems.length
            ? packageItems.map((item) => `${item.quantity}x ${item.name} (${item.model})`).join("; ")
            : "No package rows available"
        }`,
        omittedPackageItems.length
          ? `Package omissions for this selection: ${omittedPackageItems.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    [finish?.name, omittedPackageItems, packageItems, product, series?.name, variant.finish, variant.model, variant.price]
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
          projectContext: productContext,
          messages: [
            {
              role: "user",
              content: `${productContext}\n\nCustomer question about this product: ${trimmed}`,
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
      setAnswer("I could not reach the Steinheim Concierge right now. You can still add this product to your project board and request confirmation from the team.");
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
    <div className="mt-6 border border-charcoal/10 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
            Steinheim concierge
          </p>
          <p className="mt-2 text-[13px] leading-[1.7] text-stone">
            Product-aware guidance for {series?.name ?? product.series} {product.name} in{" "}
            {finish?.name ?? variant.finish}.
          </p>
        </div>
        <span className="shrink-0 border border-charcoal/10 bg-[#FAFAF8] px-2.5 py-1.5 text-[8px] font-medium uppercase tracking-[0.14em] text-warm-gray">
          Catalogue
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {suggestedQuestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => ask(question)}
            className="border border-charcoal/10 bg-[#FAFAF8] px-3 py-2 text-left text-[10px] leading-[1.45] text-stone transition hover:border-charcoal/30"
          >
            {question}
          </button>
        ))}
      </div>

      {packageItems.length > 0 && (
        <div className="mt-4 border border-charcoal/8 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                Suggested bathroom package
              </p>
              <p className="mt-2 text-[12px] leading-[1.7] text-stone">
                Built from active {series?.name ?? product.series} catalogue items in{" "}
                {finish?.name ?? variant.finish}.
              </p>
            </div>
            <button
              type="button"
              onClick={onAddPackage}
              className="inline-flex h-9 shrink-0 items-center justify-center bg-charcoal px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black"
            >
              Add full package
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            {packageItems.map((item) => (
              <div
                key={`${item.slug}-${item.finish}`}
                className="flex items-center justify-between gap-3 border border-charcoal/6 bg-[#FAFAF8] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-charcoal">{item.name}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-warm-gray">
                    {item.model}
                  </p>
                </div>
                <span className="text-[11px] text-stone">×{item.quantity}</span>
              </div>
            ))}
          </div>

          {omittedPackageItems.length > 0 && (
            <p className="mt-3 text-[10px] leading-[1.6] text-warm-gray">
              Not active for this selection: {omittedPackageItems.join(", ")}.
            </p>
          )}
        </div>
      )}

      {(answer || loading) && (
        <div className="mt-4 border border-charcoal/8 bg-white p-4">
          <div className="space-y-3 text-[13px] leading-[1.8] text-stone" dir="auto">
            {paragraphs(answer || "Thinking through the product, finish, and project context...").map((paragraph) => (
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
            <button
              type="button"
              onClick={onAddToProject}
              className="inline-flex h-9 items-center justify-center border border-charcoal/15 bg-white px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:border-charcoal"
            >
              {isInProject ? "Open project board" : "Add to project"}
            </button>
            {packageItems.length > 1 && (
              <button
                type="button"
                onClick={onAddPackage}
                className="inline-flex h-9 items-center justify-center border border-charcoal/15 bg-white px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:border-charcoal"
              >
                Add full package
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about fit, finish, maintenance, or project use..."
          className="h-10 min-w-0 flex-1 border border-charcoal/12 bg-white px-3 text-[12px] outline-none transition focus:border-charcoal"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-10 bg-charcoal px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black disabled:opacity-30"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
