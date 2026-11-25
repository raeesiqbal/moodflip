import type { AirwallexSdkEnvironment } from './types';
import type { ReportCurrency } from './pricing';

const REQUEST_TIMEOUT_MS = 12_000;
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

type AirwallexEnvironment = 'sandbox' | 'production';

type AirwallexConfig = Readonly<{
  environment: AirwallexEnvironment;
  sdkEnvironment: AirwallexSdkEnvironment;
  baseUrl: string;
  clientId: string;
  apiKey: string;
  accountId?: string;
}>;

type AuthenticationResponse = {
  token?: unknown;
  expires_at?: unknown;
};

export type AirwallexPaymentIntent = {
  id: string;
  client_secret?: string;
  status: string;
  amount: number;
  currency: string;
  merchant_order_id: string;
  request_id?: string;
  created_at?: string;
};

export type CreatePaymentIntentInput = {
  requestId: string;
  amountMajor: string;
  amountMinor: number;
  decimalPlaces: 0 | 2;
  currency: ReportCurrency;
  merchantOrderId: string;
  returnUrl: string;
  merchantWebsiteUrl: string;
  customerEmail: string;
  purchaseId: string;
  reportId: string;
};

export class AirwallexError extends Error {
  constructor(
    message: string,
    public readonly publicMessage: string,
    public readonly status?: number,
    public readonly providerCode?: string,
  ) {
    super(message);
    this.name = 'AirwallexError';
  }
}

let cachedToken: { token: string; expiresAtMs: number } | null = null;
let pendingTokenRequest: Promise<string> | null = null;

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AirwallexError(
      `Missing Airwallex environment variable: ${name}`,
      'Payment checkout is temporarily unavailable.',
    );
  }
  return value;
}

export function getAirwallexConfig(): AirwallexConfig {
  const rawEnvironment = requiredEnvironment('AIRWALLEX_ENV').toLowerCase();
  const environment: AirwallexEnvironment = rawEnvironment === 'demo' || rawEnvironment === 'sandbox'
    ? 'sandbox'
    : rawEnvironment === 'prod' || rawEnvironment === 'production'
      ? 'production'
      : (() => {
          throw new AirwallexError(
            `Unsupported AIRWALLEX_ENV value: ${rawEnvironment}`,
            'Payment checkout is temporarily unavailable.',
          );
        })();

  const expectedBaseUrl = environment === 'sandbox'
    ? 'https://api.sandbox.airwallex.com'
    : 'https://api.airwallex.com';
  const configuredBaseUrl = requiredEnvironment('AIRWALLEX_BASE_URL').replace(/\/$/, '');
  if (configuredBaseUrl !== expectedBaseUrl) {
    throw new AirwallexError(
      'AIRWALLEX_BASE_URL does not match AIRWALLEX_ENV.',
      'Payment checkout is temporarily unavailable.',
    );
  }

  return {
    environment,
    sdkEnvironment: environment === 'sandbox' ? 'sandbox' : 'prod',
    baseUrl: expectedBaseUrl,
    clientId: requiredEnvironment('AIRWALLEX_CLIENT_ID'),
    apiKey: requiredEnvironment('AIRWALLEX_API_KEY'),
    accountId: process.env.AIRWALLEX_ACCOUNT_ID?.trim() || undefined,
  };
}

function expiresAtMilliseconds(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 10_000_000_000 ? value : value * 1000;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric > 10_000_000_000 ? numeric : numeric * 1000;
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  // Airwallex tokens normally last 30 minutes. A conservative fallback keeps
  // the token reusable without relying on a malformed expiration field.
  return Date.now() + 25 * 60_000;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AirwallexError(
        'Airwallex request timed out.',
        'The payment provider took too long to respond. Your checkout can be safely retried.',
      );
    }
    throw new AirwallexError(
      'Airwallex network request failed.',
      'The payment provider is temporarily unavailable. Please try again.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function readProviderError(response: Response): Promise<{ code?: string }> {
  try {
    const payload = await response.json() as { code?: unknown };
    return { code: typeof payload.code === 'string' ? payload.code : undefined };
  } catch {
    return {};
  }
}

async function requestNewToken(): Promise<string> {
  const config = getAirwallexConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-id': config.clientId,
    'x-api-key': config.apiKey,
  };
  if (config.accountId) headers['x-login-as'] = config.accountId;

  const response = await fetchWithTimeout(`${config.baseUrl}/api/v1/authentication/login`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    const providerError = await readProviderError(response);
    throw new AirwallexError(
      `Airwallex authentication failed with HTTP ${response.status}.`,
      'Payment checkout is temporarily unavailable.',
      response.status,
      providerError.code,
    );
  }

  const payload = await response.json() as AuthenticationResponse;
  if (typeof payload.token !== 'string' || !payload.token) {
    throw new AirwallexError(
      'Airwallex authentication response did not contain a token.',
      'Payment checkout is temporarily unavailable.',
    );
  }

  cachedToken = {
    token: payload.token,
    expiresAtMs: expiresAtMilliseconds(payload.expires_at),
  };
  return payload.token;
}

