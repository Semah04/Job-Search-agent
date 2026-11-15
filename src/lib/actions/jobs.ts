"use server";

import { ApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function listJobs() {
  return prisma.job.findMany({
    include: { application: true },
    orderBy: [{ fitScore: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getJob(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: { application: true },
  });
}

export async function listApplications() {
  return prisma.application.findMany({
    include: { job: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateStatus(jobId: string, status: ApplicationStatus) {
  await prisma.application.upsert({
    where: { jobId },
    create: { jobId, status },
    update: { status },
  });
  revalidatePath("/tracker");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
}

export async function saveCoverLetter(jobId: string, coverLetter: string) {
  await prisma.application.upsert({
    where: { jobId },
    create: { jobId, coverLetter, status: ApplicationStatus.SAVED },
    update: { coverLetter },
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/tracker");
}
