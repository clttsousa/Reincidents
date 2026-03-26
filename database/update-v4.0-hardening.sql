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
