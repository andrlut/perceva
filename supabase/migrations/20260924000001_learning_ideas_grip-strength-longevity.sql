-- migration: 20260924000001_learning_ideas_grip-strength-longevity.sql
-- purpose: publica as ideias (Recanto em ideias) de 1 material(is) do Learning:
--          grip-strength-longevity · 2 ideia(s)
--
-- affected tables: learning_material (ideas), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-24 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     grip-strength-longevity/idea.1.75a2635b.webp  (960x1200, gemini-api)
--     grip-strength-longevity/idea.3.b1b8c5dd.webp  (960x1200, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['grip-strength-longevity']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- grip-strength-longevity · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"aperto-bate-a-pressao","ordinal":1,"title":{"pt":"O aperto de mão prevê morte melhor que a pressão","en":"Your handshake predicts death better than a cuff"},"claim":{"pt":"Aperte um dinamômetro com toda a força: abaixo de 27 quilos em homens e 16 em mulheres é sinal de alerta.","en":"Squeeze a dynamometer as hard as you can: under 27 kg for men or 16 kg for women is a red flag."},"body":{"pt":"O dinamômetro de mão é um cabo de metal que você aperta com toda a força enquanto o ponteiro marca os quilos. Três apertos por mão, anota o melhor, um minuto. Entre 2003 e 2009 o estudo PURE fez isso com 142.861 adultos de 35 a 70 anos, em 17 países ricos, médios e pobres, e acompanhou quatro anos. Cada 5 quilos a menos de aperto vieram com **16% mais risco de morrer por qualquer causa** (Leong et al., The Lancet, 2015), mais do que a pressão sistólica previa.\n\nA frase perdeu o contorno no caminho. Os autores compararam o aperto com a pressão sistólica sozinha, não com um cálculo completo de risco: pressão, colesterol, idade, cigarro e diabetes. E a coorte ia de 35 a 70 anos, então fora dessa faixa você extrapola. Para ler o seu número, o corte europeu de rastreio (EWGSOP2, 2019) fica em 27 quilos para homens e 16 para mulheres. É **régua, não diagnóstico**: ele saiu de uma população britânica, e a mediana sul-americana aos 35-40 anos é 45 quilos e 29.","en":"A hand dynamometer is a metal grip you squeeze as hard as you can while a needle records the kilos. Three squeezes per hand, keep the best, one minute. Between 2003 and 2009 the PURE study ran that drill on 142,861 adults aged 35 to 70, across 17 rich, middle-income and poor countries, then counted deaths for four years. Every 5 kg of missing grip came with a **16% higher risk of dying from any cause** (Leong et al., The Lancet, 2015), more than systolic pressure predicted.\n\nThe headline lost its edges on the way out. The authors matched grip against systolic pressure alone, not against a full risk calculation holding cholesterol, age, smoking and diabetes. The cohort ran 35 to 70, so outside that band you are extrapolating. To read your own number, the European screening cutoff (EWGSOP2, 2019) sits at 27 kg for men and 16 kg for women. It is **a ruler, not a diagnosis**: it came out of a British population, and the South American median at 35 to 40 is 45 kg and 29 kg."},"image":{"path":"grip-strength-longevity/idea.1.75a2635b.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Leong et al., 2015 · The Lancet 386(9990):266–273 · n=139.691, 17 países","en":"Leong et al., 2015 · The Lancet 386(9990):266–273 · n=139,691, 17 countries"},"url":"https://pubmed.ncbi.nlm.nih.gov/25982160/"}],"cta":null},{"id":"dose-minima-de-forca","ordinal":2,"title":{"pt":"Treinar a mão não melhora o que o aperto mede","en":"Training your hand won't move what grip measures"},"claim":{"pt":"Troque o aparelhinho de apertar por 30 a 60 minutos de musculação por semana, em dois dias.","en":"Swap the hand gripper for 30 to 60 minutes of lifting a week, split over two days."},"body":{"pt":"Na ordem dos números do PURE, o aperto pesa mais sobre morrer de qualquer coisa (16% a cada 5 quilos) do que sobre infartar (7%) (Leong et al., The Lancet, 2015). Se fosse a mão, seria o contrário. Doenças que atacam só o músculo são raras, então o que caiu foi o corpo inteiro: massa muscular, condução dos nervos, alimentação. Por isso **nenhum ensaio clínico mostrou que subir o aperto sozinho faça alguém viver mais**. O aperta-mão de borracha empurra o ponteiro sem tocar no que ele media.\n\nTreine o sistema inteiro. Uma revisão de 16 estudos ligou o treino de força a 10 a 20% menos risco de morte, com o fundo da curva entre meia hora e uma hora por semana (Momma et al., BJSM, 2022). E o piso é baixo: uma série de 6 a 12 repetições, a 70-85% do seu máximo, levada perto da falha, duas ou três vezes por semana já dá ganho em quem nunca treinou (Androulakis-Korakakis et al., 2020). **Escolha de 4 a 6 exercícios compostos e anote carga e repetições.**","en":"In PURE's numbers, grip weighs more on dying of anything (16% per 5 kg) than on having a heart attack (7%) (Leong et al., The Lancet, 2015). If the hand were the problem, it would run the other way. Diseases that hit muscle and nothing else are rare, so what fell was the whole body: muscle mass, nerve conduction, nutrition. That is why **no trial has shown that raising grip on its own makes anyone live longer**. A rubber gripper moves the needle without touching what it was reading.\n\nTrain the whole system. A review pooling 16 studies tied strength training to 10 to 20% lower risk of death, with the bottom of the curve between thirty and sixty minutes a week (Momma et al., BJSM, 2022). And the floor is low: one set of 6 to 12 reps, at 70-85% of your max, taken close to failure, two or three times a week already builds strength in beginners (Androulakis-Korakakis et al., 2020). **Pick 4 to 6 compound lifts and log the load and the reps.**"},"image":{"path":"grip-strength-longevity/idea.3.b1b8c5dd.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Leong et al., 2015 · The Lancet 386(9990):266–273 · fonte primária do artigo","en":"Leong et al., 2015 · The Lancet 386(9990):266–273 · the article's primary source"},"url":"https://pubmed.ncbi.nlm.nih.gov/25982160/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'grip-strength-longevity';

-- grip-strength-longevity: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'grip-strength-longevity'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
