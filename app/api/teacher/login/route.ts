import { NextRequest, NextResponse } from 'next/server';
import { connect, COLLECTIONS } from '@/lib/db';
import { verifyPassword, signTeacherToken, cookieOptions, TEACHER_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const db = await connect();
    const teacher = await db
      .collection(COLLECTIONS.teachers)
      .findOne({ email: email.toLowerCase() });

    if (!teacher) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await verifyPassword(password, teacher.password);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await db
      .collection(COLLECTIONS.teachers)
      .updateOne({ _id: teacher._id }, { $set: { last_login: new Date() } });

    const token = signTeacherToken(teacher._id.toString(), teacher.email);
    const res = NextResponse.json({ ok: true, teacherId: teacher._id.toString() });
    res.cookies.set(TEACHER_COOKIE, token, cookieOptions(7));
    return res;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
