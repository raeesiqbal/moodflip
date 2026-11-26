import { requireAdminRequest, noStore } from '@/lib/admin/auth';
import { REPORT_CURRENCIES } from '@/lib/payments/pricing';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (message: string, status = 503) => Response.json({ error: message }, { status, headers: noStore });
const csvCell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? "'" : '') + value.replace(/"/g, '""')}\"`;

export async function GET(request: Request) {
  const access = await requireAdminRequest(request);
  if (!access) return fail('Administrator access required', 403);
  const { admin } = access;
  const params = new URL(request.url).searchParams;
  const view = params.get('view') || 'overview';
  const page = Number(params.get('page') || '1');
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return fail('Invalid page', 400);

  if (view === 'overview') {
    const profileIds = new Set<string>();
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.from('profiles').select('id').eq('is_admin', false)
        .order('id').range(offset, offset + 999);
      if (error) return fail('Unable to load registered users');
      for (const row of data || []) profileIds.add(row.id);
      if (!data || data.length < 1000) break;
    }
    const paidIds = new Set<string>();
    const revenue = Object.fromEntries(REPORT_CURRENCIES.map((currency) => [currency, 0])) as Record<string, number>;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.from('purchases')
        .select('user_id,amount_minor,currency').eq('payment_status', 'succeeded')
        .order('id').range(offset, offset + 999);
      if (error) return fail('Unable to load confirmed purchases');
      for (const row of data || []) {
        if (row.user_id && profileIds.has(row.user_id)) paidIds.add(row.user_id);
        if (row.currency && Number.isSafeInteger(row.amount_minor) && row.currency in revenue) {
          revenue[row.currency] += row.amount_minor!;
        }
      }
      if (!data || data.length < 1000) break;
    }
    return Response.json({ totalUsers: profileIds.size, purchasedUsers: paidIds.size,
      nonPurchasedUsers: profileIds.size - paidIds.size, revenue }, { headers: noStore });
  }

  if (view === 'users') {
    const { data, count, error } = await admin.from('profiles')
      .select('id,name,email,created_at', { count: 'exact' }).eq('is_admin', false)
      .order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (error) return fail('Unable to load registered users');
    const ids = (data || []).map((row) => row.id);
    const paid = new Set<string>();
    const moodCounts: Record<string, number> = {};
    if (ids.length) {
      const { data: purchases, error: purchaseError } = await admin.from('purchases')
        .select('user_id').eq('payment_status', 'succeeded').in('user_id', ids);
      if (purchaseError) return fail('Unable to load purchase status');
      for (const purchase of purchases || []) if (purchase.user_id) paid.add(purchase.user_id);
      for (let offset = 0; ; offset += 1000) {
        const { data: checkins, error: moodError } = await admin.from('checkins')
          .select('user_id').in('user_id', ids).order('id').range(offset, offset + 999);
        if (moodError) return fail('Unable to load saved Mood Lifts');
        for (const checkin of checkins || []) moodCounts[checkin.user_id] = (moodCounts[checkin.user_id] || 0) + 1;
        if (!checkins || checkins.length < 1000) break;
      }
    }
    return Response.json({ page, total: count || 0,
      users: (data || []).map((row) => ({ ...row, moodLiftCount: moodCounts[row.id] || 0,
        purchaseStatus: paid.has(row.id) ? 'Active' : 'Inactive' })) }, { headers: noStore });
  }

  if (view === 'checkins') {
    const userId = params.get('user') || '';
    if (!uuid.test(userId)) return fail('Invalid user', 400);
    const { data: profile, error: profileError } = await admin.from('profiles')
      .select('id,name,email').eq('id', userId).eq('is_admin', false).maybeSingle();
    if (profileError || !profile) return fail('User not found', 404);
    const { data, count, error } = await admin.from('checkins')
      .select('id,mood,feeling,target_mood,action_title,action_desc,saved_at,created_at', { count: 'exact' })
      .eq('user_id', userId).order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (error) return fail('Unable to load saved Mood Lifts');
    return Response.json({ user: profile, entries: data || [], page, total: count || 0 }, { headers: noStore });
  }

  if (view === 'purchases') {
    const { data, count, error } = await admin.from('purchases')
      .select('id,user_id,email,product_name,paid_at,amount_minor,currency,currency_decimals,payment_status,payment_provider,order_number,airwallex_payment_intent_id,report_id', { count: 'exact' })
      .eq('payment_status', 'succeeded').order('paid_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (error) return fail('Unable to load confirmed purchases');
    const userIds = Array.from(new Set((data || []).map((row) => row.user_id).filter((id): id is string => Boolean(id))));
    const reportIds = Array.from(new Set((data || []).map((row) => row.report_id).filter((id): id is string => Boolean(id))));
    const [{ data: profiles, error: profileError }, { data: reports, error: reportError }] = await Promise.all([
      userIds.length ? admin.from('profiles').select('id,name').in('id', userIds) : Promise.resolve({ data: [], error: null }),
      reportIds.length ? admin.from('reports').select('id,delivery_status,email_status,download_completed_at,delivery_error,email_last_error,updated_at').in('id', reportIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (profileError || reportError) return fail('Unable to load purchase delivery details');
    const names = new Map((profiles || []).map((row) => [row.id, row.name]));
    const reportById = new Map((reports || []).map((row) => [row.id, row]));
    return Response.json({ page, total: count || 0,
      purchases: (data || []).map((row) => {
        const report = row.report_id ? reportById.get(row.report_id) || null : null;
        return { ...row, customerName: row.user_id ? names.get(row.user_id) || null : null,
          report, canRecoverDownload: Boolean(row.payment_provider === 'airwallex' && row.user_id && report && !report.download_completed_at &&
            (report.delivery_status === 'failed' ||
              (report.delivery_status === 'processing' && Date.parse(report.updated_at) < Date.now() - 5 * 60_000))),
          canResendReport: Boolean(row.payment_provider === 'airwallex' && row.paid_at &&
            Date.parse(row.paid_at) >= Date.now() - 30 * 24 * 60 * 60_000 && report &&
            ['failed', 'bounced'].includes(report.email_status)) };
      }) }, { headers: noStore });
  }

  if (view === 'csv') {
    const consentedOnly = params.get('scope') === 'consented';
    const rows = [consentedOnly ? 'Name,Email' : 'Name,Email,Promotional email consent'];
    for (let offset = 0; ; offset += 1000) {
      let query = admin.from('profiles').select('name,email,marketing_consent').eq('is_admin', false);
      if (consentedOnly) query = query.eq('marketing_consent', true);
      const { data, error } = await query.order('id').range(offset, offset + 999);
      if (error) return fail('Unable to export registered users');
      for (const row of data || []) rows.push(`${csvCell(row.name || '')},${csvCell(row.email)}` +
        (consentedOnly ? '' : `,${row.marketing_consent ? 'Yes' : 'No'}`));
      if (!data || data.length < 1000) break;
    }
    return new Response('\uFEFF' + rows.join('\r\n') + '\r\n', { headers: { ...noStore,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="moodflip-${consentedOnly ? 'consented' : 'registered'}-users.csv"` } });
  }
  return fail('Unknown admin view', 400);
}
