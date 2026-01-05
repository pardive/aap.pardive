import { NextResponse } from 'next/server';
import { supaAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveUserId(req: Request): string | null {
  return (
    req.headers.get('x-user-id') ||
    req.headers.get('x-userid') ||
    null
  );
}

export async function POST(req: Request) {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'No user' }, { status: 401 });
    }

    const fd = await req.formData();
    const file = fd.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'bin';
    const path = `covers/${userId}-${Date.now()}.${ext}`;

    const db = supaAdmin();

    const upload = await db.storage
      .from('profiles')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (upload.error) {
      return NextResponse.json({ error: upload.error.message }, { status: 500 });
    }

    const { data } = db.storage.from('profiles').getPublicUrl(path);

    await db.from('users').update({ cover_url: data.publicUrl }).eq('id', userId);

    return NextResponse.json({ url: data.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
