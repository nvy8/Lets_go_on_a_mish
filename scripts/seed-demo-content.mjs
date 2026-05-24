// Idempotent seeder for demo content (teacher + projects + missions).
// Run after `seed-mission-types.mjs` so the 'sources-vetting' type exists.
//
// Usage:
//   node --env-file=.env.local scripts/seed-demo-content.mjs
//   node --env-file=.env.local scripts/seed-demo-content.mjs --email=demo@mish.local --password=MishDemo2026!
//
// Produces a teacher (creates if missing, updates password if --password given)
// and seeds 2 projects + 1 standalone mission drawn from
// docs/design/TEACHER_FLOW_EXAMPLES.md, so the demo dashboard is never empty.
//
// Idempotent — re-running upserts by (teacher_id, title) for missions and
// (teacher_id, name) for projects, so it's safe to run repeatedly.

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

const DB = 'TEMP_HACKATHON';

// Parse simple --key=value CLI args.
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.replace(/^--/, '').split('='))
    .map(([k, v]) => [k, v ?? true]),
);

const TEACHER_EMAIL = args.email || 'demo@mish.local';
const TEACHER_PASSWORD = args.password || 'MishDemo2026!';

// ──────────────────────────────────────────────────────────────────────────
// Seed content — mirrors docs/design/TEACHER_FLOW_EXAMPLES.md so the demo
// dashboard reflects exactly what the design doc describes.
// ──────────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    name: 'Year 4 — Ocean Investigators',
    description:
      '3-week unit on marine animals. Two missions per week. Kids pick one animal per week to research.',
    week_count: 3,
    missions: [
      {
        week_number: 1,
        title: 'Color-changing octopuses',
        topic: 'Why and how do octopuses change color?',
        knowledge_base_text:
          'Focus on chromatophores — the special skin cells that contain pigment sacs. ' +
          'Trusted public-education sources: NatGeo Kids, Monterey Bay Aquarium. ' +
          'Watch for the misconception that octopuses change color "for fun" — the real driver is camouflage, communication, and stress response.',
      },
      {
        week_number: 1,
        title: 'Why dolphins sleep with one eye open',
        topic: 'How do dolphins rest in the ocean?',
        knowledge_base_text:
          'Look for the term "unihemispheric sleep" — one brain hemisphere rests while the other stays alert. ' +
          'Trusted public-education sources: NOAA, BBC Earth, university marine-biology pages.',
      },
      {
        week_number: 2,
        title: 'Coral bleaching',
        topic: 'What makes corals turn white?',
        knowledge_base_text:
          'Focus on temperature stress and the symbiotic algae called zooxanthellae. ' +
          'Trusted public-education sources: NOAA, Australian Institute of Marine Science.',
      },
      {
        week_number: 2,
        title: 'How sharks find prey',
        topic: 'What senses do sharks use to hunt?',
        knowledge_base_text:
          'Look for "ampullae of Lorenzini" — the electroreceptor organs around the snout. ' +
          'Trusted public-education sources: Smithsonian Ocean, Florida Museum.',
      },
      {
        week_number: 3,
        title: 'Bioluminescent jellyfish',
        topic: 'Why do some jellyfish glow?',
        knowledge_base_text:
          'Focus on the protein aequorin and the green fluorescent protein (GFP). ' +
          'Trusted public-education sources: MBARI, Smithsonian.',
      },
      {
        week_number: 3,
        title: 'Whale migration',
        topic: 'Why do humpback whales swim so far?',
        knowledge_base_text:
          'Look at the difference between cold-water feeding grounds and warm-water breeding grounds. ' +
          'Trusted public-education sources: NOAA Fisheries, IWC.',
      },
    ],
  },
  {
    name: 'Year 6 — Light & Color',
    description:
      '2-week unit on light, color, and common misconceptions. Goal: each kid corrects at least one wrong intuition with a real source.',
    week_count: 2,
    missions: [
      {
        week_number: 1,
        title: 'Why is the sky blue?',
        topic: 'Why does the sky look blue during the day but orange at sunset?',
        knowledge_base_text:
          'Focus on Rayleigh scattering. Trusted public-education sources: NASA SpacePlace, Met Office. ' +
          'Watch for the popular wrong answer "the sky is blue because it reflects the ocean" — the kid should catch it in Stage 4.',
      },
      {
        week_number: 1,
        title: 'Why do mirrors flip left-right but not up-down?',
        topic: "The 'mirror paradox' explained",
        knowledge_base_text:
          'Trusted public-education sources: reputable physics-education channels and university outreach pages. ' +
          "Misconception: mirrors don't actually flip anything — they reverse along the axis perpendicular to the mirror.",
      },
      {
        week_number: 2,
        title: 'Why is grass green?',
        topic: 'Chlorophyll and what light plants reflect',
        knowledge_base_text:
          'Trusted public-education sources: established educational biology resources, NASA Earth Observatory. ' +
          'Misconception: "plants like green" — actually they REJECT green, which is why we see green reflected back.',
      },
      {
        week_number: 2,
        title: 'Why do rainbows have those specific colors?',
        topic: 'Spectrum, refraction, why we see bands',
        knowledge_base_text:
          'Focus on prism refraction and the visible-light spectrum. ' +
          'Trusted public-education sources: NOAA SciJinks, Met Office. ' +
          'Misconception: rainbows have 7 distinct bands — actually a continuous spectrum.',
      },
    ],
  },
];

