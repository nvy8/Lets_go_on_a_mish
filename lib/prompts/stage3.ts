type SourceForExtract = { id: string; url?: string; domain: string; title: string; text: string };

export function extractFactsPrompt(topic: string, sources: SourceForExtract[]): string {
  const list = sources
    .map(
      (s, i) =>
        `[SOURCE ${i + 1}] id=${s.id} | ${s.domain} | "${s.title}"\n${s.text.slice(0, 3500)}\n`,
    )
    .join('\n---\n\n');

  return `You are creating a "spot-the-fact" mini-game for an 11-year-old student researching: "${topic}".

Read these 3 sources carefully:

${list}

Extract exactly 5 candidate facts that the student should learn to triangulate across sources.

For EACH fact, also pick the most topically-relevant 2-3 sentence snippet from EACH of the 3 sources — even if the source does not actually support the fact. Then honestly mark whether each snippet actually supports the fact.

Constraints (this matters for the game to work):
- Each fact MUST have "supports": true for at LEAST 2 of the 3 sources (so triangulation is achievable)
- At least 2 of the 5 facts should have a "supports": false snippet somewhere (to give the student a "trick" snippet that's on-topic but doesn't actually back the fact — they have to read to spot the difference)
- Snippets must be VERBATIM 2-3 consecutive sentences from the source text — do NOT paraphrase
- Facts in plain language for a kid (≤15 words), factual claims not opinions

Return ONLY this JSON shape:
{
  "facts": [
    {
      "id": "f1",
      "plain_text": "...",
      "evidence": [
        {"source_id": "<source id 1>", "snippet": "...", "supports": true},
        {"source_id": "<source id 2>", "snippet": "...", "supports": true},
        {"source_id": "<source id 3>", "snippet": "...", "supports": false}
      ]
    }
  ]
}

Use fact ids "f1" through "f5". Use the exact source ids provided above. Evidence array must contain one entry per source (always 3 entries, in source order).`;
}
