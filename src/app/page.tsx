"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StitchPlayer } from "@/components/chrome/stitchPlayer";
import type { EffectState } from "@/components/synth/synthPanel";

type GenerationCreateResponse =
  | { ok: true; generationId: string; receiptId: string }
  | { ok: false; error: string };

type GenerationDetailResponse =
  | {
      ok: true;
      generation: {
        id: string;
        createdAt: string;
        status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "REJECTED";
        modelProvider: string;
        modelName: string;
        audioMime: string | null;
        audioUrl: string | null;
        audioDurationSec: number | null;
        errorMessage: string | null;
      };
    }
  | { ok: false; error: string };

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [durationSec, setDurationSec] = useState(120);
  const [bpm, setBpm] = useState<number | "">("");
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [commercialUse, setCommercialUse] = useState(true);
  const [artistOrStyleNames, setArtistOrStyleNames] = useState("");
  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "submitting" }
    | { state: "done"; generationId: string; receiptId: string }
    | { state: "error"; message: string }
  >({ state: "idle" });
  const [generationDetail, setGenerationDetail] = useState<GenerationDetailResponse | null>(null);
  const [audioLoadError, setAudioLoadError] = useState(false);
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [effects, setEffects] = useState<EffectState>({
    reverb: { enabled: false, amount: 35 },
    delay: { enabled: false, amount: 25 },
    distortion: { enabled: false, amount: 20 },
    chorus: { enabled: false, amount: 30 }
  });
  const [activePane, setActivePane] = useState<"generator" | "synth" | "pedalboard" | "console">(
    "generator"
  );
  const [panelOpen, setPanelOpen] = useState(false);

  function pushLine(line: string) {
    const ts = new Date().toLocaleTimeString();
    setConsoleLines((prev) => [...prev, `${ts} ${line}`].slice(-50));
  }

  const riskPreview = useMemo(() => {
    const style = artistOrStyleNames.trim();
    if (!style) return null;
    return "This will be stored as a declared reference for rights-risk review and may trigger guardrails.";
  }, [artistOrStyleNames]);

  useEffect(() => {
    if (status.state !== "done") return;
    setGenerationDetail(null);
    setAudioLoadError(false);
    pushLine(`generation ${status.generationId}: loading details`);
    fetch(`/api/generations/${status.generationId}`)
      .then((r) => r.json())
      .then((j: GenerationDetailResponse) => {
        setGenerationDetail(j);
        if (j.ok) {
          pushLine(`generation ${j.generation.id}: ${j.generation.status}`);
          if (j.generation.audioUrl) pushLine(`audio ready: ${j.generation.audioUrl}`);
        } else {
          pushLine(`generation detail error: ${j.error}`);
        }
      })
      .catch(() => {
        setGenerationDetail({ ok: false, error: "Failed to load generation." });
        pushLine("generation detail error: failed to load");
      });
  }, [status]);

  async function submit() {
    setStatus({ state: "submitting" });
    pushLine("submit: POST /api/generations");
    const res = await fetch("/api/generations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        prompt,
        durationSec,
        bpm: bpm === "" ? null : bpm,
        key,
        commercialUse,
        effects: Object.entries(effects).map(([name, v]) => ({
          name,
          enabled: v.enabled,
          amount: v.amount
        })),
        declaredStyleReferences: artistOrStyleNames
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      })
    });
    const json = (await res.json()) as GenerationCreateResponse;
    if (!json.ok) {
      setStatus({ state: "error", message: json.error });
      pushLine(`submit error: ${json.error}`);
      return;
    }
    pushLine(`submit ok: generation=${json.generationId} receipt=${json.receiptId}`);
    setStatus({ state: "done", generationId: json.generationId, receiptId: json.receiptId });
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="player-shell glass-border rounded-[48px] p-6 md:p-7">
        <StitchPlayer
          activePane={activePane}
          setActivePane={setActivePane}
          title="GLYPH"
          subtitle="music generator"
          statusLabel={
            generationDetail?.ok
              ? `${generationDetail.generation.status} • ${generationDetail.generation.modelProvider}`
              : status.state === "submitting"
                ? "SUBMITTING"
                : "READY"
          }
          progress={status.state === "submitting" ? 0.35 : status.state === "done" ? 0.78 : 0.12}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="player-screen glass-border rounded-[40px] p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon name="spark" className="h-5 w-5 text-chrome1" />
                  <div className="text-sm font-semibold tracking-wide">Generate a Track</div>
                </div>
                <div className="text-sm text-muted">
                  Every request creates a provenance receipt and rights record by default.
                </div>
              </div>
              <div className="flex items-center gap-2">
                {generationDetail?.ok ? (
                  <Badge variant="solid">{generationDetail.generation.status}</Badge>
                ) : (
                  <Badge>Ready</Badge>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <div className="text-xs text-muted">Title</div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-xs text-muted">Prompt</div>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe instrumentation, mood, structure, and mix characteristics."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <div className="text-xs text-muted">Duration (sec)</div>
                  <Input
                    type="number"
                    min={10}
                    max={600}
                    value={durationSec}
                    onChange={(e) => setDurationSec(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="text-xs text-muted">BPM</div>
                  <Input
                    type="number"
                    min={40}
                    max={220}
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="—"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="text-xs text-muted">Key</div>
                  <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. A minor"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs text-muted">Declared style references</div>
                <Input
                  value={artistOrStyleNames}
                  onChange={(e) => setArtistOrStyleNames(e.target.value)}
                  placeholder="e.g. 90s trip-hop, cinematic noir"
                />
                {riskPreview ? <div className="text-xs text-muted">{riskPreview}</div> : null}
              </div>

              <label className="glass-border flex items-center justify-between gap-3 rounded-2xl bg-[hsl(var(--panel)/0.35)] p-4">
                <div className="grid gap-0.5">
                  <div className="text-sm font-semibold">Commercial use intended</div>
                  <div className="text-xs text-muted">Stored as a licensing flag.</div>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[hsl(var(--accent))]"
                  checked={commercialUse}
                  onChange={(e) => setCommercialUse(e.target.checked)}
                />
              </label>

              <div className="glass-border chrome-panel flex flex-wrap items-center justify-between gap-3 rounded-[32px] p-4">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Icon name="play" className="h-5 w-5 text-chrome2" />
                  <div className="font-mono text-xs">
                    {status.state === "done" ? status.generationId : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={submit}
                    disabled={status.state === "submitting" || prompt.trim().length < 10}
                  >
                    <Icon name="spark" />
                    {status.state === "submitting" ? "Submitting…" : "Generate"}
                  </Button>
                  {status.state === "error" ? (
                    <div className="text-sm text-muted">{status.message}</div>
                  ) : null}
                </div>
              </div>

              <div className="glass-border rounded-[32px] bg-[hsl(var(--panel)/0.25)] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold tracking-wide">Receipt</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="solid">
                      {generationDetail?.ok ? generationDetail.generation.modelProvider : "—"}
                    </Badge>
                    <Badge>{generationDetail?.ok ? generationDetail.generation.modelName : "—"}</Badge>
                  </div>
                </div>

                {status.state === "done" ? (
                  <div className="mt-3 grid gap-3">
                    <div className="grid gap-1 text-xs text-muted">
                      <div className="flex items-center justify-between">
                        <div>Generation</div>
                        <div className="font-mono">{status.generationId}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>Receipt</div>
                        <div className="font-mono">{status.receiptId}</div>
                      </div>
                    </div>
                    {generationDetail?.ok && generationDetail.generation.audioUrl ? (
                      <div className="space-y-2">
                        <audio
                          key={generationDetail.generation.id}
                          className="w-full"
                          controls
                          preload="metadata"
                          src={generationDetail.generation.audioUrl}
                          onError={() => {
                            setAudioLoadError(true);
                            pushLine("audio element error");
                          }}
                        />
                        {audioLoadError ? (
                          <a
                            className="text-xs text-muted underline underline-offset-4"
                            href={generationDetail.generation.audioUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open audio URL
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-xs text-muted">Audio will appear here when generation succeeds.</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-muted">Submit a request to generate a receipt.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {activePane === "generator" ? (
              <Card className="space-y-3">
                <div className="space-y-1">
                  <CardTitle>Generator</CardTitle>
                  <CardDescription>Generate a track using the current prompt and controls.</CardDescription>
                </div>
                <div className="text-sm text-muted">
                  Use the big “Generate” button in the main screen.
                </div>
              </Card>
            ) : null}

            {activePane === "synth" ? (
              <Card className="space-y-4">
                <div className="space-y-1">
                  <CardTitle>Synth</CardTitle>
                  <CardDescription>Adjust BPM and duration.</CardDescription>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-border bg-[hsl(var(--panel)/0.35)] p-4">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <div>BPM</div>
                      <div className="font-mono">{bpm === "" ? "—" : bpm}</div>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={220}
                      value={bpm === "" ? 120 : bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="mt-3 w-full accent-[hsl(var(--accent))]"
                    />
                  </div>
                  <div className="rounded-2xl border border-border bg-[hsl(var(--panel)/0.35)] p-4">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <div>Duration</div>
                      <div className="font-mono">{durationSec}s</div>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={600}
                      value={durationSec}
                      onChange={(e) => setDurationSec(Number(e.target.value))}
                      className="mt-3 w-full accent-[hsl(var(--accent))]"
                    />
                  </div>
                </div>
              </Card>
            ) : null}

            {activePane === "pedalboard" ? (
              <Card className="space-y-2">
                <div className="space-y-1">
                  <CardTitle>Pedalboard</CardTitle>
                  <CardDescription>Toggle effects and adjust amounts.</CardDescription>
                </div>
                <div className="grid gap-3">
                  {(["reverb", "delay", "distortion", "chorus"] as const).map((name) => (
                    <div
                      key={name}
                      className={`glass-border rounded-2xl p-4 ${
                        effects[name].enabled ? "bg-[hsl(var(--panel)/0.55)]" : "bg-[hsl(var(--panel)/0.25)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold uppercase tracking-wide">{name}</div>
                        <button
                          type="button"
                          className={`glass-border h-9 rounded-2xl px-4 text-xs font-semibold tracking-wide ${
                            effects[name].enabled
                              ? "bubble-btn text-[hsl(var(--bg))]"
                              : "bg-[hsl(var(--panel)/0.45)] text-fg"
                          }`}
                          onClick={() =>
                            setEffects((prev) => ({
                              ...prev,
                              [name]: { ...prev[name], enabled: !prev[name].enabled }
                            }))
                          }
                        >
                          {effects[name].enabled ? "ON" : "OFF"}
                        </button>
                      </div>
                      <div className="mt-3 grid gap-2">
                        <div className="flex items-center justify-between text-xs text-muted">
                          <div>Amount</div>
                          <div className="font-mono">{effects[name].amount}</div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={effects[name].amount}
                          onChange={(e) =>
                            setEffects((prev) => ({
                              ...prev,
                              [name]: { ...prev[name], amount: Number(e.target.value) }
                            }))
                          }
                          className="w-full accent-[hsl(var(--accent))]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {activePane === "console" ? (
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle>Console</CardTitle>
                    <CardDescription>Session log for generation and guardrails.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setConsoleLines([])}>
                    Clear
                  </Button>
                </div>
                <div className="rounded-2xl border border-border bg-[hsl(var(--panel)/0.35)] p-4 font-mono text-xs text-muted">
                  {consoleLines.length ? (
                    <div className="grid gap-1">
                      {consoleLines.slice(-18).map((l, i) => (
                        <div key={`${i}-${l}`} className="break-all">
                          {l}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>ready.</div>
                  )}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
