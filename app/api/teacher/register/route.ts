import { NextRequest, NextResponse } from 'next/server';
import { connect, COLLECTIONS } from '@/lib/db';
import { hashPassword, signTeacherToken, cookieOptions, TEACHER_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: 'Email and password (min 8 chars) required' },
        { status: 400 },
      );
    }

    const db = await connect();
    const teachers = db.collection(COLLECTIONS.teachers);

    const existing = await teachers.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const now = new Date();
    const result = await teachers.insertOne({
      email: email.toLowerCase(),
      password: hashed,
      created_at: now,
      last_login: now,
    });

    const token = signTeacherToken(result.insertedId.toString(), email.toLowerCase());
    const res = NextResponse.json({ ok: true, teacherId: result.insertedId.toString() });
    res.cookies.set(TEACHER_COOKIE, token, cookieOptions(7));
    return res;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
