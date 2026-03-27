/**
 * Content Structure Analyzer — Scores how well a page's content
 * is structured for AI consumption (headings, sections, lists, etc.)
 */

export interface ContentStructureScore {
  score: number; // 0-100
  headingCount: number;
  hasH1: boolean;
  headingHierarchyValid: boolean;
  listCount: number;
  tableCount: number;
  avgParagraphWords: number;
  recommendations: string[];
}

export function analyzeContentStructure(html: string): ContentStructureScore {
  let score = 0;
  const recommendations: string[] = [];

  // Strip scripts/styles
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // 1. Heading analysis
  const h1s = (clean.match(/<h1[\s\S]*?<\/h1>/gi) ?? []);
  const h2s = (clean.match(/<h2[\s\S]*?<\/h2>/gi) ?? []);
  const h3s = (clean.match(/<h3[\s\S]*?<\/h3>/gi) ?? []);
  const headingCount = h1s.length + h2s.length + h3s.length;
  const hasH1 = h1s.length > 0;

  if (hasH1) score += 15;
  else recommendations.push("Add an H1 heading — the main topic of the page");

  if (h2s.length >= 3) score += 15;
  else if (h2s.length >= 1) score += 8;
  else recommendations.push("Add H2 subheadings to break content into sections");

  // Heading hierarchy: H1 should come before H2s
  const headingHierarchyValid = hasH1 && h2s.length > 0;
  if (headingHierarchyValid) score += 5;

  // 2. List usage (bullet points are AI-friendly)
  const uls = (clean.match(/<ul[\s\S]*?<\/ul>/gi) ?? []);
  const ols = (clean.match(/<ol[\s\S]*?<\/ol>/gi) ?? []);
  const listCount = uls.length + ols.length;

  if (listCount >= 2) score += 15;
  else if (listCount >= 1) score += 8;
  else recommendations.push("Add bullet or numbered lists — AI models extract these efficiently");

  // 3. Table usage
  const tables = (clean.match(/<table[\s\S]*?<\/table>/gi) ?? []);
  const tableCount = tables.length;
  if (tableCount >= 1) score += 10;

  // 4. Paragraph analysis
  const paragraphs = clean.match(/<p[\s\S]*?<\/p>/gi) ?? [];
  const paraTexts = paragraphs.map((p) =>
    p.replace(/<[^>]+>/g, "").trim()
  ).filter((t) => t.length > 0);

  const avgWords = paraTexts.length > 0
    ? paraTexts.reduce((sum, t) => sum + t.split(/\s+/).length, 0) / paraTexts.length
    : 0;

  if (avgWords >= 40 && avgWords <= 150) score += 15;
  else if (avgWords >= 20 && avgWords <= 200) score += 8;
  else if (avgWords > 200) {
    score += 3;
    recommendations.push("Break long paragraphs into shorter, focused passages (40-150 words)");
  } else if (paraTexts.length > 0) {
    score += 3;
    recommendations.push("Expand thin paragraphs — add context, facts, and specifics");
  }

  // 5. Content volume
  const totalWords = paraTexts.reduce((sum, t) => sum + t.split(/\s+/).length, 0);
  if (totalWords >= 1000) score += 15;
  else if (totalWords >= 500) score += 10;
  else if (totalWords >= 200) score += 5;
  else recommendations.push("Add more substantive content (aim for 1000+ words on key pages)");

  // 6. Internal links (interconnected content)
  const links = (clean.match(/<a\s/gi) ?? []).length;
  if (links >= 5) score += 10;
  else if (links >= 2) score += 5;

  if (recommendations.length === 0) {
    recommendations.push("Content structure is well-optimized for AI consumption");
  }

  return {
    score: Math.min(100, score),
    headingCount,
    hasH1,
    headingHierarchyValid,
    listCount,
    tableCount,
    avgParagraphWords: Math.round(avgWords),
    recommendations,
  };
}
