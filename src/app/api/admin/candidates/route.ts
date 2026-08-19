import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { fetchResultRows, type ResultsQuery } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const sp = request.nextUrl.searchParams;

    const query: ResultsQuery = {
      search: sp.get("search") ?? undefined,
      college: sp.get("college") ?? undefined,
      branch: sp.get("branch") ?? undefined,
      year: sp.get("year") ?? undefined,
      testSetId: sp.get("testSetId") ?? undefined,
      decision: (sp.get("decision") as ResultsQuery["decision"]) || undefined,
      attemptStatus: (sp.get("status") as ResultsQuery["attemptStatus"]) || undefined,
      sort: (sp.get("sort") as ResultsQuery["sort"]) || undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
      minScore: sp.get("minScore") ? Number(sp.get("minScore")) : undefined,
      maxScore: sp.get("maxScore") ? Number(sp.get("maxScore")) : undefined,
    };

    const data = await fetchResultRows(query);
    return ok(data);
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

    const {
      fullName = "",
      email = "",
      phone = "",
      college = "",
      branch = "",
      academicYear = "",
      rollNumber = "",
      password = "",
      testSetId = "",
    } = (body ?? {}) as Record<string, unknown>;

    if (!fullName || !email || !phone || !college || !branch || !academicYear || !rollNumber || !password || !testSetId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 422 });
    }
    if (!/^\+?[0-9]{7,15}$/.test(String(phone))) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 422 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 422 });
    }

    const existing = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const { hashPassword } = await import("@/lib/password");
    const passwordHash = await hashPassword(String(password));

    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase(),
        passwordHash,
        role: "CANDIDATE",
        candidateProfile: {
          create: {
            fullName: String(fullName),
            phone: String(phone),
            college: String(college),
            branch: String(branch),
            academicYear: String(academicYear),
            rollNumber: String(rollNumber),
            testSetId: String(testSetId),
          },
        },
      },
      select: {
        id: true,
        email: true,
        candidateProfile: { select: { id: true } },
      },
    });

    return ok(
      { candidateId: user.candidateProfile?.id },
      { status: 201 }
    );
  } catch (e) {
    return err(e);
  }
}