import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { deserializeStyleRefs } from "@/lib/records/styleRefs";

const UpdateRightsSchema = z.object({
  generationId: z.string().trim().min(1),
  commercialUse: z.boolean().optional(),
  status: z.enum(["DRAFT", "CLEARED", "RESTRICTED"]).optional(),
  licenseNotes: z.string().trim().max(8000).optional()
});

export async function GET() {
  try {
    const rights = await prisma.rightsRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        generationId: true,
        commercialUse: true,
        status: true,
        declaredStyleRefs: true,
        licenseNotes: true
      }
    });

    return NextResponse.json({
      ok: true,
      rights: rights.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        generationId: r.generationId,
        commercialUse: r.commercialUse,
        status: r.status,
        licenseNotes: r.licenseNotes,
        declaredStyleReferences: deserializeStyleRefs(r.declaredStyleRefs)
      }))
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const input = UpdateRightsSchema.parse(body);
    const updated = await prisma.rightsRecord.update({
      where: { generationId: input.generationId },
      data: {
        commercialUse: input.commercialUse,
        status: input.status,
        licenseNotes: input.licenseNotes
      },
      select: {
        id: true,
        createdAt: true,
        generationId: true,
        commercialUse: true,
        status: true,
        declaredStyleRefs: true,
        licenseNotes: true
      }
    });

    await prisma.auditEvent.create({
      data: {
        type: "RIGHTS_UPDATED",
        subjectType: "Generation",
        subjectId: input.generationId,
        detailJson: JSON.stringify({
          commercialUse: input.commercialUse,
          status: input.status
        })
      }
    });

    return NextResponse.json({
      ok: true,
      rights: {
        id: updated.id,
        createdAt: updated.createdAt,
        generationId: updated.generationId,
        commercialUse: updated.commercialUse,
        status: updated.status,
        licenseNotes: updated.licenseNotes,
        declaredStyleReferences: deserializeStyleRefs(updated.declaredStyleRefs)
      }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
