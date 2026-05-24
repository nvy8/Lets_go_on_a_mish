import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { connect, COLLECTIONS } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/auth';

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

export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const db = await connect();
  const missions = await db
    .collection(COLLECTIONS.missions)
    .find({ teacher_id: teacher._id })
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
    })),
  });
}
