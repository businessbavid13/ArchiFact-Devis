alter table public.clients
  drop constraint if exists clients_name_length_check,
  add constraint clients_name_length_check
    check (length(trim(name)) between 2 and 160) not valid;

alter table public.articles
  drop constraint if exists articles_name_length_check,
  add constraint articles_name_length_check
    check (length(trim(name)) between 2 and 200) not valid,
  drop constraint if exists articles_unit_price_check,
  add constraint articles_unit_price_check
    check (unit_price >= 0) not valid;

alter table public.quotes
  drop constraint if exists quotes_status_check,
  add constraint quotes_status_check
    check (status in ('pending', 'accepted', 'declined')) not valid,
  drop constraint if exists quotes_amounts_check,
  add constraint quotes_amounts_check
    check (subtotal >= 0 and discount_value >= 0 and tax_rate between 0 and 100 and total >= 0) not valid;

alter table public.invoices
  drop constraint if exists invoices_status_check,
  add constraint invoices_status_check
    check (status in ('pending', 'paid', 'overdue')) not valid,
  drop constraint if exists invoices_amounts_check,
  add constraint invoices_amounts_check
    check (subtotal >= 0 and discount_value >= 0 and tax_rate between 0 and 100 and total >= 0) not valid;

alter table public.clients validate constraint clients_name_length_check;
alter table public.articles validate constraint articles_name_length_check;
alter table public.articles validate constraint articles_unit_price_check;
alter table public.quotes validate constraint quotes_status_check;
alter table public.quotes validate constraint quotes_amounts_check;
alter table public.invoices validate constraint invoices_status_check;
alter table public.invoices validate constraint invoices_amounts_check;

alter table public.clients alter column user_id set not null;
alter table public.articles alter column user_id set not null;
alter table public.quotes alter column user_id set not null;
alter table public.invoices alter column user_id set not null;
alter table public.company_settings alter column user_id set not null;

drop policy if exists "Users see own clients" on public.clients;
drop policy if exists "Users see own articles" on public.articles;
drop policy if exists "Users see own quotes" on public.quotes;
drop policy if exists "Users see own invoices" on public.invoices;
drop policy if exists "Users see own settings" on public.company_settings;

alter table public.clients force row level security;
alter table public.articles force row level security;
alter table public.quotes force row level security;
alter table public.invoices force row level security;
alter table public.company_settings force row level security;

create table if not exists public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type ~ '^[a-z][a-z0-9_.-]{2,80}$'),
  route text not null check (length(route) between 1 and 200),
  method text not null check (method in ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS')),
  request_id text not null check (request_id ~ '^[A-Za-z0-9._:-]{8,120}$'),
  success boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_audit_events_user_created_idx
  on public.security_audit_events(user_id, created_at desc);
create index if not exists security_audit_events_type_created_idx
  on public.security_audit_events(event_type, created_at desc);

alter table public.security_audit_events enable row level security;
alter table public.security_audit_events force row level security;

drop policy if exists security_audit_events_select_own on public.security_audit_events;
create policy security_audit_events_select_own on public.security_audit_events
  for select to authenticated using (user_id = auth.uid());

create or replace function public.write_security_audit_event(
  p_user_id uuid,
  p_event_type text,
  p_route text,
  p_method text,
  p_request_id text,
  p_success boolean default true,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  insert into public.security_audit_events (
    user_id, event_type, route, method, request_id, success, metadata
  )
  values (
    p_user_id, p_event_type, p_route, p_method, p_request_id, p_success,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.write_security_audit_event(uuid, text, text, text, text, boolean, jsonb)
  from public, anon, authenticated;
grant execute on function public.write_security_audit_event(uuid, text, text, text, text, boolean, jsonb)
  to service_role;

revoke all on table public.security_audit_events from anon, authenticated;
grant select on table public.security_audit_events to authenticated;

revoke all on function public.reserve_ai_credits_as_user(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.complete_ai_credit_reservation_as_user(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.refund_ai_credit_reservation_as_user(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.confirm_geniuspay_payment(text)
  from public, anon, authenticated;

grant execute on function public.reserve_ai_credits_as_user(uuid, text, text) to service_role;
grant execute on function public.complete_ai_credit_reservation_as_user(uuid, uuid) to service_role;
grant execute on function public.refund_ai_credit_reservation_as_user(uuid, uuid) to service_role;
grant execute on function public.confirm_geniuspay_payment(text) to service_role;

revoke all on table public.credit_reservations from public, anon, authenticated;
revoke all on table public.ai_operation_costs from public, anon, authenticated;
grant select on table public.credit_plans to authenticated;
grant select on table public.credits to authenticated;
grant select on table public.credit_transactions to authenticated;
grant select on table public.payment_transactions to authenticated;
