import type {
  Attempt,
  Prisma,
  PrismaClient,
  TestSection,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ASSESSMENT_DURATION_MINUTES } from "@/lib/env";

export const EVENT_TYPES = {
  ASSESSMENT_STARTED: "ASSESSMENT_STARTED",
  CAMERA_PERMISSION_GRANTED: "CAMERA_PERMISSION_GRANTED",
  CAMERA_PERMISSION_DENIED: "CAMERA_PERMISSION_DENIED",
  CAMERA_DISCONNECTED: "CAMERA_DISCONNECTED",
  CAMERA_RECONNECTED: "CAMERA_RECONNECTED",
  TAB_VISIBILITY_CHANGED: "TAB_VISIBILITY_CHANGED",
  BROWSER_LOST_FOCUS: "BROWSER_LOST_FOCUS",
  TAB_SWITCH_DETECTED: "TAB_SWITCH_DETECTED",
  ASSESSMENT_SUBMITTED: "ASSESSMENT_SUBMITTED",
  ASSESSMENT_AUTO_SUBMITTED: "ASSESSMENT_AUTO_SUBMITTED",
  ASSESSMENT_TERMINATED: "ASSESSMENT_TERMINATED",
} as const;

export type Tx = Prisma.TransactionClient;

export async function recordProctoringEvent(
  db: PrismaClient | Tx,
  attemptId: string,
  type: string,
  detail?: string
) {
  return db.proctoringEvent.create({
    data: {
      attemptId,
      type,
      detail: detail ?? null,
    },
  });
}

export function getAssessment() {
  return prisma.assessment.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAttemptForCandidate(
  candidateId: string
): Promise<Attempt | null> {
  return prisma.attempt.findUnique({ where: { candidateId } });
}

export async function getAttemptDeep(attemptId: string) {
  return prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      candidate: { include: { user: true } },
      assessment: true,
      testSet: true,
      answers: { include: { question: true } },
      proctoringEvents: { orderBy: { createdAt: "asc" } },
      evaluation: true,
    },
  });
}

export function isExpired(attempt: { expiresAt: Date | null }, now = new Date()) {
  return !!attempt.expiresAt && now.getTime() >= attempt.expiresAt.getTime();
}

type ActiveQuestion = {
  id: string;
  testSetId: string;
  section: TestSection;
  marks: number;
  options: { id: string; isCorrect: boolean }[];
};

function computeSectionScores(
  questions: ActiveQuestion[],
  answers: { questionId: string; selectedOptionId: string | null }[]
) {
  const answerByQuestion = new Map(
    answers.map((a) => [a.questionId, a.selectedOptionId])
  );
  const correctOptionByQuestion = new Map<string, string>();
  for (const q of questions) {
    const correct = q.options.find((o) => o.isCorrect);
    if (correct) correctOptionByQuestion.set(q.id, correct.id);
  }

  const scores = { COMMUNICATION: 0, APTITUDE: 0, VIBE: 0 };
  const corrected = new Map<string, boolean>();
  for (const q of questions) {
    const selected = answerByQuestion.get(q.id) ?? null;
    const correctOptionId = correctOptionByQuestion.get(q.id);
    const isCorrect =
      selected !== null &&
      correctOptionId !== undefined &&
      selected === correctOptionId;
    corrected.set(q.id, isCorrect);
    if (isCorrect) {
      scores[q.section] += q.marks;
    }
  }
  return {
    scores,
    corrected,
  };
}

export async function submitAttempt(db: PrismaClient | Tx, attempt: Attempt, opts: { auto: boolean }) {
  const now = new Date();
  const [questions, currentAnswers] = await Promise.all([
    db.question.findMany({
      where: { testSetId: attempt.testSetId, isActive: true },
      select: {
        id: true,
        testSetId: true,
        section: true,
        marks: true,
        options: { select: { id: true, isCorrect: true } },
      },
    }),
    db.answer.findMany({ where: { attemptId: attempt.id } }),
  ]);

  const { scores, corrected } = computeSectionScores(questions, currentAnswers);

  const durationSeconds = Math.max(
    1,
    Math.floor(
      (now.getTime() -
        (attempt.startedAt ?? attempt.expiresAt ?? now).getTime()) /
        1000
    )
  );

  const updated = await db.attempt.update({
    where: { id: attempt.id },
    data: {
      status: "COMPLETED",
      submittedAt: now,
      durationSeconds,
      communicationScore: scores.COMMUNICATION,
      aptitudeScore: scores.APTITUDE,
      vibeScore: scores.VIBE,
      totalScore:
        scores.COMMUNICATION + scores.APTITUDE + scores.VIBE,
    },
  });

  await Promise.all(
    [...corrected.entries()].map(([questionId, ok]) =>
      db.answer.updateMany({
        where: { attemptId: attempt.id, questionId },
        data: { isCorrect: ok },
      })
    )
  );

  await recordProctoringEvent(
    db,
    attempt.id,
    opts.auto ? EVENT_TYPES.ASSESSMENT_AUTO_SUBMITTED : EVENT_TYPES.ASSESSMENT_SUBMITTED
  );

  return updated;
}

