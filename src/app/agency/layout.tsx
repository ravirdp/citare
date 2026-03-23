import { redirect } from "next/navigation";
import { getAuthUserWithAgency } from "@/lib/auth/user";
import { AgencySidebar } from "@/components/agency/sidebar";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUserWithAgency();

  if (!user || (user.role !== "agency_admin" && user.role !== "agency_member")) {
    redirect("/overview");
  }

  const agencyName = user.agency?.name ?? "Agency";
  const agencyLogoUrl = (user.agency?.branding as Record<string, unknown>)?.logo_url as string | undefined;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AgencySidebar
        agencyName={agencyName}
        agencyLogoUrl={agencyLogoUrl ?? null}
      />
      <main
        style={{
          flex: 1,
          marginLeft: 240,
          padding: 24,
        }}
      >
        {children}
      </main>
    </div>
  );
}
