import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

import type {
  GenerateTrackInput,
  MusicGenerationProvider,
  ProviderGenerateResult
} from "@/lib/providers/types";

type MusicGenResponse = {
  audioBase64: string;
  mimeType: string;
  modelName?: string;
  durationSec?: number;
};

function extensionForMime(mime: string) {
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("flac")) return "flac";
  return "bin";
}

export class MusicGenLocalProvider implements MusicGenerationProvider {
  async generateTrack(input: GenerateTrackInput): Promise<ProviderGenerateResult> {
    const baseUrl = process.env.MUSICGEN_BASE_URL;
    if (!baseUrl) {
      return { ok: false, error: "MusicGen is not configured. Set MUSICGEN_BASE_URL." };
    }

    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: input.prompt,
          title: input.title,
          durationSec: input.durationSec,
          bpm: input.bpm,
          key: input.key
        })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: false, error: `MusicGen request failed (${res.status}): ${text || res.statusText}` };
      }

      const json = (await res.json()) as MusicGenResponse;
      const buf = Buffer.from(json.audioBase64, "base64");
      const outDir = process.env.STORAGE_DIR ?? "storage";
      await mkdir(outDir, { recursive: true });
      const ext = extensionForMime(json.mimeType || "application/octet-stream");
      const filename = `${randomUUID()}.${ext}`;
      const path = join(outDir, filename);
      await writeFile(path, buf);

      return {
        ok: true,
        output: {
          modelProvider: "musicgen-local",
          modelName: json.modelName ?? "musicgen",
          audioPath: path,
          audioMime: json.mimeType || "application/octet-stream",
          audioDurationSec: json.durationSec ?? input.durationSec
        }
      };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "MusicGen provider error" };
    }
  }
}

