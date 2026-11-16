import { ApplicationStatus } from "@prisma/client";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { prisma } from "@/lib/db";
import { searchRemotiveJobs } from "@/lib/jobs/remotive";

function extractQuery(text: string, profileQuery: string): string {
  const cleaned = text
    .replace(/load my profile/gi, " ")
    .replace(/and save them/gi, " ")
    .replace(/save (the )?(top )?\d+/gi, " ")
    .replace(/find( the)?( top)?\s*\d*/gi, " ")
    .replace(/search( for)?/gi, " ")
    .replace(/\bremote\b/gi, " ")
    .replace(/\bjobs?\b/gi, " ")
    .replace(/\bmatches?\b/gi, " ")
    .replace(/for my skills/gi, " ")
    .replace(/\bplease\b/gi, " ")
    .replace(/\band\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length >= 2) return cleaned;
  return profileQuery || "typescript developer";
}

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
      : "General remote match (limited profile keywords)",
  };
}

export async function runFallbackAgent(userText: string) {
  const profile =
    (await prisma.profile.findUnique({ where: { id: "default" } })) ??
    (await prisma.profile.create({ data: { id: "default" } }));

  const skills = profile.skills
    .split(/[,|/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const roles = profile.targetRoles
    .split(/[,|/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const profileQuery = [...roles, ...skills].slice(0, 4).join(" ");
  const query = extractQuery(userText, profileQuery);

  const wantsLetter = /cover letter|lettre/i.test(userText);
  const wantsSave = /save|persist|track|top\s*\d+/i.test(userText);
  const saveCount = (() => {
    const m = userText.match(/top\s*(\d+)/i) || userText.match(/save\s+(\d+)/i);
    return m ? Math.min(Number(m[1]), 10) : 5;
  })();

  const jobs = await searchRemotiveJobs({
    query,
    category: "software-dev",
    limit: 15,
  });

  const queryTokens = query
    .split(/[\s,+/|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  const ranked = jobs
    .map((job) => {
      const { fitScore, fitReason } = scoreJob(
        `${job.title} ${job.company} ${job.tags.join(" ")} ${job.description}`,
        [...new Set([...skills, ...queryTokens])],
        roles,
      );
      return { ...job, fitScore, fitReason };
    })
    .sort((a, b) => b.fitScore - a.fitScore);

  const toSave = wantsSave || ranked.length > 0 ? ranked.slice(0, saveCount) : [];

  for (const job of toSave) {
    const saved = await prisma.job.upsert({
      where: { externalId: job.externalId },
      create: {
        externalId: job.externalId,
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.location,
        description: job.description,
        source: "remotive",
        fitScore: job.fitScore,
        fitReason: job.fitReason,
      },
      update: {
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.location,
        description: job.description,
        fitScore: job.fitScore,
        fitReason: job.fitReason,
      },
    });

    await prisma.application.upsert({
      where: { jobId: saved.id },
      create: { jobId: saved.id, status: ApplicationStatus.SAVED },
      update: {},
    });
  }

  let letterNote = "";
  if (wantsLetter) {
    const best = await prisma.job.findFirst({
      include: { application: true },
      orderBy: { fitScore: "desc" },
    });
    if (!best) {
      letterNote =
        "\n\nNo saved job to draft a letter for. Search and save jobs first.";
    } else if (!profile.resumeText.trim()) {
      letterNote =
        "\n\nAdd resume text on the Profile page to draft a cover letter.";
    } else {
      const letter = `Dear ${best.company} Hiring Team,

I am writing to apply for the ${best.title} role. With experience aligned to ${profile.targetRoles || "this position"} and skills in ${profile.skills || "relevant technologies"}, I believe I can contribute quickly.

${profile.resumeText.slice(0, 600)}

I would welcome the chance to discuss how I can help your team.

Best regards,
${profile.name || "Applicant"}`;

      await prisma.application.upsert({
        where: { jobId: best.id },
        create: {
          jobId: best.id,
          status: ApplicationStatus.SAVED,
          coverLetter: letter,
        },
        update: { coverLetter: letter },
      });
      letterNote = `\n\nDrafted a cover letter for **${best.title}** at **${best.company}**. Open /jobs/${best.id} to edit it.`;
    }
  }

  const lines = ranked.slice(0, 8).map(
    (j, i) =>
      `${i + 1}. ${j.title} @ ${j.company} — ${j.fitScore}/100\n   ${j.fitReason}\n   ${j.url}`,
  );

  const modeNote =
    "\n\n_(Running in offline agent mode — add OPENAI_API_KEY to .env.local for full AI ranking and letters.)_";

  const reply = [
    `Searched Remotive for “${query}” (software-dev). Found ${ranked.length} roles.`,
    toSave.length
      ? `Saved top ${toSave.length} to Jobs/Tracker.`
      : "No jobs saved.",
    "",
    lines.length ? "Top matches:" : "No matches returned.",
    ...lines,
    letterNote,
    modeNote,
  ]
    .filter((x) => x !== "")
    .join("\n");

  const stream = createUIMessageStream({
    execute({ writer }) {
      const id = "fallback-text";
      writer.write({ type: "start" });
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: reply });
      writer.write({ type: "text-end", id });
      writer.write({ type: "finish" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export function lastUserText(
  messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }>; content?: string }>,
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    if (typeof m.content === "string" && m.content.trim()) return m.content;
    const text = (m.parts ?? [])
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text!)
      .join("\n");
    if (text.trim()) return text;
  }
  return "search remote software jobs";
}
