import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { eq, lte, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { CtaCard } from "../_components/cta-card";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.slug, slug),
        eq(blogPosts.status, "published"),
        lte(blogPosts.publishedAt, new Date())
      )
    )
    .limit(1);

  if (!post) {
    return { title: "Post Not Found — Citare" };
  }

  return {
    title: post.metaTitle || `${post.title} — Citare Blog`,
    description: post.metaDescription || post.excerpt || "",
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || "",
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author || "Ravi Patel"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.slug, slug),
        eq(blogPosts.status, "published"),
        lte(blogPosts.publishedAt, new Date())
      )
    )
    .limit(1);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt || "",
    author: {
      "@type": "Person",
      name: post.author || "Ravi Patel",
    },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    publisher: {
      "@type": "Organization",
      name: "Citare",
      url: "https://www.citare.ai",
    },
    mainEntityOfPage: `https://www.citare.ai/blog/${post.slug}`,
    keywords: post.tags?.join(", "),
  };

  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PublicNavbar active="/blog" />

      {/* Article */}
      <main className="px-6 pt-32 pb-24">
        <article className="mx-auto max-w-[700px]">
          {/* Back link */}
          <a
            href="/blog"
            className="text-sm"
            style={{ color: "var(--accent-primary)" }}
          >
            &larr; Back to blog
          </a>

          {/* Header */}
          <h1
            className="mt-6 font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {post.title}
          </h1>

          <div className="mt-4 flex items-center gap-3 text-sm" style={{ color: "var(--text-tertiary)" }}>
            <span>{post.author}</span>
            <span>&middot;</span>
            <span>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </span>
            <span>&middot;</span>
            <span>{post.readTimeMinutes} min read</span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div
            className="blog-content mt-10 leading-relaxed"
            style={{
              color: "var(--text-secondary)",
              fontSize: "1.05rem",
              lineHeight: 1.8,
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />

          {/* CTA */}
          <CtaCard />
        </article>
      </main>

      <PublicFooter />

      <style>{`
        .blog-content h1 { font-size: 2rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 1rem; color: var(--text-primary); }
        .blog-content h2 { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 0.75rem; color: var(--text-primary); }
        .blog-content h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary); }
        .blog-content p { margin-bottom: 1rem; }
        .blog-content ul, .blog-content ol { margin-bottom: 1rem; padding-left: 1.5rem; }
        .blog-content li { margin-bottom: 0.4rem; }
        .blog-content ul { list-style-type: disc; }
        .blog-content ol { list-style-type: decimal; }
        .blog-content a { color: var(--accent-primary); text-decoration: underline; }
        .blog-content blockquote { border-left: 3px solid var(--accent-primary); padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: var(--text-tertiary); }
        .blog-content code { background: var(--bg-tertiary); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
        .blog-content pre { background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1rem; }
        .blog-content pre code { background: none; padding: 0; }
        .blog-content hr { border: none; border-top: 1px solid var(--border-subtle); margin: 2rem 0; }
        .blog-content strong { color: var(--text-primary); font-weight: 600; }
      `}</style>
    </div>
  );
}

/**
 * Simple markdown to HTML renderer — handles common markdown patterns.
 * No external dependency needed for basic blog posts.
 */
function renderMarkdown(md: string): string {
  let html = md
    // Escape HTML (but allow intentional HTML in content)
    // Code blocks (``` ... ```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
      return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Unordered lists
    .replace(/^[*-] (.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Paragraphs: wrap remaining lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<hr")
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
