-- migration: 20260912000004_learning_notebook_media.sql
-- purpose: rodada do runner do Notebook de 2026-09-12 (rodada 5, agendada):
--          1 vídeo "Resumo em Vídeo" Curta, fonte restrita ao documento da
--          ideia + foco "Cubra apenas o que está nesta fonte; não acrescente
--          outros temas.". Conferido por grade (1 quadro a cada 8 s) antes de
--          subir: fica na ideia (o material tem uma ideia só).
--            · news-oral-glp1-2026-05 · ideia 1 (rampa-de-saida-da-agulha) · PT
--              "Como Segurar o Peso Sem Ozempic" (1:12) → corte 69,9 s → 69,8 s
--          A rodada parou por cota diária de Resumo em Vídeo do Notebook
--          depois desta geração.
--
-- affected tables: learning_material (ideas -> <idea>.video.pt)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   cartão final na arte CLARA (YAVG 192 → 230), cortado pelo detector padrão
--   bucket (subidos antes, cache imutável, GET 206 conferido):
--     news-oral-glp1-2026-05/idea.1.pt.mp4 + idea.1.pt.poster.webp

begin;

-- news-oral-glp1-2026-05 · rampa-de-saida-da-agulha · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'rampa-de-saida-da-agulha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'news-oral-glp1-2026-05/idea.1.pt.mp4',
               'duration_seconds', 70,
               'poster', 'news-oral-glp1-2026-05/idea.1.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'news-oral-glp1-2026-05';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'news-oral-glp1-2026-05'
      and i->>'id' = 'rampa-de-saida-da-agulha'
      and i->'video'->'pt'->>'path' = 'news-oral-glp1-2026-05/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: news-oral-glp1-2026-05/rampa-de-saida-da-agulha video.pt was not updated';
  end if;
end
$guard$;

commit;
