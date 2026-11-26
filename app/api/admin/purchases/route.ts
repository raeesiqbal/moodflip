import { requireAdminRequest, noStore } from '@/lib/admin/auth';
import { resendPurchaseReceipt, resendPurchasedReport } from '@/lib/emails/report-delivery';
import { generateReportPDF, parseReportData } from '@/lib/reports/generator';

export const dynamic = 'force-dynamic';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (message: string, status = 503) => Response.json({ error: message }, { status, headers: noStore });

export async function POST(request: Request) {
  const access = await requireAdminRequest(request);
  if (!access) return fail('Administrator access required', 403);
  const body = await request.json().catch(() => null);
  const purchaseId = body?.purchaseId;
  const action = body?.action;
  if (!uuid.test(purchaseId || '') || !['resend-report', 'resend-receipt', 'regenerate'].includes(action)) {
    return fail('Invalid recovery request', 400);
  }
  const { admin, user } = access;
  const { data: purchase, error } = await admin.from('purchases')
    .select('id,user_id,report_id,payment_status,payment_provider')
    .eq('id', purchaseId).eq('payment_status', 'succeeded').eq('payment_provider', 'airwallex').maybeSingle();
  if (error || !purchase) return fail('Confirmed purchase not found', 404);

  if (action === 'resend-receipt') {
    try {
      await resendPurchaseReceipt(user.id, purchase.id, crypto.randomUUID());
      return Response.json({ success: true, message: 'Purchase details sent.' }, { headers: noStore });
    } catch (reason) {
      console.error('[admin] Receipt resend failed:', reason);
      return fail('Unable to resend purchase details');
    }
  }

  if (!purchase.report_id || !purchase.user_id) return fail('The original report is no longer available for recovery', 409);
  if (action === 'resend-report') {
    try {
      const sent = await resendPurchasedReport(user.id, purchase.report_id, crypto.randomUUID());
      if (!sent) return fail('Report e-mail recovery is already underway', 409);
      return Response.json({ success: true, message: 'Report e-mail submitted for delivery.' }, { headers: noStore });
    } catch (reason) {
      console.error('[admin] Report resend failed:', reason);
      return fail('Unable to resend report. Check its delivery status and configuration.');
    }
  }

  const { data: report, error: reportError } = await admin.from('reports')
    .select('id,user_id,report_data,download_completed_at,delivery_status,updated_at')
    .eq('id', purchase.report_id).eq('user_id', purchase.user_id).maybeSingle();
  if (reportError || !report) return fail('Original report is unavailable', 404);
  if (report.download_completed_at) return fail('Original report download was already completed', 409);
  if (report.delivery_status !== 'failed' &&
    !(report.delivery_status === 'processing' && Date.parse(report.updated_at) < Date.now() - 5 * 60_000)) {
    return fail('Report regeneration is not needed or is already underway', 409);
  }
  const { data: claimed, error: claimError } = await admin.rpc('claim_report_download', {
    p_report_id: report.id, p_user_id: report.user_id,
  });
  if (claimError) return fail('Report recovery is unavailable');
  if (!claimed) return fail('Report recovery is already underway or completed', 409);
  try {
    const { data: profile } = await admin.from('profiles').select('name').eq('id', report.user_id).maybeSingle();
    generateReportPDF(parseReportData(report.report_data), profile?.name);
  } catch (reason) {
    await admin.rpc('finish_report_download', { p_report_id: report.id, p_user_id: report.user_id,
      p_success: false, p_error: reason instanceof Error ? reason.message : 'PDF generation failed' });
    return fail('Report generation failed. The purchase remains valid.');
  }
  const { data: recovered, error: updateError } = await admin.from('reports')
    .update({ delivery_status: 'generated', delivery_error: null })
    .eq('id', report.id).eq('delivery_status', 'processing').is('download_completed_at', null)
    .select('id').maybeSingle();
  if (updateError || !recovered) {
    await admin.rpc('finish_report_download', { p_report_id: report.id, p_user_id: report.user_id,
      p_success: false, p_error: 'Recovery state update failed' });
    return fail('Unable to restore the original download option');
  }
  return Response.json({ success: true,
    message: 'PDF generation succeeded. The customer can download the original report from their profile.',
    downloadUrl: '/profile?tab=My%207-Day%20Report' }, { headers: noStore });
}
