"use client";

import { useState, useTransition } from "react";
import { saveProfile, type ProfileInput } from "@/lib/actions/profile";

type Props = {
  initial: ProfileInput;
};

export function ProfileForm({ initial }: Props) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          await saveProfile(form);
          setMessage("Profile saved.");
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Name</span>
          <input
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Min salary (optional)</span>
          <input
            type="number"
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
            value={form.salaryMin ?? ""}
            onChange={(e) =>
              update(
                "salaryMin",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-[var(--muted)]">Target roles</span>
        <input
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
          placeholder="Backend engineer, fullstack TypeScript…"
          value={form.targetRoles}
          onChange={(e) => update("targetRoles", e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-[var(--muted)]">Skills</span>
        <input
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
          placeholder="Node, React, PostgreSQL, Docker…"
          value={form.skills}
          onChange={(e) => update("skills", e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-[var(--muted)]">Locations</span>
        <input
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
          placeholder="Remote, EU, Paris…"
          value={form.locations}
          onChange={(e) => update("locations", e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
        <input
          type="checkbox"
          checked={form.remoteOk}
          onChange={(e) => update("remoteOk", e.target.checked)}
        />
        Open to remote roles
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-[var(--muted)]">Resume text</span>
        <textarea
          className="min-h-48 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 font-mono text-xs leading-relaxed"
          placeholder="Paste your resume here for cover-letter drafting…"
          value={form.resumeText}
          onChange={(e) => update("resumeText", e.target.value)}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
        {message && <span className="text-sm text-[var(--muted)]">{message}</span>}
      </div>
    </form>
  );
}
