// Reading Drill — stage 2: grade kid's free-text summary of the passage.

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { runClaudeJSON } from '@/lib/llm';

type GradeResp = {
  grade: 'approaching' | 'meeting' | 'exceeding' | 'far_from';
  feedback: string;
};

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { summary } = await req.json();
  if (!summary || typeof summary !== 'string' || summary.length < 10) {
    return NextResponse.json({ error: 'summary (≥10 chars) required' }, { status: 400 });
  }

  const initRaw = session.notepad?.reading_drill_init;
  const init = typeof initRaw === 'object' && initRaw !== null ? (initRaw as { passage?: string }) : null;
  const passage: string = init?.passage || '';

  const prompt = `A 9-14 year old just read this passage:
"""
${passage.slice(0, 2000)}
"""

They wrote this summary of the main ideas in their own words:
"${summary}"

Grade on:
1. own words (not copy-pasted)
2. captures the main idea
3. accurate

Award ONE of: exceeding | meeting | approaching | far_from. Be kind — even "approaching" should feel encouraging.

Return ONLY this JSON:
{"grade": "...", "feedback": "one warm sentence, max 25 words"}`;

  try {
    const data = await runClaudeJSON<GradeResp>(prompt, { timeoutMs: 60_000 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
