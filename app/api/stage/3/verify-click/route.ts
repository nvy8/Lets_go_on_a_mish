import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import type { FactEntry } from '@/lib/types';

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { fact_id, source_id, kid_answer } = await req.json();
  if (!fact_id || !source_id || (kid_answer !== 'yes' && kid_answer !== 'no')) {
    return NextResponse.json(
      { error: 'fact_id, source_id, kid_answer (yes|no) required' },
      { status: 400 },
    );
  }

  const facts: FactEntry[] = session.notepad?.facts || [];
  const fact = facts.find((f) => f.id === fact_id);
  if (!fact) return NextResponse.json({ error: 'Fact not found' }, { status: 404 });

  const truthMap = (session.notepad?.fact_ground_truth_evidence || {}) as Record<
    string,
    Record<string, boolean>
  >;
  const truth = truthMap[fact_id]?.[source_id];
  if (typeof truth !== 'boolean') {
    return NextResponse.json({ error: 'Ground truth missing for this pair' }, { status: 500 });
  }

  const kidSaidYes = kid_answer === 'yes';
  const correct = kidSaidYes === truth;

  // "verified" = the kid said YES AND the snippet actually supports the fact.
  // A correct NO is "correct" but does NOT count toward triangulation.
  const verified = kidSaidYes && truth;

  const db = await connect();
  await db
    .collection(COLLECTIONS.sessions)
    .updateOne(
      { _id: session._id, 'notepad.facts.id': fact_id },
      {
        $set: {
          [`notepad.facts.$.source_clicks.${source_id}`]: kid_answer,
          [`notepad.facts.$.source_clicks_verified.${source_id}`]: verified,
          last_active_at: new Date(),
        },
      },
    );

  const hint = !correct
    ? truth
      ? 'Read again — this snippet actually does back the fact. Look for the matching idea.'
      : `Look again — this snippet is on the topic but doesn't really say "${fact.plain_text}".`
    : undefined;

  return NextResponse.json({ correct, verified, hint });
}
