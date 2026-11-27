'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { analyticsAvailable } from '@/lib/analytics';

export default function Footer() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  useEffect(() => setAnalyticsEnabled(analyticsAvailable()), []);
  return (
    <footer className="w-full bg-[#FAF5F6] border-t border-[#E4DAD7] text-[#7E7096] py-3 px-4 sm:px-6 lg:px-8 shrink-0">
      <div className="mx-auto max-w-[1240px] flex flex-col sm:flex-row items-center justify-between text-xs gap-1.5 font-medium">
        <div>© {new Date().getFullYear()} MoodFlip. All rights reserved.</div>
        <div className="text-center sm:text-right flex items-center gap-2">
          <Link href="/moods" className="hover:underline text-[#7464AC] font-semibold">
            Mood Guides
          </Link>
          <span>·</span>
          {analyticsEnabled && <>
            <button type="button" onClick={() => window.dispatchEvent(new Event('moodflip:open-analytics-choices'))}
              className="hover:underline text-[#7464AC] font-semibold">Analytics choices</button>
            <span>·</span>
          </>}
          <span>Self-Help Tool · Not therapy or medical advice</span>
        </div>
      </div>
    </footer>
  );
}
