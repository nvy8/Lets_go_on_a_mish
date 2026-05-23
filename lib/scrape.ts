import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { FALLBACK_TEXTS } from './fortified_churches_fallback';

export type Preview = {
  url: string;
  domain: string;
  title: string;
  favicon: string;
  preview_text: string;
  fetched_ok: boolean;
};

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 6_000;

export async function fetchPreview(url: string, fallbackSnippet: string): Promise<Preview> {
  const domain = safeDomain(url);
  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const richFallback = FALLBACK_TEXTS[url] || fallbackSnippet || '';
  const empty: Preview = {
    url,
    domain,
    title: '',
    favicon,
    preview_text: richFallback,
    fetched_ok: false,
  };

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return empty;

    const reader = res.body?.getReader();
    if (!reader) return empty;
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES) break;
      chunks.push(value);
    }
    const html = new TextDecoder().decode(concat(chunks));
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    const titleFromDom = doc.querySelector('title')?.textContent?.trim() || '';

    let preview_text = '';
    let title = titleFromDom;
    try {
      const reader = new Readability(doc).parse();
      if (reader) {
        title = reader.title || title;
        preview_text = (reader.textContent || '').replace(/\s+/g, ' ').trim();
      }
    } catch {}
    if (!preview_text) {
      const bodyText = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
      preview_text = bodyText;
    }
    const trimmed = preview_text.slice(0, 3500);
    return {
      url,
      domain,
      title: title || domain,
      favicon,
      preview_text: trimmed || richFallback,
      fetched_ok: !!trimmed,
    };
  } catch {
    return empty;
  }
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 60);
  }
}

function concat(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
