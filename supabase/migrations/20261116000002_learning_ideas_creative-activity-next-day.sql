-- migration: 20261116000002_learning_ideas_creative-activity-next-day.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          creative-activity-next-day · 1 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-11-16 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     creative-activity-next-day/idea.1.3ce5eb0b.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     creative-activity-next-day/cover.4e3dca9c.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['creative-activity-next-day']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- creative-activity-next-day: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/creative-activity-next-day/cover.4e3dca9c.webp',
    updated_at = now()
where slug = 'creative-activity-next-day';

-- creative-activity-next-day · 1 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"criar-hoje-anima-amanha","ordinal":1,"title":{"pt":"Criar algo hoje muda o seu humor amanhã?","en":"Does making something lift tomorrow's mood?"},"claim":{"pt":"Crie algo hoje, nem que seja uma receita nova: o dia seguinte tende a vir com mais energia e entusiasmo.","en":"Make something today, even just a new recipe: the next day tends to bring more energy and enthusiasm."},"body":{"pt":"Na Universidade de Otago, na Nova Zelândia, 658 jovens adultos preencheram um diário online por 13 dias, anotando quanto tempo passaram criando e como se sentiam ([Conner, DeYoung e Silvia, 2018](https://doi.org/10.1080/17439760.2016.1257049)). Criar era coisa comum: receita nova, tricô, rabisco, um poema. Depois de um dia com mais criação do que o normal daquela pessoa, o dia seguinte vinha com **mais energia e entusiasmo** e mais sensação de florescer, que é sentir que a vida tem sentido, propósito e gente por perto. O caminho inverso não apareceu: estar bem num dia não fez ninguém criar mais no outro. A personalidade quase não mudou o ganho, então você não precisa ser do tipo artista. Uma ressalva: o diário mostra o que veio antes, não prova a causa. E a calma não subiu, nem o humor ruim caiu. O que fazer: **supere o seu próprio normal**. Se hoje você não criou nada, uma página escrita ou uma gaveta consertada já conta.","en":"At New Zealand's University of Otago, 658 young adults kept an online diary for 13 days, logging how long they spent creating and how they felt ([Conner, DeYoung & Silvia, 2018](https://doi.org/10.1080/17439760.2016.1257049)). Creating meant ordinary stuff: a new recipe, knitting, sketching, a poem. After a day with more making than that person's usual, the next day brought **more energy and enthusiasm**, plus more flourishing, the sense that your life has meaning, purpose and people in it. It didn't run backwards. Feeling good one day didn't make anyone create more the next. Personality barely changed the payoff, so you don't need to be the arty type. One caveat: a diary shows what came first, not proof of cause. Calm didn't rise, and bad feelings didn't fade. What to do: **beat your own baseline**. If you made nothing today, one written page or a fixed drawer counts."},"image":{"path":"creative-activity-next-day/idea.1.3ce5eb0b.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Conner, DeYoung e Silvia, 2018 · Journal of Positive Psychology","en":"Conner, DeYoung & Silvia, 2018 · Journal of Positive Psychology"},"url":"https://doi.org/10.1080/17439760.2016.1257049"},{"label":{"pt":"Registro do artigo na Universidade de Otago","en":"Paper record at the University of Otago"},"url":"https://ourarchive.otago.ac.nz/esploro/outputs/journalArticle/Everyday-creative-activity-as-a-path/9926515230401891"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'creative-activity-next-day';

-- creative-activity-next-day: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'creative-activity-next-day'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
