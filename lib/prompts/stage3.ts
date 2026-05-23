type JudgeInput = Array<{ id: string; url: string; domain: string; title: string; snippet: string; fetched_ok: boolean }>;

export function judgeSourcesPrompt(topic: string, sources: JudgeInput): string {
  const list = sources
    .map(
      (s, i) =>
        `${i + 1}. [id: ${s.id}] [${s.domain}] "${s.title}"\n   URL: ${s.url}\n   Snippet: ${s.snippet.slice(0, 300)}\n   Page loaded successfully: ${s.fetched_ok ? 'yes' : 'NO (suspicious — URL may not exist or page failed)'}\n`,
    )
    .join('\n');

  return `You are a research-literacy coach for an 11-year-old. You're evaluating 10 search-result candidates for the topic: "${topic}".

Sources to evaluate:
${list}

For each source, decide:
- "legit" = trustworthy (well-known publisher, authoritative domain, factually sound)
- "sus" = NOT trustworthy (sketchy blog, broken URL, hallucinated-looking, sensationalist, low-quality writing)

Also pick the TOP 3 sources the student should use for deep research (must all be legit).

Return ONLY JSON in this exact shape:
{
  "judgments": [
    {"id": "...", "verdict": "legit" | "sus", "one_line_reason": "..."}
  ],
  "top_3_ids": ["...", "...", "..."]
}

Rules for judgments:
- The reason MUST be one short sentence (under 18 words) a kid can understand
- If a URL didn't load, that's a strong sus signal — call it out
- Sensational blog tone ("AMAZING", "no.1 guide", "click here") = sus
- Made-up-sounding authorities ("Klaus Werner", invented historians) = sus
- Well-known domains (Wikipedia, Britannica, UNESCO, Smithsonian, major .edu) = legit by default unless content is clearly wrong
- top_3_ids must contain exactly 3 ids, all of which appear in judgments with verdict "legit"`;
}
