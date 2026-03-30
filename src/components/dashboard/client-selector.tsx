"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientOption {
  id: string;
  name: string;
  slug: string;
}

interface ClientSelectorProps {
  clients: ClientOption[];
}

export function useClientId() {
  const searchParams = useSearchParams();
  return searchParams.get("clientId") ?? "";
}

export function ClientSelector({ clients }: ClientSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentClientId = searchParams.get("clientId") ?? clients[0]?.id ?? "";

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("clientId", value);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  if (clients.length === 0) {
    return (
      <div
        style={{
          padding: "8px 12px",
          color: "var(--text-tertiary)",
          fontSize: "var(--text-sm)",
        }}
      >
        No clients
      </div>
    );
  }

  return (
    <Select value={currentClientId} onValueChange={handleChange}>
      <SelectTrigger
        style={{
          width: "100%",
          background: "var(--bg-secondary)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
          fontSize: "var(--text-sm)",
          borderRadius: "var(--radius-md)",
          transition: "border-color 200ms ease",
        }}
      >
        <SelectValue placeholder="Select client" />
      </SelectTrigger>
      <SelectContent
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-subtle)",
          borderRadius: "var(--radius-md)",
        }}
      >
        {clients.map((client) => (
          <SelectItem
            key={client.id}
            value={client.id}
            style={{
              color: "var(--text-primary)",
              fontSize: "var(--text-sm)",
            }}
          >
            {client.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
