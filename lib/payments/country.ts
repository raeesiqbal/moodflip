import type { ReportCurrency } from './pricing';

const DIRECT_CURRENCY_BY_COUNTRY: Readonly<Record<string, ReportCurrency>> = Object.freeze({
  AU: 'AUD',
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  NZ: 'NZD',
  CH: 'CHF',
  SG: 'SGD',
  HK: 'HKD',
  JP: 'JPY',
  TH: 'THB',
});

// Bulgaria joined the euro area on 1 January 2026, bringing the total to 21.
const EUROZONE_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
]);

const CLOUDFLARE_SPECIAL_COUNTRY_CODES = new Set(['XX', 'T1']);

type CloudflareRequest = Request & { cf?: { country?: unknown } };

export type CountryPricing = Readonly<{
  countryCode: string | null;
  defaultCurrency: ReportCurrency;
}>;

export function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized) || CLOUDFLARE_SPECIAL_COUNTRY_CODES.has(normalized)) {
    return null;
  }
  return normalized;
}

export function currencyForCountry(countryCode: unknown): ReportCurrency {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) return 'EUR';
  if (EUROZONE_COUNTRIES.has(normalized)) return 'EUR';
  return DIRECT_CURRENCY_BY_COUNTRY[normalized] || 'EUR';
}

export function resolveCountryPricing(request: Request): CountryPricing {
  const cloudflareCountry = (request as CloudflareRequest).cf?.country;
  return resolveCountryPricingValue(cloudflareCountry || request.headers.get('cf-ipcountry'));
}

export function resolveCountryPricingFromHeaders(headers: Headers): CountryPricing {
  return resolveCountryPricingValue(headers.get('cf-ipcountry'));
}

function resolveCountryPricingValue(detectedCountry: unknown): CountryPricing {
  const developmentOverride = process.env.NODE_ENV !== 'production'
    ? process.env.DEV_COUNTRY_OVERRIDE
    : undefined;
  const countryCode = normalizeCountryCode(
    developmentOverride || detectedCountry,
  );

  return {
    countryCode,
    defaultCurrency: currencyForCountry(countryCode),
  };
}
