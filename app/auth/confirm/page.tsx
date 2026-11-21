'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ConfirmEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    const confirm = async () => {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      if (params.has('error') || hash.has('error')) {
        if (active) setStatus('error');
        return;
      }
      // The browser Supabase client consumes the confirmation token in the URL.
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session?.user?.email_confirmed_at) {
        setStatus('error');
        return;
      }
      // Require a fresh sign-in after confirming the address.
      await supabase.auth.signOut();
      if (active) setStatus('success');
    };
    void confirm();
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center p-6 text-[#1A143F]">
      <div className="max-w-md w-full rounded-2xl border border-[#E4DAD7] bg-white p-8 text-center shadow-lg">
        <h1 className="font-serif text-2xl font-bold mb-3">Email verification</h1>
        <p role="status" className="mb-5">
          {status === 'loading' ? 'Verifying your email...' :
            status === 'success' ? 'Your email has been verified. You can now sign in.' :
            'This verification link is invalid or has expired. Please request a new one.'}
        </p>
        {status !== 'loading' && <Link className="font-bold text-[#7464AC] underline" href={status === 'success' ? '/login' : '/register'}>
          {status === 'success' ? 'Sign in' : 'Back to registration'}
        </Link>}
      </div>
    </main>
  );
}
