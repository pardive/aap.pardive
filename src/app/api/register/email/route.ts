import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use the exact names from your Vercel/Local environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN!;

export async function POST(req: Request) {
  try {
    const { email, password, company, subdomain } = await req.json();

    // 1. Validation
    if (!email || !password || !company || !subdomain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const slug = String(subdomain).toLowerCase();

    // 2. Initialize Admin Client (Safe to use Service Role Key here on the server)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    /* -----------------------------------------------------
       3. Create Auth User
    ----------------------------------------------------- */
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-verify for better UX during testing
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
      throw authError;
    }

    const userId = authData.user.id;

    /* -----------------------------------------------------
       4. Create Organization
    ----------------------------------------------------- */
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .insert({ name: company, slug })
      .select()
      .single();

    if (orgError) {
      // Rollback: Delete the auth user if the organization creation fails
      await supabase.auth.admin.deleteUser(userId);
      if (orgError.code === '23505') {
        return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
      }
      throw orgError;
    }

    /* -----------------------------------------------------
       5. Link User to Org (Role: Admin)
    ----------------------------------------------------- */
    const { error: linkError } = await supabase
      .from('org_users')
      .insert({
        org_id: org.id,
        user_id: userId,
        role: 'admin',
      });

    if (linkError) throw linkError;

    return NextResponse.json({
      status: 'ok',
      workspace_url: `https://${slug}.${APP_DOMAIN}`,
    });

  } catch (err: any) {
    console.error('Registration Error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}

// Keep the GET error to prevent accidental browser visits from returning a blank page
export function GET() {
  return NextResponse.json({ error: 'Method Not Allowed. Use POST.' }, { status: 405 });
}