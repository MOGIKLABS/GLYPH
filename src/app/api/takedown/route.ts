import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";

const CreateTakedownSchema = z.object({
  claimantName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(200),
  workDescription: z.string().trim().min(10).max(8000),
  basis: z.string().trim().min(10).max(8000),
  generationId: z.string().trim().optional().nullable()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = CreateTakedownSchema.parse(body);

    const takedown = await prisma.takedownNotice.create({
      data: {
        claimantName: input.claimantName,
        contactEmail: input.contactEmail,
        workDescription: input.workDescription,
        basis: input.basis,
        generationId: input.generationId ?? null,
        status: "OPEN"
      }
    });

    await prisma.auditEvent.create({
      data: {
        type: "TAKEDOWN_OPENED",
        subjectType: "TakedownNotice",
        subjectId: takedown.id,
        takedownId: takedown.id,
        detailJson: JSON.stringify({ generationId: input.generationId ?? null })
      }
    });

    if (input.generationId) {
      await prisma.rightsRecord.updateMany({
        where: { generationId: input.generationId },
        data: { status: "RESTRICTED" }
      });
      await prisma.auditEvent.create({
        data: {
          type: "RIGHTS_RESTRICTED",
          subjectType: "Generation",
          subjectId: input.generationId,
          takedownId: takedown.id
        }
      });
    }

    return NextResponse.json({ ok: true, takedownId: takedown.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const takedowns = await prisma.takedownNotice.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        claimantName: true,
        contactEmail: true,
        generationId: true
      }
    });
    return NextResponse.json({ ok: true, takedowns });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