export async function terminateAttempt(
  db: PrismaClient | Tx,
  attempt: Attempt,
  reason = "TAB_SWITCH"
) {
  const now = new Date();
  const isAlreadyEnded =
    attempt.status === "COMPLETED" || attempt.status === "TERMINATED";
  if (isAlreadyEnded) {
    const existing = await prisma.attempt.findUnique({ where: { id: attempt.id } });
    if (!existing) {
      throw new Error("Attempt not found");
    }
    return existing;
  }

  const [questions, currentAnswers] = await Promise.all([
    db.question.findMany({
      where: { testSetId: attempt.testSetId, isActive: true },
      select: {
        id: true,
        testSetId: true,
        section: true,
        marks: true,
        options: { select: { id: true, isCorrect: true } },
      },
    }),
    db.answer.findMany({ where: { attemptId: attempt.id } }),
  ]);

  const { scores, corrected } = computeSectionScores(questions, currentAnswers);

  const durationSeconds = Math.max(
    1,
    Math.floor(
      (now.getTime() -
        (attempt.startedAt ?? attempt.expiresAt ?? now).getTime()) /
        1000
    )
  );

  const updated = await db.attempt.update({
    where: { id: attempt.id },
    data: {
      status: "TERMINATED",
      terminationReason: reason,
      terminatedAt: now,
      durationSeconds,
      communicationScore: scores.COMMUNICATION,
      aptitudeScore: scores.APTITUDE,
      vibeScore: scores.VIBE,
      totalScore: scores.COMMUNICATION + scores.APTITUDE + scores.VIBE,
    },
  });

  await Promise.all(
    [...corrected.entries()].map(([questionId, ok]) =>
      db.answer.updateMany({
        where: { attemptId: attempt.id, questionId },
        data: { isCorrect: ok },
      })
    )
  );

  await recordProctoringEvent(
    db,
    attempt.id,
    EVENT_TYPES.ASSESSMENT_TERMINATED,
    reason
  );

  return updated;
}

export function computeEffectiveVibeScore(attempt: Attempt): number {
  return attempt.vibeScoreAdjusted ?? attempt.vibeScore ?? 0;
}

export function computeEffectiveTotal(attempt: Attempt): number {
  return (
    (attempt.communicationScore ?? 0) +
    (attempt.aptitudeScore ?? 0) +
    computeEffectiveVibeScore(attempt)
  );
}

export async function startAttempt(candidateId: string, testSetId: string) {
  const assessment = await getAssessment();
  if (!assessment) {
    throw new Error("No active assessment is configured.");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.attempt.findUnique({ where: { candidateId } });
    if (existing) {
      throw new Error("An attempt already exists for this candidate.");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ASSESSMENT_DURATION_MINUTES * 60 * 1000);

    const attempt = await tx.attempt.create({
      data: {
        candidateId,
        assessmentId: assessment.id,
        testSetId,
        status: "IN_PROGRESS",
        startedAt: now,
        expiresAt,
      },
    });

    await recordProctoringEvent(
      tx,
      attempt.id,
      EVENT_TYPES.ASSESSMENT_STARTED
    );

    return attempt;
  });
}

export async function ensureAttemptFresh(
  attemptId: string
): Promise<Attempt | "completed" | "terminated" | "notfound"> {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return "notfound";
  if (attempt.status === "COMPLETED") return "completed";
  if (attempt.status === "TERMINATED") return "terminated";

  if (isExpired(attempt)) {
    await submitAttempt(prisma, attempt, { auto: true });
    return "completed";
  }
  return attempt;
}