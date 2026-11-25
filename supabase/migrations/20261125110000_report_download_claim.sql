-- Serialize original report downloads. A stale processing claim can be retried.
create or replace function public.claim_report_download(p_report_id uuid, p_user_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_claimed boolean;
begin
  update public.reports r
     set delivery_status = 'processing', delivery_error = null, updated_at = now()
   where r.id = p_report_id and r.user_id = p_user_id
     and (r.delivery_status in ('pending', 'generated', 'failed')
       or (r.delivery_status = 'processing' and r.updated_at < now() - interval '5 minutes'))
     and r.download_completed_at is null
     and exists (
       select 1 from public.purchases p
       where p.report_id = r.id and p.user_id = p_user_id
         and p.payment_status = 'succeeded' and p.payment_provider = 'airwallex'
     )
  returning true into v_claimed;
  return coalesce(v_claimed, false);
end;
$$;

create or replace function public.finish_report_download(
  p_report_id uuid, p_user_id uuid, p_success boolean, p_error text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.reports
     set delivery_status = case when p_success then 'delivered' else 'failed' end,
         download_completed_at = case when p_success then now() else null end,
         delivered_at = case when p_success then now() else delivered_at end,
         delivery_error = case when p_success then null else left(coalesce(p_error, 'Download interrupted'), 200) end,
         updated_at = now()
   where id = p_report_id and user_id = p_user_id
     and delivery_status = 'processing' and download_completed_at is null;
  if not found then raise exception 'Report download claim not active'; end if;
end;
$$;

revoke all on function public.claim_report_download(uuid,uuid) from public, anon, authenticated;
revoke all on function public.finish_report_download(uuid,uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.claim_report_download(uuid,uuid) to service_role;
grant execute on function public.finish_report_download(uuid,uuid,boolean,text) to service_role;
