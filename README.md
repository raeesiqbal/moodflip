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
| `CRON_SECRET` | For scheduled cleanup | Authorizes the inactive-profile cleanup endpoint |

Never expose server credentials through variables prefixed with `NEXT_PUBLIC_`. Do not commit `.env.local`.

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
