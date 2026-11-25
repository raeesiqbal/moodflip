import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAirwallexConfig, retrievePaymentIntent, validatePaymentIntent } from '@/lib/payments/airwallex';
import { isReportCurrency } from '@/lib/payments/pricing';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const token = request.headers.get('authorization');
  if (!token?.startsWith('Bearer ') || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { data: { user }, error: authError } = await admin.auth.getUser(token.slice(7));
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const order = new URL(request.url).searchParams.get('order');
  if (order && order.length > 64) return NextResponse.json({ error: 'Valid order required' }, { status: 400 });
  let query = admin.from('purchases')
    .select('order_number,payment_status,amount_minor,currency,currency_decimals,report_id,airwallex_payment_intent_id,payment_environment')
    .eq('user_id', user.id).eq('report_type', '7_day').order('created_at', { ascending: false });
  if (order) query = query.eq('order_number', order);
  const { data: purchases, error } = await query.limit(order ? 1 : 100);
  if (error) return NextResponse.json({ error: 'Unable to load payment status' }, { status: 503 });
  const purchase = order ? purchases?.[0] : purchases?.find((item) => item.payment_status === 'succeeded') || purchases?.[0];
  if (!purchase && !order) return NextResponse.json({ success: true, paymentStatus: 'none', deliveryStatus: 'not_started' }, { headers: { 'Cache-Control': 'private, no-store' } });
  if (!purchase) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  let deliveryStatus = 'not_started';
  let emailStatus = 'pending';
  if (purchase.report_id) {
    const { data: report, error: reportError } = await admin.from('reports').select('delivery_status,email_status')
      .eq('id', purchase.report_id).eq('user_id', user.id).single();
    if (reportError) return NextResponse.json({ error: 'Unable to load report status' }, { status: 503 });
    deliveryStatus = report.delivery_status;
    emailStatus = report.email_status;
  }
  let providerStatus: string | null = null;
  let canResume = false;
  let canRestart = false;
  if (purchase.payment_status !== 'succeeded' && purchase.airwallex_payment_intent_id) {
    try {
      const config = getAirwallexConfig();
      if (config.environment !== purchase.payment_environment || !isReportCurrency(purchase.currency)
        || (purchase.currency_decimals !== 0 && purchase.currency_decimals !== 2) || purchase.amount_minor === null) {
        throw new Error('Stored checkout details are inconsistent');
      }
      const intent = await retrievePaymentIntent(purchase.airwallex_payment_intent_id);
      if (intent.id !== purchase.airwallex_payment_intent_id) throw new Error('PaymentIntent ID mismatch');
      validatePaymentIntent(intent, { amountMinor: purchase.amount_minor, decimalPlaces: purchase.currency_decimals,
        currency: purchase.currency, merchantOrderId: purchase.order_number });
      providerStatus = intent.status;
      const createdAt = intent.created_at ? Date.parse(intent.created_at) : NaN;
      const secretFresh = !Number.isFinite(createdAt) || Date.now() - createdAt < 55 * 60_000;
      canResume = intent.status === 'REQUIRES_PAYMENT_METHOD' && Boolean(intent.client_secret) && secretFresh;
      canRestart = intent.status === 'CANCELLED' || (intent.status === 'REQUIRES_PAYMENT_METHOD' && !canResume);
    } catch {
      // Never infer cancellation, failure, or success from a failed provider lookup.
    }
  }
  return NextResponse.json({ success: true, orderNumber: purchase.order_number,
    paymentStatus: purchase.payment_status, deliveryStatus, emailStatus,
    reportId: purchase.payment_status === 'succeeded' ? purchase.report_id : null,
    providerStatus, canResume, canRestart,
    amount: purchase.amount_minor === null ? null : purchase.amount_minor / 10 ** (purchase.currency_decimals || 0),
    currency: purchase.currency,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
