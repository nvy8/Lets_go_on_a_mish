import { NextRequest, NextResponse } from 'next/server';
import { connect, COLLECTIONS, ObjectId } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/auth';
import { extractFactsFromPdf } from '@/lib/agents/pdf-fact-extractor';

// POST /api/missions/upload-pdf
// Body: multipart/form-data with `pdf` file and `mission_id` field
// Stores extracted text in mission.knowledge_base_text and AI-picked facts in
// mission.extracted_facts. Returns the extracted facts so the wizard can preview.

export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get('pdf');
    const missionId = form.get('mission_id');
    const topic = (form.get('topic') as string) || '';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'pdf file required' }, { status: 400 });
    }
    if (!missionId || typeof missionId !== 'string') {
      return NextResponse.json({ error: 'mission_id required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dynamically import pdf-parse to avoid CJS/ESM hassle at build time
    const pdfParseMod = (await import('pdf-parse')) as unknown as {
      default?: (buf: Buffer) => Promise<{ text: string }>;
    } & ((buf: Buffer) => Promise<{ text: string }>);
    const pdfParse = pdfParseMod.default || pdfParseMod;
    const parsed = await pdfParse(buffer);
    const text: string = parsed.text || '';

    if (text.length < 50) {
      return NextResponse.json(
        { error: 'PDF text too short or unreadable' },
        { status: 400 },
      );
    }

    const facts = await extractFactsFromPdf(text, topic);

    const db = await connect();
    await db.collection(COLLECTIONS.missions).updateOne(
      { _id: new ObjectId(missionId), teacher_id: teacher._id },
      {
        $set: {
          knowledge_base_text: text.slice(0, 50_000),
          extracted_facts: facts,
        },
      },
    );

    return NextResponse.json({
      ok: true,
      char_count: text.length,
      facts_count: facts.length,
      facts,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
