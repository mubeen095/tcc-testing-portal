import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { deletePhotoByUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    let body: { confirmation?: string };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    if (body.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Type DELETE to confirm permanent deletion." },
        { status: 422 }
      );
    }

    // 1. Collect photo URLs and delete them from storage.
    const profiles = await prisma.candidateProfile.findMany({
      where: { photoUrl: { not: null } },
      select: { photoUrl: true },
    });
    await Promise.all(profiles.map((p) => deletePhotoByUrl(p.photoUrl)));

    // 2. Deactivate existing assessments and retire them.
    await prisma.assessment.updateMany({ data: { isActive: false } });

    // 3. Delete all candidate accounts. Cascades remove profiles,
    //    attempts, answers, proctoring events and evaluations.
    await prisma.user.deleteMany({ where: { role: "CANDIDATE" } });

    // 4. Create a fresh, empty active assessment for the next cycle.
    const assessment = await prisma.assessment.create({
      data: {
        name: `Recruitment Assessment ${new Date().toISOString().slice(0, 10)}`,
        durationMinutes: 30,
        isActive: true,
      },
    });

    return ok({
      deleted: true,
      assessment: { id: assessment.id, name: assessment.name },
    });
  } catch (e) {
    return err(e);
  }
}