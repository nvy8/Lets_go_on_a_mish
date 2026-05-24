import { NextRequest, NextResponse } from 'next/server';
import { connect, COLLECTIONS } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/auth';

// POST /api/projects — create a new project for the authenticated teacher.
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  try {
    const body = await req.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const week_count =
      typeof body?.week_count === 'number' && body.week_count > 0 && body.week_count <= 52
        ? Math.floor(body.week_count)
        : undefined;

    const db = await connect();
    const result = await db.collection(COLLECTIONS.projects).insertOne({
      teacher_id: teacher._id,
      name,
      ...(description ? { description } : {}),
      ...(week_count !== undefined ? { week_count } : {}),
      created_at: new Date(),
    });
    return NextResponse.json({ ok: true, projectId: result.insertedId.toString() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// GET /api/projects — list the teacher's projects (active only by default).
export async function GET(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const url = new URL(req.url);
  const includeArchived = url.searchParams.get('archived') === '1';

  const db = await connect();
  const query: Record<string, unknown> = { teacher_id: teacher._id };
  if (!includeArchived) query.archived_at = { $exists: false };

  const projects = await db
    .collection(COLLECTIONS.projects)
    .find(query)
    .sort({ created_at: -1 })
    .toArray();

  // For each project, count its missions (cheap; could be aggregated later).
  const projectIds = projects.map((p) => p._id);
  const missionCounts = projectIds.length
    ? await db
        .collection(COLLECTIONS.missions)
        .aggregate([
          { $match: { project_id: { $in: projectIds } } },
          { $group: { _id: '$project_id', count: { $sum: 1 } } },
        ])
        .toArray()
    : [];
  const countByProjectId = new Map<string, number>();
  for (const row of missionCounts) {
    countByProjectId.set(String(row._id), row.count as number);
  }

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description ?? null,
      week_count: p.week_count ?? null,
      archived_at: p.archived_at ?? null,
      created_at: p.created_at,
      mission_count: countByProjectId.get(p._id.toString()) ?? 0,
    })),
  });
}
