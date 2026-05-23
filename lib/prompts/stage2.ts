export function aiSearchPrompt(query: string, topic: string): string {
  return `You are simulating a generative AI search engine (like Perplexity or Google AI Overview).

Research topic: "${topic}"
Refined query: "${query}"

Generate 5 plausible-looking search results for this query, as an AI search would. Mix:
- 2 results from actually-credible domains (real org/edu/news sites)
- 2 results from mid-tier sources (real-looking but not authoritative — Medium, blogs, lower-credibility sites)
- 1 result that LOOKS authoritative but has a suspicious detail (made-up sub-URL, wrong year in title, slightly wrong attribution)

Return ONLY JSON in this exact shape:
{
  "results": [
    {"title": "...", "url": "https://...", "domain": "example.com", "snippet": "120-180 chars summarising what's on the page"}
  ]
}

Keep URLs realistic but you may invent specific paths. Snippets should sound like real search engine snippets, not Claude prose. Do NOT include the answer to the research question itself — just plausible source titles + snippets.`;
}
