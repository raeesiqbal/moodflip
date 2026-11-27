'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/toast';
import { useAuth } from '@/components/AuthProvider';
import { isCurrentUserAdmin } from '@/lib/admin/client';
import { trackAnalyticsEvent } from '@/lib/analytics';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    document.title = 'MoodFlip | Self-Help Tool';
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    void isCurrentUserAdmin(user.id).then((isAdmin) => {
      if (active) router.replace(isAdmin ? '/admin' : '/profile');
    });
    return () => { active = false; };
  }, [authLoading, router, user]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  if (authLoading || user) {
    return (
      <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center">
        <p role="status" className="text-sm font-semibold text-[#7464AC] animate-pulse">
          {authLoading ? 'Checking your session…' : 'Redirecting to your account…'}
        </p>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingStep(1);
    setLoadingStep(2);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          window.sessionStorage.setItem('mf_pending_verification_email', email.trim().toLowerCase());
          window.sessionStorage.setItem('mf_verification_context', 'login');
          router.replace('/verify-email');
          return;
        }
        notify.error(data.error || 'Unable to sign in. Please check your details and try again.', { title: 'Sign-in failed' });
        setIsLoading(false);
        return;
      }

      if (!data.session?.access_token || !data.session?.refresh_token) {
        throw new Error('Sign-in session was not returned. Please try again.');
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) throw sessionError;
      trackAnalyticsEvent('login');

      setLoadingStep(3);
      const params = new URLSearchParams(window.location.search);
      const requestedRedirect = params.get('redirect');
      const safeRedirect = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
        ? requestedRedirect
        : '/profile';
      const redirectUrl = data.isAdmin === true ? '/admin' : safeRedirect.startsWith('/admin') ? '/profile' : safeRedirect;
      notify.success('Sign-in successful. Redirecting…', { title: 'Welcome back' });
      window.setTimeout(() => { window.location.href = redirectUrl; }, 350);
    } catch (err: any) {
      notify.error(err.message || 'Unable to sign in. Please check your details and try again.', { title: 'Sign-in failed' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F5] flex flex-col justify-between selection:bg-[#EEE0FC] selection:text-[#4F438B] relative">
      <Header />

      {/* ── BACKGROUND ARTWORK (Peaceful sunrise from main page as background per Spec §23) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-35">
        <img
          src="/peaceful-sunrise-bg.png"
          alt="Peaceful Sunrise Backdrop"
          className="w-full h-full max-w-6xl object-cover object-center filter contrast-105"
        />
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 py-4 sm:py-6">
        <div className="w-full max-w-[440px] mx-auto">
          
          {/* Main Login Card */}
          <div className="rounded-[28px] border border-[#E4DAD7] bg-[#FEF9F5]/95 backdrop-blur-md p-6 sm:p-8 shadow-[0_12px_40px_rgba(79,67,139,0.06)] flex flex-col justify-center">

            {/* ── TWO TOP BUTTONS: SIGN IN & CREATE ACCOUNT SIDE BY SIDE (Spec §23) ── */}
            <div className="flex items-center gap-2.5 p-1 rounded-full bg-[#F4EBF5] border border-[#E4DAD7] mb-5">
              <button
                type="button"
                className="flex-1 py-2 px-3 rounded-full text-xs font-extrabold text-white transition cursor-default shadow-xs"
                style={{ background: 'linear-gradient(135deg, #7464AC, #4F438B)' }}
              >
                Sign In
              </button>
              <Link
                href="/register"
                className="flex-1 py-2 px-3 rounded-full text-xs font-extrabold text-[#7464AC] hover:text-[#4F438B] hover:bg-[#FEFAF8]/80 text-center transition"
              >
                Create Account
              </Link>
            </div>

            {/* Heading: Sign In with Brand Logo (No plain-text MoodFlip heading per Spec P602/P839) */}
            <div className="text-center mb-5">
              <div className="flex justify-center mb-3">
                <Image src="/moodflip-logo.png" alt="MoodFlip" width={180} height={42} priority className="h-9 w-auto object-contain mix-blend-multiply" />
              </div>
              <h1 className="font-serif font-extrabold text-[#1A143F] text-2xl sm:text-[26px] tracking-tight">
                Sign In
              </h1>
            </div>

            {/* Step indicator */}
            {isLoading && (
              <div className="mb-4 bg-[#FEFAF8] border border-[#E4DAD7] rounded-2xl p-3.5 space-y-2 animate-in fade-in duration-200">
                {[
                  { step: 1, text: 'Verifying e-mail & credentials...', icon: '🔍' },
                  { step: 2, text: 'Authenticating secure session...', icon: '🔐' },
                  { step: 3, text: 'Redirecting to your dashboard...', icon: '🚀' },
                ].map(({ step, text, icon }) => {
                  const isDone = loadingStep > step;
                  const isCurrent = loadingStep === step;
                  return (
                    <div
                      key={step}
                      className={`flex items-center justify-between text-xs font-bold transition-colors ${
                        isDone ? 'text-[#7D8164]' : isCurrent ? 'text-[#7464AC]' : 'text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm shrink-0">{icon}</span>
                        <span className="truncate">{text}</span>
                      </div>
                      <div className="shrink-0 pl-2">
                        {isDone ? (
                          <span className="w-5 h-5 rounded-full bg-[#FCF3E9] text-[#7D8164] flex items-center justify-center text-[10px] font-extrabold border border-[#E4DAD7]">✓</span>
                        ) : isCurrent ? (
                          <span className="w-4 h-4 border-2 border-[#7464AC] border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300 block" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* E-mail Address per Spec P819/P849 */}
              <div>
                <label className="block text-xs font-bold text-[#5C527A] mb-1">
                  E-mail address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-[#A49BA8] text-sm">✉</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isLoading}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border bg-[#FEFAF8] text-sm text-[#1A143F] focus:outline-none transition"
                    style={{ borderColor: '#E4DAD7' }}
                    onFocus={(e) => e.target.style.borderColor = '#7464AC'}
                    onBlur={(e) => e.target.style.borderColor = '#E4DAD7'}
                  />
                </div>
              </div>

              {/* Password — small letters & clean eye icon per Spec §23 */}
              <div>
                <label className="block text-xs font-bold text-[#5C527A] mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-[#A49BA8] text-sm">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="w-full h-11 pl-10 pr-11 rounded-xl border bg-[#FEFAF8] text-sm text-[#1A143F] focus:outline-none transition"
                    style={{ borderColor: '#E4DAD7' }}
                    onFocus={(e) => e.target.style.borderColor = '#7464AC'}
                    onBlur={(e) => e.target.style.borderColor = '#E4DAD7'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#A49BA8] hover:text-[#7464AC] transition cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      /* Eye Slash SVG */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      /* Eye SVG */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-[#5C527A] font-semibold">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#7464AC] w-4 h-4 cursor-pointer"
                  />
                  Remember me
                </label>
                <a href="/forgot-password" className="font-bold hover:underline" style={{ color: '#7464AC' }}>
                  Reset my password
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-full text-white text-sm font-extrabold shadow-md hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                style={{
                  background: isLoading
                    ? 'linear-gradient(90deg, #9C8CC4, #7464AC)'
                    : 'linear-gradient(135deg, #7464AC, #4F438B)',
                  boxShadow: '0 4px 16px rgba(79, 67, 139, 0.28)',
                }}
              >
                {isLoading ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                    Signing in...
                  </>
                ) : (
                  <>Sign In ➔</>
                )}
              </button>
            </form>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
