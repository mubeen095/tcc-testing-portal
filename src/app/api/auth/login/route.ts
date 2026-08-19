import { NextRequest, NextResponse } from "next/server";

import { err, ok } from "@/lib/api";
import { createSessionCookieOptions, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/ratelimit";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err(new Error("Invalid request body"));
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;
  const rl = rateLimit({
    key: `login:${ip}:${email}`,
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordOk =
    user && (await verifyPassword(password, user.passwordHash));

  if (!user || !passwordOk) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const token = await signSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const res = ok({
    user: { id: user.id, email: user.email, role: user.role },
    redirect: user.role === "ADMIN" ? "/admin" : "/candidate",
  });
  res.cookies.set({
    ...createSessionCookieOptions(),
    value: token,
  });
  return res;
}