-- migration: 20261101000002_learning_ideas_buying-time-chores.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          buying-time-chores · 1 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-11-01 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     buying-time-chores/idea.1.cad77d57.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     buying-time-chores/cover.26062bc3.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['buying-time-chores']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- buying-time-chores: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/buying-time-chores/cover.26062bc3.webp',
    updated_at = now()
where slug = 'buying-time-chores';

-- buying-time-chores · 1 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"comprar-tempo","ordinal":1,"title":{"pt":"Vale pagar pra se livrar de uma tarefa chata?","en":"Should you pay to skip the chores you hate?"},"claim":{"pt":"Pague pra tirar da semana a tarefa que você mais detesta: alivia a pressa mais do que comprar um objeto.","en":"Pay someone to take the chore you hate most off your week. It eases the rush more than buying a thing."},"body":{"pt":"O que está em jogo é a pressão do tempo, aquela sensação de que o dia não cabe nas horas. Em pesquisas com 6.271 pessoas nos Estados Unidos, no Canadá, na Dinamarca e na Holanda, quem gastava dinheiro pra se livrar de tarefas que não gostava de fazer relatava mais satisfação com a vida (Whillans e colegas, PNAS, 2017). Entre esses compradores de tempo, a pressa quase não pesava no bem-estar. Mesmo assim, só 28% das pessoas faziam isso. Num experimento com 60 adultos que trabalhavam em Vancouver, gastar 40 dólares num fim de semana em algo que poupava tempo deixou as pessoas menos apressadas e de melhor humor do que **gastar o mesmo valor num objeto**. O efeito é pequeno, quase tudo é correlação (os dados andam juntos, sem provar causa) e o experimento mediu só o humor do dia seguinte. A renda não mudou o padrão, mas pouca gente de renda muito baixa entrou na conta. Escolha **a tarefa que você mais detesta**, como a faxina, e teste terceirizá-la uma vez.","en":"The thing being bought is relief from time pressure, that feeling your day has more to do than hours to do it in. Across surveys of 6,271 people in the US, Canada, Denmark and the Netherlands, those who spent money to offload tasks they disliked reported higher life satisfaction (Whillans and colleagues, PNAS, 2017). For these time buyers, feeling rushed barely dented their well-being. Yet only 28% of people did it. In an experiment with 60 working adults in Vancouver, spending $40 on a time-saving purchase one weekend left them less rushed and in a better mood than **spending the same $40 on a thing**. The effect is small, most of the evidence is correlational (the two move together, with no proof one causes the other) and the experiment only tracked next-day mood. Income didn't change the pattern, but few people on very low incomes were in the data. Pick **the chore you dread most**, say the cleaning, and try outsourcing it once."},"image":{"path":"buying-time-chores/idea.1.cad77d57.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Whillans et al., 2017 · PNAS · comprar tempo e satisfação","en":"Whillans et al., 2017 · PNAS · buying time and life satisfaction"},"url":"https://doi.org/10.1073/pnas.1706541114"},{"label":{"pt":"Artigo completo (PMC)","en":"Full paper (PMC)"},"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC5559044/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'buying-time-chores';

-- buying-time-chores: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'buying-time-chores'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
