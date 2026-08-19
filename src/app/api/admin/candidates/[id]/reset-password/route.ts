import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const candidate = await prisma.candidateProfile.findUnique({ where: { id } });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    let body: { newPassword?: string };
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const newPassword = body?.newPassword;
    if (
      typeof newPassword !== "string" ||
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters with upper, lower and numeric characters." },
        { status: 422 }
      );
    }

    const { hashPassword } = await import("@/lib/password");
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: candidate.userId },
      data: { passwordHash },
    });

    return ok({ reset: true });
  } catch (e) {
    return err(e);
  }
}