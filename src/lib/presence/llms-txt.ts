import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";
import type { PresenceGenerator, ClientRecord } from "./types";

/**
 * Generate llms.txt — structured plain text optimized for LLM consumption.
 * Follows the llms.txt convention: clear sections, factual, no marketing fluff.
 */
export const llmsTxtGenerator: PresenceGenerator = {
  format: "llms_txt",

  generate(kg: KnowledgeGraphData, client: ClientRecord, _language: string): string {
    const bp = kg.businessProfile ?? {};
    const contact = bp.contact ?? {};
    const categories = bp.categories ?? [];
    const services = kg.services ?? [];
    const products = kg.products ?? [];
    const languages = bp.languages ?? [];
    const lines: string[] = [];

    // Header
    lines.push(`# ${bp.name ?? client.name}`);
    lines.push("");
    if (bp.description) {
      lines.push(`> ${bp.description}`);
      lines.push("");
    }

    // Contact
    if (contact.phone || contact.email || contact.website) {
      lines.push("## Contact");
      if (contact.phone) lines.push(`- Phone: ${contact.phone}`);
      if (contact.email) lines.push(`- Email: ${contact.email}`);
      if (contact.website) lines.push(`- Website: ${contact.website}`);
      lines.push("");
    }

    // Location
    if (bp.address || bp.landmarks) {
      lines.push("## Location");
      if (bp.address) {
        const parts = [bp.address.street, bp.address.city, bp.address.state, bp.address.pin]
          .filter(Boolean);
        if (parts.length > 0) lines.push(`- Address: ${parts.join(", ")}`);
      }
      if (bp.landmarks?.clientDescribed) {
        lines.push(`- Landmarks: ${bp.landmarks.clientDescribed}`);
      }
      if (bp.landmarks?.autoDetected && bp.landmarks.autoDetected.length > 0) {
        lines.push(`- Nearby: ${bp.landmarks.autoDetected.join(", ")}`);
      }
      lines.push("");
    }

    // Hours
    if (bp.hours?.regular) {
      lines.push("## Hours");
      for (const [day, hours] of Object.entries(bp.hours.regular)) {
        if (hours) {
          lines.push(`- ${capitalize(day)}: ${hours.open} - ${hours.close}`);
        } else {
          lines.push(`- ${capitalize(day)}: Closed`);
        }
      }
      lines.push("");
    }

    // Categories
    if (categories.length > 0) {
      lines.push("## Categories");
      lines.push(categories.map((c) => `- ${c}`).join("\n"));
      lines.push("");
    }

    // Services
    if (services.length > 0) {
      lines.push("## Services");
      for (const svc of services) {
        lines.push(`### ${svc.name}`);
        if (svc.description) lines.push(svc.description);
        if (svc.category) lines.push(`Category: ${svc.category}`);
        lines.push("");
      }
    }

    // Products
    if (products.length > 0) {
      lines.push("## Products");
      for (const prod of products) {
        lines.push(`### ${prod.name}`);
        if (prod.description) lines.push(prod.description);
        if (prod.price) {
          lines.push(
            `Price: ${prod.price.currency} ${prod.price.amount}${prod.price.salePrice ? ` (Sale: ${prod.price.currency} ${prod.price.salePrice})` : ""}`
          );
        }
        lines.push("");
      }
    }

    // Languages
    if (languages.length > 0) {
      lines.push("## Languages");
      lines.push(languages.join(", "));
      lines.push("");
    }

    return lines.join("\n");
  },

  validate(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!content.startsWith("# ")) errors.push("Missing title heading");
    if (content.length < 100) errors.push("Content too short");
    return { valid: errors.length === 0, errors };
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
