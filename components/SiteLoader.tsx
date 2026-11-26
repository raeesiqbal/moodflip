'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import MoodFlipLoaderVisual from '@/components/MoodFlipLoaderVisual';

export default function SiteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFade(false);
    const timer1 = setTimeout(() => setFade(true), 500);
    const timer2 = setTimeout(() => setLoading(false), 850);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [pathname, searchParams]);

  if (!loading || pathname.startsWith('/admin')) return null;
  return <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FDF8F5]/90 p-4 backdrop-blur-md transition-opacity duration-300 ${fade ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
    <MoodFlipLoaderVisual />
  </div>;
}
