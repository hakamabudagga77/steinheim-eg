"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AssistantAction, AssistantMessage } from "@/lib/assistant/steinheim-assistant";

export type ConciergeMessage = AssistantMessage & {
  id: string;
  action?: AssistantAction;
};

/**
 * The SSE read loop behind the concierge, extracted so the full-page
 * assistant and the in-context collection panel share one implementation
 * rather than drifting apart.
 *
 * `unreachableMessage` is passed in because each surface phrases the failure
 * differently and owns its own translations.
 */
export function useConcierge({
  locale,
  unreachableMessage,
  initialMessages = [],
  projectContext,
}: {
  locale: string;
  unreachableMessage: string;
  initialMessages?: ConciergeMessage[];
  /** What the visitor is currently looking at. The assistant API has always
   * accepted this field and no client ever sent it, so "is this collection
   * right for a hotel?" arrived with no idea which collection was meant. */
  projectContext?: string;
}) {
  const [messages, setMessages] = useState<ConciergeMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const messageIdRef = useRef(0);
  const streamTextRef = useRef("");
  const streamActionRef = useRef<AssistantAction>(null);
  const streamFlushRef = useRef(0);

  useEffect(
    () => () => {
      cancelAnimationFrame(streamFlushRef.current);
      abortRef.current?.abort();
    },
    []
  );

  const ask = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || loading) return;

      messageIdRef.current += 1;
      const requestId = messageIdRef.current;
      const assistantId = `assistant-${requestId}`;

      let conversation: Array<{ role: string; content: string }> = [];
      setMessages((current) => {
        conversation = current
          .filter((message) => message.role === "user" || message.role === "assistant")
          .map(({ role, content }) => ({ role, content }));
        return [
          ...current,
          { id: `user-${requestId}`, role: "user", content: trimmed },
          { id: assistantId, role: "assistant", content: "", action: null },
        ];
      });

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
            projectContext,
            messages: [...conversation, { role: "user", content: trimmed }],
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
              // Coalesce token updates to one state flush per animation frame —
              // per-token setState re-renders the whole thread dozens of times
              // a second.
              if (!streamFlushRef.current) {
                streamFlushRef.current = requestAnimationFrame(() => {
                  streamFlushRef.current = 0;
                  setMessages((current) =>
                    current.map((message) =>
                      message.id === assistantId
                        ? { ...message, content: streamTextRef.current, action: streamActionRef.current }
                        : message
                    )
                  );
                });
              }
            }
          }
        }

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: streamTextRef.current, action: streamActionRef.current }
              : message
          )
        );
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, content: unreachableMessage } : message
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [locale, loading, unreachableMessage, projectContext]
  );

  return { messages, loading, ask };
}
