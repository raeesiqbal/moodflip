import { getSupabaseAdmin } from '@/lib/supabase';
import { generateReportPDF, parseReportData } from '@/lib/reports/generator';
import { minorUnitsToMajor } from '@/lib/payments/pricing';

const support = 'contact@moodflip.coach';
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);

type Purchase = { id: string; report_id: string; user_id: string; email: string; order_number: string; product_name: string; amount_minor: number; currency: string; currency_decimals: number; paid_at: string; payment_status: string };

function receipt(purchase: Purchase, name: string | null, includeReport: boolean) {
  const business = process.env.BUSINESS_NAME?.trim();
  const abn = process.env.BUSINESS_ABN?.trim();
  if (!business || !abn) throw new Error('Business receipt identity is not configured');
  if (!purchase.paid_at || !Number.isSafeInteger(purchase.amount_minor) || ![0, 2].includes(purchase.currency_decimals)) throw new Error('Verified purchase details are incomplete');
  const amount = new Intl.NumberFormat('en', { style: 'currency', currency: purchase.currency }).format(Number(minorUnitsToMajor(purchase.amount_minor, purchase.currency_decimals as 0 | 2)));
  const lines = [
    `Hello ${name?.trim().split(/\s+/)[0] || 'there'},`, '',
    includeReport ? 'Thank you for purchasing your personalised 7-Day MoodFlip Report. Your report is attached. Please download and save it.' : 'As requested, here are the details of your MoodFlip purchase.',
    '', 'Purchase details', `Business name: ${business}`, `ABN: ${abn}`,
    `Product: ${purchase.product_name}`, `Purchase date: ${new Date(purchase.paid_at).toISOString().slice(0, 10)} UTC`,
    `Amount paid: ${amount} (${purchase.currency})`, `Order reference: ${purchase.order_number}`, '',
    'Please keep this e-mail as your proof of purchase.',
    ...(includeReport ? ['Please save the attached report for future access. Repeat downloads are not available.'] : []),
    `If you need help, contact ${support}.`, '', 'Kind regards,', 'MoodFlip',
  ];
  const text = lines.join('\n');
  const html = `<div style="font-family:Arial,sans-serif;color:#1a143f;max-width:600px;margin:auto"><h1 style="color:#4f438b">MoodFlip</h1>${lines.map((line) => line ? `<p style="margin:8px 0">${escape(line)}</p>` : '<br>').join('')}</div>`;
  return { text, html };
}

async function sendEmail(input: { to: string; subject: string; text: string; html: string; key: string; pdf?: Uint8Array }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL;
  if (!key || !from) throw new Error('Report e-mail sender is not configured');
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(offset, offset + 8192)));
    }
    return btoa(binary);
  };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': input.key },
    body: JSON.stringify({ from, to: [input.to], reply_to: support, subject: input.subject,
      text: input.text, html: input.html,
      ...(input.pdf ? { attachments: [{ filename: 'MoodFlip-7-Day-Report.pdf', content: encode(input.pdf) }] } : {}),
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.id) throw new Error(`Resend did not accept e-mail (HTTP ${response.status})`);
  return String(result.id);
}

