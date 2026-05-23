import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import type { FactEntry } from '@/lib/types';

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const facts: FactEntry[] = session.notepad?.facts || [];
  const triangulated = facts.filter((f) => f.triangulated);
  const allGraded = triangulated.every((f) => f.ai_grade);
  if (!allGraded) {
    return NextResponse.json({ error: 'Grade all facts first' }, { status: 400 });
  }

  const allMeetingPlus = triangulated.every(
    (f) => f.ai_grade === 'meeting' || f.ai_grade === 'exceeding',
  );

  const db = await connect();
  await db.collection(COLLECTIONS.sessions).updateOne(
    { _id: session._id },
    {
      $set: {
        current_stage: 5,
        last_active_at: new Date(),
      },
      ...(allMeetingPlus ? { $addToSet: { badges_earned: 'Wordsmith' } } : {}),
    },
  );

  return NextResponse.json({ earned_badge: allMeetingPlus });
}
