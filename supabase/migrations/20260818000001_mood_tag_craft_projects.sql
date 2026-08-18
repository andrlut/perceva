-- migration: 20260818000001_mood_tag_craft_projects.sql
-- purpose: journal — fecha o buraco de Craft no vocabulário de contexto. Havia
--          `work` (obrigação) e `leisure` (diversão), mas nada pro que a
--          dimensão craft/build chama de projeto pessoal: a coisa que a pessoa
--          constrói por vontade própria. Dia puxado por um projeto pessoal só
--          podia ser marcado como trabalho ou como lazer — as duas leituras
--          erradas, e as duas contaminando a correlação humor×contexto.
--
-- affected tables: mood_tag (+1 linha de contexto)
-- new rpcs:        none
-- breaking?       no — puramente aditivo; log_mood já valida qualquer slug
--                 ativo do catálogo, e o cliente renderiza o catálogo inteiro
--                 sem slug hardcodado nem teto de tags
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   context_group = 'self' de propósito: o bloco 'life' (work/studies/money/
--   news/...) é o mundo externo que acontece COM você; projeto pessoal é
--   autodirigido, então mora com leisure/home. Colocá-lo ao lado de `work`
--   recriaria visualmente a confusão que essa tag existe pra desfazer.
--   sort_order 125 → último chip do bloco 'self', logo depois de leisure (120).
--   valence fica null como em toda tag de contexto: projeto pessoal não é
--   bom nem ruim por natureza — o dia é que diz.

begin;

insert into public.mood_tag
  (slug, label_pt, label_en, emoji, tag_group, sort_order, context_group)
values
  ('projects', 'Projetos pessoais', 'Personal projects', '🛠️', 'context', 125, 'self')
on conflict (slug) do nothing;

commit;
