import { writeSineWav } from "@/lib/audio/wav";
import type {
  GenerateTrackInput,
  MusicGenerationProvider,
  ProviderGenerateResult
} from "@/lib/providers/types";

export class MockLyriaProvider implements MusicGenerationProvider {
  async generateTrack(input: GenerateTrackInput): Promise<ProviderGenerateResult> {
    try {
      const outDir = process.env.STORAGE_DIR ?? "storage";
      const base = input.bpm ? Math.min(880, Math.max(110, input.bpm * 2)) : 220;
      const wav = await writeSineWav({ durationSec: input.durationSec, freqHz: base, outDir });
      return {
        ok: true,
        output: {
          modelProvider: "mock",
          modelName: "lyria-3-mock",
          audioPath: wav.path,
          audioMime: wav.mime,
          audioDurationSec: wav.durationSec
        }
      };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "Mock provider error" };
    }
  }
}
