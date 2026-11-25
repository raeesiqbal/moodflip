-- Prepare MoodFlip's existing schema for Airwallex report purchases.
-- This migration is additive and preserves legacy purchase records and columns.

-- Profiles -------------------------------------------------------------------

alter table public.profiles
  add column if not exists consent_given_at timestamptz,
  add column if not exists marketing_consent boolean not null default false;

update public.profiles as p
set consent_given_at = (u.raw_user_meta_data ->> 'consented_at')::timestamptz
from auth.users as u
where p.id = u.id
  and p.consent_given_at is null
  and (u.raw_user_meta_data ->> 'consented_at') ~ '^\d{4}-\d{2}-\d{2}T';

comment on column public.profiles.purchase_status is
  'Legacy field only. Purchases and report access must be derived from public.purchases, not this profile flag.';

create or replace function public.moodflip_handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, consent_given_at, marketing_consent)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    case
      when (new.raw_user_meta_data ->> 'consented_at') ~ '^\d{4}-\d{2}-\d{2}T'
        then (new.raw_user_meta_data ->> 'consented_at')::timestamptz
      else null
    end,
    lower(coalesce(new.raw_user_meta_data ->> 'marketing_consent', 'false')) = 'true'
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(public.profiles.name, excluded.name),
      consent_given_at = coalesce(public.profiles.consent_given_at, excluded.consent_given_at);
  return new;
end;
$$;

revoke all on function public.moodflip_handle_new_user() from public, anon, authenticated;

-- Existing checkins are the Mood Lifts source of truth. ----------------------

comment on table public.checkins is
  'Saved Mood Lifts. mood is the mood family, feeling is the selected detailed feeling, target_mood is the positive mood, action_title/action_desc preserve the action shown, and saved_at is the UTC qualifying date.';
comment on column public.checkins.mood is 'Selected mood family.';
comment on column public.checkins.target_mood is 'Positive mood shown after the Mood Lift.';
comment on column public.checkins.action_title is 'Title of the actual action shown to the user.';
comment on column public.checkins.action_desc is 'Full text of the actual action shown to the user.';
comment on column public.checkins.saved_at is 'UTC calendar date used for daily limits and report qualification.';

-- Reports --------------------------------------------------------------------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_type text not null,
  period_start date not null,
  period_end date not null,
  saved_days smallint not null,
  entry_count smallint not null,
  report_data jsonb not null default '{}'::jsonb,
  delivery_status text not null default 'not_started',
  download_completed_at timestamptz,
  email_sent_at timestamptz,
  email_delivered_at timestamptz,
  delivered_at timestamptz,
  email_message_id text,
  delivery_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_type_check check (report_type in ('7_day', '30_day')),
  constraint reports_period_check check (period_end >= period_start),
  constraint reports_data_object_check check (jsonb_typeof(report_data) = 'object'),
  constraint reports_delivery_status_check check (
    delivery_status in ('not_started', 'pending', 'processing', 'generated', 'failed', 'delivered')
  ),
  constraint reports_qualification_check check (
    (report_type = '7_day' and saved_days = 7 and entry_count between 7 and 21)
    or
    (report_type = '30_day' and saved_days = 30 and entry_count between 30 and 90)
  ),
  constraint reports_user_type_period_unique unique (user_id, report_type, period_start, period_end)
);

create index if not exists idx_reports_user_created
  on public.reports(user_id, created_at desc);
create index if not exists idx_reports_delivery_status
  on public.reports(delivery_status) where delivery_status <> 'delivered';

-- Purchases ------------------------------------------------------------------

alter table public.purchases
  add column if not exists report_id uuid references public.reports(id) on delete set null,
  add column if not exists order_number text,
  add column if not exists report_type text,
  add column if not exists product_name text,
  add column if not exists amount_minor bigint,
  add column if not exists currency text,
  add column if not exists currency_decimals smallint,
  add column if not exists payment_provider text,
  add column if not exists payment_environment text,
  add column if not exists airwallex_payment_intent_id text,
  add column if not exists airwallex_request_id text,
  add column if not exists payment_status text,
  add column if not exists paid_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.purchases
set order_number = coalesce(order_number, 'LEGACY-' || id::text),
    report_type = coalesce(
      report_type,
      case when product ilike '%30%' then '30_day' else '7_day' end
    ),
    product_name = coalesce(product_name, product),
    amount_minor = coalesce(amount_minor, round(amount_usd * 100)::bigint),
    currency = coalesce(currency, case when amount_usd is not null then 'USD' end),
    currency_decimals = coalesce(currency_decimals, case when amount_usd is not null then 2 end),
    payment_status = coalesce(
      payment_status,
      case
        when lower(status) in ('pending', 'processing', 'succeeded', 'failed', 'cancelled') then lower(status)
        when lower(status) in ('paid', 'complete', 'completed', 'success') then 'succeeded'
        else 'pending'
      end
    );

alter table public.purchases
  alter column order_number set not null,
  alter column report_type set not null,
  alter column product_name set not null,
  alter column payment_status set not null;

