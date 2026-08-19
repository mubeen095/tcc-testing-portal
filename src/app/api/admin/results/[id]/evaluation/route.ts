import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { decisionSchema, vibeAdjustSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    let decision: "SELECTED" | "REJECTED" | "PENDING";
    let adminNotes: string | undefined;
    if ("decision" in (body as Record<string, unknown>) || "adminNotes" in (body as Record<string, unknown>)) {
      const parsed = decisionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Validation failed" },
          { status: 422 }
        );
      }
      decision = parsed.data.decision;
      adminNotes = parsed.data.adminNotes;
    } else {
      return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id },
      include: { attempt: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    const candidateAttempt = candidate.attempt ?? null;
    if (!candidateAttempt) {
      return NextResponse.json(
        { error: "Candidate has not taken the assessment yet." },
        { status: 400 }
      );
    }

    const evaluation = await prisma.candidateEvaluation.upsert({
      where: { candidateId: id },
      create: {
        candidateId: id,
        attemptId: candidateAttempt.id,
        decision,
        adminNotes: adminNotes ?? "",
      },
      update: {
        decision,
        adminNotes: adminNotes !== undefined ? adminNotes : undefined,
      },
    });

    return ok({ evaluation: { decision: evaluation.decision, adminNotes: evaluation.adminNotes } });
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = vibeAdjustSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Vibe Check score must be between 0 and 12." },
        { status: 422 }
      );
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id },
      include: { attempt: true },
    });
    if (!candidate || !candidate.attempt) {
      return NextResponse.json(
        { error: "Candidate attempt not found" },
        { status: 404 }
      );
    }
    const candidateAttempt = candidate.attempt;

    const comm = candidateAttempt.communicationScore ?? 0;
    const apt = candidateAttempt.aptitudeScore ?? 0;
    const vibe = parsed.data.score;

    const updated = await prisma.attempt.update({
      where: { id: candidateAttempt.id },
      data: {
        vibeScoreAdjusted: vibe,
        totalScore: comm + apt + vibe,
      },
    });

    return ok({
      vibeScore: vibe,
      totalScore: updated.totalScore,
    });
  } catch (e) {
    return err(e);
  }
}