"use client";

import { ApplicationStatus } from "@prisma/client";
import { useTransition } from "react";
import { updateStatus } from "@/lib/actions/jobs";

const options: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEWING",
  "REJECTED",
];

export function StatusSelect({
  jobId,
  value,
}: {
  jobId: string;
  value: ApplicationStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs"
      value={value}
      disabled={pending}
      onChange={(e) => {
        const status = e.target.value as ApplicationStatus;
        startTransition(async () => {
          await updateStatus(jobId, status);
        });
      }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
