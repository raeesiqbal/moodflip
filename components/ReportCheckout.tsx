'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { redirectToAirwallex } from '@/lib/payments/checkout-client';
import type {
  CheckoutErrorResponse,
  CheckoutPricingResponse,
  CheckoutSuccessResponse,
} from '@/lib/payments/types';
import type { ReportCurrency } from '@/lib/payments/pricing';

let pricingRequest: Promise<CheckoutPricingResponse> | null = null;
let statusRequest: { token: string; promise: Promise<unknown> } | null = null;
function loadPricing() {
  if (!pricingRequest) pricingRequest = fetch('/api/payments/pricing', { cache: 'no-store' })
    .then((response) => { if (!response.ok) throw new Error('Unable to load report pricing.'); return response.json() as Promise<CheckoutPricingResponse>; })
    .catch((error) => { pricingRequest = null; throw error; });
  return pricingRequest;
}
function loadPaymentStatus(token: string) {
  if (statusRequest?.token === token) return statusRequest.promise;
  const promise = fetch('/api/payments/status', {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  }).then((response) => { if (!response.ok) throw new Error('Unable to load payment status.'); return response.json(); })
    .finally(() => { if (statusRequest?.promise === promise) statusRequest = null; });
  statusRequest = { token, promise };
  return promise;
}

