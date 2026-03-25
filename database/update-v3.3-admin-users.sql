-- RecorrênciaOS - atualização de gestão de usuários
-- Execute este arquivo no SQL Editor se você já tinha a versão anterior funcionando.

alter table public.clients
  alter column description set default '';

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
