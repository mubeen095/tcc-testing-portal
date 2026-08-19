import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/session";
import {
  buildExportRows,
  EXPORT_HEADERS,
  rowsToArrays,
  rowsToSelectedArrays,
  SELECTED_HEADERS,
} from "@/lib/export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildDateStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const format = request.nextUrl.searchParams.get("format") ?? "csv";
    const selectedOnly = request.nextUrl.searchParams.get("selected") === "1";
    const rows = await buildExportRows(selectedOnly ? "SELECTED" : undefined);
    const headers = selectedOnly ? SELECTED_HEADERS : EXPORT_HEADERS;
    const data = selectedOnly ? rowsToSelectedArrays(rows) : rowsToArrays(rows);
    const stamp = buildDateStamp();
    const baseName = selectedOnly
      ? `selected-candidates-${stamp}`
      : `assessment-results-${stamp}`;

    const aoa = [headers, ...data];

    if (format === "xlsx") {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = headers.map((h) => ({ wch: Math.max(12, h.length + 4) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Results");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
        },
      });
    }

    const csv = aoa
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(",")
      )
      .join("\n");

    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Export failed. Check the server logs." },
      { status: 500 }
    );
  }
}