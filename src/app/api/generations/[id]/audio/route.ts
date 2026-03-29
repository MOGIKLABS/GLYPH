import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import { Readable } from "stream";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  req: Request,
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

    if (!generation?.audioPath || !generation.audioMime) {
      return NextResponse.json({ ok: false, error: "No audio for generation." }, { status: 404 });
    }

    if (generation.rights?.status === "RESTRICTED") {
      return NextResponse.json(
        { ok: false, error: "Audio download restricted due to pending rights review or takedown." },
        { status: 403 }
      );
    }

    const mime = generation.audioMime.split(";")[0]?.trim() || generation.audioMime;
    const fileStat = await stat(generation.audioPath);
    const size = fileStat.size;
    const range = req.headers.get("range");

    if (!range) {
      const nodeStream = createReadStream(generation.audioPath);
      const stream = Readable.toWeb(nodeStream) as ReadableStream;
      return new Response(stream, {
        status: 200,
        headers: {
          "content-type": mime,
          "content-length": String(size),
          "accept-ranges": "bytes",
          "cache-control": "no-store"
        }
      });
    }

    const match = /^bytes=(\d+)-(\d+)?$/.exec(range);
    if (!match) {
      return NextResponse.json({ ok: false, error: "Invalid Range header." }, { status: 416 });
    }

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start >= size || end < start) {
      return NextResponse.json({ ok: false, error: "Invalid range." }, { status: 416 });
    }

    const nodeStream = createReadStream(generation.audioPath, { start, end });
    const stream = Readable.toWeb(nodeStream) as ReadableStream;
    const chunkSize = end - start + 1;

    return new Response(stream, {
      status: 206,
      headers: {
        "content-type": mime,
        "content-length": String(chunkSize),
        "content-range": `bytes ${start}-${end}/${size}`,
        "accept-ranges": "bytes",
        "cache-control": "no-store"
      }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
