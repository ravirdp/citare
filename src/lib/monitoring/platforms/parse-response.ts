import type { NormalizedResult, CompetitorMention } from "@/types/monitoring";

/**
 * Parse an AI platform's text response into a NormalizedResult.
 * Shared by ChatGPT, Gemini, and Google AIO adapters.
 */
export function parseResponse(
  responseText: string,
  clientName: string,
  competitorNames: string[],
  queryMethod: string,
  responseTimeMs: number
): NormalizedResult {
  const lowerResponse = responseText.toLowerCase();
  const lowerClientName = clientName.toLowerCase();

  // Check if client is mentioned (case-insensitive)
  const clientMentioned = lowerResponse.includes(lowerClientName);

  // Find position: split response into sentences, find which one mentions client first
  let clientPosition: number | null = null;
  if (clientMentioned) {
    // Split into rough "recommendation blocks" by newlines and numbered lists
    const blocks = responseText.split(/\n|(?:\d+\.\s)/).filter((b) => b.trim().length > 10);
    let mentionIndex = 0;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].toLowerCase().includes(lowerClientName)) {
        mentionIndex = i;
        break;
      }
    }
    // Position is 1-indexed, capped at meaningful range
    clientPosition = Math.min(mentionIndex + 1, 10);
  }

  // Find competitor mentions
  const competitorMentions: CompetitorMention[] = [];
  for (const name of competitorNames) {
    if (!name || name.length < 2) continue;
    const lowerName = name.toLowerCase();
    if (lowerResponse.includes(lowerName)) {
      // Find position in response
      const blocks = responseText.split(/\n|(?:\d+\.\s)/).filter((b) => b.trim().length > 10);
      let pos: number | null = null;
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].toLowerCase().includes(lowerName)) {
          pos = i + 1;
          break;
        }
      }
      competitorMentions.push({ name, position: pos });
    }
  }

  // Build summary
  const summaryParts: string[] = [];
  if (clientMentioned) {
    summaryParts.push(`${clientName} mentioned at position ${clientPosition}.`);
  } else {
    summaryParts.push(`${clientName} not mentioned in response.`);
  }
  if (competitorMentions.length > 0) {
    summaryParts.push(`Competitors: ${competitorMentions.map((c) => c.name).join(", ")}.`);
  }

  return {
    clientMentioned,
    clientPosition,
    informationAccurate: true, // Will be validated by result-processor against KG
    accuracyIssues: [],
    competitorMentions,
    rawResponse: responseText,
    responseSummary: summaryParts.join(" "),
    queryMethod,
    responseTimeMs,
  };
}

/**
 * Create a "platform unavailable" result when an API call fails.
 */
export function createUnavailableResult(
  platform: string,
  error: string,
  responseTimeMs: number
): NormalizedResult {
  return {
    clientMentioned: false,
    clientPosition: null,
    informationAccurate: true,
    accuracyIssues: [],
    competitorMentions: [],
    rawResponse: JSON.stringify({ platform, error, unavailable: true }),
    responseSummary: `Platform unavailable: ${error}`,
    queryMethod: "production_error",
    responseTimeMs,
  };
}

/**
 * Simple delay utility for rate limiting between API calls.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
