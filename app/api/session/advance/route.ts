// Generic session-advance endpoint used by ChoreCheck, DopamineReset, Reading
// Drill, and any future mission types that don't need stage-specific server logic.
//
// POST body: { badge_slug?: string, complete?: boolean }
// - increments current_stage by 1
// - optionally awards badge (added to badges_earned, deduped)
// - if complete: true, sets completed_at + does NOT increment further

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { badge_slug, complete } = body as { badge_slug?: string; complete?: boolean };

  const db = await connect();
  const now = new Date();
  const update: Record<string, unknown> = { last_active_at: now };
  if (complete) {
    update.completed_at = now;
  } else {
    update.current_stage = (session.current_stage || 1) + 1;
  }

  const setExpr: Record<string, unknown> = { $set: update };
  if (badge_slug && typeof badge_slug === 'string') {
    setExpr.$addToSet = { badges_earned: badge_slug };
  }

  await db.collection(COLLECTIONS.sessions).updateOne({ _id: session._id }, setExpr);

  return NextResponse.json({
    ok: true,
    current_stage: complete ? session.current_stage : (session.current_stage || 1) + 1,
    completed: !!complete,
  });
}
