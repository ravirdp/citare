export function GET() {
  const content = `# Citare
> AI Search Intelligence Platform

## What Citare Does
Citare makes businesses visible across AI search platforms including ChatGPT, Perplexity, Google AI Overviews, Gemini, and Claude. We connect to a business's Google Ads data, build an AI-optimized knowledge graph, generate structured content in formats AI platforms understand (JSON-LD, llms.txt, FAQ pages), and continuously monitor how the business appears in AI search results.

## Services
- AI Visibility Audit: Free instant analysis of any website's AI search readiness
- AI Search Monitoring: Track how AI platforms describe and recommend your business daily
- Presence Optimization: Generate and deploy AI-optimized structured data
- Competitor Intelligence: Track which competitors AI platforms recommend instead of you
- Attribution & ROI: Measure the rupee value of AI search visibility

## For Whom
- Indian businesses spending ₹10,000+/month on Google Ads
- Healthcare clinics, education providers, e-commerce stores, professional services
- Digital marketing agencies managing multiple clients

## Pricing
- Starter: ₹6,000/month (1 location, 10 services)
- Growth: ₹10,000/month (25 services/products)
- E-Commerce: ₹15,000/month (30 product focus model)
- Enterprise: ₹20,000/month (unlimited, multi-location)
- All plans include 7-day free trial

## Contact
- Website: https://www.citare.ai
- Email: ravi@citare.ai
- Location: Bangalore, India
- Free Audit: https://www.citare.ai/audit
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
