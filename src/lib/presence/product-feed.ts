import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";
import type { PresenceGenerator, ClientRecord } from "./types";

/**
 * Generate a product/service feed in JSON format.
 * Compatible with Google Merchant Center structure.
 */
export const productFeedGenerator: PresenceGenerator = {
  format: "product_feed",

  generate(kg: KnowledgeGraphData, client: ClientRecord, _language: string): string {
    const bp = kg.businessProfile ?? {};
    const contact = bp.contact ?? {};
    const services = kg.services ?? [];
    const products = kg.products ?? [];
    const baseUrl = contact.website ?? `/presence/${client.slug}/about`;

    const feed = {
      feedVersion: "1.0",
      businessName: bp.name ?? client.name,
      businessUrl: contact.website,
      generatedAt: new Date().toISOString(),
      items: [
        ...services.map((svc) => ({
          type: "service" as const,
          id: svc.id,
          title: svc.name,
          description: svc.description,
          category: svc.category,
          link: baseUrl,
          availability: "in_stock",
          condition: "new",
        })),
        ...products.map((prod) => ({
          type: "product" as const,
          id: prod.id,
          title: prod.name,
          description: prod.description,
          category: prod.category,
          link: baseUrl,
          availability: "in_stock",
          condition: "new",
          price: prod.price
            ? {
                value: prod.price.amount,
                currency: prod.price.currency,
                salePrice: prod.price.salePrice,
              }
            : undefined,
          brand: prod.brand,
          gtin: prod.gtin,
          sku: prod.sku,
          images: prod.images,
          rating: prod.aggregateRating,
        })),
      ],
    };

    return JSON.stringify(feed, null, 2);
  },

  validate(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    try {
      const parsed = JSON.parse(content);
      if (!parsed.feedVersion) errors.push("Missing feedVersion");
      if (!Array.isArray(parsed.items)) errors.push("Missing items array");
    } catch {
      errors.push("Invalid JSON");
    }
    return { valid: errors.length === 0, errors };
  },
};
