'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ResetPasswordSentPage() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    document.title = 'Check your email | MoodFlip';
    setEmail(window.sessionStorage.getItem('mf_password_reset_email') ?? '');
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF8F5] flex flex-col justify-between text-[#1A143F]">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] rounded-[28px] border border-[#E4DAD7] bg-[#FEF9F5] p-7 sm:p-9 text-center shadow-[0_12px_40px_rgba(79,67,139,0.08)]">
          <Image
            src="/moodflip-logo.png"
            alt="MoodFlip"
            width={160}
            height={38}
            priority
            className="h-8 w-auto mx-auto mb-5 object-contain mix-blend-multiply"
          />
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EEE8FA] text-2xl" aria-hidden="true">
            ✉
          </div>
          <h1 className="font-serif text-2xl font-extrabold mb-3">Check your mailbox</h1>
          <p className="text-sm font-medium leading-relaxed text-[#5C527A]">
            We sent password reset instructions{email ? <> to <strong className="break-all text-[#1A143F]">{email}</strong></> : ' to your email address'}.
            Open the email and select the reset-password link to choose a new password.
          </p>
          <p className="mt-4 text-xs text-[#746C88]">
            If you do not see it, check your spam or junk folder. The link may take a few minutes to arrive.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/login" className="h-11 rounded-full bg-[#5B4B91] text-white text-sm font-extrabold flex items-center justify-center hover:opacity-95">
              Back to Sign In
            </Link>
            <Link href="/forgot-password" className="text-xs font-bold text-[#7464AC] hover:underline">
              Send another reset link
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
