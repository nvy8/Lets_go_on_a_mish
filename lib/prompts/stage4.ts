type SourceForExtract = { id: string; url?: string; domain: string; title: string; text: string };

export function extractFactsPrompt(topic: string, sources: SourceForExtract[]): string {
  const list = sources
    .map(
      (s, i) =>
        `[SOURCE ${i + 1}] id=${s.id} | ${s.domain} | "${s.title}"\n${s.text.slice(0, 2500)}\n`,
    )
    .join('\n---\n\n');

  return `You are extracting candidate facts from research sources for an 11-year-old student investigating: "${topic}".

Read these 3 sources carefully:

${list}

Extract exactly 10 candidate facts that could appear across the sources. Mix:
- ~5 facts that appear in ALL 3 sources (clearly triangulated)
- ~3 facts that appear in 2 of 3 sources
- ~2 facts that appear in only 1 source

For each fact:
- Plain language a kid can understand (≤15 words)
- A factual claim (e.g. "Walls were 2-3 metres thick"), not an opinion
- Note which sources it appears in by source id

Return ONLY JSON:
{
  "facts": [
    {"id": "f1", "plain_text": "...", "appears_in": ["sourceId1", "sourceId2"]}
  ]
}

Use ids "f1" through "f10". Use the exact source ids provided above in the appears_in array.`;
}

export function verifyClickPrompt(factText: string, sourceTitle: string, sourceText: string): string {
  return `A student is reading a source and claims it contains a specific fact.

Source: "${sourceTitle}"
Source text (excerpt):
"""
${sourceText.slice(0, 2500)}
"""

Student's claim — this source contains the fact: "${factText}"

Does this source actually support or mention this fact (even paraphrased)?

Return ONLY JSON:
{"supported": true | false, "reason": "one short sentence"}

Rules:
- true = the source clearly contains this information (exact or paraphrased)
- false = the source does NOT contain this fact, even loosely
- Be lenient on paraphrasing but strict on the actual claim being present
- One sentence reason, kid-friendly`;
}
