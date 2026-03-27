/**
 * Citability Scorer — Analyzes content blocks for AI citation readiness.
 *
 * AI platforms prefer content blocks that are 130-170 words, self-contained,
 * fact-rich, and directly answer a question. Based on research from
 * geo-seo-claude's citability_scorer.py, rewritten for Citare's TypeScript stack.
 */

import type {
  ContentBlock,
  BlockBreakdown,
  BlockAnalysis,
  CitabilityScore,
  CitabilityGrade,
} from "./types";

// ── Block extraction ──────────────────────────────────────

/**
 * Split raw text/HTML content into heading-delimited blocks.
 * Works with both plain text (markdown headings) and stripped HTML.
 */
export function extractContentBlocks(content: string): ContentBlock[] {
  // Strip HTML tags if present
  const text = content.replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n");

  const blocks: ContentBlock[] = [];
  let currentHeading = "Introduction";
  let currentParagraphs: string[] = [];

  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect headings: markdown (## Heading) or plain uppercase lines
    const mdHeading = trimmed.match(/^#{1,4}\s+(.+)$/);
    if (mdHeading) {
      // Flush previous block
      if (currentParagraphs.length > 0) {
        const combined = currentParagraphs.join(" ");
        const wordCount = countWords(combined);
        if (wordCount >= 20) {
          blocks.push({ heading: currentHeading, content: combined, wordCount });
        }
      }
      currentHeading = mdHeading[1];
      currentParagraphs = [];
      continue;
    }

    // Accumulate paragraph text
    if (countWords(trimmed) >= 5) {
      currentParagraphs.push(trimmed);
    }
  }

  // Flush last block
  if (currentParagraphs.length > 0) {
    const combined = currentParagraphs.join(" ");
    const wordCount = countWords(combined);
    if (wordCount >= 20) {
      blocks.push({ heading: currentHeading, content: combined, wordCount });
    }
  }

  return blocks;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ── Per-block scoring ──────────────────────────────────────

export function scoreBlock(block: ContentBlock): BlockAnalysis {
  const { content, heading, wordCount } = block;
  const words = content.split(/\s+/).filter(Boolean);

  const breakdown: BlockBreakdown = {
    answerBlockQuality: scoreAnswerBlockQuality(content, words, heading),
    selfContainment: scoreSelfContainment(content, words, wordCount),
    structuralReadability: scoreStructuralReadability(content, words, wordCount),
    statisticalDensity: scoreStatisticalDensity(content),
    uniquenessSignals: scoreUniquenessSignals(content),
  };

  const totalScore = breakdown.answerBlockQuality
    + breakdown.selfContainment
    + breakdown.structuralReadability
    + breakdown.statisticalDensity
    + breakdown.uniquenessSignals;

  const { grade, label } = gradeFromScore(totalScore);
  const suggestions = generateSuggestions(breakdown, wordCount, heading);

  return {
    heading,
    wordCount,
    totalScore,
    grade,
    label,
    breakdown,
    preview: words.slice(0, 30).join(" ") + (wordCount > 30 ? "..." : ""),
    suggestions,
  };
}

// ── 1. Answer Block Quality (max 30) ──────────────────────

function scoreAnswerBlockQuality(text: string, words: string[], heading: string): number {
  let score = 0;

  // Definition patterns
  const definitionPatterns = [
    /\b\w+\s+is\s+(?:a|an|the)\s/i,
    /\b\w+\s+refers?\s+to\s/i,
    /\b\w+\s+means?\s/i,
    /\b\w+\s+(?:can be |are )?defined\s+as\s/i,
    /\bin\s+(?:simple|other)\s+(?:terms|words)\s*,/i,
  ];
  if (definitionPatterns.some((p) => p.test(text))) {
    score += 15;
  }

  // Answer appears early (first 60 words)
  const first60 = words.slice(0, 60).join(" ");
  const earlyAnswerPatterns = [
    /\b(?:is|are|was|were|means?|refers?)\b/i,
    /\d+%/,
    /[₹$][\d,]+/,
    /\d+\s+(?:million|billion|thousand|lakh|crore)/i,
  ];
  if (earlyAnswerPatterns.some((p) => p.test(first60))) {
    score += 15;
  }

  // Question-based heading bonus
  if (heading.endsWith("?")) {
    score += 10;
  }

  // Clear, direct sentences
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length > 0) {
    const clearCount = sentences.filter(
      (s) => { const wc = countWords(s); return wc >= 5 && wc <= 25; }
    ).length;
    score += Math.round((clearCount / sentences.length) * 10);
  }

  // Specific, quotable claims
  if (/(?:according to|research shows|studies?\s+(?:show|indicate|suggest|found)|data\s+(?:shows|indicates|suggests))/i.test(text)) {
    score += 10;
  }

  return Math.min(score, 30);
}

// ── 2. Self-Containment (max 25) ──────────────────────────

function scoreSelfContainment(text: string, words: string[], wordCount: number): number {
  let score = 0;

  // Optimal word count (134-167)
  if (wordCount >= 134 && wordCount <= 167) score += 10;
  else if (wordCount >= 100 && wordCount <= 200) score += 7;
  else if (wordCount >= 80 && wordCount <= 250) score += 4;
  else if (wordCount >= 30 && wordCount <= 400) score += 2;

  // Low pronoun density = more self-contained
  const pronouns = (text.match(/\b(?:it|they|them|their|this|that|these|those|he|she|his|her)\b/gi) ?? []).length;
  if (wordCount > 0) {
    const ratio = pronouns / wordCount;
    if (ratio < 0.02) score += 8;
    else if (ratio < 0.04) score += 5;
    else if (ratio < 0.06) score += 3;
  }

  // Named entities (proper nouns)
  const properNouns = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) ?? []).length;
  if (properNouns >= 3) score += 7;
  else if (properNouns >= 1) score += 4;

  return Math.min(score, 25);
}

