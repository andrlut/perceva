-- migration: 20260912000003_learning_notebook_media.sql
-- purpose: rodada do runner do Notebook de 2026-09-12 (rodada 3 de 3):
--          5 vídeos "Resumo em Vídeo" Curta, um por ideia, fonte restrita ao
--          documento daquela ideia + foco "Cubra apenas o que está nesta fonte;
--          não acrescente outros temas.". Todos conferidos quadro a quadro
--          (1 a cada 8 s, grade única por vídeo) antes de subir: nenhum vaza
--          pra outra ideia.
--            · non-instrumental-play · ideia 1 (dominio-recarrega) · PT
--              gerado na rodada 2 (estourou o time-box de 30 min lá e terminou
--              em ~44 min), retomado aqui pelo notebook_url do manifest.
--              "Como o Esforço Recarrega o Cérebro" (1:25) → 82,6 s → 82,4 s
--            · does-money-buy-happiness · ideia 1 (teto-dos-75-mil) · PT
--              "A Felicidade Não Trava nos 75 Mil" (1:10) → 67,3 s → 67,2 s
--            · attachment-styles-love · ideia 1 (dois-numeros-nao-rotulo) · PT
--              "Por que o Apego Ansioso não é um Diagnóstico" (1:15) → 72,8 s → 72,7 s
--            · summary-deep-work · ideia 1 (residuo-de-atencao) · PT
--              "Como o Resíduo de Atenção Destrói Seu Foco" (1:14) → 71,5 s → 71,4 s
--            · news-loneliness-memory-2026-04 · ideia 1 (nivel-nao-velocidade) · PT
--              "A Verdadeira Relação Entre Solidão e Memória" (1:23) → 80,3 s → 80,2 s
--
-- affected tables: learning_material (ideas -> <idea>.video.pt)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   os 5 cartões finais vieram na arte CLARA (YAVG ~230), cortados pelo
--   detector padrão de video.mjs (cutAt numérico em todos)
--   bucket (subidos antes, cache imutável, GET 200 conferido):
--     non-instrumental-play/idea.1.pt.mp4          + idea.1.pt.poster.webp
--     does-money-buy-happiness/idea.1.pt.mp4       + idea.1.pt.poster.webp
--     attachment-styles-love/idea.1.pt.mp4         + idea.1.pt.poster.webp
--     summary-deep-work/idea.1.pt.mp4              + idea.1.pt.poster.webp
--     news-loneliness-memory-2026-04/idea.1.pt.mp4 + idea.1.pt.poster.webp
--   só PT nesta rodada: um UPDATE ... FROM casa no máximo uma linha de v por
--   linha alvo, então pt e en do mesmo slug nunca viajam no mesmo comando.

begin;

-- PT: um vídeo por material, todos na ideia 1
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case
      when i->>'id' = v.idea_id then
        jsonb_set(
          i,
          '{video}',
          coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
            || jsonb_build_object('pt', jsonb_build_object(
                 'path', v.path,
                 'duration_seconds', v.duration_seconds,
                 'poster', v.poster)),
          true)
      else i
    end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
from (values
  ('non-instrumental-play',          'dominio-recarrega',       'non-instrumental-play/idea.1.pt.mp4',          82, 'non-instrumental-play/idea.1.pt.poster.webp'),
  ('does-money-buy-happiness',       'teto-dos-75-mil',         'does-money-buy-happiness/idea.1.pt.mp4',       67, 'does-money-buy-happiness/idea.1.pt.poster.webp'),
  ('attachment-styles-love',         'dois-numeros-nao-rotulo', 'attachment-styles-love/idea.1.pt.mp4',         73, 'attachment-styles-love/idea.1.pt.poster.webp'),
  ('summary-deep-work',              'residuo-de-atencao',      'summary-deep-work/idea.1.pt.mp4',              71, 'summary-deep-work/idea.1.pt.poster.webp'),
  ('news-loneliness-memory-2026-04', 'nivel-nao-velocidade',    'news-loneliness-memory-2026-04/idea.1.pt.mp4', 80, 'news-loneliness-memory-2026-04/idea.1.pt.poster.webp')
) as v(slug, idea_id, path, duration_seconds, poster)
where m.slug = v.slug;

-- Guarda (padrão de 20260907000004): slug errado atualiza 0 linhas e id de
-- ideia errado deixa o array intacto — os dois passariam em silêncio.
do $guard$
declare
  r record;
begin
  for r in
    select *
    from (values
      ('non-instrumental-play',          'dominio-recarrega',       'pt', 'non-instrumental-play/idea.1.pt.mp4',          'non-instrumental-play/idea.1.pt.poster.webp',          82),
      ('does-money-buy-happiness',       'teto-dos-75-mil',         'pt', 'does-money-buy-happiness/idea.1.pt.mp4',       'does-money-buy-happiness/idea.1.pt.poster.webp',       67),
      ('attachment-styles-love',         'dois-numeros-nao-rotulo', 'pt', 'attachment-styles-love/idea.1.pt.mp4',         'attachment-styles-love/idea.1.pt.poster.webp',         73),
      ('summary-deep-work',              'residuo-de-atencao',      'pt', 'summary-deep-work/idea.1.pt.mp4',              'summary-deep-work/idea.1.pt.poster.webp',              71),
      ('news-loneliness-memory-2026-04', 'nivel-nao-velocidade',    'pt', 'news-loneliness-memory-2026-04/idea.1.pt.mp4', 'news-loneliness-memory-2026-04/idea.1.pt.poster.webp', 80)
    ) as v(slug, idea_id, locale, path, poster, duration_seconds)
  loop
    if not exists (
      select 1
      from public.learning_material m, jsonb_array_elements(m.ideas) i
      where m.slug = r.slug
        and i->>'id' = r.idea_id
        and i->'video'->r.locale->>'path' = r.path
        and i->'video'->r.locale->>'poster' = r.poster
        and (i->'video'->r.locale->>'duration_seconds')::int = r.duration_seconds
    ) then
      raise exception 'learning_notebook: % / % video.% nao foi atualizado', r.slug, r.idea_id, r.locale;
    end if;
  end loop;
end
$guard$;

commit;
