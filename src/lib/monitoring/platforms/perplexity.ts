import type { NormalizedResult } from "@/types/monitoring";
import type { PlatformAdapter } from "./_template";
import { createSimulationResult } from "./_template";

export class PerplexityAdapter implements PlatformAdapter {
  platform = "perplexity" as const;

  async queryPlatform(query: string, clientName: string, _competitorNames?: string[]): Promise<NormalizedResult> {
    // Perplexity always uses simulation — production adapter not yet implemented
    return createSimulationResult(this.platform, query, clientName);
  }

  isAvailable(): boolean {
    const mode = process.env.AI_MODE ?? "simulation";
    // Only available in simulation mode; disabled in production/hybrid until API implemented
    return mode === "simulation";
  }
}
