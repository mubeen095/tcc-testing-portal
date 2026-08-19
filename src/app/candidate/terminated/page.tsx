import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { TerminatedScreen } from "@/components/candidate/TerminatedScreen";
import { getAuth } from "@/lib/session";

export const metadata: Metadata = {
  title: "Assessment Terminated",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CandidateTerminatedPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role === "ADMIN") redirect("/admin");
  return <TerminatedScreen />;
}