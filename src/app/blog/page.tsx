import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { eq, lte, and, desc } from "drizzle-orm";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { BlogCard } from "./_components/blog-card";

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
      <PublicNavbar active="/blog" />

      {/* Content */}
      <main className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-[800px]">
          <h1
            className="font-semibold"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(32px, 4vw, 48px)",
              letterSpacing: "-0.02em",
            }}
          >
            Blog
          </h1>
          <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
            Insights on AI search visibility, GEO optimization, and making your business discoverable by AI platforms.
          </p>

          {posts.length > 0 ? (
            <div className="mt-12 flex flex-col gap-6">
              {posts.map((post) => (
                <BlogCard
                  key={post.slug}
                  slug={post.slug}
                  author={post.author}
                  publishedAt={post.publishedAt ? post.publishedAt.toISOString() : null}
                  readTimeMinutes={post.readTimeMinutes}
                  title={post.title}
                  excerpt={post.excerpt}
                  tags={post.tags}
                />
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

      <PublicFooter />
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
