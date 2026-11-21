'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { notify } from '@/lib/toast';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [context, setContext] = useState<'registration' | 'login'>('registration');
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    document.title = 'Verify your email | MoodFlip';
    setEmail(window.sessionStorage.getItem('mf_pending_verification_email') ?? '');
    setContext(window.sessionStorage.getItem('mf_verification_context') === 'login' ? 'login' : 'registration');

    const lastSentAt = Number(window.sessionStorage.getItem('mf_verification_last_sent_at') ?? 0);
    setCooldown(Math.max(0, RESEND_COOLDOWN_SECONDS - Math.floor((Date.now() - lastSentAt) / 1000)));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown > 0]);

  const handleResend = async () => {
    if (!email || isResending || cooldown > 0) return;
    setIsResending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        notify.error(data.error || 'Unable to resend the verification email. Please try again.');
        return;
      }

      window.sessionStorage.setItem('mf_verification_last_sent_at', String(Date.now()));
      setCooldown(RESEND_COOLDOWN_SECONDS);
      notify.success(data.message, { title: 'Verification email sent' });
    } catch {
      notify.error('Unable to resend the verification email. Please check your connection and try again.');
    } finally {
      setIsResending(false);
    }
  };

  const clearPendingEmail = () => {
    window.sessionStorage.removeItem('mf_pending_verification_email');
    window.sessionStorage.removeItem('mf_verification_context');
  };

  const isLoginAttempt = context === 'login';

  return (
    <div className="relative flex min-h-screen flex-col bg-[#FDF8F5] text-[#1A143F] selection:bg-[#EEE0FC] selection:text-[#4F438B]">
      <Header />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30">
        <Image src="/peaceful-sunrise-bg.png" alt="" fill priority className="object-cover object-center" />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        <section className="w-full max-w-[560px] overflow-hidden rounded-[30px] border border-[#DED4E8] bg-white/95 shadow-[0_24px_70px_rgba(79,67,139,0.16)] backdrop-blur-xl">
          <div className="h-1.5 bg-gradient-to-r from-[#7464AC] via-[#9C8CC4] to-[#E49C8C]" />
          <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#EEE0FC] to-[#FCF3E9] text-[#5B4B94] shadow-[0_12px_28px_rgba(116,100,172,0.18)] ring-1 ring-[#DCCFF0]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 8 7 5 7-5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 4.5 1 1 2-2" />
              </svg>
            </div>

            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-[#7464AC]">
              {isLoginAttempt ? 'Verification required' : 'One last step'}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {isLoginAttempt ? 'Verify your account' : 'Check your email'}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-[#5C527A] sm:text-base">
              {isLoginAttempt ? (
                <>Your account has not been verified yet. Find the verification email{email ? <> sent to <span className="break-all font-extrabold text-[#1A143F]">{email}</span></> : ' in your inbox'}.</>
              ) : (
                <>We sent a verification link{email ? <> to <span className="break-all font-extrabold text-[#1A143F]">{email}</span></> : ' to your email address'}.</>
              )}
              {' '}Open the link to activate your MoodFlip account before signing in.
            </p>

            <div className="mt-7 rounded-2xl border border-[#E8DFEA] bg-gradient-to-br from-[#FCF8FD] to-[#FEF9F5] p-5 text-left">
              <h2 className="font-sans text-sm font-extrabold text-[#1A143F]">If you do not see the email:</h2>
              <ul className="mt-3 space-y-3 text-sm font-semibold leading-5 text-[#5C527A]">
                <li className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E9F7EF] text-xs font-black text-emerald-700">1</span><span>Wait a few minutes and refresh your inbox.</span></li>
                <li className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF1DC] text-xs font-black text-amber-700">2</span><span>Check your spam, junk, and promotions folders.</span></li>
                <li className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEE0FC] text-xs font-black text-[#5B4B94]">3</span><span>If needed, request a new link using the button below.</span></li>
              </ul>
            </div>

            <div className="mt-7 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={!email || isResending || cooldown > 0}
                className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] px-5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(79,67,139,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(79,67,139,0.3)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isResending
                  ? 'Sending verification email...'
                  : cooldown > 0
                    ? `Resend available in ${cooldown}s`
                    : 'Resend verification email'}
              </button>
              <Link
                href={isLoginAttempt ? '/login' : '/register'}
                onClick={clearPendingEmail}
                className="flex h-12 w-full items-center justify-center rounded-full border border-[#D7CDE0] bg-white px-5 text-sm font-extrabold text-[#5C527A] transition hover:border-[#9C8CC4] hover:bg-[#F8F2FB] hover:text-[#4F438B]"
              >
                {isLoginAttempt ? 'Sign in with a different email' : 'Use a different email'}
              </Link>
            </div>

            {!email && (
              <p className="mt-4 text-xs font-bold leading-5 text-rose-600">
                We could not identify the email address. Return to sign in and enter it again.
              </p>
            )}
            <p className="mt-5 text-xs font-semibold leading-5 text-[#7E7096]">For your security, you cannot access your dashboard until your email is verified.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
