import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

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
  const earnedBadge = correctCount === items.length;

  const updatedItems = items.map((item) => ({
    ...item,
    kid_pick_index: picks[item.fact_id],
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
