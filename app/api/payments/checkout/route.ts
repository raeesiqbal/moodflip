import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  AirwallexError,
  cancelPaymentIntent,
  createPaymentIntent,
  getAirwallexConfig,
  retrievePaymentIntent,
  validatePaymentIntent,
  type AirwallexPaymentIntent,
} from '@/lib/payments/airwallex';
import { resolveCountryPricing } from '@/lib/payments/country';
import {
  getSevenDayReportPrice,
  isReportCurrency,
  minorUnitsToMajor,
  type ReportCurrency,
} from '@/lib/payments/pricing';
import {
  getOrCreateEligibleSevenDayReport,
  ReportCheckoutError,
} from '@/lib/payments/report';
import type { CheckoutErrorResponse, CheckoutSuccessResponse } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

const PRODUCT_NAME = '7-Day MoodFlip Report';
const RECOVERABLE_INTENT_STATUS = 'REQUIRES_PAYMENT_METHOD';

type PurchaseRow = {
  id: string;
  user_id: string | null;
  report_id: string | null;
  order_number: string;
  amount_minor: number | null;
  currency: ReportCurrency | null;
  currency_decimals: number | null;
  payment_environment: 'sandbox' | 'production' | null;
  airwallex_payment_intent_id: string | null;
  airwallex_request_id: string | null;
  payment_status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
};

type AuthenticatedUser = {
  id: string;
  email: string;
};

const noStoreHeaders = {
  'Cache-Control': 'private, no-store, no-cache, max-age=0',
};

function errorResponse(message: string, status: number) {
  return NextResponse.json<CheckoutErrorResponse>(
    { success: false, error: message },
    { status, headers: noStoreHeaders },
  );
}

async function authenticate(request: Request): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for checkout.');
  }
  const admin = getSupabaseAdmin();
  const { data: { user }, error } = await admin.auth.getUser(authorization.slice(7));
  if (error || !user?.email || !user.email_confirmed_at) return null;
  return { id: user.id, email: user.email };
}

function trustedApplicationUrl(): URL {
  const value = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) {
    throw new ReportCheckoutError(
      'APP_URL is required for hosted checkout return URLs.',
      'Hosted checkout requires a configured public HTTPS application URL.',
      503,
    );
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ReportCheckoutError(
      'APP_URL is not a valid absolute URL.',
      'Hosted checkout is not configured with a valid public application URL.',
      503,
    );
  }
  if (url.protocol !== 'https:') {
    throw new ReportCheckoutError(
      'Airwallex hosted checkout requires an HTTPS APP_URL.',
      'Hosted checkout requires a public HTTPS application URL. Configure APP_URL with your staging site or HTTPS tunnel.',
      503,
    );
  }
  if (url.username || url.password) {
    throw new ReportCheckoutError(
      'APP_URL must not contain credentials.',
      'Hosted checkout is not configured with a valid public application URL.',
      503,
    );
  }
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url;
}

function checkoutUrls(orderNumber: string) {
  const appUrl = trustedApplicationUrl();
  const successUrl = new URL('/checkout/result', appUrl);
  successUrl.searchParams.set('order', orderNumber);
  const cancelUrl = new URL('/profile', appUrl);
  cancelUrl.searchParams.set('tab', 'My 7-Day Report');
  return {
    appUrl: appUrl.toString(),
    successUrl: successUrl.toString(),
    cancelUrl: cancelUrl.toString(),
  };
}

function orderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `MF7-${date}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
}

async function findPurchase(
  reportId: string,
  statuses: PurchaseRow['payment_status'][],
): Promise<PurchaseRow | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('purchases')
    .select('id,user_id,report_id,order_number,amount_minor,currency,currency_decimals,payment_environment,airwallex_payment_intent_id,airwallex_request_id,payment_status')
    .eq('report_id', reportId)
    .in('payment_status', statuses)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return ((data || [])[0] as PurchaseRow | undefined) || null;
}

function assertCompletePurchase(purchase: PurchaseRow) {
  if (
    !purchase.report_id
    || !purchase.currency
    || purchase.amount_minor === null
    || (purchase.currency_decimals !== 0 && purchase.currency_decimals !== 2)
    || !purchase.airwallex_request_id
    || !purchase.payment_environment
  ) {
    throw new Error(`Purchase ${purchase.id} is missing required checkout fields.`);
  }
  return {
    reportId: purchase.report_id,
    currency: purchase.currency,
    amountMinor: purchase.amount_minor,
    decimalPlaces: purchase.currency_decimals as 0 | 2,
    requestId: purchase.airwallex_request_id,
    environment: purchase.payment_environment,
  };
}

async function saveIntentId(purchaseId: string, intentId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('purchases')
    .update({ airwallex_payment_intent_id: intentId })
    .eq('id', purchaseId);
  if (error) throw error;
}

async function updatePurchaseStatus(
  purchaseId: string,
  paymentStatus: PurchaseRow['payment_status'],
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('purchases')
    .update({ payment_status: paymentStatus, status: paymentStatus })
    .eq('id', purchaseId);
  if (error) throw error;
}

async function createOrRecoverProviderIntent(
  purchase: PurchaseRow,
  user: AuthenticatedUser,
): Promise<AirwallexPaymentIntent> {
  const details = assertCompletePurchase(purchase);
  const config = getAirwallexConfig();
  if (details.environment !== config.environment) {
    throw new Error('The purchase environment does not match the configured Airwallex environment.');
  }
  if (purchase.airwallex_payment_intent_id) {
    const retrieved = await retrievePaymentIntent(purchase.airwallex_payment_intent_id);
    validatePaymentIntent(retrieved, {
      amountMinor: details.amountMinor,
      decimalPlaces: details.decimalPlaces,
      currency: details.currency,
      merchantOrderId: purchase.order_number,
    });
    return retrieved;
  }

  // If a previous create call timed out, this repeats the same persisted
  // request_id. Airwallex idempotency returns the same PaymentIntent rather
  // than starting a second charge attempt.
  const urls = checkoutUrls(purchase.order_number);
  const created = await createPaymentIntent({
    requestId: details.requestId,
    amountMajor: minorUnitsToMajor(details.amountMinor, details.decimalPlaces),
    amountMinor: details.amountMinor,
    decimalPlaces: details.decimalPlaces,
    currency: details.currency,
    merchantOrderId: purchase.order_number,
    returnUrl: urls.successUrl,
    merchantWebsiteUrl: urls.appUrl,
    customerEmail: user.email,
    purchaseId: purchase.id,
    reportId: details.reportId,
  });
  await saveIntentId(purchase.id, created.id);
  purchase.airwallex_payment_intent_id = created.id;
  return created;
}

function clientSecretIsFresh(intent: AirwallexPaymentIntent): boolean {
  if (!intent.client_secret) return false;
  if (!intent.created_at) return true;
  const createdAt = Date.parse(intent.created_at);
  return !Number.isFinite(createdAt) || Date.now() - createdAt < 55 * 60_000;
}

async function cancelSafely(purchase: PurchaseRow, intent: AirwallexPaymentIntent): Promise<void> {
  if (intent.status === 'CANCELLED') {
    await updatePurchaseStatus(purchase.id, 'cancelled');
    return;
  }
  if (intent.status !== RECOVERABLE_INTENT_STATUS) {
    throw new ReportCheckoutError(
      `PaymentIntent ${intent.id} is not safe to replace from status ${intent.status}.`,
      'An earlier payment attempt is still being checked. Please do not start another payment yet.',
      409,
    );
  }
  const cancelled = await cancelPaymentIntent(intent.id);
  if (cancelled.id !== intent.id || cancelled.status !== 'CANCELLED') {
    throw new AirwallexError(
      'Airwallex did not confirm PaymentIntent cancellation.',
      'The earlier checkout could not be safely replaced. Please try again later.',
    );
  }
  await updatePurchaseStatus(purchase.id, 'cancelled');
}

async function prepareExistingPurchase(
  purchase: PurchaseRow,
  requestedCurrency: ReportCurrency,
  user: AuthenticatedUser,
): Promise<{ purchase: PurchaseRow; intent: AirwallexPaymentIntent } | null> {
  const intent = await createOrRecoverProviderIntent(purchase, user);
  const details = assertCompletePurchase(purchase);

  if (details.currency !== requestedCurrency) {
    await cancelSafely(purchase, intent);
    return null;
  }
  if (intent.status === 'CANCELLED') {
    await updatePurchaseStatus(purchase.id, 'cancelled');
    return null;
  }
  if (intent.status !== RECOVERABLE_INTENT_STATUS) {
    throw new ReportCheckoutError(
      `Existing PaymentIntent ${intent.id} has status ${intent.status}.`,
      intent.status === 'SUCCEEDED'
        ? 'Your payment is awaiting secure verification. Please do not pay again.'
        : 'An earlier payment attempt is still in progress. Please do not start another payment yet.',
      409,
    );
  }
  if (!clientSecretIsFresh(intent)) {
    await cancelSafely(purchase, intent);
    return null;
  }
  return { purchase, intent };
}

async function createPendingPurchase(
  reportId: string,
  user: AuthenticatedUser,
  currency: ReportCurrency,
): Promise<PurchaseRow> {
  const admin = getSupabaseAdmin();
  const config = getAirwallexConfig();
  const price = getSevenDayReportPrice(currency);
  const newOrderNumber = orderNumber();
  const { data, error } = await admin
    .from('purchases')
    .insert({
      user_id: user.id,
      email: user.email,
      product: PRODUCT_NAME,
      status: 'pending',
      report_id: reportId,
      order_number: newOrderNumber,
      report_type: '7_day',
      product_name: PRODUCT_NAME,
      amount_minor: price.amountMinor,
      currency,
      currency_decimals: price.decimalPlaces,
      payment_provider: 'airwallex',
      payment_environment: config.environment,
      airwallex_request_id: crypto.randomUUID(),
      airwallex_payment_intent_id: null,
      payment_status: 'pending',
    })
    .select('id,user_id,report_id,order_number,amount_minor,currency,currency_decimals,payment_environment,airwallex_payment_intent_id,airwallex_request_id,payment_status')
    .single();
  if (error) throw error;
  return data as PurchaseRow;
}

function checkoutResponse(
  purchase: PurchaseRow,
  intent: AirwallexPaymentIntent,
  request: Request,
): NextResponse<CheckoutSuccessResponse> {
  const details = assertCompletePurchase(purchase);
  if (!intent.client_secret) {
    throw new AirwallexError(
      'A recoverable PaymentIntent did not contain a client secret.',
      'The payment provider did not return complete checkout details.',
    );
  }
  if (intent.status !== RECOVERABLE_INTENT_STATUS || !clientSecretIsFresh(intent)) {
    throw new ReportCheckoutError(
      `PaymentIntent ${intent.id} cannot be redirected from status ${intent.status}.`,
      'The payment attempt is still being checked and cannot be reopened yet.',
      409,
    );
  }
  const config = getAirwallexConfig();
  if (details.environment !== config.environment) {
    throw new Error('The purchase environment does not match the configured Airwallex environment.');
  }
  const urls = checkoutUrls(purchase.order_number);
  const country = resolveCountryPricing(request);
  const price = getSevenDayReportPrice(details.currency);
  return NextResponse.json({
    success: true,
    orderNumber: purchase.order_number,
    intentId: intent.id,
    clientSecret: intent.client_secret,
    currency: details.currency,
    amount: Number(minorUnitsToMajor(details.amountMinor, details.decimalPlaces)),
    displayPrice: price.displayPrice,
    successUrl: urls.successUrl,
    cancelUrl: urls.cancelUrl,
    countryCode: country.countryCode,
    sdkEnvironment: config.sdkEnvironment,
  }, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) return errorResponse('Authentication is required.', 401);

    const body = await request.json().catch(() => null) as {
      currency?: unknown;
      reportId?: unknown;
      reportType?: unknown;
    } | null;
    const requestedCurrency = body?.currency;
    if (!isReportCurrency(requestedCurrency)) {
      return errorResponse('Choose one of the supported checkout currencies.', 400);
    }
    if (body?.reportType !== undefined && body.reportType !== '7_day') {
      return errorResponse('Only the 7-Day MoodFlip Report is currently available.', 400);
    }

    const admin = getSupabaseAdmin();
    const report = await getOrCreateEligibleSevenDayReport(admin, user.id);
    if (body?.reportId !== undefined && body.reportId !== report.id) {
      return errorResponse('The requested report does not belong to this checkout.', 403);
    }

    const successful = await findPurchase(report.id, ['succeeded']);
    if (successful) {
      return errorResponse('This report has already been purchased.', 409);
    }

    const unresolved = await findPurchase(report.id, ['pending', 'processing']);
    if (unresolved) {
      const recovered = await prepareExistingPurchase(unresolved, requestedCurrency, user);
      if (recovered) return checkoutResponse(recovered.purchase, recovered.intent, request);
    }

    let purchase: PurchaseRow;
    try {
      purchase = await createPendingPurchase(report.id, user, requestedCurrency);
    } catch (error) {
      // The partial unique index permits only one unresolved checkout per
      // report. The losing request recovers the winning row instead.
      if ((error as { code?: string })?.code !== '23505') throw error;
      const concurrent = await findPurchase(report.id, ['pending', 'processing']);
      if (!concurrent) throw error;
      const recovered = await prepareExistingPurchase(concurrent, requestedCurrency, user);
      if (!recovered) {
        purchase = await createPendingPurchase(report.id, user, requestedCurrency);
      } else {
        return checkoutResponse(recovered.purchase, recovered.intent, request);
      }
    }

    const intent = await createOrRecoverProviderIntent(purchase, user);
    return checkoutResponse(purchase, intent, request);
  } catch (error) {
    if (error instanceof ReportCheckoutError) {
      console.error('[payments/checkout] Report checkout rejected:', error.message);
      return errorResponse(error.publicMessage, error.status);
    }
    if (error instanceof AirwallexError) {
      console.error('[payments/checkout] Airwallex request failed:', {
        message: error.message,
        status: error.status,
        code: error.providerCode,
      });
      return errorResponse(
        error.publicMessage,
        error.status === 429 ? 429 : error.status === undefined ? 503 : 502,
      );
    }
    // Supabase/PostgREST errors are plain objects, not Error instances.
    const details = error && typeof error === 'object'
      ? error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown }
      : null;
    console.error('[payments/checkout] Checkout failed:', {
      message: error instanceof Error ? error.message : String(details?.message || 'Unknown error'),
      code: typeof details?.code === 'string' ? details.code : undefined,
      details: typeof details?.details === 'string' ? details.details : undefined,
      hint: typeof details?.hint === 'string' ? details.hint : undefined,
    });
    return errorResponse('Unable to prepare payment checkout. Please try again.', 500);
  }
}
