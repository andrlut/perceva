-- migration: 20261018000002_learning_ideas_ultra-processed-eat-more.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          ultra-processed-eat-more · 1 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-10-18 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     ultra-processed-eat-more/idea.1.d536a5d1.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     ultra-processed-eat-more/cover.180200f5.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['ultra-processed-eat-more']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- ultra-processed-eat-more: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/ultra-processed-eat-more/cover.180200f5.webp',
    updated_at = now()
where slug = 'ultra-processed-eat-more';

-- ultra-processed-eat-more · 1 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"ultraprocessado-come-mais","ordinal":1,"title":{"pt":"Ultraprocessados fazem você comer mais?","en":"Does ultra-processed food make you eat more?"},"claim":{"pt":"Com ultraprocessados à vontade, você come cerca de 500 kcal a mais por dia e ganha peso em duas semanas.","en":"Free to eat ultra-processed food, you take in about 500 extra kcal a day and gain weight within two weeks."},"body":{"pt":"Kevin Hall e colegas internaram 20 adultos saudáveis no Centro Clínico do NIH, nos Estados Unidos, por quatro semanas (Cell Metabolism, 2019). Em ordem sorteada, cada um passou duas semanas comendo ultraprocessados, a comida montada na indústria com ingredientes refinados e aditivos, e duas comendo alimentos não processados. Os pratos batiam nos nutrientes do rótulo, como calorias, açúcar, gordura e sal, e cada um comia quanto quisesse. Na fase ultraprocessada, **o consumo subiu cerca de 500 kcal por dia**, e o peso subiu 0,9 kg. Na outra, caiu quase o mesmo. Ninguém mandou ninguém repetir o prato. O porquê ainda está em aberto: o ultraprocessado tinha mais calorias por grama, e os hormônios da fome se inverteram. São só 20 pessoas e duas semanas, então trate como pista forte, não sentença. Uma troca razoável, ainda não testada sozinha: **escolha a versão pouco processada de uma refeição que você já come**.","en":"Kevin Hall's team at the NIH Clinical Center in the US had 20 healthy adults live on the ward for four weeks (Cell Metabolism, 2019). In random order, each spent two weeks on ultra-processed food, the kind assembled in a factory from refined ingredients and additives, and two weeks on unprocessed food. Meals matched on the label nutrients, like calories, sugar, fat and salt, and everyone ate as much as they wanted. On the ultra-processed diet, **intake rose by about 500 kcal a day**, and weight went up 0.9 kg. On the other, it dropped by about the same. Nobody was told to go back for seconds. Why it happens is still open: the ultra-processed meals packed more calories per gram, and hunger hormones flipped. It was 20 people for two weeks, so read it as a strong lead, not a verdict. A reasonable swap, though untested on its own: **pick the minimally processed version of a meal you already eat**."},"image":{"path":"ultra-processed-eat-more/idea.1.d536a5d1.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Hall et al., 2019 · Cell Metabolism","en":"Hall et al., 2019 · Cell Metabolism"},"url":"https://doi.org/10.1016/j.cmet.2019.05.008"},{"label":{"pt":"NIH · comunicado do estudo","en":"NIH · study news release"},"url":"https://www.nih.gov/news-events/news-releases/nih-study-finds-heavily-processed-foods-cause-overeating-weight-gain"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'ultra-processed-eat-more';

-- ultra-processed-eat-more: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'ultra-processed-eat-more'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
