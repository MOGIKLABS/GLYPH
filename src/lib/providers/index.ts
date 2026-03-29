import { GoogleLyriaProvider } from "@/lib/providers/googleLyria";
import { BuiltinSynthProvider } from "@/lib/providers/builtinSynth";
import { ElevenMusicProvider } from "@/lib/providers/elevenMusic";
import { MockLyriaProvider } from "@/lib/providers/mockLyria";
import { MusicGenLocalProvider } from "@/lib/providers/musicgenLocal";
import { ReplicateMusicGenProvider } from "@/lib/providers/replicateMusicgen";
import type { MusicGenerationProvider } from "@/lib/providers/types";

export function getMusicProvider(): MusicGenerationProvider {
  const provider = process.env.MUSIC_PROVIDER ?? "mock";
  if (provider === "builtin-synth") return new BuiltinSynthProvider();
  if (provider === "eleven-music") return new ElevenMusicProvider();
  if (provider === "google-lyria") return new GoogleLyriaProvider();
  if (provider === "musicgen-replicate") return new ReplicateMusicGenProvider();
  if (provider === "musicgen-local") return new MusicGenLocalProvider();
  if (provider === "mock") return new MockLyriaProvider();
  return new MockLyriaProvider();
}
