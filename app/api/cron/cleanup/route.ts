import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 100;
const RETENTION_DAYS = 90;
const noStore = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
  }

  const admin = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60_000).toISOString();
  const { data: candidates, error } = await admin.from('profiles')
    .select('id').eq('is_admin', false).lt('last_active_at', cutoff)
    .order('last_active_at', { ascending: true }).limit(BATCH_SIZE);
  if (error) return Response.json({ error: 'Inactive account lookup failed' }, { status: 503, headers: noStore });

  let deletedCount = 0;
  let failedCount = 0;
  for (const candidate of candidates || []) {
    // Recheck immediately before deletion so a recent visit is not deleted
    // based on an earlier batch lookup.
    const { data: stillInactive, error: recheckError } = await admin.from('profiles')
      .select('id').eq('id', candidate.id).eq('is_admin', false)
      .lt('last_active_at', cutoff).maybeSingle();
    if (recheckError) { failedCount++; continue; }
    if (!stillInactive) continue;
    const { data: authRecord, error: authLookupError } = await admin.auth.admin.getUserById(candidate.id);
    if (authLookupError || !authRecord.user) { failedCount++; continue; }
    if (authRecord.user.last_sign_in_at && Date.parse(authRecord.user.last_sign_in_at) >= Date.parse(cutoff)) {
      const { error: syncError } = await admin.from('profiles')
        .update({ last_active_at: authRecord.user.last_sign_in_at })
        .eq('id', candidate.id).lt('last_active_at', authRecord.user.last_sign_in_at);
      if (syncError) failedCount++;
      continue;
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(candidate.id);
    if (deleteError) {
      failedCount++;
      console.error('[cleanup] Unable to delete inactive account:', candidate.id, deleteError.message);
      continue;
    }
    // auth.users -> profiles -> checkins/reports cascade. Purchases keep their
    // financial data; nullable user_id and report_id are cleared by the FKs.
    deletedCount++;
  }

  return Response.json({ success: failedCount === 0, deletedCount, failedCount,
    examined: candidates?.length || 0, cutoffDate: cutoff },
  { status: failedCount ? 503 : 200, headers: noStore });
}
