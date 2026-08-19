import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import type { TestSection } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function parseEditPayload(body: unknown) {
  const {
    text,
    marks,
    isActive,
    options,
    number,
  } = (body ?? {}) as Record<string, unknown>;

  const edits: Record<string, unknown> = {};
  if (typeof text === "string" && text.trim().length >= 3) edits.text = text.trim();
  if (typeof isActive === "boolean") edits.isActive = isActive;

  let optionsData: { text: string; order: number; isCorrect: boolean }[] | null = null;
  if (Array.isArray(options)) {
    if (options.length < 2 || options.length > 6) {
      return { error: "Question must have between 2 and 6 options" };
    }
    optionsData = options.map((o, i) => ({
      text: String((o as { text?: unknown }).text ?? "").trim(),
      order: i + 1,
      isCorrect: Boolean((o as { isCorrect?: unknown }).isCorrect),
    }));
    if (optionsData.some((o) => o.text.length === 0)) {
      return { error: "All options must have text" };
    }
    if (optionsData.filter((o) => o.isCorrect).length !== 1) {
      return { error: "Exactly one option must be marked correct" };
    }
  }

  if (marks !== undefined) {
    const score = Number(marks);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      return { error: "Marks must be between 1 and 5" };
    }
    edits.marks = score;
  }

  if (number !== undefined && (typeof number !== "number" || number < 1)) {
    return { error: "Invalid question number" };
  }

  return { data: { edits, options: optionsData, number: typeof number === "number" ? number : null } };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = parseEditPayload(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 422 });
    }
    const { edits, options: optionsData, number } = parsed.data;

    const questionConstraints = {
      testSetId: question.testSetId,
      section: question.section as TestSection,
    };

    if (number !== null && number !== question.number) {
      // Reorder: swap numbers with the question currently occupying `number`.
      await prisma.$transaction(async (tx) => {
        const other = await tx.question.findFirst({
          where: { ...questionConstraints, number },
        });
        await tx.question.update({
          where: { id: question.id },
          data: { number: -1 },
        });
        if (other) {
          await tx.question.update({
            where: { id: other.id },
            data: { number: question.number },
          });
        }
        await tx.question.update({ where: { id: question.id }, data: { number } });
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id: question.id },
        data: edits,
      });
      if (optionsData) {
        await tx.questionOption.deleteMany({ where: { questionId: question.id } });
        await tx.questionOption.createMany({
          data: optionsData.map((o) => ({ ...o, questionId: question.id })),
        });
      }
    });

    const updated = await prisma.question.findUnique({
      where: { id },
      include: { options: { orderBy: { order: "asc" } } },
    });

    return ok({ question: updated });
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

    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const scheme = { testSetId: question.testSetId, section: question.section as TestSection };

    await prisma.$transaction(async (tx) => {
      await tx.question.delete({ where: { id } });
      const remaining = await tx.question.findMany({
        where: scheme,
        orderBy: { number: "asc" },
      });
      let n = 1;
      for (const q of remaining) {
        if (q.number !== n) {
          await tx.question.update({ where: { id: q.id }, data: { number: n } });
        }
        n += 1;
      }
    });

    return ok({ deleted: true });
  } catch (e) {
    return err(e);
  }
}