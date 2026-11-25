import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { resolveCountryPricingFromHeaders } from '@/lib/payments/country';
import { getSevenDayReportPrice } from '@/lib/payments/pricing';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const countryPricing = resolveCountryPricingFromHeaders(await headers());
  const reportPrice = getSevenDayReportPrice(countryPricing.defaultCurrency);

  return (
    <div className="min-h-screen bg-[#FDF8F5] text-[#1A143F] flex flex-col justify-between selection:bg-[#EEE0FC] selection:text-[#4F438B]">
      <Header />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-block rounded-full bg-[#F4EBF5] border border-[#E4DAD7] px-3.5 py-1 text-xs font-bold text-[#7464AC] uppercase tracking-wider mb-2">
            Simple, Transparent Pricing
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#1A143F] mb-3">
            Start free. Go deeper when it&apos;s useful.
          </h1>
          <p className="text-sm text-[#5C527A] leading-relaxed">
            The everyday MoodFlip tool stays free forever. A personalised report is an optional one-time purchase.
          </p>
        </div>

        {/* 2-Card Layout (Phase 1 — 30-Day card hidden until Phase 2 per Spec P254-P255) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
          
          {/* CARD 1: FREE PLAN */}
          <div className="rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-7 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7464AC]">Everyday Tool</span>
              <h2 className="font-serif text-2xl font-bold mt-1 text-[#1A143F]">Free</h2>
              <div className="my-5 flex items-baseline gap-1">
                <span className="font-serif text-4xl font-extrabold text-[#1A143F]">US$0</span>
              </div>
              <ul className="space-y-3 text-sm text-[#5C527A] mb-8 font-medium">
                <li className="flex items-center gap-2.5">
                  <span className="text-[#7464AC] font-bold">✓</span> Use whenever you need it.
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[#7464AC] font-bold">✓</span> No profile required.
                </li>
              </ul>
            </div>
            <Link
              href="/"
              className="block w-full text-center rounded-full border-2 border-[#7464AC] py-3 text-sm font-extrabold text-[#7464AC] hover:bg-[#F4EBF5] transition shadow-xs"
            >
              Use MoodFlip free →
            </Link>
          </div>

          {/* CARD 2: 7-DAY PLAN */}
          <div className="rounded-3xl border-2 border-[#7464AC] bg-[#FEFAF8] p-7 sm:p-8 shadow-md flex flex-col justify-between relative">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7464AC]">Personalised Report</span>
              
              {/* Heading with Logo per P239 */}
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-serif text-2xl font-bold text-[#1A143F]">7-day</span>
                <Image src="/moodflip-logo.png" alt="MoodFlip" width={115} height={28} className="h-6 w-auto inline-block object-contain mix-blend-multiply" />
                <span className="font-serif text-2xl font-bold text-[#1A143F]">Report</span>
              </div>

              {/* Request-specific country suggestion from the shared fixed-price source. */}
              <div className="my-5 flex items-baseline gap-1">
                <span className="font-serif text-4xl font-extrabold text-[#1A143F]">{reportPrice.displayPrice}</span>
              </div>

              {/* Purple frame box per P241 */}
              <div className="mb-5 rounded-2xl bg-[#F4EBF5] border border-[#D8CDE0] p-3.5 text-xs text-[#4F438B] font-semibold leading-relaxed shadow-2xs">
                Track your mood-boosting actions for 7 days and create your personalised MoodFlip Report!
              </div>

              {/* Bullets per P242-P244 */}
              <ul className="space-y-3 text-xs sm:text-sm text-[#5C527A] mb-8 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#7464AC] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Save at least 1 Mood Lift on 7 different days.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#7464AC] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Save up to 3 Mood Lifts daily, up to 21 entries in total.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#7464AC] font-bold shrink-0 mt-0.5">✓</span>
                  <span>Download your personalized PDF containing all your saved Mood Lifts and receive a copy by e-mail.</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register?redirect=/profile"
              className="block w-full text-center rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] py-3 text-sm font-extrabold text-white shadow-md hover:opacity-95 transition"
            >
              Get My 7-Day MoodFlip Report →
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
