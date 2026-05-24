import { NextRequest, NextResponse } from 'next/server';
import { connect, COLLECTIONS, ObjectId } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/auth';
import type { Session, FactEntry, SourceEntry } from '@/lib/types';

// Teacher-only analytics endpoint for a single mission.
// Returns per-student progress + per-class aggregate so the teacher can
// see who joined, how far they got, how long they spent, and what badges
// they earned — all derived from the session document the kid generates.

type StudentRow = {
  session_id: string;
  display_name: string;
  current_stage: number;
  total_stages: number;
  completed: boolean;
  badges: string[];
  badges_count: number;
  refined_query: string | null;
  scores: {
    sources_picked_legit: number;
    sources_total: number;
    facts_triangulated: number;
    facts_total: number;
    explanations_meeting_plus: number;
    explanations_total: number;
    hallucinations_spotted: number;
    hallucinations_total: number;
  };
  time_on_task_ms: number;
  created_at: string;
  last_active_at: string;
  is_active_now: boolean; // last_active within 2 minutes
};

type ClassSummary = {
  total_joined: number;
  completed: number;
  in_progress: number;
  active_now: number;
  avg_time_on_task_ms: number;
  median_time_on_task_ms: number;
  stage_distribution: number[]; // counts per stage 1..5, plus index 0 = "complete"
  badge_distribution: Record<string, number>; // badge name -> count
  most_recent_join_at: string | null;
};

const TOTAL_STAGES = 5;
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;
const COMPLETED_BADGE_THRESHOLD = 'Hallucination Hunter'; // earning this means they hit the final stage

function buildStudentRow(s: Session): StudentRow {
  const notepad = s.notepad || {};
  const sources: SourceEntry[] = notepad.candidate_sources || [];
  const facts: FactEntry[] = notepad.facts || [];
  const hallucinations = notepad.hallucinations || [];

  const sources_picked_legit = sources.filter((c) => c.kid_verdict === 'legit').length;
  const facts_triangulated = facts.filter((f) => f.triangulated).length;
  const explanations_meeting_plus = facts.filter(
    (f) => f.ai_grade === 'meeting' || f.ai_grade === 'exceeding',
  ).length;
  const explanations_total = facts.filter((f) => !!f.ai_grade).length;
  const hallucinations_spotted = hallucinations.filter(
    (h) => h.kid_pick_index !== undefined && h.kid_pick_index === h.correct_index,
  ).length;
  const hallucinations_total = hallucinations.length;

  const now = Date.now();
  const lastActive = new Date(s.last_active_at).getTime();
  const created = new Date(s.created_at).getTime();
  const time_on_task_ms = Math.max(0, lastActive - created);
  const is_active_now = now - lastActive < ACTIVE_WINDOW_MS;

  // "Completed" = reached Stage 5 AND has the Hallucination-Hunter trigger or
  //   has submitted Stage 5 (current_stage advances to 5 on Stage 5 submit, so
  //   we detect completion by hallucinations all answered).
  const allHalluAnswered =
    hallucinations.length > 0 && hallucinations.every((h) => h.kid_pick_index !== undefined);
  const completed = s.current_stage === 5 && allHalluAnswered;

  return {
    session_id: s._id.toString(),
    display_name: s.display_name,
    current_stage: s.current_stage,
    total_stages: TOTAL_STAGES,
    completed,
    badges: s.badges_earned || [],
    badges_count: (s.badges_earned || []).length,
    refined_query: notepad.refined_query || null,
    scores: {
      sources_picked_legit,
      sources_total: sources.length,
      facts_triangulated,
      facts_total: facts.length,
      explanations_meeting_plus,
      explanations_total,
      hallucinations_spotted,
      hallucinations_total,
    },
    time_on_task_ms,
    created_at: new Date(s.created_at).toISOString(),
    last_active_at: new Date(s.last_active_at).toISOString(),
    is_active_now,
  };
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function buildSummary(rows: StudentRow[]): ClassSummary {
  const total_joined = rows.length;
  const completed = rows.filter((r) => r.completed).length;
  const in_progress = total_joined - completed;
  const active_now = rows.filter((r) => r.is_active_now).length;

  // Stage distribution: index 0 = completed, indices 1..5 = current_stage if not completed
  const stage_distribution = [0, 0, 0, 0, 0, 0];
  for (const r of rows) {
    if (r.completed) stage_distribution[0]++;
    else stage_distribution[r.current_stage]++;
  }

  const badge_distribution: Record<string, number> = {};
  for (const r of rows) {
    for (const b of r.badges) {
      badge_distribution[b] = (badge_distribution[b] || 0) + 1;
    }
  }

  const times = rows.map((r) => r.time_on_task_ms);
  const avg_time_on_task_ms =
    times.length === 0 ? 0 : Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const median_time_on_task_ms = Math.round(median(times));

  const most_recent_join_at =
    rows.length === 0
      ? null
      : rows.map((r) => r.created_at).sort().slice(-1)[0];

  return {
    total_joined,
    completed,
    in_progress,
    active_now,
    avg_time_on_task_ms,
    median_time_on_task_ms,
    stage_distribution,
    badge_distribution,
    most_recent_join_at,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { id } = await params;
  let missionObjectId: ObjectId;
  try {
    missionObjectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: 'Invalid mission id' }, { status: 400 });
  }

  try {
    const db = await connect();
    const mission = await db
      .collection(COLLECTIONS.missions)
      .findOne({ _id: missionObjectId, teacher_id: teacher._id });
    if (!mission) return NextResponse.json({ error: 'Mish not found' }, { status: 404 });

    const sessions = (await db
      .collection(COLLECTIONS.sessions)
      .find({ mission_id: missionObjectId })
      .sort({ last_active_at: -1 })
      .toArray()) as unknown as Session[];

    const students = sessions.map(buildStudentRow);
    const summary = buildSummary(students);

    return NextResponse.json({
      mission: {
        id: mission._id.toString(),
        title: mission.title,
        topic: mission.topic,
        share_token: mission.share_token,
        created_at: mission.created_at,
      },
      students,
      summary,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
