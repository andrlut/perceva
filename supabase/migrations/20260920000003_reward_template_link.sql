-- migration: 20260920000003_reward_template_link.sql
-- purpose: reward ganha template_id — o texto de uma recompensa adotada passa a vir
--          do catálogo, no idioma do app, em vez de ficar congelado na adoção
--
-- affected tables: reward (+template_id, FK pra reward_template, backfill por título)
-- rpcs:            none
-- breaking?        no — template_id nasce null, e quem fica null continua lendo o
--                  título guardado, exatamente como hoje. Precisa de OTA junto.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
-- ──────────────────────────────────────────────────────────────────────────
-- O PROBLEMA
--
--   `reward` era a única das três entidades adotáveis SEM template_id (`task`
--   tem 152/192 linhas preenchidas, `quest` 27/28). Sem o vínculo, a adoção
--   fotografa o texto do catálogo no idioma do momento e corta o cordão — daí
--   uma Vault com 'Nice dinner out' ao lado de 'Pedir Comida' no mesmo app em
--   pt-BR. E daí também a sugestão de template só saber deduplicar por título
--   contra recompensas ATIVAS: arquivar uma adotada trazia a sugestão de volta
--   e um segundo "adotar" criava cópia.
--
-- O QUE O VÍNCULO CARREGA, E O QUE NÃO
--
--   Só TEXTO — título e descrição. Custo, ícone, categoria, is_one_shot e
--   sort_order continuam morando na recompensa: são escolha do usuário, e o
--   catálogo não manda neles. Trocar o idioma do app troca o texto; não troca
--   mais nada.
--
--   O vínculo é cortado quando o usuário edita o texto — mesma convenção que
--   `task` já usa (o `dropTemplateLink` em lib/api/tasks.ts). Renomeou, virou
--   recompensa própria, e o catálogo para de falar por ela.
--
-- O BACKFILL
--
--   Casa por título (case-insensitive) contra `title` OU `title_pt`, que é
--   exatamente o par que a tela de sugestões já usa pra decidir "essa eu já
--   tenho". Quem foi renomeada não casa e fica null — o comportamento de hoje.
--   `on delete set null` porque o catálogo pode perder uma linha um dia e a
--   recompensa do usuário não pode ir junto: ela volta a ser o texto guardado.
-- ──────────────────────────────────────────────────────────────────────────

begin;

alter table public.reward
  add column if not exists template_id text
    references public.reward_template(id) on delete set null;

comment on column public.reward.template_id is
  'Template de origem, quando adotada do catálogo. Governa SÓ título e '
  'descrição (renderizados no idioma do app); custo, ícone, categoria e '
  'is_one_shot são do usuário. Vira null quando o usuário edita o texto — '
  'ver 20260920000003.';

-- Backfill pelo mesmo par de títulos que a tela de sugestões já compara.
update public.reward r
   set template_id = t.id
  from public.reward_template t
 where r.template_id is null
   and lower(trim(r.title)) in (
     lower(trim(t.title)),
     lower(trim(coalesce(t.title_pt, '')))
   );

commit;
