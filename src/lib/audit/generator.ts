/**
 * Free Audit Generator — Standalone audit orchestrator that combines
 * citability scoring, crawler access check, brand mention scanning,
 * schema.org detection, and content structure analysis into a single
 * GEO Score report.
 *
 * Input: website URL + business name (no Google Ads required)
 */

import { db } from "@/lib/db/client";
import { audits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { analyzeContentCitability, extractContentBlocks } from "@/lib/analysis/citability";
import { analyzeCrawlerAccess, crawlerAccessToScore } from "@/lib/analysis/crawler-access";
import { scanBrandMentions } from "@/lib/analysis/brand-mentions";
import { detectSchemaOrg } from "@/lib/analysis/schema-detection";
import { analyzeContentStructure } from "@/lib/analysis/content-structure";
import type {
  AuditReport,
  GeoScore,
  AuditActionItem,
  CitabilityScore,
  CrawlerAccessReport,
  BrandAuthorityScore,
  SchemaOrgDetection,
} from "@/lib/analysis/types";

const MAX_CRAWL_PAGES = 10;

// ── Website crawler ───────────────────────────────────────

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "CitareBot/1.0 (+https://citare.ai)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return { html, finalUrl: res.url };
  } catch {
    return null;
  }
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const pattern = /href\s*=\s*["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  let origin: string;

  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return [];
  }

  while ((match = pattern.exec(html)) !== null) {
    const href = match[1];
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.origin === origin && !resolved.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|pdf|zip|woff|ttf)$/i)) {
        const clean = resolved.origin + resolved.pathname;
        if (!links.includes(clean) && clean !== baseUrl) {
          links.push(clean);
        }
      }
    } catch { /* skip invalid URLs */ }
  }

  return links;
}

async function crawlWebsite(url: string): Promise<{ pages: Array<{ url: string; html: string }>; domain: string }> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const pages: Array<{ url: string; html: string }> = [];

  // Fetch homepage
  const homepage = await fetchPage(normalizedUrl);
  if (!homepage) {
    return { pages: [], domain: "" };
  }

  let domain: string;
  try {
    domain = new URL(homepage.finalUrl).hostname;
  } catch {
    domain = normalizedUrl.replace(/^https?:\/\//, "").split("/")[0];
  }

  pages.push({ url: homepage.finalUrl, html: homepage.html });

  // Extract and crawl internal links (up to MAX_CRAWL_PAGES)
  const internalLinks = extractInternalLinks(homepage.html, homepage.finalUrl);
  const toCrawl = internalLinks.slice(0, MAX_CRAWL_PAGES - 1);

  const crawlResults = await Promise.allSettled(
    toCrawl.map(async (link) => {
      const result = await fetchPage(link);
      if (result) {
        return { url: link, html: result.html };
      }
      return null;
    })
  );

  for (const result of crawlResults) {
    if (result.status === "fulfilled" && result.value) {
      pages.push(result.value);
    }
  }

  return { pages, domain };
}

// ── GEO Score calculation ─────────────────────────────────

function calculateGeoScore(
  citability: CitabilityScore,
  crawlerAccess: CrawlerAccessReport,
  brandAuthority: BrandAuthorityScore,
  schemaDetection: SchemaOrgDetection,
  contentStructureScore: number
): GeoScore {
  const crawlerScore = crawlerAccessToScore(crawlerAccess);

  return {
    overall: Math.round(
      citability.averageScore * 0.25 +
      crawlerScore * 0.15 +
      brandAuthority.overallScore * 0.20 +
      schemaDetection.completenessScore * 0.15 +
      contentStructureScore * 0.25
    ),
    breakdown: {
      citability: Math.round(citability.averageScore),
      crawlerAccess: crawlerScore,
      brandAuthority: brandAuthority.overallScore,
      schemaCompleteness: schemaDetection.completenessScore,
      contentStructure: contentStructureScore,
    },
  };
}

// ── Action item generation ────────────────────────────────

