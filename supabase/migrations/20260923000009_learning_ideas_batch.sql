-- migration: 20260923000009_learning_ideas_batch.sql
-- purpose: publica as ideias (Recanto em ideias) de 5 material(is) do Learning:
--          grip-strength-longevity · 2 ideia(s)
--          ten-second-balance-test · 2 ideia(s)
--          news-oral-glp1-2026-05 · 1 ideia(s)
--          weak-ties-job-search · 2 ideia(s)
--          news-pink-noise-sleep-2026-09 · 1 ideia(s)
--
-- affected tables: learning_material (ideas), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-23 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     grip-strength-longevity/idea.1.75a2635b.webp  (960x1200, gemini-api)
--     grip-strength-longevity/idea.3.445fc7b9.webp  (960x1200, gemini-api)
--     ten-second-balance-test/idea.1.1351e05a.webp  (960x1200, gemini-api)
--     ten-second-balance-test/idea.3.56906c3c.webp  (960x1200, gemini-api)
--     news-oral-glp1-2026-05/idea.1.5889589a.webp  (960x1200, gemini-api)
--     weak-ties-job-search/idea.2.0227c326.webp  (960x1200, gemini-api)
--     weak-ties-job-search/idea.3.fd5452fa.webp  (960x1200, gemini-api)
--     news-pink-noise-sleep-2026-09/idea.1.b15a440f.webp  (960x1200, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['grip-strength-longevity', 'ten-second-balance-test', 'news-oral-glp1-2026-05', 'weak-ties-job-search', 'news-pink-noise-sleep-2026-09']) as s
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
  from jsonb_array_elements($ideas$[{"id":"aperto-bate-a-pressao","ordinal":1,"title":{"pt":"O aperto de mão prevê morte melhor que a pressão","en":"Your handshake predicts death better than a cuff"},"claim":{"pt":"Aperte um dinamômetro com toda a força: abaixo de 27 quilos em homens e 16 em mulheres é sinal de alerta.","en":"Squeeze a dynamometer as hard as you can: under 27 kg for men or 16 kg for women is a red flag."},"body":{"pt":"O dinamômetro de mão é um cabo de metal que você aperta com toda a força enquanto o ponteiro marca os quilos. Três apertos por mão, anota o melhor, um minuto. Entre 2003 e 2009 o estudo PURE fez isso com 142.861 adultos de 35 a 70 anos, em 17 países ricos, médios e pobres, e acompanhou quatro anos. Cada 5 quilos a menos de aperto vieram com **16% mais risco de morrer por qualquer causa** (Leong et al., The Lancet, 2015), mais do que a pressão sistólica previa.\n\nA frase perdeu o contorno no caminho. Os autores compararam o aperto com a pressão sistólica sozinha, não com um cálculo completo de risco: pressão, colesterol, idade, cigarro e diabetes. E a coorte ia de 35 a 70 anos, então fora dessa faixa você extrapola. Para ler o seu número, o corte europeu de rastreio (EWGSOP2, 2019) fica em 27 quilos para homens e 16 para mulheres. É **régua, não diagnóstico**: ele saiu de uma população britânica, e a mediana sul-americana aos 35-40 anos é 45 quilos e 29.","en":"A hand dynamometer is a metal grip you squeeze as hard as you can while a needle records the kilos. Three squeezes per hand, keep the best, one minute. Between 2003 and 2009 the PURE study ran that drill on 142,861 adults aged 35 to 70, across 17 rich, middle-income and poor countries, then counted deaths for four years. Every 5 kg of missing grip came with a **16% higher risk of dying from any cause** (Leong et al., The Lancet, 2015), more than systolic pressure predicted.\n\nThe headline lost its edges on the way out. The authors matched grip against systolic pressure alone, not against a full risk calculation holding cholesterol, age, smoking and diabetes. The cohort ran 35 to 70, so outside that band you are extrapolating. To read your own number, the European screening cutoff (EWGSOP2, 2019) sits at 27 kg for men and 16 kg for women. It is **a ruler, not a diagnosis**: it came out of a British population, and the South American median at 35 to 40 is 45 kg and 29 kg."},"image":{"path":"grip-strength-longevity/idea.1.75a2635b.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Leong et al., 2015 · The Lancet 386(9990):266–273 · n=139.691, 17 países","en":"Leong et al., 2015 · The Lancet 386(9990):266–273 · n=139,691, 17 countries"},"url":"https://pubmed.ncbi.nlm.nih.gov/25982160/"}],"cta":null},{"id":"dose-minima-de-forca","ordinal":2,"title":{"pt":"Seu aperto de mão não se resolve na mão","en":"Your handshake is not fixed at the hand"},"claim":{"pt":"Faça de 30 a 60 minutos de musculação por semana, divididos em dois dias.","en":"Do 30 to 60 minutes of strength training a week, split across two days."},"body":{"pt":"Na ordem dos números do PURE, o aperto pesa mais sobre morrer de qualquer coisa (16% a cada 5 quilos) do que sobre infartar (7%) (Leong et al., The Lancet, 2015). Se fosse a mão, seria o contrário. Doenças que atacam só o músculo são raras, então o que caiu foi o corpo inteiro: massa muscular, condução dos nervos, alimentação. Por isso **nenhum ensaio clínico mostrou que subir o aperto sozinho faça alguém viver mais**. O aperta-mão de borracha empurra o ponteiro sem tocar no que ele media.\n\nTreine o sistema inteiro. Uma revisão de 16 estudos ligou o treino de força a 10 a 20% menos risco de morte, com o fundo da curva entre meia hora e uma hora por semana (Momma et al., BJSM, 2022). E o piso é baixo: uma série de 6 a 12 repetições, a 70-85% do seu máximo, levada perto da falha, duas ou três vezes por semana já dá ganho em quem nunca treinou (Androulakis-Korakakis et al., 2020). **Escolha de 4 a 6 exercícios compostos e anote carga e repetições.**","en":"In PURE's numbers, grip weighs more on dying of anything (16% per 5 kg) than on having a heart attack (7%) (Leong et al., The Lancet, 2015). If the hand were the problem, it would run the other way. Diseases that hit muscle and nothing else are rare, so what fell was the whole body: muscle mass, nerve conduction, nutrition. That is why **no trial has shown that raising grip on its own makes anyone live longer**. A rubber gripper moves the needle without touching what it was reading.\n\nTrain the whole system. A review pooling 16 studies tied strength training to 10 to 20% lower risk of death, with the bottom of the curve between thirty and sixty minutes a week (Momma et al., BJSM, 2022). And the floor is low: one set of 6 to 12 reps, at 70-85% of your max, taken close to failure, two or three times a week already builds strength in beginners (Androulakis-Korakakis et al., 2020). **Pick 4 to 6 compound lifts and log the load and the reps.**"},"image":{"path":"grip-strength-longevity/idea.3.445fc7b9.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Leong et al., 2015 · The Lancet 386(9990):266–273 · fonte primária do artigo","en":"Leong et al., 2015 · The Lancet 386(9990):266–273 · the article's primary source"},"url":"https://pubmed.ncbi.nlm.nih.gov/25982160/"}],"cta":null}]$ideas$::jsonb) n
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

