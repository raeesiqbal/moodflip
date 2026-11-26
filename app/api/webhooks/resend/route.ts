import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function verify(body: string, request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const id = request.headers.get('svix-id');
  const timestamp = request.headers.get('svix-timestamp');
  const signature = request.headers.get('svix-signature');
  if (!secret?.startsWith('whsec_') || !id || !timestamp || !signature) return false;
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false;
  let keyBytes: Uint8Array<ArrayBuffer>;
  try {
    const decoded = atob(secret.slice(6));
    keyBytes = new Uint8Array(new ArrayBuffer(decoded.length));
    for (let i = 0; i < decoded.length; i++) keyBytes[i] = decoded.charCodeAt(i);
  } catch { return false; }
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)));
  const expected = btoa(String.fromCharCode.apply(null, Array.from(digest)));
  return signature.split(' ').some((part) => {
    const actual = part.startsWith('v1,') ? part.slice(3) : '';
    if (actual.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < actual.length; i++) mismatch |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
    return mismatch === 0;
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  if (!(await verify(body, request))) return Response.json({ error: 'Invalid signature' }, { status: 401 });
  let event: { type?: string; data?: { email_id?: string } };
  try { event = JSON.parse(body); } catch { return Response.json({ error: 'Invalid event' }, { status: 400 }); }
  const emailId = event.data?.email_id;
  if (!emailId || !event.type) return Response.json({ ok: true });
  const admin = getSupabaseAdmin();
  const { data: report, error } = await admin.from('reports').select('id,email_status')
    .eq('email_message_id', emailId).maybeSingle();
  if (error) return Response.json({ error: 'Delivery state unavailable' }, { status: 503 });
  // A delivery event can arrive before the send response is persisted.
  // Ask Resend to retry rather than silently discard a valid event.
  if (!report) return Response.json({ error: 'Message not recorded yet' }, { status: 503 });
  const now = new Date().toISOString();
  const updates: Record<string, string | null> = {};
  if (event.type === 'email.delivered' && !['complained', 'bounced'].includes(report.email_status)) {
    updates.email_status = 'delivered'; updates.email_delivered_at = now;
  } else if (event.type === 'email.bounced' && report.email_status !== 'complained') {
    updates.email_status = 'bounced'; updates.email_last_error = 'Email bounced';
  } else if (event.type === 'email.complained') {
    updates.email_status = 'complained'; updates.email_last_error = 'Spam complaint';
  } else if (event.type === 'email.failed' && !['delivered', 'bounced', 'complained'].includes(report.email_status)) {
    updates.email_status = 'failed'; updates.email_last_error = 'Email delivery failed';
    updates.email_message_id = null;
    updates.email_delivery_key = `report-retry-${report.id}-${request.headers.get('svix-id')}`;
    updates.email_next_attempt_at = new Date(Date.now() + 10 * 60_000).toISOString();
  }
  if (Object.keys(updates).length) {
    const { error: updateError } = await admin.from('reports').update(updates).eq('id', report.id);
    if (updateError) return Response.json({ error: 'Unable to update delivery' }, { status: 503 });
  }
  return Response.json({ ok: true });
}
