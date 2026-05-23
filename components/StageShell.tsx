"use client";
import { ReactNode } from "react";

const STAGE_NAMES = [
  "",
  "Query Design",
  "Search & Select",
  "Investigate",
  "Triangulate",
  "Explain",
  "Spot Hallucinations",
];

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
        <div>
          <div className="text-xs uppercase tracking-wide text-amber-600">
            Stage {stageNum} of 6
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{STAGE_NAMES[stageNum]}</h1>
          <p className="mt-1 text-sm text-zinc-500">{missionTopic}</p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          <div>{displayName}</div>
          <div className="font-mono">{missionTitle}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${(stageNum / 6) * 100}%` }}
          />
        </div>
        <div className="flex gap-1">
          {badges.map((b) => (
            <span
              key={b}
              title={b}
              className="inline-flex h-7 items-center rounded-full bg-amber-100 px-2 text-xs font-medium text-amber-800"
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
