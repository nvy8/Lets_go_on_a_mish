import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { refined_query } = await req.json();
  if (!refined_query || typeof refined_query !== 'string' || refined_query.length < 5) {
    return NextResponse.json({ error: 'refined_query required' }, { status: 400 });
  }

  const db = await connect();
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
  return NextResponse.json({ ok: true });
}
