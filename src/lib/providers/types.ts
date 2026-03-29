export type GenerateTrackInput = {
  title: string | null;
  prompt: string;
  durationSec: number;
  bpm: number | null;
  key: string | null;
};

export type GenerateTrackOutput = {
  modelProvider: string;
  modelName: string;
  audioPath: string;
  audioMime: string;
  audioDurationSec: number;
};

export type ProviderGenerateResult =
  | { ok: true; output: GenerateTrackOutput }
  | { ok: false; error: string };

export interface MusicGenerationProvider {
  generateTrack(input: GenerateTrackInput): Promise<ProviderGenerateResult>;
}

