-- RecorrênciaOS v3.4 + v3.5
-- Atualização operacional para responsável real, agenda de próximos passos e timeline funcional.

alter table public.clients
  add column if not exists responsible_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists responsible_name text not null default 'Equipe',
  add column if not exists last_contact_at timestamptz,
  add column if not exists next_action_at timestamptz,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

create index if not exists clients_responsible_user_id_idx on public.clients (responsible_user_id);
create index if not exists clients_last_contact_at_idx on public.clients (last_contact_at desc);
create index if not exists clients_next_action_at_idx on public.clients (next_action_at desc);

update public.clients as c
set responsible_user_id = p.id,
    responsible_name = coalesce(c.responsible_name, p.full_name, p.email, 'Equipe')
from public.profiles as p
where c.responsible_user_id is null
  and (
    lower(coalesce(c.responsible_name, '')) = lower(coalesce(p.full_name, ''))
    or lower(coalesce(c.responsible_name, '')) = lower(coalesce(p.email, ''))
  );

comment on column public.clients.responsible_user_id is 'Responsável real vinculado ao usuário do sistema.';
comment on column public.clients.last_contact_at is 'Última tentativa ou retorno registrado pela equipe.';
comment on column public.clients.next_action_at is 'Próxima ação planejada para acompanhar o caso.';
