"use client";
// Sources Vetting (the original 5-stage Sleuth research mission).
// This runner just dispatches to the existing Stage1-5 components by stage number.
// Other mission types (chore-check, dopamine-reset, reading-drill) have their own runners.

import { Stage1 } from "@/components/stages/Stage1";
import { Stage2 } from "@/components/stages/Stage2";
import { Stage3 } from "@/components/stages/Stage3";
import { Stage4 } from "@/components/stages/Stage4";
import { Stage5 } from "@/components/stages/Stage5";

export function SourcesVettingRunner({
  stageNum,
  shareToken,
}: {
  stageNum: number;
  shareToken: string;
}) {
  if (stageNum === 1) return <Stage1 shareToken={shareToken} />;
  if (stageNum === 2) return <Stage2 shareToken={shareToken} />;
  if (stageNum === 3) return <Stage3 shareToken={shareToken} />;
  if (stageNum === 4) return <Stage4 shareToken={shareToken} />;
  if (stageNum === 5) return <Stage5 shareToken={shareToken} />;
  return null;
}

// Stage display metadata for the shell
export const SOURCES_VETTING_STAGE_NAMES = [
  "",
  "Sharpen your question",
  "Investigate",
  "Triangulate",
  "Explain",
  "Spot Hallucinations",
];
export const SOURCES_VETTING_TOTAL = 5;
