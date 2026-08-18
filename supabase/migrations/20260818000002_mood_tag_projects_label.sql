-- migration: 20260818000002_mood_tag_projects_label.sql
-- purpose: encurta o rótulo da tag de contexto criada em 20260818000001.
--          "Projetos pessoais" (17 caracteres) era o chip mais longo do
--          catálogo de contexto — 4 a mais que "Redes sociais", o recordista
--          anterior — e os chips quebram em wrap, então o mais longo dita o
--          ritmo da grade inteira.
--
-- affected tables: mood_tag (label_pt/label_en de uma linha)
-- new rpcs:        none
-- breaking?       no — o slug `projects` não muda, então nenhum mood_log
--                 existente é afetado; só o texto renderizado
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar — daí esta
--   existir em vez de um ajuste na 20260818000001
--   o "pessoais" era redundante: o chip mora no bloco `self`, ao lado de
--   Lazer e Casa, e `Trabalho` vive num bloco separado. A desambiguação que
--   a palavra carregava já vem do lugar em que o chip está.

begin;

update public.mood_tag
   set label_pt = 'Projetos',
       label_en = 'Projects'
 where slug = 'projects';

commit;
