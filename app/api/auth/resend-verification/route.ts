import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.error('[auth/resend-verification] Supabase configuration is missing');
      return NextResponse.json(
        { success: false, error: 'Email verification is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const auth = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const { error } = await auth.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: `${redirectOrigin.replace(/\/$/, '')}/auth/confirm`,
      },
    });

    if (error) {
      const isRateLimited = error.status === 429 || /rate limit|security purposes|after \d+ seconds/i.test(error.message);
      return NextResponse.json(
        {
          success: false,
          error: isRateLimited
            ? 'Please wait a moment before requesting another verification email.'
            : 'We could not resend the verification email. Please try again.',
        },
        { status: isRateLimited ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'A new verification link has been sent. Please check your inbox and spam folder.',
    });
  } catch (error) {
    console.error('[auth/resend-verification] Failed:', error);
    return NextResponse.json(
      { success: false, error: 'Email verification is temporarily unavailable. Please try again later.' },
      { status: 503 }
    );
  }
}
