import { NextRequest, NextResponse } from 'next/server';
import { connect, COLLECTIONS, ObjectId } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/auth';

function parseObjectId(id: unknown): ObjectId | null {
  if (typeof id !== 'string') return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { id } = await params;
  const oid = parseObjectId(id);
  if (!oid) return NextResponse.json({ error: 'Invalid mission id' }, { status: 400 });

  try {
    const db = await connect();
    const mission = await db
      .collection(COLLECTIONS.missions)
      .findOne({ _id: oid, teacher_id: teacher._id });
    if (!mission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If the mission belongs to a project, attach project metadata for the UI.
    let project: { id: string; name: string } | null = null;
    if (mission.project_id) {
      const proj = await db
        .collection(COLLECTIONS.projects)
        .findOne({ _id: mission.project_id, teacher_id: teacher._id });
      if (proj) project = { id: proj._id.toString(), name: proj.name };
    }

    return NextResponse.json({
      mission: {
        id: mission._id.toString(),
        title: mission.title,
        topic: mission.topic,
        knowledge_base_text: mission.knowledge_base_text,
        share_token: mission.share_token,
        created_at: mission.created_at,
        project_id: mission.project_id ? mission.project_id.toString() : null,
        position: mission.position ?? null,
        week_number: mission.week_number ?? null,
        project,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PATCH /api/missions/[id] — reassign to / from a project, or set position / week.
//   Body: { project_id?: string | null, position?: number, week_number?: number }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { id } = await params;
  const oid = parseObjectId(id);
  if (!oid) return NextResponse.json({ error: 'Invalid mission id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const db = await connect();
  const owned = await db
    .collection(COLLECTIONS.missions)
    .findOne({ _id: oid, teacher_id: teacher._id });
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const set: Record<string, unknown> = {};
  const unset: Record<string, unknown> = {};

  if (body.project_id === null || body.project_id === '') {
    // Detach from any project.
    unset.project_id = '';
    unset.position = '';
  } else if (body.project_id !== undefined) {
    const pid = parseObjectId(body.project_id);
    if (!pid) return NextResponse.json({ error: 'Invalid project_id' }, { status: 400 });
    const ownedProject = await db
      .collection(COLLECTIONS.projects)
      .findOne({ _id: pid, teacher_id: teacher._id });
    if (!ownedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    set.project_id = pid;
    // Append to the end of the new project.
    const last = await db
      .collection(COLLECTIONS.missions)
      .find({ project_id: pid })
      .sort({ position: -1 })
      .limit(1)
      .toArray();
    set.position = ((last[0]?.position as number) ?? 0) + 1;
  }

  if (typeof body.position === 'number' && body.position > 0) {
    set.position = Math.floor(body.position);
  }
  if (typeof body.week_number === 'number' && body.week_number > 0 && body.week_number <= 52) {
    set.week_number = Math.floor(body.week_number);
  } else if (body.week_number === null) {
    unset.week_number = '';
  }

  if (!Object.keys(set).length && !Object.keys(unset).length) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 });
  }

  await db.collection(COLLECTIONS.missions).updateOne(
    { _id: oid, teacher_id: teacher._id },
    {
      ...(Object.keys(set).length ? { $set: set } : {}),
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
    },
  );
  return NextResponse.json({ ok: true });
}
