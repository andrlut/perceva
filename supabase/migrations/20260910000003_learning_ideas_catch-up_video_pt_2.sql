-- migration: 20260910000003_learning_ideas_catch-up_video_pt_2.sql
-- purpose: primeiro vídeo por ideia gerado pela rotina do Notebook (teste manual
--          do runbook .claude/agents/learning-notebook-runner.md, §10):
--          catch-up-sleep-weekend · ideia 2 (mesmos-dados) · PT.
--          Gemini Notebook "Resumo em Vídeo" Curta, fonte restrita ao documento
--          da ideia 2 + foco "Cubra apenas o que está nesta fonte". Título no
--          Estúdio: "Como o Sono Extra Realmente Funciona" (1:22). Cartão final
--          cortado em 79,8 s por tools/content-media/video.mjs → 79,7 s.
--          Conferido quadro a quadro: fica na ideia 2 (dois vereditos, subgrupo
--          < 6 h, curva em U), sem vazar pras ideias 1 e 3.
--
-- affected tables: learning_material (ideas -> mesmos-dados.video.pt)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   bucket: catch-up-sleep-weekend/idea.2.pt.mp4 (video/mp4, 720x1280) +
--           catch-up-sleep-weekend/idea.2.pt.poster.webp (subidos antes, cache imutável)

begin;

update public.learning_material m
set ideas = (
  select jsonb_agg(
    case
      when i->>'id' = 'mesmos-dados' then
        jsonb_set(
          i,
          '{video,pt}',
          jsonb_build_object(
            'path', 'catch-up-sleep-weekend/idea.2.pt.mp4',
            'duration_seconds', 80,
            'poster', 'catch-up-sleep-weekend/idea.2.pt.poster.webp'
          ),
          true
        )
      else i
    end
    order by (i->>'ordinal')::int
  )
  from jsonb_array_elements(m.ideas) i
)
where m.slug = 'catch-up-sleep-weekend';

-- Guarda: falha alto se o update não pegou a ideia certa.
do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'catch-up-sleep-weekend'
      and i->>'id' = 'mesmos-dados'
      and i->'video'->'pt'->>'path' = 'catch-up-sleep-weekend/idea.2.pt.mp4'
  ) then
    raise exception 'catch-up-sleep-weekend/mesmos-dados video.pt não foi atualizado';
  end if;
end
$guard$;

commit;
