'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ANALYTICS_CONSENT_EVENT, ANALYTICS_CONSENT_KEY, analyticsAvailable } from '@/lib/analytics';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!analyticsAvailable()) return;
    const refresh = () => {
      try { setVisible(window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === null); }
      catch { setVisible(false); }
    };
    const reopen = () => setVisible(true);
    refresh();
    window.addEventListener('moodflip:open-analytics-choices', reopen);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('moodflip:open-analytics-choices', reopen);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const choose = (accepted: boolean) => {
    let previouslyAccepted = false;
    try {
      previouslyAccepted = window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'accepted';
      window.localStorage.setItem(ANALYTICS_CONSENT_KEY, accepted ? 'accepted' : 'essential_only');
    } catch { setVisible(false); return; }
    window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
    setVisible(false);
    if (previouslyAccepted && !accepted) {
      window.gtag?.('consent', 'update', {
        analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
      });
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (name === '_ga' || name.startsWith('_ga_')) {
          document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
          document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.moodflip.coach; SameSite=Lax`;
        }
      }
      window.location.reload();
    }
  };

  if (!visible) return null;
  return (
    <div role="dialog" aria-label="Analytics choices"
      className="fixed bottom-20 left-3 right-3 z-50 rounded-2xl border border-[#E4DAD7] bg-[#FEF9F5] p-4 text-[#1A1338] shadow-[0_10px_35px_rgba(0,0,0,0.18)] sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md sm:p-5">
      <h2 className="font-serif text-base font-bold">Analytics choices</h2>
      <p className="mt-2 text-xs leading-relaxed text-[#5B5278]">
        With your permission, MoodFlip uses Google Analytics to measure broad site visits and actions.
        We do not send your selected moods, feelings, personal details or report contents.
        You can change this choice later. Read our <Link href="/privacy" className="underline">Terms &amp; Privacy Policy</Link>.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => choose(true)}
          className="rounded-xl bg-[#7464AC] px-5 py-2.5 text-xs font-bold text-white">Allow analytics</button>
        <button type="button" onClick={() => choose(false)}
          className="rounded-xl border border-[#E4DAD7] px-5 py-2.5 text-xs font-bold text-[#5B5278]">Essential only</button>
      </div>
    </div>
  );
}
