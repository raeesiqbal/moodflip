import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const duplicateMessage = 'This email address is already in use. Please use a different email address.';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, confirmPassword, fullName, consentData } = body;
    if (typeof email !== 'string' || typeof password !== 'string' ||
        typeof confirmPassword !== 'string' || typeof fullName !== 'string' ||
        !email.trim() || !fullName.trim() || !password || !confirmPassword) {
      return NextResponse.json({ success: false, error: 'Please fill in all required fields.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Your password must be at least 8 characters long.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match.' }, { status: 400 });
    }
    if (consentData !== true) {
      return NextResponse.json({ success: false, error: 'Please accept the Privacy Policy.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || !serviceKey) {
      console.error('[auth/register] Supabase configuration is missing');
      return NextResponse.json({ success: false, error: 'Registration is temporarily unavailable. Please try again later.' }, { status: 503 });
    }

    // Supabase's public signUp endpoint deliberately obscures existing accounts.
    // In particular, an unverified account can look like a successful signup and
    // receive another confirmation email. Check the server-only profile record
    // first so verified and unverified accounts get the same duplicate response.
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: existingProfile, error: lookupError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (lookupError) {
      console.error('[auth/register] Duplicate email lookup failed:', lookupError);
      return NextResponse.json(
        { success: false, error: 'Registration is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    if (existingProfile) {
      return NextResponse.json({ success: false, error: duplicateMessage }, { status: 409 });
    }

    // Public Auth signup sends a confirmation email; admin createUser bypasses it.
    const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const { data, error } = await auth.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName.trim(), consented_at: new Date().toISOString() },
        emailRedirectTo: `${redirectOrigin.replace(/\/$/, '')}/auth/confirm`,
      },
    });

    if (error) {
      const duplicate = ['user_already_exists', 'email_exists'].includes(error.code || '') ||
        /already registered|already exists/i.test(error.message);
      return NextResponse.json({ success: false, error: duplicate ? duplicateMessage : error.message },
        { status: duplicate ? 409 : 400 });
    }
    // Supabase can return an obfuscated user with no identities for an existing address.
    if (data.user?.identities?.length === 0) {
      return NextResponse.json({ success: false, error: duplicateMessage }, { status: 409 });
    }
    if (!data.user || data.session) {
      console.error('[auth/register] Email confirmation is disabled or signup returned no user');
      return NextResponse.json({ success: false, error: 'Email verification is not configured. Please contact support.' }, { status: 503 });
    }

    return NextResponse.json({ success: true, message: 'Check your email for a verification link before signing in.' });
  } catch (error) {
    console.error('[auth/register] Signup failed:', error);
    return NextResponse.json({ success: false, error: 'Registration is temporarily unavailable. Please try again later.' }, { status: 503 });
  }
}
