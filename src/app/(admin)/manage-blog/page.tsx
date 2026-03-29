"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  content: string;
  publishedAt: string | null;
  author: string;
  tags: string[];
  readTimeMinutes: number;
  updatedAt: string;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getStatusBadge(post: BlogPost) {
  if (post.status === "draft") {
    return (
      <span
        className="inline-block rounded-full px-3 py-1 text-xs font-medium"
        style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
      >
        Draft
      </span>
    );
  }
  if (post.status === "published" && post.publishedAt && new Date(post.publishedAt) > new Date()) {
    return (
      <span
        className="inline-block rounded-full px-3 py-1 text-xs font-medium"
        style={{ background: "#78350f20", color: "#d97706" }}
      >
        Scheduled
      </span>
    );
  }
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: "#16a34a20", color: "#16a34a" }}
    >
      Published
    </span>
  );
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Blog Posts
        </h1>
        <Link
          href="/manage-blog/editor"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            background: "var(--accent-primary)",
            color: "var(--bg-primary)",
            textDecoration: "none",
          }}
        >
          <Plus size={16} />
          New Post
        </Link>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-tertiary)" }}>Loading...</p>
      ) : posts.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <p style={{ color: "var(--text-tertiary)" }}>No blog posts yet. Create your first post.</p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                  Title
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                  Publish Date
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                  Words
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <td className="px-5 py-4">
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {post.title}
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      /blog/{post.slug}
                    </div>
                  </td>
                  <td className="px-5 py-4">{getStatusBadge(post)}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-right text-xs" style={{ color: "var(--text-secondary)" }}>
                    {wordCount(post.content).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/manage-blog/editor?id=${post.id}`}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs"
                        style={{
                          background: "var(--bg-tertiary)",
                          color: "var(--text-secondary)",
                          textDecoration: "none",
                        }}
                      >
                        <Edit size={13} />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs"
                        style={{
                          background: "none",
                          border: "1px solid var(--border-subtle)",
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
