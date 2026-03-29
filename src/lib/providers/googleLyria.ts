import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

import type {
  GenerateTrackInput,
  MusicGenerationProvider,
  ProviderGenerateResult
} from "@/lib/providers/types";

type VertexPredictResponse = {
  predictions: Array<{
    audioBase64: string;
    mimeType: string;
    modelName?: string;
    durationSec?: number;
  }>;
};

export class GoogleLyriaProvider implements MusicGenerationProvider {
  async generateTrack(input: GenerateTrackInput): Promise<ProviderGenerateResult> {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION ?? "us-central1";
    const accessToken = process.env.GCP_ACCESS_TOKEN;
    
    if (!projectId || !accessToken) {
      return { ok: false, error: "Lyria Vertex AI is not configured. Set GCP_PROJECT_ID and GCP_ACCESS_TOKEN." };
    }

    // Defaulting to "lyria-3" but the exact model name might differ based on Vertex AI availability
    const modelId = "lyria-3";
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: input.prompt,
              title: input.title,
              durationSec: input.durationSec,
              bpm: input.bpm,
              key: input.key
            }
          ],
          parameters: {
            sampleCount: 1
          }
        })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: false, error: `Lyria Vertex request failed (${res.status}): ${text || res.statusText}` };
      }

      const json = (await res.json()) as VertexPredictResponse;
      const prediction = json.predictions?.[0];
      if (!prediction || !prediction.audioBase64) {
         return { ok: false, error: "No audio generated from Vertex endpoint." };
      }

      const buf = Buffer.from(prediction.audioBase64, "base64");
      const outDir = process.env.STORAGE_DIR ?? "storage";
      await mkdir(outDir, { recursive: true });
      const filename = `${randomUUID()}.bin`;
      const path = join(outDir, filename);
      await writeFile(path, buf);

      return {
        ok: true,
        output: {
          modelProvider: "google-vertex",
          modelName: prediction.modelName ?? modelId,
          audioPath: path,
          audioMime: prediction.mimeType || "audio/wav",
          audioDurationSec: prediction.durationSec ?? input.durationSec
        }
      };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "Lyria provider error" };
    }
  }
}
