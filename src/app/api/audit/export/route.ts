import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const events = await prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" }
    });

    // CSV Header
    const rows = [
      ["ID", "Date", "Type", "SubjectType", "SubjectId", "TakedownId", "Details"].join(",")
    ];

    for (const e of events) {
      const escapedDetails = e.detailJson.replace(/"/g, '""');
      rows.push(
        [
          e.id,
          e.createdAt.toISOString(),
          e.type,
          e.subjectType,
          e.subjectId,
          e.takedownId || "",
          `"${escapedDetails}"`
        ].join(",")
      );
    }

    const csvContent = rows.join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit_export_${new Date().toISOString().split("T")[0]}.csv"`
      }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
