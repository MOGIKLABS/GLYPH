import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";

function clampInt16(x: number) {
  if (x > 32767) return 32767;
  if (x < -32768) return -32768;
  return x | 0;
}

function writeWavHeader(buffer: Buffer, numSamples: number, sampleRate: number) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
}

async function saveWav(buffer: Buffer, outDir: string) {
  const absDir = resolve(outDir);
  await mkdir(absDir, { recursive: true });
  const filePath = join(absDir, `${randomUUID()}.wav`);
  await writeFile(filePath, buffer);
  return filePath;
}

export type WavWriteFromSamplesOptions = {
  samples: Float32Array;
  sampleRate?: number;
  outDir: string;
};

export async function writeWavFromSamples({
  samples,
  sampleRate = 44100,
  outDir
}: WavWriteFromSamplesOptions) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  writeWavHeader(buffer, numSamples, sampleRate);
  for (let i = 0; i < numSamples; i++) {
    buffer.writeInt16LE(clampInt16(samples[i]! * 32767), 44 + i * 2);
  }
  const filePath = await saveWav(buffer, outDir);
  return { path: filePath, mime: "audio/wav", durationSec: Math.round((numSamples / sampleRate) * 1000) / 1000 };
}

export type WavWriteOptions = {
  durationSec: number;
  sampleRate?: number;
  freqHz?: number;
  outDir: string;
};

export async function writeSineWav({
  durationSec,
  sampleRate = 44100,
  freqHz = 220,
  outDir
}: WavWriteOptions) {
  const dur = Math.max(1, Math.min(durationSec, 30));
  const numSamples = dur * sampleRate;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  writeWavHeader(buffer, numSamples, sampleRate);
  for (let i = 0; i < numSamples; i++) {
    const s16 = clampInt16(Math.sin(2 * Math.PI * freqHz * (i / sampleRate)) * 0.2 * 32767);
    buffer.writeInt16LE(s16, 44 + i * 2);
  }
  const filePath = await saveWav(buffer, outDir);
  return { path: filePath, mime: "audio/wav", durationSec: dur };
}
