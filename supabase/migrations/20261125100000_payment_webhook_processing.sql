alter table public.payment_webhook_events
  add column if not exists next_attempt_at timestamptz not null default now();

create index if not exists idx_payment_webhook_events_retry
  on public.payment_webhook_events(next_attempt_at)
  where processing_status in ('pending', 'failed', 'processing');

create or replace function public.claim_payment_webhook_event(p_event_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_claimed boolean;
begin
  update public.payment_webhook_events
     set processing_status = 'processing',
         attempts = attempts + 1,
         next_attempt_at = now() + interval '2 minutes',
         last_error = null
   where event_id = p_event_id
     and processing_status <> 'processed'
     and next_attempt_at <= now()
     and attempts < 12
  returning true into v_claimed;
  return coalesce(v_claimed, false);
end;
$$;

create or replace function public.finish_payment_webhook_event(
  p_event_id text, p_intent_id text, p_provider_status text,
  p_order_number text, p_amount_minor bigint, p_currency text,
  p_environment text, p_paid_at timestamptz default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_purchase public.purchases;
begin
  select * into v_purchase from public.purchases
   where airwallex_payment_intent_id = p_intent_id for update;
  if not found then raise exception 'Purchase not found for verified intent'; end if;
  if v_purchase.report_id is null or v_purchase.user_id is null
     or v_purchase.order_number <> p_order_number
     or v_purchase.amount_minor <> p_amount_minor
     or v_purchase.currency <> p_currency
     or v_purchase.payment_environment <> p_environment
     or v_purchase.payment_provider <> 'airwallex' then
    raise exception 'Verified intent does not match purchase';
  end if;

  if p_provider_status = 'SUCCEEDED' then
    if v_purchase.payment_status <> 'succeeded' then
      update public.purchases set payment_status = 'succeeded', status = 'succeeded',
        paid_at = coalesce(p_paid_at, now()) where id = v_purchase.id;
      update public.reports set delivery_status = 'pending'
        where id = v_purchase.report_id and user_id = v_purchase.user_id
          and delivery_status = 'not_started';
      if not found then
        perform 1 from public.reports where id = v_purchase.report_id
          and user_id = v_purchase.user_id and delivery_status <> 'not_started';
        if not found then raise exception 'Associated report not found'; end if;
      end if;
    end if;
  elsif v_purchase.payment_status <> 'succeeded' then
    if p_provider_status = 'CANCELLED' then
      update public.purchases set payment_status = 'cancelled', status = 'cancelled' where id = v_purchase.id;
    elsif p_provider_status in ('PENDING', 'PENDING_REVIEW', 'REQUIRES_CUSTOMER_ACTION') then
      update public.purchases set payment_status = 'processing', status = 'processing' where id = v_purchase.id;
    end if;
  end if;

  update public.payment_webhook_events set processing_status = 'processed',
    processed_at = now(), last_error = null where event_id = p_event_id;
  if not found then raise exception 'Webhook event not found'; end if;
end;
$$;

revoke all on function public.claim_payment_webhook_event(text) from public, anon, authenticated;
revoke all on function public.finish_payment_webhook_event(text,text,text,text,bigint,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.claim_payment_webhook_event(text) to service_role;
grant execute on function public.finish_payment_webhook_event(text,text,text,text,bigint,text,text,timestamptz) to service_role;
