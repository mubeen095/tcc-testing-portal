import { NextRequest, NextResponse } from "next/server";

import { err, ok, forbidden, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUser, assertCandidateApproved } from "@/lib/session";
import {
  EVENT_TYPES,
  recordProctoringEvent,
  terminateAttempt,
} from "@/lib/attempts";

export const dynamic = "force-dynamic";

const ALLOWED_REASONS = new Set(["TAB_SWITCH", "ADMIN"]);

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
    await assertCandidateApproved(profile);

    if (attempt.status === "COMPLETED") {
      return NextResponse.json(
        { error: "This attempt is already completed.", status: "COMPLETED" },
        { status: 409 }
      );
    }
    if (attempt.status === "TERMINATED") {
      return ok({ status: "TERMINATED", already: true, terminationReason: attempt.terminationReason });
    }

    let body: { reason?: string } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const reason = body?.reason && ALLOWED_REASONS.has(body.reason) ? body.reason : "TAB_SWITCH";

    await recordProctoringEvent(
      prisma,
      attempt.id,
      EVENT_TYPES.TAB_SWITCH_DETECTED,
      "Tab/window visibility or focus lost during assessment"
    );

    const terminated = await terminateAttempt(prisma, attempt, reason);

    return ok({
      status: "TERMINATED",
      terminationReason: terminated.terminationReason,
    });
  } catch (e) {
    return err(e);
  }
}

export async function GET(
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
    await assertCandidateApproved(profile);
    if (attempt.status === "IN_PROGRESS") {
      await recordProctoringEvent(
        prisma,
        attempt.id,
        EVENT_TYPES.TAB_SWITCH_DETECTED,
        "Tab/window visibility change detected"
      );
    }
    return ok({ status: attempt.status, terminationReason: attempt.terminationReason });
  } catch (e) {
    return err(e);
  }
}