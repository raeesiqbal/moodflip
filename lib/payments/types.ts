import type { ReportCurrency } from './pricing';

export type AirwallexSdkEnvironment = 'sandbox' | 'prod';

export type CheckoutPricingResponse = {
  success: true;
  countryCode: string | null;
  defaultCurrency: ReportCurrency;
  prices: Array<{
    currency: ReportCurrency;
    amountMinor: number;
    decimalPlaces: 0 | 2;
    displayPrice: string;
  }>;
};

export type CheckoutSuccessResponse = {
  success: true;
  orderNumber: string;
  intentId: string;
  clientSecret: string;
  currency: ReportCurrency;
  amount: number;
  displayPrice: string;
  successUrl: string;
  cancelUrl: string;
  countryCode: string | null;
  sdkEnvironment: AirwallexSdkEnvironment;
};

export type CheckoutErrorResponse = {
  success?: false;
  error: string;
};
