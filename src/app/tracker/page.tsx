import Link from "next/link";
import { listApplications } from "@/lib/actions/jobs";
import { StatusSelect } from "@/components/status-select";

export const dynamic = "force-dynamic";

const columns = ["SAVED", "APPLIED", "INTERVIEWING", "REJECTED"] as const;

export default async function TrackerPage() {
  const apps = await listApplications();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Tracker
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Application pipeline. Update status here or via the agent.
        </p>
      </div>

      {apps.length === 0 ? (
        <p className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
          Nothing tracked yet. Save jobs from the agent chat.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((status) => {
            const items = apps.filter((a) => a.status === status);
            return (
              <section
                key={status}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3"
              >
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {status} ({items.length})
                </h2>
                <ul className="space-y-2">
                  {items.map((app) => (
                    <li
                      key={app.id}
                      className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3"
                    >
                      <Link
                        href={`/jobs/${app.job.id}`}
                        className="font-medium hover:underline"
                      >
                        {app.job.title}
                      </Link>
                      <p className="text-xs text-[var(--muted)]">
                        {app.job.company}
                      </p>
                      <div className="mt-2">
                        <StatusSelect jobId={app.job.id} value={app.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
