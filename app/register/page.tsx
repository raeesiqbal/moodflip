'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { notify } from '@/lib/toast';
import AuthPasswordFields from '@/components/AuthPasswordFields';
import { useAuth } from '@/components/AuthProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    document.title = 'MoodFlip | Self-Help Tool';
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(user.app_metadata?.role === 'admin' ? '/admin' : '/profile');
    }
  }, [authLoading, router, user]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentData, setConsentData] = useState(false);
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
    if (password.length < 8) {
      notify.error('Your password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      notify.error('Passwords do not match. Please try again.');
      return;
    }
    if (!consentData) {
      notify.error('Please accept the Privacy Policy before creating your profile.');
      return;
    }
    setIsLoading(true);
    setLoadingStep(2);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          confirmPassword,
          fullName: fullName.trim(),
          consentData,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify.error(data.error || 'Unable to create your account. Please try again.');
        return;
      }
      window.sessionStorage.setItem('mf_pending_verification_email', email.trim());
      window.sessionStorage.setItem('mf_verification_context', 'registration');
      notify.success('We sent a verification link to your email.', {
        title: 'Account created',
      });
      router.replace('/verify-email');
    } catch {
      notify.error('Registration failed. Please try again.');
    } finally {
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

      <main className="relative z-10 flex-1 flex items-center justify-center p-3 py-3 sm:py-4">
        <div className="w-full max-w-[430px] mx-auto">
          
          {/* Main Register Card */}
          <div className="rounded-[26px] border border-[#E4DAD7] bg-[#FEF9F5]/95 backdrop-blur-md p-5 sm:p-6 shadow-[0_12px_40px_rgba(79,67,139,0.06)] flex flex-col justify-center">

            {/* ── TWO TOP BUTTONS: SIGN IN & CREATE ACCOUNT SIDE BY SIDE (Spec §23) ── */}
            <div className="flex items-center gap-2 p-1 rounded-full bg-[#F4EBF5] border border-[#E4DAD7] mb-3.5">
              <Link
                href="/login"
                className="flex-1 py-2 px-3 rounded-full text-xs font-extrabold text-[#7464AC] hover:text-[#4F438B] hover:bg-[#FEFAF8]/80 text-center transition"
              >
                Sign In
              </Link>
              <button
                type="button"
                className="flex-1 py-2 px-3 rounded-full text-xs font-extrabold text-white transition cursor-default shadow-xs"
                style={{ background: 'linear-gradient(135deg, #7464AC, #4F438B)' }}
              >
                Create Account
              </button>
            </div>

            {/* Heading */}
            <div className="text-center mb-4">
              <div className="flex justify-center mb-2">
                <Image src="/moodflip-logo.png" alt="MoodFlip" width={160} height={38} priority className="h-8 w-auto object-contain" />
              </div>
              <h1 className="font-serif font-extrabold text-[#1A143F] text-2xl sm:text-[26px] tracking-tight">
                Create Account
              </h1>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="mb-3 rounded-xl p-3 border border-[#E4DAD7] bg-[#FEFAF8] text-xs space-y-1.5">
                {[
                  { step: 1, label: '📝 Validating your information...' },
                  { step: 2, label: '🔐 Setting up secure profile...' },
                  { step: 3, label: '🚀 Finalizing your account...' },
                ].map(({ step, label }) => (
                  <div key={step} className="flex items-center gap-2 font-semibold"
                    style={{ color: loadingStep >= step ? '#7464AC' : '#A49BA8', opacity: loadingStep >= step ? 1 : 0.4 }}>
                    {loadingStep > step ? '✓' : loadingStep === step
                      ? <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
                      : '○'}
                    {label}
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 text-left">

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#5C527A] mb-1">Full name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-[#A49BA8] text-sm">👤</span>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name" disabled={isLoading}
                    className="w-full h-10 pl-10 pr-4 rounded-xl border bg-[#FEFAF8] text-sm text-[#1A143F] focus:outline-none transition"
                    style={{ borderColor: '#E4DAD7' }}
                    onFocus={(e) => e.target.style.borderColor = '#7464AC'}
                    onBlur={(e) => e.target.style.borderColor = '#E4DAD7'} />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-[#5C527A] mb-1">E-mail address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-[#A49BA8] text-sm">✉</span>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com" disabled={isLoading}
                    className="w-full h-10 pl-10 pr-4 rounded-xl border bg-[#FEFAF8] text-sm text-[#1A143F] focus:outline-none transition"
                    style={{ borderColor: '#E4DAD7' }}
                    onFocus={(e) => e.target.style.borderColor = '#7464AC'}
                    onBlur={(e) => e.target.style.borderColor = '#E4DAD7'} />
                </div>
              </div>

              <AuthPasswordFields
                password={password}
                confirmPassword={confirmPassword}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                disabled={isLoading}
                idPrefix="register"
              />

              {/* Exact Approved Consent Checkbox (Spec §16 #9) */}
              <div className="space-y-1.5 text-[10.5px] text-[#5C527A] font-medium leading-tight pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" required checked={consentData} onChange={(e) => setConsentData(e.target.checked)}
                    className="accent-[#7464AC] w-3.5 h-3.5 cursor-pointer mt-0.5 flex-shrink-0" />
                  <span>
                    By creating a profile, you agree that MoodFlip may store your e-mail address, selected moods and dates, actions shown, and purchase history so we can create and offer personalised downloads.{' '}
                    <a href="/privacy" className="font-bold hover:underline text-[#7464AC]">Privacy Policy</a>
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                className="w-full h-11 rounded-full text-white text-sm font-extrabold shadow-md hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                style={{
                  background: isLoading ? 'linear-gradient(90deg, #9C8CC4, #7464AC)' : 'linear-gradient(135deg, #7464AC, #4F438B)',
                  boxShadow: '0 4px 16px rgba(79, 67, 139, 0.28)'
                }}>
                {isLoading
                  ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Processing...</>
                  : <>Create Free Account ➔</>}
              </button>
            </form>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
