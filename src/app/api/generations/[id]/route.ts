import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const generation = await prisma.generation.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        status: true,
        title: true,
        modelProvider: true,
        modelName: true,
        audioMime: true,
        audioDurationSec: true,
        errorMessage: true
      }
    });
    if (!generation) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      generation: {
        ...generation,
        audioUrl:
          generation.status === "SUCCEEDED" && generation.audioMime
            ? `/api/generations/${generation.id}/audio`
            : null
      }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

