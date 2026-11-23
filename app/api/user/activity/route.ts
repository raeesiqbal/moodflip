import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

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

type DatabaseProgress = {
  daily_count: number;
  qualifying_days: number;
  total_count: number;
  report_eligible: boolean;
};

function toReportProgress(progress: DatabaseProgress) {
  return {
    dailyCount: Number(progress.daily_count) || 0,
    qualifyingDays: Number(progress.qualifying_days) || 0,
    totalCount: Number(progress.total_count) || 0,
    eligible: Boolean(progress.report_eligible),
    timezone: 'UTC',
  };
}

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
    const today = new Date().toISOString().slice(0, 10);
    const { data: progress, error: progressError } = await admin.rpc('get_mood_lift_progress', {
      p_user_id: user.id,
      p_saved_at: today,
    });
    if (progressError) throw progressError;
    if (!progress) throw new Error('Report progress was not returned.');

    return NextResponse.json({
      success: true,
      checkins: ((data || []) as CheckinRow[]).map(toMoodLift),
      reportProgress: toReportProgress(progress as DatabaseProgress),
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
    // bypass the daily limit by submitting a different saved_at value. The RPC
    // locks this user's date, checks the count, and inserts in one transaction.
    const today = new Date().toISOString().slice(0, 10);
    const { data: atomicResult, error: saveError } = await admin.rpc('save_mood_lift_atomic', {
      p_user_id: user.id,
      p_email: user.email,
      p_mood: mood,
      p_feeling: feeling,
      p_target_mood: targetMood,
      p_action_title: actionTitle,
      p_action_desc: actionDesc,
      p_saved_at: today,
    });
    if (saveError) throw saveError;

    const saveResult = atomicResult as {
      limit_reached: boolean;
      daily_count: number;
      qualifying_days: number;
      total_count: number;
      report_eligible: boolean;
      show_daily_reminder?: boolean;
      checkin?: CheckinRow;
    } | null;

    if (saveResult?.limit_reached) {
      return NextResponse.json(
        {
          error: 'You have already saved today’s 3 Mood Lifts.',
          dailyCount: saveResult.daily_count,
          reportProgress: toReportProgress(saveResult),
        },
        { status: 409 },
      );
    }

    if (!saveResult?.checkin) throw new Error('The Mood Lift was not returned after saving.');

    const dailyCount = saveResult.daily_count;
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
      checkin: toMoodLift(saveResult.checkin),
      dailyCount,
      reportProgress: toReportProgress(saveResult),
      showDailyReminder: Boolean(saveResult.show_daily_reminder),
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
