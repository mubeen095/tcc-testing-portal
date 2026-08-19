import { NextRequest, NextResponse } from "next/server";

import { err, forbidden, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { getAttemptDeep } from "@/lib/attempts";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await currentUser(request).catch(() => null);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { id } = await params;

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        testSet: true,
        attempt: true,
        evaluation: true,
      },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const isAdmin = auth.role === "ADMIN";
    const isOwner = candidate.userId === auth.id;
    if (!isAdmin && !isOwner) {
      return forbidden("You cannot access this candidate's data");
    }

    const candidateAttempt = candidate.attempt ?? null;

    if (!isAdmin) {
      return ok({
        candidate: {
          fullName: candidate.fullName,
          email: candidate.user.email,
          college: candidate.college,
          branch: candidate.branch,
          academicYear: candidate.academicYear,
          testSetCode: candidate.testSet?.code ?? null,
        },
        attempt: {
          status: candidateAttempt?.status ?? null,
          startedAt: candidateAttempt?.startedAt,
          submittedAt: candidateAttempt?.submittedAt,
          terminatedAt: candidateAttempt?.terminatedAt,
          terminationReason: candidateAttempt?.terminationReason,
        },
      });
    }

    let attempt = null;
    if (candidateAttempt) {
      attempt = await getAttemptDeep(candidateAttempt.id);
    }

    const questions = candidateAttempt
      ? await prisma.question.findMany({
          where: { testSetId: candidateAttempt.testSetId },
          orderBy: [{ section: "asc" }, { number: "asc" }],
          select: {
            id: true,
            section: true,
            number: true,
            text: true,
            marks: true,
            isActive: true,
            options: { orderBy: { order: "asc" }, select: { id: true, text: true, isCorrect: true, order: true } },
          },
        })
      : [];

    const cameraEventCount = attempt
      ? await prisma.proctoringEvent.count({
          where: { attemptId: attempt.id, type: { startsWith: "CAMERA_" } },
        })
      : 0;

    return ok({
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.user.email,
        phone: candidate.phone,
        college: candidate.college,
        branch: candidate.branch,
        academicYear: candidate.academicYear,
        rollNumber: candidate.rollNumber,
        photoUrl: candidate.photoUrl,
        createdAt: candidate.createdAt,
        testSetId: candidate.testSetId,
        testSetCode: candidate.testSet?.code ?? null,
        testSetName: candidate.testSet?.name ?? null,
      },
      attempt: attempt
        ? {
            id: attempt.id,
            status: attempt.status,
            terminationReason: attempt.terminationReason,
            startedAt: attempt.startedAt,
            expiresAt: attempt.expiresAt,
            submittedAt: attempt.submittedAt,
            terminatedAt: attempt.terminatedAt,
            durationSeconds: attempt.durationSeconds,
            communicationScore: attempt.communicationScore ?? null,
            aptitudeScore: attempt.aptitudeScore ?? null,
            vibeScore: attempt.vibeScore ?? null,
            vibeScoreAdjusted: attempt.vibeScoreAdjusted ?? null,
            totalScore: attempt.totalScore ?? null,
            cameraEventCount,
          }
        : null,
      answers: attempt
        ? attempt.answers.map((a) => ({
            questionId: a.questionId,
            selectedOptionId: a.selectedOptionId,
            isCorrect: a.isCorrect,
          }))
        : [],
      questions,
      proctoring: attempt
        ? attempt.proctoringEvents.map((e) => ({
            type: e.type,
            detail: e.detail,
            createdAt: e.createdAt,
          }))
        : [],
      evaluation: candidate.evaluation
        ? {
            decision: candidate.evaluation.decision,
            adminNotes: candidate.evaluation.adminNotes,
            updatedAt: candidate.evaluation.updatedAt,
          }
        : null,
    });
  } catch (e) {
    return err(e);
  }
}