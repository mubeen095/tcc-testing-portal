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

    let body: { action?: "approve" | "reject"; reason?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const action = body?.action;
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 422 });
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id },
      include: { user: { select: { email: true } }, attempt: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.candidateProfile.update({
        where: { id },
        data: { approvalStatus: "APPROVED", approvedAt: new Date(), rejectionReason: null },
      });
      return ok({ id, approvalStatus: "APPROVED" });
    }

    const rejectionReason = (body?.reason ?? "").trim();
    const data: Record<string, unknown> = {
      approvalStatus: "REJECTED",
      approvedAt: null,
      rejectionReason: rejectionReason || null,
    };

    if (candidate.testSetId) {
      data.testSetId = null;
    }

    if (candidate.attempt && candidate.attempt.status === "IN_PROGRESS") {
      data.attempt = {
        update: {
          status: "TERMINATED",
          terminatedAt: new Date(),
          terminationReason: "ADMIN",
        },
      };
    }

    await prisma.candidateProfile.update({
      where: { id },
      data,
    });

    return ok({ id, approvalStatus: "REJECTED" });
  } catch (e) {
    return err(e);
  }
}