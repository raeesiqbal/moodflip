import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.slice(7));
    if (authError || !user?.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
    }

    const { checkin } = await request.json();
    const { data: profile, error: profileError } = await admin.from('profiles')
      .select('check_in_count').eq('id', user.id).single();
    if (profileError) throw profileError;

    const { error: updateError } = await admin.from('profiles').update({
      last_active_at: new Date().toISOString(),
      check_in_count: (profile.check_in_count || 0) + (checkin ? 1 : 0),
    }).eq('id', user.id);
    if (updateError) throw updateError;

    if (checkin) {
      const { error: insertError } = await admin.from('checkins').insert({
        user_id: user.id,
        email: user.email,
        mood: checkin.mood,
        feeling: checkin.feeling,
        target_mood: checkin.target_mood || '',
        action_title: checkin.action_title || '',
        action_desc: checkin.action_desc || '',
        saved_at: checkin.saved_at || new Date().toISOString().slice(0, 10),
      });
      if (insertError) throw insertError;
    }
    return NextResponse.json({ success: true, last_active_at: new Date().toISOString() });
  } catch (error) {
    console.error('[activity] Failed to save:', error);
    return NextResponse.json({ error: 'Unable to save activity.' }, { status: 500 });
  }
}
