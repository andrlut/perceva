-- migration: 20260913000002_learning_ideas_news-pink-noise-sleep-2026-09.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          news-pink-noise-sleep-2026-09 · 1 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-13 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     news-pink-noise-sleep-2026-09/idea.1.b15a440f.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     news-pink-noise-sleep-2026-09/cover.4bed6709.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum (video = {pt: null, en: null})

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['news-pink-noise-sleep-2026-09']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- news-pink-noise-sleep-2026-09: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/news-pink-noise-sleep-2026-09/cover.4bed6709.webp',
    updated_at = now()
where slug = 'news-pink-noise-sleep-2026-09';

-- news-pink-noise-sleep-2026-09 · 1 ideia(s)
update public.learning_material
set ideas = $ideas$[{"id":"som-cronometrado-cerebro","ordinal":1,"title":{"pt":"O som que ouve seu cérebro dormir","en":"The sound tuned to your sleeping brain"},"claim":{"pt":"Um som de 50ms, cronometrado ao pico da onda cerebral, ampliou o pulso que limpa o cérebro em 14 pessoas dormindo.","en":"A 50-millisecond sound, timed to a brain wave's peak, boosted the pulse that flushes the sleeping brain in 14 people."},"body":{"pt":"Durante o sono profundo, ondas elétricas lentas varrem o cérebro e, logo atrás delas, sobe um pulso de líquido cefalorraquidiano (LCR) — o fluido que banha o cérebro e ajuda a levar embora resíduos metabólicos. Pesquisadores do MIT testaram se dava pra amplificar essa dupla de propósito: um algoritmo previu, com menos de 100 milissegundos de atraso, o pico exato da onda lenta de 14 voluntários cochilando dentro de um scanner de ressonância, com eletroencefalograma (EEG) e imagem funcional por ressonância (fMRI) simultâneos — a dupla que mede atividade elétrica e fluxo de líquido ao mesmo tempo — e disparou ali uma rajada de **ruído rosa** de 50 milissegundos. Publicado em 9 de setembro de 2026 na Science Translational Medicine, o resultado: a onda elétrica e o pulso de LCR ficaram maiores, sem porcentagem divulgada. Os autores, Laura Lewis e Joshua Levitt, já fundaram uma empresa em cima da tecnologia. **O timing é tudo**: um app comum de ruído rosa tocando a noite inteira não faz esse trabalho, porque nada ali é cronometrado onda a onda.","en":"During deep sleep, slow electrical waves sweep the brain, and right behind them rises a pulse of cerebrospinal fluid (CSF) — the fluid that bathes the brain and helps carry metabolic waste away. MIT researchers tested whether that pair could be amplified on purpose: an algorithm predicted, with under 100 milliseconds of lag, the exact peak of each slow wave in 14 volunteers napping inside an MRI scanner, with simultaneous electroencephalography (EEG) and functional MRI (fMRI) — the pair that tracks electrical activity and fluid flow at once — and fired a 50-millisecond burst of **pink noise** right at that instant. Published September 9, 2026 in Science Translational Medicine, the result: both the electrical wave and the CSF pulse grew larger, no percentage released. The authors, Laura Lewis and Joshua Levitt, have already founded a company around the technology. **Timing is everything**: an ordinary pink-noise app playing all night doesn't do this work, because nothing in it is timed wave by wave."},"image":{"path":"news-pink-noise-sleep-2026-09/idea.1.b15a440f.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"MIT News (9/set/2026)","en":"MIT News (Sept 9, 2026)"},"url":"https://news.mit.edu/2026/pink-noise-burst-may-mean-more-restorative-sleep-0909"},{"label":{"pt":"Levitt et al., 2026 · Science Translational Medicine","en":"Levitt et al., 2026 · Science Translational Medicine"},"url":"https://www.science.org/doi/10.1126/scitranslmed.aea5469"}],"cta":null}]$ideas$::jsonb,
    updated_at = now()
where slug = 'news-pink-noise-sleep-2026-09';

-- news-pink-noise-sleep-2026-09: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'news-pink-noise-sleep-2026-09'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
