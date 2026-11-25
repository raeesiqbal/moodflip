import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/payments/webhook-signature';
import { processWebhookEvent } from '@/lib/payments/webhook-processor';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook configuration unavailable' }, { status: 503 });
  const rawBody = await request.text();
  const valid = await verifyWebhookSignature(request.headers.get('x-timestamp') || '', request.headers.get('x-signature') || '', rawBody, secret);
  if (!valid) return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });

  let event: { id?: unknown; name?: unknown; data?: { object?: { id?: unknown } } };
  try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: 'Malformed webhook' }, { status: 400 }); }
  if (typeof event.id !== 'string' || !event.id || typeof event.name !== 'string' || !event.name) {
    return NextResponse.json({ error: 'Invalid webhook event' }, { status: 400 });
  }
  const intentId = typeof event.data?.object?.id === 'string' ? event.data.object.id : null;
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('payment_webhook_events').upsert({
    event_id: event.id, event_type: event.name, airwallex_payment_intent_id: intentId,
  }, { onConflict: 'event_id', ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: 'Webhook persistence failed' }, { status: 503 });

  // Processing is synchronous here so no event depends on an untracked Worker
  // promise. Failed work remains durable and is retried by the recovery route.
  try { await processWebhookEvent(event.id); } catch (failure) {
    console.error('[payments/webhook] Verification deferred:', failure instanceof Error ? failure.message : 'Unknown error');
  }
  return NextResponse.json({ received: true }, { headers: { 'Cache-Control': 'no-store' } });
}
