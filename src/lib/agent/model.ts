import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { getLlmProvider } from "@/lib/env";

export function getAgentModel() {
  const provider = getLlmProvider();
  if (provider === "google") {
    // Free-tier friendly Gemini model (stable lite alias)
    return google("gemini-flash-lite-latest");
  }
  if (provider === "openai") {
    return openai("gpt-4o-mini");
  }
  return null;
}
