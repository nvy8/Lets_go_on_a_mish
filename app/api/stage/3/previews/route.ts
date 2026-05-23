import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { connect, COLLECTIONS } from '@/lib/db';
import { fetchPreview } from '@/lib/scrape';
import type { SourceEntry } from '@/lib/types';

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const candidates: SourceEntry[] = session.notepad?.candidate_sources || [];
  if (!candidates.length) {
    return NextResponse.json({ error: 'No candidate sources' }, { status: 400 });
  }

  // Cached?
  if (session.notepad?.previews && Object.keys(session.notepad.previews).length === candidates.length) {
    return NextResponse.json({ previews: session.notepad.previews });
  }

  const fetched = await Promise.all(
    candidates.map(async (c) => {
      const p = await fetchPreview(c.url, c.preview_text);
      return [c.id, p] as const;
    }),
  );
  const previews = Object.fromEntries(fetched);

  const db = await connect();
  await db
    .collection(COLLECTIONS.sessions)
    .updateOne(
      { _id: session._id },
      { $set: { 'notepad.previews': previews, last_active_at: new Date() } },
    );

  return NextResponse.json({ previews });
}
