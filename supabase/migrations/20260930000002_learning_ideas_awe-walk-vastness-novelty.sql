-- migration: 20260930000002_learning_ideas_awe-walk-vastness-novelty.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          awe-walk-vastness-novelty · 1 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-30 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     awe-walk-vastness-novelty/idea.1.1c9f0700.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     awe-walk-vastness-novelty/cover.3c6ac2a3.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['awe-walk-vastness-novelty']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- awe-walk-vastness-novelty: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/awe-walk-vastness-novelty/cover.3c6ac2a3.webp',
    updated_at = now()
where slug = 'awe-walk-vastness-novelty';

-- awe-walk-vastness-novelty · 1 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"caminhada-da-admiracao","ordinal":1,"title":{"pt":"Uma caminhada pode treinar a admiração?","en":"Can walking train your sense of awe?"},"claim":{"pt":"Uma vez por semana, caminhe ao menos 15 minutos procurando o que é vasto e o que é novo pra você.","en":"Once a week, walk for at least 15 minutes looking for what is vast and what is new to you."},"body":{"pt":"Num ensaio de Sturm e colegas (Emotion, 2020), 52 adultos saudáveis de 60 a 90 anos fizeram uma caminhada de 15 minutos ao ar livre por semana, durante 8 semanas. Os 24 de um dos grupos receberam uma única instrução a mais: procurar **vastidão e novidade**, e ir a um lugar novo a cada semana, se possível. Nos passeios, eles sentiram mais admiração, o espanto diante de algo maior que você, e mais alegria. No dia a dia, a angústia caiu mais que no outro grupo. Nas selfies que tiravam no caminho, o próprio rosto e o corpo foram ocupando cada vez menos espaço na foto, e o sorriso cresceu. Os autores leem isso como um \"eu pequeno\": a atenção sai de você e vai pro mundo. As ressalvas contam. A amostra é pequena, os passeios duraram na prática de 38 a 47 minutos em média, e ansiedade e depressão não mudaram. Pra testar, **escolha um caminho que você nunca fez** na caminhada desta semana e procure a coisa maior à vista.","en":"In a trial by Sturm and colleagues (Emotion, 2020), 52 healthy adults aged 60 to 90 took a 15-minute outdoor walk once a week for 8 weeks. The 24 in one group got a single extra instruction: look for **vastness and novelty**, and go somewhere new each week if you can. On their walks they felt more awe, that jolt of standing before something bigger than you, plus more joy. Their daily distress fell further than the other group's. In the selfies they took along the way, their own face and body filled less and less of the frame, while their smiles grew. The authors read that as a \"small self\": attention moving off you and onto the world. The caveats are real. The sample was small, the walks actually averaged 38 to 47 minutes, and anxiety and depression didn't budge. To try it, **pick a route you've never taken** on this week's walk and look for the biggest thing in view."},"image":{"path":"awe-walk-vastness-novelty/idea.1.1c9f0700.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Sturm et al., 2020 · Emotion · texto completo","en":"Sturm et al., 2020 · Emotion · full text"},"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC8034841/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'awe-walk-vastness-novelty';

-- awe-walk-vastness-novelty: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'awe-walk-vastness-novelty'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
