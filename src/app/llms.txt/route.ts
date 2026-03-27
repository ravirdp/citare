export function GET() {
  const content = `# Citare
> AI Search Intelligence Platform

## What is Citare?
Citare makes businesses visible and accurately represented across AI search platforms including ChatGPT, Perplexity, Google AI Overviews, Gemini, and Claude. It is not an SEO tool — it optimizes for how AI models consume and recommend information.

## What does Citare do?
- Ingests business data from Google Ads, Google Business Profile, Search Console, and Analytics
- Builds a knowledge graph of the business (services, products, locations, competitors)
- Generates AI-optimized structured data: JSON-LD, llms.txt, FAQ schema, markdown, product feeds
- Deploys structured data for AI discovery
- Monitors how the business appears across 5 AI platforms daily
- Tracks AI visibility scores, competitor mentions, and accuracy
- Provides actionable recommendations to improve AI visibility
- Calculates the ad-equivalent value of AI visibility in INR

## Who is Citare for?
- Indian businesses spending ₹10K+/month on Google Ads
- Digital marketing agencies managing multiple clients
- Businesses in healthcare, education, e-commerce, and professional services
- Any business that wants to be found and accurately described by AI search platforms

## Key features
- AI Visibility Score: Single metric across ChatGPT, Perplexity, Google AI, Gemini, Claude
- Competitor Intelligence: Track which competitors AI platforms recommend
- Actionable Recommendations: Specific actions with data-backed reasoning
- ROI Measurement: Ad-equivalent value of AI visibility in rupees
- Monthly Reports: Executive summaries with trends and insights
- Knowledge Graph: Structured representation of your business for AI consumption

## How to get started
- Free AI Visibility Audit: https://www.citare.ai/audit
- Sign up: https://www.citare.ai/signup
- Contact: ravi@citare.ai

## Location
Bangalore, India

## Website
https://www.citare.ai
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
