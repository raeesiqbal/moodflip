-- Enforce the three-per-UTC-calendar-day limit atomically. The transaction-level
-- advisory lock serializes saves for the same user and date, including requests
-- arriving from different tabs, devices, or API clients.
revoke insert on public.checkins from authenticated;
alter table public.profiles
  add column if not exists report_reminder_last_shown_on date;

create or replace function public.save_mood_lift_atomic(
  p_user_id uuid,
  p_email text,
  p_mood text,
  p_feeling text,
  p_target_mood text,
  p_action_title text,
  p_action_desc text,
  p_saved_at date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_daily_count integer;
  v_qualifying_days integer;
  v_total_count integer;
  v_reminder_rows integer;
  v_show_daily_reminder boolean := false;
  v_checkin public.checkins;
begin
  -- The same user/date combination always produces the same lock key. This lock
  -- is released automatically when the surrounding transaction completes.
  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_saved_at::text, 0)
  );

  select count(*)::integer
  into v_daily_count
  from public.checkins
  where user_id = p_user_id
    and saved_at = p_saved_at;

  if v_daily_count >= 3 then
    select count(distinct saved_at)::integer, count(*)::integer
    into v_qualifying_days, v_total_count
    from public.checkins
    where user_id = p_user_id;

    return jsonb_build_object(
      'limit_reached', true,
      'daily_count', v_daily_count,
      'qualifying_days', v_qualifying_days,
      'total_count', v_total_count,
      'report_eligible', v_qualifying_days >= 7
    );
  end if;

  insert into public.checkins (
    user_id,
    email,
    mood,
    feeling,
    target_mood,
    action_title,
    action_desc,
    saved_at
  )
  values (
    p_user_id,
    p_email,
    p_mood,
    p_feeling,
    p_target_mood,
    p_action_title,
    p_action_desc,
    p_saved_at
  )
  returning * into v_checkin;

  select count(distinct saved_at)::integer, count(*)::integer
  into v_qualifying_days, v_total_count
  from public.checkins
  where user_id = p_user_id;

  -- The reminder is save-triggered and claimed atomically, so it never appears
  -- on arrival and cannot repeat in another tab or device on the same UTC date.
  if v_qualifying_days >= 2 and v_qualifying_days < 7 then
    update public.profiles
    set report_reminder_last_shown_on = p_saved_at
    where id = p_user_id
      and report_reminder_last_shown_on is distinct from p_saved_at;
    get diagnostics v_reminder_rows = row_count;
    v_show_daily_reminder := v_reminder_rows > 0;
  end if;

  return jsonb_build_object(
    'limit_reached', false,
    'daily_count', v_daily_count + 1,
    'qualifying_days', v_qualifying_days,
    'total_count', v_total_count,
    'report_eligible', v_qualifying_days >= 7,
    'show_daily_reminder', v_show_daily_reminder,
    'checkin', to_jsonb(v_checkin)
  );
end;
$$;

revoke all on function public.save_mood_lift_atomic(uuid, text, text, text, text, text, text, date)
from public, anon, authenticated;

grant execute on function public.save_mood_lift_atomic(uuid, text, text, text, text, text, text, date)
to service_role;

create or replace function public.get_mood_lift_progress(
  p_user_id uuid,
  p_saved_at date
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'daily_count', count(*) filter (where saved_at = p_saved_at),
    'qualifying_days', count(distinct saved_at),
    'total_count', count(*),
    'report_eligible', count(distinct saved_at) >= 7
  )
  from public.checkins
  where user_id = p_user_id;
$$;

revoke all on function public.get_mood_lift_progress(uuid, date)
from public, anon, authenticated;

grant execute on function public.get_mood_lift_progress(uuid, date)
to service_role;
