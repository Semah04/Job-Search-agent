import Link from "next/link";
import { listJobs } from "@/lib/actions/jobs";
import { StatusSelect } from "@/components/status-select";
import { JobSearchForm } from "@/components/job-search-form";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await listJobs();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Jobs
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Saved and scored listings from the agent or quick search.
        </p>
      </div>

      <JobSearchForm />

      {jobs.length === 0 ? (
        <p className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
          No jobs yet. Ask the agent on the home page to search and save matches.
        </p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-lg font-semibold text-[var(--ink)] hover:underline"
                  >
                    {job.title}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">
                    {job.company} · {job.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {job.fitScore != null && (
                    <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
                      {job.fitScore}/100
                    </span>
                  )}
                  {job.application && (
                    <StatusSelect
                      jobId={job.id}
                      value={job.application.status}
                    />
                  )}
                </div>
              </div>
              {job.fitReason && (
                <p className="mt-2 text-sm text-[var(--muted)]">{job.fitReason}</p>
              )}
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
              >
                Open listing
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
