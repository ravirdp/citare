import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Citare — AI Search Intelligence Platform",
  description:
    "Get in touch with Citare. We help businesses become visible across AI search platforms.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
