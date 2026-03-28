import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { clients, knowledgeGraphs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

interface KGProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: { amount: number; currency: string; display?: string } | null;
  specifications: Record<string, string>;
  images: string[];
  brand?: string;
  gtin?: string;
  sku?: string;
  aggregateRating?: { ratingValue: number; reviewCount: number };
  useCases: string[];
  targetAudience: string;
  keywords: string[];
}

interface PageProps {
  params: Promise<{ slug: string; productId: string }>;
}

async function getProductData(slug: string, productId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.slug, slug))
    .limit(1);

  if (!client) return null;

  const [kg] = await db
    .select()
    .from(knowledgeGraphs)
    .where(eq(knowledgeGraphs.clientId, client.id))
    .limit(1);

  if (!kg) return null;

  // Search both products and services arrays — services use svc_ prefix IDs
  const products = (kg.products ?? []) as unknown as KGProduct[];
  const services = (kg.services ?? []) as unknown as KGProduct[];
  const product =
    products.find((p) => p.id === productId) ??
    services.find((s) => s.id === productId);

  if (!product) return null;

  const bp = kg.businessProfile as Record<string, unknown> | null;

  return { client, product, businessName: bp?.name as string ?? client.name };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, productId } = await params;
  const data = await getProductData(slug, productId);
  if (!data) return { title: "Product Not Found" };

  return {
    title: `${data.product.name} — ${data.businessName}`,
    description: data.product.description?.slice(0, 160),
  };
}

function buildProductJsonLd(
  product: KGProduct,
  businessName: string,
  url: string
) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: product.category,
    url,
  };

  if (product.brand) {
    schema.brand = { "@type": "Brand", name: product.brand };
  }
  if (product.images?.length > 0) {
    schema.image = product.images;
  }
  if (product.gtin) schema.gtin = product.gtin;
  if (product.sku) schema.sku = product.sku;
  if (product.aggregateRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.aggregateRating.ratingValue,
      reviewCount: product.aggregateRating.reviewCount,
    };
  }
  if (product.price) {
    schema.offers = {
      "@type": "Offer",
      price: product.price.amount,
      priceCurrency: product.price.currency ?? "INR",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: businessName },
    };
  }

  return schema;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug, productId } = await params;
  const data = await getProductData(slug, productId);

  if (!data) notFound();

  const { product, businessName } = data;
  const pageUrl = `/presence/${slug}/product/${productId}`;
  const jsonLd = buildProductJsonLd(product, businessName, pageUrl);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        {/* Breadcrumb */}
        <nav
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            marginBottom: 24,
          }}
        >
          {businessName} / {product.category} / {product.name}
        </nav>

        {/* Product images */}
        {product.images?.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 32,
              overflowX: "auto",
            }}
          >
            {product.images.slice(0, 4).map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${product.name} image ${i + 1}`}
                style={{
                  width: 240,
                  height: 240,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid var(--border-subtle)",
                }}
              />
            ))}
          </div>
        )}

        {/* Title + Price */}
        <h1
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          {product.name}
        </h1>

        {product.price && (
          <div
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 600,
              color: "var(--accent-primary)",
              marginBottom: 16,
            }}
          >
            {product.price.display ??
              `₹${product.price.amount.toLocaleString("en-IN")}`}
          </div>
        )}

        {product.aggregateRating && (
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              marginBottom: 24,
            }}
          >
            {"★".repeat(Math.round(product.aggregateRating.ratingValue))}
            {"☆".repeat(5 - Math.round(product.aggregateRating.ratingValue))}{" "}
            {product.aggregateRating.ratingValue}/5 (
            {product.aggregateRating.reviewCount} reviews)
          </div>
        )}

        {/* Description */}
        <p
          style={{
            fontSize: "var(--text-sm)",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            marginBottom: 32,
          }}
        >
          {product.description}
        </p>

        {/* Specifications */}
        {product.specifications &&
          Object.keys(product.specifications).length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2
                style={{
                  fontSize: "var(--text-md)",
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                Specifications
              </h2>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "var(--text-sm)",
                }}
              >
                <tbody>
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <tr
                      key={key}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <td
                        style={{
                          padding: "8px 0",
                          color: "var(--text-tertiary)",
                          width: "40%",
                        }}
                      >
                        {key}
                      </td>
                      <td
                        style={{
                          padding: "8px 0",
                          color: "var(--text-primary)",
                        }}
                      >
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {/* Use Cases */}
        {product.useCases?.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: "var(--text-md)",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Use Cases
            </h2>
            <ul
              style={{
                listStyle: "disc",
                paddingLeft: 20,
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
              }}
            >
              {product.useCases.map((uc, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {uc}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 16,
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
          }}
        >
          {businessName} — Powered by Citare
        </div>
      </div>
    </div>
  );
}
