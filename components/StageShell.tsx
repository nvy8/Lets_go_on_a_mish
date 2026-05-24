"use client";
import { ReactNode } from "react";
import { Award } from "lucide-react";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha } from "@/lib/design-tokens";

const STAGE_NAMES = [
  "",
  "Sharpen your question",
  "Investigate",
  "Triangulate",
  "Explain",
  "Spot Hallucinations",
];
const TOTAL_STAGES = 5;

export function StageShell({
  stageNum,
  displayName,
  missionTitle,
  missionTopic,
  badges,
  children,
}: {
  stageNum: number;
  displayName: string;
  missionTitle: string;
  missionTopic: string;
  badges: string[];
  children: ReactNode;
}) {
  const progressPct = (stageNum / TOTAL_STAGES) * 100;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8 sm:py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/svg/brand/mascot-sleuth.svg"
            alt=""
            aria-hidden="true"
            className="hidden h-20 w-20 shrink-0 sm:block"
          />
          <div className="min-w-0 flex-1">
            <div
              className="inline-block px-3 py-1 text-xs border-2 -rotate-1"
              style={{
                fontFamily: "var(--font-kalam)",
                fontWeight: 700,
                backgroundColor: COLOR.gold,
                color: COLOR.pencil,
                borderColor: COLOR.pencil,
                borderRadius: RADIUS.tag,
                boxShadow: SHADOW.sm,
              }}
            >
              Stage {stageNum} of {TOTAL_STAGES}
            </div>
            <h1
              className="mt-3 text-3xl sm:text-4xl leading-tight"
              style={{ ...KALAM, color: COLOR.pencil }}
            >
              {STAGE_NAMES[stageNum]}
            </h1>
            <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
              {missionTopic}
            </p>
          </div>
        </div>
        <div
          className="shrink-0 text-right text-sm"
          style={{ color: pencilAlpha("cc") }}
        >
          <div style={{ ...KALAM, fontSize: "1.05rem", color: COLOR.pencil }}>
            {displayName}
          </div>
          <div style={{ color: pencilAlpha("80") }}>{missionTitle}</div>
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
          aria-label={`Progress: stage ${stageNum} of ${TOTAL_STAGES}`}
        >
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              backgroundColor: COLOR.gold,
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
                <Award size={14} strokeWidth={2.5} color={COLOR.gold} />
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
