import type { Metadata } from "next";
import { CandidateDetail } from "@/components/admin/CandidateDetail";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Candidate Detail" };
export const dynamic = "force-dynamic";

export default async function AdminCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const testSets = await prisma.testSet.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true },
  });
  return <CandidateDetail candidateId={id} testSets={testSets} />;
}