-- ten-second-balance-test · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"capacidade-que-some","ordinal":1,"title":{"pt":"Musculação não te dá dez segundos num pé só","en":"Lifting won't give you ten seconds on one leg"},"claim":{"pt":"Tire os sapatos e segure dez segundos num pé só, sem apoio. Até três tentativas, passa ou não passa.","en":"Shoes off, hold ten seconds on one leg with nothing to grab. Up to three tries, you pass or you don't."},"body":{"pt":"Tire os sapatos, fique de pé sem apoio e encoste a frente de um pé na panturrilha da outra perna. Braços soltos, olhar num ponto fixo à frente. Conte até dez. Qualquer perna, até três tentativas.\n\nPesquisadores brasileiros acompanharam 1.702 adultos de 51 a 75 anos por sete anos. Entre quem segurou os dez segundos, 4,6% morreram no período; entre quem não segurou, 17,5% (Araújo et al., Br J Sports Med, 2022). **Esse é o teto da literatura, não o consenso**: uma meta-análise de 15 estudos chegou a uma diferença bem menor (Das et al., Research on Aging, 2024). Alarme pra investigar, não prognóstico.\n\nAgachamento e corrida acontecem em trajetória conhecida e chão firme. **Num pé só você sustenta o corpo inteiro sobre uma base do tamanho de um pé**, corrigindo desvios de milímetros o tempo todo. Num estudo da Mayo Clinic com 40 adultos saudáveis (Kaufman et al., 2024), o tempo em pé só foi a capacidade que mais caiu com a idade. Faça o teste hoje: ele é o seu ponto zero.","en":"Shoes off. Stand with nothing to hold and rest the front of one foot against the calf of your other leg. Arms loose, eyes on a fixed point ahead. Count to ten. Either leg, up to three tries.\n\nBrazilian researchers followed 1,702 adults aged 51 to 75 for seven years. Among those who held the ten seconds, 4.6% died in that window; among those who didn't, 17.5% (Araújo et al., Br J Sports Med, 2022). **That is the ceiling of the literature, not its consensus**: a meta-analysis of 15 studies landed on a far smaller gap (Das et al., Research on Aging, 2024). Treat a miss as an alarm worth investigating, not a forecast.\n\nSquats and runs happen on a known path, on solid ground. **On one leg you hold your whole body over a base the size of a foot**, correcting millimeter drifts nonstop. In a small Mayo Clinic study of 40 healthy adults (Kaufman et al., 2024), one-leg stance time fell faster with age than anything else they measured. Test yourself today: it is your zero point."},"image":{"path":"ten-second-balance-test/idea.1.1351e05a.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Araújo et al., 2022 · Br J Sports Med 56(17):975–980 · n=1.702, seguimento mediano de 7 anos","en":"Araújo et al., 2022 · Br J Sports Med 56(17):975–980 · n=1,702, median 7-year follow-up"},"url":"https://bjsm.bmj.com/content/56/17/975"}],"cta":null},{"id":"diferenca-entre-as-pernas","ordinal":2,"title":{"pt":"Segurar dez segundos não é treino de equilíbrio","en":"Holding ten seconds isn't balance training"},"claim":{"pt":"Treine tirando um sentido por vez: feche os olhos, suba num travesseiro dobrado, gire a cabeça devagar.","en":"Train by removing one sense at a time: close your eyes, stand on a folded pillow, turn your head slowly."},"body":{"pt":"Doze segundos de um lado e quatro do outro não viram oito na média. Anote os dois números e a data: o lado pior é o que vai encontrar a escada escura primeiro.\n\nFicar num pé só parece passivo, mas é um cálculo contínuo. O corpo funde três fontes de informação: o ouvido interno detecta onde a cabeça está, a visão dá o ambiente como referência e a propriocepção — o sentido que informa onde estão suas articulações sem você olhar — reporta o resto de você. Com dois pés no chão sobra folga, porque uma fonte pode piorar e as outras cobrem. Tirar um pé apaga a folga.\n\nPor isso **treinar é tirar uma fonte por vez**, não repetir a posição do teste. Olhos fechados apagam a visão, um travesseiro dobrado embaralha a propriocepção, girar a cabeça devagar cobra o ouvido interno. **A perna pior faz uma rodada a mais.** Uma revisão Cochrane com 81 ensaios e 19.684 participantes registra 23% menos quedas com exercício — quedas, não mortes.","en":"Twelve seconds on one side and four on the other don't average out to eight. Write down both numbers and the date: the worse side is the one that meets the dark staircase first.\n\nStanding on one leg looks passive, but it's a running calculation. Your body fuses three streams of information: the inner ear senses where your head is, vision hands you the room as a reference, and proprioception — the sense that tells you where your joints sit without you looking — reports the rest of you. With two feet down you have slack, because one stream can degrade while the others cover. Lifting a foot deletes the slack.\n\nSo **training means removing one stream at a time**, not repeating the test position. Closed eyes delete vision, a folded pillow scrambles proprioception, slow head turns call on the inner ear. **The worse leg does one extra round.** A Cochrane review of 81 trials and 19,684 participants records 23% fewer falls with exercise — falls, not deaths."},"image":{"path":"ten-second-balance-test/idea.3.56906c3c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Araújo et al., 2022 · Br J Sports Med 56(17):975–980 · n=1.702, seguimento mediano de 7 anos","en":"Araújo et al., 2022 · Br J Sports Med 56(17):975–980 · n=1,702, median 7-year follow-up"},"url":"https://bjsm.bmj.com/content/56/17/975"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'ten-second-balance-test';

-- news-oral-glp1-2026-05 · 1 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"rampa-de-saida-da-agulha","ordinal":1,"title":{"pt":"Trocar a injeção de emagrecer por uma pílula","en":"Swapping the weight-loss shot for a pill"},"claim":{"pt":"Não espere emagrecer mais: a pílula de GLP-1 serve pra manter o peso que a injeção já fez cair.","en":"Don't expect more weight loss: the GLP-1 pill is meant to hold what the shot already took off."},"body":{"pt":"Ozempic, Wegovy e Mounjaro imitam o GLP-1 — o hormônio que o intestino solta depois de comer pra avisar o cérebro que você já comeu. Parar a injeção tira esse freio do apetite, e o peso costuma voltar em poucos meses.\n\nNo ensaio ATTAIN-MAINTAIN (Aronne et al., Nature Medicine, 2026), 376 adultos que já tinham emagrecido com semaglutida ou tirzepatida largaram a injeção e passaram a tomar um comprimido diário de orforglipron ou um placebo. Um ano depois, a pílula preservou 75% e 79% do peso perdido, contra 49% e 38% no placebo.\n\nDuas ressalvas antes de animar. Do zero, sem injeção antes, o orforglipron emagrece cerca de 12% em 72 semanas (ensaio ATTAIN-1), menos que as duas injeções: **ele segura um platô, não leva você até ele**. E quem bancou o estudo foi a Eli Lilly, fabricante do comprimido, que na publicação ainda não tinha aprovação da FDA. **Sair da injeção é conversa com médico** — força, proteína e sono seguem movendo o ponteiro.","en":"Ozempic, Wegovy and Mounjaro copy GLP-1 — the hormone your gut releases after a meal to tell your brain you have eaten. Stop the weekly shot and that brake on appetite comes off, so the weight tends to creep back within months.\n\nIn the ATTAIN-MAINTAIN trial (Aronne et al., Nature Medicine, 2026), 376 adults who had already slimmed down on semaglutide or tirzepatide dropped the injection and took either a daily orforglipron pill or a placebo. A year on, the pill preserved 75% and 79% of the lost weight, against 49% and 38% on placebo.\n\nTwo cautions before you get excited. From a standing start, with no shot before it, orforglipron takes off about 12% of body weight in 72 weeks (ATTAIN-1 trial), less than either injection: **it holds a plateau, it does not carry you to one**. And Eli Lilly, which makes the pill, funded the trial; at publication the drug had no FDA approval. **Leaving the shot is a conversation with your doctor** — strength work, protein and sleep still move the needle."},"image":{"path":"news-oral-glp1-2026-05/idea.1.5889589a.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Aronne et al., 2026 · Nature Medicine · ATTAIN-MAINTAIN · fase 3, n=376","en":"Aronne et al., 2026 · Nature Medicine · ATTAIN-MAINTAIN · phase 3, n=376"},"url":"https://www.nature.com/articles/s41591-026-04386-7"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'news-oral-glp1-2026-05';

-- weak-ties-job-search · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"curva-u-invertido","ordinal":1,"title":{"pt":"Quem te indica pra vaga não é o amigo próximo?","en":"Does your next job come from an acquaintance?"},"claim":{"pt":"Peça ajuda na busca por vaga a quem tem uns 10 conhecidos em comum com você, não ao amigo de sempre.","en":"Ask for job leads from people who share about 10 mutual connections with you, not from your closest friend."},"body":{"pt":"Os cinco amigos de sempre já te contaram tudo que sabem. Eles se conhecem entre si, então a vaga que entra nesse grupo chega em você na mesma tarde. Em 1973, Mark Granovetter definiu força de laço como a soma de tempo, intimidade e favores trocados, e mostrou que o conhecido distante vive em outro grupo, com outras conversas e outras vagas. **A posição do contato pesa mais que a intimidade.** A prova de causa veio do LinkedIn: entre 2015 e 2019 a empresa sorteou ao acaso quantos laços fortes e fracos cada grupo via na lista de sugestões de contato, com 20 milhões de pessoas e 600 mil empregos aceitos no fim (Rajkumar et al., Science, 2022). A chance de emprego desenhou uma curva em U invertido, com pico perto de 10 conhecidos em comum. Dois conhecidos em comum é o seu próprio grupo; cem é um estranho, e estranho não mexe um dedo por você. **Cheque o seu setor antes de agir:** no mesmo estudo, em mercados menos digitais quem ajudou foram os laços fortes.","en":"The same five friends have already told you everything they know. They all know each other, so an opening that lands in that group reaches you the same afternoon. Mark Granovetter defined tie strength in 1973 as the sum of time, intimacy and traded favors, and showed that the distant acquaintance lives in another circle, with other conversations and other openings. **Position beats closeness.** Causal proof came from LinkedIn: between 2015 and 2019 the company randomly varied how many strong and weak ties each group saw in its contact suggestions, across 20 million people and 600,000 accepted jobs (Rajkumar et al., Science, 2022). Job odds traced an inverted U that peaked near 10 mutual connections. Two mutual connections means the person sits inside your own circle; a hundred means you are a stranger, and strangers do not lift a finger for you. **Check your industry first:** in that same study, strong ties were the ones that helped in less digital fields."},"image":{"path":"weak-ties-job-search/idea.2.0227c326.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Rajkumar et al., 2022 · Science 377(6612) · experimentos randomizados no LinkedIn, n=20 milhões","en":"Rajkumar et al., 2022 · Science 377(6612) · randomized experiments inside LinkedIn, n=20 million"},"url":"https://doi.org/10.1126/science.abl4476"},{"label":{"pt":"Granovetter, 1973 · American Journal of Sociology 78(6) · artigo teórico fundador","en":"Granovetter, 1973 · American Journal of Sociology 78(6) · founding theory paper"},"url":"https://www.jstor.org/stable/2776392"}],"cta":null},{"id":"laco-adormecido","ordinal":2,"title":{"pt":"O conhecido que sumiu ainda sabe de vaga","en":"An old acquaintance still hears about jobs"},"claim":{"pt":"Mande uma mensagem por semana a um ex-colega sumido e peça informação sobre o time dele, não vaga.","en":"Message one vanished ex-coworker a week and ask how their team is set up, not for an opening."},"body":{"pt":"Você já tem os contatos de que precisa. Eles só estão parados. Num estudo da Rutgers (Levin, Walter e Murnighan, Organization Science, 2011), executivos de MBA pediram conselho sobre um problema real de trabalho a pessoas com quem não falavam havia anos. **O conselho desses laços adormecidos voltou mais novo e mais útil que o dos contatos ativos**, com a confiança antiga intacta. Amostra pequena e específica: é pista de mecanismo, não lei. A trava costuma ser achar que reaparecer agora parece interesse disfarçado. A alternativa não é a pureza, é o silêncio: o conhecido que você não procurou também não ficou sabendo que você estava disponível. Liste vinte nomes de gente que trabalhou perto de você e sumiu do seu dia a dia há mais de um ano. **Mande uma mensagem por semana, não vinte num domingo.** E peça informação: “como está montado o time de dados de vocês hoje?” é fácil de responder; “tem vaga aí?” encerra a conversa.","en":"You already have the contacts you need. They are just idle. In a Rutgers study (Levin, Walter and Murnighan, Organization Science, 2011), executive MBA students asked people they had not spoken to in years for advice on a live work problem. **That advice came back more novel and more useful than advice from their active contacts**, with the old trust still in place. Small, unusual sample, so treat it as a clue about mechanism rather than a law. What stops most people is the fear of looking self-serving. The alternative to reaching out is not purity, it is silence: the acquaintance you never messaged never learned you were available. Write down twenty people who worked near you and dropped out of your week more than a year ago. **Send one message a week, not twenty on a Sunday.** And ask for information: “how is your data team set up these days?” is easy to answer; “any openings?” ends the conversation."},"image":{"path":"weak-ties-job-search/idea.3.fd5452fa.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Levin, Walter e Murnighan, 2011 · Organization Science 22(4) · reconexão de laços adormecidos","en":"Levin, Walter and Murnighan, 2011 · Organization Science 22(4) · reconnecting dormant ties"},"url":"https://www.jstor.org/stable/20868904"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'weak-ties-job-search';

-- news-pink-noise-sleep-2026-09 · 1 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"som-cronometrado-cerebro","ordinal":1,"title":{"pt":"Um som pode turbinar a limpeza cerebral do sono","en":"A sound can boost the brain's cleanup in sleep"},"claim":{"pt":"Evidência ainda inicial: o som só amplia a faxina do cérebro no pico da onda lenta, e app nenhum acerta esse tempo.","en":"Still early evidence: a sound only boosts the brain's cleanup at a slow wave's peak, and no app hits that timing."},"body":{"pt":"No sono profundo, ondas elétricas lentas varrem o córtex e, logo atrás delas, sobe um pulso de líquido cefalorraquidiano — o fluido que banha o cérebro e ajuda a levar embora resíduos. Um grupo do MIT tentou empurrar essa maré de propósito: catorze voluntários cochilaram dentro de um scanner de ressonância enquanto um algoritmo previa, com menos de 100 milissegundos de atraso, o pico da onda lenta de cada um e disparava ali uma **rajada de ruído rosa de 50 milissegundos**, curta demais pra acordar alguém.\n\nNo trabalho de Levitt e colegas, publicado em 2026 na Science Translational Medicine, a onda elétrica e o pulso de líquido ficaram maiores. Sem porcentagem divulgada, num cochilo só, sem nenhum desfecho de saúde ou memória medido — e os autores já abriram empresa em cima da técnica.\n\n**O timing é tudo**: os próprios pesquisadores dizem que nada indica que ruído contínuo, fora de sincronia, faça o mesmo trabalho. Enquanto não existir produto testado fora do laboratório, seu horário de sono rende mais do que qualquer som no quarto.","en":"In deep sleep, slow electrical waves sweep the cortex, and right behind them rises a pulse of cerebrospinal fluid — the fluid that bathes the brain and helps carry metabolic waste away. An MIT group tried to push that tide on purpose: fourteen volunteers napped inside an MRI scanner while an algorithm predicted, with under 100 milliseconds of lag, each slow wave's peak and fired a **50-millisecond burst of pink noise** right at it, too short to wake anyone.\n\nIn the work by Levitt and colleagues, published in 2026 in Science Translational Medicine, both the electrical wave and the fluid pulse grew larger. No percentage released, from a single nap, with no health or memory outcome measured — and the authors have already founded a company around the technique.\n\n**Timing is everything**: the researchers themselves say nothing suggests that continuous, out-of-sync noise does the same job. Until a real product is tested outside the lab, your sleep schedule buys you more than any sound in the bedroom."},"image":{"path":"news-pink-noise-sleep-2026-09/idea.1.b15a440f.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"MIT News (9/set/2026)","en":"MIT News (Sept 9, 2026)"},"url":"https://news.mit.edu/2026/pink-noise-burst-may-mean-more-restorative-sleep-0909"},{"label":{"pt":"Levitt et al., 2026 · Science Translational Medicine","en":"Levitt et al., 2026 · Science Translational Medicine"},"url":"https://www.science.org/doi/10.1126/scitranslmed.aea5469"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'news-pink-noise-sleep-2026-09';

-- grip-strength-longevity: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'grip-strength-longevity'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- ten-second-balance-test: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'ten-second-balance-test'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- news-oral-glp1-2026-05: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'news-oral-glp1-2026-05'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- weak-ties-job-search: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'weak-ties-job-search'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- news-pink-noise-sleep-2026-09: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'news-pink-noise-sleep-2026-09'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
