import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireCandidate } from "@/lib/session";
import { savePhoto, validatePhotoInput } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCandidate(request);
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
    });
    if (!profile) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { candidateId: profile.id },
    });
    if (attempt && attempt.status === "IN_PROGRESS") {
      return NextResponse.json(
        { error: "You cannot change your photo while an assessment is in progress." },
        { status: 400 }
      );
    }

    const form = await request.formData().catch(() => {
      throw new Error("Invalid upload data");
    });
    const file = form.get("photo");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No photo file provided" }, { status: 422 });
    }

    const bytes = await file.arrayBuffer();
    validatePhotoInput(file.type, bytes.byteLength);

    const { url } = await savePhoto(new Uint8Array(bytes), file.type, profile.id);

    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { photoUrl: url },
    });

    return ok({ photoUrl: url }, { status: 201 });
  } catch (e) {
    return err(e);
  }
}