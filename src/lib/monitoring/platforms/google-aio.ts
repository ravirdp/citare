import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NormalizedResult } from "@/types/monitoring";
import type { PlatformAdapter } from "./_template";
import { createSimulationResult } from "./_template";
import { parseResponse, createUnavailableResult, delay } from "./parse-response";

let lastCallTime = 0;

export class GoogleAIOAdapter implements PlatformAdapter {
  platform = "google_aio" as const;

  async queryPlatform(
    query: string,
    clientName: string,
    competitorNames: string[] = []
  ): Promise<NormalizedResult> {
    const mode = process.env.AI_MODE ?? "simulation";

    if (mode === "simulation") {
      return createSimulationResult(this.platform, query, clientName);
    }

    // production or hybrid mode — use Gemini API as proxy for Google AI Overviews
    // (Google AIO uses Gemini under the hood; no direct API for AI Overviews)
    const startTime = Date.now();

    try {
      // Rate limit: 1 second between calls
      const elapsed = Date.now() - lastCallTime;
      if (elapsed < 1000) {
        await delay(1000 - elapsed);
      }

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: query }],
          },
        ],
        systemInstruction: {
          role: "model",
          parts: [
            {
              text: "Based on web search results, answer the following query about businesses or services. Include specific business names and locations when relevant. Provide a concise, factual answer like a Google AI Overview would.",
            },
          ],
        },
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.5, // Lower temp for more factual/search-like responses
        },
      });

      lastCallTime = Date.now();
      const responseTimeMs = Date.now() - startTime;
      const text = result.response.text();

      return parseResponse(text, clientName, competitorNames, "production", responseTimeMs);
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[GoogleAIO] API error: ${message}`);
      return createUnavailableResult("google_aio", message, responseTimeMs);
    }
  }

  isAvailable(): boolean {
    const mode = process.env.AI_MODE ?? "simulation";
    if (mode === "simulation") return true;
    // Uses same API key as Gemini
    return !!process.env.GOOGLE_GEMINI_API_KEY;
  }
}
