import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import type { TestSection } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function sortSections(a: TestSection, b: TestSection) {
  const order = ["COMMUNICATION", "APTITUDE", "VIBE"];
  return order.indexOf(a) - order.indexOf(b);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const testSets = await prisma.testSet.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        questions: {
          orderBy: [{ section: "asc" }, { number: "asc" }],
          select: {
            id: true,
            section: true,
            number: true,
            text: true,
            marks: true,
            isActive: true,
            options: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                text: true,
                order: true,
                isCorrect: true,
              },
            },
          },
        },
      },
    });

    return ok({
      testSets: testSets.map((t) => {
        const sections = new Map<TestSection, typeof t.questions>();
        for (const q of t.questions) {
          const list = sections.get(q.section) ?? [];
          list.push(q);
          sections.set(q.section, list);
        }
        return {
          id: t.id,
          code: t.code,
          name: t.name,
          sections: [...sections.entries()].sort((a, b) => sortSections(a[0], b[0])).map(([section, questions]) => ({
            section,
            questions,
          })),
        };
      }),
    });
  } catch (e) {
    return err(e);
  }
}

function validateQuestionPayload(body: unknown) {
  const {
    testSetId,
    section,
    text,
    marks,
    isActive,
    options,
  } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof testSetId !== "string" ||
    (section !== "COMMUNICATION" && section !== "APTITUDE" && section !== "VIBE") ||
    typeof text !== "string" ||
    text.trim().length < 3
  ) {
    return { error: "Invalid question payload" };
  }
  if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
    return { error: "Question must have between 2 and 6 options" };
  }
  const parsedOptions = options.map((o, i) => ({
    text: String((o as { text?: unknown }).text ?? "").trim(),
    order: i + 1,
    isCorrect: Boolean((o as { isCorrect?: unknown }).isCorrect),
  }));
  if (parsedOptions.some((o) => o.text.length === 0)) {
    return { error: "All options must have text" };
  }
  if (parsedOptions.filter((o) => o.isCorrect).length !== 1) {
    return { error: "Exactly one option must be marked correct" };
  }
  const score = marks === undefined ? 1 : Number(marks);
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    return { error: "Marks must be between 1 and 5" };
  }
  return {
    data: {
      testSetId,
      section: section as TestSection,
      text: text.trim(),
      marks: score,
      isActive: isActive === undefined ? true : Boolean(isActive),
      options: parsedOptions,
    },
  };
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

    const valid = validateQuestionPayload(body);
    if ("error" in valid) {
      return NextResponse.json({ error: valid.error }, { status: 422 });
    }
    const data = valid.data;

    const maxNumber = await prisma.question.aggregate({
      where: { testSetId: data.testSetId, section: data.section },
      _max: { number: true },
    });
    const nextNumber = (maxNumber._max.number ?? 0) + 1;

    const question = await prisma.question.create({
      data: {
        testSetId: data.testSetId,
        section: data.section,
        number: nextNumber,
        text: data.text,
        marks: data.marks,
        isActive: data.isActive,
        options: {
          create: data.options,
        },
      },
    });

    return ok({ question }, { status: 201 });
  } catch (e) {
    return err(e);
  }
}