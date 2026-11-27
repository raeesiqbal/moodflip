export const ANALYTICS_CONSENT_KEY = 'moodflip_ga_consent_v1';
export const ANALYTICS_CONSENT_EVENT = 'moodflip:analytics-consent';

type AnalyticsEvent = 'sign_up' | 'login' | 'mood_lift' | 'mood_lift_saved' | 'begin_checkout';
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const publicPages = new Set([
  '/', '/about', '/privacy', '/contact', '/moods', '/blog', '/pricing',
  '/refund', '/resources', '/disclaimer', '/terms',
]);
const safeOrigin = 'https://moodflip.coach';
let initialized = false;
let lastPagePath: string | null = null;

export function analyticsAvailable(): boolean {
  if (typeof window === 'undefined' || !measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return false;
  const host = window.location.hostname.toLowerCase();
  return (process.env.NEXT_PUBLIC_GA_ENABLED === 'true' && (host === 'moodflip.coach' || host === 'www.moodflip.coach')) ||
    (process.env.NEXT_PUBLIC_GA_TEST_MODE === 'true' && (host === 'localhost' || host === '127.0.0.1'));
}

export function analyticsConsented(): boolean {
  try { return analyticsAvailable() && window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'accepted'; }
  catch { return false; }
}

function safeLocation(pathname: string): string {
  return safeOrigin + (publicPages.has(pathname) ? pathname : '/');
}

function ensureAnalytics(): boolean {
  if (!analyticsConsented() || !measurementId) return false;
  if (initialized) return true;
  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(..._args: unknown[]) { window.dataLayer?.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  });
  window.gtag('set', {
    send_page_view: false, page_location: safeOrigin + '/', page_title: 'MoodFlip', page_referrer: '',
  });
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, page_location: safeOrigin + '/', page_title: 'MoodFlip', page_referrer: '',
    allow_google_signals: false, allow_ad_personalization_signals: false,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  return true;
}

export function trackPageView(pathname: string): void {
  if (!ensureAnalytics() || !publicPages.has(pathname) || lastPagePath === pathname) return;
  lastPagePath = pathname;
  window.gtag?.('event', 'page_view', {
    send_to: measurementId, page_location: safeLocation(pathname), page_title: 'MoodFlip', page_referrer: '',
  });
}

export function noteNavigation(pathname: string): void {
  if (lastPagePath !== pathname && !publicPages.has(pathname)) lastPagePath = null;
}

export function trackAnalyticsEvent(name: AnalyticsEvent): void {
  if (!ensureAnalytics()) return;
  window.gtag?.('event', name, {
    send_to: measurementId, page_location: safeLocation(window.location.pathname),
    page_title: 'MoodFlip', page_referrer: '',
  });
}

export function trackVerifiedPurchase(input: {
  orderNumber: string;
  amountMinor: number | null;
  currencyDecimals: number | null;
  currency: string | null;
  productName: string | null;
  paymentEnvironment: string | null;
}): void {
  if (input.paymentEnvironment !== 'production' || !ensureAnalytics() ||
    !/^MF7-[0-9]{8}-[A-Z0-9]{12}$/.test(input.orderNumber) ||
    !Number.isSafeInteger(input.amountMinor) || (input.amountMinor || 0) <= 0 ||
    ![0, 2].includes(input.currencyDecimals ?? -1) ||
    !input.currency || !/^[A-Z]{3}$/.test(input.currency) || !input.productName) return;
  const key = `moodflip_ga_purchase_${input.orderNumber}`;
  try {
    if (window.localStorage.getItem(key)) return;
    // GA4 also deduplicates purchase events by transaction_id across sessions.
    window.localStorage.setItem(key, 'sent');
  } catch { return; }
  window.gtag?.('event', 'purchase', {
    send_to: measurementId, transaction_id: input.orderNumber,
    value: input.amountMinor! / 10 ** input.currencyDecimals!, currency: input.currency,
    items: [{ item_id: '7_day', item_name: input.productName, quantity: 1 }],
    page_location: safeOrigin + '/', page_title: 'MoodFlip', page_referrer: '',
  });
}
