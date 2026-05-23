import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { fetchPreview } from '@/lib/scrape';
import { webSearch, aiSearch } from '@/lib/search';
import type { SourceEntry } from '@/lib/types';

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const db = await connect();
  let candidates: SourceEntry[] = session.notepad?.candidate_sources || [];

  // Fallback: if Stage 1's background search failed, run it here
  if (!candidates.length) {
    const mission = await db.collection(COLLECTIONS.missions).findOne({ _id: session.mission_id });
    if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    const query = session.notepad?.refined_query || mission.topic;
    try {
      const [web, ai] = await Promise.all([
        webSearch(query, mission.topic),
        aiSearch(query, mission.topic),
      ]);
      candidates = [...web, ...ai];
      await db
        .collection(COLLECTIONS.sessions)
        .updateOne(
          { _id: session._id },
          { $set: { 'notepad.candidate_sources': candidates } },
        );
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to generate candidate sources: ' + (err as Error).message },
        { status: 500 },
      );
    }
  }

  // Cached previews?
  if (
    session.notepad?.previews &&
    Object.keys(session.notepad.previews).length === candidates.length
  ) {
    return NextResponse.json({ previews: session.notepad.previews });
  }

  const fetched = await Promise.all(
    candidates.map(async (c) => {
      const p = await fetchPreview(c.url, c.preview_text);
      return [c.id, p] as const;
    }),
  );
  const previews = Object.fromEntries(fetched);

  await db
    .collection(COLLECTIONS.sessions)
    .updateOne(
      { _id: session._id },
      { $set: { 'notepad.previews': previews, last_active_at: new Date() } },
    );

  return NextResponse.json({ previews });
}
