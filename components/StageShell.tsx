"use client";
import { ReactNode } from "react";

const STAGE_NAMES = [
  "",
  "Query Design",
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
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold tracking-wide text-amber-700">
            Stage {stageNum} of {TOTAL_STAGES}
          </div>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{STAGE_NAMES[stageNum]}</h1>
          <p className="mt-1 text-base text-zinc-600">{missionTopic}</p>
        </div>
        <div className="shrink-0 text-right text-sm text-zinc-600">
          <div className="font-semibold">{displayName}</div>
          <div className="text-zinc-500">{missionTitle}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full bg-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${(stageNum / TOTAL_STAGES) * 100}%` }}
            aria-label={`Progress: stage ${stageNum} of ${TOTAL_STAGES}`}
          />
        </div>
        <div className="flex gap-1">
          {badges.map((b) => (
            <span
              key={b}
              title={b}
              aria-label={`Badge earned: ${b}`}
              className="inline-flex h-7 items-center rounded-full bg-amber-100 px-2 text-sm font-medium text-amber-900"
            >
              🏅 {b}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8">{children}</div>
    </main>
  );
}
