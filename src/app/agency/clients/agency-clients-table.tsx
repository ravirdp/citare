"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientRow {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  status: string;
  dataSourceCount: number;
  kgVersion: number | null;
  visibilityScore: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "var(--status-green)",
  onboarding: "var(--status-blue)",
  paused: "var(--status-yellow)",
  churned: "var(--status-red)",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AgencyClientsTable({ clients }: { clients: ClientRow[] }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState("physical");
  const [languages, setLanguages] = useState("en");

  function handleNameChange(value: string) {
    setName(value);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const langArray = languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const res = await fetch("/api/agency/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          businessType,
          languages: langArray.length > 0 ? langArray : ["en"],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error ?? "Failed to create client"}`);
        return;
      }
      setOpen(false);
      window.location.reload();
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="text-[length:var(--text-sm)]"
              style={{
                background: "var(--accent-primary)",
                color: "var(--text-inverse)",
              }}
            >
              Create Client
            </Button>
          </DialogTrigger>
          <DialogContent
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: "var(--text-primary)" }}>
                Create Client
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="client-name"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Name
                </Label>
                <Input
                  id="client-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  style={{
                    background: "var(--bg-tertiary)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="client-slug"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Slug
                </Label>
                <Input
                  id="client-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  style={{
                    background: "var(--bg-tertiary)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>
                  Business Type
                </Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger
                    style={{
                      background: "var(--bg-tertiary)",
                      borderColor: "var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "var(--bg-tertiary)",
                      borderColor: "var(--border-default)",
                    }}
                  >
                    <SelectItem value="physical" style={{ color: "var(--text-primary)" }}>
                      Physical
                    </SelectItem>
                    <SelectItem value="ecommerce" style={{ color: "var(--text-primary)" }}>
                      E-Commerce
                    </SelectItem>
                    <SelectItem value="hybrid" style={{ color: "var(--text-primary)" }}>
                      Hybrid
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="client-languages"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Languages (comma-separated)
                </Label>
                <Input
                  id="client-languages"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="en, hi"
                  style={{
                    background: "var(--bg-tertiary)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full text-[length:var(--text-sm)]"
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--text-inverse)",
                }}
              >
                {submitting ? "Creating..." : "Create Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <Card
          className="border"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <CardContent className="py-12 text-center">
            <p
              style={{
                color: "var(--text-tertiary)",
                fontSize: "var(--text-sm)",
              }}
            >
              No clients yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card
          className="overflow-hidden border"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  {["Name", "Status", "Sources", "KG", "Score", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-[length:var(--text-xs)] font-medium uppercase tracking-wider"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[length:var(--text-sm)] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-[length:var(--text-sm)]">
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                              STATUS_COLORS[client.status] ??
                              "var(--text-tertiary)",
                            display: "inline-block",
                          }}
                        />
                        {client.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-[length:var(--text-sm)]"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {client.dataSourceCount}
                    </td>
                    <td
                      className="px-4 py-3 text-[length:var(--text-sm)]"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {client.kgVersion != null ? `v${client.kgVersion}` : "--"}
                    </td>
                    <td
                      className="px-4 py-3 text-[length:var(--text-sm)]"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {client.visibilityScore ?? "--"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/overview?clientId=${client.id}`}
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--accent-primary)",
                          textDecoration: "none",
                        }}
                      >
                        View Dashboard
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
