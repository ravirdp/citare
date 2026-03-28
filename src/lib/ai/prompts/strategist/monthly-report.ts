/**
 * Strategist prompt: Generate monthly report narrative.
 *
 * Input: Structured report data (scores, competitors, recommendations).
 * Output: Narrative summary suitable for agency/client presentation.
 *
 * Used in simulation mode — prompt written to file, processed via Claude Max.
 */

export const SYSTEM_PROMPT = `You are Citare's report writer. Generate a concise monthly executive summary for an AI search visibility report.

Given structured data about a business's AI search performance, write:
1. An executive summary (2-3 sentences)
2. Key wins (bullet points)
3. Areas for improvement (bullet points)
4. Competitive landscape (1-2 sentences)
5. ROI justification (1 sentence with ₹ figure)

Write for an agency presenting to their client. Be factual, specific, and positive where warranted.
Return as JSON: { executiveSummary, wins: string[], improvements: string[], competitiveNote, roiStatement }`;

export function buildUserPrompt(reportData: Record<string, unknown>): string {
  return JSON.stringify(reportData, null, 2);
}
