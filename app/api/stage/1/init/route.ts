import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { runClaudeJSON } from '@/lib/llm';
import { generateExamplesPrompt } from '@/lib/prompts/stage1';

type ExamplesResp = {
  examples: Array<{ quality: 'bad' | 'ok' | 'strong'; text: string }>;
};

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const db = await connect();
  const mission = await db.collection(COLLECTIONS.missions).findOne({ _id: session.mission_id });
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  if (session.notepad?.stage1_examples) {
    return NextResponse.json({ examples: session.notepad.stage1_examples });
  }

  try {
    const data = await runClaudeJSON<ExamplesResp>(generateExamplesPrompt(mission.topic), {
      timeoutMs: 90_000,
    });
    if (!data?.examples || data.examples.length !== 3) {
      return NextResponse.json({ error: 'Bad LLM response' }, { status: 500 });
    }

    const shuffled = [...data.examples].sort(() => Math.random() - 0.5);

    await db
      .collection(COLLECTIONS.sessions)
      .updateOne(
        { _id: session._id },
        { $set: { 'notepad.stage1_examples': shuffled, last_active_at: new Date() } },
      );

    return NextResponse.json({ examples: shuffled });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
