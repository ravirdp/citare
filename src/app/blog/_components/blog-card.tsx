"use client";

import Link from "next/link";

interface BlogCardProps {
  slug: string;
  author: string | null;
  publishedAt: string | null;
  readTimeMinutes: number | null;
  title: string;
  excerpt: string | null;
  tags: string[] | null;
}

export function BlogCard({ slug, author, publishedAt, readTimeMinutes, title, excerpt, tags }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="block p-6"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        textDecoration: "none",
        transition: "border-color 200ms ease, transform 200ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.transform = "scale(1.01)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
        <span>{author}</span>
        <span>&middot;</span>
        <span>
          {publishedAt
            ? new Date(publishedAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </span>
        <span>&middot;</span>
        <span>{readTimeMinutes} min read</span>
      </div>
      <h2
        className="mt-2 text-xl font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h2>
      {excerpt && (
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {excerpt}
        </p>
      )}
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
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
  );
}
