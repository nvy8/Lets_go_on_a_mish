import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { runClaudeJSON } from '@/lib/llm';
import { gradeExplanationPrompt } from '@/lib/prompts/stage4';
import type { FactEntry, SourceEntry } from '@/lib/types';

type GradeResp = {
  grade: 'exceeding' | 'meeting' | 'approaching' | 'far_from';
  feedback: string;
};

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { fact_id, explanation } = await req.json();
  if (!fact_id || !explanation || explanation.length < 10) {
    return NextResponse.json(
      { error: 'fact_id and explanation (≥10 chars) required' },
      { status: 400 },
    );
  }

  const facts: FactEntry[] = session.notepad?.facts || [];
  const fact = facts.find((f) => f.id === fact_id);
  if (!fact) return NextResponse.json({ error: 'Fact not found' }, { status: 404 });

  const candidates: SourceEntry[] = session.notepad?.candidate_sources || [];
  const verifiedIds: string[] = session.notepad?.verified_source_ids || [];
  const previews = (session.notepad?.previews || {}) as Record<
    string,
    { preview_text: string }
  >;
  const sourceTexts = candidates
    .filter((c) => verifiedIds.includes(c.id))
    .map((c) => previews[c.id]?.preview_text || c.preview_text)
    .filter(Boolean);

  let resp: GradeResp;
  try {
    resp = await runClaudeJSON<GradeResp>(
      gradeExplanationPrompt(fact.plain_text, explanation, sourceTexts),
      { timeoutMs: 60_000 },
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const db = await connect();
  await db.collection(COLLECTIONS.sessions).updateOne(
    { _id: session._id, 'notepad.facts.id': fact_id },
    {
      $set: {
        'notepad.facts.$.kid_explanation': explanation,
        'notepad.facts.$.ai_grade': resp.grade,
        'notepad.facts.$.ai_feedback': resp.feedback,
        last_active_at: new Date(),
      },
    },
  );

  return NextResponse.json(resp);
}
