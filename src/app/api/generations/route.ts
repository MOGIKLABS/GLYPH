import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { sha256Hex, sha256FileHex } from "@/lib/crypto/hash";
import { checkPromptForBlockedTerms } from "@/lib/guardrails/prompt";
import { serializeStyleRefs } from "@/lib/records/styleRefs";
import { getMusicProvider } from "@/lib/providers";

const CreateGenerationSchema = z.object({
  title: z.string().trim().max(120).optional().nullable(),
  prompt: z.string().trim().min(10).max(4000),
  durationSec: z.number().int().min(10).max(600),
  bpm: z.number().int().min(40).max(220).optional().nullable(),
  key: z.string().trim().max(40).optional().nullable(),
  commercialUse: z.boolean().optional().default(true),
  effects: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(40),
        enabled: z.boolean(),
        amount: z.number().int().min(0).max(100)
      })
    )
    .optional()
    .default([]),
  declaredStyleReferences: z.array(z.string().trim().max(80)).optional().default([])
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = CreateGenerationSchema.parse(body);

    const promptCheck = await checkPromptForBlockedTerms(input.prompt);
    const promptHash = sha256Hex(input.prompt);
    const paramsJson = JSON.stringify({
      title: input.title ?? null,
      durationSec: input.durationSec,
      bpm: input.bpm ?? null,
      key: input.key ?? null,
      commercialUse: input.commercialUse,
      effects: input.effects,
      declaredStyleReferences: input.declaredStyleReferences
    });

    const declaredStyleRefs = serializeStyleRefs(input.declaredStyleReferences);

    const provider = getMusicProvider();
    const intendedProvider = process.env.MUSIC_PROVIDER ?? "mock";
    const intendedModelName =
      intendedProvider === "mock"
        ? "lyria-3-mock"
        : intendedProvider === "builtin-synth"
          ? "glyph-synth-v1"
        : intendedProvider === "eleven-music"
          ? "music_v1"
        : intendedProvider === "musicgen-local"
          ? "musicgen"
          : intendedProvider === "musicgen-replicate"
            ? "musicgen"
            : intendedProvider === "google-lyria"
              ? "lyria-3"
              : "unknown";

    const generation = await prisma.generation.create({
      data: {
        title: input.title ?? null,
        prompt: input.prompt,
        durationSecRequested: input.durationSec,
        bpm: input.bpm ?? null,
        key: input.key ?? null,
        commercialUse: input.commercialUse,
        declaredStyleRefs,
        modelProvider: intendedProvider,
        modelName: intendedModelName,
        status: promptCheck.ok ? "RUNNING" : "REJECTED"
      }
    });

    const receipt = await prisma.receipt.create({
      data: {
        generationId: generation.id,
        modelProvider: intendedProvider,
        modelName: intendedModelName,
        promptHash,
        outputHash: null,
        paramsJson
      }
    });

    await prisma.rightsRecord.create({
      data: {
        generationId: generation.id,
        commercialUse: input.commercialUse,
        declaredStyleRefs,
        status: promptCheck.ok ? "DRAFT" : "RESTRICTED",
        licenseNotes: ""
      }
    });

    if (!promptCheck.ok) {
      await prisma.auditEvent.create({
        data: {
          type: "GUARDRAIL_REJECTED",
          subjectType: "Generation",
          subjectId: generation.id,
          detailJson: JSON.stringify(promptCheck)
        }
      });
      return NextResponse.json(
        { ok: false, error: promptCheck.reason },
        { status: 400 }
      );
    }

    await prisma.auditEvent.create({
      data: {
        type: "GENERATION_STARTED",
        subjectType: "Generation",
        subjectId: generation.id
      }
    });

    const result = await provider.generateTrack({
      title: input.title ?? null,
      prompt: input.prompt,
      durationSec: input.durationSec,
      bpm: input.bpm ?? null,
      key: input.key ?? null
    });

    if (!result.ok) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: { status: "FAILED", errorMessage: result.error }
      });
      await prisma.auditEvent.create({
        data: {
          type: "GENERATION_FAILED",
          subjectType: "Generation",
          subjectId: generation.id,
          detailJson: JSON.stringify({ error: result.error })
        }
      });
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    const outputHash = await sha256FileHex(result.output.audioPath);
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "SUCCEEDED",
        modelProvider: result.output.modelProvider,
        modelName: result.output.modelName,
        audioPath: result.output.audioPath,
        audioMime: result.output.audioMime,
        audioDurationSec: result.output.audioDurationSec
      }
    });
    await prisma.receipt.update({ where: { id: receipt.id }, data: { outputHash } });
    await prisma.auditEvent.create({
      data: {
        type: "GENERATION_SUCCEEDED",
        subjectType: "Generation",
        subjectId: generation.id,
        detailJson: JSON.stringify({
          audioPath: result.output.audioPath,
          outputHash
        })
      }
    });

    return NextResponse.json({ ok: true, generationId: generation.id, receiptId: receipt.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
