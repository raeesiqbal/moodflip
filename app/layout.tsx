import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import SiteLoader from '@/components/SiteLoader';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import CookieConsent from '@/components/CookieConsent';
import MobileBottomNav from '@/components/MobileBottomNav';
import LandscapeEnforcer from '@/components/LandscapeEnforcer';
import ToastProvider from '@/components/ToastProvider';
import { AuthProvider } from '@/components/AuthProvider';
import AnalyticsProvider from '@/components/AnalyticsProvider';

export const metadata: Metadata = {
  title: 'MoodFlip | Self-Help Tool',
  description: 'Tap-only, 60-second mindset shifts for everyday emotional clarity without therapy or questionnaires.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MoodFlip',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* ── Client Cache Busting: Ensures live domain https://moodflip.coach always gets fresh updates ── */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            if (typeof window !== 'undefined') {
              // 1. Force update and purge stale service workers
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var i = 0; i < regs.length; i++) {
                    regs[i].update();
                  }
                });
              }
              // 2. Delete old cache storage immediately
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  for (var i = 0; i < names.length; i++) {
                    if (names[i] !== 'moodflip-v2-live') {
                      caches.delete(names[i]);
                    }
                  }
                });
              }
            }
          })();
        `}} />


        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Nunito+Sans:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body { top: 0px !important; }
          .goog-te-banner-frame, iframe.skiptranslate { display: none !important; visibility: hidden !important; opacity: 0 !important; }
          #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
        `}</style>
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider />
          <Suspense fallback={null}>
            <SiteLoader />
          </Suspense>
          {children}
          <PWAInstallPrompt />
          <CookieConsent />
          <Suspense fallback={null}><AnalyticsProvider /></Suspense>
          <MobileBottomNav />
          <LandscapeEnforcer />
        </AuthProvider>
      </body>
    </html>
  );
}
