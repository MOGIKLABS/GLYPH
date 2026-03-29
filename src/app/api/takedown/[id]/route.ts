import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const UpdateTakedownSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "ACTIONED", "REJECTED"])
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const input = UpdateTakedownSchema.parse(body);

    const existing = await prisma.takedownNotice.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.takedownNotice.update({
      where: { id },
      data: { status: input.status }
    });

    await prisma.auditEvent.create({
      data: {
        type: "TAKEDOWN_STATUS_CHANGED",
        subjectType: "TakedownNotice",
        subjectId: id,
        takedownId: id,
        detailJson: JSON.stringify({ oldStatus: existing.status, newStatus: input.status })
      }
    });

    // Auto-trigger actions
    if (existing.generationId) {
      if (input.status === "UNDER_REVIEW" || input.status === "ACTIONED") {
        const rights = await prisma.rightsRecord.findUnique({
          where: { generationId: existing.generationId }
        });
        if (rights && rights.status !== "RESTRICTED") {
          await prisma.rightsRecord.update({
            where: { generationId: existing.generationId },
            data: { status: "RESTRICTED" }
          });
          await prisma.auditEvent.create({
            data: {
              type: "RIGHTS_RESTRICTED",
              subjectType: "Generation",
              subjectId: existing.generationId,
              takedownId: id,
              detailJson: JSON.stringify({ reason: `Takedown status changed to ${input.status}` })
            }
          });
        }
      } else if (input.status === "REJECTED") {
        // Optionally lift restriction if rejected, but we might want to leave that manual.
        // We'll leave it manual for safety.
      }
    }

    return NextResponse.json({ ok: true, takedown: updated });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
