create extension if not exists pgcrypto;

alter table public.credits
  add column if not exists plan text not null default 'free',
  add column if not exists credits_total integer not null default 0;

create unique index if not exists credits_user_id_unique
  on public.credits (user_id)
  where user_id is not null;

create table if not exists public.credit_plans (
  id text primary key,
  name text not null,
  price_fcfa integer not null check (price_fcfa >= 0),
  credits integer not null check (credits >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_operation_costs (
  operation text primary key,
  credits integer not null check (credits > 0),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('PURCHASE', 'AI_USAGE', 'BONUS', 'REFUND', 'ADJUSTMENT')),
  operation text,
  reference text,
  status text not null check (status in ('RESERVED', 'COMPLETED', 'REFUNDED', 'CONFIRMED')),
  created_at timestamptz not null default now()
);

create unique index if not exists credit_transactions_reference_unique
  on public.credit_transactions (reference)
  where reference is not null;

create table if not exists public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  amount integer not null check (amount > 0),
  transaction_id uuid not null references public.credit_transactions(id),
  status text not null check (status in ('RESERVED', 'COMPLETED', 'REFUNDED')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.credit_plans(id),
  provider text not null default 'geniuspay',
  provider_reference text unique,
  amount_fcfa integer not null check (amount_fcfa >= 0),
  status text not null check (status in ('PENDING', 'CONFIRMED', 'FAILED')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.credit_plans enable row level security;
alter table public.ai_operation_costs enable row level security;
alter table public.credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.credit_reservations enable row level security;
alter table public.payment_transactions enable row level security;

drop policy if exists credit_plans_read_active on public.credit_plans;
create policy credit_plans_read_active on public.credit_plans
  for select to authenticated using (active = true);

drop policy if exists credits_read_own on public.credits;
create policy credits_read_own on public.credits
  for select to authenticated using (user_id = auth.uid());

drop policy if exists credit_transactions_read_own on public.credit_transactions;
create policy credit_transactions_read_own on public.credit_transactions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists payment_transactions_read_own on public.payment_transactions;
create policy payment_transactions_read_own on public.payment_transactions
  for select to authenticated using (user_id = auth.uid());

insert into public.credit_plans (id, name, price_fcfa, credits)
values
  ('free', 'Gratuit', 0, 25),
  ('starter', 'Starter', 1000, 10),
  ('standard', 'Standard', 2500, 30),
  ('pro', 'Pro', 5000, 70)
on conflict (id) do update
set name = excluded.name, price_fcfa = excluded.price_fcfa, credits = excluded.credits;

insert into public.ai_operation_costs (operation, credits)
values
  ('AI_QUOTE_FROM_IMAGE', 100),
  ('AI_INVOICE_FROM_IMAGE', 100),
  ('AI_ARTICLE_FROM_IMAGE', 50),
  ('AI_VOICE_COMMAND', 25),
  ('AI_OCR_ANALYSIS', 100)
on conflict (operation) do update set credits = excluded.credits;

create or replace function public.initialize_credit_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
begin
  select credits into v_credits from public.credit_plans where id = 'free' and active = true;
  insert into public.credits (user_id, balance, plan, credits_total)
  values (new.id, coalesce(v_credits, 0), 'free', coalesce(v_credits, 0))
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_credit_wallet on auth.users;
create trigger on_auth_user_created_credit_wallet
  after insert on auth.users
  for each row execute procedure public.initialize_credit_wallet();

create or replace function public.reserve_ai_credits(
  p_operation text,
  p_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cost integer;
  v_wallet public.credits%rowtype;
  v_transaction_id uuid;
  v_reservation_id uuid;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select credits into v_cost
  from public.ai_operation_costs
  where operation = p_operation and active = true;

  if v_cost is null then
    raise exception 'UNKNOWN_AI_OPERATION';
  end if;

  select * into v_wallet
  from public.credits
  where user_id = v_user_id
  for update;

  if not found then
    raise exception 'CREDIT_WALLET_NOT_FOUND';
  end if;

  if v_wallet.balance < v_cost then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  update public.credits
  set balance = balance - v_cost, updated_at = now()
  where id = v_wallet.id;

  insert into public.credit_transactions (user_id, amount, type, operation, reference, status)
  values (v_user_id, -v_cost, 'AI_USAGE', p_operation, p_reference, 'RESERVED')
  returning id into v_transaction_id;

  insert into public.credit_reservations (user_id, operation, amount, transaction_id, status)
  values (v_user_id, p_operation, v_cost, v_transaction_id, 'RESERVED')
  returning id into v_reservation_id;

  return jsonb_build_object(
    'reservation_id', v_reservation_id,
    'transaction_id', v_transaction_id,
    'operation', p_operation,
    'credits', v_cost,
    'balance', v_wallet.balance - v_cost
  );
end;
$$;

create or replace function public.complete_ai_credit_reservation(p_reservation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_reservation public.credit_reservations%rowtype;
begin
  select * into v_reservation
  from public.credit_reservations
  where id = p_reservation_id and user_id = v_user_id
  for update;

  if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;
  if v_reservation.status <> 'RESERVED' then
    return jsonb_build_object('status', v_reservation.status);
  end if;

  update public.credit_reservations
  set status = 'COMPLETED', completed_at = now()
  where id = p_reservation_id;

  update public.credit_transactions
  set status = 'COMPLETED'
  where id = v_reservation.transaction_id;

  return jsonb_build_object('status', 'COMPLETED');
end;
$$;

create or replace function public.refund_ai_credit_reservation(p_reservation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_reservation public.credit_reservations%rowtype;
begin
  select * into v_reservation
  from public.credit_reservations
  where id = p_reservation_id and user_id = v_user_id
  for update;

  if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;
  if v_reservation.status <> 'RESERVED' then
    return jsonb_build_object('status', v_reservation.status);
  end if;

  update public.credits
  set balance = balance + v_reservation.amount, updated_at = now()
  where user_id = v_user_id;

  update public.credit_reservations
  set status = 'REFUNDED', completed_at = now()
  where id = p_reservation_id;

  update public.credit_transactions
  set status = 'REFUNDED'
  where id = v_reservation.transaction_id;

  insert into public.credit_transactions (user_id, amount, type, operation, reference, status)
  values (v_user_id, v_reservation.amount, 'REFUND', v_reservation.operation, p_reservation_id::text, 'CONFIRMED');

  return jsonb_build_object('status', 'REFUNDED');
end;
$$;

revoke all on function public.reserve_ai_credits(text, text) from public;
revoke all on function public.complete_ai_credit_reservation(uuid) from public;
revoke all on function public.refund_ai_credit_reservation(uuid) from public;
grant execute on function public.reserve_ai_credits(text, text) to authenticated;
grant execute on function public.complete_ai_credit_reservation(uuid) to authenticated;
grant execute on function public.refund_ai_credit_reservation(uuid) to authenticated;

create or replace function public.reserve_ai_credits_as_user(
  p_user_id uuid,
  p_operation text,
  p_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost integer;
  v_wallet public.credits%rowtype;
  v_transaction_id uuid;
  v_reservation_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
  select credits into v_cost from public.ai_operation_costs
  where operation = p_operation and active = true;
  if v_cost is null then raise exception 'UNKNOWN_AI_OPERATION'; end if;
  select * into v_wallet from public.credits where user_id = p_user_id for update;
  if not found then raise exception 'CREDIT_WALLET_NOT_FOUND'; end if;
  if v_wallet.balance < v_cost then raise exception 'INSUFFICIENT_CREDITS'; end if;
  update public.credits set balance = balance - v_cost, updated_at = now() where id = v_wallet.id;
  insert into public.credit_transactions (user_id, amount, type, operation, reference, status)
  values (p_user_id, -v_cost, 'AI_USAGE', p_operation, p_reference, 'RESERVED')
  returning id into v_transaction_id;
  insert into public.credit_reservations (user_id, operation, amount, transaction_id, status)
  values (p_user_id, p_operation, v_cost, v_transaction_id, 'RESERVED')
  returning id into v_reservation_id;
  return jsonb_build_object('reservation_id', v_reservation_id, 'transaction_id', v_transaction_id, 'operation', p_operation, 'credits', v_cost, 'balance', v_wallet.balance - v_cost);
end;
$$;

create or replace function public.complete_ai_credit_reservation_as_user(
  p_user_id uuid,
  p_reservation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.credit_reservations%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
  select * into v_reservation from public.credit_reservations
  where id = p_reservation_id and user_id = p_user_id for update;
  if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;
  if v_reservation.status <> 'RESERVED' then return jsonb_build_object('status', v_reservation.status); end if;
  update public.credit_reservations set status = 'COMPLETED', completed_at = now() where id = p_reservation_id;
  update public.credit_transactions set status = 'COMPLETED' where id = v_reservation.transaction_id;
  return jsonb_build_object('status', 'COMPLETED');
end;
$$;

create or replace function public.refund_ai_credit_reservation_as_user(
  p_user_id uuid,
  p_reservation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.credit_reservations%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
  select * into v_reservation from public.credit_reservations
  where id = p_reservation_id and user_id = p_user_id for update;
  if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;
  if v_reservation.status <> 'RESERVED' then return jsonb_build_object('status', v_reservation.status); end if;
  update public.credits set balance = balance + v_reservation.amount, updated_at = now() where user_id = p_user_id;
  update public.credit_reservations set status = 'REFUNDED', completed_at = now() where id = p_reservation_id;
  update public.credit_transactions set status = 'REFUNDED' where id = v_reservation.transaction_id;
  insert into public.credit_transactions (user_id, amount, type, operation, reference, status)
  values (p_user_id, v_reservation.amount, 'REFUND', v_reservation.operation, p_reservation_id::text, 'CONFIRMED');
  return jsonb_build_object('status', 'REFUNDED');
end;
$$;

revoke all on function public.reserve_ai_credits_as_user(uuid, text, text) from public;
revoke all on function public.complete_ai_credit_reservation_as_user(uuid, uuid) from public;
revoke all on function public.refund_ai_credit_reservation_as_user(uuid, uuid) from public;
grant execute on function public.reserve_ai_credits_as_user(uuid, text, text) to service_role;
grant execute on function public.complete_ai_credit_reservation_as_user(uuid, uuid) to service_role;
grant execute on function public.refund_ai_credit_reservation_as_user(uuid, uuid) to service_role;

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
  if auth.role() <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
  select * into v_payment from public.payment_transactions
  where provider_reference = p_provider_reference for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if v_payment.status = 'CONFIRMED' then return jsonb_build_object('status', 'CONFIRMED', 'idempotent', true); end if;
  select * into v_plan from public.credit_plans where id = v_payment.plan_id and active = true;
  if not found then raise exception 'PLAN_NOT_FOUND'; end if;
  update public.credits
  set balance = balance + v_plan.credits,
      credits_total = credits_total + v_plan.credits,
      plan = v_plan.id,
      updated_at = now()
  where user_id = v_payment.user_id;
  if not found then raise exception 'CREDIT_WALLET_NOT_FOUND'; end if;
  update public.payment_transactions
  set status = 'CONFIRMED', confirmed_at = now()
  where id = v_payment.id;
  insert into public.credit_transactions (user_id, amount, type, reference, status)
  values (v_payment.user_id, v_plan.credits, 'PURCHASE', v_payment.provider_reference, 'CONFIRMED')
  on conflict (reference) do nothing;
  return jsonb_build_object('status', 'CONFIRMED', 'credits', v_plan.credits, 'idempotent', false);
end;
$$;

revoke all on function public.confirm_geniuspay_payment(text) from public;
grant execute on function public.confirm_geniuspay_payment(text) to service_role;
