import { SignJWT, jwtVerify } from "jose";

import { env } from "@/lib/env";

export type SessionUser = {
  id: string;
  email: string;
  role: "CANDIDATE" | "ADMIN";
};

const secretKey = () => new TextEncoder().encode(env.jwtSecret);

export async function signSessionToken(
  user: SessionUser
): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${env.sessionTtlDays}d`)
    .sign(secretKey());
}

export type DecodedSession = {
  sub: string;
  role: "CANDIDATE" | "ADMIN";
  exp?: number;
};

export async function verifySessionToken(
  token: string
): Promise<DecodedSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || typeof payload.role !== "string") return null;
    return { sub: payload.sub, role: payload.role as "CANDIDATE" | "ADMIN" };
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function createSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: env.sessionCookie,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
}