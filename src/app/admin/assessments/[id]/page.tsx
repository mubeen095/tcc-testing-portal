import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, EmptyState } from "@/components/ui";
import { AttemptBadge } from "@/components/badges";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Assessment Detail" };
export const dynamic = "force-dynamic";

export default async function AdminAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      attempts: {
        orderBy: { startedAt: "desc" },
        include: {
          candidate: { select: { id: true, fullName: true, user: { select: { email: true } }, testSet: { select: { code: true } } } },
        },
      },
    },
  });

  if (!assessment) {
    return (
      <Card className="p-10 text-center text-slate-500">Assessment not found.</Card>
    );
  }

  const attempted = assessment.attempts.length;
  const completed = assessment.attempts.filter((a) => a.status === "COMPLETED").length;
  const terminated = assessment.attempts.filter((a) => a.status === "TERMINATED").length;
  const inProgress = attempted - completed - terminated;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/assessments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to assessments
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{assessment.name}</h1>
        <p className="text-sm text-slate-500">
          {assessment.isActive ? "Active" : "Inactive"} · {assessment.durationMinutes} minutes · created{" "}
          {new Date(assessment.createdAt).toLocaleDateString()}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total attempts", attempted],
          ["In progress", inProgress],
          ["Completed", completed],
          ["Terminated", terminated],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs font-medium text-slate-500">{label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Attempts</h2>
        </div>
        {attempted === 0 ? (
          <div className="px-5 py-8">
            <EmptyState
              title="No attempts yet"
              description="Candidates will appear here once they begin the assessment."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {assessment.attempts.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/admin/results/${a.candidate.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.candidate.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {a.candidate.user?.email ?? ""} · Set {a.candidate.testSet?.code ?? "—"} ·{" "}
                      {a.startedAt
                        ? new Date(a.startedAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <AttemptBadge status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}