function generateActionItems(
  crawlerAccess: CrawlerAccessReport,
  citability: CitabilityScore,
  schemaDetection: SchemaOrgDetection,
  brandAuthority: BrandAuthorityScore,
  contentStructureScore: number
): AuditActionItem[] {
  const items: AuditActionItem[] = [];

  // Crawler access issues (critical first)
  if (crawlerAccess.overallStatus === "critical_blocked") {
    items.push({
      category: "crawler_access",
      severity: "critical",
      title: "Major AI crawlers are blocked",
      description: `${crawlerAccess.criticalCount} critical AI crawler(s) blocked by robots.txt. Your business is invisible to these AI search platforms. ${crawlerAccess.recommendations[0] ?? ""}`,
    });
  } else if (crawlerAccess.overallStatus === "some_blocked") {
    items.push({
      category: "crawler_access",
      severity: "high",
      title: "Some AI crawlers are blocked",
      description: `${crawlerAccess.blockedCount} AI crawler(s) blocked. Consider allowing access for better visibility.`,
    });
  }

  // Schema issues
  if (schemaDetection.completenessScore < 25) {
    items.push({
      category: "schema",
      severity: "high",
      title: "Missing structured data (schema.org)",
      description: `Only ${schemaDetection.schemas.length} schema type(s) found. ${schemaDetection.recommendations[0] ?? "Add JSON-LD structured data."}`,
    });
  } else if (schemaDetection.completenessScore < 50) {
    items.push({
      category: "schema",
      severity: "medium",
      title: "Incomplete structured data",
      description: `Schema completeness at ${schemaDetection.completenessScore}%. ${schemaDetection.recommendations[0] ?? ""}`,
    });
  }

  // Citability issues
  if (citability.averageScore < 40) {
    items.push({
      category: "citability",
      severity: "high",
      title: "Low content citability",
      description: `Average citability score is ${citability.averageScore}/100. Content blocks need to be more self-contained, fact-rich, and optimally sized (134-167 words).`,
    });
  } else if (citability.averageScore < 60) {
    items.push({
      category: "citability",
      severity: "medium",
      title: "Moderate content citability",
      description: `Average citability at ${citability.averageScore}/100. ${citability.bottomBlocks[0]?.suggestions[0] ?? "Improve weakest content blocks."}`,
    });
  }

  // Content structure issues
  if (contentStructureScore < 40) {
    items.push({
      category: "content_structure",
      severity: "high",
      title: "Poor content structure",
      description: "Content lacks proper headings, lists, and organized sections. AI models struggle to extract information from unstructured pages.",
    });
  } else if (contentStructureScore < 60) {
    items.push({
      category: "content_structure",
      severity: "medium",
      title: "Content structure needs improvement",
      description: "Add more subheadings, bullet lists, and shorter paragraphs for better AI parseability.",
    });
  }

  // Brand authority issues
  if (brandAuthority.overallScore < 30) {
    items.push({
      category: "brand_authority",
      severity: "medium",
      title: "Low brand authority across AI-sourced platforms",
      description: `Brand authority score: ${brandAuthority.overallScore}/100. ${brandAuthority.topRecommendations[0] ?? "Build presence on YouTube, Reddit, and Wikipedia."}`,
    });
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

  return items;
}

// ── Public API ────────────────────────────────────────────

interface AuditContact {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactCity?: string;
}

export async function runAudit(url: string, businessName: string, contact?: AuditContact): Promise<AuditReport> {
  // Create audit record
  const [audit] = await db
    .insert(audits)
    .values({
      url,
      businessName,
      status: "running",
      contactName: contact?.contactName,
      contactEmail: contact?.contactEmail,
      contactPhone: contact?.contactPhone,
      contactCity: contact?.contactCity,
    })
    .returning();

  try {
    // 1. Crawl website
    const { pages, domain } = await crawlWebsite(url);

    if (pages.length === 0) {
      await db.update(audits).set({ status: "failed", errorMessage: "Could not fetch website" }).where(eq(audits.id, audit.id));
      throw new Error("Could not fetch the website. Check the URL and try again.");
    }

    // 2. Combine all page content for citability analysis
    const allContent = pages.map((p) => {
      // Strip to text for citability
      return p.html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        .replace(/<[^>]+>/g, "\n")
        .replace(/\n{3,}/g, "\n\n");
    }).join("\n\n");

    // 3. Run all analyses in parallel
    const [citability, crawlerAccess, brandAuthority, schemaDetection, contentStructure] = await Promise.all([
      Promise.resolve(analyzeContentCitability(allContent)),
      analyzeCrawlerAccess(domain),
      scanBrandMentions(businessName),
      Promise.resolve(detectSchemaOrg(pages[0].html)), // Schema from homepage
      Promise.resolve(analyzeContentStructure(pages[0].html)), // Structure from homepage
    ]);

    // 4. Calculate GEO score
    const geoScore = calculateGeoScore(
      citability,
      crawlerAccess,
      brandAuthority,
      schemaDetection,
      contentStructure.score
    );

    // 5. Generate action items
    const actionItems = generateActionItems(
      crawlerAccess,
      citability,
      schemaDetection,
      brandAuthority,
      contentStructure.score
    );

    const report: AuditReport = {
      id: audit.id,
      url,
      businessName,
      geoScore,
      citability,
      crawlerAccess,
      brandAuthority,
      schemaDetection,
      actionItems,
      createdAt: audit.createdAt?.toISOString() ?? new Date().toISOString(),
    };

    // 6. Save results
    await db
      .update(audits)
      .set({
        status: "completed",
        geoScore: String(geoScore.overall),
        results: report as unknown as Record<string, unknown>,
      })
      .where(eq(audits.id, audit.id));

    return report;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(audits)
      .set({ status: "failed", errorMessage: message })
      .where(eq(audits.id, audit.id));
    throw err;
  }
}

export async function getAuditById(auditId: string): Promise<AuditReport | null> {
  const [audit] = await db
    .select()
    .from(audits)
    .where(eq(audits.id, auditId))
    .limit(1);

  if (!audit || audit.status !== "completed") return null;
  return audit.results as unknown as AuditReport;
}
