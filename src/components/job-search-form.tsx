"use client";

import { useState, useTransition } from "react";
import { searchAndSaveJobs } from "@/lib/actions/search";

export function JobSearchForm() {
  const [query, setQuery] = useState("typescript backend");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await searchAndSaveJobs(query, 10);
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setMessage(`Saved ${result.count} jobs from Remotive.`);
        });
      }}
    >
      <label className="block flex-1 space-y-1 text-sm">
        <span className="text-[var(--muted)]">Quick search (no AI key needed)</span>
        <input
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. react node remote"
        />
      </label>
      <button
        type="submit"
        disabled={pending || !query.trim()}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Searching…" : "Search & save"}
      </button>
      {message && (
        <p className="w-full text-sm text-[var(--muted)] sm:basis-full">{message}</p>
      )}
    </form>
  );
}
