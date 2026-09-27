-- migration: 20260927000005_linear_star_xp.sql
-- purpose: escala de estrelas linear — cada estrela vale 10 XP
--          (10/20/35/55/80 → 10/20/30/40/50)
--
-- affected tables: none (só a função base_xp_for_stars)
-- new rpcs:        none
-- breaking?        no — mesma assinatura e mesmo return type; complete_task e
--                  complete_template já chamam base_xp_for_stars e passam a
--                  pagar a escala nova sem redefinição
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   decisão do dono (2026-09-27): "XP = estrelas × 10" se explica numa frase,
--   e 2★ + 3★ em duas subs passa a valer o mesmo que 5★ numa sub só (hoje
--   55 vs 80). 1★ e 2★ não mudam (84% das estrelas ativas); nos últimos 90
--   dias a escala nova teria dado ~6% menos XP no total.
--   moedas seguem = round(xp × coin_multiplier) — o multiplicador não muda.
--   conclusões antigas mantêm o XP gravado (task_completion é imutável).
--   espelho no client: REWARD_BY_DIFFICULTY em app/lib/xp.ts.
--   as missões já pagavam 10 XP por estrela (app/lib/quests/reward.ts).

begin;

create or replace function public.base_xp_for_stars(p_stars integer)
returns integer
language sql
immutable
as $$
  select case when p_stars between 1 and 5 then p_stars * 10 else null end;
$$;

commit;
