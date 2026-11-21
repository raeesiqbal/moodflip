import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Please enter both email and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Attempt Supabase login if available
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user?.email_confirmed_at) {
        return NextResponse.json({
          success: true,
          user: data.user,
          session: data.session,
        });
      }
      if (error?.code === 'email_not_confirmed') {
        return NextResponse.json(
          {
            success: false,
            code: 'EMAIL_NOT_VERIFIED',
            error: 'Please verify your email before signing in.',
          },
          { status: 403 }
        );
      }
    } catch (e) {
      console.warn('[auth/login] Supabase login unavailable:', e);
      return NextResponse.json({ success: false, error: 'Sign-in is temporarily unavailable. Please try again later.' }, { status: 503 });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid email or password. Please check your details and try again.' },
      { status: 401 }
    );
  } catch (err) {
    console.error('Login handler error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during sign-in.' },
      { status: 500 }
    );
  }
}
