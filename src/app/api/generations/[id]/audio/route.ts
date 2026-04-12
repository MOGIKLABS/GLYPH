import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getAudioUrl } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const generation = await prisma.generation.findUnique({
      where: { id },
      select: {
        audioPath: true,
        audioMime: true,
        rights: { select: { status: true } }
      }
    });

    if (!generation?.audioPath) {
      return NextResponse.json({ ok: false, error: "No audio for generation." }, { status: 404 });
    }

    if (generation.rights?.status === "RESTRICTED") {
      return NextResponse.json(
        { ok: false, error: "Audio download restricted due to pending rights review or takedown." },
        { status: 403 }
      );
    }

    const url = await getAudioUrl(generation.audioPath);
    return Response.redirect(url, 302);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
