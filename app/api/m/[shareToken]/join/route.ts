import { NextRequest, NextResponse } from 'next/server';
import { connect, COLLECTIONS } from '@/lib/db';
import { signSessionToken, cookieOptions, SESSION_COOKIE } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  try {
    const { shareToken } = await params;
    const { display_name } = await req.json();
    if (!display_name || typeof display_name !== 'string' || display_name.length > 30) {
      return NextResponse.json(
        { error: 'display_name required (1-30 chars)' },
        { status: 400 },
      );
    }
    // PII guard: client validates this too, but a direct API call must not
    // be able to store an email or phone-shaped string as a kid's nickname.
    const trimmed = display_name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'display_name required (1-30 chars)' }, { status: 400 });
    }
    if (trimmed.includes('@') || /\d{7,}/.test(trimmed)) {
      return NextResponse.json(
        { error: 'Pick a fun nickname — no real names, emails, or contact info.' },
        { status: 400 },
      );
    }

    const db = await connect();
    const mission = await db.collection(COLLECTIONS.missions).findOne({ share_token: shareToken });
    if (!mission) return NextResponse.json({ error: 'Mish not found' }, { status: 404 });

    const now = new Date();
    const result = await db.collection(COLLECTIONS.sessions).insertOne({
      mission_id: mission._id,
      display_name: display_name.trim().slice(0, 30),
      current_stage: 1,
      badges_earned: [],
      notepad: {},
      created_at: now,
      last_active_at: now,
    });

    const token = signSessionToken(result.insertedId.toString(), mission._id.toString());
    // Patch the inserted doc with the JWT for lookup symmetry
    await db
      .collection(COLLECTIONS.sessions)
      .updateOne({ _id: result.insertedId }, { $set: { session_token: token } });

    const res = NextResponse.json({
      ok: true,
      sessionId: result.insertedId.toString(),
      mission: {
        id: mission._id.toString(),
        title: mission.title,
        topic: mission.topic,
      },
    });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(1));
    return res;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
