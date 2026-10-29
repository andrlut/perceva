-- Analytics mínimo (doc "Onboarding simples — proposta", Fase 1, 2026-10-19).
--
-- Eventos de uso do app: só um nome e props pequenos (número do passo, nome
-- da aba, modo do destravamento). Sem texto livre, sem conteúdo pessoal, sem
-- SDK de terceiro. O cliente INSERE os próprios eventos e não lê nada; a
-- leitura é nossa, por SQL (funil da primeira semana: intro → 1ª prática →
-- volta no dia 2 → destrava Recompensas → volta no dia 7). O que já existe
-- em outras tabelas (práticas feitas, Avaliação concluída) não vira evento:
-- sai de lá.

create table public.app_event (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (name ~ '^[a-z][a-z0-9_]{0,63}$'),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) <= 1024),
  created_at timestamptz not null default now()
);

create index app_event_name_created_idx on public.app_event (name, created_at);
create index app_event_user_created_idx on public.app_event (user_id, created_at);

alter table public.app_event enable row level security;

-- user_id e created_at são sempre do servidor, venha o que vier do cliente.
-- RLS confere o WITH CHECK depois dos BEFORE triggers, então a política
-- abaixo vê a linha já carimbada.
create or replace function public.app_event_stamp()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();
  if new.user_id is null then
    raise exception 'app_event requires a signed-in user' using errcode = '42501';
  end if;
  new.created_at := now();
  return new;
end $$;

create trigger app_event_stamp
  before insert on public.app_event
  for each row execute function public.app_event_stamp();

create policy app_event_self_insert on public.app_event
  for insert to authenticated
  with check (user_id = auth.uid());
-- Sem política de select/update/delete de propósito: o cliente só escreve.

revoke all on public.app_event from anon, public;
grant insert on public.app_event to authenticated;
