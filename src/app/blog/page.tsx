import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { eq, lte, and, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  let posts: {
    title: string;
    slug: string;
    excerpt: string | null;
    author: string | null;
    publishedAt: Date | null;
    tags: string[] | null;
    readTimeMinutes: number | null;
  }[] = [];

  try {
    posts = await db
      .select({
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        author: blogPosts.author,
        publishedAt: blogPosts.publishedAt,
        tags: blogPosts.tags,
        readTimeMinutes: blogPosts.readTimeMinutes,
      })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "published"),
          lte(blogPosts.publishedAt, new Date())
        )
      )
      .orderBy(desc(blogPosts.publishedAt));
  } catch {
    // DB unavailable at build time
  }

  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Navigation */}
      <nav
        className="fixed top-0 right-0 left-0 z-50"
        style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <a
            href="/"
            className="text-xl font-bold tracking-[0.05em] uppercase"
            style={{ color: "var(--text-primary)" }}
          >
            C<span style={{ color: "var(--accent-primary)" }}>i</span>tare
          </a>
          <div className="flex items-center gap-8">
            <a href="/audit" className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Free Audit
            </a>
            <a href="/pricing" className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Pricing
            </a>
            <a href="/about" className="text-sm" style={{ color: "var(--text-secondary)" }}>
              About
            </a>
            <a href="/blog" className="text-sm" style={{ color: "var(--accent-primary)" }}>
              Blog
            </a>
            <a href="/login" className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Login
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-[800px]">
          <h1
            className="text-4xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Blog
          </h1>
          <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
            Insights on AI search visibility, GEO optimization, and making your business discoverable by AI platforms.
          </p>

          {posts.length > 0 ? (
            <div className="mt-12 flex flex-col gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block rounded-xl p-6 transition-colors"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-subtle)",
                    textDecoration: "none",
                  }}
                >
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
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
                  <h2
                    className="mt-2 text-xl font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {post.excerpt}
                    </p>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
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
                </Link>
              ))}
            </div>
          ) : (
            <div
              className="mx-auto mt-12 max-w-[440px] rounded-xl p-8 text-center"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <h2
                className="text-lg font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Coming soon
              </h2>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                Be the first to read our research on AI search trends in India.
              </p>
              <SubscribeForm />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-6 py-8"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            &copy; 2026 Citare
          </p>
          <div className="flex items-center gap-6">
            <a href="/audit" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Free Audit</a>
            <a href="/about" className="text-xs" style={{ color: "var(--text-tertiary)" }}>About</a>
            <a href="/contact" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Contact</a>
            <a href="/privacy" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SubscribeForm() {
  return (
    <form
      action="/api/contact/submit"
      method="POST"
      className="mt-6 flex gap-3"
    >
      <input type="hidden" name="name" value="Blog Subscriber" />
      <input type="hidden" name="message" value="Blog subscription request" />
      <input
        name="email"
        type="email"
        required
        placeholder="you@company.com"
        className="flex-1 rounded-lg px-4 py-3 text-sm outline-none"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
        }}
      />
      <button
        type="submit"
        className="rounded-lg px-6 py-3 text-sm font-medium"
        style={{
          background: "var(--accent-primary)",
          color: "var(--bg-primary)",
        }}
      >
        Subscribe
      </button>
    </form>
  );
}
