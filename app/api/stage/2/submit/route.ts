import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { selected_ids } = await req.json();
  if (!Array.isArray(selected_ids) || selected_ids.length !== 3) {
    return NextResponse.json({ error: 'Must select exactly 3 sources' }, { status: 400 });
  }

  const candidates = session.notepad?.candidate_sources || [];
  const candidateIds = new Set(candidates.map((c: { id: string }) => c.id));
  const allValid = selected_ids.every((id: string) => candidateIds.has(id));
  if (!allValid) return NextResponse.json({ error: 'Invalid source ids' }, { status: 400 });

  const db = await connect();
  await db.collection(COLLECTIONS.sessions).updateOne(
    { _id: session._id },
    {
      $set: {
        'notepad.selected_source_ids': selected_ids,
        current_stage: 3,
        last_active_at: new Date(),
      },
    },
  );
  return NextResponse.json({ ok: true });
}
