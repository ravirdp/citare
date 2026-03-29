import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { eq, lte, and, desc } from "drizzle-orm";

/**
 * GET /api/blog — list published posts (public)
 */
export async function GET() {
  try {
    const posts = await db
      .select({
        id: blogPosts.id,
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

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("Blog list error:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
