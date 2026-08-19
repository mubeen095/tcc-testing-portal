import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ExportRow = {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  academicYear: string;
  rollNumber: string;
  testSetCode: string;
  communicationScore: number | string;
  aptitudeScore: number | string;
  vibeScore: number | string;
  totalScore: number | string;
  attemptStatus: string;
  timeTaken: string;
  startedAt: string;
  submittedAt: string;
  tabSwitchCount: number;
  cameraEventCount: number;
  adminDecision: string;
  adminNotes: string;
};

export const EXPORT_HEADERS = [
  "Full Name",
  "Email",
  "Phone",
  "College",
  "Branch",
  "Academic Year",
  "Roll Number",
  "Test Set",
  "Communication Score",
  "Aptitude Score",
  "Vibe Check Score",
  "Overall Score",
  "Test Status",
  "Time Taken",
  "Started At",
  "Submitted At",
  "Tab Switch Count",
  "Camera Events",
  "Admin Decision",
  "Admin Notes",
];

export const SELECTED_HEADERS = [
  "Full Name",
  "Email",
  "Phone",
  "College",
  "Branch",
  "Academic Year",
  "Roll Number",
  "Test Set",
  "Communication Score",
  "Aptitude Score",
  "Vibe Check Score",
  "Overall Score",
  "Admin Decision",
];

function fmtDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toISOString();
}

const CANDIDATE_EXPORT_SELECT = {
  fullName: true,
  user: { select: { email: true } },
  phone: true,
  college: true,
  branch: true,
  academicYear: true,
  rollNumber: true,
  testSet: { select: { code: true } },
  attempt: {
    select: {
      id: true,
      status: true,
      startedAt: true,
      submittedAt: true,
      durationSeconds: true,
      communicationScore: true,
      aptitudeScore: true,
      vibeScore: true,
      vibeScoreAdjusted: true,
      totalScore: true,
    },
  },
  evaluation: { select: { decision: true, adminNotes: true } },
} as const;

type CandidateWithAttempt = {
  fullName: string;
  user: { email: string } | null;
  phone: string;
  college: string;
  branch: string;
  academicYear: string;
  rollNumber: string;
  testSet: { code: string } | null;
  attempt: {
    id: string;
    status: string;
    startedAt: Date | null;
    submittedAt: Date | null;
    durationSeconds: number | null;
    communicationScore: number | null;
    aptitudeScore: number | null;
    vibeScore: number | null;
    vibeScoreAdjusted: number | null;
    totalScore: number | null;
  } | null;
  evaluation: { decision: string; adminNotes: string | null } | null;
};

async function loadCandidates(withDecision?: "SELECTED"): Promise<CandidateWithAttempt[]> {
  const where: Prisma.CandidateProfileWhereInput = {
    ...(withDecision
      ? { evaluation: { is: { decision: "SELECTED" } } }
      : {}),
  };
  return prisma.candidateProfile.findMany({
    where,
    select: CANDIDATE_EXPORT_SELECT,
    orderBy: { fullName: "asc" },
  }) as Promise<CandidateWithAttempt[]>;
}

export async function countEventsByAttempt(attemptIds: string[]) {
  if (attemptIds.length === 0) {
    return { camera: new Map<string, number>(), tabSwitch: new Map<string, number>() };
  }
  const cameraRows = await prisma.proctoringEvent.groupBy({
    by: ["attemptId"],
    where: { attemptId: { in: attemptIds }, type: { startsWith: "CAMERA_" } },
    _count: { _all: true },
  });
  const tabRows = await prisma.proctoringEvent.groupBy({
    by: ["attemptId"],
    where: { attemptId: { in: attemptIds }, type: "TAB_SWITCH_DETECTED" },
    _count: { _all: true },
  });
  const camera = new Map(cameraRows.map((r) => [r.attemptId, r._count._all]));
  const tabSwitch = new Map(tabRows.map((r) => [r.attemptId, r._count._all]));
  return { camera, tabSwitch };
}

export async function buildExportRows(
  withDecision?: "SELECTED"
): Promise<ExportRow[]> {
  const candidates = await loadCandidates(withDecision);
  const attemptIds = candidates
    .map((c) => c.attempt?.id)
    .filter((x): x is string => !!x);
  const { camera, tabSwitch } = await countEventsByAttempt(attemptIds);

  return candidates.map((c) => {
    const a = c.attempt;
    const comm = a?.communicationScore ?? "";
    const apt = a?.aptitudeScore ?? "";
    const vibe = a?.vibeScoreAdjusted ?? a?.vibeScore ?? "";
    const total =
      a?.totalScore ?? (comm === "" ? "" : (a?.communicationScore ?? 0) + (a?.aptitudeScore ?? 0) + (a?.vibeScoreAdjusted ?? a?.vibeScore ?? 0));
    return {
      fullName: c.fullName,
      email: c.user?.email ?? "",
      phone: c.phone,
      college: c.college,
      branch: c.branch,
      academicYear: c.academicYear,
      rollNumber: c.rollNumber,
      testSetCode: c.testSet?.code ?? "",
      communicationScore: comm,
      aptitudeScore: apt,
      vibeScore: vibe,
      totalScore: total,
      attemptStatus: a?.status ?? "NOT_STARTED",
      timeTaken: fmtDuration(a?.durationSeconds ?? null),
      startedAt: fmtDate(a?.startedAt ?? null),
      submittedAt: fmtDate(a?.submittedAt ?? null),
      tabSwitchCount: tabSwitch.get(a?.id ?? "") ?? 0,
      cameraEventCount: camera.get(a?.id ?? "") ?? 0,
      adminDecision: c.evaluation?.decision ?? "PENDING",
      adminNotes: c.evaluation?.adminNotes ?? "",
    };
  });
}

export function rowsToArrays(rows: ExportRow[]): (string | number)[][] {
  return rows.map((r) => [
    r.fullName,
    r.email,
    r.phone,
    r.college,
    r.branch,
    r.academicYear,
    r.rollNumber,
    r.testSetCode,
    r.communicationScore,
    r.aptitudeScore,
    r.vibeScore,
    r.totalScore,
    r.attemptStatus,
    r.timeTaken,
    r.startedAt,
    r.submittedAt,
    r.tabSwitchCount,
    r.cameraEventCount,
    r.adminDecision,
    r.adminNotes,
  ]);
}

export function rowsToSelectedArrays(rows: ExportRow[]): (string | number)[][] {
  return rows.map((r) => [
    r.fullName,
    r.email,
    r.phone,
    r.college,
    r.branch,
    r.academicYear,
    r.rollNumber,
    r.testSetCode,
    r.communicationScore,
    r.aptitudeScore,
    r.vibeScore,
    r.totalScore,
    r.adminDecision,
  ]);
}