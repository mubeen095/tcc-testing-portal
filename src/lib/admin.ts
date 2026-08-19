import type { AttemptStatus, DecisionStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type SortOption = "score_desc" | "score_asc" | "newest" | "oldest";

export type ResultsQuery = {
  search?: string;
  college?: string;
  branch?: string;
  year?: string;
  testSetId?: string;
  unassigned?: boolean;
  decision?: DecisionStatus | "";
  attemptStatus?: AttemptStatus | "";
  minScore?: number;
  maxScore?: number;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

const CANDIDATE_SELECT = {
  id: true,
  fullName: true,
  user: { select: { email: true } },
  phone: true,
  college: true,
  branch: true,
  academicYear: true,
  rollNumber: true,
  photoUrl: true,
  testSetId: true,
  createdAt: true,
  testSet: { select: { code: true, name: true } },
  attempt: {
    select: {
      id: true,
      status: true,
      terminationReason: true,
      startedAt: true,
      submittedAt: true,
      terminatedAt: true,
      durationSeconds: true,
      communicationScore: true,
      aptitudeScore: true,
      vibeScore: true,
      vibeScoreAdjusted: true,
      totalScore: true,
      _count: {
        select: {
          proctoringEvents: {
            where: { type: "TAB_SWITCH_DETECTED" },
          },
        },
      },
    },
  },
  evaluation: {
    select: { decision: true, adminNotes: true },
  },
} as const;

export type ResultRow = {
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  academicYear: string;
  rollNumber: string;
  photoUrl: string | null;
  testSetCode: string | null;
  testSetName: string | null;
  testSetId: string | null;
  attemptId: string | null;
  attemptStatus: AttemptStatus | "NOT_STARTED";
  terminationReason: string | null;
  startedAt: Date | null;
  submittedAt: Date | null;
  terminatedAt: Date | null;
  durationSeconds: number | null;
  communicationScore: number;
  aptitudeScore: number;
  vibeScore: number;
  totalScore: number;
  decision: DecisionStatus;
  adminNotes: string | null;
  tabSwitchCount: number;
};

export async function fetchResultRows(query: ResultsQuery) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(200, Math.max(10, query.pageSize ?? 50));

  const where: Record<string, unknown> = {};

  if (query.search?.trim()) {
    const term = query.search.trim();
    where.OR = [
      { fullName: { contains: term, mode: "insensitive" } },
      { user: { email: { contains: term.toLocaleLowerCase(), mode: "insensitive" } } },
      { phone: { contains: term } },
      { rollNumber: { contains: term, mode: "insensitive" } },
    ];
  }
  if (query.college) where.college = query.college;
  if (query.branch) where.branch = query.branch;
  if (query.year) where.academicYear = query.year;
  if (query.testSetId) where.testSetId = query.testSetId;
  if (query.unassigned) where.testSetId = null;
  if (query.decision) where.evaluation = { decision: query.decision };
  if (query.attemptStatus) where.attempt = { status: query.attemptStatus };

  if (query.minScore !== undefined || query.maxScore !== undefined) {
    const totalScore: Record<string, number> = {};
    if (query.minScore !== undefined) totalScore.gte = query.minScore;
    if (query.maxScore !== undefined) totalScore.lte = query.maxScore;
    const attemptWhere =
      typeof query.attemptStatus === "string" && query.attemptStatus
        ? { status: query.attemptStatus, totalScore }
        : { totalScore };
    where.attempt = attemptWhere;
  }

  let orderBy: Prisma.CandidateProfileOrderByWithRelationInput;
  switch (query.sort) {
    case "score_desc":
      orderBy = { attempt: { totalScore: "desc" } };
      break;
    case "score_asc":
      orderBy = { attempt: { totalScore: "asc" } };
      break;
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  const [rows, total] = await Promise.all([
    prisma.candidateProfile.findMany({
      where,
      select: CANDIDATE_SELECT,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.candidateProfile.count({ where }),
  ]);

  return {
    rows: rows.map(toResultRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function toResultRow(
  r: {
    id: string;
    fullName: string;
    user: { email: string } | null;
    phone: string;
    college: string;
    branch: string;
    academicYear: string;
    rollNumber: string;
    photoUrl: string | null;
    testSetId: string | null;
    testSet: { code: string; name: string } | null;
    attempt: {
      id: string;
      status: AttemptStatus;
      terminationReason: string | null;
      startedAt: Date | null;
      submittedAt: Date | null;
      terminatedAt: Date | null;
      durationSeconds: number | null;
      communicationScore: number | null;
      aptitudeScore: number | null;
      vibeScore: number | null;
      vibeScoreAdjusted: number | null;
      totalScore: number | null;
      _count: { proctoringEvents: number };
    } | null;
    evaluation: { decision: DecisionStatus; adminNotes: string | null } | null;
  }
): ResultRow {
  const a = r.attempt;
  const comm = a?.communicationScore ?? 0;
  const apt = a?.aptitudeScore ?? 0;
  const vibe = a?.vibeScoreAdjusted ?? a?.vibeScore ?? 0;
  return {
    candidateId: r.id,
    fullName: r.fullName,
    email: r.user?.email ?? "",
    phone: r.phone,
    college: r.college,
    branch: r.branch,
    academicYear: r.academicYear,
    rollNumber: r.rollNumber,
    photoUrl: r.photoUrl,
    testSetCode: r.testSet?.code ?? null,
    testSetName: r.testSet?.name ?? null,
    testSetId: r.testSetId,
    attemptId: a?.id ?? null,
    attemptStatus: a?.status ?? "NOT_STARTED",
    terminationReason: a?.terminationReason ?? null,
    startedAt: a?.startedAt ?? null,
    submittedAt: a?.submittedAt ?? null,
    terminatedAt: a?.terminatedAt ?? null,
    durationSeconds: a?.durationSeconds ?? null,
    communicationScore: comm,
    aptitudeScore: apt,
    vibeScore: vibe,
    totalScore: a?.totalScore ?? comm + apt + vibe,
    decision: r.evaluation?.decision ?? "PENDING",
    adminNotes: r.evaluation?.adminNotes ?? null,
    tabSwitchCount: a?._count.proctoringEvents ?? 0,
  };
}

export async function fetchFilterOptions() {
  const [colleges, branches, years, testSets] = await Promise.all([
    prisma.candidateProfile.findMany({ select: { college: true }, distinct: ["college"] }),
    prisma.candidateProfile.findMany({ select: { branch: true }, distinct: ["branch"] }),
    prisma.candidateProfile.findMany({ select: { academicYear: true }, distinct: ["academicYear"] }),
    prisma.testSet.findMany({ orderBy: { code: "asc" } }),
  ]);
  return {
    colleges: colleges.map((c) => c.college).sort(),
    branches: branches.map((b) => b.branch).sort(),
    years: years.map((y) => y.academicYear).sort(),
    testSets: testSets.map((t) => ({ id: t.id, code: t.code, name: t.name })),
  };
}

export async function fetchDashboardStats() {
  const [
    totalCandidates,
    inProgress,
    completed,
    terminated,
    selected,
    rejected,
  ] = await Promise.all([
    prisma.candidateProfile.count(),
    prisma.attempt.count({ where: { status: "IN_PROGRESS" } }),
    prisma.attempt.count({ where: { status: "COMPLETED" } }),
    prisma.attempt.count({ where: { status: "TERMINATED" } }),
    prisma.candidateEvaluation.count({ where: { decision: "SELECTED" } }),
    prisma.candidateEvaluation.count({ where: { decision: "REJECTED" } }),
  ]);

  const attempted = inProgress + completed + terminated;
  const registered = Math.max(0, totalCandidates - attempted);
  const pendingReview = Math.max(0, completed + terminated - selected - rejected);

  return {
    totalCandidates,
    registered,
    notStarted: registered,
    inProgress,
    completed,
    terminated,
    selected,
    rejected,
    pendingReview,
  };
}