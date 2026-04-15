"use client";

import { useEffect, useCallback, useState } from "react";
import { Play, Pause, SkipForward } from "@phosphor-icons/react";
import { PixelGrid, generateGridData } from "./PixelGrid";

type Phase = "focus" | "shortBreak" | "longBreak";

const DURATIONS: Record<Phase, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function PomodoroApp() {
  const [phase, setPhase] = useState<Phase>("focus");
  const [secondsRemaining, setSecondsRemaining] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  // Stable SSR placeholder — randomized after hydration in useEffect to avoid mismatch
  const [gridData, setGridData] = useState<{
    order: number[];
    colors: string[];
  }>({
    order: Array.from({ length: 2700 }, (_, i) => i),
    colors: Array.from({ length: 2700 }, () => "#4c73ec"),
  });

  // Randomize grid after hydration — Math.random() must not run on the server
  useEffect(() => {
    setGridData(generateGridData());
  }, []);

  const advancePhase = useCallback(
    (currentPhase: Phase, currentCycles: number) => {
      let nextPhase: Phase;
      let nextCycles = currentCycles;

      if (currentPhase === "focus") {
        nextCycles = currentCycles + 1;
        if (nextCycles >= 4) {
          nextPhase = "longBreak";
          nextCycles = 0;
        } else {
          nextPhase = "shortBreak";
        }
      } else {
        nextPhase = "focus";
      }

      setPhase(nextPhase);
      setCyclesCompleted(nextCycles);
      setSecondsRemaining(DURATIONS[nextPhase]);
    },
    [],
  );

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      // Tick timer
      setSecondsRemaining((s) => {
        if (s <= 1) {
          advancePhase(phase, cyclesCompleted);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, phase, cyclesCompleted, advancePhase]);

  const handleSkip = useCallback(() => {
    advancePhase(phase, cyclesCompleted);
  }, [phase, cyclesCompleted, advancePhase]);

  const toggleRunning = () => setIsRunning((r) => !r);

  const revealedCount =
    phase === "focus"
      ? Math.round((1 - secondsRemaining / DURATIONS.focus) * 2700)
      : Math.round((secondsRemaining / DURATIONS[phase]) * 2700);

  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, "0");
  const seconds = String(secondsRemaining % 60).padStart(2, "0");

  const pillLabel =
    phase === "focus"
      ? `FOCUS ${cyclesCompleted + 1}/4`
      : phase === "shortBreak"
        ? "SHORT BREAK"
        : "LONG BREAK";

  return (
    <main className="flex flex-col md:flex-row h-svh overflow-hidden">
      {/* LEFT PANEL */}
      <div className="flex flex-col items-center justify-between p-10 md:w-[38%] shrink-0 h-[50svh] md:h-full">
        {/* Title */}
        <p
          className="text-[15px] text-[#f8fafc] tracking-[0.12em] font-[400]"
          style={{
            textWrap: "balance",
            animation: "fadeInUp 400ms ease-out both",
          }}
        >
          POMOPIXEL
        </p>

        {/* Timer digits */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex flex-col"
          style={{
            gap: "clamp(16px, 4vw, 24px)",
            animation: "fadeInUp 400ms 100ms ease-out both",
          }}
        >
          <span
            className="font-[100] tabular-nums leading-none tracking-[-0.02em] select-none"
            style={{ fontSize: "clamp(3.5rem, 14vw, 15rem)" }}
          >
            {minutes}
          </span>
          <span
            className="font-[100] tabular-nums leading-none tracking-[-0.02em] select-none"
            style={{ fontSize: "clamp(3.5rem, 14vw, 15rem)" }}
          >
            {seconds}
          </span>
        </div>

        {/* Controls */}
        <div
          className="flex items-center gap-4"
          style={{ animation: "fadeInUp 400ms 200ms ease-out both" }}
        >
          {/* Play / Pause button */}
          <button
            aria-label={isRunning ? "Pause timer" : "Start timer"}
            onClick={toggleRunning}
            className={cn(
              "relative flex items-center justify-center",
              "size-8 rounded-full border border-white/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
              "active:scale-[0.96] transition-[transform] duration-150 ease-out",
              // extend hit area to 40px min
              'after:absolute after:content-[""] after:size-10',
              "after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2",
            )}
            style={{ touchAction: "manipulation" }}
          >
            {/* Play icon — visible when paused */}
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "transition-[opacity,filter,scale] duration-300",
                "[transition-timing-function:cubic-bezier(0.2,0,0,1)]",
                isRunning
                  ? "opacity-0 scale-[0.25] blur-[4px] pointer-events-none"
                  : "opacity-100 scale-100 blur-0",
              )}
              aria-hidden="true"
            >
              <Play size={12} weight="fill" color="white" />
            </span>
            {/* Pause icon — visible when running */}
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "transition-[opacity,filter,scale] duration-300",
                "[transition-timing-function:cubic-bezier(0.2,0,0,1)]",
                isRunning
                  ? "opacity-100 scale-100 blur-0"
                  : "opacity-0 scale-[0.25] blur-[4px] pointer-events-none",
              )}
              aria-hidden="true"
            >
              <Pause size={12} weight="fill" color="white" />
            </span>
          </button>

          {/* Phase / cycle pill */}
          <div className="border border-white/80 rounded-full px-3 py-1.5 overflow-hidden">
            <span
              key={pillLabel}
              className="text-[15px] text-white/90 tracking-[0.04em] font-[400] whitespace-nowrap block"
              style={{ animation: "fadeIn 200ms ease-out both" }}
            >
              {pillLabel}
            </span>
          </div>

          {/* Skip button */}
          <button
            aria-label="Skip to next phase"
            onClick={handleSkip}
            className={cn(
              "relative flex items-center justify-center",
              "size-8 rounded-full border border-white/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
              "active:scale-[0.96] transition-[transform] duration-150 ease-out",
              'after:absolute after:content-[""] after:size-10',
              "after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2",
            )}
            style={{ touchAction: "manipulation" }}
          >
            <SkipForward size={12} weight="fill" color="white" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* RIGHT PANEL — pixel canvas */}
      <div
        className="flex flex-1 items-center justify-center h-[50svh] md:h-full p-10 [container-type:size]"
        style={{ animation: "fadeInUp 400ms 300ms ease-out both" }}
      >
        <div
          className="w-[min(100cqi,calc(100cqb*4/3))] aspect-[4/3]"
          style={{ backgroundColor: "#4c73ec", padding: "16px" }}
        >
          <PixelGrid
            gridOrder={gridData.order}
            cellColors={gridData.colors}
            revealedCount={revealedCount}
          />
        </div>
      </div>
    </main>
  );
}
