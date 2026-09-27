-- migration: 20260927000004_learning_ideas_stretching-ten-minutes-week.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          stretching-ten-minutes-week · 2 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-27 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     stretching-ten-minutes-week/idea.1.be1d6f59.webp  (960x1200, gemini-api)
--     stretching-ten-minutes-week/idea.2.1c28284d.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     stretching-ten-minutes-week/cover.7a10c4d6.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['stretching-ten-minutes-week']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- stretching-ten-minutes-week: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/stretching-ten-minutes-week/cover.7a10c4d6.webp',
    updated_at = now()
where slug = 'stretching-ten-minutes-week';

-- stretching-ten-minutes-week · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"dez-minutos-por-semana","ordinal":1,"title":{"pt":"Quanto alongamento dá flexibilidade?","en":"How much stretching builds flexibility?"},"claim":{"pt":"Alongue cada músculo 10 minutos por semana, somando tudo, e divida como quiser. Passar disso não rende mais.","en":"Stretch each muscle for 10 minutes a week in total, split any way you like. More time adds nothing."},"body":{"pt":"Alongamento estático é segurar o músculo esticado, parado, por alguns segundos ou minutos. A equipe de Lewis Ingram juntou 189 estudos com 6.654 adultos (Ingram et al., Sports Medicine, 2024) e mediu a amplitude de movimento, ou seja, até onde a articulação chega, como o quanto sua mão desce em direção ao pé. Depois de semanas de treino, o ganho foi grande e bateu no teto com **cerca de 10 minutos por semana para cada grupo muscular**, somando todas as sessões. Mais tempo não trouxe ganho extra, em média.\n\nA mesma análise testou se importa quantas vezes por semana você alonga, e não importou. Dez sessões de 1 minuto ou uma de 10 chegam ao mesmo lugar. A força do alongamento também não fez diferença: suave rendeu tanto quanto forte.\n\nEscolha o músculo que mais te trava, como a parte de trás da coxa, e **some 10 minutos na semana**: 2 minutos em cinco dias, ou 5 minutos em dois. Uma ressalva: a média de idade das pessoas estudadas era de 27 anos.","en":"Static stretching means holding a muscle at length, still, for seconds or minutes. Lewis Ingram's team pooled 189 studies covering 6,654 adults (Ingram et al., Sports Medicine, 2024) and measured range of motion: how far a joint can travel, like how close your fingers get to your toes. After weeks of stretching the gain was large, and it topped out at **about 10 minutes per week for each muscle group**, added up across sessions. Extra time bought nothing more, on average.\n\nThe same analysis checked whether it matters how many times a week you stretch. It didn't. Ten one-minute bouts or a single ten-minute one land in the same place. How hard you pull made no difference either: gentle stretching worked as well as intense.\n\nPick the muscle that holds you back most, say your hamstrings, and **bank 10 minutes a week**: two minutes on five days, or five minutes on two. One caveat: the people studied averaged 27 years old."},"image":{"path":"stretching-ten-minutes-week/idea.1.be1d6f59.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Ingram et al., 2024 · Sports Medicine · 189 estudos, 6.654 adultos","en":"Ingram et al., 2024 · Sports Medicine · 189 studies, 6,654 adults"},"url":"https://pubmed.ncbi.nlm.nih.gov/39614059/"},{"label":{"pt":"Ingram, Tomkinson & Bennett, 2024 · The Conversation · resumo dos autores","en":"Ingram, Tomkinson & Bennett, 2024 · The Conversation · authors' summary"},"url":"https://theconversation.com/new-research-shows-how-long-hard-and-often-you-need-to-stretch-to-improve-your-flexibility-242488"}],"cta":null},{"id":"tolerancia-ao-alongamento","ordinal":2,"title":{"pt":"O alongamento deixa o músculo mais comprido?","en":"Does stretching make your muscles longer?"},"claim":{"pt":"Alongar não deixa o músculo mais comprido. O ganho vem do seu sistema nervoso aceitando mais tensão.","en":"Stretching doesn't make the muscle longer. The gain comes from your nervous system accepting more tension."},"body":{"pt":"Depois de semanas alongando, você chega mais longe, e a impressão é que o músculo cresceu em comprimento. A equipe australiana de Lewis Ingram foi conferir o que muda por dentro, reunindo os estudos que mediram o corpo antes e depois (Ingram et al., Sports Medicine, 2025). O comprimento dos fascículos, os feixes de fibras que formam o músculo, não mudou. A rigidez do tecido caiu só logo depois da sessão, sem durar.\n\nO que subiu de verdade foi a **tolerância ao alongamento**: a tensão máxima que você aguenta antes de pedir pra parar. Esse efeito foi quase o dobro do efeito sobre a rigidez. Seu sistema nervoso aprende que a posição é segura e para de soar o alarme tão cedo. É como entrar no mar gelado: a água não esquentou, você é que se acostumou.\n\nNa prática, **não precisa forçar até doer**. Alongue até sentir tensão e fique ali com calma. E lembre que essas medidas são de amplitude passiva, não de agilidade no dia a dia.","en":"After a few weeks of stretching you reach further, and it feels as if the muscle got longer. Lewis Ingram's Australian team went looking at what actually changes inside, pooling the studies that measured the body before and after (Ingram et al., Sports Medicine, 2025). Fascicle length, the bundles of fibers a muscle is built from, didn't change. Tissue stiffness dropped only right after a session and didn't last.\n\nWhat really rose was **stretch tolerance**: the most tension you can take before you want to stop. That effect was nearly double the one on stiffness. Your nervous system learns the position is safe and stops sounding the alarm so early. Think of wading into a cold sea: the water didn't warm up, you got used to it.\n\nIn practice, **you don't need to push into pain**. Stretch until you feel tension and stay there calmly. And keep in mind these are measures of passive range, not of how nimbly you move day to day."},"image":{"path":"stretching-ten-minutes-week/idea.2.1c28284d.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Ingram et al., 2025 · Sports Medicine · mecanismos do ganho de amplitude","en":"Ingram et al., 2025 · Sports Medicine · mechanisms of range-of-motion gains"},"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC12152101/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'stretching-ten-minutes-week';

-- stretching-ten-minutes-week: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'stretching-ten-minutes-week'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
