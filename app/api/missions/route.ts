import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { connect, COLLECTIONS } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  try {
    const { title, topic, knowledge_base_text } = await req.json();
    if (!title || !topic) {
      return NextResponse.json({ error: 'title and topic required' }, { status: 400 });
    }
    const db = await connect();
    const share_token = randomBytes(12).toString('base64url');
    const result = await db.collection(COLLECTIONS.missions).insertOne({
      teacher_id: teacher._id,
      title,
      topic,
      knowledge_base_text: knowledge_base_text || '',
      share_token,
      created_at: new Date(),
    });
    return NextResponse.json({
      ok: true,
      missionId: result.insertedId.toString(),
      share_token,
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
      created_at: m.created_at,
    })),
  });
}
