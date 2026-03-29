import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { eq, lte, and } from "drizzle-orm";

/**
 * GET /api/blog/[slug] — single published post (public)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
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
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (err) {
    console.error("Blog post error:", err);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}
