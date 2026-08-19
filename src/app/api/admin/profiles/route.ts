import { NextRequest } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import type { ProfileApprovalStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const sp = request.nextUrl.searchParams;
    const status = sp.get("status") as ProfileApprovalStatus | null;
    const search = sp.get("search")?.trim() ?? "";

    const where: Record<string, unknown> = {};
    if (status) where.approvalStatus = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search.toLocaleLowerCase(), mode: "insensitive" } } },
        { phone: { contains: search } },
        { rollNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rows, pending, approved, rejected, total] = await Promise.all([
      prisma.candidateProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 500,
        select: {
          id: true,
          fullName: true,
          user: { select: { email: true } },
          phone: true,
          college: true,
          branch: true,
          academicYear: true,
          rollNumber: true,
          photoUrl: true,
          approvalStatus: true,
          rejectionReason: true,
          approvedAt: true,
          createdAt: true,
          testSet: { select: { code: true } },
          attempt: { select: { status: true } },
        },
      }),
      prisma.candidateProfile.count({ where: { approvalStatus: "PENDING" } }),
      prisma.candidateProfile.count({ where: { approvalStatus: "APPROVED" } }),
      prisma.candidateProfile.count({ where: { approvalStatus: "REJECTED" } }),
      prisma.candidateProfile.count({ where }),
    ]);

    return ok({
      rows: rows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.user?.email ?? "",
        phone: r.phone,
        college: r.college,
        branch: r.branch,
        academicYear: r.academicYear,
        rollNumber: r.rollNumber,
        photoUrl: r.photoUrl,
        approvalStatus: r.approvalStatus,
        rejectionReason: r.rejectionReason,
        approvedAt: r.approvedAt,
        createdAt: r.createdAt,
        testSetCode: r.testSet?.code ?? null,
        attemptStatus: r.attempt?.status ?? null,
      })),
      counts: { pending, approved, rejected },
      total,
    });
  } catch (e) {
    return err(e);
  }
}