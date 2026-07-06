"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { AssistantAction, AssistantMessage } from "@/lib/assistant/steinheim-assistant";

type ChatMessage = AssistantMessage & {
  id: string;
  action?: AssistantAction;
};

const starterPrompts = [
  "I am building a premium five-star hotel in Egypt. What should I specify?",
  "Warm beige stone, walnut vanity, soft lighting. Which collection and finish?",
  "What is STM-60-M500-002 and what is its catalogue price?",
  "I need 80 bathrooms for a New Cairo compound. Where should I start?",
];

const welcomeMessage =
  "Tell me what you are building, the room type, preferred finish, and whether this is for a home, designer presentation, hotel, compound, or commercial project. I’ll stay inside the Steinheim Egypt catalogue and call out anything that needs confirmation.";

const cleanWelcomeMessage =
  "Tell me what you are building, the room type, preferred finish, and whether this is for a home, designer presentation, hotel, compound, or commercial project. I'll stay inside the Steinheim Egypt catalogue and call out anything that needs confirmation.";

function cleanAssistantText(text: string) {
  return text.replace(/\n\n\{"type":[\s\S]*$/m, "").trim();
}

function splitParagraphs(text: string) {
  return cleanAssistantText(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function ConciergeRitual() {
  return (
    <div className="min-w-[260px] space-y-4">
      <div className="relative mx-auto h-28 w-28">
        <div className="absolute inset-0 rounded-full border border-black/10" />
        <div className="absolute inset-3 rounded-full border border-black/10" />
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#f1efe8] via-white to-[#b69a63] shadow-[inset_0_0_18px_rgba(0,0,0,0.08)]" />
        <div className="absolute left-1/2 top-1/2 h-[1px] w-20 origin-left animate-[steinheimSweep_1.9s_linear_infinite] bg-black/35" />
        <div className="absolute inset-0 animate-[steinheimPulse_2.4s_ease-in-out_infinite] rounded-full border border-black/18" />
      </div>
      <div className="grid grid-cols-6 gap-2">
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
      <p className="text-[11px] uppercase tracking-[0.24em] text-black/42">
        Reading catalogue, finish, and project logic
      </p>
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

export default function SteinheimAssistant({ locale }: { locale: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: cleanWelcomeMessage || welcomeMessage ||
        "Tell me what you are building, the room type, preferred finish, and whether this is for a home, designer presentation, hotel, compound, or commercial project. I’ll stay inside the Steinheim Egypt catalogue and call out anything that needs confirmation.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messageIdRef = useRef(0);
  const streamTextRef = useRef("");
  const streamActionRef = useRef<AssistantAction>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const conversationForApi = useMemo(
    () =>
      messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map(({ role, content }) => ({ role, content })),
    [messages]
  );

  async function askAssistant(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    messageIdRef.current += 1;
    const requestId = messageIdRef.current;
    const userMessage: ChatMessage = {
      id: `user-${requestId}`,
      role: "user",
      content: trimmed,
    };
    const assistantId = `assistant-${requestId}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      action: null,
    };

    const nextMessages = [...messages, userMessage, assistantMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    streamTextRef.current = "";
    streamActionRef.current = null;

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: [...conversationForApi, { role: "user", content: trimmed }],
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Assistant request failed with ${response.status}`);
      }

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
          }
          if (payload.type === "delta") {
            streamTextRef.current = `${streamTextRef.current}${payload.text ?? ""}`;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: streamTextRef.current, action: streamActionRef.current }
                  : message
              )
            );
          }
        }
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, content: streamTextRef.current, action: streamActionRef.current } : message
        )
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  "I could not reach the assistant service. Try again, or use the trade page to build the project schedule directly.",
              }
            : message
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAssistant(input);
  }

  return (
    <section className="min-h-screen bg-[#ebe8e1] pt-28 text-[#111]">
      <div className="mx-auto grid max-w-[1780px] gap-10 px-5 pb-20 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[11px] font-medium uppercase tracking-[0.36em] text-black/42">
            Steinheim AI Concierge
          </p>
          <h1 className="mt-6 max-w-xl font-heading text-[clamp(3.3rem,6.8vw,7.4rem)] font-light leading-[0.86] tracking-[-0.06em]">
            A smarter way to specify.
          </h1>
          <p className="mt-8 max-w-md text-[16px] leading-[1.9] text-black/58">
            Ask about products, finishes, care, warranty, hotel schedules, developer projects,
            or which collection fits a room. The assistant is locked to the Steinheim Egypt catalogue.
          </p>

          <div className="mt-10 overflow-hidden rounded-[28px] bg-black">
            <div className="relative aspect-[16/10]">
              <Image
                src="/images/generated/gessi/steinheim-specification-story.png"
                alt="Steinheim specification desk with finishes and product"
                fill
                priority
                quality={92}
                sizes="(min-width: 1024px) 36vw, 100vw"
                className="object-cover transition duration-[1400ms] hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-transparent" />
              <p className="absolute bottom-5 left-5 text-[11px] uppercase tracking-[0.28em] text-white/72">
                Catalogue intelligence
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-black/10 bg-[#f6f3ee] p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-black/42">
              Guardrails
            </p>
            <div className="mt-5 grid gap-3 text-[13px] leading-[1.75] text-black/58">
              <p>Only recommends active Egypt catalogue products and finishes.</p>
              <p>Labels prices as retail-reference, never guaranteed trade pricing.</p>
              <p>Does not invent stock, delivery dates, project quantities, or origin claims.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/trade#smart-room-calculator"
              className="inline-flex h-12 items-center justify-center rounded-full bg-black px-6 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition hover:bg-black/80"
            >
              Build schedule
            </Link>
            <Link
              href="/collections"
              className="inline-flex h-12 items-center justify-center rounded-full border border-black/20 px-6 text-[10px] font-medium uppercase tracking-[0.16em] text-black transition hover:border-black"
            >
              Browse catalogue
            </Link>
          </div>
        </aside>

        <div className="overflow-hidden rounded-[30px] border border-black/10 bg-[#f8f6f1] shadow-[0_32px_90px_rgba(0,0,0,0.09)]">
          <div className="border-b border-black/10 bg-[#f3f0ea] p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-heading text-[34px] font-light leading-none tracking-[-0.04em]">Concierge</p>
                <p className="mt-2 text-[12px] text-black/45">Catalogue-backed assistant for Steinheim Egypt</p>
              </div>
              <span className="w-fit rounded-full border border-black/10 bg-white px-4 py-2 text-[9px] font-medium uppercase tracking-[0.18em] text-black/45">
                Catalogue grounded
              </span>
            </div>
          </div>

          <div ref={chatContainerRef} className="max-h-[62vh] min-h-[520px] overflow-y-auto scroll-smooth p-4 sm:p-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] ${
                      message.role === "user"
                        ? "rounded-[22px] rounded-br-[6px] bg-black text-white"
                        : "rounded-[22px] rounded-bl-[6px] border border-black/10 bg-white text-black"
                    } p-4 sm:p-5 shadow-[0_12px_34px_rgba(0,0,0,0.04)]`}
                  >
                    {message.role === "assistant" && !message.content && loading ? (
                      <ConciergeRitual />
                    ) : (
                      <div className="space-y-3 text-[14px] leading-[1.8]">
                        {splitParagraphs(message.content).map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    )}

                    {message.role === "assistant" && message.action && (
                      <Link
                        href={message.action.href}
                        className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-black px-5 text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black/80"
                      >
                        {message.action.label}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-black/10 bg-[#f3f0ea] p-4 sm:p-6">
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => askAssistant(prompt)}
                  className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-left text-[11px] leading-[1.5] text-black/58 transition hover:border-black/30"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about a product, finish, project, hotel schedule, warranty..."
                className="h-[54px] flex-1 rounded-full border border-black/12 bg-white px-5 text-[14px] outline-none transition focus:border-black"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-[54px] rounded-full bg-black px-8 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition hover:bg-black/80 disabled:opacity-30"
              >
                {loading ? "Reading" : "Ask"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
