// Shared fixed-price source of truth. This module contains no secrets and may be
// used by server code or serialized through the pricing API for client display.

export const REPORT_CURRENCIES = [
  'AUD',
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'NZD',
  'CHF',
  'SGD',
  'HKD',
  'JPY',
  'THB',
] as const;

export type ReportCurrency = (typeof REPORT_CURRENCIES)[number];

export type ReportPrice = Readonly<{
  currency: ReportCurrency;
  amountMinor: number;
  decimalPlaces: 0 | 2;
  displayPrice: string;
}>;

export const SEVEN_DAY_REPORT_PRICES: Readonly<Record<ReportCurrency, ReportPrice>> = Object.freeze({
  AUD: { currency: 'AUD', amountMinor: 999, decimalPlaces: 2, displayPrice: 'A$9.99' },
  USD: { currency: 'USD', amountMinor: 700, decimalPlaces: 2, displayPrice: 'US$7.00' },
  EUR: { currency: 'EUR', amountMinor: 600, decimalPlaces: 2, displayPrice: '€6.00' },
  GBP: { currency: 'GBP', amountMinor: 599, decimalPlaces: 2, displayPrice: '£5.99' },
  CAD: { currency: 'CAD', amountMinor: 999, decimalPlaces: 2, displayPrice: 'C$9.99' },
  NZD: { currency: 'NZD', amountMinor: 1199, decimalPlaces: 2, displayPrice: 'NZ$11.99' },
  CHF: { currency: 'CHF', amountMinor: 599, decimalPlaces: 2, displayPrice: 'CHF 5.99' },
  SGD: { currency: 'SGD', amountMinor: 899, decimalPlaces: 2, displayPrice: 'S$8.99' },
  HKD: { currency: 'HKD', amountMinor: 5500, decimalPlaces: 2, displayPrice: 'HK$55' },
  JPY: { currency: 'JPY', amountMinor: 1199, decimalPlaces: 0, displayPrice: '¥1,199' },
  THB: { currency: 'THB', amountMinor: 22900, decimalPlaces: 2, displayPrice: 'THB 229' },
});

export function getSevenDayReportPrice(currency: ReportCurrency): ReportPrice {
  return SEVEN_DAY_REPORT_PRICES[currency];
}

export function isReportCurrency(value: unknown): value is ReportCurrency {
  return typeof value === 'string' && REPORT_CURRENCIES.includes(value as ReportCurrency);
}

/**
 * Converts integer minor units into the exact major-unit string expected by a
 * payment API. Returning a string avoids floating-point rounding in money data.
 */
export function minorUnitsToMajor(amountMinor: number, decimalPlaces: 0 | 2): string {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new RangeError('amountMinor must be a non-negative safe integer.');
  }

  if (decimalPlaces === 0) return String(amountMinor);

  const divisor = 10 ** decimalPlaces;
  const major = Math.floor(amountMinor / divisor);
  const minor = amountMinor % divisor;
  return `${major}.${String(minor).padStart(decimalPlaces, '0')}`;
}

export function getSevenDayReportMajorAmount(currency: ReportCurrency): string {
  const price = getSevenDayReportPrice(currency);
  return minorUnitsToMajor(price.amountMinor, price.decimalPlaces);
}
