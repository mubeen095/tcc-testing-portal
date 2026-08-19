import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { createSessionCookieOptions, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { rateLimit } from "@/lib/ratelimit";
import { registerSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err(new Error("Invalid request body"));
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit({ key: `register:${ip}`, limit: 15, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 }
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: "CANDIDATE",
      candidateProfile: {
        create: {
          fullName: data.fullName,
          phone: data.phone,
          college: data.college,
          branch: data.branch,
          academicYear: data.academicYear,
          rollNumber: data.rollNumber,
        },
      },
    },
    select: { id: true, email: true, role: true },
  });

  const token = await signSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const res = ok({ user, redirect: "/candidate" }, { status: 201 });
  res.cookies.set({
    ...createSessionCookieOptions(),
    value: token,
  });
  return res;
}