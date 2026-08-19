import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login?next=/admin");
  if (auth.role !== "ADMIN") redirect("/");
  return <AdminShell>{children}</AdminShell>;
}