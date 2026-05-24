// Reading Drill — stage 1 init.
// Generates a short passage (from knowledge_base_text + extracted_facts if present
// for the kid's age) plus 3 multiple-choice questions.
// Returns: { passage, questions: [{q, options[4], correct_idx}] }

import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { runClaudeJSON } from '@/lib/llm';

type Q = { q: string; options: string[]; correct_idx: number };
type InitResp = { passage: string; questions: Q[] };

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const cachedRaw = session.notepad?.reading_drill_init;
  const cached = typeof cachedRaw === 'object' && cachedRaw !== null ? (cachedRaw as InitResp) : null;
  if (cached?.passage) return NextResponse.json(cached);

  const db = await connect();
  const mission = await db.collection(COLLECTIONS.missions).findOne({ _id: session.mission_id });
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  const topic: string = mission.topic;
  const kb: string = (mission.knowledge_base_text as string) || '';
  const facts: string[] = (mission.extracted_facts as string[]) || [];

  const sourceMaterial = kb.length > 200
    ? kb.slice(0, 3500)
    : facts.length > 0
    ? facts.join('\n')
    : `Topic: ${topic}`;

  const prompt = `You are creating a short reading-comprehension exercise for a 9-14 year old student.

Topic: "${topic}"

Source material:
"""
${sourceMaterial}
"""

Write:
1. A 4-6 sentence passage about the topic, kid-friendly tone, simple words, factually grounded in the source material above
2. Exactly 3 multiple-choice questions about the passage. Each has 4 options. Mix difficulty.

Return ONLY this JSON:
{
  "passage": "...",
  "questions": [
    {"q": "...", "options": ["a","b","c","d"], "correct_idx": 0}
  ]
}`;

  try {
    const data = await runClaudeJSON<InitResp>(prompt, { timeoutMs: 90_000 });
    if (!data?.passage || !Array.isArray(data?.questions)) {
      return NextResponse.json({ error: 'Bad LLM response' }, { status: 500 });
    }
    await db
      .collection(COLLECTIONS.sessions)
      .updateOne({ _id: session._id }, { $set: { 'notepad.reading_drill_init': data } });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
