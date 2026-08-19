import type { Metadata } from "next";
import { SettingsPanel } from "@/components/admin/SettingsPanel";

export const metadata: Metadata = { title: "Settings & Data" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  return <SettingsPanel />;
}