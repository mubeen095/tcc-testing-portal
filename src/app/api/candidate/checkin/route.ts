import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireCandidate, assertCandidateApproved } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCandidate(request);
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
    });
    if (!profile) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }
    await assertCandidateApproved(profile);

    let body: { granted?: boolean; denied?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    if (body.granted) {
      await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: { cameraConsentAt: new Date() },
      });
      return ok({ cameraConsentAt: new Date() });
    }
    if (body.denied) {
      const attempt = await prisma.attempt.findUnique({
        where: { candidateId: profile.id },
      });
      if (attempt && attempt.status === "IN_PROGRESS") {
        await prisma.proctoringEvent.create({
          data: {
            attemptId: attempt.id,
            type: "CAMERA_PERMISSION_DENIED",
            detail: "Camera permission was withheld or revoked",
          },
        });
      }
      return ok({ noted: true });
    }
    return ok({ noted: true });
  } catch (e) {
    return err(e);
  }
}