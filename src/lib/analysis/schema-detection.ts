/**
 * Schema.org Detection — Checks existing structured data on a webpage.
 * Detects JSON-LD, microdata, and RDFa markup.
 */

import type { SchemaOrgDetection } from "./types";

/**
 * Analyze HTML content for schema.org structured data.
 */
export function detectSchemaOrg(html: string): SchemaOrgDetection {
  const schemas: string[] = [];
  let hasJsonLd = false;
  let hasMicrodata = false;
  let hasRdfa = false;

  // 1. Detect JSON-LD blocks
  const jsonLdPattern = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    hasJsonLd = true;
    try {
      const data = JSON.parse(match[1]);
      const types = extractTypes(data);
      for (const t of types) {
        if (!schemas.includes(t)) schemas.push(t);
      }
    } catch {
      // Malformed JSON-LD — still counts as having it
    }
  }

  // 2. Detect microdata (itemscope/itemtype)
  const microdataPattern = /itemtype\s*=\s*["']https?:\/\/schema\.org\/(\w+)["']/gi;
  while ((match = microdataPattern.exec(html)) !== null) {
    hasMicrodata = true;
    const typeName = match[1];
    if (!schemas.includes(typeName)) schemas.push(typeName);
  }

  // 3. Detect RDFa (typeof with schema.org vocab)
  const rdfaPattern = /typeof\s*=\s*["'](?:schema:)?(\w+)["']/gi;
  if (/vocab\s*=\s*["']https?:\/\/schema\.org/i.test(html)) {
    while ((match = rdfaPattern.exec(html)) !== null) {
      hasRdfa = true;
      const typeName = match[1];
      if (!schemas.includes(typeName)) schemas.push(typeName);
    }
  }

  // Calculate completeness based on best practices for a local business
  const idealSchemas = [
    "LocalBusiness", "Organization", "Product", "Service",
    "FAQPage", "BreadcrumbList", "WebSite", "WebPage",
  ];
  const foundIdeal = idealSchemas.filter(
    (s) => schemas.some((found) => found.toLowerCase() === s.toLowerCase())
  );
  const completenessScore = Math.round((foundIdeal.length / idealSchemas.length) * 100);

  const recommendations = generateSchemaRecommendations(schemas, hasJsonLd, hasMicrodata);

  return {
    hasJsonLd,
    hasMicrodata,
    hasRdfa,
    schemas,
    completenessScore,
    recommendations,
  };
}

function extractTypes(data: unknown): string[] {
  const types: string[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      types.push(...extractTypes(item));
    }
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj["@type"]) {
      const typeVal = obj["@type"];
      if (typeof typeVal === "string") {
        types.push(typeVal.replace("schema:", "").replace("https://schema.org/", ""));
      } else if (Array.isArray(typeVal)) {
        for (const t of typeVal) {
          if (typeof t === "string") {
            types.push(t.replace("schema:", "").replace("https://schema.org/", ""));
          }
        }
      }
    }
    // Check @graph
    if (obj["@graph"] && Array.isArray(obj["@graph"])) {
      types.push(...extractTypes(obj["@graph"]));
    }
  }

  return types;
}

function generateSchemaRecommendations(
  schemas: string[],
  hasJsonLd: boolean,
  _hasMicrodata: boolean
): string[] {
  const recs: string[] = [];
  const lower = schemas.map((s) => s.toLowerCase());

  if (!hasJsonLd) {
    recs.push("Add JSON-LD structured data — this is the format preferred by AI models and Google");
  }

  if (!lower.includes("localbusiness") && !lower.includes("organization")) {
    recs.push("Add LocalBusiness or Organization schema with complete NAP (Name, Address, Phone)");
  }

  if (!lower.includes("faqpage")) {
    recs.push("Add FAQPage schema — FAQ content is highly citable by AI platforms");
  }

  if (!lower.includes("product") && !lower.includes("service")) {
    recs.push("Add Product or Service schema for your offerings");
  }

  if (!lower.includes("breadcrumblist")) {
    recs.push("Add BreadcrumbList schema for better content hierarchy signals");
  }

  if (!lower.includes("website")) {
    recs.push("Add WebSite schema with SearchAction for sitelinks");
  }

  if (recs.length === 0) {
    recs.push("Good schema coverage. Consider adding Review or AggregateRating for social proof.");
  }

  return recs;
}
