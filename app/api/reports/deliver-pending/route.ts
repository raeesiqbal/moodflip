import { getSupabaseAdmin } from '@/lib/supabase';
import { deliverPurchasedReport, reportDeliveryNeedsSandboxRecipient } from '@/lib/emails/report-delivery';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.BUSINESS_NAME || !process.env.BUSINESS_ABN || !process.env.RESEND_API_KEY
    || !(process.env.REPORT_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL)
    || (reportDeliveryNeedsSandboxRecipient() && !process.env.REPORT_SANDBOX_TO_EMAIL)) {
    return Response.json({ error: 'Report delivery configuration incomplete' }, { status: 503 });
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('reports').select('id')
    .in('email_status', ['pending', 'failed', 'sending'])
    .lte('email_next_attempt_at', new Date().toISOString())
    .lt('email_attempts', 8).order('created_at', { ascending: true }).limit(10);
  if (error) return Response.json({ error: 'Delivery queue unavailable' }, { status: 503 });
  let processed = 0;
  for (const row of data || []) {
    try { if (await deliverPurchasedReport(row.id)) processed++; } catch { /* Persisted for retry. */ }
  }
  return Response.json({ processed });
}
