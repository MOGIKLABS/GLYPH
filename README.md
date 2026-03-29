# Glyph

Monochrome web app for music generation with provenance receipts, rights tracking, and notice/takedown workflows aligned to UK CDPA (1988) operational needs.

## Features

- Generation requests create:
  - a provenance receipt (prompt hash, parameters, model/provider metadata)
  - a rights record (commercial-use flag, review status, declared references)
  - audit events for traceability
- Guardrails:
  - blocks prompts containing artist/label terms (DB + env-configured)
  - blocks “in the style of …” phrasing
- Notice/takedown:
  - intake form and listing
  - optional linkage to a generation, which auto-restricts rights
- Providers:
  - mock “Lyria 3” provider that writes a short WAV placeholder locally
  - Google Lyria provider via Vertex AI predict endpoint (requires auth)
  - MusicGen local provider via HTTP (free/open model, self-hosted)
  - MusicGen hosted provider via Replicate (requires Replicate API token)
  - Built-in synth provider (no external services/tokens)
  - ElevenLabs Music provider (requires ElevenLabs API key)

## Local setup

1. Create `.env` from `.env.example`
2. Install dependencies
3. Run Prisma migrate and generate
4. Start the dev server

## Environment variables

- `DATABASE_URL` (SQLite recommended for local)
- `MUSIC_PROVIDER` (`builtin-synth`, `eleven-music`, `mock`, `google-lyria`, `musicgen-local`, or `musicgen-replicate`)
- `STORAGE_DIR` (local path for audio artifacts)
- `BLOCKED_TERMS` (comma-separated list of blocked terms)
- `MUSICGEN_BASE_URL` (only if `MUSIC_PROVIDER=musicgen-local`)
- `REPLICATE_API_TOKEN` (only if `MUSIC_PROVIDER=musicgen-replicate`)
- `ELEVENLABS_API_KEY` (only if `MUSIC_PROVIDER=eleven-music`)
