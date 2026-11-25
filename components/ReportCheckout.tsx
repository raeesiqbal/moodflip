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

export default function ReportCheckout({ eligible }: { eligible: boolean }) {
  const [pricing, setPricing] = useState<CheckoutPricingResponse | null>(null);
  const [currency, setCurrency] = useState<ReportCurrency>('EUR');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [previousPayment, setPreviousPayment] = useState<{ paymentStatus: string; orderNumber?: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/payments/pricing', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load report pricing.');
        return response.json() as Promise<CheckoutPricingResponse>;
      })
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
      const response = await fetch('/api/payments/status', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
      if (response.ok && active) setPreviousPayment(await response.json());
    }).catch(() => {});
    return () => { active = false; };
  }, [eligible]);

  const selectedPrice = useMemo(
    () => pricing?.prices.find((price) => price.currency === currency) || null,
    [currency, pricing],
  );

  const startPayment = async () => {
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
        body: JSON.stringify({ currency, reportType: '7_day' }),
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

      {eligible && previousPayment?.paymentStatus === 'succeeded' ? (
        <p className="text-sm font-semibold text-[#4F438B]">Payment confirmed. Your report is being prepared.</p>
      ) : eligible && ['pending', 'processing'].includes(previousPayment?.paymentStatus || '') ? (
        <p className="text-sm font-semibold text-[#4F438B]">Your earlier payment is being verified. Please wait before starting another checkout.
          {previousPayment?.orderNumber && <a className="ml-1 underline" href={`/checkout/result?order=${encodeURIComponent(previousPayment.orderNumber)}`}>Check status</a>}
        </p>
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
