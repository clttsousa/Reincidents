-- RecorrênciaOS v3.6 + v3.7
-- Gestão administrativa mais madura + dashboard mais útil.

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

alter table public.admin_audit_log enable row level security;

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
