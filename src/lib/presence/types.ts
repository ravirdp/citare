import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";

export interface ClientRecord {
  id: string;
  slug: string;
  name: string;
  businessType: string;
  languages: string[];
}

export interface PresenceGenerator {
  format: string;
  generate(
    kg: KnowledgeGraphData,
    client: ClientRecord,
    language: string
  ): string;
  validate(content: string): { valid: boolean; errors: string[] };
}

export type PresenceFormat =
  | "json_ld"
  | "llms_txt"
  | "faq_page"
  | "markdown_page"
  | "product_feed";

export interface GenerationResult {
  format: PresenceFormat;
  language: string;
  content: string;
  contentHash: string;
  status: "generated" | "unchanged" | "error";
  error?: string;
}
