// PDF fact-extraction agent.
// Given raw PDF text + a topic, asks Claude to pick 10-20 facts most relevant
// for a 9-14yo to learn. Used by the wizard PDF-upload step + the Reading Drill
// mission type.

import { runClaudeJSON } from '@/lib/llm';

type ExtractResp = {
  facts: string[];
};

export async function extractFactsFromPdf(
  pdfText: string,
  topic: string,
): Promise<string[]> {
  // Truncate to a sensible context window — most kid-research PDFs are short
  const truncated = pdfText.slice(0, 12_000);

  const prompt = `You're helping prepare a research mission for a 9-14 year old student.

Topic: "${topic}"

Below is the full text of a PDF the teacher uploaded as background material:

----- PDF TEXT -----
${truncated}
----- END PDF -----

Extract 10-20 of the MOST RELEVANT, CONCRETE facts from this PDF that a 9-14 year old should learn about the topic.

Rules:
- Each fact is a single sentence, 8-20 words
- Plain language a kid can understand
- Concrete (dates, places, numbers, named people) — NOT vague generalities
- Skip footnotes, citations, page numbers, author bios
- If the PDF has nothing useful for this topic, return an empty list

Return ONLY this JSON:
{
  "facts": ["...", "...", ...]
}`;

  try {
    const resp = await runClaudeJSON<ExtractResp>(prompt, { timeoutMs: 90_000 });
    if (!Array.isArray(resp?.facts)) return [];
    return resp.facts.filter((f) => typeof f === 'string' && f.length > 0).slice(0, 20);
  } catch (err) {
    console.error('[pdf-fact-extractor] failed:', (err as Error).message);
    return [];
  }
}
