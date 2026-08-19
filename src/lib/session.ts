import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { ApiError, verifySessionToken, type SessionUser } from "@/lib/auth";
import { env } from "@/lib/env";

export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(env.sessionCookie)?.value ?? null;
}

export async function getAuth(
  request?: NextRequest
): Promise<SessionUser | null> {
  let token: string | null = null;
  if (request) {
    token = getTokenFromRequest(request);
  } else {
    const store = await cookies();
    token = store.get(env.sessionCookie)?.value ?? null;
  }
  if (!token) return null;
  const decoded = await verifySessionToken(token);
  if (!decoded) return null;
  return { id: decoded.sub, email: "", role: decoded.role };
}

export async function requireRole(
  role: "CANDIDATE" | "ADMIN",
  request?: NextRequest
): Promise<SessionUser> {
  const auth = await getAuth(request);
  if (!auth) throw new ApiError(401, "Not authenticated");
  if (auth.role !== role) {
    throw new ApiError(403, `Requires ${role.toLowerCase()} access`);
  }
  return auth;
}

export async function requireCandidate(request?: NextRequest): Promise<SessionUser> {
  return requireRole("CANDIDATE", request);
}

export async function requireAdmin(request?: NextRequest): Promise<SessionUser> {
  return requireRole("ADMIN", request);
}

export async function currentUser(request?: NextRequest): Promise<SessionUser> {
  const auth = await getAuth(request);
  if (!auth) throw new ApiError(401, "Not authenticated");
  return auth;
}