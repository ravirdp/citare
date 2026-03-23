import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";

/**
 * Build the strategist prompt for generating presence content from a KG.
 * Used when generators need AI-generated descriptions or content enhancement.
 */
export function buildGeneratePresencePrompt(
  kg: KnowledgeGraphData,
  formats: string[]
): string {
  return `# Presence Content Generation — Tier One Strategist

You are generating structured content for AI search presence. The content will be deployed to public URLs where AI platforms (ChatGPT, Perplexity, Gemini, Claude) can crawl and index it.

## Knowledge Graph

\`\`\`json
${JSON.stringify(kg, null, 2)}
\`\`\`

## Formats to Generate

${formats.map((f) => `- **${f}**`).join("\n")}

## Instructions

For each requested format, generate optimized content:

### json_ld
- Schema.org LocalBusiness JSON-LD
- Fill 90%+ of available properties
- Include services as Offer/Service types
- Include products with full Product schema

### llms_txt
- Structured plain text following the llms.txt convention
- Clear sections: business overview, services, products, location, hours, contact
- Factual, no marketing fluff — optimized for LLM consumption

### faq_page
- Generate 10-15 Q&A pairs from the business data
- Questions should match real search queries (use keywords from the KG)
- Include FAQPage schema markup

### markdown_page
- Comprehensive, heading-structured markdown
- Human-readable AND AI-crawlable
- Include all business details, services, location info

### product_feed
- JSON format compatible with Google Merchant Center
- Include all products/services with descriptions and metadata

## Voice Consistency

Use the business's voice profile: "${kg.businessProfile.voiceProfile}"

Maintain consistency across all formats — the same business personality should come through in every output.

## Output

Return a JSON array of objects, one per format:

\`\`\`json
[
  { "format": "json_ld", "language": "en", "content": "..." },
  { "format": "llms_txt", "language": "en", "content": "..." }
]
\`\`\`

Return ONLY the JSON array.`;
}
