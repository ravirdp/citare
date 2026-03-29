import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth/user";
import { submitUrlsToIndexNow } from "@/lib/indexnow";

/**
 * PATCH /api/admin/blog/[id] — update post (super_admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["super_admin"]);
    const { id } = await params;
    const body = await request.json();

    // Fetch existing post to detect status change
    const [existing] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const allowedFields = [
      "title", "slug", "excerpt", "content", "author", "status",
      "metaTitle", "metaDescription", "tags", "readTimeMinutes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (body.publishedAt !== undefined) {
      updates.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    }

    const [post] = await db
      .update(blogPosts)
      .set(updates)
      .where(eq(blogPosts.id, id))
      .returning();

    // Submit to IndexNow if just published
    const wasPublished = existing.status !== "published" && post.status === "published";
    if (
      wasPublished &&
      post.publishedAt &&
      post.publishedAt <= new Date()
    ) {
      await submitUrlsToIndexNow([`/blog/${post.slug}`]);
    }

    return NextResponse.json({ post });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "Unauthorized" || message.startsWith("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Admin blog update error:", err);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/blog/[id] — delete post (super_admin only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["super_admin"]);
    const { id } = await params;

    const [deleted] = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning({ id: blogPosts.id });

    if (!deleted) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "Unauthorized" || message.startsWith("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Admin blog delete error:", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
