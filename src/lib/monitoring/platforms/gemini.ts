import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NormalizedResult } from "@/types/monitoring";
import type { PlatformAdapter } from "./_template";
import { createSimulationResult } from "./_template";
import { parseResponse, createUnavailableResult, delay } from "./parse-response";

let lastCallTime = 0;

export class GeminiAdapter implements PlatformAdapter {
  platform = "gemini" as const;

  async queryPlatform(
    query: string,
    clientName: string,
    competitorNames: string[] = []
  ): Promise<NormalizedResult> {
    const mode = process.env.AI_MODE ?? "simulation";

    if (mode === "simulation") {
      return createSimulationResult(this.platform, query, clientName);
    }

    // production or hybrid mode — use real Gemini API
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
              text: "You are a helpful assistant. Answer the user's question about businesses, services, or products. Be specific about names, locations, and recommendations.",
            },
          ],
        },
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });

      lastCallTime = Date.now();
      const responseTimeMs = Date.now() - startTime;
      const text = result.response.text();

      return parseResponse(text, clientName, competitorNames, "production", responseTimeMs);
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Gemini] API error: ${message}`);
      return createUnavailableResult("gemini", message, responseTimeMs);
    }
  }

  isAvailable(): boolean {
    const mode = process.env.AI_MODE ?? "simulation";
    if (mode === "simulation") return true;
    return !!process.env.GOOGLE_GEMINI_API_KEY;
  }
}
