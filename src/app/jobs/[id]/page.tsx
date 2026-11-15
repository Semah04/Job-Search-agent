import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/actions/jobs";
import { StatusSelect } from "@/components/status-select";
import { CoverLetterEditor } from "@/components/cover-letter-editor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <div className="space-y-5">
      <Link href="/jobs" className="text-sm text-[var(--muted)] hover:underline">
        ← Back to jobs
      </Link>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
              {job.title}
            </h1>
            <p className="mt-1 text-[var(--muted)]">
              {job.company} · {job.location}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {job.fitScore != null && (
              <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
                Fit {job.fitScore}/100
              </span>
            )}
            {job.application && (
              <StatusSelect jobId={job.id} value={job.application.status} />
            )}
          </div>
        </div>

        {job.fitReason && (
          <p className="mt-3 text-sm text-[var(--muted)]">{job.fitReason}</p>
        )}

        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
        >
          View original posting
        </a>

        {job.description && (
          <p className="mt-4 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
            {job.description}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Cover letter
        </h2>
        <p className="mt-1 mb-3 text-sm text-[var(--muted)]">
          Ask the agent to draft one, or edit manually here.
        </p>
        <CoverLetterEditor
          jobId={job.id}
          initial={job.application?.coverLetter ?? ""}
        />
      </div>
    </div>
  );
}
