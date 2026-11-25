# Airwallex hosted checkout configuration

MoodFlip Part 6 uses Airwallex sandbox PaymentIntents and the official hosted checkout. Payment verification, webhooks, fulfilment, and report unlocking are intentionally deferred to Part 7.

## Local environment

Configure these values in `.env.local` without committing credentials:

```env
AIRWALLEX_ENV=demo
AIRWALLEX_BASE_URL=https://api.sandbox.airwallex.com
AIRWALLEX_CLIENT_ID=your-sandbox-client-id
AIRWALLEX_API_KEY=your-sandbox-api-key
AIRWALLEX_ACCOUNT_ID=
NEXT_PUBLIC_AIRWALLEX_ENV=sandbox

# Airwallex hosted checkout requires HTTPS. Use an HTTPS staging deployment or
# the current public URL from a Cloudflare Tunnel while testing locally.
APP_URL=https://your-current-public-hostname.example

# Optional local-only country simulation. It is ignored in production.
DEV_COUNTRY_OVERRIDE=AU
```

Do not put a temporary tunnel hostname in source control. Authentication and pricing can still be exercised locally, but hosted checkout will be rejected until `APP_URL` is HTTPS.

`AIRWALLEX_ACCOUNT_ID` is only used as the `x-login-as` value when present. It may remain empty for a sandbox API key scoped directly to one account. `AIRWALLEX_WEBHOOK_SECRET` is not used in Part 6.

## Cloudflare

Add `AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`, and, when required, `AIRWALLEX_ACCOUNT_ID` as encrypted Worker secrets. The non-secret sandbox environment and URL bindings are declared in `cloudflare.config.ts`.

In the Cloudflare dashboard, open **Network** and ensure **IP Geolocation** is enabled for the zone. Cloudflare then supplies `CF-IPCountry`; the application falls back to EUR when the header is missing, unknown, or a Cloudflare special value.

Before going live, change the backend environment/base URL and browser SDK environment together:

```env
AIRWALLEX_ENV=production
AIRWALLEX_BASE_URL=https://api.airwallex.com
NEXT_PUBLIC_AIRWALLEX_ENV=prod
APP_URL=https://moodflip.coach
```

Never combine production credentials with the sandbox base URL, or sandbox credentials with the production base URL.
