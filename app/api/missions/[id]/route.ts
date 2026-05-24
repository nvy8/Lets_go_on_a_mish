import { NextRequest, NextResponse } from 'next/server';
import { connect, COLLECTIONS, ObjectId } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { id } = await params;
  try {
    const db = await connect();
    const mission = await db
      .collection(COLLECTIONS.missions)
      .findOne({ _id: new ObjectId(id), teacher_id: teacher._id });
    if (!mission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      mission: {
        id: mission._id.toString(),
        title: mission.title,
        topic: mission.topic,
        knowledge_base_text: mission.knowledge_base_text,
        share_token: mission.share_token,
        mission_type_slug: mission.mission_type_slug || 'sources-vetting',
        audience_role: mission.audience_role || 'teacher',
        timer_seconds: mission.timer_seconds,
        rewards_config: mission.rewards_config,
        created_at: mission.created_at,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
