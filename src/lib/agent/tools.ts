import { tool } from "ai";
import { ApplicationStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { searchRemotiveJobs } from "@/lib/jobs/remotive";

async function getProfile() {
  return prisma.profile.findUnique({ where: { id: "default" } });
}

export function createAgentTools() {
  return {
    search_jobs: tool({
      description:
        "Search remote job listings on Remotive. Use keywords from the user query and their profile target roles/skills.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Search keywords, e.g. 'typescript backend' or 'react'"),
        category: z
          .string()
          .optional()
          .describe(
            "Optional Remotive category slug such as software-dev or customer-support",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .describe("Max jobs to return (default 15)"),
      }),
      execute: async ({ query, category, limit }) => {
        const jobs = await searchRemotiveJobs({
          query,
          category,
          limit: limit ?? 15,
        });
        return {
          count: jobs.length,
          jobs: jobs.map((j) => ({
            externalId: j.externalId,
            title: j.title,
            company: j.company,
            url: j.url,
            location: j.location,
            descriptionPreview: j.description.slice(0, 400),
          })),
        };
      },
    }),

    score_jobs: tool({
      description:
        "Score and optionally persist fit scores for jobs against the saved user profile. Pass jobs with externalId from search_jobs.",
      inputSchema: z.object({
        scores: z
          .array(
            z.object({
              externalId: z.string(),
              title: z.string(),
              company: z.string(),
              url: z.string(),
              location: z.string().optional(),
              description: z.string().optional(),
              fitScore: z.number().int().min(0).max(100),
              fitReason: z.string(),
            }),
          )
          .min(1)
          .max(20),
        persist: z
          .boolean()
          .optional()
          .describe("If true, upsert jobs into the database with scores"),
      }),
      execute: async ({ scores, persist }) => {
        const profile = await getProfile();
        if (!profile) {
          return {
            warning:
              "No profile saved yet. Scores are relative only. Ask the user to fill Profile.",
            scores,
          };
        }

        if (persist) {
          for (const s of scores) {
            await prisma.job.upsert({
              where: { externalId: s.externalId },
              create: {
                externalId: s.externalId,
                title: s.title,
                company: s.company,
                url: s.url,
                location: s.location ?? "Remote",
                description: s.description ?? "",
                source: "remotive",
                fitScore: s.fitScore,
                fitReason: s.fitReason,
              },
              update: {
                title: s.title,
                company: s.company,
                url: s.url,
                location: s.location ?? "Remote",
                description: s.description ?? "",
                fitScore: s.fitScore,
                fitReason: s.fitReason,
              },
            });
          }
        }

        return {
          profileSummary: {
            targetRoles: profile.targetRoles,
            skills: profile.skills,
            locations: profile.locations,
            remoteOk: profile.remoteOk,
          },
          scored: scores.sort((a, b) => b.fitScore - a.fitScore),
          persisted: Boolean(persist),
        };
      },
    }),

    save_job: tool({
      description:
        "Save a job listing and create/update an application tracker entry (default status SAVED).",
      inputSchema: z.object({
        externalId: z.string(),
        title: z.string(),
        company: z.string(),
        url: z.string(),
        location: z.string().optional(),
        description: z.string().optional(),
        fitScore: z.number().int().min(0).max(100).optional(),
        fitReason: z.string().optional(),
        status: z
          .enum(["SAVED", "APPLIED", "INTERVIEWING", "REJECTED"])
          .optional(),
      }),
      execute: async (input) => {
        const job = await prisma.job.upsert({
          where: { externalId: input.externalId },
          create: {
            externalId: input.externalId,
            title: input.title,
            company: input.company,
            url: input.url,
            location: input.location ?? "Remote",
            description: input.description ?? "",
            source: "remotive",
            fitScore: input.fitScore,
            fitReason: input.fitReason,
          },
          update: {
            title: input.title,
            company: input.company,
            url: input.url,
            location: input.location ?? "Remote",
            description: input.description ?? "",
            fitScore: input.fitScore ?? undefined,
            fitReason: input.fitReason ?? undefined,
          },
        });

        const status =
          (input.status as ApplicationStatus | undefined) ??
          ApplicationStatus.SAVED;

        const application = await prisma.application.upsert({
          where: { jobId: job.id },
          create: { jobId: job.id, status },
          update: { status },
        });

        return {
          jobId: job.id,
          externalId: job.externalId,
          title: job.title,
          company: job.company,
          status: application.status,
          url: job.url,
        };
      },
    }),

    list_saved_jobs: tool({
      description: "List saved jobs and their application status from the database.",
      inputSchema: z.object({
        status: z
          .enum(["SAVED", "APPLIED", "INTERVIEWING", "REJECTED"])
          .optional()
          .describe("Optional filter by application status"),
      }),
      execute: async ({ status }) => {
        const apps = await prisma.application.findMany({
          where: status
            ? { status: status as ApplicationStatus }
            : undefined,
          include: { job: true },
          orderBy: { updatedAt: "desc" },
        });

        return {
          count: apps.length,
          items: apps.map((a) => ({
            jobId: a.job.id,
            title: a.job.title,
            company: a.job.company,
            url: a.job.url,
            location: a.job.location,
            fitScore: a.job.fitScore,
            fitReason: a.job.fitReason,
            status: a.status,
            hasCoverLetter: Boolean(a.coverLetter?.trim()),
          })),
        };
      },
    }),

    draft_cover_letter: tool({
      description:
        "Draft a cover letter for a job using the saved resume/profile. Saves the letter on the application record. Returns the letter text for the assistant to show the user.",
      inputSchema: z.object({
        externalId: z
          .string()
          .optional()
          .describe("Job externalId from search (preferred)"),
        jobId: z.string().optional().describe("Internal DB job id if known"),
        title: z.string(),
        company: z.string(),
        url: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
        letter: z
          .string()
          .describe(
            "The full cover letter you wrote tailored to the job and the user resume",
          ),
      }),
      execute: async (input) => {
        const profile = await getProfile();
        if (!profile?.resumeText?.trim()) {
          return {
            error:
              "Resume text is empty. Ask the user to add their resume on the Profile page before drafting letters.",
          };
        }

        let job =
          (input.jobId
            ? await prisma.job.findUnique({ where: { id: input.jobId } })
            : null) ??
          (input.externalId
            ? await prisma.job.findUnique({
                where: { externalId: input.externalId },
              })
            : null);

        if (!job) {
          if (!input.externalId) {
            return {
              error:
                "Need externalId or an existing jobId to save the cover letter.",
            };
          }
          job = await prisma.job.create({
            data: {
              externalId: input.externalId,
              title: input.title,
              company: input.company,
              url: input.url ?? "",
              location: input.location ?? "Remote",
              description: input.description ?? "",
              source: "remotive",
            },
          });
        }

        const application = await prisma.application.upsert({
          where: { jobId: job.id },
          create: {
            jobId: job.id,
            status: ApplicationStatus.SAVED,
            coverLetter: input.letter,
          },
          update: { coverLetter: input.letter },
        });

        return {
          jobId: job.id,
          title: job.title,
          company: job.company,
          status: application.status,
          coverLetter: input.letter,
          profileName: profile.name || "Candidate",
        };
      },
    }),

    update_application_status: tool({
      description:
        "Update application status for a saved job (SAVED, APPLIED, INTERVIEWING, REJECTED).",
      inputSchema: z.object({
        jobId: z.string().optional(),
        externalId: z.string().optional(),
        status: z.enum(["SAVED", "APPLIED", "INTERVIEWING", "REJECTED"]),
        notes: z.string().optional(),
      }),
      execute: async ({ jobId, externalId, status, notes }) => {
        const job = jobId
          ? await prisma.job.findUnique({ where: { id: jobId } })
          : externalId
            ? await prisma.job.findUnique({ where: { externalId } })
            : null;

        if (!job) {
          return {
            error: "Job not found. Save the job first with save_job.",
          };
        }

        const application = await prisma.application.upsert({
          where: { jobId: job.id },
          create: {
            jobId: job.id,
            status: status as ApplicationStatus,
            notes: notes ?? "",
          },
          update: {
            status: status as ApplicationStatus,
            ...(notes !== undefined ? { notes } : {}),
          },
        });

        return {
          jobId: job.id,
          title: job.title,
          company: job.company,
          status: application.status,
          notes: application.notes,
        };
      },
    }),

    get_profile: tool({
      description:
        "Load the user's saved job-search profile (roles, skills, locations, resume summary).",
      inputSchema: z.object({}),
      execute: async () => {
        const profile = await getProfile();
        if (!profile) {
          return {
            empty: true,
            message:
              "No profile yet. Ask the user to fill the Profile page first.",
          };
        }
        return {
          empty: false,
          name: profile.name,
          targetRoles: profile.targetRoles,
          skills: profile.skills,
          locations: profile.locations,
          remoteOk: profile.remoteOk,
          salaryMin: profile.salaryMin,
          resumePreview: profile.resumeText.slice(0, 1500),
          hasResume: Boolean(profile.resumeText.trim()),
        };
      },
    }),
  };
}
