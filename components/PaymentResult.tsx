'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Status = { paymentStatus: string; providerStatus: string | null; canResume: boolean; canRestart: boolean; deliveryStatus: string; emailStatus: string; canDownload: boolean; canRetryDownload: boolean; downloadCompleted: boolean; amountMinor: number | null; currencyDecimals: number | null; currency: string | null; orderNumber: string };

export default function PaymentResult({ order, returnedBack }: { order: string | null; returnedBack: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!order) return;
    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Please sign in to view your payment status.');
        const response = await fetch(`/api/payments/status?order=${encodeURIComponent(order)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store',
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to check payment status.');
        if (active) { setStatus(body); setError(''); }
        if ((body.paymentStatus === 'succeeded' && ['delivered', 'bounced', 'complained'].includes(body.emailStatus)) || body.paymentStatus === 'cancelled' || body.paymentStatus === 'failed' || body.canResume || body.canRestart) return;
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : 'Unable to check payment status.');
      } finally { inFlight = false; }
      attempts++;
      if (active && attempts < 12) timer = setTimeout(() => { if (!document.hidden) void load(); }, 10_000);
      else if (active) setTimedOut(true);
    };
    const onVisible = () => { if (!document.hidden) { clearTimeout(timer); void load(); } };
    void load();
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [order]);

  if (!order) return <p role="alert">Invalid order reference.</p>;
  if (status?.paymentStatus === 'succeeded') return <>
    <h1 className="font-serif text-2xl font-bold text-[#4F438B]">{status.canRetryDownload || ['failed', 'bounced', 'complained'].includes(status.emailStatus) ? 'Payment received.' : 'Payment successful.'}</h1>
    <p className="mt-4 text-sm text-[#5C527A]">{status.canDownload && ['sent', 'delivered'].includes(status.emailStatus)
      ? 'Your MoodFlip Report is ready to download. A copy has also been emailed to you.'
      : status.canDownload || status.canRetryDownload
        ? 'Your report is being prepared. If it does not arrive, you can download it from your profile or contact support.'
        : ['failed', 'bounced', 'complained'].includes(status.emailStatus)
          ? 'Your report e-mail could not be delivered. Please contact support.'
        : status.downloadCompleted && ['sent', 'delivered'].includes(status.emailStatus)
          ? 'Your report download is complete. A copy has also been emailed to you.'
          : 'Your payment has been confirmed. Your personalised MoodFlip Report is being prepared.'}</p>
    <p className="mt-4 text-xs text-gray-500">{status.amountMinor != null && status.currencyDecimals != null && status.currency
      ? `${status.currency} ${(status.amountMinor / 10 ** status.currencyDecimals).toFixed(status.currencyDecimals)}` : 'Amount unavailable'} · {status.orderNumber}</p>
  </>;
  if (status?.paymentStatus === 'cancelled') return <><h1 className="font-serif text-2xl font-bold text-[#4F438B]">Payment cancelled</h1><p className="mt-4 text-sm">Your report remains locked.</p></>;
  if (status?.paymentStatus === 'failed') return <><h1 className="font-serif text-2xl font-bold text-[#4F438B]">Payment unsuccessful</h1><p className="mt-4 text-sm">Your report remains locked. You can try again.</p></>;
  if (status?.canResume) return <>
    <h1 className="font-serif text-2xl font-bold text-[#4F438B]">Payment not completed</h1>
    <p className="mt-4 text-sm text-[#5C527A]">{returnedBack ? 'You left the secure checkout before completing payment.' : 'This checkout is still waiting for payment details.'} Your report remains locked. Return to My 7-Day Report to resume the same order.</p>
  </>;
  if (status?.canRestart) return <><h1 className="font-serif text-2xl font-bold text-[#4F438B]">Checkout not completed</h1><p className="mt-4 text-sm text-[#5C527A]">Your report remains locked. Return to My 7-Day Report to start a new secure checkout.</p></>;
  return <>
    <h1 className="font-serif text-2xl font-bold text-[#4F438B]">Verifying payment</h1>
    <p className="mt-4 text-sm text-[#5C527A]">{timedOut ? 'Confirmation is taking longer than expected. Please check again later before making another payment.' : 'Please wait while your payment is confirmed.'}</p>
    {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
  </>;
}
