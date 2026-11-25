import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { processWebhookEvent } from '@/lib/payments/webhook-processor';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('payment_webhook_events')
    .select('event_id').in('processing_status', ['pending', 'failed', 'processing'])
    .lte('next_attempt_at', new Date().toISOString()).lt('attempts', 12)
    .order('next_attempt_at', { ascending: true }).limit(20);
  if (error) return NextResponse.json({ error: 'Recovery lookup failed' }, { status: 503 });
  let processed = 0;
  for (const event of data || []) {
    try { if (await processWebhookEvent(event.event_id)) processed++; } catch { /* Retained for bounded retry. */ }
  }
  return NextResponse.json({ success: true, examined: data?.length || 0, processed }, { headers: { 'Cache-Control': 'no-store' } });
}
