import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const DAILY_MOOD_LIFT_LIMIT = 3;
const MAX_FIELD_LENGTH = 2_000;

type CheckinRow = {
  id: string;
  mood: string;
  feeling: string;
  target_mood: string | null;
  action_title: string | null;
  action_desc: string | null;
  saved_at: string;
  created_at: string;
};

function toMoodLift(row: CheckinRow) {
  return {
    id: row.id,
    date: row.created_at,
    timestamp: new Date(row.created_at).getTime(),
    mood: row.mood,
    feeling: row.feeling,
    targetMood: row.target_mood || '',
    action: row.action_title || '',
    actionDesc: row.action_desc || '',
    savedAt: row.saved_at,
  };
}

async function authenticate(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const admin = getSupabaseAdmin();
  const { data: { user }, error } = await admin.auth.getUser(authHeader.slice(7));
  if (error || !user?.email || !user.email_confirmed_at) return null;
  return { admin, user };
}

async function getTotalCheckinCount(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
) {
  const { count, error } = await admin
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count || 0;
}

export async function GET(request: Request) {
  try {
    const authenticated = await authenticate(request);
    if (!authenticated) {
      return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    }

    const { admin, user } = authenticated;
    const { data, error } = await admin
      .from('checkins')
      .select('id,mood,feeling,target_mood,action_title,action_desc,saved_at,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({
      success: true,
      checkins: ((data || []) as CheckinRow[]).map(toMoodLift),
    });
  } catch (error) {
    console.error('[activity] Failed to load:', error);
    return NextResponse.json({ error: 'Unable to load saved Mood Lifts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await authenticate(request);
    if (!authenticated) {
      return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    }

    const { admin, user } = authenticated;
    const body = await request.json();
    const checkin = body?.checkin;
    const mood = typeof checkin?.mood === 'string' ? checkin.mood.trim() : '';
    const feeling = typeof checkin?.feeling === 'string' ? checkin.feeling.trim() : '';
    const targetMood = typeof checkin?.target_mood === 'string' ? checkin.target_mood.trim() : '';
    const actionTitle = typeof checkin?.action_title === 'string' ? checkin.action_title.trim() : '';
    const actionDesc = typeof checkin?.action_desc === 'string' ? checkin.action_desc.trim() : '';

    if (!mood || !feeling) {
      return NextResponse.json({ error: 'Mood and feeling are required.' }, { status: 400 });
    }
    if ([mood, feeling, targetMood, actionTitle, actionDesc].some((value) => value.length > MAX_FIELD_LENGTH)) {
      return NextResponse.json({ error: 'The Mood Lift contains text that is too long.' }, { status: 400 });
    }

    // The server owns the calendar date used for enforcement; a client cannot
    // bypass the daily limit by submitting a different saved_at value.
    const today = new Date().toISOString().slice(0, 10);
    const { count, error: countError } = await admin
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('saved_at', today);
    if (countError) throw countError;
    if ((count || 0) >= DAILY_MOOD_LIFT_LIMIT) {
      return NextResponse.json(
        { error: 'You have already saved today’s 3 Mood Lifts.', dailyCount: count },
        { status: 409 },
      );
    }

    const { data, error: insertError } = await admin
      .from('checkins')
      .insert({
        user_id: user.id,
        email: user.email,
        mood,
        feeling,
        target_mood: targetMood,
        action_title: actionTitle,
        action_desc: actionDesc,
        saved_at: today,
      })
      .select('id,mood,feeling,target_mood,action_title,action_desc,saved_at,created_at')
      .single();
    if (insertError) throw insertError;

    const dailyCount = (count || 0) + 1;
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        last_active_at: new Date().toISOString(),
        check_in_count: await getTotalCheckinCount(admin, user.id),
      })
      .eq('id', user.id);
    if (profileError) console.error('[activity] Saved check-in but failed to update profile totals:', profileError);

    return NextResponse.json({
      success: true,
      checkin: toMoodLift(data as CheckinRow),
      dailyCount,
    });
  } catch (error) {
    console.error('[activity] Failed to save:', error);
    return NextResponse.json({ error: 'Unable to save Mood Lift.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authenticated = await authenticate(request);
    if (!authenticated) {
      return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Mood Lift ID is required.' }, { status: 400 });

    const { admin, user } = authenticated;
    const { data, error } = await admin
      .from('checkins')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Mood Lift was not found.' }, { status: 404 });

    const { error: profileError } = await admin
      .from('profiles')
      .update({
        last_active_at: new Date().toISOString(),
        check_in_count: await getTotalCheckinCount(admin, user.id),
      })
      .eq('id', user.id);
    if (profileError) console.error('[activity] Deleted check-in but failed to update profile totals:', profileError);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[activity] Failed to delete:', error);
    return NextResponse.json({ error: 'Unable to delete Mood Lift.' }, { status: 500 });
  }
}
