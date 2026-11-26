'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLoading from '@/components/AdminLoading';

export default function AdminGate() {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'signed-out' | 'denied' | 'error'>('checking');
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { if (active) setState('signed-out'); return; }
        const response = await fetch('/api/admin/session', {
          method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store',
        });
        if (!active) return;
        if (response.status === 403) { setState('denied'); return; }
        if (!response.ok) { setState('error'); return; }
        router.refresh();
      } catch { if (active) setState('error'); }
    })();
    return () => { active = false; };
  }, [router]);
  if (state === 'checking') return <AdminLoading />;
  return <main className="min-h-screen bg-[#FDF8F5] p-8 text-center text-[#4F438B]">
    <h1 className="font-serif text-3xl">MoodFlip administration</h1>
    {state === 'signed-out' && <><p className="my-6">Sign in with your authorised administrator account.</p>
      <a className="rounded-full bg-[#4F438B] px-6 py-3 text-white" href="/login?redirect=/admin">Admin login</a></>}
    {state === 'denied' && <p role="alert" className="mt-6">This account is not authorised for administration.</p>}
    {state === 'error' && <p role="alert" className="mt-6">Administrator access could not be checked. Please refresh or try again later.</p>}
  </main>;
}
