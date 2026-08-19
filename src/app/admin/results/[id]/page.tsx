import type { Metadata } from "next";
import { ResultDetail } from "@/components/admin/ResultDetail";

export const metadata: Metadata = { title: "Result Detail" };
export const dynamic = "force-dynamic";

export default async function AdminResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResultDetail candidateId={id} />;
}