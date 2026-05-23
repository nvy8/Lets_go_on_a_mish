import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
  const db = await connect();
  await db
    .collection(COLLECTIONS.sessions)
    .updateOne(
      { _id: session._id },
      { $set: { current_stage: 3, last_active_at: new Date() } },
    );
  return NextResponse.json({ ok: true });
}
