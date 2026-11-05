-- migration: 20261028000002_learning_ideas_shared-novelty-couples.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          shared-novelty-couples · 1 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-10-28 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     shared-novelty-couples/idea.1.544716f5.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     shared-novelty-couples/cover.3049c6ab.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['shared-novelty-couples']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- shared-novelty-couples: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/shared-novelty-couples/cover.3049c6ab.webp',
    updated_at = now()
where slug = 'shared-novelty-couples';

-- shared-novelty-couples · 1 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"novidade-a-dois","ordinal":1,"title":{"pt":"Fazer algo novo a dois reacende o casal","en":"Trying new things together rekindles a couple"},"claim":{"pt":"Reserve 90 minutos por semana pra algo novo e um pouco desafiador a dois, em vez do programa de sempre.","en":"Set aside 90 minutes a week for something new and a bit challenging together, instead of your usual outing."},"body":{"pt":"A explicação vem da auto-expansão: a sensação de crescer, de aprender e ver o mundo ficar maior, que você passa a ligar à pessoa ao seu lado. Num ensaio randomizado, em que um sorteio decide quem faz o quê, 53 casais casados dedicaram 1,5 hora por semana, durante 10 semanas, a atividades estimulantes ou só agradáveis (Reissman, Aron e Bergen, 1993). Quem fez coisas estimulantes terminou mais satisfeito. Outro ensaio, com 101 casais (Coulter e Malouff, 2013), usou a mesma dose por 4 semanas e viu mais entusiasmo e satisfação no fim. No laboratório, uma tarefa nova de só 7 minutos já dá um empurrão, mas momentâneo (Aron et al., 2000). O ganho é modesto e as amostras são pequenas: trate isso como aposta, não como cura. Escolha **algo que nenhum dos dois domina**: uma trilha nova, uma aula de dança, uma receita difícil. Reserve **90 minutos nesta semana**. O jantar de sempre continua bom. Ele só não faz esse trabalho.","en":"Psychologists call the mechanism self-expansion: the feeling of growing, learning and watching your world get bigger, which you start to link with the person beside you. In a randomized trial, where a draw rather than the couple decides who does what, 53 married couples spent 1.5 hours a week for 10 weeks on either exciting or merely pleasant activities (Reissman, Aron & Bergen, 1993). The exciting group ended up more satisfied. A second trial with 101 couples (Coulter & Malouff, 2013) used the same dose for 4 weeks and found more excitement and satisfaction at the end. In the lab, a novel 7-minute task alone gives a boost, though only a momentary one (Aron et al., 2000). The gains are modest and the samples small, so treat this as a good bet, not a cure. Pick **something neither of you is good at yet**: a new trail, a dance class, a dish you've never cooked. Block **90 minutes this week**. Your usual dinner is still nice. It just doesn't do this job."},"image":{"path":"shared-novelty-couples/idea.1.544716f5.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Reissman, Aron e Bergen, 1993 · J Soc Pers Relatsh · 53 casais","en":"Reissman, Aron & Bergen, 1993 · J Soc Pers Relatsh · 53 couples"},"url":"https://doi.org/10.1177/026540759301000205"},{"label":{"pt":"Coulter e Malouff, 2013 · ensaio randomizado · 101 casais","en":"Coulter & Malouff, 2013 · randomized trial · 101 couples"},"url":"https://rune.une.edu.au/web/handle/1959.11/14155"},{"label":{"pt":"Aron et al., 2000 · J Pers Soc Psychol","en":"Aron et al., 2000 · J Pers Soc Psychol"},"url":"https://pubmed.ncbi.nlm.nih.gov/10707334/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'shared-novelty-couples';

-- shared-novelty-couples: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'shared-novelty-couples'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
