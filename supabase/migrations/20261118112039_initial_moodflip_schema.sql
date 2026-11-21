-- Initial versioned schema for the existing MoodFlip Supabase project.
-- Existing MoodFlip application tables are intentionally replaced; this project
-- has no user data to preserve. Supabase-managed schemas are left untouched.
drop trigger if exists moodflip_auth_user_created on auth.users;
drop trigger if exists moodflip_auth_user_email_changed on auth.users;
drop function if exists public.moodflip_handle_new_user();
drop function if exists public.delete_inactive_profiles();
drop table if exists public.checkins, public.purchases, public.profiles cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  check_in_count integer not null default 0,
  purchase_status text not null default 'inactive',
  is_admin boolean not null default false
);
create index idx_profiles_last_active on public.profiles(last_active_at);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text,
  mood text not null,
  feeling text not null,
  target_mood text,
  action_title text,
  action_desc text,
  saved_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index idx_checkins_user_id on public.checkins(user_id);
create index idx_checkins_saved_at on public.checkins(saved_at);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  product text not null,
  amount_usd numeric(10,2),
  stripe_payment_id text,
  pdf_generated boolean not null default false,
  pdf_emailed boolean not null default false,
  pdf_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index idx_purchases_user_id on public.purchases(user_id);
create index idx_purchases_email on public.purchases(email);

-- Auth inserts the profile with the same UUID, so auth.uid() matches the RLS policy.
create function public.moodflip_handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger moodflip_auth_user_created
after insert on auth.users
for each row execute function public.moodflip_handle_new_user();

create trigger moodflip_auth_user_email_changed
after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute function public.moodflip_handle_new_user();

revoke all on function public.moodflip_handle_new_user() from public, anon, authenticated;

-- Restrict direct API writes. Administrative server calls use service_role.
revoke all on public.profiles, public.checkins, public.purchases from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name) on public.profiles to authenticated;
grant select, insert on public.checkins to authenticated;
grant select on public.purchases to authenticated;
grant all on public.profiles, public.checkins, public.purchases to service_role;

alter table public.profiles enable row level security;
alter table public.checkins enable row level security;
alter table public.purchases enable row level security;

create policy "Users can view own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "Users can view own checkins" on public.checkins
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own checkins" on public.checkins
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can view own purchases" on public.purchases
  for select to authenticated using ((select auth.uid()) = user_id);
