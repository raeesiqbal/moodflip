import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "moodflip",
    entrypoint: "./cloudflare-worker.ts",
    triggers: [
      triggers.scheduled({ schedule: "*/5 * * * *" }),
      triggers.scheduled({ schedule: "0 3 * * *" }),
    ],
    compatibilityDate: "2026-11-21",
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),

      NEXT_PUBLIC_SUPABASE_URL: bindings.text(
        "https://ryyysblkbpprxbuzmtac.supabase.co",
      ),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: bindings.text(
        "sb_publishable_rtuxfFYFRZ5F_eXPuXBk4Q_8COmKHwD",
      ),
      NEXT_PUBLIC_SITE_URL: bindings.text("https://moodflip.coach"),
      NEXT_PUBLIC_AIRWALLEX_ENV: bindings.text("demo"),
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: bindings.text(
        "0x4AAAAAAGOmjC1-nGxOcdek",
      ),

      CONTACT_FROM_EMAIL: bindings.text("MoodFlip <no-reply@moodflip.coach>"),
      TURNSTILE_EXPECTED_HOSTNAMES: bindings.text(
        "moodflip.coach,www.moodflip.coach",
      ),
      AUTH_FROM_EMAIL: bindings.text(
        "MoodFlip Security <no-reply@moodflip.coach>",
      ),
      REPORT_FROM_EMAIL: bindings.text("MoodFlip <no-reply@moodflip.coach>"),
      REPORT_DELIVERY_TO_CUSTOMER: bindings.text("true"),

      // Sandbox checkout configuration for Part 6. Change both environment
      // values and the base URL together when the account is approved for live.
      AIRWALLEX_ENV: bindings.text("demo"),
      AIRWALLEX_BASE_URL: bindings.text("https://api.sandbox.airwallex.com"),
      APP_URL: bindings.text("https://moodflip.coach"),

      SUPABASE_SERVICE_ROLE_KEY: bindings.secret(),
      RESEND_API_KEY: bindings.secret(),
      TURNSTILE_SECRET_KEY: bindings.secret(),
      AIRWALLEX_CLIENT_ID: bindings.secret(),
      AIRWALLEX_API_KEY: bindings.secret(),
      AIRWALLEX_ACCOUNT_ID: bindings.secret(),
      AIRWALLEX_WEBHOOK_SECRET: bindings.secret(),
      CRON_SECRET: bindings.secret(),
      RESEND_WEBHOOK_SECRET: bindings.secret(),
      BUSINESS_NAME: bindings.secret(),
      BUSINESS_ABN: bindings.secret(),
      REPORT_SANDBOX_TO_EMAIL: bindings.secret(),
    },
  }),
});
