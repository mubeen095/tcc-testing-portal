import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { deletePhotoByUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const allowed = [
      "fullName",
      "phone",
      "college",
      "branch",
      "academicYear",
      "rollNumber",
      "testSetId",
    ];
    const profileData: Record<string, string | null> = {};
    for (const key of allowed) {
      if (key in body) profileData[key] = body[key] === "" ? null : String(body[key]);
    }
    if (Object.keys(profileData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
    }

    const attempt = await prisma.attempt.findUnique({ where: { candidateId: id } });
    if (attempt && attempt.status === "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Cannot edit a candidate with an in-progress assessment." },
        { status: 409 }
      );
    }

    if (profileData.testSetId !== undefined) {
      if (profileData.testSetId === null) {
        return NextResponse.json(
          { error: "A test set must be assigned to the candidate." },
          { status: 422 }
        );
      }
      const testSet = await prisma.testSet.findUnique({
        where: { id: profileData.testSetId },
      });
      if (!testSet) {
        return NextResponse.json({ error: "Test set not found" }, { status: 404 });
      }
    }

    const updated = await prisma.candidateProfile.update({
      where: { id },
      data: profileData,
      select: { id: true },
    });

    return ok({ updated: updated.id });
  } catch (e) {
    return err(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    await deletePhotoByUrl(candidate.photoUrl);

    await prisma.user.delete({ where: { id: candidate.userId } });

    return ok({ deleted: true });
  } catch (e) {
    return err(e);
  }
}