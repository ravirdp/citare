"use client";

import { useState } from "react";
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

interface Agency {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: string;
  clientCount: number;
  createdAt: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AgenciesTable({ agencies }: { agencies: Agency[] }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, adminEmail, adminName }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error ?? "Failed to create agency"}`);
        return;
      }
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
              Create Agency
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
                Create Agency
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="agency-name"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Name
                </Label>
                <Input
                  id="agency-name"
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
                  htmlFor="agency-slug"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Slug
                </Label>
                <Input
                  id="agency-slug"
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
                <Label
                  htmlFor="admin-email"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Admin Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
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
                  htmlFor="admin-name"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Admin Name
                </Label>
                <Input
                  id="admin-name"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
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
                {submitting ? "Creating..." : "Create Agency"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {agencies.length === 0 ? (
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
              No agencies yet. Create one to get started.
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
                  {["Name", "Slug", "Clients", "Tier", "Created"].map(
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
                {agencies.map((agency) => (
                  <tr
                    key={agency.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[length:var(--text-sm)] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {agency.name}
                    </td>
                    <td
                      className="px-4 py-3 text-[length:var(--text-sm)]"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {agency.slug}
                    </td>
                    <td
                      className="px-4 py-3 text-[length:var(--text-sm)]"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {agency.clientCount}
                    </td>
                    <td
                      className="px-4 py-3 text-[length:var(--text-sm)]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {agency.subscriptionTier}
                    </td>
                    <td
                      className="px-4 py-3 text-[length:var(--text-sm)]"
                      style={{
                        color: "var(--text-tertiary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {agency.createdAt
                        ? new Date(agency.createdAt).toLocaleDateString()
                        : "—"}
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
