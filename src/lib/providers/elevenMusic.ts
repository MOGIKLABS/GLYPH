import { uploadAudio } from "@/lib/storage";
import type {
  GenerateTrackInput,
  MusicGenerationProvider,
  ProviderGenerateResult
} from "@/lib/providers/types";

function sanitizeMime(mime: string) {
  return mime.split(";")[0]?.trim() || mime;
}

function parseMultipartBoundary(contentType: string) {
  const m = /boundary="?([^";]+)"?/i.exec(contentType);
  return m?.[1] ?? null;
}

function extractAudioFromMultipart(body: Buffer, boundary: string) {
  const boundaryMarker = Buffer.from(`--${boundary}`);
  const endMarker = Buffer.from(`--${boundary}--`);
  let idx = body.indexOf(boundaryMarker);
  const parts: Array<{ headers: string; content: Buffer }> = [];

  while (idx !== -1) {
    if (body.indexOf(endMarker, idx) === idx) break;
    let start = idx + boundaryMarker.length;
    if (body[start] === 45 && body[start + 1] === 45) break;
    if (body[start] === 13 && body[start + 1] === 10) start += 2;

    const next = body.indexOf(boundaryMarker, start);
    if (next === -1) break;
    const chunk = body.slice(start, next);
    const headerEnd = chunk.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const headers = chunk.slice(0, headerEnd).toString("utf8");
      let content = chunk.slice(headerEnd + 4);
      if (content.length >= 2 && content[content.length - 2] === 13 && content[content.length - 1] === 10) {
        content = content.slice(0, -2);
      }
      parts.push({ headers, content });
    }
    idx = next;
  }

  for (const p of parts) {
    const ct = /content-type:\s*([^\r\n;]+)/i.exec(p.headers)?.[1]?.trim();
    if (ct && ct.startsWith("audio/")) return { mime: ct, buf: p.content };
  }
  for (const p of parts) {
    const ct = /content-type:\s*([^\r\n;]+)/i.exec(p.headers)?.[1]?.trim();
    const hasFilename = /filename=/i.test(p.headers);
    if (hasFilename && (ct === "application/octet-stream" || !ct)) {
      return { mime: "application/octet-stream", buf: p.content };
    }
  }
  return null;
}

export class ElevenMusicProvider implements MusicGenerationProvider {
  async generateTrack(input: GenerateTrackInput): Promise<ProviderGenerateResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const baseUrl = (process.env.ELEVENLABS_BASE_URL ?? "https://api.elevenlabs.io").replace(/\/$/, "");

    if (!apiKey) {
      return { ok: false, error: "ElevenLabs is not configured. Set ELEVENLABS_API_KEY." };
    }

    const seconds = Math.max(3, Math.min(input.durationSec, 300));
    const musicLengthMs = seconds * 1000;
    const modelId = process.env.ELEVEN_MUSIC_MODEL_ID ?? "music_v1";
    const outputFormat = process.env.ELEVEN_MUSIC_OUTPUT_FORMAT ?? "mp3_44100_128";
    const forceInstrumental = (process.env.ELEVEN_MUSIC_FORCE_INSTRUMENTAL ?? "false") === "true";

    try {
      const res = await fetch(`${baseUrl}/v1/music/compose`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "xi-api-key": apiKey
        },
        body: JSON.stringify({
          prompt: input.prompt,
          music_length_ms: musicLengthMs,
          model_id: modelId,
          output_format: outputFormat,
          force_instrumental: forceInstrumental
        })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          ok: false,
          error: `ElevenLabs Music request failed (${res.status}): ${text || res.statusText}`
        };
      }

      const contentType = res.headers.get("content-type") || "application/octet-stream";
      const raw = Buffer.from(await res.arrayBuffer());
      let mime = sanitizeMime(contentType);
      let buf = raw;

      if (contentType.toLowerCase().startsWith("multipart/")) {
        const boundary = parseMultipartBoundary(contentType);
        if (!boundary) {
          return { ok: false, error: "ElevenLabs response is multipart but boundary is missing." };
        }
        const extracted = extractAudioFromMultipart(raw, boundary);
        if (!extracted) {
          return { ok: false, error: "Failed to extract audio from ElevenLabs multipart response." };
        }
        mime = sanitizeMime(extracted.mime);
        buf = Buffer.from(extracted.buf);
      }

      if (!mime.startsWith("audio/")) {
        mime = outputFormat.startsWith("wav") ? "audio/wav" : "audio/mpeg";
      }

      const ext = mime.includes("wav") ? "wav" : mime.includes("mpeg") ? "mp3" : "bin";
      const key = await uploadAudio(buf, mime, ext);

      return {
        ok: true,
        output: {
          modelProvider: "elevenlabs",
          modelName: modelId,
          audioPath: key,
          audioMime: mime,
          audioDurationSec: seconds
        }
      };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "ElevenLabs provider error" };
    }
  }
}
