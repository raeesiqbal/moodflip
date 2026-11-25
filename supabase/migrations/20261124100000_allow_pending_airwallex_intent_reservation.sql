-- Part 6 must reserve a single pending purchase and its idempotency key before
-- calling Airwallex. The provider intent ID is therefore populated immediately
-- after, rather than during, the initial database insert.
alter table public.purchases
  drop constraint if exists purchases_airwallex_required_fields_check;

alter table public.purchases
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
