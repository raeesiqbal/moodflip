import { getSupabaseAdmin } from '@/lib/supabase';
import { generateReportPDF, parseReportData } from '@/lib/reports/generator';

export const dynamic = 'force-dynamic';

const errorResponse = (message: string, status: number) =>
  Response.json({ error: message }, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function GET(request: Request, context: { params: Promise<{ reportId: string }> }) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ') || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('Authentication required', 401);
  }
  const { reportId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportId)) {
    return errorResponse('Report not found', 404);
  }
  const admin = getSupabaseAdmin();
  const { data: { user }, error: authError } = await admin.auth.getUser(authorization.slice(7));
  if (authError || !user) return errorResponse('Authentication required', 401);

  const { data: report, error: reportError } = await admin.from('reports')
    .select('id,user_id,report_type,report_data,delivery_status')
    .eq('id', reportId).eq('user_id', user.id).eq('report_type', '7_day').maybeSingle();
  if (reportError) return errorResponse('Unable to load report', 503);
  if (!report) return errorResponse('Report not found', 404);
  const { data: purchase, error: purchaseError } = await admin.from('purchases')
    .select('id').eq('report_id', reportId).eq('user_id', user.id)
    .eq('payment_status', 'succeeded').eq('payment_provider', 'airwallex').limit(1);
  if (purchaseError) return errorResponse('Unable to verify purchase', 503);
  if (!purchase?.length) return errorResponse('Verified purchase required', 403);

  const { data: claimed, error: claimError } = await admin.rpc('claim_report_download', {
    p_report_id: reportId, p_user_id: user.id,
  });
  if (claimError) return errorResponse('Report delivery is unavailable', 503);
  if (!claimed) return errorResponse('Report delivery is already underway or completed', 409);

  let bytes: Uint8Array;
  try {
    const { data: profile, error: profileError } = await admin.from('profiles')
      .select('name').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    bytes = generateReportPDF(parseReportData(report.report_data), profile?.name);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'PDF generation failed';
    await admin.rpc('finish_report_download', {
      p_report_id: reportId, p_user_id: user.id, p_success: false, p_error: reason,
    });
    return errorResponse('Your report could not be prepared. Your payment remains valid. Please contact contact@moodflip.coach.', 503);
  }

  let sent = false;
  let finalized = false;
  const finish = async (success: boolean) => {
    if (finalized) return;
    const { error } = await admin.rpc('finish_report_download', {
      p_report_id: reportId, p_user_id: user.id, p_success: success,
      p_error: success ? null : 'Download interrupted',
    });
    if (error) throw error;
    finalized = true;
  };
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!sent) {
        sent = true;
        controller.enqueue(bytes);
        return;
      }
      await finish(true);
      controller.close();
    },
    async cancel() { await finish(false); },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="MoodFlip-7-Day-Report.pdf"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