// ── 3. Structural Readability (max 20) ────────────────────

function scoreStructuralReadability(text: string, words: string[], wordCount: number): number {
  let score = 0;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length > 0) {
    const avgLen = wordCount / sentences.length;
    if (avgLen >= 10 && avgLen <= 20) score += 8;
    else if (avgLen >= 8 && avgLen <= 25) score += 5;
    else score += 2;
  }

  // List-like structures
  if (/(?:first|second|third|finally|additionally|moreover|furthermore)/i.test(text)) {
    score += 4;
  }

  // Numbered items
  if (/(?:\d+[.)]\s|\b(?:step|tip|point)\s+\d+)/i.test(text)) {
    score += 4;
  }

  // Paragraph breaks
  if (text.includes("\n")) {
    score += 4;
  }

  return Math.min(score, 20);
}

// ── 4. Statistical Density (max 15) ──────────────────────

function scoreStatisticalDensity(text: string): number {
  let score = 0;

  // Percentages
  const pctCount = (text.match(/\d+(?:\.\d+)?%/g) ?? []).length;
  score += Math.min(pctCount * 3, 6);

  // Currency amounts (INR + USD)
  const currencyCount = (text.match(/[₹$][\d,]+(?:\.\d+)?(?:\s*(?:million|billion|lakh|crore|M|B|K))?/gi) ?? []).length;
  score += Math.min(currencyCount * 3, 5);

  // Numbers with context
  const numbersInContext = (text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\s+(?:users|customers|pages|sites|companies|businesses|people|percent|times|years|months|clients|patients|students)\b/gi) ?? []).length;
  score += Math.min(numbersInContext * 2, 4);

  // Year references
  if (/\b20(?:2[3-9]|1\d)\b/.test(text)) {
    score += 2;
  }

  // Named sources
  const sourcePatterns = [
    /(?:according to|per|from|by)\s+[A-Z]/,
    /(?:Gartner|Forrester|McKinsey|Harvard|Stanford|Google|Microsoft|OpenAI|Anthropic|NASSCOM|FICCI)/,
    /\([A-Z][a-z]+(?:\s+\d{4})?\)/,
  ];
  for (const p of sourcePatterns) {
    if (p.test(text)) { score += 2; break; }
  }

  return Math.min(score, 15);
}

