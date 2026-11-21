'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { notify } from '@/lib/toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  useEffect(() => {
    document.title = 'MoodFlip | Self-Help Tool';
  }, []);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${siteUrl.replace(/\/$/, '')}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      notify.error(`We could not send a reset link: ${error.message}`, { title: 'Reset link not sent' });
      return;
    }
    window.sessionStorage.setItem('mf_password_reset_email', cleanEmail);
    router.push('/reset-password-sent');
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
          {/* Main Card */}
          <div className="rounded-[28px] border border-[#E4DAD7] bg-[#FEF9F5]/95 backdrop-blur-md p-6 sm:p-8 shadow-[0_12px_40px_rgba(79,67,139,0.06)] flex flex-col justify-center">

            {/* Heading with Brand Logo */}
            <div className="text-center mb-5">
              <div className="flex justify-center mb-2">
                <Image
                  src="/moodflip-logo.png"
                  alt="MoodFlip"
                  width={160}
                  height={38}
                  priority
                  className="h-8 w-auto object-contain mix-blend-multiply"
                />
              </div>
              <h1 className="font-serif font-extrabold text-[#1A143F] text-2xl sm:text-[26px] tracking-tight">
                Reset Password
              </h1>
              <p className="text-xs text-[#5C527A] mt-1.5 font-medium leading-relaxed">
                Enter your e-mail address and we&apos;ll send password reset instructions.
              </p>
            </div>

            {/* Notification */}
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
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
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    disabled={isLoading}
                    className="w-full h-10 pl-10 pr-4 rounded-xl border bg-[#FEFAF8] text-sm text-[#1A143F] focus:outline-none transition"
                    style={{ borderColor: '#E4DAD7' }}
                    onFocus={(e) => (e.target.style.borderColor = '#7464AC')}
                    onBlur={(e) => (e.target.style.borderColor = '#E4DAD7')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-full text-white text-sm font-extrabold shadow-md hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2 mt-3"
                style={{
                  background: isLoading
                    ? 'linear-gradient(90deg, #9C8CC4, #7464AC)'
                    : 'linear-gradient(135deg, #7464AC, #4F438B)',
                  boxShadow: '0 4px 16px rgba(79, 67, 139, 0.28)',
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link ➔'}
              </button>
            </form>

            <div className="text-center mt-5">
              <Link
                href="/login"
                className="text-xs font-bold text-[#7464AC] hover:text-[#4F438B] hover:underline transition"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
