export type NormalizedJob = {
  externalId: string;
  title: string;
  company: string;
  url: string;
  location: string;
  description: string;
  source: "remotive";
};

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location?: string;
  description?: string;
  category?: string;
  job_type?: string;
  tags?: string[];
};

type RemotiveResponse = {
  jobs?: RemotiveJob[];
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchRemotiveJobs(params: {
  query?: string;
  category?: string;
  limit?: number;
}): Promise<NormalizedJob[]> {
  const url = new URL("https://remotive.com/api/remote-jobs");
  if (params.query?.trim()) {
    url.searchParams.set("search", params.query.trim());
  }
  if (params.category?.trim()) {
    url.searchParams.set("category", params.category.trim());
  }
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Remotive API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as RemotiveResponse;
  const jobs = data.jobs ?? [];

  return jobs.slice(0, limit).map((job) => ({
    externalId: `remotive-${job.id}`,
    title: job.title,
    company: job.company_name,
    url: job.url,
    location: job.candidate_required_location?.trim() || "Remote",
    description: stripHtml(job.description ?? "").slice(0, 4000),
    source: "remotive" as const,
  }));
}
