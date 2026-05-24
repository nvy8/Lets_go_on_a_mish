import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { runClaudeJSON } from '@/lib/llm';
import { critiqueQueryPrompt } from '@/lib/prompts/stage1';

type CritiqueResp = { verdict: 'strong' | 'needs_work'; feedback: string };

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { draft } = await req.json();
  if (!draft || typeof draft !== 'string' || draft.length < 5) {
    return NextResponse.json({ error: 'draft must be at least 5 chars' }, { status: 400 });
  }

  const db = await connect();
  const mission = await db.collection(COLLECTIONS.missions).findOne({ _id: session.mission_id });
  if (!mission) return NextResponse.json({ error: 'Mish not found' }, { status: 404 });

  try {
    const data = await runClaudeJSON<CritiqueResp>(critiqueQueryPrompt(mission.topic, draft), {
      timeoutMs: 60_000,
    });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
