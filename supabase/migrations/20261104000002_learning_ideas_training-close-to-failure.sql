-- migration: 20261104000002_learning_ideas_training-close-to-failure.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          training-close-to-failure · 1 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-11-04 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     training-close-to-failure/idea.1.2fbfef31.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     training-close-to-failure/cover.e198cdf9.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['training-close-to-failure']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- training-close-to-failure: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/training-close-to-failure/cover.e198cdf9.webp',
    updated_at = now()
where slug = 'training-close-to-failure';

-- training-close-to-failure · 1 ideia(s)
-- Vídeo de ideia que sobrevive (mesmo id) é HERDADO da linha atual quando o
-- spec não traz vídeo: são caros de gerar (Notebook) e o mantenedor decidiu
-- mantê-los. Se título, verso ou texto mudaram, cada lado herdado ganha
-- "text_revised_at": o vídeo foi gerado antes da revisão do texto.
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case
      when coalesce(n->'video'->'pt', 'null'::jsonb) = 'null'::jsonb
       and coalesce(n->'video'->'en', 'null'::jsonb) = 'null'::jsonb
       and (coalesce(o.old->'video'->'pt', 'null'::jsonb) <> 'null'::jsonb
         or coalesce(o.old->'video'->'en', 'null'::jsonb) <> 'null'::jsonb)
      then jsonb_set(n, '{video}', jsonb_build_object(
        'pt', case
          when coalesce(o.old->'video'->'pt', 'null'::jsonb) = 'null'::jsonb then 'null'::jsonb
          when o.changed then (o.old->'video'->'pt')
            || jsonb_build_object('text_revised_at', to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'))
          else o.old->'video'->'pt' end,
        'en', case
          when coalesce(o.old->'video'->'en', 'null'::jsonb) = 'null'::jsonb then 'null'::jsonb
          when o.changed then (o.old->'video'->'en')
            || jsonb_build_object('text_revised_at', to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'))
          else o.old->'video'->'en' end
      ))
      else n
    end
    order by (n->>'ordinal')::int)
  from jsonb_array_elements($ideas$[{"id":"perto-da-falha","ordinal":1,"title":{"pt":"Precisa treinar até a falha pra crescer?","en":"Do you need to lift to failure to grow?"},"claim":{"pt":"Pare a série perto da falha. Ir até não conseguir mais rende pouco músculo a mais e nada de força.","en":"Stop each set close to failure. Grinding out the last possible rep adds little muscle and no strength."},"body":{"pt":"Falha, na musculação, é a repetição que você tenta e não consegue completar. Uma meta-análise (estudo que reúne os resultados de vários outros) com 15 estudos em adultos saudáveis achou mais músculo indo até a falha, por uma diferença que os autores chamaram de trivial, e a estatística foi contestada depois (Refalo e colegas, Sports Medicine, 2023). Pra força, outra meta-análise com 15 estudos não encontrou diferença (Grgic e colegas, 2022). A maior, com 55 estudos, mostra que a força fica parecida longe ou perto da falha, e que o músculo cresce um pouco mais quanto mais perto a série termina (Robinson e colegas, 2024). **O trabalho está nas últimas repetições difíceis**, não na que trava. E a falha cobra: num estudo pequeno, com 10 homens treinados, o corpo ainda não tinha se recuperado 24 a 48 horas depois (Morán-Navarro e colegas, 2017). Na próxima série, **pare quando achar que ainda sairiam duas ou três**. De vez em quando, vá até o fim pra conferir: estimar o que sobra é difícil no começo.","en":"Failure is the rep you try and can't finish. A meta-analysis (a study that pools the results of many others) of 15 studies in healthy adults found a bit more muscle when sets went to failure, by a margin the authors called trivial, and others later challenged the statistics (Refalo and colleagues, Sports Medicine, 2023). For strength, a second meta-analysis of 15 studies found no difference (Grgic and colleagues, 2022). The largest, pooling 55 studies, shows strength holding steady whether you stop near or far from failure, while muscle grows a little more the closer you finish (Robinson and colleagues, 2024). **The work lives in the last few hard reps**, not the one that stalls. Failure also costs you: in a small study of 10 trained men, performance still hadn't bounced back 24 to 48 hours later (Morán-Navarro and colleagues, 2017). On your next set, **stop when you think two or three more would still go up**. Now and then, go all the way to check: guessing what's left is hard early on."},"image":{"path":"training-close-to-failure/idea.1.2fbfef31.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Refalo et al., 2023 · Sports Medicine · meta-análise, 15 estudos","en":"Refalo et al., 2023 · Sports Medicine · meta-analysis, 15 studies"},"url":"https://doi.org/10.1007/s40279-022-01784-y"},{"label":{"pt":"Grgic et al., 2022 · J Sport Health Sci · meta-análise, 15 estudos","en":"Grgic et al., 2022 · J Sport Health Sci · meta-analysis, 15 studies"},"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC9068575/"},{"label":{"pt":"Robinson et al., 2024 · Sports Medicine · meta-regressões, 55 estudos","en":"Robinson et al., 2024 · Sports Medicine · meta-regressions, 55 studies"},"url":"https://doi.org/10.1007/s40279-024-02069-2"}],"cta":null}]$ideas$::jsonb) n
  left join lateral (
    select oi as old,
           (oi->'title' is distinct from n->'title'
            or oi->'claim' is distinct from n->'claim'
            or oi->'body' is distinct from n->'body') as changed
    from jsonb_array_elements(coalesce(m.ideas, '[]'::jsonb)) oi
    where oi->>'id' = n->>'id'
    limit 1
  ) o on true
),
    updated_at = now()
where m.slug = 'training-close-to-failure';

-- training-close-to-failure: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'training-close-to-failure'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
