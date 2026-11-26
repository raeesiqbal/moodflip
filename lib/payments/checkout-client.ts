'use client';

import type { AirwallexSdkEnvironment } from './types';

type RedirectParams = {
  intentId: string;
  clientSecret: string;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  countryCode?: string | null;
  environment: AirwallexSdkEnvironment;
};

type AirwallexInitResult = Awaited<ReturnType<
  (typeof import('@airwallex/components-sdk'))['init']
>>;
type AirwallexPayments = NonNullable<AirwallexInitResult['payments']>;

let initializedEnvironment: AirwallexSdkEnvironment | null = null;
let paymentsPromise: Promise<AirwallexPayments> | null = null;

function configuredSdkEnvironment(): AirwallexSdkEnvironment | null {
  const value = process.env.NEXT_PUBLIC_AIRWALLEX_ENV?.trim().toLowerCase();
  if (!value) return null;
  if (value === 'demo' || value === 'sandbox') return 'sandbox';
  if (value === 'prod' || value === 'production') return 'prod';
  throw new Error('NEXT_PUBLIC_AIRWALLEX_ENV is invalid.');
}

async function getPayments(environment: AirwallexSdkEnvironment) {
  const sdkEnvironment = environment === 'sandbox' ? 'demo' : 'prod';
  const configured = configuredSdkEnvironment();
  // The authenticated server response is authoritative and is passed
  // explicitly to init(), so the SDK can never silently use its production
  // default. When a public build-time value exists, it must agree.
  if (configured && configured !== environment) {
    throw new Error('The Airwallex browser and server environments do not match.');
  }
  if (initializedEnvironment && initializedEnvironment !== environment) {
    throw new Error('Airwallex was already initialized for a different environment.');
  }
  if (!paymentsPromise) {
    initializedEnvironment = environment;
    paymentsPromise = import('@airwallex/components-sdk').then(async ({ init }) => {
      const initialized = await init({
        env: sdkEnvironment,
        enabledElements: ['payments'],
      });
      if (!initialized.payments) throw new Error('Airwallex payments failed to initialize.');
      return initialized.payments;
    });
  }
  return paymentsPromise;
}

export async function redirectToAirwallex(params: RedirectParams): Promise<void> {
  const payments = await getPayments(params.environment);
  const redirectUrl = payments.redirectToCheckout({
    env: params.environment === 'sandbox' ? 'demo' : 'prod',
    mode: 'payment',
    intent_id: params.intentId,
    client_secret: params.clientSecret,
    currency: params.currency,
    successUrl: params.successUrl,
    ...(params.countryCode ? { country_code: params.countryCode } : {}),
    autoCapture: true,
    autoSaveCardForFuturePayments: false,
    submitType: 'pay',
  });
  if (typeof redirectUrl === 'string') window.location.assign(redirectUrl);
}
