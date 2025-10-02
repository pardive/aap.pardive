// lib/help/summary.ts
import 'server-only';

import { load } from 'cheerio';
import OpenAI from 'openai';
import { cache } from 'react';
import { headers } from 'next/headers';

export type HelpSummary = { title: string; description?: string; bullets: string[] };

const BASE = '/help';

function getOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
  try {
    const h = headers();
    const proto = h.get('x-forwarded-proto') || 'http';
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
    return `${proto}://${host}`.replace(/\/+$/, '');
  } catch {
    return 'http://localhost:3000';
  }
}

function normalizePath(pathname: string): string {
  let p = (pathname || '').trim();
  if (!p) return BASE;
  if (/^https?:\/\//i.test(p)) return p; // absolute URL -> return as-is
  if (p.startsWith('/')) p = p.slice(1);
  if (p.toLowerCase().startsWith('help/')) p = p.slice('help/'.length);
  return `${BASE}/${p}`.replace(/\/+/g, '/'); // /help/...
}

function extractMain(html: string): { title: string; description?: string; text: string } {
  const $ = load(html);
  const $h1 = $('h1').first();
  const title = $h1.text().trim() || 'Settings';

  let description = '';
  if ($h1.length) {
    const $pAfter = $h1.nextAll('p').first();
    if ($pAfter.length) description = $pAfter.text().replace(/\s+/g, ' ').trim();
  }
  if (!description) {
    const $pAny = $('p').first();
    if ($pAny.length) description = $pAny.text().replace(/\s+/g, ' ').trim();
  }

  const main = $('main, article').first();
  const text = (main.length ? main : $('body'))
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);

  return { title, description: description || undefined, text };
}

async function runSummary(title: string, text: string, existingDesc?: string): Promise<HelpSummary> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      title,
      description: existingDesc ?? 'AI summary unavailable (missing OPENAI_API_KEY).',
      bullets: ['Set OPENAI_API_KEY to enable AI summaries.'],
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const prompt = `
Return ONLY valid JSON:
{"title":"...","description":"...","bullets":["..."]}

Guidelines:
- description: 1–2 sentences, plain, no markdown
- bullets: 5–8 concise, actionable items (<= 18 words), focus on what/why/how

PAGE TITLE: ${title}
${existingDesc ? `HINT DESCRIPTION: ${existingDesc}` : ''}
PAGE TEXT:
${text}
`.trim();

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  const content = resp.choices[0]?.message?.content || '{}';
  const json = JSON.parse(content);
  const bullets = Array.isArray(json.bullets) ? json.bullets.slice(0, 8) : [];
  return {
    title: String(json.title || title || 'Settings').trim(),
    description: json.description ? String(json.description).trim() : existingDesc,
    bullets,
  };
}

// Per-path cached loader (fetch has its own 24h revalidate)
export const getHelpSummaryFor = cache(async (pathname: string): Promise<HelpSummary> => {
  const pathOnly = normalizePath(pathname); // /help/...
  const absolute = /^https?:\/\//i.test(pathOnly) ? pathOnly : `${getOrigin()}${pathOnly}`;

  const res = await fetch(absolute, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) {
    return {
      title: 'Settings',
      description: 'Open the full page for detailed guidance.',
      bullets: [
        'Open the full help page from the link at right.',
        'Use help search to find specific topics.',
        'Contact support for guided setup.',
      ],
    };
  }

  const html = await res.text();
  const { title, description, text } = extractMain(html);

  if (text.length < 400) {
    const bullets = text
      .split(/[•\-\n]/g)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    return { title, description, bullets: bullets.length ? bullets : [text] };
  }

  try {
    return await runSummary(title, text, description);
  } catch {
    return {
      title,
      description,
      bullets: ['Summary temporarily unavailable. Open the full page for details.'],
    };
  }
});
