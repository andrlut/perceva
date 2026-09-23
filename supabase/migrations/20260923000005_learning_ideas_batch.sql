-- migration: 20260923000005_learning_ideas_batch.sql
-- purpose: publica as ideias (Recanto em ideias) de 6 material(is) do Learning:
--          glossary-sleep · 3 ideia(s)
--          glossary-nutrition · 3 ideia(s)
--          glossary-money · 2 ideia(s)
--          glossary-career · 3 ideia(s)
--          glossary-circle · 2 ideia(s)
--          glossary-build · 2 ideia(s)
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
--     glossary-sleep/idea.1.d6747db7.webp  (960x1200, gemini-api)
--     glossary-sleep/idea.2.9a042005.webp  (960x1200, gemini-api)
--     glossary-sleep/idea.4.37e715b8.webp  (960x1200, gemini-api)
--     glossary-nutrition/idea.1.bd16deb3.webp  (960x1200, gemini-api)
--     glossary-nutrition/idea.2.86022d01.webp  (960x1200, gemini-api)
--     glossary-nutrition/idea.3.63204861.webp  (960x1200, gemini-api)
--     glossary-money/idea.1.98892436.webp  (960x1200, gemini-api)
--     glossary-money/idea.3.fff919cb.webp  (960x1200, gemini-api)
--     glossary-career/idea.1.a541108a.webp  (960x1200, gemini-api)
--     glossary-career/idea.2.5d2b8d46.webp  (960x1200, gemini-api)
--     glossary-career/idea.4.1671d90b.webp  (960x1200, gemini-api)
--     glossary-circle/idea.1.56a52155.webp  (960x1200, gemini-api)
--     glossary-circle/idea.3.38fb764d.webp  (960x1200, gemini-api)
--     glossary-build/idea.1.6f2f765a.webp  (960x1200, gemini-api)
--     glossary-build/idea.2.7ce800b1.webp  (960x1200, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['glossary-sleep', 'glossary-nutrition', 'glossary-money', 'glossary-career', 'glossary-circle', 'glossary-build']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- glossary-sleep · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"tres-pecas-do-sono","ordinal":1,"title":{"pt":"Sono não é só o número de horas","en":"Sleep is not just a number of hours"},"claim":{"pt":"Dormir 6,5 horas sempre no mesmo horário tende a ganhar de 8 horas jogadas a esmo.","en":"Sleeping 6.5 hours at the same time every day tends to beat 8 hours scattered around."},"body":{"pt":"A maioria mede sono em horas, e o número engana. Em 2003, Van Dongen restringiu adultos saudáveis a 6 horas por 14 noites: atenção e memória de trabalho caíram tanto quanto as de quem passou uma ou duas noites em claro, enquanto a sensação de sono estabilizava cedo. Eles se achavam adaptados.\n\nSão três peças ao mesmo tempo. Quantidade: de 7 a 9 horas, com o 7 como chão firme, por consenso de um painel de 15 especialistas da Academia Americana de Medicina do Sono, em 2015. Regularidade: deitar e acordar perto do mesmo horário, fim de semana incluído. Qualidade: ciclos de cerca de 90 minutos, de 4 a 6 por noite, passando pelo sono profundo e pelo REM, quando o corpo repara tecido e a memória se consolida.\n\n**A do meio é a mais ignorada.** Em quase 61 mil adultos do UK Biobank com sensor no pulso, os mais regulares morreram de 20% a 48% menos (Windred et al., Sleep, 2024). Se você só tem energia pra mudar uma coisa, mude o horário.","en":"Most people measure sleep in hours, and the number lies. In 2003, Van Dongen held healthy adults to six hours a night for 14 nights: attention and working memory fell as far as in people who had gone one or two nights without sleeping at all, while their sense of sleepiness leveled off early. They believed they had adapted.\n\nSleep is three things at once. Quantity: 7 to 9 hours, with 7 as a firm floor, by the 2015 consensus of a 15-expert panel at the American Academy of Sleep Medicine. Regularity: going to bed and getting up near the same time, weekends included. Quality: cycles of about 90 minutes, 4 to 6 a night, running through deep sleep and REM, when the body repairs tissue and memory settles.\n\n**The middle piece is the one people ignore.** Among nearly 61,000 UK Biobank adults wearing wrist sensors, the most regular sleepers died 20% to 48% less often (Windred et al., Sleep, 2024). If you only have energy for one change, change the clock."},"image":{"path":"glossary-sleep/idea.1.d6747db7.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Windred et al., 2024 · Sleep 47(1):zsad253 · n=60.977 (UK Biobank)","en":"Windred et al., 2024 · Sleep 47(1):zsad253 · n=60,977 (UK Biobank)"},"url":"https://academic.oup.com/sleep/article/47/1/zsad253/7280269"}],"cta":null},{"id":"fome-da-noite-curta","ordinal":2,"title":{"pt":"Dormir pouco te dá fome de pão e doce","en":"Short sleep makes you crave bread and sweets"},"claim":{"pt":"Depois de uma noite curta, decida o que vai comer antes de sentir fome.","en":"After a short night, decide what you will eat before the hunger shows up."},"body":{"pt":"Bastam duas noites de 4 horas pra bagunçar os hormônios que controlam a fome. Num experimento com homens jovens saudáveis, a grelina — o hormônio que abre o apetite — subiu 28%, e a leptina, que avisa o cérebro que você já comeu o bastante, caiu 18%. A vontade específica de comida rica em carboidrato saltou de 33% a 45%.\n\nPor isso a fome do dia seguinte chega estranha: fora de hora, puxando pão e doce, mesmo depois de um prato cheio. **Não é falta de disciplina; é o sinal de saciedade chegando mais fraco que a comida.**\n\nO jeito de não perder essa briga é não travá-la com fome. Logo de manhã, enquanto a cabeça ainda decide bem, resolva o almoço: deixe pronto, compre ou combine com alguém. Escolher no impulso, com grelina alta e leptina baixa, é escolher o pão.","en":"Two nights of four hours are enough to scramble the hormones that run hunger. In an experiment with healthy young men, ghrelin — the hormone that switches appetite on — rose 28%, and leptin, which tells your brain you have eaten enough, dropped 18%. The craving specifically for high-carb food jumped 33 to 45%.\n\nThat is why the next day's hunger feels off: it lands at odd hours, pulling you toward bread and sweets, even after a full plate. **This is not weak discipline; the fullness signal arrives quieter than the food deserves.**\n\nYou win this one by not fighting it hungry. First thing in the morning, while your head still decides well, settle lunch: cook it, buy it, or agree on it with someone. Choosing on impulse, with ghrelin up and leptin down, means choosing the bread."},"image":{"path":"glossary-sleep/idea.2.9a042005.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Windred et al., 2024 · Sleep 47(1):zsad253 · n=60.977 (UK Biobank)","en":"Windred et al., 2024 · Sleep 47(1):zsad253 · n=60,977 (UK Biobank)"},"url":"https://academic.oup.com/sleep/article/47/1/zsad253/7280269"}],"cta":null},{"id":"dirigir-com-sono","ordinal":3,"title":{"pt":"Dirigir sem dormir é dirigir bêbado","en":"Driving on no sleep is driving drunk"},"claim":{"pt":"Não pegue o volante depois de 17 horas acordado.","en":"Don't get behind the wheel after 17 hours awake."},"body":{"pt":"Dawson e Reid mostraram, na Nature em 1997, que 17 horas sem dormir derrubam reflexo e julgamento tanto quanto 0,05% de álcool no sangue. Com 24 horas em claro, a queda chega a 0,10% — acima do limite pra dirigir na maioria dos países. **Em desempenho, dirigir com sono não é parecido com dirigir bêbado: é a mesma coisa.**\n\nA diferença é que ninguém te oferece um bafômetro pro cansaço, e a sensação mente. Van Dongen viu isso em 2003: adultos restritos a 6 horas por 14 noites pararam de se sentir mais sonolentos enquanto a atenção continuava caindo.\n\nEntão use o relógio no lugar da sensação. Some as horas desde que você acordou, sem descontar café nem banho frio. Passou de 17, você não está em condição de pegar o volante: peça carona, chame um carro ou durma antes de dirigir.","en":"Dawson and Reid showed, in Nature in 1997, that 17 hours without sleep cut reflexes and judgment as much as 0.05% blood alcohol does. At 24 hours awake, the drop reaches 0.10% — above the legal driving limit in most countries. **On performance, driving sleepy is not like driving drunk: it is the same thing.**\n\nThe difference is that nobody hands you a breathalyzer for tiredness, and the feeling lies. Van Dongen saw it in 2003: adults held to six hours a night for 14 nights stopped feeling any sleepier while their attention kept sliding.\n\nSo use the clock instead of the feeling. Add up the hours since you woke up, with no credit for coffee or a cold shower. Past 17, you are in no shape to take the wheel: get a ride, call a car, or sleep before you drive."},"image":{"path":"glossary-sleep/idea.4.37e715b8.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Windred et al., 2024 · Sleep 47(1):zsad253 · n=60.977 (UK Biobank)","en":"Windred et al., 2024 · Sleep 47(1):zsad253 · n=60,977 (UK Biobank)"},"url":"https://academic.oup.com/sleep/article/47/1/zsad253/7280269"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-sleep';

-- glossary-nutrition · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"ultraprocessado-come-mais","ordinal":1,"title":{"pt":"Comida ultraprocessada engana o seu apetite","en":"Ultra-processed food fools your appetite"},"claim":{"pt":"Você come 500 calorias a mais por dia quando a comida é ultraprocessada.","en":"You eat 500 more calories a day when the food is ultra-processed."},"body":{"pt":"Em 2019, o pesquisador Kevin Hall internou 20 adultos num centro do NIH e controlou cada garfada por um mês. Duas semanas de ultraprocessado, duas de comida minimamente processada — com as duas dietas igualadas no papel: mesmas calorias oferecidas, mesma proporção de carboidrato, gordura, proteína, açúcar, sódio e fibra. Podiam comer o quanto quisessem. **Comeram 508 calorias a mais por dia na versão ultraprocessada**, sem perceber, e ganharam quase um quilo em duas semanas.\n\nUltraprocessado, na classificação NOVA do pesquisador brasileiro Carlos Monteiro, é comida feita sobretudo de substâncias extraídas de alimentos — óleos, amidos, açúcares, proteínas isoladas — mais aditivos. O mecanismo é mecânico: ela é macia, densa em calorias e some rápido, então você mastiga menos e engole mais antes de o sinal de saciedade chegar.\n\nO estudo é pequeno e curto: prova que você come mais, não que adoece em 20 anos. O teste prático continua servindo — **se a lista de ingredientes tem coisas que você não teria na sua cozinha, coma menos daquilo**.","en":"In 2019, researcher Kevin Hall admitted 20 adults to an NIH ward and controlled every bite for a month. Two weeks on ultra-processed food, two weeks on minimally processed food — both menus matched on paper: same calories offered, same ratio of carbs, fat, protein, sugar, sodium and fiber. They could eat as much as they wanted. **They ate 508 more calories a day on the ultra-processed side**, without noticing, and gained nearly a kilo in two weeks.\n\nUltra-processed, in the NOVA classification created by Brazilian researcher Carlos Monteiro, means food built mostly from substances extracted from foods — oils, starches, sugars, isolated proteins — plus additives. The mechanism is mechanical: it is soft, calorie-dense and gone fast, so you chew less and swallow more before the fullness signal arrives.\n\nThe study is small and short: it proves you eat more, not that you get sick in 20 years. The practical test still holds — **if the ingredient list has things you would never keep in your kitchen, eat less of it**."},"image":{"path":"glossary-nutrition/idea.1.bd16deb3.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Hall et al., 2019 · Cell Metabolism · n=20 (RCT cruzado)","en":"Hall et al., 2019 · Cell Metabolism · n=20 (crossover RCT)"},"url":"https://www.cell.com/cell-metabolism/fulltext/S1550-4131%2819%2930248-7"}],"cta":null},{"id":"guerra-das-dietas","ordinal":2,"title":{"pt":"A guerra das dietas tem um placar incômodo","en":"The diet wars have an awkward scoreboard"},"claim":{"pt":"Escolha a dieta que você consegue manter por um ano, não a mais radical por três semanas.","en":"Pick the diet you can hold for a year, not the most extreme one for three weeks."},"body":{"pt":"Em 2018, o estudo DIETFITS, de Stanford, sorteou 609 pessoas para uma dieta low fat saudável ou low carb saudável e acompanhou todas por um ano (JAMA, 2018). As duas cortaram ultraprocessado e açúcar. Em 12 meses, **a diferença de peso entre os grupos foi estatisticamente zero** — e nem o perfil genético nem a resposta de insulina previram quem se daria melhor em qual dieta.\n\nUma análise de 59 estudos com as dietas de marca, Atkins, Zone e companhia, deu no mesmo (Johnston et al., JAMA, 2014): diferenças pequenas demais pra importar.\n\nCaloria conta, déficit é física. Mas a força do resultado não vem de uma proporção mágica de macronutriente: vem de quanto tempo você sustenta o hábito. Desconfie até da régua de que 3.500 calorias de déficit derretem meio quilo — conforme você emagrece, o corpo fica menor e gasta menos, então o mesmo déficit rende cada vez menos. O platô depois de alguns meses é regra, não fracasso seu. **Escolha a dieta que cabe no seu calendário**, não a mais radical por três semanas.","en":"In 2018, Stanford's DIETFITS trial randomized 609 people to a healthy low-fat or a healthy low-carb diet and followed them for a year (JAMA, 2018). Both groups cut ultra-processed food and sugar. After 12 months, **the weight difference between the groups was statistically zero** — and neither genetic profile nor insulin response predicted who would do better on which diet.\n\nAn analysis of 59 trials of the brand-name diets, Atkins, Zone and the rest, landed in the same place (Johnston et al., JAMA, 2014): the gaps were too small to matter.\n\nCalories count; a deficit is physics. But the leverage is not a magic macronutrient ratio, it is how long you keep the habit going. Distrust even the rule that a 3,500-calorie deficit melts a pound of fat — as you slim down, your body gets smaller and burns less, so the same deficit buys less and less. The plateau after a few months is the rule, not your personal failure. **Pick the diet that fits your calendar**, not the most extreme one for three weeks."},"image":{"path":"glossary-nutrition/idea.2.86022d01.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Hall et al., 2019 · Cell Metabolism · n=20 (RCT cruzado)","en":"Hall et al., 2019 · Cell Metabolism · n=20 (crossover RCT)"},"url":"https://www.cell.com/cell-metabolism/fulltext/S1550-4131%2819%2930248-7"}],"cta":null},{"id":"tres-numeros-da-comida","ordinal":3,"title":{"pt":"Quase ninguém come fibra o bastante","en":"Almost nobody eats enough fiber"},"claim":{"pt":"Mire 25 a 30 gramas de fibra por dia: feijão, aveia, verdura e fruta com casca.","en":"Aim for 25 to 30 grams of fiber a day: beans, oats, vegetables and fruit with the skin."},"body":{"pt":"Fibra é a parte das plantas que o seu corpo não digere — a casca do feijão, o farelo do grão, o fio do talo. Ela alimenta suas bactérias intestinais, alenta a digestão e te deixa cheio com menos caloria. Uma revisão de 185 estudos publicada na The Lancet ligou comer mais fibra a um risco 15% a 30% menor de morrer, com o benefício ainda subindo na faixa de **25 a 30 gramas por dia**. A parte constrangedora: menos de 1 em cada 10 adultos chega perto disso.\n\nO benefício vem sobretudo de dados populacionais, então trate o alvo como uma aposta muito bem apoiada, não como lei da física. A vantagem dele é não pedir dieta nenhuma nem contagem de caloria: **feijão, aveia, frutas com casca, verduras e grãos integrais** fazem o trabalho sozinhos. Escolha dois deles pra entrar no prato de hoje e a sua conta já começa a mudar.","en":"Fiber is the part of a plant your body cannot break down — the skin on a bean, the bran on a grain, the string in a stalk. It feeds your gut bacteria, slows digestion and fills you up on fewer calories. A review of 185 studies in The Lancet linked eating more fiber to a 15% to 30% lower risk of dying, with the benefit still climbing around **25 to 30 grams a day**. The embarrassing part: fewer than 1 in 10 adults gets close to that.\n\nMost of that evidence is population data, so treat the target as a very well-supported bet, not a law of physics. Its advantage is asking for no diet and no calorie counting: **beans, oats, fruit eaten with the skin, vegetables and whole grains** do the work on their own. Pick two of them for today's plate and your own count starts moving."},"image":{"path":"glossary-nutrition/idea.3.63204861.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Hall et al., 2019 · Cell Metabolism · n=20 (RCT cruzado)","en":"Hall et al., 2019 · Cell Metabolism · n=20 (crossover RCT)"},"url":"https://www.cell.com/cell-metabolism/fulltext/S1550-4131%2819%2930248-7"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-nutrition';

-- glossary-money · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"compre-o-palheiro","ordinal":1,"title":{"pt":"O fundo 'burro' ganha do gestor bem pago.","en":"The 'dumb' fund beats the well-paid manager."},"claim":{"pt":"Compre o mercado inteiro num fundo de índice barato em vez de apostar na ação certa.","en":"Buy the whole market through a cheap index fund instead of betting on the right stock."},"body":{"pt":"Um fundo de índice compra todas as empresas de um mercado de uma vez, na proporção do tamanho de cada uma. O clássico segue o S&P 500: numa aplicação só, você vira dono de um pedacinho das 500 maiores empresas dos EUA. Do outro lado está o fundo ativo, com um gestor bem pago escolhendo ações pra você.\n\nO placar SPIVA, da S&P, diz quem ganha: em janelas de 20 anos, cerca de 92% dos fundos ativos americanos ficam atrás do índice. **Não é azar, é aritmética.** Em 1991, o Nobel William Sharpe mostrou que o mercado é a soma de todos os investidores: o dólar médio rende o retorno do mercado. Pra um gestor ganhar acima da média, outro precisa perder o mesmo tanto.\n\nSome a taxa e o placar fica pior. Nos EUA, o fundo ativo médio de ações cobrou 0,64% em 2024; o de índice, 0,05%. **A taxa é o único número do futuro que você conhece hoje** — veja agora quanto o seu fundo cobra.","en":"An index fund buys every company in a market at once, weighted by size. The classic one tracks the S&P 500: one purchase and you own a sliver of the 500 largest U.S. companies. Across from it sits the active fund, where a well-paid manager picks stocks for you.\n\nS&P's SPIVA scorecard keeps the score: over 20-year windows, about 92% of active U.S. funds finish behind the index. **This is not bad luck, it is arithmetic.** In 1991, Nobel laureate William Sharpe showed the market is the sum of every investor, so the average invested dollar earns exactly the market's return. One manager can only beat the average if another loses by the same amount.\n\nThen the fee widens the gap. In the U.S., the average active equity fund charged 0.64% in 2024; the average index fund charged 0.05%. **The fee is the one future number you already know today** — go look up what yours costs."},"image":{"path":"glossary-money/idea.1.98892436.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"S&P Dow Jones Indices · SPIVA U.S. Scorecard · Fim de 2025","en":"S&P Dow Jones Indices · SPIVA U.S. Scorecard · Year-End 2025"},"url":"https://www.spglobal.com/spdji/en/research-insights/spiva/"}],"cta":null},{"id":"vinte-e-cinco-vezes","ordinal":2,"title":{"pt":"O número que te dá independência financeira","en":"There's a number for financial independence."},"claim":{"pt":"Junte 25 vezes o seu gasto anual: é esse o valor que te dá independência financeira.","en":"Save 25 times your annual spending: that is the number that makes you financially independent."},"body":{"pt":"Em 1994, o planejador William Bengen testou décadas de história do mercado americano e achou uma regra: tire 4% da carteira no primeiro ano de aposentadoria, depois ajuste pela inflação, e o dinheiro dura pelo menos 30 anos em todos os períodos que ele testou. O Estudo Trinity confirmou em 1998: uma carteira com 75% em ações e 25% em títulos sacando 4% ao ano sobreviveu em 98% das janelas de 30 anos. (Bengen depois revisou o número pra 4,7%.)\n\nVire a regra do avesso e ela vira meta: 4% é um vinte e cinco avos. **Junte 25 vezes o seu gasto anual e você atingiu independência financeira.** Gasta R$ 60 mil por ano? São R$ 1,5 milhão investidos.\n\nQuem te leva até lá não é a ação que você escolheu, é quanto da renda você guarda. **Poupar 10% leva umas cinco décadas; 25% cai pra uns 32 anos; 50% chega em 17.** É aritmética pura, com retorno constante: bússola, não GPS. Multiplique hoje o seu gasto anual por 25.","en":"In 1994, planner William Bengen ran decades of U.S. market history and found a rule: take 4% of your portfolio in your first year of retirement, adjust it for inflation after that, and the money lasted at least 30 years in every period he tested. The Trinity Study confirmed it in 1998: a portfolio of 75% stocks and 25% bonds withdrawing 4% a year survived 98% of 30-year windows. (Bengen later revised his own figure up to 4.7%.)\n\nFlip the rule over and it becomes a target: 4% is one twenty-fifth. **Save 25 times what you spend in a year and you are financially independent.** Spend $60,000 a year? Your number is $1.5 million invested.\n\nWhat carries you there is not the stock you picked, it is the share of your income you keep. **Saving 10% takes about five decades; 25% cuts it to roughly 32 years; 50% gets you there in 17.** That is plain arithmetic at a steady return: a compass, not a GPS. Multiply your yearly spending by 25 today."},"image":{"path":"glossary-money/idea.3.fff919cb.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"S&P Dow Jones Indices · SPIVA U.S. Scorecard · Fim de 2025","en":"S&P Dow Jones Indices · SPIVA U.S. Scorecard · Year-End 2025"},"url":"https://www.spglobal.com/spdji/en/research-insights/spiva/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-money';

-- glossary-career · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"tres-lentes","ordinal":1,"title":{"pt":"Mesmo emprego, mesmo salário, três trabalhos.","en":"Same job, same pay, three ways to see a career."},"claim":{"pt":"Quem enxerga o trabalho como um chamado é mais satisfeito com o trabalho e com a vida.","en":"People who see their work as a calling are more satisfied with work and with life."},"body":{"pt":"Em 1997, quatro psicólogos entrevistaram 196 pessoas — de faxineiros a médicos — sobre a relação de cada uma com o próprio trabalho (Wrzesniewski, McCauley, Rozin e Schwartz, Journal of Research in Personality). As respostas se dividiram limpo em três. Um terço via o trabalho como emprego: um jeito de pagar as contas, e nada além disso. Um terço via como carreira: um caminho de subida, o próximo nível, o próximo cargo. Um terço via como chamado: algo que faria de qualquer forma, porque dá sentido à vida.\n\n**A divisão quase não dependia da profissão.** Num grupo de 24 secretárias com o mesmo cargo, o mesmo salário e a mesma sala, as três lentes apareceram em partes quase iguais. Entre duas pessoas no mesmo posto, ganhando igual, quem vê o trabalho como chamado relata mais satisfação com o trabalho e com a vida.\n\nO estudo é correlacional: a lente anda junto com a satisfação, não prova que a causa sozinha. **Descubra a sua completando uma frase: \"eu trabalho principalmente pra...\".**","en":"In 1997, four psychologists interviewed 196 people — from cleaners to physicians — about how each one related to their own work (Wrzesniewski, McCauley, Rozin and Schwartz, Journal of Research in Personality). The answers sorted cleanly into three. A third saw work as a job: a way to pay the bills, nothing more. A third saw a career: a track upward, the next level, the next title. A third saw a calling: something they would do anyway, because it gives life meaning.\n\n**The split barely depended on the occupation.** Among 24 administrative assistants with the same title, the same pay and the same office, all three lenses showed up in roughly equal parts. Between two people in the same role, earning the same, the one who sees work as a calling reports more satisfaction with work and with life.\n\nThe study is correlational: the lens travels alongside satisfaction, it doesn't prove it causes it on its own. **Find yours by finishing one sentence: \"I mostly work to...\".**"},"image":{"path":"glossary-career/idea.1.a541108a.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Wrzesniewski, McCauley, Rozin & Schwartz, 1997 · Journal of Research in Personality · n=196","en":"Wrzesniewski, McCauley, Rozin & Schwartz, 1997 · Journal of Research in Personality · n=196"},"url":"https://doi.org/10.1006/jrpe.1997.2162"}],"cta":null},{"id":"autonomia-alavanca","ordinal":2,"title":{"pt":"O que mais pesa na satisfação com o emprego","en":"What weighs most on your career satisfaction"},"claim":{"pt":"Escolha uma tarefa do seu trabalho nesta semana e passe a fazer do seu jeito.","en":"Pick one task at work this week and start doing it your own way."},"body":{"pt":"Meio século de pesquisa aponta três ingredientes do trabalho com sentido, e nenhum é salário ou cargo: autonomia, ou seja, controle sobre como e quando você faz o trabalho; competência, a sensação de estar ficando visivelmente melhor em algo difícil; e pertencimento, perceber que o que você entrega importa pra alguém. Os três são a base da Teoria da Autodeterminação, um dos programas mais testados da psicologia (Ryan e Deci, 2000).\n\nUm deles se destaca. Uma meta-análise de quase 200 estudos encontrou que **a autonomia tem a relação mais forte com satisfação**, acima de qualquer outro traço de desenho do trabalho (Fried e Ferris, 1987). Duas pessoas no mesmo cargo e no mesmo salário: quem escolhe como faz relata bem mais satisfação do que quem recebe cada passo mastigado.\n\n**Escolha uma coisa nesta semana que você passa a fazer do seu jeito.** E segure o freio: a literatura é correlacional, ninguém provou que injetar autonomia num cargo, sozinho, causa bem-estar.","en":"Half a century of research points to three ingredients of meaningful work, and none is salary or title: autonomy, meaning control over how and when you do the work; competence, the felt sense of getting visibly better at something hard; and relatedness, sensing that what you deliver matters to someone. The three anchor Self-Determination Theory, one of the most heavily tested programs in psychology (Ryan and Deci, 2000).\n\nOne of them towers over the rest. A meta-analysis of nearly 200 studies found that **autonomy has the strongest relationship with satisfaction**, above every other job-design trait (Fried and Ferris, 1987). Two people in the same role, same pay: the one who chooses how the work gets done reports far more satisfaction than the one handed every step pre-chewed.\n\n**Pick one thing this week that you start doing your own way.** And hold the brake: this literature is correlational, and nobody has proven that injecting autonomy into a role, by itself, causes well-being."},"image":{"path":"glossary-career/idea.2.5d2b8d46.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Wrzesniewski, McCauley, Rozin & Schwartz, 1997 · Journal of Research in Personality · n=196","en":"Wrzesniewski, McCauley, Rozin & Schwartz, 1997 · Journal of Research in Personality · n=196"},"url":"https://doi.org/10.1006/jrpe.1997.2162"}],"cta":null},{"id":"chamado-armadilha","ordinal":3,"title":{"pt":"O lado escuro de amar o próprio emprego","en":"The dark side of loving your career"},"claim":{"pt":"Se amar o trabalho só serve pra você aceitar salário baixo e hora extra, renegocie.","en":"If loving the work only gets you to accept low pay and unpaid overtime, renegotiate."},"body":{"pt":"Chamado é enxergar o trabalho como algo que você faria de qualquer jeito, porque dá sentido à vida. Um terço das 196 pessoas entrevistadas em 1997 descreveu assim a própria relação com o trabalho, e esse grupo relatou mais satisfação com o trabalho e com a vida (Wrzesniewski, McCauley, Rozin e Schwartz, Journal of Research in Personality). Daí o conselho padrão: siga seu chamado.\n\nSó que ele tem um lado escuro. Num estudo com tratadores de zoológico, quem tinha um chamado forte tolerava mais salário baixo, mais hora extra não paga e condição de trabalho pior (Bunderson e Thompson, 2009). **O sacrifício era enquadrado como o preço de fazer o que se ama.**\n\nO teste é simples: repare no que o seu amor pelo trabalho está sustentando. Se ele só serve pra engolir condição ruim sem reclamar, não é sentido, é armadilha. **Escolha uma dessas condições e leve pra mesa esta semana.**","en":"A calling means seeing work as something you would do anyway, because it gives life meaning. A third of the 196 people interviewed in 1997 described their own relationship with work that way, and that group reported more satisfaction with work and with life (Wrzesniewski, McCauley, Rozin and Schwartz, Journal of Research in Personality). Hence the standard advice: follow your calling.\n\nIt has a dark side. In a study of zookeepers, those with a strong calling tolerated more low pay, more unpaid overtime and worse working conditions (Bunderson and Thompson, 2009). **The sacrifice got framed as the price of doing what you love.**\n\nThe test is simple: notice what your love for the work is propping up. If it only makes you swallow bad conditions without complaining, that is not meaning, it is a trap. **Pick one of those conditions and put it on the table this week.**"},"image":{"path":"glossary-career/idea.4.1671d90b.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Wrzesniewski, McCauley, Rozin & Schwartz, 1997 · Journal of Research in Personality · n=196","en":"Wrzesniewski, McCauley, Rozin & Schwartz, 1997 · Journal of Research in Personality · n=196"},"url":"https://doi.org/10.1006/jrpe.1997.2162"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-career';

-- glossary-circle · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"risco-que-ninguem-mede","ordinal":1,"title":{"pt":"Ver pouca gente é fator de risco de saúde","en":"Seeing few people is a health risk factor"},"claim":{"pt":"Conte quantas pessoas te procuraram esta semana sem obrigação nem trabalho. Zero ou um é grupo de risco.","en":"Count how many people reached out to you this week outside work and obligation. Zero or one is the risk group."},"body":{"pt":"Em 2023, o Surgeon General dos Estados Unidos — o médico-chefe do país — publicou um alerta oficial: estar desconectado pesa na mortalidade tanto quanto fumar quinze cigarros por dia. É uma comparação de tamanho entre riscos, não uma troca biológica literal.\n\nO número por trás vem de uma meta-análise, um estudo que junta dezenas de pesquisas num sinal só: 148 estudos, 308 mil pessoas, e quem tinha vínculos fortes teve **50% mais chance de sobreviver** ao acompanhamento (Holt-Lunstad, 2010). Efeito do tamanho de pressão alta e obesidade.\n\nE não é o quanto você se sente sozinho que aparece nesses dados. Um estudo de 2013 acompanhou 6.500 ingleses acima de 52 anos e separou as duas coisas: foi o **isolamento** — quantas pessoas você vê, de quantos círculos diferentes — que previu a mortalidade de forma mais firme. Quase tudo aqui é observacional: gente já doente pode se afastar primeiro.\n\nFaça a conta que ninguém faz. Quantas pessoas te procuraram essa semana sem ser por obrigação ou trabalho?","en":"In 2023 the US Surgeon General — the country's top doctor — issued an official advisory: being socially disconnected weighs on mortality as much as smoking fifteen cigarettes a day. That compares the size of two risks; it is not a literal biological trade.\n\nThe number underneath comes from a meta-analysis, a study that pools dozens of others into a single signal: 148 studies, 308,000 people, and those with strong ties had **50% higher odds of surviving** the follow-up (Holt-Lunstad, 2010). That is the size of high blood pressure or obesity.\n\nAnd what shows up in the data is not how lonely you feel. A 2013 study followed 6,500 English adults over 52 and pulled the two apart: it was **isolation** — how many people you see, from how many different circles — that predicted mortality more firmly. Almost all of this is observational: sicker people may withdraw first.\n\nSo run the count nobody runs. How many people reached out to you this week for no reason of work or duty?"},"image":{"path":"glossary-circle/idea.1.56a52155.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Holt-Lunstad, Smith & Layton, 2010 · PLOS Medicine · n=308.849 (148 estudos)","en":"Holt-Lunstad, Smith & Layton, 2010 · PLOS Medicine · n=308,849 (148 studies)"},"url":"https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316"}],"cta":null},{"id":"variedade-nao-volume","ordinal":2,"title":{"pt":"O que protege não é o número de amigos","en":"What protects you is not your friend count"},"claim":{"pt":"Colecione tipos diferentes de vínculo, não mais amigos do mesmo grupo. Seis tipos protegem mais que três.","en":"Collect different types of tie, not more friends from the same group. Six types protect more than three."},"body":{"pt":"Em 1997, pesquisadores fizeram o que quase ninguém consegue nessa área: testaram de propósito. 276 voluntários saudáveis receberam gotas no nariz com vírus vivo do resfriado. Quem tinha só um a três tipos de vínculo — digamos, cônjuge e um colega — ficou resfriado 4,2 vezes mais que quem tinha seis tipos ou mais. **Variedade, não volume.** Como o vírus foi dado em condições controladas, esse estudo escapa do problema de causa invertida que assombra o resto da literatura.\n\nIsso desmonta a corrida pelo número. O número de Dunbar, as tais 150 relações estáveis, saiu em 1992 de uma conta comparando cérebros de primatas, com margem entre 100 e 230. É um chute educado, não um teto.\n\nEntão pare de colecionar mais gente do mesmo grupo. Cônjuge, amigo, colega, vizinho, gente do coral: são tipos diferentes de vínculo. Entre num grupo com encontro fixo e o calendário faz o trabalho por você. Nada disso exige carisma, exige aparecer.","en":"In 1997 researchers did what almost nobody in this field can: they tested on purpose. 276 healthy volunteers were given nasal drops carrying live cold virus. Those with only one to three types of tie — say, a spouse and one coworker — caught a cold 4.2 times more often than those with six types or more. **Variety, not volume.** Because the virus arrived under controlled conditions, that study escapes the reverse-cause problem haunting the rest of this literature.\n\nWhich dismantles the race for a number. Dunbar's number, the famous 150 stable relationships, came out of a 1992 calculation comparing primate brains, with a margin between 100 and 230. An educated guess, not a ceiling.\n\nSo stop collecting more people from the same group. Spouse, friend, coworker, neighbour, someone from the choir: those are different types of tie. Join a group with a standing meeting and the calendar does the work for you. None of it takes charisma. It takes showing up."},"image":{"path":"glossary-circle/idea.3.38fb764d.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Holt-Lunstad, Smith & Layton, 2010 · PLOS Medicine · n=308.849 (148 estudos)","en":"Holt-Lunstad, Smith & Layton, 2010 · PLOS Medicine · n=308,849 (148 studies)"},"url":"https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-circle';

-- glossary-build · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"apego-e-prova","ordinal":1,"title":{"pt":"Construir uma cadeira torta vence mil vídeos.","en":"Building a wobbly chair beats a thousand videos."},"claim":{"pt":"Termine hoje uma coisa pequena com as próprias mãos: é a prova mais forte de que você é capaz.","en":"Finish one small thing with your own hands tonight: it's the strongest proof that you're capable."},"body":{"pt":"Na média, o adulto americano tem 5,2 horas de lazer por dia, e 2,67 delas vão pra televisão — metade do tempo livre olhando outras pessoas fazerem coisas (Pesquisa de Uso do Tempo dos EUA, 2023).\n\nMontar alguma coisa muda isso de dois jeitos, e um deles é mal interpretado. Quem monta a própria caixa passa a valorizar mais o objeto, o chamado efeito IKEA (Norton, Mochon e Ariely, 2012). Mas **apego não é habilidade**: montar a caixa não te deixou melhor em nada.\n\nA competência vem de outro lugar. Albert Bandura rastreou quatro fontes da crença \"eu sou capaz\" e uma pesa mais que as outras três juntas: a experiência de maestria, que é fazer uma coisa difícil e conseguir. Elogio quase não mexe nisso, e ver outra pessoa conseguir mexe pouco (Bandura, 1977).\n\nMil vídeos de marcenaria não deixam nem a cadeira que você ama nem a prova de que sabe fazer uma. **Termine uma coisa pequena hoje à noite.**","en":"The average American adult gets 5.2 hours of leisure a day, and 2.67 of them go to television — half your free time spent watching other people do things (American Time Use Survey, 2023).\n\nMaking something shifts that in two ways, and one of them gets misread. Assemble your own box and you start valuing it more, the so-called IKEA effect (Norton, Mochon & Ariely, 2012). But **attachment is not skill**: assembling that box made you fonder, not better.\n\nCompetence comes from somewhere else. Albert Bandura traced four sources of the belief \"I'm capable\", and one outweighs the other three: mastery experience, which means doing something hard and pulling it off. Praise barely moves it, and watching someone else succeed moves it a little (Bandura, 1977).\n\nA thousand woodworking videos leave you with neither a chair you love nor proof that you can build one. **Finish one small thing tonight.**"},"image":{"path":"glossary-build/idea.1.6f2f765a.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology · 4 estudos","en":"Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology · 4 studies"},"url":"https://doi.org/10.1016/j.jcps.2011.08.002"}],"cta":null},{"id":"tres-condicoes","ordinal":2,"title":{"pt":"Só te muda o que você escolheu construir.","en":"Only a project you chose changes you."},"claim":{"pt":"Escolha você o próximo projeto: ficar bom numa tarefa imposta não vira vontade de continuar.","en":"Pick your next project yourself: getting good at an assigned task never turns into wanting more."},"body":{"pt":"Se fazer fosse mágico por si só, qualquer atividade manual mudaria você. Não é assim: o kit que te deram de presente cansa na segunda noite, e o projeto que você inventou segura você até tarde.\n\nA Teoria da Autodeterminação — um dos modelos mais testados da psicologia da motivação — explica a diferença. A vontade que vem de dentro se apoia em três necessidades: autonomia (você escolheu), competência (você consegue) e vínculo (importa pra alguém). O ponto crucial é que **competência sozinha não motiva**. Sentir que é bom em algo só vira combustível quando a atividade foi escolha sua, e não tarefa imposta (Ryan e Deci, 2000).\n\nIsso vira um filtro barato pro fim de semana. **Antes de comprar material ou marcar aula, pergunte de quem foi a ideia.** Se a resposta não for \"minha\", escolha outra coisa pra fazer — o esforço vai ser o mesmo e a vontade, não.","en":"If making were magic on its own, any hands-on activity would change you. It isn't: the kit somebody gave you dies on the second night, while the project you invented keeps you up late.\n\nSelf-Determination Theory — one of the most tested models in the psychology of motivation — explains the gap. The drive that comes from inside rests on three needs: autonomy (you chose it), competence (you can do it) and relatedness (it matters to someone). The crucial part is that **competence alone doesn't motivate**. Feeling good at something only becomes fuel when the activity was your own pick, not an assigned chore (Ryan & Deci, 2000).\n\nThat gives you a cheap weekend filter. **Before you buy materials or book a class, ask whose idea this was.** If the answer isn't yours, pick something else to make — the effort will be the same and the appetite won't."},"image":{"path":"glossary-build/idea.2.7ce800b1.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology · 4 estudos","en":"Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology · 4 studies"},"url":"https://doi.org/10.1016/j.jcps.2011.08.002"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-build';

-- glossary-sleep: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-sleep'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- glossary-nutrition: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-nutrition'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- glossary-money: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-money'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- glossary-career: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-career'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- glossary-circle: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-circle'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- glossary-build: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-build'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
