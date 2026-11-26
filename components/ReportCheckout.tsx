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
  const [previousPayment, setPreviousPayment] = useState<{ paymentStatus: string; deliveryStatus?: string; emailStatus?: string; reportId?: string | null; providerStatus?: string | null; canResume?: boolean; canRestart?: boolean; orderNumber?: string; currency?: ReportCurrency } | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!eligible) return;
    let active = true;
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const result = await loadPaymentStatus(session.access_token);
      if (active) setPreviousPayment(result as typeof previousPayment);
    }).catch(() => { if (active) setErrorMessage('Unable to load your purchase status. Please refresh.'); })
      .finally(() => { if (active) setLoadingPayment(false); });
    return () => { active = false; };
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
      setPreviousPayment((current) => current ? { ...current, deliveryStatus: 'delivered' } : current);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to download your report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="inline-block rounded-2xl border border-[#E4DAD7] bg-white p-6 text-left w-full max-w-sm mx-auto mb-6 shadow-2xs">
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
      </div>

      {eligible && loadingPayment ? (
        <p role="status" className="text-sm font-semibold text-[#4F438B]">Checking your purchase status…</p>
      ) : eligible && previousPayment?.paymentStatus === 'succeeded' ? (
        <div className="text-sm font-semibold text-[#4F438B]">
          <p className="mb-3">{previousPayment.emailStatus === 'delivered'
            ? 'Your report e-mail has been delivered.'
            : previousPayment.emailStatus === 'sent' ? 'Your report e-mail has been sent.'
            : ['failed', 'bounced'].includes(previousPayment.emailStatus || '')
              ? 'We encountered an e-mail delivery issue. Your payment remains valid. Please contact contact@moodflip.coach if your report does not arrive.'
              : 'Your purchase confirmation and report e-mail are being prepared.'}</p>
          {previousPayment.deliveryStatus === 'delivered' ? (
            <p>Your report download was delivered. Your purchase remains confirmed.</p>
          ) : previousPayment.deliveryStatus === 'failed' ? (
            <div>
              <p>We could not prepare your report. Your payment remains valid and you will not be charged again.</p>
              <p className="mt-2">Please contact <a className="underline" href="mailto:contact@moodflip.coach">contact@moodflip.coach</a> for help.</p>
              <button type="button" disabled={downloading} onClick={() => void downloadReport()} className="mt-4 rounded-full bg-[#4F438B] px-7 py-3 text-white disabled:opacity-60">Retry download</button>
            </div>
          ) : previousPayment.deliveryStatus === 'processing' ? (
            <div>
              <p>Your report is being prepared. If the download was interrupted, you can retry after a few minutes.</p>
              <button type="button" disabled={downloading} onClick={() => void downloadReport()} className="mt-4 rounded-full bg-[#4F438B] px-7 py-3 text-white disabled:opacity-60">Retry download</button>
            </div>
          ) : previousPayment.reportId ? (
            <div>
              <p>Your payment is confirmed. Your personalised report is ready for its initial download.</p>
              <button type="button" disabled={downloading} onClick={() => void downloadReport()} className="mt-4 rounded-full bg-[#4F438B] px-7 py-3 text-white disabled:opacity-60">{downloading ? 'Preparing report…' : 'Download report'}</button>
            </div>
          ) : <p>Payment confirmed. Your report is being prepared.</p>}
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
