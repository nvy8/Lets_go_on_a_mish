import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import type { FactEntry } from '@/lib/types';

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
  if (session.current_stage !== 4) {
    return NextResponse.json({ error: 'Wrong stage' }, { status: 409 });
  }

  const facts: FactEntry[] = session.notepad?.facts || [];
  const triangulated = facts.filter((f) => f.triangulated);
  // Guard the vacuous-true case: `[].every(...)` is true, which would let a
  // kid with zero triangulated facts slip into Stage 5 (where init then 500s
  // and the loading spinner spins forever).
  if (!triangulated.length) {
    return NextResponse.json({ error: 'No triangulated facts to grade' }, { status: 400 });
  }
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
