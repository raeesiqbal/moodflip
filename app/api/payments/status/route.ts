import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

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
    .select('order_number,payment_status,amount_minor,currency,currency_decimals,report_id')
    .eq('user_id', user.id).eq('report_type', '7_day').order('created_at', { ascending: false });
  if (order) query = query.eq('order_number', order);
  const { data: purchases, error } = await query.limit(order ? 1 : 100);
  if (error) return NextResponse.json({ error: 'Unable to load payment status' }, { status: 503 });
  const purchase = order ? purchases?.[0] : purchases?.find((item) => item.payment_status === 'succeeded') || purchases?.[0];
  if (!purchase && !order) return NextResponse.json({ success: true, paymentStatus: 'none', deliveryStatus: 'not_started' }, { headers: { 'Cache-Control': 'private, no-store' } });
  if (!purchase) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  let deliveryStatus = 'not_started';
  if (purchase.report_id) {
    const { data: report, error: reportError } = await admin.from('reports').select('delivery_status')
      .eq('id', purchase.report_id).eq('user_id', user.id).single();
    if (reportError) return NextResponse.json({ error: 'Unable to load report status' }, { status: 503 });
    deliveryStatus = report.delivery_status;
  }
  return NextResponse.json({ success: true, orderNumber: purchase.order_number,
    paymentStatus: purchase.payment_status, deliveryStatus,
    amount: purchase.amount_minor === null ? null : purchase.amount_minor / 10 ** (purchase.currency_decimals || 0),
    currency: purchase.currency,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
