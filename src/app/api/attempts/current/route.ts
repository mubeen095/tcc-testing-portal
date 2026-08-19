import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireCandidate, assertCandidateApproved } from "@/lib/session";
import {
  ensureAttemptFresh,
  getAttemptForCandidate,
  isExpired,
} from "@/lib/attempts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCandidate(request);
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
    });
    if (!profile) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }
    await assertCandidateApproved(profile);

    let attempt = await getAttemptForCandidate(profile.id);
    if (!attempt) {
      return NextResponse.json({ attempt: null });
    }

    // Server-side expiry authority: auto-submit any overdue IN_PROGRESS attempt.
    const fresh = await ensureAttemptFresh(attempt.id);
    if (typeof fresh === "string") {
      attempt = await getAttemptForCandidate(profile.id);
      const attemptData = attempt
        ? {
            id: attempt.id,
            status: attempt.status,
            terminationReason: attempt.terminationReason,
            startedAt: attempt.startedAt,
            expiresAt: attempt.expiresAt,
            submittedAt: attempt.submittedAt,
            terminatedAt: attempt.terminatedAt,
          }
        : null;
      return ok({
        attempt: attemptData,
        remainingMs: 0,
        serverTime: new Date().toISOString(),
      });
    }
    attempt = fresh;

    const serverTime = Date.now();
    const remainingMs = !isExpired(attempt)
      ? Math.max(0, new Date(attempt.expiresAt!).getTime() - serverTime)
      : 0;

    const questions = await prisma.question.findMany({
      where: { testSetId: attempt.testSetId, isActive: true },
      orderBy: [{ section: "asc" }, { number: "asc" }],
      select: {
        id: true,
        section: true,
        number: true,
        text: true,
        marks: true,
        options: {
          orderBy: { order: "asc" },
          select: { id: true, text: true, order: true },
        },
      },
    });

    const answers = await prisma.answer.findMany({
      where: { attemptId: attempt.id },
      select: { questionId: true, selectedOptionId: true },
    });

    const answerMap: Record<string, string> = {};
    for (const a of answers) {
      if (a.selectedOptionId) answerMap[a.questionId] = a.selectedOptionId;
    }

    return ok({
      attempt: {
        id: attempt.id,
        testSetCode: (await prisma.testSet.findUnique({ where: { id: attempt.testSetId } }))?.code,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        submittedAt: attempt.submittedAt,
        terminatedAt: attempt.terminatedAt,
        terminationReason: attempt.terminationReason,
        candidateName: profile.fullName,
      },
      questions,
      answers: answerMap,
      remainingMs,
      serverTime,
    });
  } catch (e) {
    return err(e);
  }
}