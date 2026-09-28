create or replace function public.confirm_geniuspay_payment(
  p_provider_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payment_transactions%rowtype;
  v_plan public.credit_plans%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;

  select *
  into v_payment
  from public.payment_transactions
  where provider_reference = p_provider_reference
  for update;

  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  if v_payment.status = 'CONFIRMED' then
    return jsonb_build_object('status', 'CONFIRMED', 'idempotent', true);
  end if;

  if v_payment.status <> 'PENDING' then
    return jsonb_build_object('status', v_payment.status, 'idempotent', true);
  end if;

  select *
  into v_plan
  from public.credit_plans
  where id = v_payment.plan_id and active = true;

  if not found then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  update public.credits
  set balance = balance + v_plan.credits,
      credits_total = credits_total + v_plan.credits,
      plan = v_plan.id,
      updated_at = now()
  where user_id = v_payment.user_id;

  if not found then
    raise exception 'CREDIT_WALLET_NOT_FOUND';
  end if;

  update public.payment_transactions
  set status = 'CONFIRMED', confirmed_at = now()
  where id = v_payment.id;

  insert into public.credit_transactions (user_id, amount, type, reference, status)
  values (v_payment.user_id, v_plan.credits, 'PURCHASE', v_payment.provider_reference, 'CONFIRMED')
  on conflict (reference) do nothing;

  return jsonb_build_object(
    'status', 'CONFIRMED',
    'credits', v_plan.credits,
    'idempotent', false
  );
end;
$$;

revoke all on function public.confirm_geniuspay_payment(text)
  from public, anon, authenticated;
grant execute on function public.confirm_geniuspay_payment(text) to service_role;
