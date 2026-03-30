import type { Metadata } from "next";
import { PricingContent } from "./pricing-content";

export const metadata: Metadata = {
  title: "Pricing — Citare",
  description: "AI Search Intelligence plans starting at ₹6,000/month. 7-day free trial on all plans.",
};

export default function PricingPage() {
  return <PricingContent />;
}
