"use client";
import { ReactNode, useEffect, useState } from "react";
import { Award, Clock } from "lucide-react";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha } from "@/lib/design-tokens";

// Default stage names (Sources Vetting) — used if no per-type names passed in.
const DEFAULT_STAGE_NAMES = [
  "",
  "Sharpen your question",
  "Investigate",
  "Triangulate",
  "Explain",
  "Spot Hallucinations",
];
const DEFAULT_TOTAL = 5;

export function StageShell({
  stageNum,
  displayName,
  missionTitle,
  missionTopic,
  badges,
  children,
  stageNames,
  totalStages,
  timerSeconds,
  startedAt,
}: {
  stageNum: number;
  displayName: string;
  missionTitle: string;
  missionTopic: string;
  badges: string[];
  children: ReactNode;
  stageNames?: string[];
  totalStages?: number;
  timerSeconds?: number;
  startedAt?: string;
}) {
  const names = stageNames || DEFAULT_STAGE_NAMES;
  const total = totalStages || DEFAULT_TOTAL;
  const progressPct = Math.min(100, (stageNum / total) * 100);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className="inline-block px-3 py-1 text-xs border-2 -rotate-1"
            style={{
              fontFamily: "var(--font-kalam)",
              fontWeight: 700,
              backgroundColor: COLOR.red,
              color: "white",
              borderColor: COLOR.pencil,
              borderRadius: RADIUS.tag,
              boxShadow: SHADOW.sm,
            }}
          >
            Stage {stageNum} of {total}
          </div>
          <h1
            className="mt-3 text-3xl sm:text-4xl leading-tight"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            {names[stageNum] || `Stage ${stageNum}`}
          </h1>
          <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
            {missionTopic}
          </p>
        </div>
        <div
          className="shrink-0 text-right text-sm"
          style={{ color: pencilAlpha("cc") }}
        >
          <div style={{ ...KALAM, fontSize: "1.05rem", color: COLOR.pencil }}>
            {displayName}
          </div>
          <div style={{ color: pencilAlpha("80") }}>{missionTitle}</div>
          {timerSeconds && startedAt && (
            <SoftTimer timerSeconds={timerSeconds} startedAt={startedAt} />
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div
          className="h-3 flex-1 overflow-hidden border-2"
          style={{
            borderColor: COLOR.pencil,
            backgroundColor: "white",
            borderRadius: "20px 8px 16px 6px / 8px 20px 6px 16px",
          }}
          aria-label={`Progress: stage ${stageNum} of ${total}`}
        >
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              backgroundColor: COLOR.red,
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((b, i) => {
            const tilt = i % 2 === 0 ? "rotate-2" : "-rotate-2";
            return (
              <span
                key={b}
                title={b}
                aria-label={`Badge earned: ${b}`}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs border-2 ${tilt}`}
                style={{
                  ...KALAM,
                  fontSize: "0.85rem",
                  backgroundColor: COLOR.postIt,
                  color: COLOR.pencil,
                  borderColor: COLOR.pencil,
                  borderRadius: RADIUS.chip,
                  boxShadow: SHADOW.sm,
                }}
              >
                <Award size={14} strokeWidth={2.5} color={COLOR.red} />
                {b}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-8">{children}</div>
    </main>
  );
}

function SoftTimer({ timerSeconds, startedAt }: { timerSeconds: number; startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const start = new Date(startedAt).getTime();
  const elapsedSec = Math.max(0, Math.floor((now - start) / 1000));
  const remaining = timerSeconds - elapsedSec;
  const overrun = remaining < 0;
  const display = overrun
    ? `+${Math.floor(Math.abs(remaining) / 60)}:${String(Math.abs(remaining) % 60).padStart(2, '0')}`
    : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  return (
    <div
      className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 text-xs border"
      style={{
        ...KALAM,
        fontSize: '0.9rem',
        color: overrun ? COLOR.red : COLOR.pencil,
        backgroundColor: overrun ? '#fff0f0' : 'white',
        borderColor: overrun ? COLOR.red : pencilAlpha('66'),
        borderRadius: RADIUS.chip,
      }}
      title={overrun ? 'Past the time limit — but no rush, keep going!' : 'Time remaining'}
    >
      <Clock size={11} strokeWidth={2.5} />
      {display}
    </div>
  );
}
