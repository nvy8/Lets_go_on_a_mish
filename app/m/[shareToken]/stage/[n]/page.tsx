"use client";
import { useEffect, useState, use } from "react";
import { StageShell } from "@/components/StageShell";
import { Stage1 } from "@/components/stages/Stage1";
import { Stage2 } from "@/components/stages/Stage2";
import { Stage3 } from "@/components/stages/Stage3";
import { Stage4 } from "@/components/stages/Stage4";
import { Stage5 } from "@/components/stages/Stage5";

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
    fetch("/api/session/state")
      .then(async (r) => {
        if (r.status === 401) {
          setError("Please join the Mish first.");
          return;
        }
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          setError(d.error || `Couldn't load your session (HTTP ${r.status}). Try refreshing.`);
          return;
        }
        const data = await r.json();
        setSession(data.session);
      })
      .catch((e) => setError((e as Error).message || "Couldn't reach the server. Check your connection."));
  }, []);

  if (error) {
    return <main className="p-12 text-zinc-500">{error}</main>;
  }
  if (!session || !session.mission) {
    return <main className="p-12 text-zinc-500">Loading...</main>;
  }

  return (
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
  );
}
