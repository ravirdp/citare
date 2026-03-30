"use client";

import { useState } from "react";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Citare",
    url: "https://www.citare.ai/contact",
    mainEntity: {
      "@type": "Organization",
      name: "Citare",
      email: "ravi@citare.ai",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bangalore",
        addressCountry: "IN",
      },
    },
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value || undefined,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to submit");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />

      <PublicNavbar active="/contact" />

      {/* Content */}
      <main className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-[900px]">
          <h1
            className="font-semibold"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(32px, 4vw, 48px)",
              letterSpacing: "-0.02em",
            }}
          >
            Contact Us
          </h1>

          <div className="mt-12 grid grid-cols-1 gap-16 md:grid-cols-[1fr_280px]">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block"
                    style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}
                  >
                    Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 text-sm outline-none"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-md)",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block"
                    style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}
                  >
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 text-sm outline-none"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-md)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block"
                  style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}
                >
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    borderRadius: "var(--radius-md)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block"
                  style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full resize-none px-4 py-3 text-sm outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    borderRadius: "var(--radius-md)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="px-8 py-3 text-sm font-medium disabled:opacity-50"
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--bg-primary)",
                  borderRadius: "var(--radius-md)",
                  transition: "box-shadow 200ms ease, transform 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 20px var(--accent-glow)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {status === "submitting" ? "Sending..." : "Send Message"}
              </button>

              {status === "success" && (
                <p className="text-sm" style={{ color: "var(--accent-primary)" }}>
                  Thank you! We&apos;ll get back to you soon.
                </p>
              )}

              {status === "error" && (
                <p className="text-sm" style={{ color: "#ef4444" }}>
                  {errorMessage}
                </p>
              )}
            </form>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2
                  className="text-sm font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Email
                </h2>
                <a
                  href="mailto:ravi@citare.ai"
                  className="mt-2 block text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  ravi@citare.ai
                </a>
              </div>
              <div>
                <h2
                  className="text-sm font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Location
                </h2>
                <p className="mt-2 text-base" style={{ color: "var(--text-primary)" }}>
                  Bangalore, India
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
