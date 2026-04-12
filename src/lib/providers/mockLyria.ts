import { buildSineWavBuffer } from "@/lib/audio/wav";
import { uploadAudio } from "@/lib/storage";
import type { GenerateTrackInput, MusicGenerationProvider, ProviderGenerateResult } from "@/lib/providers/types";

export class MockLyriaProvider implements MusicGenerationProvider {
  async generateTrack(input: GenerateTrackInput): Promise<ProviderGenerateResult> {
    try {
      const base = input.bpm ? Math.min(880, Math.max(110, input.bpm * 2)) : 220;
      const { buf, durationSec } = buildSineWavBuffer(input.durationSec, 44100, base);
      const key = await uploadAudio(buf, "audio/wav", "wav");
      return {
        ok: true,
        output: {
          modelProvider: "mock",
          modelName: "lyria-3-mock",
          audioPath: key,
          audioMime: "audio/wav",
          audioDurationSec: durationSec
        }
      };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "Mock provider error" };
    }
  }
}
