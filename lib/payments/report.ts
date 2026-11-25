import type { getSupabaseAdmin } from '@/lib/supabase';

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

type ProgressResult = {
  report_eligible?: unknown;
};

type ReportRow = {
  id: string;
  user_id: string;
  report_type: '7_day';
  period_start: string;
  period_end: string;
  saved_days: number;
  entry_count: number;
};

type CheckinSnapshot = {
  id: string;
  mood: string;
  feeling: string;
  target_mood: string | null;
  action_title: string | null;
  action_desc: string | null;
  saved_at: string;
  created_at: string;
};

export class ReportCheckoutError extends Error {
  constructor(
    message: string,
    public readonly publicMessage: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ReportCheckoutError';
  }
}

async function findExistingReport(
  admin: SupabaseAdmin,
  userId: string,
  periodStart: string,
  periodEnd: string,
): Promise<ReportRow | null> {
  const { data, error } = await admin
    .from('reports')
    .select('id,user_id,report_type,period_start,period_end,saved_days,entry_count')
    .eq('user_id', userId)
    .eq('report_type', '7_day')
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle();
  if (error) throw error;
  return data as ReportRow | null;
}

export async function getOrCreateEligibleSevenDayReport(
  admin: SupabaseAdmin,
  userId: string,
): Promise<ReportRow> {
  const todayUtc = new Date().toISOString().slice(0, 10);
  const { data: progress, error: progressError } = await admin.rpc('get_mood_lift_progress', {
    p_user_id: userId,
    p_saved_at: todayUtc,
  });
  if (progressError) throw progressError;
  if (!(progress as ProgressResult | null)?.report_eligible) {
    throw new ReportCheckoutError(
      'The existing Mood Lift progress RPC says this account is not eligible.',
      'Save at least one Mood Lift on seven different UTC calendar days before purchasing the report.',
      403,
    );
  }

  // Eligibility remains owned by get_mood_lift_progress. These rows only select
  // the latest seven qualifying dates for the immutable report snapshot.
  const { data: dateRows, error: dateError } = await admin
    .from('checkins')
    .select('saved_at')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
    .limit(1000);
  if (dateError) throw dateError;

  const qualifyingDates = Array.from(new Set(
    ((dateRows || []) as Array<{ saved_at: string }>).map((row) => row.saved_at),
  )).slice(0, 7).sort();
  if (qualifyingDates.length !== 7) {
    throw new ReportCheckoutError(
      'Eligible progress did not resolve to seven report dates.',
      'Your report dates could not be prepared. Please try again.',
      409,
    );
  }

  const periodStart = qualifyingDates[0];
  const periodEnd = qualifyingDates[qualifyingDates.length - 1];
  const existing = await findExistingReport(admin, userId, periodStart, periodEnd);
  if (existing) return existing;

  const { data: entryRows, error: entriesError } = await admin
    .from('checkins')
    .select('id,mood,feeling,target_mood,action_title,action_desc,saved_at,created_at')
    .eq('user_id', userId)
    .in('saved_at', qualifyingDates)
    .order('saved_at', { ascending: true })
    .order('created_at', { ascending: true });
  if (entriesError) throw entriesError;

  const entries = (entryRows || []) as CheckinSnapshot[];
  if (entries.length < 7 || entries.length > 21) {
    throw new ReportCheckoutError(
      `Unexpected seven-day report entry count: ${entries.length}.`,
      'Your report data could not be prepared for checkout. Please contact support.',
      409,
    );
  }

  const { data: created, error: createError } = await admin
    .from('reports')
    .insert({
      user_id: userId,
      report_type: '7_day',
      period_start: periodStart,
      period_end: periodEnd,
      saved_days: 7,
      entry_count: entries.length,
      report_data: {
        schemaVersion: 1,
        qualifyingDates,
        entries,
      },
      delivery_status: 'not_started',
    })
    .select('id,user_id,report_type,period_start,period_end,saved_days,entry_count')
    .single();

  if (!createError && created) return created as ReportRow;
  // Another checkout may have created the same report concurrently.
  if (createError?.code === '23505') {
    const concurrent = await findExistingReport(admin, userId, periodStart, periodEnd);
    if (concurrent) return concurrent;
  }
  throw createError || new Error('The report record was not created.');
}
