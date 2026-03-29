import { writeWavFromSamples } from "@/lib/audio/wav";
import type { GenerateTrackInput, MusicGenerationProvider, ProviderGenerateResult } from "@/lib/providers/types";

function hzFromKey(key: string | null) {
  if (!key) return 110;
  const k = key.trim().toLowerCase();
  const map: Record<string, number> = {
    "c": 130.81, "c#": 138.59, "db": 138.59,
    "d": 146.83, "d#": 155.56, "eb": 155.56,
    "e": 164.81, "f": 174.61, "f#": 185.0,
    "gb": 185.0, "g": 196.0, "g#": 207.65,
    "ab": 207.65, "a": 220.0, "a#": 233.08,
    "bb": 233.08, "b": 246.94
  };
  const match = /^([a-g](?:#|b)?)/.exec(k)?.[1];
  return match ? (map[match] ?? 110) / 2 : 110;
}

function clampSample(x: number) {
  if (x > 1) return 1;
  if (x < -1) return -1;
  return x;
}

function envADSR(t: number, a: number, d: number, s: number, r: number, total: number) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  const td = t - a;
  if (td < d) return 1 - (1 - s) * (td / d);
  const tr = total - r;
  if (t < tr) return s;
  const rr = t - tr;
  if (rr >= r) return 0;
  return s * (1 - rr / r);
}

export class BuiltinSynthProvider implements MusicGenerationProvider {
  async generateTrack(input: GenerateTrackInput): Promise<ProviderGenerateResult> {
    try {
      const outDir = process.env.STORAGE_DIR ?? "storage";
      const sampleRate = 44100;
      const dur = Math.max(10, Math.min(input.durationSec, 180));
      const totalSamples = dur * sampleRate;
      const bpm = input.bpm ?? 120;
      const beatSec = 60 / bpm;
      const baseHz = hzFromKey(input.key);

      const samples = new Float32Array(totalSamples);

      const kickDecay = 0.16;
      const snareDecay = 0.12;
      const hatDecay = 0.05;

      let noiseSeed = 1337;
      const rand = () => {
        noiseSeed = (noiseSeed * 1664525 + 1013904223) % 4294967296;
        return noiseSeed / 4294967296;
      };

      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const beat = t / beatSec;
        const beatInBar = beat % 4;

        // Kick on beats 1 and 3 (beatInBar 0 and 2)
        const kickTrig = beatInBar < 0.02 || (beatInBar >= 2 && beatInBar < 2.02);
        const snareTrig = (beatInBar > 1 && beatInBar < 1.02) || (beatInBar > 3 && beatInBar < 3.02);
        // Hi-hat on every 8th note (every 0.5 beats)
        const hatTrig = (beat % 0.5) < (hatDecay * 3 / beatSec);

        const kickT = (beatInBar % 2) * beatSec;
        const snareT = ((beatInBar + 3) % 2) * beatSec;
        const hatT = (beat % 0.5) * beatSec;

        const kickEnv = kickTrig ? Math.exp(-kickT / kickDecay) : 0;
        const kickFreq = 90 + 70 * Math.exp(-kickT / 0.06);
        const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.6;

        const snareEnv = snareTrig ? Math.exp(-snareT / snareDecay) : 0;
        const snare = (rand() * 2 - 1) * snareEnv * 0.35 + Math.sin(2 * Math.PI * 180 * t) * snareEnv * 0.12;

        const hatEnv = hatTrig ? Math.exp(-hatT / hatDecay) : 0;
        const hat = (rand() * 2 - 1) * hatEnv * 0.12;

        const bar = Math.floor(beat / 4);
        const chordStep = bar % 4;
        const bassPattern = [0, 5, 7, 3];
        const semis = bassPattern[chordStep] ?? 0;
        const bassHz = baseHz * Math.pow(2, semis / 12);
        const bassEnv = envADSR(t % beatSec, 0.01, 0.12, 0.55, 0.08, beatSec);
        const bass = Math.sin(2 * Math.PI * bassHz * t) * bassEnv * 0.28;

        samples[i] = clampSample(kick + snare + hat + bass);
      }

      const wav = await writeWavFromSamples({ samples, sampleRate, outDir });
      return {
        ok: true,
        output: {
          modelProvider: "builtin-synth",
          modelName: "glyph-synth-v1",
          audioPath: wav.path,
          audioMime: wav.mime,
          audioDurationSec: Math.round(dur)
        }
      };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "Builtin synth error" };
    }
  }
}
