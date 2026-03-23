import type { NormalizedResult } from "@/types/monitoring";
import type { PlatformAdapter } from "./_template";
import { createSimulationResult } from "./_template";

export class ClaudeAdapter implements PlatformAdapter {
  platform = "claude" as const;

  async queryPlatform(query: string, clientName: string): Promise<NormalizedResult> {
    const mode = process.env.AI_MODE ?? "simulation";
    if (mode === "production") {
      // TODO: Call Anthropic API
      throw new Error("Claude production mode not yet implemented");
    }
    return createSimulationResult(this.platform, query, clientName);
  }

  isAvailable(): boolean {
    return true; // Always available in simulation mode
  }
}
