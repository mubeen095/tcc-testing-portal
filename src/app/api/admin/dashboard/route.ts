import { NextRequest } from "next/server";

import { err, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { fetchDashboardStats } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const stats = await fetchDashboardStats();
    const recent = await prisma.attempt.findMany({
      orderBy: { startedAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        candidate: {
          select: {
            fullName: true,
            user: { select: { email: true } },
            testSet: { select: { code: true } },
          },
        },
      },
    });
    const assessments = await prisma.assessment.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, isActive: true, createdAt: true },
      take: 5,
    });
    return ok({ stats, recent, assessments });
  } catch (e) {
    return err(e);
  }
}