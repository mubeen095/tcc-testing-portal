import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function err(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json(
      { error: e.message },
      { status: e.status }
    );
  }
  if (e instanceof Error) {
    console.error("[api error]", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}

export function unauthorized(message = "Not authenticated") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Not authorized") {
  return NextResponse.json({ error: message }, { status: 403 });
}