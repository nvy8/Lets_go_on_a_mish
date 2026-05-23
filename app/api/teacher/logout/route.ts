import { NextResponse } from 'next/server';
import { TEACHER_COOKIE } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(TEACHER_COOKIE);
  return res;
}
