import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { runClaudeJSON } from '@/lib/llm';
import { extractFactsPrompt } from '@/lib/prompts/stage4';
import type { SourceEntry, FactEntry } from '@/lib/types';

type ExtractResp = {
  facts: Array<{ id: string; plain_text: string; appears_in: string[] }>;
};

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  if (session.notepad?.facts?.length) {
    const verifiedIds: string[] = session.notepad?.verified_source_ids || [];
    const candidates: SourceEntry[] = session.notepad?.candidate_sources || [];
    const previews = (session.notepad?.previews || {}) as Record<
      string,
      { title: string; preview_text: string }
    >;
    const sources = candidates
      .filter((c) => verifiedIds.includes(c.id))
      .map((s) => ({
        id: s.id,
        url: s.url,
        domain: s.domain,
        title: previews[s.id]?.title || s.title,
        text: previews[s.id]?.preview_text || s.preview_text,
      }));
    return NextResponse.json({ facts: session.notepad.facts, sources });
  }

  const verifiedIds: string[] = session.notepad?.verified_source_ids || [];
  const candidates: SourceEntry[] = session.notepad?.candidate_sources || [];
  const previews = (session.notepad?.previews || {}) as Record<
    string,
    { url: string; title: string; preview_text: string; domain: string; fetched_ok: boolean }
  >;

  const verifiedSources = candidates.filter((c) => verifiedIds.includes(c.id));
  if (verifiedSources.length < 3) {
    return NextResponse.json({ error: 'Need 3 verified sources first' }, { status: 400 });
  }

  const db = await connect();
  const mission = await db.collection(COLLECTIONS.missions).findOne({ _id: session.mission_id });
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  const forExtract = verifiedSources.map((s) => {
    const p = previews[s.id];
    return {
      id: s.id,
      url: s.url,
      domain: s.domain,
      title: p?.title || s.title,
      text: p?.preview_text || s.preview_text,
    };
  });

  let aiResp: ExtractResp;
  try {
    aiResp = await runClaudeJSON<ExtractResp>(extractFactsPrompt(mission.topic, forExtract), {
      timeoutMs: 120_000,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  if (!aiResp?.facts || aiResp.facts.length < 5) {
    return NextResponse.json({ error: 'Bad LLM response' }, { status: 500 });
  }

  const facts: FactEntry[] = aiResp.facts.slice(0, 10).map((f) => ({
    id: f.id,
    plain_text: f.plain_text,
    source_clicks: {}, // kid hasn't clicked anything yet
    source_clicks_verified: {}, // server-validated
    // We store the ground truth (which sources it actually appears in) but don't expose to client
  }));

  // Save ground-truth separately so client doesn't see it
  const groundTruth: Record<string, string[]> = {};
  for (const f of aiResp.facts) groundTruth[f.id] = f.appears_in || [];

  await db.collection(COLLECTIONS.sessions).updateOne(
    { _id: session._id },
    {
      $set: {
        'notepad.facts': facts,
        'notepad.fact_ground_truth': groundTruth,
        last_active_at: new Date(),
      },
    },
  );

  return NextResponse.json({
    facts,
    sources: forExtract.map((s) => ({
      id: s.id,
      url: s.url,
      domain: s.domain,
      title: s.title,
      text: s.text,
    })),
  });
}

