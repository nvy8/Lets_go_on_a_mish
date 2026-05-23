import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import type { FactEntry } from '@/lib/types';

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const facts: FactEntry[] = session.notepad?.facts || [];
  const updatedFacts = facts.map((f) => {
    const verifiedCount = Object.values(f.source_clicks_verified || {}).filter(
      Boolean,
    ).length;
    return { ...f, triangulated: verifiedCount >= 2 };
  });

  const triangulatedCount = updatedFacts.filter((f) => f.triangulated).length;
  const earnedBadge = triangulatedCount >= 2;

  const db = await connect();
  await db.collection(COLLECTIONS.sessions).updateOne(
    { _id: session._id },
    {
      $set: {
        'notepad.facts': updatedFacts,
        current_stage: 5,
        last_active_at: new Date(),
      },
      ...(earnedBadge ? { $addToSet: { badges_earned: 'Triangulator' } } : {}),
    },
  );

  return NextResponse.json({
    triangulated_count: triangulatedCount,
    earned_badge: earnedBadge,
  });
}
