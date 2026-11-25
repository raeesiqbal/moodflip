import { getSupabaseAdmin } from '@/lib/supabase';
import { getAirwallexConfig, retrievePaymentIntent, validatePaymentIntent } from './airwallex';
import { isReportCurrency } from './pricing';

type EventRow = { event_id: string; event_type: string; airwallex_payment_intent_id: string | null; attempts: number };

export async function processWebhookEvent(eventId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data: claimed, error: claimError } = await admin.rpc('claim_payment_webhook_event', { p_event_id: eventId });
  if (claimError) throw claimError;
  if (!claimed) return false;

  try {
    const { data: event, error: eventError } = await admin.from('payment_webhook_events')
      .select('event_id,event_type,airwallex_payment_intent_id,attempts').eq('event_id', eventId).single();
    if (eventError) throw eventError;
    const row = event as EventRow;
    if (!row.event_type.startsWith('payment_intent.') || !row.airwallex_payment_intent_id) {
      const { error } = await admin.from('payment_webhook_events').update({ processing_status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', eventId);
      if (error) throw error;
      return true;
    }

    const { data: purchase, error: purchaseError } = await admin.from('purchases')
      .select('id,report_id,user_id,order_number,amount_minor,currency,currency_decimals,payment_environment,payment_status')
      .eq('airwallex_payment_intent_id', row.airwallex_payment_intent_id).single();
    if (purchaseError) throw purchaseError;
    if (!purchase || !isReportCurrency(purchase.currency) || (purchase.currency_decimals !== 0 && purchase.currency_decimals !== 2) || purchase.amount_minor === null) {
      throw new Error('Purchase has incomplete payment details');
    }
    const config = getAirwallexConfig();
    if (purchase.payment_environment !== config.environment) throw new Error('Payment environment mismatch');
    const intent = await retrievePaymentIntent(row.airwallex_payment_intent_id);
    if (intent.id !== row.airwallex_payment_intent_id) throw new Error('PaymentIntent ID mismatch');
    validatePaymentIntent(intent, { amountMinor: purchase.amount_minor, decimalPlaces: purchase.currency_decimals, currency: purchase.currency, merchantOrderId: purchase.order_number });
    if (config.accountId && intent.account_id && intent.account_id !== config.accountId) throw new Error('Merchant account mismatch');
    const { error: finishError } = await admin.rpc('finish_payment_webhook_event', {
      p_event_id: eventId, p_intent_id: intent.id, p_provider_status: intent.status,
      p_order_number: intent.merchant_order_id, p_amount_minor: purchase.amount_minor,
      p_currency: intent.currency, p_environment: config.environment,
      p_paid_at: intent.status === 'SUCCEEDED' && intent.updated_at ? intent.updated_at : null,
    });
    if (finishError) throw finishError;
    return true;
  } catch (error) {
    const { data: record } = await admin.from('payment_webhook_events').select('attempts').eq('event_id', eventId).single();
    const attempts = Number(record?.attempts) || 1;
    await admin.from('payment_webhook_events').update({
      processing_status: 'failed',
      next_attempt_at: new Date(Date.now() + Math.min(6 * 60 * 60_000, 60_000 * 2 ** Math.min(attempts, 8))).toISOString(),
      last_error: error instanceof Error ? error.message.slice(0, 300) : 'Verification failed',
    }).eq('event_id', eventId);
    throw error;
  }
}
