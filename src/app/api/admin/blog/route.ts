import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/user";
import { submitUrlsToIndexNow } from "@/lib/indexnow";
import { desc } from "drizzle-orm";

/**
 * GET /api/admin/blog — list all posts including drafts (super_admin only)
 */
export async function GET() {
  try {
    await requireRole(["super_admin"]);

    const posts = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.updatedAt));

    return NextResponse.json({ posts });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "Unauthorized" || message.startsWith("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Admin blog list error:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

/**
 * POST /api/admin/blog — create post (super_admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(["super_admin"]);

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      author,
      publishedAt,
      status,
      metaTitle,
      metaDescription,
      tags,
      readTimeMinutes,
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "title, slug, and content are required" },
        { status: 400 }
      );
    }

    const [post] = await db
      .insert(blogPosts)
      .values({
        title,
        slug,
        excerpt: excerpt || null,
        content,
        author: author || "Ravi Patel",
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        status: status || "draft",
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        tags: tags || [],
        readTimeMinutes: readTimeMinutes || 5,
      })
      .returning();

    // Submit to IndexNow if publishing now
    if (
      post.status === "published" &&
      post.publishedAt &&
      post.publishedAt <= new Date()
    ) {
      await submitUrlsToIndexNow([`/blog/${post.slug}`]);
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "Unauthorized" || message.startsWith("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Admin blog create error:", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
