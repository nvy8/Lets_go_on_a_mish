import { NextRequest, NextResponse } from 'next/server';
import { connect, COLLECTIONS, ObjectId } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/auth';

function parseObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

// GET /api/projects/[id] — project + its missions (ordered by position then created_at)
//   + lightweight per-mission session stats.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { id } = await params;
  const oid = parseObjectId(id);
  if (!oid) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });

  const db = await connect();
  const project = await db
    .collection(COLLECTIONS.projects)
    .findOne({ _id: oid, teacher_id: teacher._id });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const missions = await db
    .collection(COLLECTIONS.missions)
    .find({ project_id: oid })
    .sort({ position: 1, created_at: 1 })
    .toArray();

  // Per-mission session stats for the project view.
  const missionIds = missions.map((m) => m._id);
  const sessions = missionIds.length
    ? await db
        .collection(COLLECTIONS.sessions)
        .find({ mission_id: { $in: missionIds } })
        .project({ mission_id: 1, current_stage: 1, badges_earned: 1, last_active_at: 1, notepad: 1 })
        .toArray()
    : [];

  type SessLite = {
    mission_id: ObjectId;
    current_stage: number;
    badges_earned?: string[];
    last_active_at: Date;
    notepad?: { hallucinations?: Array<{ kid_pick_index?: number; correct_index: number }> };
  };
  const byMission = new Map<string, SessLite[]>();
  for (const s of sessions as unknown as SessLite[]) {
    const key = String(s.mission_id);
    if (!byMission.has(key)) byMission.set(key, []);
    byMission.get(key)!.push(s);
  }
  const ACTIVE_WINDOW_MS = 2 * 60 * 1000;
  const now = Date.now();

  // Project-level aggregate.
  let totalJoined = 0;
  let totalCompleted = 0;
  let totalActiveNow = 0;
  let totalBadges = 0;

  const missionRows = missions.map((m) => {
    const ss = byMission.get(m._id.toString()) || [];
    const joined = ss.length;
    const completed = ss.filter((s) => {
      const hallu = s.notepad?.hallucinations || [];
      return (
        s.current_stage === 5 &&
        hallu.length > 0 &&
        hallu.every((h) => h.kid_pick_index !== undefined)
      );
    }).length;
    const activeNow = ss.filter(
      (s) => now - new Date(s.last_active_at).getTime() < ACTIVE_WINDOW_MS,
    ).length;
    const badges = ss.reduce((acc, s) => acc + (s.badges_earned?.length || 0), 0);

    totalJoined += joined;
    totalCompleted += completed;
    totalActiveNow += activeNow;
    totalBadges += badges;

    return {
      id: m._id.toString(),
      title: m.title,
      topic: m.topic,
      share_token: m.share_token,
      created_at: m.created_at,
      position: m.position ?? null,
      week_number: m.week_number ?? null,
      joined,
      completed,
      active_now: activeNow,
      total_badges: badges,
    };
  });

  return NextResponse.json({
    project: {
      id: project._id.toString(),
      name: project.name,
      description: project.description ?? null,
      week_count: project.week_count ?? null,
      archived_at: project.archived_at ?? null,
      created_at: project.created_at,
    },
    missions: missionRows,
    summary: {
      missions_count: missions.length,
      total_joined: totalJoined,
      total_completed: totalCompleted,
      total_active_now: totalActiveNow,
      total_badges: totalBadges,
    },
  });
}

// PATCH /api/projects/[id] — rename / update meta / archive / unarchive.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { id } = await params;
  const oid = parseObjectId(id);
  if (!oid) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  const unset: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
  if (typeof body.description === 'string') update.description = body.description.trim();
  if (typeof body.week_count === 'number' && body.week_count > 0 && body.week_count <= 52) {
    update.week_count = Math.floor(body.week_count);
  }
  if (body.archived === true) update.archived_at = new Date();
  if (body.archived === false) unset.archived_at = '';

  if (!Object.keys(update).length && !Object.keys(unset).length) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 });
  }

  const db = await connect();
  const result = await db.collection(COLLECTIONS.projects).updateOne(
    { _id: oid, teacher_id: teacher._id },
    {
      ...(Object.keys(update).length ? { $set: update } : {}),
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
    },
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/projects/[id] — hard-delete the project AND detach its missions
//   (set project_id to null). Sessions live on. To preserve a project as a
//   record, use PATCH { archived: true } instead.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { id } = await params;
  const oid = parseObjectId(id);
  if (!oid) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });

  const db = await connect();
  const project = await db
    .collection(COLLECTIONS.projects)
    .findOne({ _id: oid, teacher_id: teacher._id });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // Detach missions first so a partial failure can't leave dangling pointers.
  const detachRes = await db
    .collection(COLLECTIONS.missions)
    .updateMany(
      { project_id: oid, teacher_id: teacher._id },
      { $unset: { project_id: '', position: '', week_number: '' } },
    );
  await db.collection(COLLECTIONS.projects).deleteOne({ _id: oid });

  return NextResponse.json({
    ok: true,
    missions_detached: detachRes.modifiedCount,
  });
}
