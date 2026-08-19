import { NextResponse } from "next/server";

import { createSessionCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    ...createSessionCookieOptions(),
    value: "",
    expires: new Date(0),
  });
  return res;
}

export async function GET() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    ...createSessionCookieOptions(),
    value: "",
    expires: new Date(0),
  });
  return res;
}