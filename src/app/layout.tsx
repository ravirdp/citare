import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Citare — AI Search Intelligence Platform | Make Your Business Visible in AI Search",
  description:
    "Free AI visibility audit. Monitor how ChatGPT, Perplexity, and Google AI describe your business. Actionable recommendations. Starts at ₹6,000/month.",
  metadataBase: new URL("https://www.citare.ai"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Citare — AI Search Intelligence Platform | Make Your Business Visible in AI Search",
    description:
      "Free AI visibility audit. Monitor how ChatGPT, Perplexity, and Google AI describe your business. Actionable recommendations. Starts at ₹6,000/month.",
    url: "https://www.citare.ai",
    siteName: "Citare",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Citare — AI Search Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Citare — AI Search Intelligence Platform | Make Your Business Visible in AI Search",
    description:
      "Free AI visibility audit. Monitor how ChatGPT, Perplexity, and Google AI describe your business. Actionable recommendations. Starts at ₹6,000/month.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
