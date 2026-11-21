import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'MoodFlip | Self-Help Tool',
  description: 'MoodFlip helps you notice your current mood, understand the feeling behind it, and make one step towards feeling better.',
};

export default function AboutPage() {
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#FDF8F5] text-[#1A143F] font-sans antialiased flex flex-col justify-between selection:bg-[#F4EBF5] selection:text-[#7464AC]">
      <Header />

      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto px-4 sm:px-6 py-2 sm:py-3 w-full">

        {/* ── WIDE SUNRISE BANNER (Compact - zero unnecessary scroll per Spec §23) ── */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#E4DAD7] shadow-xs h-[52px] sm:h-[62px] flex items-center justify-center text-center px-4 bg-[#FDF8F5] shrink-0 mb-2">
          <img
            src="/peaceful-sunrise-bg.png"
            alt="MoodFlip Peaceful Sunrise"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-85"
          />
          <div className="relative z-10 max-w-3xl mx-auto px-2">
            <h1 className="font-serif text-xl sm:text-2xl font-extrabold text-[#4F438B] tracking-tight flex items-center justify-center gap-2">
              About{' '}
              <img
                src="/moodflip-logo.png"
                alt="MoodFlip"
                className="inline-block h-6 sm:h-8 w-auto align-middle object-contain mix-blend-multiply"
              />
            </h1>
          </div>
        </div>

        {/* ── MAIN CONTENT CARD (Scrollable internally if needed) ── */}
        <div className="flex-1 overflow-y-auto rounded-2xl sm:rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-5 sm:p-7 shadow-[0_4px_24px_rgba(26,20,63,0.04)] space-y-3.5 text-[#1A143F]">

          {/* CORRECT #7 — Exact wording from spec with button picture inserted */}
          <p className="text-sm sm:text-base md:text-lg text-[#1A143F] leading-relaxed flex flex-wrap items-center gap-1.5">
            <span>Start by choosing your current mood, then dig deeper and identify the more specific feelings you are experiencing. By pressing</span>
            <img
              src="/flip-my-mood-arrow.png"
              alt="Flip My Mood"
              className="inline-block h-8 sm:h-9 w-auto object-contain align-middle drop-shadow-xs"
            />
            <span>MoodFlip suggests a positive feeling and a short 60-second action to achieve it.</span>
          </p>

          {/* CORRECT #7 continued — profile save paragraph, bold in purple */}
          <p className="text-sm sm:text-base md:text-lg text-[#1A143F] leading-relaxed">
            You can use MoodFlip without creating a profile. If you choose to create a profile, you can save the suggestions and download them in a personalised PDF document, so you&apos;ll have your own collection of ways to improve your most common bad moods —{' '}
            <strong className="text-[#4F438B]">ready to use even when you&apos;re offline.</strong>
          </p>

          {/* Non-medical statement */}
          <p className="text-sm sm:text-base md:text-lg text-[#1A143F] leading-relaxed">
            MoodFlip is designed for small emotional shifts. It is not therapy, medical advice, diagnosis, treatment, or crisis support.
          </p>

          {/* Our aim */}
          <div className="space-y-3 pt-2 bg-[#FAF3EC] p-6 rounded-2xl border border-[#E8DDD8]">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#4F438B]">
              Our aim is simple:
            </h2>
            <ul className="space-y-2 pl-6 text-sm sm:text-base md:text-lg text-[#1A143F] list-disc">
              <li>Notice your mood.</li>
              <li>Identify the feeling behind your mood.</li>
              <li>Take one step <strong>towards</strong> feeling better.</li>
            </ul>
          </div>

          {/* Action CTA */}
          <div className="pt-4 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] text-white text-sm md:text-base font-extrabold shadow-md hover:scale-[1.02] hover:opacity-95 transition-all"
            >
              <span>⚡ Try the Mood Tool</span>
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-bold text-[#7464AC] hover:underline"
            >
              Privacy Policy →
            </Link>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