export async function deliverPurchasedReport(reportId: string) {
  const admin = getSupabaseAdmin();
  const { data: claimed, error: claimError } = await admin.rpc('claim_report_email', { p_report_id: reportId });
  if (claimError) throw claimError;
  if (!claimed) return false;
  try {
    const { data: report, error: reportError } = await admin.from('reports').select('id,user_id,report_data,email_delivery_key').eq('id', reportId).single();
    if (reportError) throw reportError;
    const { data: purchase, error: purchaseError } = await admin.from('purchases')
      .select('id,report_id,user_id,email,order_number,product_name,amount_minor,currency,currency_decimals,paid_at,payment_status')
      .eq('report_id', reportId).eq('user_id', report.user_id).eq('payment_status', 'succeeded').single();
    if (purchaseError) throw purchaseError;
    const p = purchase as Purchase;
    if (!p.email || !p.order_number || p.report_id !== report.id) throw new Error('Purchase recipient or report mismatch');
    const { data: profile } = await admin.from('profiles').select('name').eq('id', report.user_id).maybeSingle();
    const pdf = generateReportPDF(parseReportData(report.report_data), profile?.name);
    const content = receipt(p, profile?.name || null, true);
    const recipient = process.env.AIRWALLEX_ENV === 'demo' ? process.env.REPORT_SANDBOX_TO_EMAIL : p.email;
    if (!recipient) throw new Error('Sandbox report recipient is not configured');
    const messageId = await sendEmail({ to: recipient, subject: `Your 7-Day MoodFlip Report - Order ${p.order_number}`,
      ...content, key: report.email_delivery_key, pdf });
    const { error: updateError } = await admin.from('reports').update({ email_message_id: messageId,
      email_sent_at: new Date().toISOString(), email_status: 'sent', email_last_error: null })
      .eq('id', reportId).eq('email_status', 'sending');
    if (updateError) throw updateError;
    return true;
  } catch (error) {
    const { data: row } = await admin.from('reports').select('email_attempts').eq('id', reportId).single();
    const attempts = Number(row?.email_attempts) || 1;
    await admin.from('reports').update({ email_status: 'failed',
      email_next_attempt_at: new Date(Date.now() + Math.min(6 * 60 * 60_000, 60_000 * 2 ** attempts)).toISOString(),
      email_last_error: error instanceof Error ? error.message.slice(0, 200) : 'Report delivery failed',
    }).eq('id', reportId).eq('email_status', 'sending');
    throw error;
  }
}

async function requireAdmin(adminUserId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('profiles').select('is_admin').eq('id', adminUserId).single();
  if (error || !data?.is_admin) throw new Error('Administrative authorization required');
}

export async function resendPurchasedReport(adminUserId: string, reportId: string, recoveryId: string) {
  await requireAdmin(adminUserId);
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(recoveryId)) throw new Error('Valid recovery identifier required');
  const admin = getSupabaseAdmin();
  const { data: report, error } = await admin.from('reports')
    .select('email_status,email_message_id,email_delivery_key').eq('id', reportId).single();
  if (error || !report || !['failed', 'bounced'].includes(report.email_status)) throw new Error('Report is not eligible for delivery recovery');
  const recoveryKey = `report-recovery-${reportId}-${recoveryId}`;
  if (report.email_delivery_key !== recoveryKey) {
    const { error: updateError } = await admin.from('reports').update({
      email_delivery_key: recoveryKey, email_message_id: null, email_status: 'failed',
      email_next_attempt_at: new Date().toISOString(), email_attempts: 0,
    }).eq('id', reportId).eq('email_status', report.email_status);
    if (updateError) throw updateError;
  }
  return deliverPurchasedReport(reportId);
}

export async function resendPurchaseReceipt(adminUserId: string, purchaseId: string, requestId: string, verifiedRecipient?: string) {
  await requireAdmin(adminUserId);
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(requestId)) throw new Error('Valid request identifier required');
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('purchases')
    .select('id,report_id,user_id,email,order_number,product_name,amount_minor,currency,currency_decimals,paid_at,payment_status')
    .eq('id', purchaseId).eq('payment_status', 'succeeded').single();
  if (error || !data) throw new Error('Verified purchase not found');
  const purchase = data as Purchase;
  const recipient = verifiedRecipient || purchase.email;
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('Verified receipt recipient required');
  const { data: profile } = purchase.user_id
    ? await admin.from('profiles').select('name').eq('id', purchase.user_id).maybeSingle()
    : { data: null };
  const content = receipt(purchase, profile?.name || null, false);
  return sendEmail({ to: recipient, subject: `Your MoodFlip Purchase Receipt - Order ${purchase.order_number}`,
    ...content, key: `receipt-resend-${purchaseId}-${requestId}` });
}
