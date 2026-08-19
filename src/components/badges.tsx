import { SECTION_LABELS } from "@/lib/env";
import type { AttemptStatus, DecisionStatus, TestSection } from "@/generated/prisma/client";

const ATTEMPT_STYLES: Record<AttemptStatus | "NOT_STARTED", string> = {
  IN_PROGRESS: "bg-sky-100 text-sky-800 border-sky-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  TERMINATED: "bg-rose-100 text-rose-800 border-rose-200",
  NOT_STARTED: "bg-slate-100 text-slate-600 border-slate-200",
};

const DECISION_STYLES: Record<DecisionStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  SELECTED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
};

export function AttemptBadge({ status }: { status: AttemptStatus | "NOT_STARTED" }) {
  const labels: Record<AttemptStatus | "NOT_STARTED", string> = {
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    TERMINATED: "Terminated",
    NOT_STARTED: "Not Started",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ATTEMPT_STYLES[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: DecisionStatus }) {
  const labels: Record<DecisionStatus, string> = {
    PENDING: "Pending Review",
    SELECTED: "Selected",
    REJECTED: "Rejected",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${DECISION_STYLES[decision]}`}
    >
      {labels[decision]}
    </span>
  );
}

export function SectionBadge({ section }: { section: TestSection }) {
  const styles: Record<TestSection, string> = {
    COMMUNICATION: "bg-indigo-50 text-indigo-700 border-indigo-200",
    APTITUDE: "bg-violet-50 text-violet-700 border-violet-200",
    VIBE: "bg-teal-50 text-teal-700 border-teal-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles[section]}`}
    >
      {SECTION_LABELS[section]}
    </span>
  );
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}