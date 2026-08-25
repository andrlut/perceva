-- migration: 20260825000001_week_item_pool_subitems.sql
-- purpose: "Minha Semana" iteração 2 (feedback do dono) — o modelo vira POOL:
--          itens vivem numa fila geral (week_start null) e a semana é uma
--          SELEÇÃO sobre ela (as 3 escolhidas do pool, não digitadas). E as
--          grandes ganham SUBITENS ("primeiro passo" vira sublista riscável).
--
-- affected tables: week_item (week_start vira nullable; nova coluna parent_id)
-- new rpcs:        none
-- breaking?       no (linhas existentes seguem válidas)
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   week_start NULL  = item na fila ("Pra depois"), sem semana alocada
--   parent_id NOT NULL = subitem (passo de uma grande); herda o week_start do
--   pai por convenção de client (mover o pai move os filhos junto)

begin;

alter table public.week_item
  alter column week_start drop not null;

alter table public.week_item
  add column if not exists parent_id uuid references public.week_item(id) on delete cascade;

create index if not exists week_item_parent_idx
  on public.week_item (parent_id)
  where parent_id is not null;

-- A fila é consultada por si só ("o que está pra depois?").
create index if not exists week_item_pool_idx
  on public.week_item (character_id)
  where week_start is null;

commit;
