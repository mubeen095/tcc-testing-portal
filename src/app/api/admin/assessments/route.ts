import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { createAssessmentSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const assessments = await prisma.assessment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { attempts: true } },
      },
    });
    return ok({ assessments });
  } catch (e) {
    return err(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const parsed = createAssessmentSchema.safeParse({
      ...(body as Record<string, unknown>),
      durationMinutes: Number((body as Record<string, unknown>)?.durationMinutes ?? 30),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid assessment" },
        { status: 422 }
      );
    }

    const assessment = await prisma.$transaction(async (tx) => {
      await tx.assessment.updateMany({ data: { isActive: false } });
      return tx.assessment.create({
        data: {
          name: parsed.data.name,
          durationMinutes: parsed.data.durationMinutes,
          isActive: true,
        },
      });
    });

    return ok({ assessment }, { status: 201 });
  } catch (e) {
    return err(e);
  }
}