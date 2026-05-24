import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { webSearch, aiSearch } from '@/lib/search';

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
  if (session.current_stage !== 1) {
    return NextResponse.json({ error: 'Wrong stage' }, { status: 409 });
  }

  const { refined_query } = await req.json();
  if (!refined_query || typeof refined_query !== 'string' || refined_query.length < 5) {
    return NextResponse.json({ error: 'refined_query required' }, { status: 400 });
  }

  const db = await connect();
  const mission = await db.collection(COLLECTIONS.missions).findOne({ _id: session.mission_id });
  if (!mission) return NextResponse.json({ error: 'Mish not found' }, { status: 404 });

  // Save query immediately and advance stage so kid lands on new Stage 2
  await db.collection(COLLECTIONS.sessions).updateOne(
    { _id: session._id },
    {
      $set: {
        'notepad.refined_query': refined_query.trim(),
        current_stage: 2,
        last_active_at: new Date(),
      },
      $addToSet: { badges_earned: 'Query Designer' },
    },
  );

  // Kick off candidate-source generation in the background.
  // The new Stage 2's previews endpoint will wait on this if needed (or call again).
  // For now we do it inline — kid will hit Stage 2 loading state and see results when ready.
  if (!session.notepad?.candidate_sources?.length) {
    try {
      const [web, ai] = await Promise.all([
        webSearch(refined_query.trim(), mission.topic),
        aiSearch(refined_query.trim(), mission.topic),
      ]);
      const candidate_sources = [...web, ...ai];
      await db
        .collection(COLLECTIONS.sessions)
        .updateOne(
          { _id: session._id },
          { $set: { 'notepad.candidate_sources': candidate_sources } },
        );
    } catch (err) {
      // Non-fatal — Stage 2 will try again if needed
      console.error('Background candidate generation failed:', (err as Error).message);
    }
  }

  return NextResponse.json({ ok: true });
}
