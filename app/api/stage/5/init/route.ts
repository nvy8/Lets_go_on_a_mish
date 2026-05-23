import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { runClaudeJSON } from '@/lib/llm';
import { generateHallucinationOptionsPrompt } from '@/lib/prompts/stage5';
import type { FactEntry, SourceEntry } from '@/lib/types';

type GenResp = {
  options: Array<{
    kind: 'clean' | 'factual_error' | 'ai_tell' | 'both';
    text: string;
    teach_note: string;
  }>;
};

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  if (session.notepad?.hallucinations?.length) {
    return NextResponse.json({ items: session.notepad.hallucinations });
  }

  const facts: FactEntry[] = session.notepad?.facts || [];
  const triangulated = facts.filter((f) => f.triangulated);
  if (!triangulated.length) {
    return NextResponse.json({ error: 'No triangulated facts' }, { status: 400 });
  }

  const candidates: SourceEntry[] = session.notepad?.candidate_sources || [];
  const verifiedIds: string[] = session.notepad?.verified_source_ids || [];
  const previews = (session.notepad?.previews || {}) as Record<
    string,
    { preview_text: string }
  >;
  const sourceContext = candidates
    .filter((c) => verifiedIds.includes(c.id))
    .map((c) => previews[c.id]?.preview_text || c.preview_text)
    .join('\n\n');

  const items: Array<{
    fact_id: string;
    fact_text: string;
    options: GenResp['options'];
    correct_index: number;
  }> = [];

  for (const f of triangulated) {
    try {
      const resp = await runClaudeJSON<GenResp>(
        generateHallucinationOptionsPrompt(f.plain_text, sourceContext),
        { timeoutMs: 60_000 },
      );
      if (resp?.options?.length === 4) {
        const correctIndex = resp.options.findIndex((o) => o.kind === 'clean');
        if (correctIndex >= 0) {
          items.push({
            fact_id: f.id,
            fact_text: f.plain_text,
            options: resp.options,
            correct_index: correctIndex,
          });
        }
      }
    } catch (err) {
      console.error('hallucination gen failed for', f.id, (err as Error).message);
    }
  }

  if (!items.length) {
    return NextResponse.json({ error: 'Failed to generate options' }, { status: 500 });
  }

  const db = await connect();
  await db
    .collection(COLLECTIONS.sessions)
    .updateOne(
      { _id: session._id },
      { $set: { 'notepad.hallucinations': items, last_active_at: new Date() } },
    );

  return NextResponse.json({ items });
}
