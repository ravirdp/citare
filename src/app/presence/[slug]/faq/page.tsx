import { notFound } from "next/navigation";
import { getDeployedContent } from "../utils";

/**
 * /presence/:slug/faq
 * Render the FAQ page with FAQPage schema (public, no auth).
 */
export default async function FAQPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getDeployedContent(slug, "faq_page");

  if (!result) {
    notFound();
  }

  const faqHtml = result.deployment.content!;

  return (
    <article className="faq-page">
      <div dangerouslySetInnerHTML={{ __html: faqHtml }} />
      <footer style={{ marginTop: 48, paddingTop: 16, borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
        <a
          href="https://www.citare.ai"
          target="_blank"
          rel="noopener"
          style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}
        >
          Powered by Citare &mdash; AI Search Intelligence
        </a>
      </footer>
      <style>{`
        .faq-page details {
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
        }
        .faq-page summary {
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          color: #1f2937;
        }
        .faq-page summary:hover {
          color: #0d9488;
        }
        .faq-page details p {
          margin-top: 0.5rem;
          color: #4b5563;
          line-height: 1.6;
        }
        .faq-page h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #111827;
        }
      `}</style>
    </article>
  );
}