export default function ReportCheckout({ eligible }: { eligible: boolean }) {
  const [pricing, setPricing] = useState<CheckoutPricingResponse | null>(null);
  const [currency, setCurrency] = useState<ReportCurrency>('EUR');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [previousPayment, setPreviousPayment] = useState<{ paymentStatus: string; deliveryStatus?: string; emailStatus?: string; reportId?: string | null; canDownload?: boolean; canRetryDownload?: boolean; downloadCompleted?: boolean; amountMinor?: number | null; currencyDecimals?: number | null; providerStatus?: string | null; canResume?: boolean; canRestart?: boolean; orderNumber?: string; currency?: ReportCurrency } | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (eligible && (loadingPayment || previousPayment?.paymentStatus === 'succeeded')) return;
    let active = true;
    loadPricing()
      .then((result) => {
        if (!active) return;
        setPricing(result);
        setCurrency(result.defaultCurrency);
      })
      .catch((error) => {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'Unable to load report pricing.');
      })
      .finally(() => {
        if (active) setLoadingPricing(false);
      });
    return () => { active = false; };
  }, [eligible, loadingPayment, previousPayment?.paymentStatus]);

  useEffect(() => {
    if (!eligible) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let polls = 0;
    const refresh = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Session unavailable');
        const result = await loadPaymentStatus(session.access_token) as typeof previousPayment;
        if (!active) return;
        setPreviousPayment(result);
        setErrorMessage('');
        polls++;
        if (result?.paymentStatus === 'succeeded' && !['delivered', 'bounced', 'complained'].includes(result.emailStatus || '') && polls < 12) {
          timer = setTimeout(() => { if (!document.hidden) void refresh(); }, 10_000);
        }
      } catch {
        if (active) setErrorMessage('Unable to load your purchase status. Please refresh.');
      } finally { if (active) setLoadingPayment(false); }
    };
    const onVisible = () => { if (!document.hidden) { clearTimeout(timer); void refresh(); } };
    void refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [eligible]);

  const selectedPrice = useMemo(
    () => pricing?.prices.find((price) => price.currency === currency) || null,
    [currency, pricing],
  );

  const startPayment = async (paymentCurrency: ReportCurrency = currency) => {
    if (submitting || !selectedPrice) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please sign in again.');

      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency: paymentCurrency, reportType: '7_day' }),
      });
      const result = await response.json() as CheckoutSuccessResponse | CheckoutErrorResponse;
      if (!response.ok || !('success' in result) || result.success !== true) {
        throw new Error('error' in result ? result.error : 'Unable to prepare payment checkout.');
      }

      await redirectToAirwallex({
        intentId: result.intentId,
        clientSecret: result.clientSecret,
        currency: result.currency,
        successUrl: result.successUrl,
        cancelUrl: result.cancelUrl,
        countryCode: result.countryCode,
        environment: result.sdkEnvironment,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to open secure payment checkout.');
      setSubmitting(false);
    }
  };

  const downloadReport = async () => {
    if (!previousPayment?.reportId || downloading) return;
    setDownloading(true);
    setErrorMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please sign in again.');
      const response = await fetch(`/api/reports/${encodeURIComponent(previousPayment.reportId)}/download`, {
        headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store',
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'Unable to download your report.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'MoodFlip-7-Day-Report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      const status = await loadPaymentStatus(session.access_token) as typeof previousPayment;
      setPreviousPayment(status);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to download your report.');
      const { data: { session } } = await supabase.auth.getSession();
      if (session) void loadPaymentStatus(session.access_token).then((status) => setPreviousPayment(status as typeof previousPayment)).catch(() => {});
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {previousPayment?.paymentStatus === 'succeeded' ? (
        <div className="inline-block rounded-2xl border border-[#E4DAD7] bg-white p-6 text-left w-full max-w-sm mx-auto mb-6 shadow-2xs">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Purchase confirmed</p>
          <p className="text-xl font-bold text-[#4F438B]">7-Day MoodFlip Report</p>
          <p className="mt-2 text-sm text-[#5C527A]">Paid {previousPayment.amountMinor != null && previousPayment.currency && previousPayment.currencyDecimals != null
            ? `${previousPayment.currency} ${(previousPayment.amountMinor / 10 ** previousPayment.currencyDecimals).toFixed(previousPayment.currencyDecimals)}`
            : 'amount unavailable'}</p>
          {previousPayment.orderNumber && <p className="mt-1 text-xs text-gray-500">Order {previousPayment.orderNumber}</p>}
        </div>
      ) : (!eligible || !loadingPayment) && <div className="inline-block rounded-2xl border border-[#E4DAD7] bg-white p-6 text-left w-full max-w-sm mx-auto mb-6 shadow-2xs">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">
          One-time purchase
        </p>
        <p className="text-3xl font-bold text-[#4F438B] mb-1" aria-live="polite">
          {loadingPricing ? 'Loading price…' : selectedPrice?.displayPrice || 'Price unavailable'}{' '}
          {!loadingPricing && selectedPrice && (
            <span className="text-base font-normal text-gray-400">/ report</span>
          )}
        </p>
        <ul className="text-xs sm:text-sm text-gray-600 space-y-2 mt-4">
          <li className="flex items-center gap-2">
            <span className="text-green-600 font-bold">✓</span> Full 7-day mood analysis
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600 font-bold">✓</span> Personalised Mood Flip insights
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600 font-bold">✓</span> Downloadable PDF format
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600 font-bold">✓</span> Actionable suggestions
          </li>
        </ul>
      </div>}

      {eligible && loadingPayment ? (
        <p role="status" className="text-sm font-semibold text-[#4F438B]">Checking your purchase status…</p>
      ) : eligible && previousPayment?.paymentStatus === 'succeeded' ? (
        <div className="text-sm font-semibold text-[#4F438B]">
          <p className="mb-3">{previousPayment.canDownload && ['sent', 'delivered'].includes(previousPayment.emailStatus || '')
            ? 'Your MoodFlip Report is ready to download. A copy has also been emailed to you.'
            : previousPayment.downloadCompleted
              ? ['sent', 'delivered'].includes(previousPayment.emailStatus || '')
                ? 'Your report download is complete. A copy has also been emailed to you.'
                : 'Your report download is complete. Your purchase confirmation e-mail is being prepared.'
              : previousPayment.canDownload || previousPayment.canRetryDownload
                ? 'Your report is being prepared. If it does not arrive, you can download it from your profile or contact support.'
                : ['failed', 'bounced', 'complained'].includes(previousPayment.emailStatus || '')
                  ? 'Your report e-mail could not be delivered. Please contact support.'
                : 'Your personalised report is being prepared.'}</p>
          {(previousPayment.canDownload || previousPayment.canRetryDownload) && previousPayment.reportId && (
            <button type="button" disabled={downloading} onClick={() => void downloadReport()} className="mt-4 rounded-full bg-[#4F438B] px-7 py-3 text-white disabled:opacity-60">
              {downloading ? 'Preparing report…' : previousPayment.canRetryDownload ? 'Retry download' : 'Download report'}
            </button>
          )}
        </div>
      ) : eligible && ['pending', 'processing'].includes(previousPayment?.paymentStatus || '') ? (
        <div className="text-sm font-semibold text-[#4F438B]">
          <p>{previousPayment?.canResume
            ? 'Your previous checkout was not completed. You can continue securely with the same order.'
            : previousPayment?.canRestart ? 'Your previous checkout is no longer active. You can start a new secure checkout.'
            : 'Your earlier payment is still being checked. Please wait before starting another checkout.'}</p>
          {(previousPayment?.canResume || previousPayment?.canRestart) && previousPayment.currency && (
            <button type="button" disabled={submitting} onClick={() => void startPayment(previousPayment.currency)}
              className="mt-4 rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] px-7 py-3 text-white disabled:opacity-60">
              {submitting ? 'Opening secure checkout…' : previousPayment.canResume ? 'Resume checkout' : 'Start new checkout'}
            </button>
          )}
          {previousPayment?.orderNumber && <a className="mt-3 block underline" href={`/checkout/result?order=${encodeURIComponent(previousPayment.orderNumber)}`}>Check payment status</a>}
        </div>
      ) : eligible ? (
        <div>
          <p className="text-sm font-bold text-[#4F438B] mb-4 max-w-lg mx-auto leading-relaxed">
            Your 7-Day MoodFlip Report is ready. Continue to secure checkout to purchase your personalised report.
          </p>

          {!checkoutOpen ? (
            <button
              type="button"
              onClick={() => {
                setCheckoutOpen(true);
                setErrorMessage('');
              }}
              disabled={loadingPricing || !selectedPrice}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] text-white font-semibold px-8 py-3 text-sm hover:opacity-90 transition shadow-xs disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <span aria-hidden="true">📄</span>
              Get My 7-Day MoodFlip Report{selectedPrice ? ` — ${selectedPrice.displayPrice}` : ''}
            </button>
          ) : (
            <div className="mx-auto max-w-md rounded-2xl border border-[#D8CDE0] bg-white p-5 text-left shadow-sm">
              <h4 className="font-serif text-lg font-bold text-[#4F438B]">7-Day MoodFlip Report</h4>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#5C527A]">
                  Currency
                  <select
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value as ReportCurrency)}
                    disabled={submitting}
                    className="mt-1.5 w-full rounded-xl border border-[#D8CDE0] bg-white px-3 py-2.5 text-sm text-[#1A143F] outline-none focus:border-[#7464AC] disabled:opacity-60"
                  >
                    {pricing?.prices.map((price) => (
                      <option key={price.currency} value={price.currency}>
                        {price.currency}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <p className="text-xs font-semibold text-[#5C527A]">Price</p>
                  <p className="mt-1.5 rounded-xl bg-[#F4EBF5] px-3 py-2.5 text-sm font-bold text-[#4F438B]">
                    {selectedPrice?.displayPrice}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void startPayment()}
                disabled={submitting || !selectedPrice}
                className="mt-5 w-full rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Opening secure checkout…' : `Pay ${selectedPrice?.displayPrice || ''}`}
              </button>
              <p className="mt-3 text-center text-[11px] text-gray-400">
                Payment details are entered securely on Airwallex&apos;s hosted checkout page.
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm font-semibold text-[#7464AC]">
          Save at least one Mood Lift on seven different calendar days to unlock the purchase option.
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="mx-auto mt-4 max-w-md text-sm font-semibold text-red-600">
          {errorMessage}
        </p>
      )}
    </>
  );
}
