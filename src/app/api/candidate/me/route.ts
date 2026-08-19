import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireCandidate } from "@/lib/session";
import { ensureAttemptFresh } from "@/lib/attempts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCandidate(request);
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
      include: { testSet: true, user: { select: { email: true } } },
    });
    if (!profile) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }

    let attempt = await prisma.attempt.findUnique({
      where: { candidateId: profile.id },
    });

    if (attempt && attempt.status === "IN_PROGRESS") {
      const fresh = await ensureAttemptFresh(attempt.id);
      if (fresh === "completed" || fresh === "terminated" || fresh === "notfound") {
        attempt = fresh === "notfound" ? null : await prisma.attempt.findUnique({ where: { id: attempt.id } });
      } else {
        attempt = fresh;
      }
    }

    return ok({
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.user.email,
        phone: profile.phone,
        college: profile.college,
        branch: profile.branch,
        academicYear: profile.academicYear,
        rollNumber: profile.rollNumber,
        photoUrl: profile.photoUrl,
        hasPhoto: !!profile.photoUrl,
        cameraConsentAt: profile.cameraConsentAt,
        testSetId: profile.testSetId,
        testSetCode: profile.testSet?.code ?? null,
        testSetName: profile.testSet?.name ?? null,
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
          }
        : null,
    });
  } catch (e) {
    return err(e);
  }
}