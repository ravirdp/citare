import type { Platform } from "@/types/monitoring";
import type { PlatformAdapter } from "./_template";
import { ChatGPTAdapter } from "./chatgpt";
import { PerplexityAdapter } from "./perplexity";
import { GoogleAIOAdapter } from "./google-aio";
import { GeminiAdapter } from "./gemini";
import { ClaudeAdapter } from "./claude";

export const PLATFORM_ADAPTERS: Record<Platform, PlatformAdapter> = {
  chatgpt: new ChatGPTAdapter(),
  perplexity: new PerplexityAdapter(),
  google_aio: new GoogleAIOAdapter(),
  gemini: new GeminiAdapter(),
  claude: new ClaudeAdapter(),
};

export function getActivePlatforms(): PlatformAdapter[] {
  return Object.values(PLATFORM_ADAPTERS).filter((a) => a.isAvailable());
}
