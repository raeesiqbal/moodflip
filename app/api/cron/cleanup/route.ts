import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Vercel cron invokes GET and sends CRON_SECRET as a Bearer token.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inactive, error } = await admin.from('profiles')
      .select('id, email').lt('last_active_at', cutoff);
    if (error) throw error;

    let deletedCount = 0;
    for (const profile of inactive || []) {
      // Child checkins are cascaded from the profile; remove purchase email data too.
      const { error: purchaseError } = await admin.from('purchases').delete().eq('email', profile.email);
      if (purchaseError) throw purchaseError;
      const { error: deleteError } = await admin.auth.admin.deleteUser(profile.id);
      if (deleteError) throw deleteError;
      deletedCount++;
    }
    return NextResponse.json({ success: true, deletedCount, cutoffDate: cutoff });
  } catch (error) {
    console.error('[cleanup] Failed:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
