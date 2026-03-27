/**
 * AI Crawler Access Check — Parses robots.txt to determine whether
 * AI search crawlers are allowed or blocked.
 *
 * Blocking GPTBot = invisible to ChatGPT regardless of content quality.
 * Based on geo-seo-claude's fetch_page.py robots.txt analysis,
 * rewritten for Citare's TypeScript stack.
 */

import type {
  CrawlerResult,
  CrawlerAccessReport,
  CrawlerAccessStatus,
  CrawlerSeverity,
} from "./types";

// ── Crawler definitions ───────────────────────────────────

interface CrawlerDef {
  name: string;
  userAgent: string;
  severity: CrawlerSeverity; // severity if blocked
}

const AI_CRAWLERS: CrawlerDef[] = [
  { name: "GPTBot", userAgent: "GPTBot", severity: "critical" },
  { name: "ChatGPT-User", userAgent: "ChatGPT-User", severity: "critical" },
  { name: "ClaudeBot", userAgent: "ClaudeBot", severity: "critical" },
  { name: "Claude-Web", userAgent: "Claude-Web", severity: "critical" },
  { name: "PerplexityBot", userAgent: "PerplexityBot", severity: "critical" },
  { name: "Google-Extended", userAgent: "Google-Extended", severity: "warning" },
  { name: "Googlebot", userAgent: "Googlebot", severity: "warning" },
  { name: "Bingbot", userAgent: "Bingbot", severity: "warning" },
  { name: "Bytespider", userAgent: "Bytespider", severity: "info" },
  { name: "Applebot-Extended", userAgent: "Applebot-Extended", severity: "info" },
  { name: "FacebookBot", userAgent: "FacebookBot", severity: "info" },
  { name: "anthropic-ai", userAgent: "anthropic-ai", severity: "critical" },
  { name: "cohere-ai", userAgent: "cohere-ai", severity: "info" },
  { name: "Meta-ExternalAgent", userAgent: "Meta-ExternalAgent", severity: "info" },
];

// ── Robots.txt parser ─────────────────────────────────────

interface RobotsRule {
  userAgent: string;
  disallowPaths: string[];
  allowPaths: string[];
}

function parseRobotsTxt(content: string): RobotsRule[] {
  const rules: RobotsRule[] = [];
  let currentAgents: string[] = [];
  let currentDisallow: string[] = [];
  let currentAllow: string[] = [];

  const flush = () => {
    if (currentAgents.length > 0) {
      for (const agent of currentAgents) {
        rules.push({
          userAgent: agent,
          disallowPaths: [...currentDisallow],
          allowPaths: [...currentAllow],
        });
      }
    }
    currentAgents = [];
    currentDisallow = [];
    currentAllow = [];
  };

  for (const rawLine of content.split("\n")) {
    const line = rawLine.split("#")[0].trim(); // strip comments
    if (!line) continue;

    const match = line.match(/^(User-agent|Disallow|Allow)\s*:\s*(.*)/i);
    if (!match) continue;

    const directive = match[1].toLowerCase();
    const value = match[2].trim();

    if (directive === "user-agent") {
      // New agent block — flush previous if we already had disallow/allow rules
      if (currentDisallow.length > 0 || currentAllow.length > 0) {
        flush();
      }
      currentAgents.push(value);
    } else if (directive === "disallow") {
      currentDisallow.push(value);
    } else if (directive === "allow") {
      currentAllow.push(value);
    }
  }

  flush();
  return rules;
}

function checkCrawlerAccess(
  rules: RobotsRule[],
  crawler: CrawlerDef
): { status: CrawlerAccessStatus; rule?: string } {
  // Find rules that match this crawler (exact or wildcard *)
  const matchingRules = rules.filter(
    (r) =>
      r.userAgent === "*" ||
      r.userAgent.toLowerCase() === crawler.userAgent.toLowerCase()
  );

  if (matchingRules.length === 0) {
    return { status: "not_mentioned" };
  }

  // Prefer specific rules over wildcard
  const specific = matchingRules.find(
    (r) => r.userAgent.toLowerCase() === crawler.userAgent.toLowerCase()
  );
  const ruleSet = specific ?? matchingRules[0];

  // Check for blanket block (Disallow: /)
  const blocksAll = ruleSet.disallowPaths.some((p) => p === "/");
  const hasAllows = ruleSet.allowPaths.length > 0;

  if (blocksAll && !hasAllows) {
    return { status: "blocked", rule: `User-agent: ${ruleSet.userAgent}\nDisallow: /` };
  }

  if (blocksAll && hasAllows) {
    return {
      status: "conditionally_allowed",
      rule: `User-agent: ${ruleSet.userAgent}\nDisallow: /\nAllow: ${ruleSet.allowPaths.join(", ")}`,
    };
  }

  if (ruleSet.disallowPaths.length > 0 && ruleSet.disallowPaths.some((p) => p !== "")) {
    return {
      status: "conditionally_allowed",
      rule: `User-agent: ${ruleSet.userAgent}\nDisallow: ${ruleSet.disallowPaths.filter(Boolean).join(", ")}`,
    };
  }

  return { status: "allowed" };
}

