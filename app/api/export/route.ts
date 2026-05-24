import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import type { SourceEntry, FactEntry } from '@/lib/types';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const db = await connect();
  const mission = await db.collection(COLLECTIONS.missions).findOne({ _id: session.mission_id });
  if (!mission) return NextResponse.json({ error: 'Mish not found' }, { status: 404 });

  const allFacts: FactEntry[] = session.notepad?.facts || [];
  const triangulated = allFacts.filter((f) => f.triangulated);
  const candidates: SourceEntry[] = session.notepad?.candidate_sources || [];
  const verifiedIds: string[] = session.notepad?.verified_source_ids || [];
  const verifiedSources = candidates.filter((c) => verifiedIds.includes(c.id));

  return NextResponse.json({
    display_name: session.display_name,
    mission: { title: mission.title, topic: mission.topic },
    refined_query: session.notepad?.refined_query || null,
    badges: session.badges_earned || [],
    sources: verifiedSources.map((s) => ({
      url: s.url,
      title: s.title,
      domain: s.domain,
    })),
    facts: triangulated.map((f) => ({
      fact: f.plain_text,
      explanation: f.kid_explanation,
      grade: f.ai_grade,
    })),
    hallucination_score: session.notepad?.stage6_score,
    source_score: session.notepad?.stage3_score,
  });
}
