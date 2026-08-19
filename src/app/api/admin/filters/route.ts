import { NextRequest } from "next/server";

import { err, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { fetchFilterOptions } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const options = await fetchFilterOptions();
    return ok(options);
  } catch (e) {
    return err(e);
  }
}