export type LlmProvider = "google" | "openai" | null;

export function getLlmProvider(): LlmProvider {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) return "google";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return null;
}

export function hasLlmKey() {
  return getLlmProvider() !== null;
}
