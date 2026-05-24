import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ session: null }, { status: 401 });

  const db = await connect();
  const mission = await db.collection(COLLECTIONS.missions).findOne({ _id: session.mission_id });

  return NextResponse.json({
    session: {
      id: session._id.toString(),
      display_name: session.display_name,
      current_stage: session.current_stage,
      badges_earned: session.badges_earned,
      notepad: session.notepad,
      started_at: session.started_at,
      mission: mission
        ? {
            id: mission._id.toString(),
            title: mission.title,
            topic: mission.topic,
            mission_type_slug: mission.mission_type_slug || 'sources-vetting',
            audience_role: mission.audience_role || 'teacher',
            timer_seconds: mission.timer_seconds,
          }
        : null,
    },
  });
}
