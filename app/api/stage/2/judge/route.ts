import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { runClaudeJSON } from '@/lib/llm';
import { judgeSourcesPrompt } from '@/lib/prompts/stage2';
import type { SourceEntry } from '@/lib/types';

type Judgment = { id: string; verdict: 'legit' | 'sus'; one_line_reason: string };
type JudgeResp = { judgments: Judgment[]; top_3_ids: string[] };

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { kid_verdicts } = (await req.json()) as {
    kid_verdicts: Record<string, 'legit' | 'sus'>;
  };
  if (!kid_verdicts || typeof kid_verdicts !== 'object') {
    return NextResponse.json({ error: 'kid_verdicts required' }, { status: 400 });
  }

  const candidates: SourceEntry[] = session.notepad?.candidate_sources || [];
  const previews = (session.notepad?.previews || {}) as Record<
    string,
    { url: string; domain: string; title: string; preview_text: string; fetched_ok: boolean }
  >;

  if (!candidates.length) {
    return NextResponse.json({ error: 'No candidates' }, { status: 400 });
  }

  const db = await connect();
  const mission = await db.collection(COLLECTIONS.missions).findOne({ _id: session.mission_id });
  if (!mission) return NextResponse.json({ error: 'Mish not found' }, { status: 404 });

  const judgeInput = candidates.map((c) => {
    const p = previews[c.id];
    return {
      id: c.id,
      url: c.url,
      domain: p?.domain || c.domain,
      title: p?.title || c.title,
      snippet: (p?.preview_text || c.preview_text).slice(0, 300),
      fetched_ok: p?.fetched_ok ?? false,
    };
  });

  let aiResp: JudgeResp;
  try {
    aiResp = await runClaudeJSON<JudgeResp>(judgeSourcesPrompt(mission.topic, judgeInput), {
      timeoutMs: 90_000,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  if (!aiResp?.judgments || !aiResp?.top_3_ids || aiResp.top_3_ids.length !== 3) {
    return NextResponse.json({ error: 'Bad LLM response' }, { status: 500 });
  }

  const aiVerdictById: Record<string, Judgment> = {};
  for (const j of aiResp.judgments) aiVerdictById[j.id] = j;

  let agreeCount = 0;
  for (const c of candidates) {
    const kid = kid_verdicts[c.id];
    const ai = aiVerdictById[c.id]?.verdict;
    if (kid && ai && kid === ai) agreeCount++;
  }

  const earnedBadge = agreeCount >= 7;

  const updateCandidates = candidates.map((c) => ({
    ...c,
    kid_verdict: kid_verdicts[c.id] || undefined,
    ai_verdict: aiVerdictById[c.id]?.verdict,
    ai_reasoning: aiVerdictById[c.id]?.one_line_reason,
  }));

  await db.collection(COLLECTIONS.sessions).updateOne(
    { _id: session._id },
    {
      $set: {
        'notepad.candidate_sources': updateCandidates,
        'notepad.verified_source_ids': aiResp.top_3_ids,
        'notepad.stage3_score': { agree: agreeCount, total: candidates.length },
        last_active_at: new Date(),
      },
      ...(earnedBadge ? { $addToSet: { badges_earned: 'URL Detective' } } : {}),
    },
  );

  return NextResponse.json({
    judgments: aiResp.judgments,
    top_3_ids: aiResp.top_3_ids,
    agree_count: agreeCount,
    total: candidates.length,
    earned_badge: earnedBadge,
  });
}
