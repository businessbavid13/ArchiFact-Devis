create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  unit_price numeric not null default 0,
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  number text not null,
  client_id uuid,
  date text not null,
  expiration_date text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  discount_type text not null default 'fixed',
  discount_value numeric not null default 0,
  tax_rate numeric not null default 0,
  tax_amount numeric not null default 0,
  additional_tax_name text,
  additional_tax_rate numeric,
  additional_tax_amount numeric,
  total numeric not null default 0,
  payment_mode text,
  terms text,
  status text not null default 'pending',
  scanned_pages_urls jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  number text not null,
  client_id uuid,
  date text not null,
  due_date text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  discount_type text not null default 'fixed',
  discount_value numeric not null default 0,
  tax_rate numeric not null default 0,
  tax_amount numeric not null default 0,
  additional_tax_name text,
  additional_tax_rate numeric,
  additional_tax_amount numeric,
  total numeric not null default 0,
  payment_mode text,
  terms text,
  status text not null default 'pending',
  scanned_pages_urls jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default 'Mon Entreprise',
  legal_status text,
  email text,
  phone text,
  address text,
  tax_id text,
  logo_url text,
  header_image_url text,
  header_text text,
  footer_text text,
  footer_image_url text,
  signature_url text,
  signature_image_url text,
  currency text not null default 'FCFA',
  language text not null default 'Français',
  number_format text not null default '1 000 000',
  date_format text not null default 'DD/MM/YYYY',
  invoice_due_days integer not null default 7,
  show_payment_status boolean not null default true,
  document_template text not null default 'Archi & Moderne',
  invoice_color text not null default '#0F5132',
  quote_color text not null default '#C2410C',
  invoice_opacity integer not null default 100,
  signature_scale integer not null default 100,
  payment_modes jsonb not null default '[]'::jsonb,
  terms_and_conditions jsonb not null default '[]'::jsonb,
  tax_options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.clients add column if not exists updated_at timestamptz not null default now();
alter table public.articles add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.articles add column if not exists updated_at timestamptz not null default now();
alter table public.quotes add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.quotes add column if not exists updated_at timestamptz not null default now();
alter table public.invoices add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.invoices add column if not exists updated_at timestamptz not null default now();
alter table public.company_settings add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.company_settings add column if not exists updated_at timestamptz not null default now();

create index if not exists clients_user_id_created_at_idx on public.clients(user_id, created_at desc);
create index if not exists articles_user_id_created_at_idx on public.articles(user_id, created_at desc);
create index if not exists quotes_user_id_created_at_idx on public.quotes(user_id, created_at desc);
create index if not exists invoices_user_id_created_at_idx on public.invoices(user_id, created_at desc);
create unique index if not exists company_settings_user_id_unique on public.company_settings(user_id);

create or replace function public.set_user_data_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  if new.user_id is distinct from auth.uid() then
    raise exception 'USER_OWNERSHIP_MISMATCH';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists clients_set_owner on public.clients;
create trigger clients_set_owner before insert or update on public.clients
for each row execute procedure public.set_user_data_owner();

drop trigger if exists articles_set_owner on public.articles;
create trigger articles_set_owner before insert or update on public.articles
for each row execute procedure public.set_user_data_owner();

drop trigger if exists quotes_set_owner on public.quotes;
create trigger quotes_set_owner before insert or update on public.quotes
for each row execute procedure public.set_user_data_owner();

drop trigger if exists invoices_set_owner on public.invoices;
create trigger invoices_set_owner before insert or update on public.invoices
for each row execute procedure public.set_user_data_owner();

drop trigger if exists company_settings_set_owner on public.company_settings;
create trigger company_settings_set_owner before insert or update on public.company_settings
for each row execute procedure public.set_user_data_owner();

do $$
declare
  table_name text;
begin
  foreach table_name in array array['clients', 'articles', 'quotes', 'invoices', 'company_settings'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I_select_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_insert_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_update_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_delete_own on public.%I', table_name, table_name);
    execute format(
      'create policy %I_select_own on public.%I for select to authenticated using (user_id = auth.uid())',
      table_name, table_name
    );
    execute format(
      'create policy %I_insert_own on public.%I for insert to authenticated with check (user_id = auth.uid())',
      table_name, table_name
    );
    execute format(
      'create policy %I_update_own on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      table_name, table_name
    );
    execute format(
      'create policy %I_delete_own on public.%I for delete to authenticated using (user_id = auth.uid())',
      table_name, table_name
    );
  end loop;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'clients'
  ) then
    alter publication supabase_realtime add table public.clients;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'articles'
  ) then
    alter publication supabase_realtime add table public.articles;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'quotes'
  ) then
    alter publication supabase_realtime add table public.quotes;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'invoices'
  ) then
    alter publication supabase_realtime add table public.invoices;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'company_settings'
  ) then
    alter publication supabase_realtime add table public.company_settings;
  end if;
end;
$$;
