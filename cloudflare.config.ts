import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "moodflip",
    entrypoint: "vinext/server/fetch-handler",
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
      NEXT_PUBLIC_SITE_URL: bindings.text(
        "https://moodflip.joykonta.workers.dev",
      ),

      CONTACT_FROM_EMAIL: bindings.text("MoodFlip <onboarding@resend.dev>"),
      AUTH_FROM_EMAIL: bindings.text(
        "MoodFlip Security <onboarding@resend.dev>",
      ),

      SUPABASE_SERVICE_ROLE_KEY: bindings.secret(),
      MISTRAL_API_KEY: bindings.secret(),
      RESEND_API_KEY: bindings.secret(),
      CRON_SECRET: bindings.secret(),
    },
  }),
});
