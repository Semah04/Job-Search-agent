import {
  convertToModelMessages,
  isStepCount,
  streamText,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { createAgentTools } from "@/lib/agent/tools";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "Missing OPENAI_API_KEY. Add it to .env.local and restart the server.",
      },
      { status: 500 },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const profile = await prisma.profile.findUnique({ where: { id: "default" } });

  const profileBlock = profile
    ? `User profile:
- Name: ${profile.name || "(not set)"}
- Target roles: ${profile.targetRoles || "(not set)"}
- Skills: ${profile.skills || "(not set)"}
- Locations: ${profile.locations || "(not set)"}
- Remote OK: ${profile.remoteOk}
- Min salary: ${profile.salaryMin ?? "(not set)"}
- Resume on file: ${profile.resumeText.trim() ? "yes" : "no"}`
    : "User has not saved a profile yet. Suggest they open /profile.";

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are a careful job search agent.
You help the user find remote/tech jobs, rank them against their profile, save interesting roles, draft cover letters, and update application status.

Rules:
- Always call get_profile before searching when you need preferences.
- Prefer real data from tools. Never invent job listings, URLs, or companies.
- After search_jobs, rank with score_jobs (and persist when useful).
- Do not auto-apply. Only draft/save/track; the human decides to apply.
- Keep responses concise and actionable. Show top matches with title, company, score, reason, and link.
- When drafting a cover letter, write the full letter in the draft_cover_letter tool input, tailored to resume + job.

${profileBlock}`,
    messages: await convertToModelMessages(messages),
    tools: createAgentTools(),
    stopWhen: isStepCount(8),
  });

  return result.toUIMessageStreamResponse();
}
