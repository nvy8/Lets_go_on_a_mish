import { runClaudeJSON } from './llm';
import { randomBytes } from 'node:crypto';
import type { SourceEntry } from './types';

function aiSearchPrompt(query: string, topic: string): string {
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

type RawResult = { title: string; url: string; domain: string; snippet: string };

function mkId(): string {
  return randomBytes(6).toString('base64url');
}

const HARDCODED_WEB_FORTIFIED_CHURCHES: RawResult[] = [
  {
    title: 'Villages with Fortified Churches in Transylvania — UNESCO World Heritage Centre',
    url: 'https://whc.unesco.org/en/list/596/',
    domain: 'whc.unesco.org',
    snippet:
      'These Transylvanian villages with their fortified churches provide a vivid picture of the cultural landscape of southern Transylvania. The seven villages inscribed are characterised by a specific land-use system, settlement pattern and organisation of the family farmstead.',
  },
  {
    title: 'Fortified churches in Transylvania - Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Fortified_churches_in_Transylvania',
    domain: 'en.wikipedia.org',
    snippet:
      'The fortified churches in Transylvania are a group of medieval fortified churches that were built mostly by Transylvanian Saxons from the 13th to 16th centuries as a defence against Ottoman, Tatar and other invasions.',
  },
  {
    title: 'Saxon Transylvania | Britannica',
    url: 'https://www.britannica.com/topic/Saxon-Transylvania',
    domain: 'britannica.com',
    snippet:
      'Saxon Transylvania, the German-speaking settlements in central Romania, settled by colonists from the western Holy Roman Empire beginning in the 12th century. Their fortified villages and churches still characterise the region.',
  },
  {
    title:
      'When Villagers Built Fortresses: Defensive Architecture in 15th-Century Transylvania',
    url: 'https://www.smithsonianmag.com/history/transylvania-fortified-churches-180976921/',
    domain: 'smithsonianmag.com',
    snippet:
      'Facing Ottoman raids that swept across the Balkans, Saxon villagers in Transylvania transformed their churches into the last line of defence — adding watchtowers, food storage, and walls thick enough to withstand cannon fire.',
  },
  {
    title:
      'churches in transylvania - all you need to know (no.1 guide) — TransylvaniaTrip Blog',
    url: 'https://transylvaniatrip.blogspot.com/2019/04/churches-in-transylvania-amazing.html',
    domain: 'transylvaniatrip.blogspot.com',
    snippet:
      'Welcome to the no.1 guide on transylvania churches!!! Click here for AMAZING photos!! Subscribe for more transylvania content + bonus dracula facts you wont find anywhere else!!!',
  },
];

const isFortifiedChurches = (topic: string): boolean =>
  /fortified church|transylvania.+church|saxon.+church/i.test(topic);

export async function webSearch(query: string, topic: string): Promise<SourceEntry[]> {
  let raws: RawResult[];
  if (isFortifiedChurches(topic)) {
    raws = HARDCODED_WEB_FORTIFIED_CHURCHES;
  } else {
    raws = await runClaudeJSON<{ results: RawResult[] }>(
      `You are simulating a Google search result page for the query: "${query}". Topic: "${topic}".\nReturn 5 plausible real search results in JSON: {"results":[{title,url,domain,snippet}]}. Mix authoritative (.edu, .gov, .org, major news) with one weak source (low-credibility blog). Snippets 120-180 chars, sound like real search snippets.`,
      { timeoutMs: 60_000 },
    ).then((d) => d.results);
  }
  return raws.map((r) => ({
    id: mkId(),
    title: r.title,
    url: r.url,
    domain: r.domain,
    preview_text: r.snippet,
    origin: 'web' as const,
  }));
}

export async function aiSearch(query: string, topic: string): Promise<SourceEntry[]> {
  const data = await runClaudeJSON<{ results: RawResult[] }>(aiSearchPrompt(query, topic), {
    timeoutMs: 60_000,
  });
  return (data.results || []).map((r) => ({
    id: mkId(),
    title: r.title,
    url: r.url,
    domain: r.domain,
    preview_text: r.snippet,
    origin: 'ai' as const,
  }));
}