// ── 5. Uniqueness Signals (max 10) ───────────────────────

function scoreUniquenessSignals(text: string): number {
  let score = 0;

  // Original data indicators
  if (/(?:our\s+(?:research|study|data|analysis|survey|findings)|we\s+(?:found|discovered|analyzed|surveyed|measured))/i.test(text)) {
    score += 5;
  }

  // Case study / example indicators
  if (/(?:case study|for example|for instance|in practice|real-world|hands-on)/i.test(text)) {
    score += 3;
  }

  // Specific tool/product mentions
  if (/(?:using|with|via|through)\s+[A-Z][a-z]+/.test(text)) {
    score += 2;
  }

  return Math.min(score, 10);
}

// ── Grading ──────────────────────────────────────────────

function gradeFromScore(score: number): { grade: CitabilityGrade; label: string } {
  if (score >= 80) return { grade: "A", label: "Highly Citable" };
  if (score >= 65) return { grade: "B", label: "Good Citability" };
  if (score >= 50) return { grade: "C", label: "Moderate Citability" };
  if (score >= 35) return { grade: "D", label: "Low Citability" };
  return { grade: "F", label: "Poor Citability" };
}

// ── Suggestions ─────────────────────────────────────────

function generateSuggestions(breakdown: BlockBreakdown, wordCount: number, heading: string): string[] {
  const suggestions: string[] = [];

  if (breakdown.answerBlockQuality < 15) {
    suggestions.push("Start with a clear definition or direct answer to the heading question");
    if (!heading.endsWith("?")) {
      suggestions.push("Rephrase the heading as a question for better Q&A alignment");
    }
  }

  if (breakdown.selfContainment < 12) {
    if (wordCount < 100) {
      suggestions.push(`Expand this block to 134-167 words (currently ${wordCount})`);
    } else if (wordCount > 200) {
      suggestions.push(`Split this block into smaller 134-167 word passages (currently ${wordCount})`);
    }
    suggestions.push("Reduce pronoun usage — use specific names and terms instead of 'it', 'they', 'this'");
  }

  if (breakdown.statisticalDensity < 6) {
    suggestions.push("Add specific numbers, percentages, or statistics to support claims");
  }

  if (breakdown.structuralReadability < 8) {
    suggestions.push("Use shorter sentences (10-20 words) and add transition words like 'first', 'additionally'");
  }

  if (breakdown.uniquenessSignals < 4) {
    suggestions.push("Include original data, case studies, or specific examples");
  }

  return suggestions;
}

// ── Page-level analysis ─────────────────────────────────

export function analyzeContentCitability(content: string): CitabilityScore {
  const blocks = extractContentBlocks(content);
  const scoredBlocks = blocks.map(scoreBlock);

  if (scoredBlocks.length === 0) {
    return {
      totalBlocksAnalyzed: 0,
      averageScore: 0,
      optimalLengthPassages: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      topBlocks: [],
      bottomBlocks: [],
      allBlocks: [],
    };
  }

  const avgScore = scoredBlocks.reduce((sum, b) => sum + b.totalScore, 0) / scoredBlocks.length;
  const optimalCount = scoredBlocks.filter(
    (b) => b.wordCount >= 134 && b.wordCount <= 167
  ).length;

  const gradeDistribution: Record<CitabilityGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const block of scoredBlocks) {
    gradeDistribution[block.grade]++;
  }

  const sorted = [...scoredBlocks].sort((a, b) => b.totalScore - a.totalScore);

  return {
    totalBlocksAnalyzed: scoredBlocks.length,
    averageScore: Math.round(avgScore * 10) / 10,
    optimalLengthPassages: optimalCount,
    gradeDistribution,
    topBlocks: sorted.slice(0, 5),
    bottomBlocks: sorted.slice(-5).reverse(),
    allBlocks: scoredBlocks,
  };
}
