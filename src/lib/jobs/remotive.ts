export type NormalizedJob = {
  externalId: string;
  title: string;
  company: string;
  url: string;
  location: string;
  description: string;
  category: string;
  tags: string[];
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

const TECH_CATEGORIES = new Set([
  "software development",
  "data and analytics",
  "information technology",
  "artificial intelligence",
  "devops / sysadmin",
  "qa",
]);

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

function normalize(job: RemotiveJob): NormalizedJob {
  return {
    externalId: `remotive-${job.id}`,
    title: job.title,
    company: job.company_name,
    url: job.url,
    location: job.candidate_required_location?.trim() || "Remote",
    description: stripHtml(job.description ?? "").slice(0, 4000),
    category: job.category ?? "",
    tags: job.tags ?? [],
    source: "remotive",
  };
}

function matchesQuery(job: NormalizedJob, query?: string): boolean {
  if (!query?.trim()) return true;
  const tokens = query
    .toLowerCase()
    .split(/[\s,+/|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  if (!tokens.length) return true;

  const hay = [
    job.title,
    job.company,
    job.location,
    job.category,
    job.tags.join(" "),
    job.description.slice(0, 1200),
  ]
    .join(" ")
    .toLowerCase();

  // Prefer jobs that hit at least one meaningful token
  return tokens.some((t) => hay.includes(t));
}

function isTechJob(job: NormalizedJob): boolean {
  const cat = job.category.toLowerCase();
  if (TECH_CATEGORIES.has(cat)) return true;
  if (cat.includes("software") || cat.includes("dev") || cat.includes("data")) {
    return true;
  }
  return false;
}

export async function searchRemotiveJobs(params: {
  query?: string;
  category?: string;
  limit?: number;
  techOnly?: boolean;
}): Promise<NormalizedJob[]> {
  const url = new URL("https://remotive.com/api/remote-jobs");
  // Free Remotive API often ignores filters; we still pass them and filter locally.
  if (params.query?.trim()) {
    url.searchParams.set("search", params.query.trim());
  }
  if (params.category?.trim()) {
    url.searchParams.set("category", params.category.trim());
  }

  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  const techOnly = params.techOnly ?? true;

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Remotive API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as RemotiveResponse;
  let jobs = (data.jobs ?? []).map(normalize);

  if (techOnly) {
    const tech = jobs.filter(isTechJob);
    // If Remotive returns almost no tech rows, fall back to keyword filter on all
    jobs = tech.length ? tech : jobs;
  }

  const queried = jobs.filter((j) => matchesQuery(j, params.query));
  // If keyword filter wiped everything, keep the tech list so the UI isn't empty
  const pool = queried.length ? queried : jobs;

  return pool.slice(0, limit);
}
