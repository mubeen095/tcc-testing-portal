import type { Metadata } from "next";
import { ProfilesManager } from "@/components/admin/ProfilesManager";

export const metadata: Metadata = { title: "Profiles" };
export const dynamic = "force-dynamic";

export default async function AdminProfilesPage() {
  return <ProfilesManager />;
}