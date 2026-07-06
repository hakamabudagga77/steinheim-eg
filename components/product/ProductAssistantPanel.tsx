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

function ProductThinkingRitual() {
  return (
    <div className="grid gap-5 sm:grid-cols-[112px_1fr] sm:items-center">
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 rounded-full border border-black/10" />
        <div className="absolute inset-3 rounded-full border border-black/10" />
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#f7f5ef] via-white to-[#c8a657] shadow-[inset_0_0_18px_rgba(0,0,0,0.08)]" />
        <div className="absolute left-1/2 top-1/2 h-px w-20 origin-left animate-[steinheimSweep_1.9s_linear_infinite] bg-black/35" />
        <div className="absolute inset-0 animate-[steinheimPulse_2.4s_ease-in-out_infinite] rounded-full border border-black/18" />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42">
          Reading product logic
        </p>
        <div className="mt-4 grid max-w-sm grid-cols-6 gap-2">
          {["#d9d9d7", "#c6bfb0", "#252527", "#c8a657", "#8a653d", "#57524a"].map((color, index) => (
            <span
              key={color}
              className="h-2 rounded-full"
              style={{
                backgroundColor: color,
                animation: `steinheimBars 1.25s ease-in-out ${index * 0.08}s infinite`,
              }}
            />
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-[1.65] text-black/48">
          Checking the selected finish, model code, room fit, and project context before answering.
        </p>
      </div>
      <style jsx>{`
        @keyframes steinheimSweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes steinheimPulse {
          0%,
          100% {
            opacity: 0.22;
            transform: scale(0.92);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.06);
          }
        }
        @keyframes steinheimBars {
          0%,
          100% {
            transform: scaleY(0.45);
            opacity: 0.35;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
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
    <div className="rounded-[32px] border border-black/10 bg-[#f8f6f1] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.06)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-black/42">
            Steinheim concierge
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-[1.75] text-black/58">
            Product-aware guidance for {series?.name ?? product.series} {product.name} in{" "}
            {finish?.name ?? variant.finish}.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-2 text-[9px] font-medium uppercase tracking-[0.16em] text-black/45">
          Catalogue
        </span>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {suggestedQuestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => ask(question)}
            className="rounded-full border border-black/10 bg-white px-4 py-3 text-left text-[12px] leading-[1.45] text-black/58 transition hover:border-black/25 hover:text-black"
          >
            {question}
          </button>
        ))}
      </div>

      {packageItems.length > 0 && (
        <div className="mt-5 rounded-[26px] border border-black/8 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-black/42">
                Suggested bathroom package
              </p>
              <p className="mt-2 text-[13px] leading-[1.7] text-black/55">
                Built from active {series?.name ?? product.series} catalogue items in{" "}
                {finish?.name ?? variant.finish}.
              </p>
            </div>
            <button
              type="button"
              onClick={onAddPackage}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-black px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition hover:bg-black/85"
            >
              Add full package
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {packageItems.map((item) => (
              <div
                key={`${item.slug}-${item.finish}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-black/6 bg-[#f8f6f1] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-black">{item.name}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-black/42">
                    {item.model}
                  </p>
                </div>
                <span className="text-[12px] text-black/55">x{item.quantity}</span>
              </div>
            ))}
          </div>

          {omittedPackageItems.length > 0 && (
            <p className="mt-3 text-[11px] leading-[1.6] text-black/42">
              Not active for this selection: {omittedPackageItems.join(", ")}.
            </p>
          )}
        </div>
      )}

      {(answer || loading) && (
        <div className="mt-5 rounded-[26px] border border-black/8 bg-white p-5">
          {loading && !answer ? (
            <ProductThinkingRitual />
          ) : (
            <div className="space-y-3 text-[14px] leading-[1.8] text-black/62" dir="auto">
              {paragraphs(answer).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {action && (
              <Link
                href={action.href}
                className="inline-flex h-10 items-center justify-center rounded-full bg-black px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition hover:bg-black/85"
              >
                {action.label}
              </Link>
            )}
            <button
              type="button"
              onClick={onAddToProject}
              className="inline-flex h-10 items-center justify-center rounded-full border border-black/15 bg-white px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-black transition hover:border-black"
            >
              {isInProject ? "Open project board" : "Add to project"}
            </button>
            {packageItems.length > 1 && (
              <button
                type="button"
                onClick={onAddPackage}
                className="inline-flex h-10 items-center justify-center rounded-full border border-black/15 bg-white px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-black transition hover:border-black"
              >
                Add full package
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-5 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about fit, finish, maintenance, or project use..."
          className="h-12 min-w-0 flex-1 rounded-full border border-black/10 bg-white px-5 text-[13px] outline-none transition focus:border-black/35"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-12 rounded-full bg-black px-6 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition hover:bg-black/85 disabled:opacity-30"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
