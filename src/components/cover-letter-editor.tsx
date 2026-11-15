"use client";

import { useState, useTransition } from "react";
import { saveCoverLetter } from "@/lib/actions/jobs";

export function CoverLetterEditor({
  jobId,
  initial,
}: {
  jobId: string;
  initial: string;
}) {
  const [text, setText] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <textarea
        className="min-h-56 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm leading-relaxed"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="No cover letter yet."
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              await saveCoverLetter(jobId, text);
              setMessage("Saved.");
            });
          }}
        >
          {pending ? "Saving…" : "Save letter"}
        </button>
        {message && <span className="text-sm text-[var(--muted)]">{message}</span>}
      </div>
    </div>
  );
}
