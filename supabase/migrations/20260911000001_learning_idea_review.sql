-- migration: 20260911000001_learning_idea_review.sql
-- purpose: Minhas ideias vira pilha de revisão. O que o leitor absorve entra
--          numa fila; ao abrir o acervo ele revê uma por uma e arrasta pra
--          direita (favorita) ou esquerda (solta). A grade mostra as favoritas.
--          Absorver continua irreversível (sem delete, sem mexer em XP).
--          Também corrige 6 títulos de ideias secundárias que perdiam o
--          contexto fora do material (regra editorial nova: da ideia 2 em
--          diante o título nomeia o assunto).
--
-- affected tables: learning_idea_collect (+reviewed_at, +favorite),
--                  learning_material (ideas -> title de 6 ideias)
-- new rpcs:        review_idea(p_slug text, p_idea_id text, p_favorite boolean)
-- breaking?        no — colunas novas anuláveis; clientes antigos ignoram
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   null em reviewed_at = ainda não revisada (é o que a lâmpada do Recanto conta)

begin;

-- ── 1. colunas de revisão ─────────────────────────────────────────────────
alter table public.learning_idea_collect
  add column if not exists reviewed_at timestamptz,
  add column if not exists favorite boolean;

comment on column public.learning_idea_collect.reviewed_at is
  'Quando o leitor reviu a ideia em Minhas ideias (swipe). null = esperando revisão.';
comment on column public.learning_idea_collect.favorite is
  'Decisão da revisão: true = favorita (aparece na grade), false = solta. null enquanto não revisada.';

-- ── 2. RPC review_idea ────────────────────────────────────────────────────
-- Único caminho de escrita nas colunas de revisão (não há policy de update).
-- Idempotente e re-revisável: chamar de novo troca a decisão.
create or replace function public.review_idea(p_slug text, p_idea_id text, p_favorite boolean)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_char    uuid := auth.uid();
  v_mat     uuid;
  v_now     timestamptz := now();
  v_pending integer;
  v_favs    integer;
begin
  if v_char is null then
    raise exception 'not authenticated';
  end if;
  if p_favorite is null then
    raise exception 'p_favorite must be true or false';
  end if;

  select id into v_mat
  from public.learning_material
  where slug = p_slug and is_archived = false;
  if v_mat is null then
    raise exception 'material not found: %', p_slug;
  end if;

  update public.learning_idea_collect
     set favorite = p_favorite,
         reviewed_at = v_now
   where character_id = v_char
     and material_id = v_mat
     and idea_id = p_idea_id;
  if not found then
    raise exception 'idea not collected: %/%', p_slug, p_idea_id;
  end if;

  select count(*) filter (where reviewed_at is null),
         count(*) filter (where favorite is true)
    into v_pending, v_favs
  from public.learning_idea_collect
  where character_id = v_char;

  return json_build_object(
    'favorite', p_favorite,
    'reviewed_at', v_now,
    'pending_reviews', v_pending,
    'favorites', v_favs
  );
end
$fn$;

revoke all on function public.review_idea(text, text, boolean) from public;
grant execute on function public.review_idea(text, text, boolean) to authenticated;

-- ── 3. títulos de ideias secundárias que perdiam o contexto ───────────────
-- id, imagem, vídeo e texto ficam; só `title` muda (≤48 chars nos dois idiomas).
do $fix$
declare
  r record;
  n integer;
begin
  for r in
    select * from (values
      ('summary-antifragile',    'via-negativa',              'Antifrágil: tirar rende mais que adicionar.',    'Antifragile: removing beats adding.'),
      ('summary-antifragile',    'barbell',                   'Antifrágil: o meio-termo é o mais arriscado.',   'Antifragile: the middle is the riskiest spot.'),
      ('summary-antifragile',    'pele-em-jogo',              'Só siga conselho de quem perde se errar.',       'Only take advice from those who lose if wrong.'),
      ('catch-up-sleep-weekend', 'mesmos-dados',              'Sono extra: mesmos dados, vereditos opostos.',   'Extra sleep: same data, opposite verdicts.'),
      ('catch-up-sleep-weekend', 'tres-fusos',                'Dormir tarde no sábado: três fusos por semana.', 'Late Saturday sleep: three time zones a week.'),
      ('friendship-hours',       'hora-de-trabalho-nao-conta','O relógio da amizade não corre no trabalho.',    'The friendship clock doesn''t run at work.')
    ) as t(slug, idea_id, title_pt, title_en)
  loop
    if length(r.title_pt) > 48 or length(r.title_en) > 48 then
      raise exception 'title over 48 chars: %/%', r.slug, r.idea_id;
    end if;

    update public.learning_material m
       set ideas = (
         select jsonb_agg(
                  case when i->>'id' = r.idea_id
                       then jsonb_set(i, '{title}', jsonb_build_object('pt', r.title_pt, 'en', r.title_en), true)
                       else i end
                  order by (i->>'ordinal')::int)
           from jsonb_array_elements(m.ideas) i)
     where m.slug = r.slug
       and exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = r.idea_id);
    get diagnostics n = row_count;
    if n <> 1 then
      raise exception 'title fix did not apply: %/%', r.slug, r.idea_id;
    end if;
  end loop;
end
$fix$;

commit;
