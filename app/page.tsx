'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSectionExact from '@/components/HeroSectionExact';
import styles from './page.module.css';

export default function HomePage() {
  const [aiData, setAiData] = useState<{
    reframingQuote?: string;
    actionTitle?: string;
    actionSteps?: string[];
    scienceInsight?: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // Supabase falls back to the configured Site URL when a recovery redirect
    // is not allowlisted. Preserve the hash because it contains the temporary
    // recovery session needed by the reset-password page.
    const recoveryParams = new URLSearchParams(window.location.hash.slice(1));
    if (recoveryParams.get('type') === 'recovery') {
      window.location.replace(`/reset-password${window.location.hash}`);
    }
  }, []);

  const fetchAiFlip = async (moodName: string, feelingName: string) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/flip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: moodName, feeling: feelingName })
      });
      const data = await res.json();
      if (data.success && data.aiData) {
        setAiData(data.aiData);
      }
    } catch (e) {
      // silently handle error
    } finally {
      setAiLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#FEF9F5] text-[#1A143F] flex flex-col">
      {/* Global Brand Header */}
      <Header />

      {/* Main Home Sections */}
      <main className={`${styles.homeContainer} flex-1`}>
        
        {/* Exact Reference-Matched Hero Section */}
        <section id="home" className="w-full pt-1 sm:pt-2">
          <HeroSectionExact
            onFlipTriggered={(mood, feeling) => {
              fetchAiFlip(mood, feeling);
            }}
            aiData={aiData}
            aiLoading={aiLoading}
          />
        </section>

      </main>

      <Footer />
    </div>
  );
}
