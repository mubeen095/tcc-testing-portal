import type { Metadata } from "next";
import { CandidatesManager } from "@/components/admin/CandidatesManager";

export const metadata: Metadata = { title: "Candidates" };
export const dynamic = "force-dynamic";

export default async function AdminCandidatesPage() {
  return <CandidatesManager />;
}