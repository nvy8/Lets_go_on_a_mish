// Idempotent seeder for built-in MissionTypes.
// Usage: node --env-file=.env.local scripts/seed-mission-types.mjs
//
// Inserts (or upserts) one or more built-in MissionType documents.
// 'sources-vetting' is the existing 5-stage Sleuth research mission, serialized
// so the platform engine treats it identically to any user-created type.

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

const DB = 'TEMP_HACKATHON';
const COL = 'mission_types';

const SOURCES_VETTING_BADGES = [
  { slug: 'query-designer', name: 'Query Designer', icon: 'lightbulb' },
  { slug: 'url-detective', name: 'URL Detective', icon: 'search' },
  { slug: 'triangulator', name: 'Triangulator', icon: 'target' },
  { slug: 'wordsmith', name: 'Wordsmith', icon: 'pencil' },
  { slug: 'hallucination-hunter', name: 'Hallucination Hunter', icon: 'shield-question' },
];

const SOURCES_VETTING = {
  slug: 'sources-vetting',
  name: 'Sources Vetting',
  description:
    'Classic research-skills loop. Kids sharpen a question, judge sources, triangulate facts across sites, explain in their own words, and spot AI hallucinations.',
  icon: 'search',
  audience: 'teacher',
  default_badges: SOURCES_VETTING_BADGES,
  stages_spec: [
    {
      id: 'query-design',
      name: 'Sharpen your question',
      description: 'Kid picks the strongest of 3 example queries, then drafts their own.',
      kind: 'pick-then-write',
      badge_on_complete: 'query-designer',
    },
    {
      id: 'investigate',
      name: 'Investigate',
      description: 'Kid opens each of 10 search results and judges Trust vs Don\'t trust.',
      kind: 'judge-list',
      badge_on_complete: 'url-detective',
    },
    {
      id: 'triangulate',
      name: 'Triangulate',
      description: 'Kid reads short snippets per source per fact, confirms yes/no.',
      kind: 'find-evidence',
      badge_on_complete: 'triangulator',
    },
    {
      id: 'explain',
      name: 'Explain',
      description: 'Kid explains each verified fact in their own words. AI grades.',
      kind: 'explain-grade',
      badge_on_complete: 'wordsmith',
    },
    {
      id: 'spot-hallucinations',
      name: 'Spot Hallucinations',
      description: '4 versions per fact — 1 real, 3 AI-tell or factual-error fakes.',
      kind: 'multiple-choice',
      badge_on_complete: 'hallucination-hunter',
    },
  ],
  is_builtin: true,
};

const BUILTINS = [SOURCES_VETTING];

const client = new MongoClient(uri);
try {
  await client.connect();
  const col = client.db(DB).collection(COL);
  for (const type of BUILTINS) {
    const existing = await col.findOne({ slug: type.slug });
    if (existing) {
      // Upsert non-destructively — preserve _id and created_at
      await col.updateOne(
        { slug: type.slug },
        {
          $set: {
            ...type,
            updated_at: new Date(),
          },
        },
      );
      console.log(`  ✓ upserted ${type.slug} (existing _id=${existing._id})`);
    } else {
      await col.insertOne({
        ...type,
        created_at: new Date(),
      });
      console.log(`  ✓ inserted ${type.slug}`);
    }
  }
  const total = await col.countDocuments();
  console.log(`done — ${total} mission_types in ${DB}.${COL}`);
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
} finally {
  await client.close();
}
