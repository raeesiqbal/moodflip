# MoodFlip

MoodFlip is a responsive emotional-wellbeing application that helps users identify difficult emotions, explore more specific feelings, and receive short grounding exercises and positive reframing prompts.

> MoodFlip is a self-reflection tool, not a medical service or a replacement for professional care.

## Features

- Three-layer mood and feeling selection flow
- Counselor-reviewed mood pairings and 60-second micro-actions
- Optional Mistral-powered AI chat and personalized mood flips
- User registration, login, profile, saved progress, and account deletion
- Downloadable seven-day mindset report generated with jsPDF
- Admin dashboard for mood content, users, analytics, and exports
- SEO mood pages, sitemap, robots metadata, and structured page metadata
- Contact-form delivery through Resend
- Progressive Web App manifest, icons, install prompt, and service worker
- Scheduled cleanup endpoint for inactive profiles

## Technology

- Next.js 14 App Router
- React 18 and TypeScript
- Tailwind CSS and CSS Modules
- Supabase authentication and database access
- Mistral AI API
- Resend email API
- jsPDF for PDF reports
- Vercel deployment and cron scheduling

## Local development

Database changes are versioned in `supabase/migrations/`. See `SUPABASE_SETUP.md` for linking the existing hosted project, applying the initial migration, and configuring email confirmation. Prisma migrations are not used.

### Requirements

- Node.js 18.17 or newer; Node.js 20 LTS is recommended
- npm
- A Supabase project

### Setup

```bash
git clone https://github.com/CodeStackLab/moodflip-website.git
cd moodflip-website
npm ci
```

Create the local environment file:

```bash
copy .env.example .env.local
```

On macOS or Linux, use `cp .env.example .env.local` instead. Fill in the required credentials, then start the application:

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser-safe Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only administrative database access |
| `MISTRAL_API_KEY` | For AI features | Server-only Mistral API credential |
| `RESEND_API_KEY` | For contact form | Sends contact messages through Resend |
| `CONTACT_FROM_EMAIL` | For contact form | Verified sender identity used by Resend |
| `CONTACT_TO_EMAIL` | For contact form | Inbox that receives contact messages |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Contact bot protection | Public Cloudflare Turnstile widget key |
| `TURNSTILE_SECRET_KEY` | Contact bot protection | Server-only Cloudflare Turnstile verification key |
| `TURNSTILE_EXPECTED_HOSTNAMES` | Contact bot protection | Comma-separated frontend hostnames accepted by the API |
| `CRON_SECRET` | For scheduled jobs | Authorizes payment recovery, report delivery, and inactive-account cleanup |

Never expose server credentials through variables prefixed with `NEXT_PUBLIC_`. Do not commit `.env.local`.

### Inactive-account cleanup on Cloudflare

`cloudflare.config.ts` configures a daily Cron Trigger (`0 3 * * *`, 03:00 UTC).
`cloudflare-worker.ts` sends that trigger to the protected `/api/cron/cleanup`
route. Each run checks up to 100 non-admin profiles whose `last_active_at` is older
than 90 days, rechecks activity and recent Supabase sign-in, then deletes the
Supabase Auth user. Database foreign keys remove the profile, saved Mood Lifts,
and generated report record while retaining purchase records with their
customer/report references cleared. Authenticated visits update `last_active_at`
through `/api/user/heartbeat` at most once per day.

Deploy the Worker configuration and confirm both schedules in Cloudflare's Cron
Triggers: every five minutes for payment/report recovery and daily for account
cleanup. `CRON_SECRET`, `APP_URL`, and `SUPABASE_SERVICE_ROLE_KEY` must be present
as Worker runtime bindings. The cleanup endpoint is never exposed without the
secret. Review Cron Trigger Past Events for failures; no production accounts
should be deleted merely to test the schedule.

For contact delivery, verify your sending domain in Resend and set `CONTACT_FROM_EMAIL`
to an address on that domain (for example, `MoodFlip <no-reply@moodflip.coach>`).
For production, set `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`,
and `AUTH_FROM_EMAIL` as Cloudflare Worker variables or secrets as appropriate,
and set them in `.env.local` for local development. The contact form sends to
`contact@moodflip.coach` by default.

The contact form requires Cloudflare Turnstile. Create a managed widget for the
production hostname, then configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and
`TURNSTILE_SECRET_KEY`. Use Cloudflare's official test keys only on localhost.
Set `TURNSTILE_EXPECTED_HOSTNAMES=example.com` with the official always-pass
test keys because their validation response uses that hostname. In production,
list only real production hostnames and never include `localhost`, `127.0.0.1`,
or `example.com`. The contact widget and API also bind the `contact` action so a
token issued for another form cannot be reused here.

## Database setup

1. Create a Supabase project.
2. Run [`supabase_schema.sql`](./supabase_schema.sql) in the Supabase SQL editor.
3. Add the Supabase URL, anonymous key, and service-role key to `.env.local`.
4. Review [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for additional setup details.

## Available commands

```bash
npm run dev    # start the development server on port 3005
npm run build  # create and validate a production build
npm run start  # run the production server on port 3005
npm run lint   # run the configured Next.js lint command
```

## Deploying to Vercel

1. Push the repository to GitHub without `.env.local`, `.registered_users.json`, generated folders, or local backups.
2. Import the GitHub repository into Vercel.
3. Add the environment variables listed above in the Vercel project settings.
4. Deploy the project. Vercel will use `npm run build` automatically.
5. Confirm that `/api/cron/cleanup` is listed under project cron jobs; its schedule is configured in [`vercel.json`](./vercel.json).

See [`VERCEL_SETUP.md`](./VERCEL_SETUP.md) for project-specific deployment notes.

## Repository structure

```text
app/                 Pages, layouts, metadata, and API routes
components/          Reusable interface components
data/                Counselor mood and action data
docs/                Integration and ownership documentation
lib/                 Supabase client, blog data, and PDF generation
public/              Runtime images, icons, manifest, and service worker
supabase_schema.sql  Database schema
vercel.json          Vercel cron configuration
```

`Backup file/` is a local archive and is intentionally excluded by `.gitignore`. For the cleanest repository and smallest deployment upload, store that folder outside the project directory.

## Security notes

- Store secrets only in `.env.local` and the Vercel environment-variable settings.
- Never commit Supabase service-role, Mistral, Resend, SMTP, or cron credentials.
- `.registered_users.json` is a local fallback containing user data and must not be uploaded.
- Production user data should be stored in Supabase rather than the deployment filesystem.

## Documentation

- [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
- [`VERCEL_SETUP.md`](./VERCEL_SETUP.md)
- [`docs/BUYER_MESSAGES_AND_DOCS_SETUP.md`](./docs/BUYER_MESSAGES_AND_DOCS_SETUP.md)
- [`docs/GOOGLE_DOCS_GCLOUD_SETUP.md`](./docs/GOOGLE_DOCS_GCLOUD_SETUP.md)
- [`docs/GOOGLE_INTEGRATION_MASTER_CONFIG.md`](./docs/GOOGLE_INTEGRATION_MASTER_CONFIG.md)
