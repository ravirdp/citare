import type { MetadataRoute } from "next";
import { db } from "@/lib/db/client";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.citare.ai";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/audit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  let presencePages: MetadataRoute.Sitemap = [];
  try {
    const activeClients = await db
      .select({ slug: clients.slug })
      .from(clients)
      .where(eq(clients.status, "active"));

    presencePages = activeClients.map((client) => ({
      url: `${baseUrl}/presence/${client.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // DB unavailable at build time — return static pages only
  }

  return [...staticPages, ...presencePages];
}
