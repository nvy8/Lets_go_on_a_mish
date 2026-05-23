import { MongoClient, Db, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'TEMP_HACKATHON';

export const COLLECTIONS = {
  teachers: 'teachers',
  missions: 'missions',
  sessions: 'sessions',
} as const;

let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<Db> | null = null;

export async function connect(): Promise<Db> {
  if (db) return db;
  if (connecting) return connecting;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

  connecting = (async () => {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    await ensureIndexes(db);
    return db;
  })();

  return connecting;
}

async function ensureIndexes(db: Db) {
  try {
    await db.collection(COLLECTIONS.teachers).createIndex({ email: 1 }, { unique: true });
    await db.collection(COLLECTIONS.missions).createIndex({ share_token: 1 }, { unique: true });
    await db.collection(COLLECTIONS.missions).createIndex({ teacher_id: 1 });
    await db.collection(COLLECTIONS.sessions).createIndex({ session_token: 1 }, { unique: true });
    await db.collection(COLLECTIONS.sessions).createIndex({ mission_id: 1 });
    await db.collection(COLLECTIONS.sessions).createIndex(
      { last_active_at: 1 },
      { expireAfterSeconds: 30 * 24 * 60 * 60 },
    );
  } catch (err) {
    console.warn('[DB] index ensure failed:', (err as Error).message);
  }
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected — call connect() first');
  return db;
}

export { DB_NAME, ObjectId };
