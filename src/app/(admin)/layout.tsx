import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/user";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (!user || user.role !== "super_admin") {
    redirect("/overview");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar />
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
