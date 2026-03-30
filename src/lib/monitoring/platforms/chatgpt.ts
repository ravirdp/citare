import OpenAI from "openai";
import type { NormalizedResult } from "@/types/monitoring";
import type { PlatformAdapter } from "./_template";
import { createSimulationResult } from "./_template";
import { parseResponse, createUnavailableResult, delay } from "./parse-response";

let lastCallTime = 0;

export class ChatGPTAdapter implements PlatformAdapter {
  platform = "chatgpt" as const;

  async queryPlatform(
    query: string,
    clientName: string,
    competitorNames: string[] = []
  ): Promise<NormalizedResult> {
    const mode = process.env.AI_MODE ?? "simulation";

    if (mode === "simulation") {
      return createSimulationResult(this.platform, query, clientName);
    }

    // production or hybrid mode — use real OpenAI API
    const startTime = Date.now();

    try {
      // Rate limit: 1 second between calls
      const elapsed = Date.now() - lastCallTime;
      if (elapsed < 1000) {
        await delay(1000 - elapsed);
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Answer the user's question about businesses, services, or products. Be specific about names, locations, and recommendations.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      lastCallTime = Date.now();
      const responseTimeMs = Date.now() - startTime;
      const text = response.choices[0]?.message?.content ?? "";

      return parseResponse(text, clientName, competitorNames, "production", responseTimeMs);
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[ChatGPT] API error: ${message}`);
      return createUnavailableResult("chatgpt", message, responseTimeMs);
    }
  }

  isAvailable(): boolean {
    const mode = process.env.AI_MODE ?? "simulation";
    if (mode === "simulation") return true;
    return !!process.env.OPENAI_API_KEY;
  }
}
