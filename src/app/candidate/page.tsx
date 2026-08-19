import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CandidateDashboard } from "@/components/candidate/CandidateDashboard";
import { getAuth } from "@/lib/session";

export const metadata: Metadata = { title: "Candidate Dashboard" };

export default async function CandidatePage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role === "ADMIN") redirect("/admin");
  return <CandidateDashboard />;
}