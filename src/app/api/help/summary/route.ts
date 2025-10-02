// app/api/help/summary/route.ts
import { NextResponse } from 'next/server';
import { getHelpSummaryFor } from '@/lib/help/summary';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path'); // e.g. "/help/docs/settings/data-tables"
    if (!path) {
      return NextResponse.json({ error: 'Missing ?path' }, { status: 400 });
    }
    const data = await getHelpSummaryFor(path.replace(/^\/+/, ''));
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
