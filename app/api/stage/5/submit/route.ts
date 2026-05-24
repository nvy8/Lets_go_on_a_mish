import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
  if (session.current_stage !== 5) {
    return NextResponse.json({ error: 'Wrong stage' }, { status: 409 });
  }

  const { picks } = (await req.json()) as { picks: Record<string, number> };
  if (!picks) return NextResponse.json({ error: 'picks required' }, { status: 400 });

  const items = (session.notepad?.hallucinations || []) as Array<{
    fact_id: string;
    correct_index: number;
  }>;

  let correctCount = 0;
  for (const item of items) {
    if (picks[item.fact_id] === item.correct_index) correctCount++;
  }
  // Guard against awarding the badge for an empty submission. Without the
  // `items.length > 0` check, a session with zero hallucination items (e.g.
  // a kid who never triangulated any fact in Stage 3) would receive the
  // badge for posting `picks: {}` — every facet of the comparison is
  // vacuously true.
  const earnedBadge = items.length > 0 && correctCount === items.length;

  // Conditional-spread so unanswered items don't get `kid_pick_index: undefined`
  // (which serializes to `null` in Mongo and then satisfies the
  // `h.kid_pick_index !== undefined` completion check in the teacher analytics).
  const updatedItems = items.map((item) => ({
    ...item,
    ...(picks[item.fact_id] !== undefined ? { kid_pick_index: picks[item.fact_id] } : {}),
  }));

  const db = await connect();
  await db.collection(COLLECTIONS.sessions).updateOne(
    { _id: session._id },
    {
      $set: {
        'notepad.hallucinations': updatedItems,
        current_stage: 5, // stay on 5, just unlock complete page
        'notepad.stage6_score': { correct: correctCount, total: items.length },
        last_active_at: new Date(),
      },
      ...(earnedBadge ? { $addToSet: { badges_earned: 'Hallucination Hunter' } } : {}),
    },
  );

  return NextResponse.json({
    correct: correctCount,
    total: items.length,
    earned_badge: earnedBadge,
  });
}
