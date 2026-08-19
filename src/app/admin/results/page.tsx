import type { Metadata } from "next";
import { ResultsTable } from "@/components/admin/ResultsTable";

export const metadata: Metadata = { title: "Results" };
export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  return <ResultsTable />;
}