// Standalone missions (not bound to any project) — example 2 in the doc.
const STANDALONE_MISSIONS = [
  {
    title: 'Bee research warm-up',
    topic: 'How do bees turn flower nectar into honey?',
    knowledge_base_text:
      'Trusted public-education sources: USDA Honey Bee Basics PDF, BBC Earth — Inside the Hive, established kid-science magazines. ' +
      'Untrusted example: honey-secrets-revealed.online (clickbait domain). Use Stage 2 to compare.',
  },
];

// ──────────────────────────────────────────────────────────────────────────

function newShareToken() {
  return randomBytes(12).toString('base64url');
}

async function upsertTeacher(db, email, plainPassword) {
  const password_hash = await bcrypt.hash(plainPassword, 10);
  const teachers = db.collection('teachers');
  const existing = await teachers.findOne({ email });
  if (existing) {
    await teachers.updateOne(
      { _id: existing._id },
      { $set: { password: password_hash, last_login: new Date() } },
    );
    console.log(`  ✓ teacher exists — refreshed password for ${email} (_id=${existing._id})`);
    return existing._id;
  }
  const now = new Date();
  const res = await teachers.insertOne({
    email,
    password: password_hash,
    created_at: now,
    last_login: now,
  });
  console.log(`  ✓ created teacher ${email} (_id=${res.insertedId})`);
  return res.insertedId;
}

async function upsertProject(db, teacherId, project) {
  const projects = db.collection('projects');
  const existing = await projects.findOne({ teacher_id: teacherId, name: project.name });
  if (existing) {
    await projects.updateOne(
      { _id: existing._id },
      {
        $set: {
          description: project.description,
          week_count: project.week_count,
        },
        $unset: { archived_at: '' },
      },
    );
    console.log(`    ↻ project exists — refreshed "${project.name}" (_id=${existing._id})`);
    return existing._id;
  }
  const res = await projects.insertOne({
    teacher_id: teacherId,
    name: project.name,
    description: project.description,
    week_count: project.week_count,
    created_at: new Date(),
  });
  console.log(`    + created project "${project.name}" (_id=${res.insertedId})`);
  return res.insertedId;
}

async function upsertMission(db, teacherId, mission, projectId, position) {
  const missions = db.collection('missions');
  // Idempotency key: (teacher_id, title). A teacher can't have two missions
  // with the same title in the demo data — the doc uses unique titles.
  const existing = await missions.findOne({ teacher_id: teacherId, title: mission.title });
  const base = {
    teacher_id: teacherId,
    title: mission.title,
    topic: mission.topic,
    knowledge_base_text: mission.knowledge_base_text || '',
    mission_type_slug: 'sources-vetting',
    audience_role: 'teacher',
    ...(projectId
      ? {
          project_id: projectId,
          position,
          ...(mission.week_number ? { week_number: mission.week_number } : {}),
        }
      : { project_id: null }),
  };
  if (existing) {
    await missions.updateOne(
      { _id: existing._id },
      {
        $set: base,
      },
    );
    console.log(`      ↻ mission "${mission.title}" (token ${existing.share_token})`);
    return existing._id;
  }
  const share_token = newShareToken();
  const res = await missions.insertOne({
    ...base,
    share_token,
    created_at: new Date(),
  });
  console.log(`      + mission "${mission.title}" (token ${share_token})`);
  return res.insertedId;
}

const client = new MongoClient(uri);
try {
  console.log(`\n→ Seeding demo content into ${DB} for ${TEACHER_EMAIL}\n`);
  await client.connect();
  const db = client.db(DB);

  // Verify the sources-vetting mission type exists — the demo missions all
  // reference it. Fail loudly so the user runs seed-mission-types.mjs first.
  const mtCount = await db
    .collection('mission_types')
    .countDocuments({ slug: 'sources-vetting' });
  if (mtCount === 0) {
    console.error(
      "FAIL: mission type 'sources-vetting' not seeded. Run scripts/seed-mission-types.mjs first.",
    );
    process.exit(2);
  }

  const teacherId = await upsertTeacher(db, TEACHER_EMAIL, TEACHER_PASSWORD);

  // Projects + their missions.
  for (const project of PROJECTS) {
    const projectId = await upsertProject(db, teacherId, project);
    let position = 1;
    for (const mission of project.missions) {
      await upsertMission(db, teacherId, mission, projectId, position);
      position += 1;
    }
  }

  // Standalone missions.
  if (STANDALONE_MISSIONS.length) {
    console.log(`  Standalone missions:`);
    for (const mission of STANDALONE_MISSIONS) {
      await upsertMission(db, teacherId, mission, null, null);
    }
  }

  // Summary.
  const [projectCount, missionCount] = await Promise.all([
    db.collection('projects').countDocuments({ teacher_id: teacherId }),
    db.collection('missions').countDocuments({ teacher_id: teacherId }),
  ]);
  console.log(
    `\n✓ Done. Teacher ${TEACHER_EMAIL} now has ${projectCount} projects and ${missionCount} missions.`,
  );
  console.log(`\nLog in at /teacher/login with:`);
  console.log(`  email:    ${TEACHER_EMAIL}`);
  console.log(`  password: ${TEACHER_PASSWORD}\n`);
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
} finally {
  await client.close();
}
