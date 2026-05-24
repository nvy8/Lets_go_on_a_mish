"use client";
import { useEffect, useState, use } from "react";
import { StageShell } from "@/components/StageShell";
import { SourcesVettingRunner } from "@/components/types/SourcesVettingRunner";
import { ChoreCheckRunner } from "@/components/types/ChoreCheckRunner";
import { DopamineResetRunner } from "@/components/types/DopamineResetRunner";
import { ReadingDrillRunner } from "@/components/types/ReadingDrillRunner";
import { getTypeMeta } from "@/components/types/registry";
import { PAPER_BG } from "@/lib/design-tokens";

type MissionMeta = {
  id: string;
  title: string;
  topic: string;
  mission_type_slug: string;
  audience_role: 'teacher' | 'parent';
  timer_seconds?: number;
};

type SessionState = {
  id: string;
  display_name: string;
  current_stage: number;
  badges_earned: string[];
  started_at?: string;
  mission: MissionMeta | null;
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

  const typeMeta = getTypeMeta(session.mission.mission_type_slug);

  return (
    <div className="relative flex-1 overflow-hidden" style={PAPER_BG}>
      <div className="relative">
        <StageShell
          stageNum={stageNum}
          displayName={session.display_name}
          missionTitle={session.mission.title}
          missionTopic={session.mission.topic}
          badges={session.badges_earned}
          stageNames={typeMeta.stageNames}
          totalStages={typeMeta.totalStages}
          timerSeconds={session.mission.timer_seconds}
          startedAt={session.started_at}
        >
          {/* Dispatch by mission type */}
          {session.mission.mission_type_slug === 'sources-vetting' && (
            <SourcesVettingRunner stageNum={stageNum} shareToken={shareToken} />
          )}
          {session.mission.mission_type_slug === 'chore-check' && (
            <ChoreCheckRunner
              shareToken={shareToken}
              mission={{ title: session.mission.title, topic: session.mission.topic }}
            />
          )}
          {session.mission.mission_type_slug === 'dopamine-reset' && (
            <DopamineResetRunner stageNum={stageNum} shareToken={shareToken} />
          )}
          {session.mission.mission_type_slug === 'reading-drill' && (
            <ReadingDrillRunner stageNum={stageNum} shareToken={shareToken} />
          )}
          {!['sources-vetting', 'chore-check', 'dopamine-reset', 'reading-drill'].includes(
            session.mission.mission_type_slug,
          ) && <NewTypePlaceholder typeSlug={session.mission.mission_type_slug} />}
        </StageShell>
      </div>
    </div>
  );
}

function NewTypePlaceholder({ typeSlug }: { typeSlug: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-12 text-center">
      <div className="text-5xl">🚧</div>
      <h2 className="mt-3 text-xl font-semibold">
        Mission type <code>{typeSlug}</code> — under construction
      </h2>
      <p className="mt-2 text-zinc-600">
        Coming in Phase B of the platform refactor.
      </p>
    </div>
  );
}
