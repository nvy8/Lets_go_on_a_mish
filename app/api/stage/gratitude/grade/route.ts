// Stage handler for DopamineReset's gratitude stage.
// Takes 3 user-written gratitude entries, returns a short gentle reflection.

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { runClaudeJSON } from '@/lib/llm';

type GradeResp = { feedback: string };

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { entries } = await req.json();
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: 'entries required (array of strings)' }, { status: 400 });
  }

  const safe = entries
    .filter((e) => typeof e === 'string' && e.trim().length > 0)
    .slice(0, 5)
    .map((e) => (e as string).slice(0, 200));

  if (safe.length === 0) {
    return NextResponse.json({ feedback: 'Take a moment — write at least one thing.' });
  }

  const prompt = `A 9-14 year old just wrote down ${safe.length} thing(s) they're grateful for as part of a calm-down exercise.

Their entries:
${safe.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Reply with ONE warm, encouraging sentence (max 20 words) that gently acknowledges what they wrote. Be specific — pick out one of their entries to highlight. Don't praise effusively. Don't moralize.

Return ONLY this JSON:
{"feedback": "..."}`;

  try {
    const resp = await runClaudeJSON<GradeResp>(prompt, { timeoutMs: 30_000 });
    return NextResponse.json({
      feedback: resp.feedback || 'Nice — that\'s a good list.',
    });
  } catch {
    return NextResponse.json({ feedback: 'Nice list — keep going.' });
  }
}
