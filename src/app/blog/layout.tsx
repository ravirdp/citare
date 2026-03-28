import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Citare | AI Search Intelligence Insights",
  description:
    "Insights on AI search visibility, GEO optimization, and how businesses can get found by ChatGPT, Perplexity, and Google AI.",
  alternates: { canonical: "/blog" },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
