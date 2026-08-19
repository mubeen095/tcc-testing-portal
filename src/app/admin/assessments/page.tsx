import type { Metadata } from "next";
import { AssessmentsManager } from "@/components/admin/AssessmentsManager";

export const metadata: Metadata = { title: "Assessments" };
export const dynamic = "force-dynamic";

export default async function AdminAssessmentsPage() {
  return <AssessmentsManager />;
}