export async function getAirwallexToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAtMs - TOKEN_EXPIRY_BUFFER_MS > Date.now()) {
    return cachedToken.token;
  }
  if (!pendingTokenRequest) {
    pendingTokenRequest = requestNewToken().finally(() => {
      pendingTokenRequest = null;
    });
  }
  return pendingTokenRequest;
}

async function airwallexRequest<T>(
  path: string,
  init: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> },
  retryAuthentication = true,
): Promise<T> {
  const config = getAirwallexConfig();
  const token = await getAirwallexToken();
  const response = await fetchWithTimeout(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (response.status === 401 && retryAuthentication) {
    cachedToken = null;
    return airwallexRequest<T>(path, init, false);
  }
  if (!response.ok) {
    const providerError = await readProviderError(response);
    throw new AirwallexError(
      `Airwallex API request failed with HTTP ${response.status}.`,
      response.status >= 500
        ? 'The payment provider is temporarily unavailable. Please try again.'
        : 'The payment provider could not prepare this checkout.',
      response.status,
      providerError.code,
    );
  }
  return response.json() as Promise<T>;
}

function amountToMinorUnits(value: unknown, decimalPlaces: 0 | 2): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  if (decimalPlaces === 0) return fraction.replace(/0/g, '') ? null : Number(whole);
  if (fraction.length > decimalPlaces && /[1-9]/.test(fraction.slice(decimalPlaces))) return null;
  const paddedFraction = fraction.padEnd(decimalPlaces, '0').slice(0, decimalPlaces);
  const minor = Number(whole) * (10 ** decimalPlaces) + Number(paddedFraction);
  return Number.isSafeInteger(minor) ? minor : null;
}

export function validatePaymentIntent(
  intent: AirwallexPaymentIntent,
  expected: {
    amountMinor: number;
    decimalPlaces: 0 | 2;
    currency: ReportCurrency;
    merchantOrderId: string;
    requestId?: string;
  },
): void {
  const amountMinor = amountToMinorUnits(intent.amount, expected.decimalPlaces);
  if (
    !intent.id
    || amountMinor !== expected.amountMinor
    || intent.currency !== expected.currency
    || intent.merchant_order_id !== expected.merchantOrderId
    || (expected.requestId && intent.request_id !== expected.requestId)
  ) {
    throw new AirwallexError(
      'Airwallex returned PaymentIntent details that did not match the purchase.',
      'The payment details could not be verified. No new checkout was opened.',
    );
  }
}

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<AirwallexPaymentIntent> {
  const intent = await airwallexRequest<AirwallexPaymentIntent>(
    '/api/v1/pa/payment_intents/create',
    {
      method: 'POST',
      body: JSON.stringify({
        request_id: input.requestId,
        amount: Number(input.amountMajor),
        currency: input.currency,
        merchant_order_id: input.merchantOrderId,
        return_url: input.returnUrl,
        merchant_website_url: input.merchantWebsiteUrl,
        customer: { email: input.customerEmail },
        metadata: {
          moodflip_purchase_id: input.purchaseId,
          moodflip_report_id: input.reportId,
          product: '7_day_report',
        },
      }),
    },
  );

  validatePaymentIntent(intent, {
    amountMinor: input.amountMinor,
    decimalPlaces: input.decimalPlaces,
    currency: input.currency,
    merchantOrderId: input.merchantOrderId,
    requestId: input.requestId,
  });
  if (!intent.client_secret) {
    throw new AirwallexError(
      'Airwallex did not return a checkout client secret.',
      'The payment provider did not return complete checkout details.',
    );
  }
  return intent;
}

export async function retrievePaymentIntent(intentId: string): Promise<AirwallexPaymentIntent> {
  return airwallexRequest<AirwallexPaymentIntent>(
    `/api/v1/pa/payment_intents/${encodeURIComponent(intentId)}`,
    { method: 'GET' },
  );
}

export async function cancelPaymentIntent(intentId: string): Promise<AirwallexPaymentIntent> {
  return airwallexRequest<AirwallexPaymentIntent>(
    `/api/v1/pa/payment_intents/${encodeURIComponent(intentId)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({
        request_id: crypto.randomUUID(),
        cancellation_reason: 'Customer selected a different checkout currency',
      }),
    },
  );
}
