'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Status = { paymentStatus: string; deliveryStatus: string; amount: number | null; currency: string | null; orderNumber: string };

export default function PaymentResult({ order }: { order: string | null }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!order) return;
    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Please sign in to view your payment status.');
        const response = await fetch(`/api/payments/status?order=${encodeURIComponent(order)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store',
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to check payment status.');
        if (active) { setStatus(body); setError(''); }
        if (body.paymentStatus === 'succeeded' || body.paymentStatus === 'cancelled' || body.paymentStatus === 'failed') return;
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : 'Unable to check payment status.');
      }
      attempts++;
      if (active && attempts < 12) timer = setTimeout(() => void load(), 5000);
      else if (active) setTimedOut(true);
    };
    void load();
    return () => { active = false; clearTimeout(timer); };
  }, [order]);

  if (!order) return <p role="alert">Invalid order reference.</p>;
  if (status?.paymentStatus === 'succeeded') return <>
    <h1 className="font-serif text-2xl font-bold text-[#4F438B]">Payment successful.</h1>
    <p className="mt-4 text-sm text-[#5C527A]">Your payment has been confirmed. Your MoodFlip Report is being prepared.</p>
    <p className="mt-4 text-xs text-gray-500">{status.amount?.toFixed(status.currency === 'JPY' ? 0 : 2)} {status.currency} · {status.orderNumber}</p>
  </>;
  if (status?.paymentStatus === 'cancelled') return <><h1 className="font-serif text-2xl font-bold text-[#4F438B]">Payment cancelled</h1><p className="mt-4 text-sm">Your report remains locked.</p></>;
  if (status?.paymentStatus === 'failed') return <><h1 className="font-serif text-2xl font-bold text-[#4F438B]">Payment unsuccessful</h1><p className="mt-4 text-sm">Your report remains locked. You can try again.</p></>;
  return <>
    <h1 className="font-serif text-2xl font-bold text-[#4F438B]">Verifying payment</h1>
    <p className="mt-4 text-sm text-[#5C527A]">{timedOut ? 'Confirmation is taking longer than expected. Please check again later before making another payment.' : 'Please wait while your payment is confirmed.'}</p>
    {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
  </>;
}
