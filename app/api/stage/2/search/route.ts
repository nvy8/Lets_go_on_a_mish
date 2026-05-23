import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { webSearch, aiSearch } from '@/lib/search';

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const db = await connect();
  const mission = await db.collection(COLLECTIONS.missions).findOne({ _id: session.mission_id });
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  if (session.notepad?.candidate_sources?.length) {
    return NextResponse.json({ sources: session.notepad.candidate_sources });
  }

  const query = session.notepad?.refined_query || mission.topic;
  try {
    const [web, ai] = await Promise.all([
      webSearch(query, mission.topic),
      aiSearch(query, mission.topic),
    ]);
    const sources = [...web, ...ai];

    await db
      .collection(COLLECTIONS.sessions)
      .updateOne(
        { _id: session._id },
        { $set: { 'notepad.candidate_sources': sources, last_active_at: new Date() } },
      );

    return NextResponse.json({ sources });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
