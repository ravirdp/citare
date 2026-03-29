"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  status: string;
  publishedAt: string;
  metaTitle: string;
  metaDescription: string;
  tags: string;
  readTimeMinutes: number;
}

const DEFAULT_FORM: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author: "Ravi Patel",
  status: "draft",
  publishedAt: "",
  metaTitle: "",
  metaDescription: "",
  tags: "",
  readTimeMinutes: 5,
};

export default function BlogEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [form, setForm] = useState<PostForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then((data) => {
        const post = data.posts?.find((p: { id: string }) => p.id === editId);
        if (post) {
          setForm({
            title: post.title || "",
            slug: post.slug || "",
            excerpt: post.excerpt || "",
            content: post.content || "",
            author: post.author || "Ravi Patel",
            status: post.status || "draft",
            publishedAt: post.publishedAt
              ? new Date(post.publishedAt).toISOString().slice(0, 16)
              : "",
            metaTitle: post.metaTitle || "",
            metaDescription: post.metaDescription || "",
            tags: (post.tags || []).join(", "),
            readTimeMinutes: post.readTimeMinutes || 5,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [editId]);

  const previewHtml = useMemo(() => simpleMarkdown(form.content), [form.content]);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: editId ? prev.slug : slugify(title),
    }));
  }

  async function save(publishNow: boolean) {
    setError("");
    setSaving(true);

    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || null,
      content: form.content,
      author: form.author,
      status: publishNow ? "published" : form.status,
      publishedAt: publishNow && !form.publishedAt
        ? new Date().toISOString()
        : form.publishedAt || null,
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      readTimeMinutes: form.readTimeMinutes,
    };

    try {
      const url = editId ? `/api/admin/blog/${editId}` : "/api/admin/blog";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      router.push("/manage-blog");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ color: "var(--text-tertiary)" }}>Loading...</p>;
  }

  const inputStyle = {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/manage-blog"
            className="flex items-center gap-1 text-sm"
            style={{ color: "var(--text-tertiary)", textDecoration: "none" }}
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {editId ? "Edit Post" : "New Post"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            style={{
              background: "var(--accent-primary)",
              color: "var(--bg-primary)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Publish
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: "#ef444420", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Two-column layout: editor left, preview right */}
      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 160px)" }}>
        {/* Editor Panel */}
        <div className="flex w-1/2 flex-col gap-4" style={{ minWidth: 0 }}>
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Title
            </label>
            <input
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
              className="w-full rounded-lg px-4 py-3 text-lg font-semibold outline-none"
              style={inputStyle}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Slug
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>/blog/</span>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="post-url-slug"
                className="flex-1 rounded-lg px-4 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col">
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Content (Markdown)
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your post in markdown..."
              className="flex-1 rounded-lg px-4 py-3 text-sm font-mono outline-none"
              style={{ ...inputStyle, resize: "none", lineHeight: 1.6, minHeight: 400 }}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Excerpt
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Brief description for listing cards"
              rows={2}
              className="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Row: Meta Title + Meta Description */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Meta Title
            </label>
            <input
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
              placeholder="SEO title (defaults to post title)"
              className="w-full rounded-lg px-4 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Meta Description
            </label>
            <textarea
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              placeholder="SEO description"
              rows={2}
              className="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Tags (comma separated)
            </label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="AI Search, GEO, Visibility"
              className="w-full rounded-lg px-4 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* Row: Status + Publish Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg px-4 py-2 text-sm outline-none"
                style={inputStyle}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                Publish Date
              </label>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                className="w-full rounded-lg px-4 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="w-1/2" style={{ minWidth: 0 }}>
          <div
            className="sticky top-6 overflow-auto rounded-xl p-8"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              maxHeight: "calc(100vh - 120px)",
            }}
          >
            <div className="mb-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Live Preview
            </div>
            <h1 className="text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {form.title || "Untitled Post"}
            </h1>
            <div className="mt-3 text-sm" style={{ color: "var(--text-tertiary)" }}>
              {form.author} &middot; {form.readTimeMinutes} min read
              {form.tags && (
                <span>
                  {" "}&middot;{" "}
                  {form.tags.split(",").map((t) => t.trim()).filter(Boolean).join(", ")}
                </span>
              )}
            </div>
            <hr className="my-6" style={{ borderColor: "var(--border-subtle)" }} />
            {form.content ? (
              <div
                className="blog-preview leading-relaxed"
                style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="italic" style={{ color: "var(--text-tertiary)" }}>
                Start typing markdown in the editor to see a live preview...
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .blog-preview h1 { font-size: 2rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: var(--text-primary); }
        .blog-preview h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary); }
        .blog-preview h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; color: var(--text-primary); }
        .blog-preview p { margin-bottom: 0.75rem; }
        .blog-preview ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .blog-preview ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .blog-preview li { margin-bottom: 0.25rem; }
        .blog-preview strong { color: var(--text-primary); font-weight: 600; }
        .blog-preview em { font-style: italic; }
        .blog-preview a { color: var(--accent-primary); text-decoration: underline; }
        .blog-preview code { background: var(--bg-tertiary); padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.9em; }
        .blog-preview pre { background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1rem; }
        .blog-preview pre code { background: none; padding: 0; }
        .blog-preview blockquote { border-left: 3px solid var(--border-subtle); padding-left: 1rem; margin: 1rem 0; color: var(--text-tertiary); font-style: italic; }
        .blog-preview hr { border: none; border-top: 1px solid var(--border-subtle); margin: 1.5rem 0; }
        @media (max-width: 768px) {
          .blog-preview { margin-top: 2rem; }
        }
      `}</style>
    </div>
  );
}

function simpleMarkdown(md: string): string {
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _l, code) =>
      `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`
    )
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^---$/gm, "<hr>")
    .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^[*-] (.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    .split("\n\n")
    .map((b) => {
      const t = b.trim();
      if (
        !t ||
        t.startsWith("<h") ||
        t.startsWith("<pre") ||
        t.startsWith("<ul") ||
        t.startsWith("<ol") ||
        t.startsWith("<blockquote") ||
        t.startsWith("<hr")
      )
        return t;
      return `<p>${t.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}
