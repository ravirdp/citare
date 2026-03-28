"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface SubscriptionData {
  status: string;
  plan: string;
  daysRemaining: number | null;
  trialEnd: string | null;
}

export function TrialBanner() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const [sub, setSub] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    if (!clientId) return;
    fetch(`/api/billing/subscription/${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSub(data))
      .catch(() => {});
  }, [clientId]);

  if (!sub) return null;
  if (sub.status === "active" && sub.plan !== "trial") return null;

  const queryString = clientId ? `?clientId=${clientId}` : "";

  // Trial expired
  if (sub.status === "expired" || sub.status === "cancelled") {
    return (
      <div
        style={{
          background: "var(--status-red)",
          color: "#fff",
          padding: "10px 20px",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <span>Trial expired. Your monitoring is paused. Upgrade to resume.</span>
        <Link
          href={`/billing${queryString}`}
          style={{
            color: "#fff",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          Upgrade
        </Link>
      </div>
    );
  }

  // Trial with < 2 days left
  if (sub.status === "trialing" && sub.daysRemaining !== null && sub.daysRemaining < 2) {
    const hoursLeft = sub.trialEnd
      ? Math.max(0, Math.ceil((new Date(sub.trialEnd).getTime() - Date.now()) / 3600000))
      : 0;

    return (
      <div
        style={{
          background: "var(--status-red)",
          color: "#fff",
          padding: "10px 20px",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <span>Trial expires in {hoursLeft} hours. Upgrade now to keep your data.</span>
        <Link
          href={`/billing${queryString}`}
          style={{
            color: "#fff",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          Upgrade
        </Link>
      </div>
    );
  }

  // Trial active
  if (sub.status === "trialing" && sub.daysRemaining !== null) {
    return (
      <div
        style={{
          background: "#92400e",
          color: "#fef3c7",
          padding: "10px 20px",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <span>
          Free Trial — {sub.daysRemaining} day{sub.daysRemaining !== 1 ? "s" : ""} remaining.
          Add payment method to continue after trial.
        </span>
        <Link
          href={`/billing${queryString}`}
          style={{
            color: "#fef3c7",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          View Plans
        </Link>
      </div>
    );
  }

  return null;
}
