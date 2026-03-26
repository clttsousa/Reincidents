-- RecorrênciaOS - schema Supabase
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
  description text not null default '',
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
create index if not exists clients_responsible_user_id_idx on public.clients (responsible_user_id);
create index if not exists clients_last_contact_at_idx on public.clients (last_contact_at desc);
create index if not exists clients_next_action_at_idx on public.clients (next_action_at desc);

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

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_user_id_idx on public.admin_audit_log (target_user_id);

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
alter table public.admin_audit_log enable row level security;

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
drop policy if exists "profiles_update_own_safe" on public.profiles;
create policy "profiles_update_own_safe"
  on public.profiles
  for update
  to authenticated
using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = public.current_app_role()
    and is_active = coalesce((select p.is_active from public.profiles as p where p.id = auth.uid()), true)
  );

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles
  for update
  to authenticated
using (public.current_app_role() = 'ADMIN' and auth.uid() <> id)
  with check (public.current_app_role() = 'ADMIN' and auth.uid() <> id);

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

-- Admin audit

drop policy if exists "admin_audit_log_select_admin_only" on public.admin_audit_log;
create policy "admin_audit_log_select_admin_only"
  on public.admin_audit_log
  for select
  to authenticated
using (public.current_app_role() = 'ADMIN');

drop policy if exists "admin_audit_log_insert_admin_only" on public.admin_audit_log;
create policy "admin_audit_log_insert_admin_only"
  on public.admin_audit_log
  for insert
  to authenticated
with check (public.current_app_role() = 'ADMIN' and actor_id = auth.uid());

-- Base inicial sem clientes. Cadastre os registros corretos pelo sistema ou importe depois.


-- RecorrênciaOS v4.0
-- Hardening de governança e rastreabilidade administrativa.

alter table public.profiles add column if not exists last_login_at timestamptz;
alter table public.profiles add column if not exists disabled_reason text;

create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_active from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.touch_profile_last_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  update public.profiles
  set last_login_at = timezone('utc', now())
  where id = auth.uid();
end;
$$;

grant execute on function public.touch_profile_last_login() to authenticated;

create or replace function public.admin_update_profile(
  target_user_id uuid,
  next_role text default null,
  next_active boolean default null,
  reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  current_profile public.profiles%rowtype;
  updated_profile public.profiles%rowtype;
  active_admin_count integer;
  clean_reason text := nullif(btrim(coalesce(reason, '')), '');
begin
  if actor_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select role
    into actor_role
  from public.profiles
  where id = actor_id
    and is_active = true;

  if actor_role <> 'ADMIN' then
    raise exception 'Apenas administradores podem alterar usuários';
  end if;

  if actor_id = target_user_id then
    raise exception 'Sua própria conta não pode ser alterada por esta função';
  end if;

  select *
    into current_profile
  from public.profiles
  where id = target_user_id;

  if not found then
    raise exception 'Usuário alvo não encontrado';
  end if;

  if next_role is not null and next_role not in ('ADMIN', 'SUPERVISOR', 'ATTENDANT') then
    raise exception 'Cargo inválido';
  end if;

  if current_profile.role = 'ADMIN'
     and current_profile.is_active = true
     and (
       (next_active is not null and next_active = false)
       or (next_role is not null and next_role <> 'ADMIN')
     ) then
    select count(*)
      into active_admin_count
    from public.profiles
    where role = 'ADMIN'
      and is_active = true
      and id <> target_user_id;

    if active_admin_count = 0 then
      raise exception 'Não é possível remover o último admin ativo';
    end if;
  end if;

  update public.profiles
  set role = coalesce(next_role, current_profile.role),
      is_active = coalesce(next_active, current_profile.is_active),
      disabled_reason = case
        when coalesce(next_active, current_profile.is_active) = false then clean_reason
        else null
      end,
      updated_at = timezone('utc', now())
  where id = target_user_id
  returning * into updated_profile;

  if next_role is not null and next_role <> current_profile.role then
    insert into public.admin_audit_log (actor_id, target_user_id, action, metadata)
    values (
      actor_id,
      target_user_id,
      'role_changed',
      jsonb_build_object(
        'previous_role', current_profile.role,
        'next_role', updated_profile.role,
        'reason', clean_reason
      )
    );
  end if;

  if next_active is not null and next_active is distinct from current_profile.is_active then
    insert into public.admin_audit_log (actor_id, target_user_id, action, metadata)
    values (
      actor_id,
      target_user_id,
      case when updated_profile.is_active then 'user_activated' else 'user_deactivated' end,
      jsonb_build_object(
        'next_active', updated_profile.is_active,
        'reason', clean_reason
      )
    );
  end if;

  return updated_profile;
end;
$$;

grant execute on function public.admin_update_profile(uuid, text, boolean, text) to authenticated;

drop policy if exists "profiles_admin_update" on public.profiles;

drop policy if exists "clients_insert_authenticated" on public.clients;
create policy "clients_insert_authenticated"
  on public.clients
  for insert
  to authenticated
with check (
  public.current_user_is_active()
  and created_by = auth.uid()
  and updated_by = auth.uid()
);

drop policy if exists "clients_update_authenticated" on public.clients;
create policy "clients_update_authenticated"
  on public.clients
  for update
  to authenticated
using (public.current_user_is_active())
  with check (
    public.current_user_is_active()
    and updated_by = auth.uid()
  );

drop policy if exists "client_history_insert_authenticated" on public.client_history;
create policy "client_history_insert_authenticated"
  on public.client_history
  for insert
  to authenticated
with check (
  public.current_user_is_active()
  and actor_id = auth.uid()
);

drop policy if exists "client_notes_insert_authenticated" on public.client_notes;
create policy "client_notes_insert_authenticated"
  on public.client_notes
  for insert
  to authenticated
with check (
  public.current_user_is_active()
  and author_id = auth.uid()
);

drop policy if exists "client_notes_update_authenticated" on public.client_notes;
create policy "client_notes_update_authenticated"
  on public.client_notes
  for update
  to authenticated
using (
  public.current_user_is_active()
  and author_id = auth.uid()
)
  with check (
    public.current_user_is_active()
    and author_id = auth.uid()
  );

