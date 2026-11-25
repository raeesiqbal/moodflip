alter table public.reports
  add column if not exists email_status text not null default 'pending',
  add column if not exists email_attempts integer not null default 0,
  add column if not exists email_next_attempt_at timestamptz not null default now(),
  add column if not exists email_claimed_at timestamptz,
  add column if not exists email_delivery_key text,
  add column if not exists email_last_error text;

alter table public.reports add constraint reports_email_status_check
  check (email_status in ('pending','sending','sent','delivered','failed','bounced','complained'));

create or replace function public.claim_report_email(p_report_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_claimed boolean;
begin
  update public.reports r set email_status = 'sending', email_claimed_at = now(),
    email_attempts = email_attempts + 1,
    email_delivery_key = coalesce(email_delivery_key, 'report-original-' || r.id::text)
  where r.id = p_report_id and r.email_message_id is null
    and (r.email_status in ('pending','failed') or
      (r.email_status = 'sending' and r.email_claimed_at < now() - interval '10 minutes'))
    and r.email_next_attempt_at <= now() and r.email_attempts < 8
    and exists (select 1 from public.purchases p where p.report_id = r.id
      and p.user_id = r.user_id and p.payment_status = 'succeeded'
      and p.payment_provider = 'airwallex')
  returning true into v_claimed;
  return coalesce(v_claimed, false);
end; $$;

revoke all on function public.claim_report_email(uuid) from public, anon, authenticated;
grant execute on function public.claim_report_email(uuid) to service_role;
