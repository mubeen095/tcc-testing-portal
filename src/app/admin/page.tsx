import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FileSpreadsheet,
  Hourglass,
  PencilRuler,
  Timer,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { Card } from "@/components/ui";
import { AttemptBadge } from "@/components/badges";
import { fetchDashboardStats } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone?: "primary" | "emerald" | "rose" | "amber" | "slate" | "violet";
}) {
  const tones = {
    primary: "bg-primary-50 text-primary-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    slate: "bg-slate-100 text-slate-500",
  };
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const stats = await fetchDashboardStats();
  const recent = await prisma.attempt.findMany({
    orderBy: { startedAt: "desc" },
    take: 8,
select: {
        id: true,
        status: true,
        startedAt: true,
        candidate: {
          select: {
            id: true,
            fullName: true,
            user: { select: { email: true } },
            testSet: { select: { code: true } },
          },
        },
      },
  });
  const assessments = await prisma.assessment.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, isActive: true, createdAt: true },
    take: 3,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Recruitment overview
          </h1>
          <p className="text-sm text-slate-500">
            Live status of candidates, attempts and decisions.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/admin/export?format=xlsx"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </a>
          <Link
            href="/admin/candidates"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-500 px-4 text-sm font-medium text-[#101010] shadow-sm hover:bg-primary-600"
          >
            <UserPlus className="h-4 w-4" /> Add candidate
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Total candidates" value={stats.totalCandidates} icon={Users} tone="primary" />
        <Stat label="Registered / Not started" value={stats.notStarted} icon={UserPlus} tone="slate" />
        <Stat label="In progress" value={stats.inProgress} icon={Timer} tone="amber" />
        <Stat label="Completed" value={stats.completed} icon={ClipboardCheck} tone="violet" />
        <Stat label="Terminated" value={stats.terminated} icon={Activity} tone="rose" />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Selected" value={stats.selected} icon={BadgeCheck} tone="emerald" />
        <Stat label="Rejected" value={stats.rejected} icon={XCircle} tone="rose" />
        <Stat label="Pending review" value={stats.pendingReview} icon={Hourglass} tone="amber" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
            <Link
              href="/admin/results"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View results <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No attempts yet. Share the registration link with candidates.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/results/${a.candidate.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {a.candidate.fullName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {a.candidate.user?.email ?? ""} · Set {a.candidate.testSet?.code ?? "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {a.startedAt
                          ? new Date(a.startedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                      <AttemptBadge status={a.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Active assessment</h2>
              <Link
                href="/admin/assessments"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="px-5 py-4">
              {assessments[0] ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {assessments[0].name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {assessments[0].isActive ? "Active" : "Inactive"} · created{" "}
                      {new Date(assessments[0].createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {assessments[0].isActive ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Live
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No assessment created yet.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
            </div>
            <div className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-2">
              <Link
                href="/admin/questions"
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <PencilRuler className="h-4 w-4 text-primary-600" /> Manage questions
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Exports &amp; data
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}