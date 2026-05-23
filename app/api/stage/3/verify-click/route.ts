import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { runClaudeJSON } from '@/lib/llm';
import { verifyClickPrompt } from '@/lib/prompts/stage3';
import type { SourceEntry, FactEntry } from '@/lib/types';

type VerifyResp = { supported: boolean; reason: string };

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { fact_id, source_id } = await req.json();
  if (!fact_id || !source_id) {
    return NextResponse.json({ error: 'fact_id and source_id required' }, { status: 400 });
  }

  const facts: FactEntry[] = session.notepad?.facts || [];
  const fact = facts.find((f) => f.id === fact_id);
  if (!fact) return NextResponse.json({ error: 'Fact not found' }, { status: 404 });

  const candidates: SourceEntry[] = session.notepad?.candidate_sources || [];
  const source = candidates.find((c) => c.id === source_id);
  if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 });

  const previews = (session.notepad?.previews || {}) as Record<
    string,
    { title: string; preview_text: string }
  >;
  const sourceTitle = previews[source_id]?.title || source.title;
  const sourceText = previews[source_id]?.preview_text || source.preview_text;

  let aiResp: VerifyResp;
  try {
    aiResp = await runClaudeJSON<VerifyResp>(
      verifyClickPrompt(fact.plain_text, sourceTitle, sourceText),
      { timeoutMs: 45_000 },
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const db = await connect();
  // Persist server-side verified click
  const update: Record<string, unknown> = {
    [`notepad.facts.$.source_clicks.${source_id}`]: true,
    [`notepad.facts.$.source_clicks_verified.${source_id}`]: aiResp.supported,
    last_active_at: new Date(),
  };
  await db
    .collection(COLLECTIONS.sessions)
    .updateOne(
      { _id: session._id, 'notepad.facts.id': fact_id },
      { $set: update },
    );

  return NextResponse.json({ supported: aiResp.supported, reason: aiResp.reason });
}
