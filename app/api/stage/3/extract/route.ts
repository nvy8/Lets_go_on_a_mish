import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { runClaudeJSON } from '@/lib/llm';
import { extractFactsPrompt } from '@/lib/prompts/stage3';
import type { SourceEntry, FactEntry, EvidencePiece } from '@/lib/types';

type RawEvidence = { source_id: string; snippet: string; supports: boolean };
type ExtractResp = {
  facts: Array<{ id: string; plain_text: string; evidence: RawEvidence[] }>;
};

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

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

  const clientSources = verifiedSources.map((s) => ({
    id: s.id,
    url: s.url,
    domain: s.domain,
    title: previews[s.id]?.title || s.title,
  }));

  // Cache hit: facts exist AND have new evidence shape
  const cached = session.notepad?.facts as FactEntry[] | undefined;
  const cachedFresh =
    cached?.length && Array.isArray(cached[0].evidence) && (cached[0].evidence?.length ?? 0) > 0;
  if (cachedFresh) {
    return NextResponse.json({ facts: cached, sources: clientSources });
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

  if (!aiResp?.facts || aiResp.facts.length < 3) {
    return NextResponse.json({ error: 'Bad LLM response' }, { status: 500 });
  }

  const validSourceIds = new Set(verifiedSources.map((s) => s.id));
  const facts: FactEntry[] = [];
  const groundTruth: Record<string, Record<string, boolean>> = {};

  for (const f of aiResp.facts.slice(0, 5)) {
    const evidence: EvidencePiece[] = [];
    const truthForFact: Record<string, boolean> = {};

    for (const ev of f.evidence || []) {
      if (!validSourceIds.has(ev.source_id)) continue;
      evidence.push({ source_id: ev.source_id, snippet: ev.snippet });
      truthForFact[ev.source_id] = !!ev.supports;
    }

    if (evidence.length < 2) continue; // need enough sources to triangulate
    facts.push({
      id: f.id,
      plain_text: f.plain_text,
      evidence,
      source_clicks: {},
      source_clicks_verified: {},
    });
    groundTruth[f.id] = truthForFact;
  }

  if (facts.length < 3) {
    return NextResponse.json({ error: 'Could not extract enough facts' }, { status: 500 });
  }

  await db.collection(COLLECTIONS.sessions).updateOne(
    { _id: session._id },
    {
      $set: {
        'notepad.facts': facts,
        'notepad.fact_ground_truth_evidence': groundTruth,
        last_active_at: new Date(),
      },
    },
  );

  return NextResponse.json({ facts, sources: clientSources });
}
