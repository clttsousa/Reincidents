-- InfraOS Recorrência - schema Supabase
-- Execute tudo no SQL Editor do projeto Supabase.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'ATTENDANT' check (role in ('ADMIN', 'SUPERVISOR', 'ATTENDANT')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    'ATTENDANT'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  total_services integer not null default 1 check (total_services > 0),
  description text not null,
  status text not null default 'Aguardando contato' check (status in ('Aguardando contato', 'O.S. aberta', 'Resolvido', 'Sem retorno')),
  responsible_user_id uuid references public.profiles(id) on delete set null,
  responsible_name text not null default 'Equipe',
  os_open boolean not null default false,
  os_number text,
  resolved boolean not null default false,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  last_contact_at timestamptz,
  next_action_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists clients_status_idx on public.clients (status);
create index if not exists clients_total_services_idx on public.clients (total_services desc);
create index if not exists clients_updated_at_idx on public.clients (updated_at desc);

create table if not exists public.client_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null default auth.uid(),
  action text not null,
  status_from text,
  status_to text,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists client_history_client_id_idx on public.client_history (client_id, created_at desc);

create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null default auth.uid(),
  note text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists client_notes_client_id_idx on public.client_notes (client_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_history enable row level security;
alter table public.client_notes enable row level security;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Profiles
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
using (auth.uid() = id)
  with check (auth.uid() = id);

-- Clients
drop policy if exists "clients_select_authenticated" on public.clients;
create policy "clients_select_authenticated"
  on public.clients
  for select
  to authenticated
using (true);

drop policy if exists "clients_insert_authenticated" on public.clients;
create policy "clients_insert_authenticated"
  on public.clients
  for insert
  to authenticated
with check (true);

drop policy if exists "clients_update_authenticated" on public.clients;
create policy "clients_update_authenticated"
  on public.clients
  for update
  to authenticated
using (true)
  with check (true);

drop policy if exists "clients_delete_admin_only" on public.clients;
create policy "clients_delete_admin_only"
  on public.clients
  for delete
  to authenticated
using (public.current_app_role() = 'ADMIN');

-- History
drop policy if exists "client_history_select_authenticated" on public.client_history;
create policy "client_history_select_authenticated"
  on public.client_history
  for select
  to authenticated
using (true);

drop policy if exists "client_history_insert_authenticated" on public.client_history;
create policy "client_history_insert_authenticated"
  on public.client_history
  for insert
  to authenticated
with check (true);

-- Notes
drop policy if exists "client_notes_select_authenticated" on public.client_notes;
create policy "client_notes_select_authenticated"
  on public.client_notes
  for select
  to authenticated
using (true);

drop policy if exists "client_notes_insert_authenticated" on public.client_notes;
create policy "client_notes_insert_authenticated"
  on public.client_notes
  for insert
  to authenticated
with check (true);

drop policy if exists "client_notes_update_authenticated" on public.client_notes;
create policy "client_notes_update_authenticated"
  on public.client_notes
  for update
  to authenticated
using (true)
  with check (true);

-- Base inicial sem clientes. Cadastre os registros corretos pelo sistema ou importe depois.
