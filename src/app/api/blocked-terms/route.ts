import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";

const TermSchema = z.object({ term: z.string().trim().min(2).max(120) });

export async function GET() {
  try {
    const terms = await prisma.blockedTerm.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, term: true, createdAt: true }
    });
    return NextResponse.json({ ok: true, terms });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = TermSchema.parse(body);
    const created = await prisma.blockedTerm.upsert({
      where: { term: input.term },
      update: {},
      create: { term: input.term },
      select: { id: true, term: true, createdAt: true }
    });
    await prisma.auditEvent.create({
      data: {
        type: "BLOCKED_TERM_ADDED",
        subjectType: "BlockedTerm",
        subjectId: created.id,
        detailJson: JSON.stringify({ term: created.term })
      }
    });
    return NextResponse.json({ ok: true, term: created });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const input = TermSchema.parse(body);
    const deleted = await prisma.blockedTerm.delete({ where: { term: input.term } });
    await prisma.auditEvent.create({
      data: {
        type: "BLOCKED_TERM_REMOVED",
        subjectType: "BlockedTerm",
        subjectId: deleted.id,
        detailJson: JSON.stringify({ term: deleted.term })
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

