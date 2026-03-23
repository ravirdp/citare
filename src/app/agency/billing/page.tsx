import { redirect } from "next/navigation";
import { getAuthUserWithAgency } from "@/lib/auth/user";
import { Card, CardContent } from "@/components/ui/card";

export default async function AgencyBillingPage() {
  const user = await getAuthUserWithAgency();

  if (!user || (user.role !== "agency_admin" && user.role !== "agency_member")) {
    redirect("/overview");
  }

  const subscriptionTier = user.agency
    ? ((user.agency.branding as Record<string, unknown>)?.subscription_tier as string) ?? "free"
    : "free";

  return (
    <div>
      <h1
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 24,
        }}
      >
        Billing
      </h1>

      <Card
        className="border"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-subtle)",
          maxWidth: 600,
        }}
      >
        <CardContent className="pt-6 space-y-4">
          <div>
            <span
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-tertiary)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Current Plan
            </span>
            <span
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: 600,
                color: "var(--text-primary)",
                textTransform: "capitalize",
              }}
            >
              {subscriptionTier}
            </span>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: 8,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              To upgrade your plan or manage billing, please contact us at{" "}
              <a
                href="mailto:billing@citare.ai"
                style={{ color: "var(--accent-primary)", textDecoration: "none" }}
              >
                billing@citare.ai
              </a>
              .
            </p>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-tertiary)",
                marginTop: 8,
              }}
            >
              Stripe integration coming in Phase 6.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
