import type { NormalizedResult } from "@/types/monitoring";
import type { PlatformAdapter } from "./_template";
import { createSimulationResult } from "./_template";

export class GoogleAIOAdapter implements PlatformAdapter {
  platform = "google_aio" as const;

  async queryPlatform(query: string, clientName: string): Promise<NormalizedResult> {
    const mode = process.env.AI_MODE ?? "simulation";
    if (mode === "production") {
      // TODO: Call SerpAPI for Google AI Overview results
      throw new Error("Google AIO production mode not yet implemented");
    }
    return createSimulationResult(this.platform, query, clientName);
  }

  isAvailable(): boolean {
    return true; // Always available in simulation mode
  }
}
