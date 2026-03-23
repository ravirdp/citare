import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";
import type { PresenceGenerator, ClientRecord } from "./types";

/**
 * Generate a comprehensive structured markdown page.
 * Human-readable and AI-crawlable.
 */
export const markdownGenerator: PresenceGenerator = {
  format: "markdown_page",

  generate(kg: KnowledgeGraphData, client: ClientRecord, _language: string): string {
    const bp = kg.businessProfile ?? {};
    const contact = bp.contact ?? {};
    const categories = bp.categories ?? [];
    const services = kg.services ?? [];
    const products = kg.products ?? [];
    const languages = bp.languages ?? [];
    const name = bp.name ?? client.name;
    const lines: string[] = [];

    // Title and description
    lines.push(`# ${name}`);
    lines.push("");
    if (bp.description) {
      lines.push(bp.description);
      lines.push("");
    }

    // Categories
    if (categories.length > 0) {
      lines.push(`**Categories:** ${categories.join(" · ")}`);
      lines.push("");
    }

    // Location
    if (bp.address || bp.landmarks) {
      lines.push("## Location & How to Reach");
      lines.push("");
      if (bp.address) {
        const addressParts = [bp.address.street, bp.address.city, bp.address.state, bp.address.pin].filter(Boolean);
        if (addressParts.length > 0) {
          lines.push(`**Address:** ${addressParts.join(", ")}`);
          lines.push("");
        }
      }
      if (bp.landmarks?.clientDescribed) {
        lines.push(`**How to find us:** ${bp.landmarks.clientDescribed}`);
        lines.push("");
      }
      if (bp.landmarks?.autoDetected && bp.landmarks.autoDetected.length > 0) {
        lines.push(`**Nearby landmarks:** ${bp.landmarks.autoDetected.join(", ")}`);
        lines.push("");
      }
    }

    // Contact
    if (contact.phone || contact.email || contact.website) {
      lines.push("## Contact Information");
      lines.push("");
      if (contact.phone) lines.push(`- **Phone:** ${contact.phone}`);
      if (contact.email) lines.push(`- **Email:** ${contact.email}`);
      if (contact.website) lines.push(`- **Website:** [${contact.website}](${contact.website})`);
      lines.push("");
    }

    // Hours
    if (bp.hours?.regular) {
      lines.push("## Business Hours");
      lines.push("");
      lines.push("| Day | Hours |");
      lines.push("|-----|-------|");
      for (const [day, hours] of Object.entries(bp.hours.regular)) {
        const status = hours ? `${hours.open} – ${hours.close}` : "Closed";
        lines.push(`| ${capitalize(day)} | ${status} |`);
      }
      lines.push("");
    }

    // Services
    if (services.length > 0) {
      lines.push("## Our Services");
      lines.push("");
      for (const svc of services) {
        lines.push(`### ${svc.name}`);
        lines.push("");
        if (svc.description) {
          lines.push(svc.description);
          lines.push("");
        }
        if (svc.category) {
          lines.push(`*Category: ${svc.category}*`);
          lines.push("");
        }
      }
    }

    // Products
    if (products.length > 0) {
      lines.push("## Products");
      lines.push("");
      for (const prod of products) {
        lines.push(`### ${prod.name}`);
        lines.push("");
        if (prod.description) {
          lines.push(prod.description);
        }
        if (prod.price) {
          lines.push("");
          lines.push(
            `**Price:** ${prod.price.currency} ${prod.price.amount}${prod.price.salePrice ? ` ~~${prod.price.salePrice}~~` : ""}`
          );
        }
        lines.push("");
      }
    }

    // Languages
    if (languages.length > 1) {
      lines.push("## Languages");
      lines.push("");
      lines.push(`We serve customers in: ${languages.join(", ")}`);
      lines.push("");
    }

    // Voice profile as a closing statement
    if (bp.voiceProfile) {
      lines.push("---");
      lines.push("");
      lines.push(`*${bp.voiceProfile}*`);
      lines.push("");
    }

    return lines.join("\n");
  },

  validate(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!content.startsWith("# ")) errors.push("Missing title heading");
    if (!content.includes("## ")) errors.push("Missing section headings");
    if (content.length < 200) errors.push("Content too short for a comprehensive page");
    return { valid: errors.length === 0, errors };
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
