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

    if (attempt.status === "TERMINATED") {
      return NextResponse.json(
        { error: "This attempt was terminated and cannot be submitted.", status: "TERMINATED" },
        { status: 409 }
      );
    }
    if (attempt.status === "COMPLETED") {
      return ok({ status: "COMPLETED", already: true });
    }

    let auto = false;
    let body: { auto?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    if (isExpired(attempt)) auto = true;
    else if (body?.auto === true) auto = true;

    await submitAttempt(prisma, attempt, { auto });

    return ok({ status: "COMPLETED" });
  } catch (e) {
    return err(e);
  }
}