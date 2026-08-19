import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireCandidate, assertCandidateApproved } from "@/lib/session";
import { startAttempt } from "@/lib/attempts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCandidate(request);
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
      include: { testSet: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }
    await assertCandidateApproved(profile);
    if (!profile.photoUrl) {
      return NextResponse.json(
        { error: "You must submit a photograph before starting the assessment." },
        { status: 400 }
      );
    }
    if (!profile.cameraConsentAt) {
      return NextResponse.json(
        { error: "You must complete the camera check and consent before starting." },
        { status: 400 }
      );
    }
    if (!profile.testSetId) {
      return NextResponse.json(
        { error: "A test set has not been assigned to you yet." },
        { status: 400 }
      );
    }

    const existing = await prisma.attempt.findUnique({
      where: { candidateId: profile.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An assessment attempt already exists for your account." },
        { status: 409 }
      );
    }

    const attempt = await startAttempt(profile.id, profile.testSetId);

    return ok({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
      },
    }, { status: 201 });
  } catch (e) {
    return err(e);
  }
}