'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ANALYTICS_CONSENT_EVENT, analyticsConsented, noteNavigation, trackPageView } from '@/lib/analytics';

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const update = () => setConsented(analyticsConsented());
    update();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    noteNavigation(pathname);
    if (consented) trackPageView(pathname);
  }, [consented, pathname]);

  return null;
}
