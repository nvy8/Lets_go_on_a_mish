// One-time backfill: set mission_type_slug='sources-vetting' on any existing
// missions that don't have it, and audience_role='teacher' as default.
// Idempotent — safe to run multiple times.
//
// Usage: node --env-file=.env.local scripts/backfill-mission-type.mjs

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const col = client.db('TEMP_HACKATHON').collection('missions');

  const updatedType = await col.updateMany(
    { mission_type_slug: { $exists: false } },
    { $set: { mission_type_slug: 'sources-vetting' } },
  );
  const updatedRole = await col.updateMany(
    { audience_role: { $exists: false } },
    { $set: { audience_role: 'teacher' } },
  );

  console.log(`backfilled mission_type_slug on ${updatedType.modifiedCount} missions`);
  console.log(`backfilled audience_role on ${updatedRole.modifiedCount} missions`);

  const total = await col.countDocuments();
  console.log(`total missions in DB: ${total}`);
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
} finally {
  await client.close();
}
