import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import type { FactEntry, SourceEntry } from '@/lib/types';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const allFacts: FactEntry[] = session.notepad?.facts || [];
  const triangulated = allFacts.filter((f) => f.triangulated);
  const candidates: SourceEntry[] = session.notepad?.candidate_sources || [];
  const verifiedIds: string[] = session.notepad?.verified_source_ids || [];

  return NextResponse.json({
    facts: triangulated.map((f) => ({
      id: f.id,
      plain_text: f.plain_text,
      kid_explanation: f.kid_explanation,
      ai_grade: f.ai_grade,
      ai_feedback: f.ai_feedback,
    })),
    sources: candidates
      .filter((c) => verifiedIds.includes(c.id))
      .map((s) => ({ id: s.id, title: s.title, domain: s.domain })),
  });
}
