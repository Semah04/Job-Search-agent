"use server";

import { ApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { searchRemotiveJobs } from "@/lib/jobs/remotive";

function scoreJob(
  text: string,
  skills: string[],
  roles: string[],
): { fitScore: number; fitReason: string } {
  const hay = text.toLowerCase();
  const hitSkills = skills.filter((s) => s && hay.includes(s.toLowerCase()));
  const hitRoles = roles.filter((r) => r && hay.includes(r.toLowerCase()));
  const fitScore = Math.min(
    100,
    40 + hitSkills.length * 12 + hitRoles.length * 15,
  );
  const parts = [
    hitRoles.length ? `role keywords: ${hitRoles.join(", ")}` : null,
    hitSkills.length ? `skills: ${hitSkills.join(", ")}` : null,
  ].filter(Boolean);
  return {
    fitScore,
    fitReason: parts.length
      ? `Matched ${parts.join("; ")}`
      : "General remote match",
  };
}

export async function searchAndSaveJobs(query: string, limit = 10) {
  const q = query.trim();
  if (!q) return { ok: false as const, error: "Query is required", count: 0 };

  const profile = await prisma.profile.findUnique({ where: { id: "default" } });
  const skills = (profile?.skills ?? "")
    .split(/[,|/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const roles = (profile?.targetRoles ?? "")
    .split(/[,|/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const jobs = await searchRemotiveJobs({
    query: q,
    category: "software-dev",
    limit: Math.min(Math.max(limit, 1), 20),
  });

  let saved = 0;
  for (const job of jobs) {
    const { fitScore, fitReason } = scoreJob(
      `${job.title} ${job.company} ${job.description}`,
      skills,
      roles,
    );
    const row = await prisma.job.upsert({
      where: { externalId: job.externalId },
      create: {
        externalId: job.externalId,
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.location,
        description: job.description,
        source: "remotive",
        fitScore,
        fitReason,
      },
      update: {
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.location,
        description: job.description,
        fitScore,
        fitReason,
      },
    });

    await prisma.application.upsert({
      where: { jobId: row.id },
      create: { jobId: row.id, status: ApplicationStatus.SAVED },
      update: {},
    });
    saved += 1;
  }

  revalidatePath("/jobs");
  revalidatePath("/tracker");
  return { ok: true as const, count: saved };
}
