"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

const suggestions = [
  "Search remote TypeScript backend jobs and save the top 5",
  "Find react node jobs matching my skills",
  "Draft a cover letter for the best saved job",
];

export function ChatPanel({
  provider,
}: {
  provider: "google" | "openai" | null;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat();

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="mb-4 space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
          Your search agent
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Chat to search Remotive jobs, rank them against your profile, save
          roles, and draft cover letters. Fill Profile first for better matches.
        </p>
      </div>

      {provider === "google" && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          Using free <strong>Google Gemini</strong> for the agent.
        </div>
      )}

      {provider === "openai" && (
        <div className="mb-4 rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          Using <strong>OpenAI</strong> for the agent.
        </div>
      )}

      {!provider && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Offline agent mode</p>
          <p className="mt-1 text-amber-900/90">
            Add a free Gemini key to{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code>:
            <code className="ml-1 rounded bg-amber-100 px-1">
              GOOGLE_GENERATIVE_AI_API_KEY
            </code>
            . Get one at{" "}
            <a
              className="underline"
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio
            </a>
            , then restart{" "}
            <code className="rounded bg-amber-100 px-1">npm run dev</code>.
            Chat still searches Remotive without a key.
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => sendMessage({ text: s })}
            className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-left text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            Example: “Search remote fullstack Node jobs and save the top 3.”
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
              message.role === "user"
                ? "ml-8 bg-[var(--accent-soft)] text-[var(--ink)]"
                : "mr-8 bg-[var(--chip)] text-[var(--ink)]"
            }`}
          >
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              {message.role === "user" ? "You" : "Agent"}
            </div>
            {message.parts.map((part, i) => {
              if (part.type === "text") {
                return (
                  <div key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                    {part.text}
                  </div>
                );
              }
              if (part.type.startsWith("tool-")) {
                const toolName = part.type.replace("tool-", "");
                const state =
                  "state" in part ? String(part.state) : "unknown";
                return (
                  <div
                    key={`${message.id}-${i}`}
                    className="mt-2 rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 font-mono text-[11px] text-[var(--muted)]"
                  >
                    tool:{toolName} · {state}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}

        {busy && (
          <p className="text-xs text-[var(--muted)]">Agent is working…</p>
        )}
        {error && (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error.message}
          </p>
        )}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = input.trim();
          if (!text || busy) return;
          sendMessage({ text });
          setInput("");
        }}
      >
        <input
          className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:ring-2"
          value={input}
          placeholder="Ask the agent to search, rank, save, or draft…"
          onChange={(e) => setInput(e.currentTarget.value)}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
