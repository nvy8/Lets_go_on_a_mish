// 
"use client";
import { useEffect, useState, use } from "react";
import { StageShell } from "@/components/StageShell";
import { Stage1 } from "@/components/stages/Stage1";
import { Stage2 } from "@/components/stages/Stage2";
import { Stage3 } from "@/components/stages/Stage3";
import { Stage4 } from "@/components/stages/Stage4";
import { Stage5 } from "@/components/stages/Stage5";
import { KALAM, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";

type SessionState = {
  id: string;
  display_name: string;
  current_stage: number;
  badges_earned: string[];
  mission: { id: string; title: string; topic: string } | null;
};

export default function StagePage({
  params,
}: {
  params: Promise<{ shareToken: string; n: string }>;
}) {
  const { shareToken, n } = use(params);
  const stageNum = parseInt(n, 10);
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session/state").then(async (r) => {
      if (r.status === 401) {
        setError("Please join the mission first.");
        return;
      }
      const data = await r.json();
      setSession(data.session);
    });
  }, []);

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center p-12" style={PAPER_BG}>
        <div style={{ ...KALAM, color: pencilAlpha("cc") }}>{error}</div>
      </main>
    );
  }
  if (!session || !session.mission) {
    return (
      <main className="flex flex-1 items-center justify-center p-12" style={PAPER_BG}>
        <div style={{ ...KALAM, color: pencilAlpha("99") }}>Loading…</div>
      </main>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden" style={PAPER_BG}>
      {/* Faint hand-drawn doodle behind every stage — same as the Complete page */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/scraped/page_homepage_sketch-lines.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.06]"
      />
      <div className="relative">
        <StageShell
          stageNum={stageNum}
          displayName={session.display_name}
          missionTitle={session.mission.title}
          missionTopic={session.mission.topic}
          badges={session.badges_earned}
        >
          {stageNum === 1 && <Stage1 shareToken={shareToken} />}
          {stageNum === 2 && <Stage2 shareToken={shareToken} />}
          {stageNum === 3 && <Stage3 shareToken={shareToken} />}
          {stageNum === 4 && <Stage4 shareToken={shareToken} />}
          {stageNum === 5 && <Stage5 shareToken={shareToken} />}
        </StageShell>
      </div>
    </div>
  );
}
