# Supabase Configuration & Management Guide

## Database migrations (one hosted project)

The source of truth for the MoodFlip schema is `supabase/migrations/`. Do not run old standalone schema scripts or edit hosted tables directly in the Dashboard. The initial migration replaced the three MoodFlip tables and installs a trigger that creates a profile with the same ID as its Supabase Auth user. The following migration backfills profiles for Auth users that existed before the trigger. Supabase-managed schemas are not reset.

From the repository root, with the Supabase CLI installed as a dev dependency:

```powershell
npx supabase login
npx supabase link --project-ref ryyysblkbpprxbuzmtac
npx supabase migration list --remote
npx supabase db push --dry-run --remote
npx supabase db push --remote
```

For later changes: `npx supabase migration new describe_change`, edit and commit the generated SQL, then dry-run and push. If Docker is running, use `npx supabase start` and `npx supabase db reset` to replay all migrations **locally**. Never use `db reset --remote` on this hosted project. `supabase/.temp` and access tokens are not committed.

The CLI's local `config.toml` enables email confirmation, uses port 3005, and requires 8-character passwords. The hosted project has Confirm email enabled, Site URL `https://moodflip.coach`, and localhost/production `/auth/confirm` redirects allowlisted. Local `config.toml` changes do not update hosted Auth settings. Custom SMTP is still disabled; configure an SMTP provider before accepting public sign-ups, since Supabase's default email service only delivers to project team members.

## Registration email verification

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the local and deployment environments. Configure the Supabase Authentication email provider with **Confirm email** enabled. In Authentication > URL Configuration, set the site URL and add `http://localhost:3005/auth/confirm` and the production `/auth/confirm` URL to the redirect allowlist. Set `NEXT_PUBLIC_SITE_URL` to the production site origin when the deployment request origin is not the public address.

For public registration, configure a custom SMTP provider in Supabase so confirmation messages can be delivered to users outside the Supabase organization. The registration endpoint fails closed if the project is unavailable or email confirmation is disabled; it no longer creates local password backups.

## Supabase Token Configuration
Your Supabase Management token has been configured for automated database and project administration.

### Environment Variable Usage
To run Supabase CLI commands using your token:

```powershell
$env:SUPABASE_ACCESS_TOKEN="<YOUR_SUPABASE_TOKEN>"
```

---

## 📦 Backup Plan (Business Specification §14)

> **Spec requirement**: "Since Supabase Free does not include automatic backups, please explain the backup plan while we are on the Free plan."

### ⚠️ Important: Supabase Free Tier Has No Automatic Backups

Supabase Free tier does NOT include automatic database backups. Here is the full backup plan:

### Option 1: Manual Export via Supabase Dashboard (Free)
1. Go to your Supabase project → **Settings** → **Database**
2. Click **Download backup** — this exports a full SQL dump
3. **Recommended**: Do this manually at least once per week until upgrading to Pro
4. Save the `.sql` file securely (local + Google Drive/Dropbox)

### Option 2: Admin Dashboard CSV Export (Built-In)
- The MoodFlip Admin Dashboard (`/admin`) has a **"Export to CSV"** button
- This exports all registered users, emails, moods/check-ins, and purchase status
- Use this regularly to back up user data independently of Supabase

### Option 3: Upgrade to Supabase Pro ($25/month)
- Supabase Pro includes **automatic 7-day rolling backups**
- Upgrade when: user count grows, payment processing starts, or Joy requests it
- **No upgrade without Joy's prior approval** (per Spec §14)
- Upgrade path: Supabase Dashboard → Settings → Billing → Upgrade Plan

### Option 4: pg_dump via CLI (Advanced)
```powershell
# Get connection string from Supabase Dashboard → Settings → Database
pg_dump "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" > backup_$(Get-Date -Format 'yyyy-MM-dd').sql
```

---

## 🗑️ 90-Day Automatic Profile Deletion (Business Specification §11)

> **Spec requirement**: "Enable automatic 90-day deletion of inactive profiles."

### Implementation
- API route created: `app/api/cron/cleanup/route.ts`
- Deletes profiles where `last_active_at` is older than 90 days
- `last_active_at` is updated via `app/api/user/activity/route.ts` on every check-in/login

### How to Schedule (Pick One)

**Option A: Vercel Cron (Recommended)**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Option B: Supabase pg_cron**
```sql
-- Run in Supabase SQL Editor
SELECT cron.schedule(
  '90-day-cleanup',
  '0 2 * * *',
  $$DELETE FROM profiles WHERE last_active_at < NOW() - INTERVAL '90 days'$$
);
```

---

### Useful Supabase CLI Commands

1. **List Supabase Projects:**
   ```powershell
   npx supabase projects list
   ```

2. **Review pending migrations:**
   ```powershell
   npx supabase db push --dry-run --remote
   ```
