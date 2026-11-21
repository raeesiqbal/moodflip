import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;
    if (typeof currentPassword !== 'string' || !currentPassword) {
      return NextResponse.json({ message: 'Please enter your current password.' }, { status: 400 });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ message: 'New password must be at least 8 characters.' }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'New password and confirmation do not match.' }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ message: 'Your new password must be different from your current password.' }, { status: 400 });
    }
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ message: 'Authentication is required' }, { status: 401 });
    const admin = getSupabaseAdmin();
    const { data: { user }, error: userError } = await admin.auth.getUser(authHeader.slice(7));
    if (userError || !user) return NextResponse.json({ message: 'Invalid session' }, { status: 401 });

    if (!user.email) {
      return NextResponse.json({ message: 'This account does not have an e-mail address.' }, { status: 400 });
    }

    // Re-authenticate with the current password before allowing this sensitive
    // account change. A valid bearer token alone is not sufficient.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ message: 'Password updates are temporarily unavailable.' }, { status: 503 });
    }
    const verifier = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: verificationError } = await verifier.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verificationError) {
      return NextResponse.json({ message: 'Your current password is incorrect.' }, { status: 400 });
    }

    // Use the freshly re-authenticated user session for the update instead of
    // the administrator API. This keeps the change inside Supabase Auth's
    // normal user flow, including its configured security notifications.
    const { error } = await verifier.auth.updateUser({ password: newPassword });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    let notificationSent = false;
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.AUTH_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL;

    if (resendApiKey && fromEmail) {
      try {
        const delivery = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [user.email],
            subject: 'Your MoodFlip password was changed',
            text: [
              'Your MoodFlip password was changed successfully.',
              '',
              `Time: ${new Date().toISOString()}`,
              '',
              'If you made this change, no further action is required.',
              'If you did not make this change, reset your password immediately and contact support@moodflip.coach.',
            ].join('\n'),
          }),
        });

        notificationSent = delivery.ok;
        if (!delivery.ok) {
          console.error('[profile/update-password] Resend delivery failed:', await delivery.text());
        }
      } catch (emailError) {
        console.error('[profile/update-password] Resend delivery failed:', emailError);
      }
    } else {
      console.error('[profile/update-password] RESEND_API_KEY or sender e-mail is missing.');
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
      notificationSent,
    });
  } catch (error) {
    console.error('[profile/update-password] Failed:', error);
    return NextResponse.json({ message: 'Failed to process request' }, { status: 500 });
  }
}
