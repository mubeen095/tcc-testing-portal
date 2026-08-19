import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AssessmentRunner } from "@/components/candidate/AssessmentRunner";
import { getAuth } from "@/lib/session";

export const metadata: Metadata = {
  title: "Assessment",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CandidateTestPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role === "ADMIN") redirect("/admin");
  return <AssessmentRunner />;
}