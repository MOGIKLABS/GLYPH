import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

import type {
  GenerateTrackInput,
  MusicGenerationProvider,
  ProviderGenerateResult
} from "@/lib/providers/types";

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: unknown;
  error?: unknown;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extensionFromUrl(url: string) {
  const u = url.split("?")[0] ?? url;
  const ext = u.split(".").pop()?.toLowerCase();
  if (!ext) return "bin";
  if (["wav", "mp3", "ogg", "flac", "m4a"].includes(ext)) return ext;
  return "bin";
}

export class ReplicateMusicGenProvider implements MusicGenerationProvider {
  async generateTrack(input: GenerateTrackInput): Promise<ProviderGenerateResult> {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return { ok: false, error: "Replicate is not configured. Set REPLICATE_API_TOKEN." };
    }

    const model = process.env.REPLICATE_MUSICGEN_MODEL ?? "meta/musicgen";
    const version = process.env.REPLICATE_MUSICGEN_VERSION ?? "";
    const seconds = Math.max(5, Math.min(input.durationSec, 120));

    try {
      const createBody: Record<string, unknown> = {
        input: {
          prompt: input.prompt,
          duration: seconds
        }
      };

      if (version) createBody.version = version;
      else createBody.model = model;

      const createRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          authorization: `Token ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(createBody)
      });

      if (!createRes.ok) {
        const text = await createRes.text().catch(() => "");
        return {
          ok: false,
          error: `Replicate request failed (${createRes.status}): ${text || createRes.statusText}`
        };
      }

      let pred = (await createRes.json()) as ReplicatePrediction;
      const startedAt = Date.now();
      const timeoutMs = 180_000;

      while (pred.status === "starting" || pred.status === "processing") {
        if (Date.now() - startedAt > timeoutMs) {
          return { ok: false, error: "Replicate generation timed out." };
        }
        await sleep(1500);
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
          headers: { authorization: `Token ${token}` }
        });
        if (!pollRes.ok) {
          const text = await pollRes.text().catch(() => "");
          return {
            ok: false,
            error: `Replicate poll failed (${pollRes.status}): ${text || pollRes.statusText}`
          };
        }
        pred = (await pollRes.json()) as ReplicatePrediction;
      }

      if (pred.status !== "succeeded") {
        const msg =
          typeof pred.error === "string"
            ? pred.error
            : pred.error
              ? JSON.stringify(pred.error)
              : "Replicate generation failed.";
        return { ok: false, error: msg };
      }

      const out = pred.output;
      const url =
        typeof out === "string"
          ? out
          : Array.isArray(out) && typeof out[0] === "string"
            ? (out[0] as string)
            : null;

      if (!url) return { ok: false, error: "Replicate returned no audio URL." };

      const audioRes = await fetch(url);
      if (!audioRes.ok) {
        const text = await audioRes.text().catch(() => "");
        return {
          ok: false,
          error: `Failed to download audio (${audioRes.status}): ${text || audioRes.statusText}`
        };
      }

      const mime = audioRes.headers.get("content-type") || "application/octet-stream";
      const buf = Buffer.from(await audioRes.arrayBuffer());

      const outDir = process.env.STORAGE_DIR ?? "storage";
      await mkdir(outDir, { recursive: true });
      const filename = `${randomUUID()}.${extensionFromUrl(url)}`;
      const path = join(outDir, filename);
      await writeFile(path, buf);

      return {
        ok: true,
        output: {
          modelProvider: "replicate",
          modelName: `musicgen:${version ? "version" : model}`,
          audioPath: path,
          audioMime: mime,
          audioDurationSec: seconds
        }
      };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "Replicate provider error" };
    }
  }
}

