"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

function cleanAssistantText(text: string) {
  return text.replace(/\n\n\{"type":[\s\S]*$/m, "").trim();
}

function splitParagraphs(text: string) {
  return cleanAssistantText(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function SteinheimAssistant({ locale }: { locale: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
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
    <section className="min-h-screen bg-white pt-28 text-charcoal">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 sm:px-10 lg:grid-cols-[0.82fr_1.18fr] lg:px-16 xl:px-20">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-warm-gray">
            Steinheim AI Concierge
          </p>
          <h1 className="mt-5 max-w-xl font-heading text-[clamp(3rem,6vw,6.2rem)] leading-[0.9]">
            A smarter way to specify.
          </h1>
          <p className="mt-7 max-w-md text-[14px] leading-[1.9] text-warm-gray">
            Ask about products, finishes, care, warranty, hotel schedules, developer projects,
            or which collection fits a room. The assistant is locked to the Steinheim Egypt catalogue.
          </p>

          <div className="mt-8 border border-charcoal/10 bg-[#FAFAF8] p-5">
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
              Guardrails
            </p>
            <div className="mt-4 grid gap-3 text-[12px] leading-[1.7] text-stone">
              <p>Only recommends active Egypt catalogue products and finishes.</p>
              <p>Labels prices as retail-reference, never guaranteed trade pricing.</p>
              <p>Does not invent stock, delivery dates, project quantities, or origin claims.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/trade#smart-room-calculator"
              className="inline-flex h-11 items-center justify-center bg-charcoal px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-white"
            >
              Build schedule
            </Link>
            <Link
              href="/collections"
              className="inline-flex h-11 items-center justify-center border border-charcoal/15 px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-charcoal"
            >
              Browse catalogue
            </Link>
          </div>
        </aside>

        <div className="border border-charcoal/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.06)]">
          <div className="border-b border-charcoal/10 bg-[#FAFAF8] p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-heading text-[28px] leading-none">Concierge</p>
                <p className="mt-1 text-[12px] text-warm-gray">Catalogue-backed assistant for Steinheim Egypt</p>
              </div>
              <span className="w-fit border border-charcoal/10 bg-white px-3 py-2 text-[9px] font-medium uppercase tracking-[0.16em] text-warm-gray">
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
                        ? "bg-charcoal text-white"
                        : "border border-charcoal/10 bg-[#FAFAF8] text-charcoal"
                    } p-4 sm:p-5`}
                  >
                    <div className="space-y-3 text-[14px] leading-[1.8]">
                      {splitParagraphs(message.content || (loading ? "Thinking..." : "")).map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>

                    {message.role === "assistant" && message.action && (
                      <Link
                        href={message.action.href}
                        className="mt-4 inline-flex h-10 items-center justify-center bg-charcoal px-4 text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black"
                      >
                        {message.action.label}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-charcoal/10 p-4 sm:p-6">
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => askAssistant(prompt)}
                  className="border border-charcoal/10 bg-[#FAFAF8] px-4 py-3 text-left text-[11px] leading-[1.5] text-stone transition hover:border-charcoal/30"
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
                className="h-[52px] flex-1 border border-charcoal/12 bg-white px-4 text-[14px] outline-none transition focus:border-charcoal"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-[52px] bg-charcoal px-7 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition hover:bg-black disabled:opacity-30"
              >
                {loading ? "Thinking" : "Ask"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
