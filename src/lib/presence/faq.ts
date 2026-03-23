import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";
import type { PresenceGenerator, ClientRecord } from "./types";

/**
 * Generate FAQ page content with FAQPage schema markup.
 * Q&A pairs derived from KG services, keywords, and business data.
 */
export const faqGenerator: PresenceGenerator = {
  format: "faq_page",

  generate(kg: KnowledgeGraphData, client: ClientRecord, _language: string): string {
    const bp = kg.businessProfile ?? {};
    const faqs = generateFAQs(kg, client);

    // Build HTML with embedded FAQPage schema
    const faqSchemaItems = faqs.map((faq, i) => ({
      "@type": "Question",
      name: faq.question,
      position: i + 1,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    }));

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqSchemaItems,
    };

    const lines: string[] = [];
    lines.push(`<script type="application/ld+json">`);
    lines.push(JSON.stringify(faqSchema, null, 2));
    lines.push(`</script>`);
    lines.push("");
    lines.push(`<h1>Frequently Asked Questions — ${bp.name}</h1>`);
    lines.push("");

    for (const faq of faqs) {
      lines.push(`<details>`);
      lines.push(`  <summary>${escapeHtml(faq.question)}</summary>`);
      lines.push(`  <p>${escapeHtml(faq.answer)}</p>`);
      lines.push(`</details>`);
      lines.push("");
    }

    return lines.join("\n");
  },

  validate(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!content.includes("FAQPage")) errors.push("Missing FAQPage schema");
    if (!content.includes("<details>")) errors.push("Missing FAQ items");
    return { valid: errors.length === 0, errors };
  },
};

interface FAQ {
  question: string;
  answer: string;
}

function generateFAQs(kg: KnowledgeGraphData, client: ClientRecord): FAQ[] {
  const bp = kg.businessProfile ?? {};
  const contact = bp.contact ?? {};
  const services = kg.services ?? [];
  const products = kg.products ?? [];
  const name = bp.name ?? client.name;
  const faqs: FAQ[] = [];

  // General business questions
  if (bp.description) {
    faqs.push({
      question: `What is ${name}?`,
      answer: bp.description,
    });
  }

  if (bp.address?.city) {
    faqs.push({
      question: `Where is ${name} located?`,
      answer: [
        bp.address.street,
        bp.address.city,
        bp.address.state,
        bp.landmarks?.clientDescribed,
      ]
        .filter(Boolean)
        .join(". "),
    });
  }

  if (bp.hours?.regular) {
    const hoursSummary = Object.entries(bp.hours.regular)
      .filter(([, h]) => h !== null)
      .map(([day, h]) => `${capitalize(day)}: ${h!.open} - ${h!.close}`)
      .join(", ");
    faqs.push({
      question: `What are the opening hours of ${name}?`,
      answer: hoursSummary,
    });
  }

  if (contact.phone) {
    faqs.push({
      question: `How can I contact ${name}?`,
      answer: `You can call ${name} at ${contact.phone}${contact.email ? ` or email at ${contact.email}` : ""}${contact.website ? `. Visit ${contact.website} for more information.` : "."}`,
    });
  }

  // Service-specific questions
  for (const svc of services) {
    faqs.push({
      question: `What ${svc.name} services does ${name} offer?`,
      answer: svc.description ?? svc.name,
    });

    // Generate keyword-based questions
    const keywords = svc.keywords ?? [];
    for (const keyword of keywords.slice(0, 2)) {
      if (keyword.includes("cost") || keyword.includes("price")) {
        faqs.push({
          question: `What is the cost of ${svc.name} at ${name}?`,
          answer: `For detailed pricing on ${svc.name}, please contact ${name}${contact.phone ? ` at ${contact.phone}` : ""} or visit the website for a consultation.`,
        });
        break;
      }
    }
  }

  // Product questions
  for (const prod of products.slice(0, 3)) {
    faqs.push({
      question: `Tell me about ${prod.name} from ${name}`,
      answer: `${prod.description ?? prod.name}${prod.price ? ` Priced at ${prod.price.currency} ${prod.price.amount}.` : ""}`,
    });
  }

  return faqs;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