alter table public.purchases
  add constraint purchases_report_type_check
    check (report_type in ('7_day', '30_day')),
  add constraint purchases_amount_minor_check
    check (amount_minor is null or amount_minor > 0),
  add constraint purchases_currency_check
    check (currency is null or currency in ('AUD', 'USD', 'EUR', 'GBP', 'CAD', 'NZD', 'CHF', 'SGD', 'HKD', 'JPY', 'THB')),
  add constraint purchases_currency_decimals_check
    check (
      (currency is null and currency_decimals is null)
      or (currency = 'JPY' and currency_decimals = 0)
      or (currency in ('AUD', 'USD', 'EUR', 'GBP', 'CAD', 'NZD', 'CHF', 'SGD', 'HKD', 'THB') and currency_decimals = 2)
    ),
  add constraint purchases_provider_check
    check (payment_provider is null or payment_provider = 'airwallex'),
  add constraint purchases_environment_check
    check (payment_environment is null or payment_environment in ('sandbox', 'production')),
  add constraint purchases_payment_status_check
    check (payment_status in ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  add constraint purchases_airwallex_required_fields_check
    check (
      payment_provider is distinct from 'airwallex'
      or (
        (report_id is not null or user_id is null)
        and amount_minor is not null
        and currency is not null
        and currency_decimals is not null
        and payment_environment is not null
        and airwallex_request_id is not null
        and (payment_status = 'pending' or airwallex_payment_intent_id is not null)
      )
    );

comment on constraint purchases_airwallex_required_fields_check on public.purchases is
  'Airwallex rows reserve their report, price, environment, and idempotency request before the remote PaymentIntent is created. Account deletion may later anonymise user_id and clear report_id while retaining the financial record.';

create unique index if not exists idx_purchases_order_number_unique
  on public.purchases(order_number);
create unique index if not exists idx_purchases_airwallex_intent_unique
  on public.purchases(airwallex_payment_intent_id)
  where airwallex_payment_intent_id is not null;
create unique index if not exists idx_purchases_airwallex_request_unique
  on public.purchases(airwallex_request_id)
  where airwallex_request_id is not null;
create unique index if not exists idx_purchases_one_unresolved_checkout_per_report
  on public.purchases(report_id)
  where payment_provider = 'airwallex'
    and payment_status in ('pending', 'processing')
    and report_id is not null;
create index if not exists idx_purchases_report_id on public.purchases(report_id);
create index if not exists idx_purchases_payment_status on public.purchases(payment_status);
create index if not exists idx_purchases_airwallex_intent
  on public.purchases(airwallex_payment_intent_id);

comment on column public.purchases.amount_usd is 'Legacy exact-decimal amount. Airwallex uses amount_minor and currency_decimals.';
comment on column public.purchases.stripe_payment_id is 'Legacy Stripe identifier; not used by Airwallex.';
comment on column public.purchases.pdf_url is 'Legacy field. New reports must be generated on demand and not stored as permanent PDF files.';

-- Airwallex webhook event deduplication --------------------------------------

create table if not exists public.payment_webhook_events (
  event_id text primary key,
  event_type text not null,
  airwallex_payment_intent_id text,
  processing_status text not null default 'pending',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  constraint payment_webhook_events_status_check check (
    processing_status in ('pending', 'processing', 'processed', 'failed')
  ),
  constraint payment_webhook_events_attempts_check check (attempts >= 0)
);

create index if not exists idx_payment_webhook_events_intent
  on public.payment_webhook_events(airwallex_payment_intent_id);
create index if not exists idx_payment_webhook_events_pending
  on public.payment_webhook_events(received_at)
  where processing_status in ('pending', 'failed');

-- Maintain updated_at without relying on application callers. ----------------

create or replace function public.moodflip_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists moodflip_reports_updated_at on public.reports;
create trigger moodflip_reports_updated_at
before update on public.reports
for each row execute function public.moodflip_set_updated_at();

drop trigger if exists moodflip_purchases_updated_at on public.purchases;
create trigger moodflip_purchases_updated_at
before update on public.purchases
for each row execute function public.moodflip_set_updated_at();

revoke all on function public.moodflip_set_updated_at() from public, anon, authenticated;

-- RLS and grants --------------------------------------------------------------

alter table public.reports enable row level security;
alter table public.purchases enable row level security;
alter table public.payment_webhook_events enable row level security;

revoke all on public.reports, public.purchases, public.payment_webhook_events
  from public, anon, authenticated;
grant select on public.reports, public.purchases to authenticated;
grant all on public.reports, public.purchases, public.payment_webhook_events to service_role;

drop policy if exists "Users can view own reports" on public.reports;
create policy "Users can view own reports" on public.reports
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own purchases" on public.purchases;
create policy "Users can view own purchases" on public.purchases
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Intentionally no customer policies on payment_webhook_events and no customer
-- insert/update/delete policies on reports or purchases. All protected writes
-- must use authorised server-side service-role functionality.
