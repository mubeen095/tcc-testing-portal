import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CompletedScreen } from "@/components/candidate/CompletedScreen";
import { getAuth } from "@/lib/session";

export const metadata: Metadata = {
  title: "Assessment Submitted",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CandidateCompletedPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role === "ADMIN") redirect("/admin");
  return <CompletedScreen />;
}