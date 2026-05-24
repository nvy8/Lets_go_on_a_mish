import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
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

const VALID_TYPE_SLUGS = new Set([
  'sources-vetting',
  'dopamine-reset',
  'chore-check',
  'reading-drill',
]);

const VALID_AUDIENCE_ROLES = new Set(['teacher', 'parent']);

export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      topic,
      knowledge_base_text,
      mission_type_slug,
      audience_role,
      timer_seconds,
      rewards_config,
      project_id,
      week_number,
    } = body;

    if (!title || !topic) {
      return NextResponse.json({ error: 'title and topic required' }, { status: 400 });
    }

    const typeSlug = mission_type_slug || 'sources-vetting';
    if (!VALID_TYPE_SLUGS.has(typeSlug)) {
      return NextResponse.json({ error: `Unknown mission_type_slug: ${typeSlug}` }, { status: 400 });
    }

    const role = audience_role || 'teacher';
    if (!VALID_AUDIENCE_ROLES.has(role)) {
      return NextResponse.json({ error: `Unknown audience_role: ${role}` }, { status: 400 });
    }

    const db = await connect();

    // Optional project assignment. If provided, verify the teacher owns it.
    let projectObjectId: ObjectId | null = null;
    let nextPosition: number | undefined;
    if (project_id !== undefined && project_id !== null && project_id !== '') {
      projectObjectId = parseObjectId(project_id);
      if (!projectObjectId) {
        return NextResponse.json({ error: 'Invalid project_id' }, { status: 400 });
      }
      const owned = await db
        .collection(COLLECTIONS.projects)
        .findOne({ _id: projectObjectId, teacher_id: teacher._id });
      if (!owned) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      // Append to the end of the project.
      const last = await db
        .collection(COLLECTIONS.missions)
        .find({ project_id: projectObjectId })
        .sort({ position: -1 })
        .limit(1)
        .toArray();
      nextPosition = ((last[0]?.position as number) ?? 0) + 1;
    }

    const validWeek =
      typeof week_number === 'number' && week_number > 0 && week_number <= 52
        ? Math.floor(week_number)
        : undefined;

    const share_token = randomBytes(12).toString('base64url');
    const result = await db.collection(COLLECTIONS.missions).insertOne({
      teacher_id: teacher._id,
      title,
      topic,
      knowledge_base_text: knowledge_base_text || '',
      mission_type_slug: typeSlug,
      audience_role: role,
      timer_seconds: typeof timer_seconds === 'number' ? timer_seconds : undefined,
      rewards_config: rewards_config || undefined,
      share_token,
      created_at: new Date(),
      ...(projectObjectId ? { project_id: projectObjectId, position: nextPosition } : {}),
      ...(validWeek !== undefined ? { week_number: validWeek } : {}),
    });
    return NextResponse.json({
      ok: true,
      missionId: result.insertedId.toString(),
      share_token,
      mission_type_slug: typeSlug,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const url = new URL(req.url);
  const standaloneOnly = url.searchParams.get('standalone') === '1';

  const db = await connect();
  const query: Record<string, unknown> = { teacher_id: teacher._id };
  if (standaloneOnly) {
    query.$or = [{ project_id: { $exists: false } }, { project_id: null }];
  }
  const missions = await db
    .collection(COLLECTIONS.missions)
    .find(query)
    .sort({ created_at: -1 })
    .toArray();

  return NextResponse.json({
    missions: missions.map((m) => ({
      id: m._id.toString(),
      title: m.title,
      topic: m.topic,
      share_token: m.share_token,
      mission_type_slug: m.mission_type_slug || 'sources-vetting',
      audience_role: m.audience_role || 'teacher',
      timer_seconds: m.timer_seconds,
      created_at: m.created_at,
      project_id: m.project_id ? m.project_id.toString() : null,
      position: m.position ?? null,
      week_number: m.week_number ?? null,
    })),
  });
}
