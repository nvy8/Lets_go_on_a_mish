import { NextRequest, NextResponse } from 'next/server';
import { connect, COLLECTIONS } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const db = await connect();
  const mission = await db.collection(COLLECTIONS.missions).findOne({ share_token: shareToken });
  if (!mission) return NextResponse.json({ error: 'Mish not found' }, { status: 404 });
  return NextResponse.json({
    mission: {
      title: mission.title,
      topic: mission.topic,
    },
  });
}
