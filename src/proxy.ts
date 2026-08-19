import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-insecure-secret-change-me-in-production"
);
const COOKIE = process.env.SESSION_COOKIE ?? "tcc_session";

async function getRole(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await getRole(request);

  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      const url = new URL("/login", request.url);
      if (pathname !== "/admin") url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/candidate")) {
    if (role !== "CANDIDATE") {
      const url = new URL("/login", request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/candidate/:path*", "/admin/:path*"],
};