import type { KnowledgeGraphData, KGService, KGProduct, BusinessProfile } from "@/lib/knowledge-graph/types";
import type { PresenceGenerator, ClientRecord } from "./types";

/**
 * Generate Schema.org JSON-LD for a business from its knowledge graph.
 * Targets 90%+ of LocalBusiness properties.
 */
export const jsonLdGenerator: PresenceGenerator = {
  format: "json_ld",

  generate(kg: KnowledgeGraphData, client: ClientRecord, _language: string): string {
    const bp = kg.businessProfile ?? {} as BusinessProfile;
    const categories = bp.categories ?? [];
    const contact = bp.contact ?? {};
    const services = kg.services ?? [];
    const products = kg.products ?? [];
    const attributes = bp.attributes ?? [];
    const languages = bp.languages ?? [];

    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": mapBusinessType(client.businessType, categories),
      name: bp.name ?? client.name,
      description: bp.description,
      url: contact.website,
      telephone: contact.phone,
      email: contact.email,
    };

    // Address
    if (bp.address) {
      jsonLd.address = {
        "@type": "PostalAddress",
        streetAddress: bp.address.street,
        addressLocality: bp.address.city,
        addressRegion: bp.address.state,
        postalCode: bp.address.pin,
        addressCountry: "IN",
      };
    }

    // Coordinates
    if (bp.address?.coordinates) {
      jsonLd.geo = {
        "@type": "GeoCoordinates",
        latitude: bp.address.coordinates.lat,
        longitude: bp.address.coordinates.lng,
      };
    }

    // Opening hours
    if (bp.hours?.regular) {
      jsonLd.openingHoursSpecification = buildOpeningHours(bp.hours.regular);
    }

    // Categories
    if (categories.length > 0) {
      jsonLd.additionalType = categories;
    }

    // Area served
    if (bp.address?.city) {
      jsonLd.areaServed = {
        "@type": "City",
        name: bp.address.city,
      };
    }

    // Languages
    if (languages.length > 0) {
      jsonLd.availableLanguage = languages.map((l) => ({
        "@type": "Language",
        name: l,
      }));
    }

    // Services
    if (services.length > 0) {
      jsonLd.hasOfferCatalog = {
        "@type": "OfferCatalog",
        name: `Services by ${bp.name ?? client.name}`,
        itemListElement: services.map(buildServiceSchema),
      };
    }

    // Products
    if (products.length > 0) {
      jsonLd.makesOffer = products.map(buildProductSchema);
    }

    // Attributes / keywords
    if (attributes.length > 0) {
      jsonLd.keywords = attributes.join(", ");
    }

    // Landmarks as description supplement
    if (bp.landmarks) {
      const autoDetected = bp.landmarks.autoDetected ?? [];
      const landmarkText = [
        bp.landmarks.clientDescribed,
        ...autoDetected,
      ]
        .filter(Boolean)
        .join(". ");
      if (landmarkText) {
        jsonLd.hasMap = `https://maps.google.com/?q=${encodeURIComponent((bp.name ?? client.name) + " " + (bp.address?.city ?? ""))}`;
      }
    }

    return JSON.stringify(jsonLd, null, 2);
  },

  validate(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    try {
      const parsed = JSON.parse(content);
      if (!parsed["@context"]) errors.push("Missing @context");
      if (!parsed["@type"]) errors.push("Missing @type");
      if (!parsed.name) errors.push("Missing name");
    } catch {
      errors.push("Invalid JSON");
    }
    return { valid: errors.length === 0, errors };
  },
};

function mapBusinessType(
  businessType: string,
  categories: string[]
): string {
  const categoryStr = categories.join(" ").toLowerCase();

  if (categoryStr.includes("hospital") || categoryStr.includes("clinic") || categoryStr.includes("doctor") || categoryStr.includes("medical"))
    return "MedicalBusiness";
  if (categoryStr.includes("restaurant") || categoryStr.includes("cafe"))
    return "Restaurant";
  if (categoryStr.includes("salon") || categoryStr.includes("beauty"))
    return "BeautySalon";
  if (categoryStr.includes("school") || categoryStr.includes("education") || categoryStr.includes("university"))
    return "EducationalOrganization";
  if (categoryStr.includes("store") || categoryStr.includes("shop"))
    return "Store";
  if (businessType === "ecommerce") return "Store";

  return "LocalBusiness";
}

function buildOpeningHours(
  regular: Record<string, { open: string; close: string } | null>
): Array<Record<string, unknown>> {
  const dayMap: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  return Object.entries(regular)
    .filter(([, hours]) => hours !== null)
    .map(([day, hours]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayMap[day] ?? day,
      opens: hours!.open,
      closes: hours!.close,
    }));
}

function buildServiceSchema(service: KGService): Record<string, unknown> {
  return {
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: service.name,
      description: service.description,
      category: service.category,
    },
  };
}

function buildProductSchema(product: KGProduct): Record<string, unknown> {
  const offer: Record<string, unknown> = {
    "@type": "Offer",
    itemOffered: {
      "@type": "Product",
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
      sku: product.sku,
      gtin: product.gtin,
      image: product.images,
    },
  };

  if (product.price) {
    offer.price = product.price.amount;
    offer.priceCurrency = product.price.currency;
  }

  if (product.aggregateRating) {
    (offer.itemOffered as Record<string, unknown>).aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.aggregateRating.ratingValue,
      reviewCount: product.aggregateRating.reviewCount,
    };
  }

  return offer;
}
