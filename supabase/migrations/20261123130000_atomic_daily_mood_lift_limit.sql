-- Enforce the three-per-UTC-calendar-day limit atomically. The transaction-level
-- advisory lock serializes saves for the same user and date, including requests
-- arriving from different tabs, devices, or API clients.
revoke insert on public.checkins from authenticated;

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
    return jsonb_build_object(
      'limit_reached', true,
      'daily_count', v_daily_count
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

  return jsonb_build_object(
    'limit_reached', false,
    'daily_count', v_daily_count + 1,
    'checkin', to_jsonb(v_checkin)
  );
end;
$$;

revoke all on function public.save_mood_lift_atomic(uuid, text, text, text, text, text, text, date)
from public, anon, authenticated;

grant execute on function public.save_mood_lift_atomic(uuid, text, text, text, text, text, text, date)
to service_role;
