import { NextResponse } from 'next/server';
import { resolveCountryPricing } from '@/lib/payments/country';
import { REPORT_CURRENCIES, SEVEN_DAY_REPORT_PRICES } from '@/lib/payments/pricing';
import type { CheckoutPricingResponse } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const detected = resolveCountryPricing(request);
  const body: CheckoutPricingResponse = {
    success: true,
    countryCode: detected.countryCode,
    defaultCurrency: detected.defaultCurrency,
    prices: REPORT_CURRENCIES.map((currency) => SEVEN_DAY_REPORT_PRICES[currency]),
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'private, no-store, no-cache, max-age=0',
      Vary: 'CF-IPCountry',
    },
  });
}
