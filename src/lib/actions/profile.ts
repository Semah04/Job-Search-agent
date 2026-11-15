"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export type ProfileInput = {
  name: string;
  targetRoles: string;
  skills: string;
  locations: string;
  remoteOk: boolean;
  salaryMin: number | null;
  resumeText: string;
};

export async function getProfile() {
  const existing = await prisma.profile.findUnique({ where: { id: "default" } });
  if (existing) return existing;

  return prisma.profile.create({
    data: { id: "default" },
  });
}

export async function saveProfile(input: ProfileInput) {
  await prisma.profile.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      name: input.name,
      targetRoles: input.targetRoles,
      skills: input.skills,
      locations: input.locations,
      remoteOk: input.remoteOk,
      salaryMin: input.salaryMin,
      resumeText: input.resumeText,
    },
    update: {
      name: input.name,
      targetRoles: input.targetRoles,
      skills: input.skills,
      locations: input.locations,
      remoteOk: input.remoteOk,
      salaryMin: input.salaryMin,
      resumeText: input.resumeText,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true as const };
}
