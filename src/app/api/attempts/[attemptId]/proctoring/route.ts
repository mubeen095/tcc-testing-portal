import { NextRequest, NextResponse } from "next/server";

import { err, ok, forbidden, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUser, assertCandidateApproved } from "@/lib/session";
import { EVENT_TYPES, recordProctoringEvent } from "@/lib/attempts";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set<string>(Object.values(EVENT_TYPES));

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
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Attempt is not active." },
        { status: 409 }
      );
    }

    let body: { type?: string; detail?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const type = body?.type;
    if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "Unsupported proctoring event type" }, { status: 422 });
    }

    await recordProctoringEvent(prisma, attempt.id, type, body?.detail ?? undefined);

    return ok({ saved: true });
  } catch (e) {
    return err(e);
  }
}