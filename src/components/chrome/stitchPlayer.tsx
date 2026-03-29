"use client";

import { useEffect, useMemo, useRef } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export function StitchPlayer({
  activePane,
  setActivePane,
  title = "",
  subtitle = "",
  statusLabel = "",
  progress = 0.12
}: {
  activePane: "generator" | "synth" | "pedalboard" | "console";
  setActivePane: (pane: "generator" | "synth" | "pedalboard" | "console") => void;
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  progress?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const thumbLeft = useMemo(() => {
    const p = Math.max(0, Math.min(progress, 1));
    return `${Math.round(p * 110) - 5}px`;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let raf = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
      ctx.lineWidth = 2;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      for (let i = 0; i < 3; i++) {
        const radius = ((frame + i * 50) % 150) * (canvas.width / 220);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      frame += 0.5;
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <main className="relative flex items-center justify-center">
          <button
            type="button"
            aria-label="Music Generator"
            className={cn(
              "gel-button top-2 left-2 h-14 w-14 rotate-[-12deg]",
              activePane === "generator" ? "ring-2 ring-[hsl(var(--accent))]" : ""
            )}
            style={{ zIndex: 10 }}
            onClick={() => setActivePane("generator")}
          >
            <Icon name="spark" className="h-6 w-6 text-[rgba(30,58,138,0.95)]" />
          </button>

          <button
            type="button"
            aria-label="Synth"
            className={cn(
              "gel-button top-2 right-2 h-14 w-14 rotate-[12deg]",
              activePane === "synth" ? "ring-2 ring-[hsl(var(--accent))]" : ""
            )}
            style={{ zIndex: 10 }}
            onClick={() => setActivePane("synth")}
          >
            <div className="text-blue-900 text-lg font-bold">
              <span>-</span>
              <span className="ml-1">x</span>
            </div>
          </button>

          <button
            type="button"
            aria-label="Pedalboard"
            className={cn(
              "gel-button -left-10 top-1/2 h-16 w-14 -translate-y-1/2 -rotate-90",
              activePane === "pedalboard" ? "ring-2 ring-[hsl(var(--accent))]" : ""
            )}
            style={{ zIndex: 10 }}
            onClick={() => setActivePane("pedalboard")}
          >
            <Icon name="shield" className="h-6 w-6 rotate-90 text-pink-500" />
          </button>

          <button
            type="button"
            aria-label="Console"
            className={cn(
              "gel-button -right-10 top-1/2 h-16 w-14 -translate-y-1/2 rotate-90",
              activePane === "console" ? "ring-2 ring-[hsl(var(--accent))]" : ""
            )}
            style={{ zIndex: 10 }}
            onClick={() => setActivePane("console")}
          >
            <Icon name="terminal" className="h-6 w-6 -rotate-90 text-blue-900" />
          </button>

          <section className="player-outer-ring">
            <div className="player-inner-bezel">
              <div className="mb-2 flex items-center space-x-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 shadow-inner">
                  <div className="flex h-5 w-5 flex-col items-center justify-center">
                    <div className="flex space-x-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                      <div className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                    </div>
                    <div className="mt-0.5 h-1 w-3 rounded-full bg-lime-400" />
                  </div>
                </div>
                {title ? (
                  <div className="text-xs font-semibold tracking-[0.35em] text-blue-900/70">
                    {title}
                  </div>
                ) : null}
              </div>

              <div className="media-screen" id="player-screen">
                <div className="screen-overlay" />
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-x-0 bottom-2 flex justify-center">
                  <div className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/90">
                    {activePane.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="progress-arc">
                <div className="progress-thumb" style={{ left: thumbLeft }} />
              </div>
            </div>
          </section>
        </main>
    </div>
  );
}
