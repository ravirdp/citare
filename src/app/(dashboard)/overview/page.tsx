import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-[1400px]">
        <h1
          className="text-[length:var(--text-xl)] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Overview
        </h1>
        <p
          className="mt-2 text-[length:var(--text-sm)]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Signed in as {user.email}
        </p>
        <div
          className="mt-6 rounded-xl border p-6"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <p
            className="text-[length:var(--text-sm)]"
            style={{ color: "var(--text-secondary)" }}
          >
            Phase 1 — Database and auth are live. Connect Google APIs via the{" "}
            <a
              href="/clients"
              className="underline"
              style={{ color: "var(--accent-primary)" }}
            >
              Clients page
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
