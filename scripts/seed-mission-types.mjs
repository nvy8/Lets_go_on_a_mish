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

const CHORE_CHECK = {
  slug: 'chore-check',
  name: 'Chore Check',
  description:
    'Parent gives kid a real-world task. Kid taps "I did it!" when done. Honour code — parent honours the reward offline.',
  icon: 'check-circle',
  audience: 'parent',
  default_badges: [{ slug: 'task-doer', name: 'Task Doer', icon: 'check' }],
  stages_spec: [
    {
      id: 'do-the-task',
      name: 'Do the task',
      description: 'Kid sees task description, taps "I did it!" when done.',
      kind: 'task-checkoff',
      badge_on_complete: 'task-doer',
    },
  ],
  is_builtin: true,
};

const DOPAMINE_RESET = {
  slug: 'dopamine-reset',
  name: 'Dopamine Reset',
  description:
    'Quick 4-step reset — box breathing, gratitude list, a real-world micro-task, and a closing breath.',
  icon: 'wind',
  audience: 'both',
  default_badges: [
    { slug: 'calm-starter', name: 'Calm Starter', icon: 'wind' },
    { slug: 'grateful-heart', name: 'Grateful Heart', icon: 'heart' },
    { slug: 'fresh-air', name: 'Fresh Air', icon: 'tree' },
    { slug: 'dopamine-resetter', name: 'Dopamine Resetter', icon: 'sparkles' },
  ],
  stages_spec: [
    { id: 'breathe-in', name: 'Breathe in', description: 'Box breathing — 60 seconds', kind: 'breath-timer', config: { seconds: 60 }, badge_on_complete: 'calm-starter' },
    { id: 'three-things', name: 'Three things', description: 'Write 3 things you are grateful for', kind: 'gratitude-list', badge_on_complete: 'grateful-heart' },
    { id: 'step-away', name: 'Step away', description: 'Offline 2-min micro-task', kind: 'task-checkoff', config: { task: 'Step outside for 2 minutes' }, badge_on_complete: 'fresh-air' },
    { id: 'calm-close', name: 'Calm close', description: 'Closing breath — 30 seconds', kind: 'breath-timer', config: { seconds: 30 }, badge_on_complete: 'dopamine-resetter' },
  ],
  is_builtin: true,
};

const READING_DRILL = {
  slug: 'reading-drill',
  name: 'Reading Drill',
  description:
    'Kid reads a short passage from the knowledge base, answers 3 quick comprehension questions, then explains the main idea in their own words.',
  icon: 'book-open',
  audience: 'teacher',
  default_badges: [
    { slug: 'careful-reader', name: 'Careful Reader', icon: 'book-open' },
    { slug: 'wordsmith', name: 'Wordsmith', icon: 'pencil' },
  ],
  stages_spec: [
    { id: 'read', name: 'Read', description: 'Read a short passage + answer 3 MC questions', kind: 'read-then-quiz', badge_on_complete: 'careful-reader' },
    { id: 'explain', name: 'Explain in your own words', description: 'Summarize the main idea', kind: 'explain-grade', badge_on_complete: 'wordsmith' },
  ],
  is_builtin: true,
};

const BUILTINS = [SOURCES_VETTING, CHORE_CHECK, DOPAMINE_RESET, READING_DRILL];

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
