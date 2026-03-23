import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { clients } from "@/lib/db/schema";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const allClients = await db.select().from(clients);
  const clientList = allClients.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      <Sidebar clients={clientList} />
      <main style={{ flex: 1, marginLeft: 240, padding: 24 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
