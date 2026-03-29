import type { MetadataRoute } from "next";
import { db } from "@/lib/db/client";
import { clients, blogPosts } from "@/lib/db/schema";
import { eq, lte, and, desc } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.citare.ai";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/audit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  let presencePages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];

  try {
    const activeClients = await db
      .select({ slug: clients.slug })
      .from(clients)
      .where(eq(clients.status, "active"));

    presencePages = activeClients.flatMap((client) => [
      {
        url: `${baseUrl}/presence/${client.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/presence/${client.slug}/about`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/presence/${client.slug}/faq`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
    ]);

    const publishedPosts = await db
      .select({
        slug: blogPosts.slug,
        updatedAt: blogPosts.updatedAt,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "published"),
          lte(blogPosts.publishedAt, new Date())
        )
      )
      .orderBy(desc(blogPosts.publishedAt));

    blogPages = publishedPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB unavailable at build time — return static pages only
  }

  return [...staticPages, ...presencePages, ...blogPages];
}
