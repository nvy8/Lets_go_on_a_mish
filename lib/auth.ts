import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { connect, COLLECTIONS, ObjectId } from './db';

export const TEACHER_COOKIE = 'sleuth_teacher';
export const SESSION_COOKIE = 'sleuth_session';
const TEACHER_TTL_DAYS = 7;
const SESSION_TTL_DAYS = 1;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET must be set (min 16 chars)');
  }
  return secret;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signTeacherToken(teacherId: string, email: string): string {
  return jwt.sign({ sub: teacherId, email, kind: 'teacher' }, getSecret(), {
    expiresIn: `${TEACHER_TTL_DAYS}d`,
  });
}

export function signSessionToken(sessionId: string, missionId: string): string {
  return jwt.sign({ sub: sessionId, mid: missionId, kind: 'session' }, getSecret(), {
    expiresIn: `${SESSION_TTL_DAYS}d`,
  });
}

type TokenPayload = { sub: string; kind: 'teacher' | 'session'; email?: string; mid?: string };

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload;
}

export function cookieOptions(ttlDays: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: ttlDays * 24 * 60 * 60,
    path: '/',
  };
}

export async function getCurrentTeacher() {
  const store = await cookies();
  const token = store.get(TEACHER_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    if (payload.kind !== 'teacher') return null;
    const db = await connect();
    const teacher = await db
      .collection(COLLECTIONS.teachers)
      .findOne({ _id: new ObjectId(payload.sub) });
    return teacher;
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    if (payload.kind !== 'session') return null;
    const db = await connect();
    const session = await db
      .collection(COLLECTIONS.sessions)
      .findOne({ _id: new ObjectId(payload.sub) });
    return session;
  } catch {
    return null;
  }
}
