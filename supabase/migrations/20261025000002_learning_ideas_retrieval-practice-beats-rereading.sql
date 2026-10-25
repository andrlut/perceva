-- migration: 20261025000002_learning_ideas_retrieval-practice-beats-rereading.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          retrieval-practice-beats-rereading · 1 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-10-25 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     retrieval-practice-beats-rereading/idea.1.57262ed6.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     retrieval-practice-beats-rereading/cover.91aa3f24.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['retrieval-practice-beats-rereading']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- retrieval-practice-beats-rereading: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/retrieval-practice-beats-rereading/cover.91aa3f24.webp',
    updated_at = now()
where slug = 'retrieval-practice-beats-rereading';

-- retrieval-practice-beats-rereading · 1 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"lembrar-vence-reler","ordinal":1,"title":{"pt":"Tentar lembrar fixa mais do que reler o texto","en":"Trying to recall beats rereading a text"},"claim":{"pt":"Leia uma vez, feche o texto e escreva o que lembra. Isso fixa mais do que reler, mesmo parecendo pior.","en":"Read once, close the text and write down what you remember. It sticks better than rereading, even if it feels worse."},"body":{"pt":"Num experimento de Roediger e Karpicke (Psychological Science, 2006), 180 universitários estudaram o mesmo texto curto. Um grupo leu quatro vezes. Outro leu uma vez e passou o resto do tempo escrevendo o que lembrava, sem olhar e sem correção. Cinco minutos depois, a releitura ganhava. Uma semana depois, o jogo virou: **quem se testou lembrava 61% do texto, e quem releu, 40%**. Os que releram ainda eram os mais confiantes de que iam lembrar.\n\nReler deixa o texto familiar, e familiaridade se parece muito com saber. Buscar a informação na cabeça, em vez de na página, dá mais trabalho. Isso se chama prática de recuperação, e é esse esforço que fixa.\n\nNa prática: leia uma vez, feche e escreva ou fale o que lembra. **Só depois confira o que faltou.** Uma meta-análise, estudo que junta os resultados de várias pesquisas (Rowland, 2014), mostra que lembrar de cabeça vale mais do que reconhecer a resposta numa lista, e que a correção depois pesa no ganho.","en":"In an experiment by Roediger and Karpicke (Psychological Science, 2006), 180 college students studied the same short passage. One group read it four times. Another read it once and spent the rest of the time writing down what they recalled, without looking and without feedback. Five minutes later, rereading was ahead. A week later it flipped: **the self-testers remembered 61% of the passage, the rereaders 40%**. The rereaders were also the most sure they would remember.\n\nRereading makes a text familiar, and familiarity feels a lot like knowing. Pulling the information out of your head, instead of off the page, takes more work. That is called retrieval practice, and the effort is what makes it stick.\n\nIn practice: read once, close it, then write or say what you remember. **Only then check what you missed.** A meta-analysis, a study that pools the results of many others (Rowland, 2014), found that recalling beats recognizing the answer in a list, and that correcting yourself afterward shapes the gain."},"image":{"path":"retrieval-practice-beats-rereading/idea.1.57262ed6.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Roediger & Karpicke, 2006 · Psychological Science · artigo completo","en":"Roediger & Karpicke, 2006 · Psychological Science · full paper"},"url":"https://psychology.ecu.edu/wp-content/pv-uploads/sites/216/2019/03/Roediger-Karpicke-2006.pdf"},{"label":{"pt":"Rowland, 2014 · meta-análise do efeito do teste","en":"Rowland, 2014 · meta-analysis of the testing effect"},"url":"https://doi.org/10.1037/a0037559"},{"label":{"pt":"Dunlosky et al., 2013 · dez técnicas de estudo avaliadas","en":"Dunlosky et al., 2013 · ten study techniques rated"},"url":"https://doi.org/10.1177/1529100612453266"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'retrieval-practice-beats-rereading';

-- retrieval-practice-beats-rereading: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'retrieval-practice-beats-rereading'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
