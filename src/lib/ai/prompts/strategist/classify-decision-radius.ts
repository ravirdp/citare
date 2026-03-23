import type { KGService } from "@/lib/knowledge-graph/types";

/**
 * Build the strategist prompt for classifying services into
 * decision radius categories.
 */
export function buildClassifyDecisionRadiusPrompt(
  services: KGService[]
): string {
  const servicesJson = JSON.stringify(
    services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      keywords: s.keywords,
      cpcData: s.cpcData,
      description: s.description,
    })),
    null,
    2
  );

  return `# Decision Radius Classification — Tier One Strategist

You are classifying business services into decision radius categories for an AI Search Intelligence Platform. The decision radius determines how far a customer will travel or search for this service, which affects how we optimize the business's AI search presence.

## Services to Classify

\`\`\`json
${servicesJson}
\`\`\`

## Classification Categories

### Planned (City-wide search radius)
- **Definition**: Customer plans this purchase days/weeks ahead. Researches extensively before deciding.
- **Signals**: High CPC (typically >₹100), long-tail keywords, comparison keywords ("best", "top", "vs"), high-intent informational queries
- **Examples**: Hair transplant, study abroad, home renovation, wedding planning, surgical procedures
- **AI Search Impact**: High — customers explicitly ask AI assistants for recommendations

### Considered (Local area, 5-15 km radius)
- **Definition**: Customer has a need, compares a few options nearby. Decision within hours to days.
- **Signals**: Medium CPC (₹30-100), location-modified keywords ("near me", "in [area]"), moderate research intent
- **Examples**: Packers & movers, dental cleaning, tuition classes, salon services, AC repair
- **AI Search Impact**: Medium — customers ask AI for nearby options, want quick comparison

### Impulse (Immediate proximity, <3 km)
- **Definition**: Customer needs it now. Minimal comparison, nearest option wins.
- **Signals**: Low CPC (<₹30), urgent keywords ("emergency", "24 hours", "near me now"), low consideration time
- **Examples**: Food delivery, auto repair breakdown, pharmacy, locksmith, quick print shop
- **AI Search Impact**: Lower for AI search (more maps/immediate action), but still relevant for voice queries

## Classification Rules

1. Use CPC data as a strong signal — higher CPC generally correlates with more considered/planned decisions
2. Keyword intent matters: "best [service] in [city]" = planned; "[service] near me" = considered; "emergency [service]" = impulse
3. The same business can have services in different categories (e.g., a clinic: planned surgery + considered checkup + impulse emergency visit)
4. When in doubt between two categories, lean toward the one with higher CPC

## Output

Return a JSON object mapping each service ID to its classification:

\`\`\`json
{
  "svc_id_1": "planned",
  "svc_id_2": "considered",
  "svc_id_3": "impulse"
}
\`\`\`

Return ONLY the JSON object, no explanation.`;
}
