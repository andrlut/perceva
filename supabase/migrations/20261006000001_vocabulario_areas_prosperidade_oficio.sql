-- migration: 20261006000001_vocabulario_areas_prosperidade_oficio.sql
-- purpose: vocabulário canônico do playbook (docs/brand/00-espinha.md §7) —
--          as áreas wealth e craft passam a se chamar Prosperidade e Ofício
--          em pt-BR (eram Riqueza e Criação).
--
-- affected tables: dimension, learning_material (tracking_pt de 4 materiais)
-- new rpcs:        none
-- breaking?       no — o app lê o rótulo do i18n (dimensions.*.label, trocado
--                 no mesmo PR); aqui só o catálogo e os textos do Recanto
--                 que citam a área pelo nome.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   en-US não muda (Wealth / Craft).
--   "riqueza" minúsculo como conceito (Housel: "riqueza é o que você não vê")
--   NÃO é a área e fica como está — o replace só casa "sub de Riqueza" e
--   "dimensão Riqueza".
--   O UPDATE em learning_material passa pelo trigger de revisões
--   (snapshot_material_revision), que guarda o texto anterior.

begin;

update public.dimension set display_name_pt = 'Prosperidade' where id = 'wealth';
update public.dimension set display_name_pt = 'Ofício'       where id = 'craft';

set local app.edited_by = 'maintainer';
set local app.edit_summary = 'vocabulário: área Riqueza → Prosperidade';

update public.learning_material
   set tracking_pt = replace(
         replace(tracking_pt, 'sub de Riqueza', 'sub de Prosperidade'),
         'dimensão Riqueza', 'dimensão Prosperidade')
 where tracking_pt like '%sub de Riqueza%'
    or tracking_pt like '%dimensão Riqueza%';

commit;
