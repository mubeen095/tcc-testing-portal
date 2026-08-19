import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CandidateInstructions } from "@/components/candidate/CandidateInstructions";
import { getAuth } from "@/lib/session";

export const metadata: Metadata = { title: "Assessment Instructions" };

export default async function CandidateInstructionsPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role === "ADMIN") redirect("/admin");
  return <CandidateInstructions />;
}