// ── Public API ────────────────────────────────────────────

/**
 * Fetch and analyze robots.txt for AI crawler access.
 * In simulation mode, uses the provided content string instead of fetching.
 */
export async function analyzeCrawlerAccess(
  domain: string,
  robotsTxtContent?: string
): Promise<CrawlerAccessReport> {
  const robotsTxtUrl = `https://${domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/robots.txt`;
  let content = robotsTxtContent ?? "";
  let robotsTxtFound = !!robotsTxtContent;

  if (!robotsTxtContent) {
    try {
      const res = await fetch(robotsTxtUrl, {
        headers: { "User-Agent": "CitareBot/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        content = await res.text();
        robotsTxtFound = true;
      }
    } catch {
      // robots.txt not found or fetch failed
    }
  }

  const rules = robotsTxtFound ? parseRobotsTxt(content) : [];

  const crawlers: CrawlerResult[] = AI_CRAWLERS.map((crawler) => {
    if (!robotsTxtFound) {
      return {
        name: crawler.name,
        userAgent: crawler.userAgent,
        status: "not_mentioned" as CrawlerAccessStatus,
        severity: crawler.severity,
      };
    }

    const { status, rule } = checkCrawlerAccess(rules, crawler);
    return {
      name: crawler.name,
      userAgent: crawler.userAgent,
      status,
      severity: crawler.severity,
      rule,
    };
  });

  const criticalCount = crawlers.filter(
    (c) => c.status === "blocked" && c.severity === "critical"
  ).length;
  const blockedCount = crawlers.filter((c) => c.status === "blocked").length;

  const overallStatus: CrawlerAccessReport["overallStatus"] =
    criticalCount > 0
      ? "critical_blocked"
      : blockedCount > 0
        ? "some_blocked"
        : "all_allowed";

  const recommendations = generateCrawlerRecommendations(crawlers);

  return {
    domain,
    robotsTxtFound,
    robotsTxtUrl,
    crawlers,
    overallStatus,
    recommendations,
    criticalCount,
    blockedCount,
  };
}

function generateCrawlerRecommendations(crawlers: CrawlerResult[]): string[] {
  const recs: string[] = [];
  const blocked = crawlers.filter((c) => c.status === "blocked");
  const criticalBlocked = blocked.filter((c) => c.severity === "critical");

  if (criticalBlocked.length > 0) {
    const names = criticalBlocked.map((c) => c.name).join(", ");
    recs.push(
      `CRITICAL: ${names} ${criticalBlocked.length === 1 ? "is" : "are"} blocked. ` +
      `Your business is invisible to these AI search platforms. Add the following to robots.txt:`
    );
    for (const c of criticalBlocked) {
      recs.push(`  User-agent: ${c.userAgent}\n  Allow: /`);
    }
  }

  const warningBlocked = blocked.filter((c) => c.severity === "warning");
  if (warningBlocked.length > 0) {
    const names = warningBlocked.map((c) => c.name).join(", ");
    recs.push(
      `WARNING: ${names} ${warningBlocked.length === 1 ? "is" : "are"} blocked. ` +
      `Consider allowing access for better AI search visibility.`
    );
  }

  const conditional = crawlers.filter((c) => c.status === "conditionally_allowed");
  if (conditional.length > 0) {
    recs.push(
      `${conditional.map((c) => c.name).join(", ")} have partial access. Review which paths are blocked.`
    );
  }

  if (blocked.length === 0) {
    recs.push("All major AI crawlers have access. No robots.txt changes needed.");
  }

  return recs;
}

/**
 * Map crawler access to a 0-100 score for the audit composite.
 */
export function crawlerAccessToScore(report: CrawlerAccessReport): number {
  if (!report.robotsTxtFound) return 80; // no robots.txt = generally open

  const critical = AI_CRAWLERS.filter((c) => c.severity === "critical");
  const criticalAllowed = report.crawlers.filter(
    (c) =>
      c.severity === "critical" &&
      (c.status === "allowed" || c.status === "not_mentioned")
  ).length;

  // Score = percentage of critical crawlers allowed, scaled 0-100
  return Math.round((criticalAllowed / critical.length) * 100);
}
