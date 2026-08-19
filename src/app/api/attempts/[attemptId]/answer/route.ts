import { NextRequest, NextResponse } from "next/server";

import { err, ok, forbidden, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { isExpired, submitAttempt } from "@/lib/attempts";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const auth = await currentUser(request).catch(() => null);
    if (!auth) return unauthorized();

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
    });
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || !profile || attempt.candidateId !== profile.id) {
      return forbidden("You do not own this attempt");
    }

    if (attempt.status === "COMPLETED" || attempt.status === "TERMINATED") {
      return NextResponse.json(
        { error: "This attempt is already closed.", status: attempt.status },
        { status: 409 }
      );
    }

    if (isExpired(attempt)) {
      await submitAttempt(prisma, attempt, { auto: true });
      return NextResponse.json(
        { error: "Time is up. The assessment was auto-submitted.", status: "COMPLETED" },
        { status: 409 }
      );
    }

    let body: { questionId?: string; optionId?: string | null };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { questionId, optionId } = body ?? {};
    if (typeof questionId !== "string") {
      return NextResponse.json({ error: "questionId is required" }, { status: 422 });
    }

    const question = await prisma.question.findFirst({
      where: { id: questionId, testSetId: attempt.testSetId },
      select: { id: true },
    });
    if (!question) {
      return NextResponse.json({ error: "Unknown question for this test set" }, { status: 422 });
    }

    if (optionId !== undefined && optionId !== null && optionId !== "") {
      const option = await prisma.questionOption.findFirst({
        where: { id: optionId, questionId },
        select: { id: true },
      });
      if (!option) {
        return NextResponse.json({ error: "Unknown option for this question" }, { status: 422 });
      }
    }

    const selected = optionId && optionId !== "" ? optionId : null;

    if (selected === null) {
      await prisma.answer.deleteMany({
        where: { attemptId: attempt.id, questionId },
      });
    } else {
      await prisma.answer.upsert({
        where: {
          attemptId_questionId: { attemptId: attempt.id, questionId },
        },
        create: {
          attemptId: attempt.id,
          questionId,
          selectedOptionId: selected,
        },
        update: { selectedOptionId: selected },
      });
    }

    return ok({ saved: true });
  } catch (e) {
    return err(e);
  }
}