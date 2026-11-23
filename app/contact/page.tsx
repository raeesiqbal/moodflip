'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { notify } from '@/lib/toast';

const MAX_MESSAGE_LENGTH = 500;
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          size: 'flexible';
          theme: 'light';
          action: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function TurnstileWidget({
  onTokenChange,
  resetSignal,
}: {
  onTokenChange: (token: string) => void;
  resetSignal: number;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const widgetIdRef = React.useRef<string | null>(null);

  const renderWidget = React.useCallback(() => {
    if (
      !TURNSTILE_SITE_KEY ||
      !containerRef.current ||
      !window.turnstile ||
      widgetIdRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      size: 'flexible',
      theme: 'light',
      action: 'contact',
      callback: onTokenChange,
      'expired-callback': () => onTokenChange(''),
      'error-callback': () => onTokenChange(''),
    });
  }, [onTokenChange]);

  React.useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  React.useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  if (!TURNSTILE_SITE_KEY) {
    return <p className="text-sm text-red-600">Security check is temporarily unavailable.</p>;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} className="w-full" />
    </>
  );
}

export default function ContactPage() {
  React.useEffect(() => {
    document.title = 'MoodFlip | Self-Help Tool';
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [website, setWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  const charsLeft = MAX_MESSAGE_LENGTH - formData.message.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.message.length > MAX_MESSAGE_LENGTH) {
      notify.error(`Your message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, website, turnstileToken }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'We could not send your message.');
      }
      notify.success('Thank you for reaching out. We will respond within 24–48 hours.', { title: 'Message sent' });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTurnstileToken('');
      setTurnstileResetSignal((value) => value + 1);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'We could not send your message.', { title: 'Message not sent' });
      setTurnstileToken('');
      setTurnstileResetSignal((value) => value + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-[#FDF8F5] text-[#1A143F] font-sans antialiased flex flex-col justify-between selection:bg-[#F4EBF5] selection:text-[#7464AC]">
      <Header />

      <main className="flex-1 flex flex-col max-w-3xl mx-auto px-4 sm:px-6 py-2 sm:py-3 w-full space-y-2">

        {/* ── BANNER (Compact, no subtitle per Spec §23) ── */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#E4DAD7] shadow-xs h-[52px] sm:h-[62px] flex items-center justify-center text-center px-4 bg-[#FDF8F5] shrink-0">
          <img
            src="/peaceful-sunrise-bg.png"
            alt="MoodFlip Peaceful Sunrise"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          />
          <div className="relative z-10 max-w-2xl mx-auto px-2">
            <h1 className="font-serif text-xl sm:text-2xl font-extrabold text-[#4F438B] tracking-tight flex items-center justify-center gap-2">
              Contact{' '}
              <img
                src="/moodflip-logo.png"
                alt="MoodFlip"
                className="inline-block h-6 sm:h-8 w-auto align-middle object-contain mix-blend-multiply"
              />
            </h1>
          </div>
        </div>

        {/* ── CONTACT FORM (2-column layout per Joy's instruction: Left=Name+Email, Right=Subject+Message) ── */}
        <div className="flex-1 overflow-y-auto rounded-2xl sm:rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-4 sm:p-5 shadow-[0_4px_24px_rgba(26,20,63,0.04)]">

            <form onSubmit={handleSubmit} className="space-y-3">

              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute h-px w-px overflow-hidden opacity-0 pointer-events-none"
              />

              {/* Name and e-mail share a row; subject and message each have their own row. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div>
                  {/* Your Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#5C527A] mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-[#E4DAD7] bg-[#FDF8F5] px-3.5 py-2 text-sm text-[#1A143F] placeholder-[#A49BA8] focus:outline-none focus:ring-2 focus:ring-[#7464AC]/40 focus:border-[#7464AC] transition font-medium"
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#5C527A] mb-1">Your E-mail</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-[#E4DAD7] bg-[#FDF8F5] px-3.5 py-2 text-sm text-[#1A143F] placeholder-[#A49BA8] focus:outline-none focus:ring-2 focus:ring-[#7464AC]/40 focus:border-[#7464AC] transition font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  {/* Subject */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#5C527A] mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-xl border border-[#E4DAD7] bg-[#FDF8F5] px-3.5 py-2 text-sm text-[#1A143F] placeholder-[#A49BA8] focus:outline-none focus:ring-2 focus:ring-[#7464AC]/40 focus:border-[#7464AC] transition font-medium"
                    />
                  </div>

                </div>

                <div className="sm:col-span-2">
                  {/* Your Message - max 500 chars with live countdown */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#5C527A] mb-1">
                      Your Message
                    </label>
                    <textarea
                      rows={7}
                      required
                      maxLength={MAX_MESSAGE_LENGTH}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border border-[#E4DAD7] bg-[#FDF8F5] px-3.5 py-2 text-sm text-[#1A143F] placeholder-[#A49BA8] focus:outline-none focus:ring-2 focus:ring-[#7464AC]/40 focus:border-[#7464AC] transition font-medium resize-none"
                    />
                    <p aria-live="polite" className={`text-[11px] mt-1 text-right font-medium ${charsLeft <= 50 ? 'text-red-500' : 'text-[#A49BA8]'}`}>
                      {charsLeft} characters remaining
                    </p>
                  </div>
                </div>

              </div>

              <div className="flex justify-center min-h-[65px]">
                <TurnstileWidget
                  onTokenChange={setTurnstileToken}
                  resetSignal={turnstileResetSignal}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className="w-full rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] py-2.5 sm:py-3 text-sm font-extrabold text-white shadow-md shadow-[#4F438B]/20 hover:opacity-95 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send Message →'}
              </button>

            </form>
        </div>

      </main>

      <Footer />
    </div>
  );
}
