-- migration: 20260923000006_learning_ideas_batch.sql
-- purpose: publica as ideias (Recanto em ideias) de 6 material(is) do Learning:
--          glossary-learn · 2 ideia(s)
--          glossary-strength · 2 ideia(s)
--          glossary-play · 3 ideia(s)
--          glossary-contemplate · 3 ideia(s)
--          glossary-dexterity · 3 ideia(s)
--          glossary-romance · 3 ideia(s)
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
--     glossary-learn/idea.1.7acd5e8b.webp  (960x1200, gemini-api)
--     glossary-learn/idea.2.3e40f672.webp  (960x1200, gemini-api)
--     glossary-strength/idea.2.17df470c.webp  (960x1200, gemini-api)
--     glossary-strength/idea.3.52f95979.webp  (960x1200, gemini-api)
--     glossary-play/idea.1.f6b41d82.webp  (960x1200, gemini-api)
--     glossary-play/idea.2.f2486373.webp  (960x1200, gemini-api)
--     glossary-play/idea.3.70ce6faf.webp  (960x1200, gemini-api)
--     glossary-contemplate/idea.1.29ff1f11.webp  (960x1200, gemini-api)
--     glossary-contemplate/idea.2.61ad76b3.webp  (960x1200, gemini-api)
--     glossary-contemplate/idea.3.4991f93c.webp  (960x1200, gemini-api)
--     glossary-dexterity/idea.1.da399a1b.webp  (960x1200, gemini-api)
--     glossary-dexterity/idea.2.21cabecf.webp  (960x1200, gemini-api)
--     glossary-dexterity/idea.3.286c0f3b.webp  (960x1200, gemini-api)
--     glossary-romance/idea.2.70ee662c.webp  (960x1200, gemini-api)
--     glossary-romance/idea.4.fddf34fe.webp  (960x1200, gemini-api)
--     glossary-romance/idea.3.9461a4de.webp  (960x1200, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['glossary-learn', 'glossary-strength', 'glossary-play', 'glossary-contemplate', 'glossary-dexterity', 'glossary-romance']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- glossary-learn · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"dificuldades-desejaveis","ordinal":1,"title":{"pt":"Reler parece aprender. Uma semana depois, não.","en":"Rereading feels like learning. It isn't."},"claim":{"pt":"Feche o livro e tente puxar da memória o que leu, mesmo errando. É o esforço que grava.","en":"Close the book and try to pull back what you read, wrong answers included. The effort is what sticks."},"body":{"pt":"Você relê, grifa, e o capítulo vai ficando familiar. Essa familiaridade é um dos piores termômetros pra saber se você lembra daqui a uma semana. O psicólogo Robert Bjork batizou o paradoxo de **dificuldades desejáveis**: condições que deixam o estudo mais lento agora e gravam mais fundo depois. Quando lembrar custa esforço, o cérebro trata aquilo como digno de guardar.\n\nNum experimento clássico, quem releu o texto quatro vezes se sentiu mais confiante e foi melhor cinco minutos depois. Uma semana depois, virou: quem se testou lembrava de 61% do material; quem releu, 40% (Roediger & Karpicke, 2006).\n\nDuas outras dificuldades seguem o mesmo desenho. Espalhar o estudo ao longo dos dias quase sempre dobra a retenção (Cepeda et al., 2006, 317 experimentos). Embaralhar os tipos de problema atrapalha na hora do treino e cerca de dobra a nota num teste dias depois (Rohrer & Taylor, 2007).\n\nFeche o livro antes de se sentir pronto. Volte ao tema no dia seguinte, com os assuntos misturados.","en":"You reread, you highlight, and the chapter starts to feel familiar. That familiarity is one of the worst thermometers for whether you will still know this next week. Psychologist Robert Bjork named the paradox **desirable difficulties**: conditions that slow your study down now and lodge the material deeper later. When recall costs effort, your brain treats it as worth keeping.\n\nIn a classic experiment, the students who reread a passage four times felt more confident and did better after five minutes. A week later it flipped: the group that tested itself remembered 61% of the material; the rereaders, 40% (Roediger & Karpicke, 2006).\n\nTwo other difficulties work the same way. Spreading study across days usually doubles retention (Cepeda et al., 2006, 317 experiments). Shuffling problem types hurts you during practice and roughly doubles your score on a test days later (Rohrer & Taylor, 2007).\n\nClose the book before you feel ready. Come back the next day, with the topics mixed."},"image":{"path":"glossary-learn/idea.1.7acd5e8b.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Roediger & Karpicke, 2006 · Psychological Science · n≈120","en":"Roediger & Karpicke, 2006 · Psychological Science · n≈120"},"url":"https://doi.org/10.1111/j.1467-9280.2006.01693.x"}],"cta":null},{"id":"cerebro-cresce-e-desfaz","ordinal":2,"title":{"pt":"Aprender muda o cérebro. Parar desfaz.","en":"Learning rebuilds the brain. Stopping undoes it."},"claim":{"pt":"Volte a praticar o que você aprendeu: sem uso, o ganho no cérebro encolhe em poucos meses.","en":"Go back and practice what you learned: unused, the gain in your brain shrinks within months."},"body":{"pt":"Pesquisadores em Londres escanearam o cérebro de taxistas que passaram anos decorando o labirinto de ruas da cidade. Eles tinham o hipocampo posterior — a estrutura no fundo do cérebro que forma memórias novas — visivelmente maior que o de pessoas comuns, e quanto mais anos de táxi, maior a região (Maguire et al., 2000).\n\nTalvez quem já nasce com hipocampo grande vire taxista? O segundo estudo responde. Voluntários que nunca tinham feito malabarismo treinaram três meses, e a substância cinzenta — a camada do cérebro que processa informação — cresceu nas áreas ligadas ao movimento. **Quando pararam de treinar, o crescimento encolheu de volta em poucos meses.** Era treino, não talento fixo.\n\nSão estudos antigos e pequenos, de 16 a 24 pessoas: a direção do efeito é sólida, os números exatos são ilustrativos.\n\nBoa parte dessa reconstrução acontece dormindo, então durma depois de estudar. E volte ao que você aprendeu de tempos em tempos: o que você deixa de usar, o cérebro desmonta.","en":"Researchers in London scanned the brains of taxi drivers who had spent years memorizing the city's maze of streets. Their posterior hippocampus — the structure deep in the brain that forms new memories — was visibly larger than in other people, and the more years behind the wheel, the bigger the region (Maguire et al., 2000).\n\nMaybe people born with a big hippocampus end up driving cabs? A second study answers that. Volunteers who had never juggled trained for three months, and their grey matter — the brain layer that processes information — grew in the regions tied to movement. **When they stopped training, the growth shrank back within a few months.** It was practice, not fixed talent.\n\nThese studies are old and small, 16 to 24 people: the direction of the effect holds, the exact numbers are illustrative.\n\nMuch of this rebuilding happens while you sleep, so sleep after you study. And come back to what you learned every so often: what you stop using, your brain takes apart."},"image":{"path":"glossary-learn/idea.2.3e40f672.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Roediger & Karpicke, 2006 · Psychological Science · n≈120","en":"Roediger & Karpicke, 2006 · Psychological Science · n≈120"},"url":"https://doi.org/10.1111/j.1467-9280.2006.01693.x"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-learn';

-- glossary-strength · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"zona-2-mitocondria","ordinal":1,"title":{"pt":"Zone 2 é o ritmo que o HIIT não substitui","en":"Zone 2 is the pace HIIT can't replace"},"claim":{"pt":"Treine 3 horas por semana num ritmo em que você fala frases inteiras, mas preferiria não estar falando.","en":"Train three hours a week at a pace where you can speak full sentences but would rather not talk."},"body":{"pt":"Quando você se exercita, o corpo escolhe entre dois combustíveis: gordura e açúcar. Em ritmo leve, prefere gordura. Quando você acelera, troca pra açúcar e produz lactato, uma substância que depois precisa limpar. Zone 2 é a faixa em que você ainda queima principalmente gordura sem acumular lactato — abaixo de 2 mmol/L no sangue.\n\nEssa faixa constrói **densidade mitocondrial**: mais e melhores mitocôndrias, as estruturas que produzem energia dentro das células. Elas mexem em recuperação, queima de gordura e controle de inflamação. O HIIT, treino intervalado de alta intensidade, treina outra coisa — potência e tolerância a esforço alto — e não constrói essa fundação.\n\nPra achar o ritmo sem aparelho, use o teste da conversa: dá pra formar frases inteiras, mas você preferiria não estar falando. Em batimentos, 60% a 70% do seu máximo. Três horas por semana é o piso em que a literatura converge: caminhada rápida, pedalada leve ou natação confortável contam. Em *Outlive* (2023), Peter Attia aponta a eficiência aeróbica como o exercício mais importante que existe.","en":"When you exercise, your body picks between two fuels: fat and sugar. At an easy pace it prefers fat. Push harder and it switches to sugar, producing lactate that you then have to clear. Zone 2 is the range where you still burn mostly fat without piling up lactate — under 2 mmol/L in the blood.\n\nThat range builds **mitochondrial density**: more and better mitochondria, the structures that make energy inside your cells. They shape recovery, fat-burning and inflammation control. HIIT, high-intensity interval training, trains something else — power and tolerance for hard efforts — and it does not build that foundation.\n\nTo find the pace without a monitor, use the talk test: you can still form full sentences, but you would rather not be talking. In heart rate, 60% to 70% of your max. Three hours a week is where the literature converges: brisk walking, easy cycling or a comfortable swim all count. In *Outlive* (2023), Peter Attia points to aerobic efficiency as the most important exercise there is."},"image":{"path":"glossary-strength/idea.2.17df470c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Mandsager et al., 2018 · JAMA Network Open · n=122.007","en":"Mandsager et al., 2018 · JAMA Network Open · n=122,007"},"url":"https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2707428"}],"cta":null},{"id":"piso-semanal-oms","ordinal":2,"title":{"pt":"Treino de força tem um piso semanal","en":"Strength training has a weekly floor"},"claim":{"pt":"Treine força 2 a 3 vezes por semana, cerca de 10 séries por grupo muscular, perto da falha.","en":"Train strength 2 to 3 times a week, about 10 sets per muscle group, close to failure."},"body":{"pt":"Em 2020, a Organização Mundial da Saúde publicou o piso que um adulto precisa manter — não o ideal, o mínimo abaixo do qual você está perdendo. Na força são duas linhas: **2 a 3 sessões por semana**, perto da falha, cerca de 10 séries por grupo muscular; e 10 minutos de mobilidade por dia, que rendem mais do que uma hora concentrada uma vez por mês.\n\nO piso existe porque a perda não dói. Você fica um pouco menos forte a cada ano e não percebe: aos 35 sobe escada sem pensar, aos 50 começa a pensar, aos 65 evita. O custo de não treinar não aparece em três anos, aparece em trinta.\n\nE dor no dia seguinte não é o termômetro do treino. Ela aparece quando você faz algo novo ou excêntrico, como descer escada; quem sobe carga devagar muitas vezes não fica dolorido. Conte as séries que você fez na semana, não o quanto doeu.","en":"In 2020 the World Health Organization published the floor an adult has to hold — not the ideal, the minimum below which you are losing ground. For strength it is two lines: **2 to 3 sessions a week**, close to failure, about 10 sets per muscle group; plus 10 minutes of mobility a day, which beats one long session once a month.\n\nThe floor exists because the loss never hurts. You get slightly weaker every year and never notice: at 35 you climb stairs without thinking, at 50 you start thinking, at 65 you avoid them. The cost of not training shows up in thirty years, not three.\n\nAnd next-day soreness is not the gauge of a good session. It shows up when you do something new or eccentric, like walking downstairs; people who add load slowly are often not sore at all. Count the sets you did this week, not how much it hurt."},"image":{"path":"glossary-strength/idea.3.52f95979.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Mandsager et al., 2018 · JAMA Network Open · n=122.007","en":"Mandsager et al., 2018 · JAMA Network Open · n=122,007"},"url":"https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2707428"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-strength';

-- glossary-play · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"sofa-um-pedaco","ordinal":1,"title":{"pt":"O sofá só entrega um pedaço do descanso","en":"The couch delivers only part of your rest"},"claim":{"pt":"Troque a tarde no sofá por um hobby que exige algo de você: ele entrega 3 dos 4 ingredientes do descanso.","en":"Trade the couch afternoon for a hobby that asks something of you: it delivers 3 of rest's 4 ingredients."},"body":{"pt":"Em 2007, duas pesquisadoras mediram o que o tempo livre precisa entregar pra de fato te recuperar (Sonnentag & Fritz, 2007). A lista tem quatro ingredientes, nem um a mais. Desligamento: tirar o trabalho da cabeça, não só sair da mesa. Relaxamento: corpo e mente em marcha lenta, sem cobrança. Maestria: um desafio que você escolheu, tipo violão ou um prato difícil. Controle: você decidindo o que fazer com o tempo.\n\nUma meta-análise de 54 estudos e 26.592 pessoas (Bennett, Bakker & Field, 2018) confirmou os quatro, e desligar do trabalho é o que mais pesa.\n\nAgora conte. **A tarde no sofá entrega 1 dos 4: relaxamento, e nada mais.** Aprender a fazer pão entrega 3 dos 4 de uma vez: desligamento, maestria e controle. Por isso o domingo no feed deixa você igual na segunda — parar não é descansar. Escolha um hobby que exige alguma coisa de você: aprender, praticar, progredir.","en":"In 2007, two researchers measured what free time has to deliver before it actually restores you (Sonnentag & Fritz, 2007). The list runs to four ingredients, no more. Detachment: getting work out of your head, not just leaving your desk. Relaxation: body and mind in low gear, nothing demanded of you. Mastery: a challenge you picked, like guitar or a hard recipe. Control: you deciding what the hours are for.\n\nA meta-analysis of 54 studies and 26,592 people (Bennett, Bakker & Field, 2018) backed all four, and detaching from work carries the most weight.\n\nNow count. **An afternoon on the couch delivers 1 of the 4: relaxation, and nothing else.** Learning to bake bread delivers 3 of the 4 at once: detachment, mastery and control. That is why a Sunday on the feed leaves you just as tired on Monday — stopping is not resting. Pick a hobby that asks something of you: learn, practice, get better."},"image":{"path":"glossary-play/idea.1.f6b41d82.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · revisão de 363 estudos","en":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · review of 363 studies"},"url":"https://link.springer.com/article/10.1007/s10902-013-9435-x"}],"cta":null},{"id":"ferias-somem","ordinal":2,"title":{"pt":"Suas férias somem antes da mala desfeita","en":"Your vacation fades before you unpack"},"claim":{"pt":"Em vez de contar os dias pra viagem, proteja uma janela por dia sem nenhuma notificação de trabalho.","en":"Instead of counting the days to the trip, guard one window every day with zero work notifications."},"body":{"pt":"A solução que todo mundo imagina pro cansaço é a mesma: umas boas férias. Uma meta-análise de 13 estudos mediu gente antes e depois de viagens de 11 dias, em média (Speth, Wendsche & Wegge, 2023). Elas voltavam com mais ânimo, mas o efeito era modesto, e a satisfação com a vida quase não se mexia.\n\nE o ganho evapora. Entre 54 trabalhadores numa viagem de três semanas, o bem-estar fez pico por volta do oitavo dia e voltou ao normal menos de uma semana depois da volta (de Bloom et al., 2010). Entre 131 professores, o alívio do esgotamento sumia em cerca de um mês, mais rápido pra quem voltava pra uma pilha de trabalho (Kühnel & Sonnentag, 2011).\n\n**Não é a viagem que cura, é o desligar.** Homens convocados pra reserva militar, sem praia nenhuma, voltaram com menos estresse que os colegas que ficaram no trabalho (Etzion, Eden & Lapidot, 1998). Uma viagem por ano não conserta um ano de tempo livre mal usado.","en":"Everyone pictures the same cure for exhaustion: a good vacation. A meta-analysis of 13 studies measured people before and after trips lasting 11 days on average (Speth, Wendsche & Wegge, 2023). They came back with more energy, but the effect was modest, and life satisfaction barely moved.\n\nAnd the gain evaporates. Among 54 workers on a three-week trip, well-being peaked around day eight and was back to baseline less than a week after the return (de Bloom et al., 2010). Among 131 teachers, burnout relief faded within about a month, faster for anyone who came back to a pile of work (Kühnel & Sonnentag, 2011).\n\n**It is not the trip that heals, it is the detaching.** Men called up for reserve duty, with no beach anywhere in it, came back with less stress than colleagues who stayed at work (Etzion, Eden & Lapidot, 1998). One trip a year will not fix a year of badly spent free time."},"image":{"path":"glossary-play/idea.2.f2486373.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · revisão de 363 estudos","en":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · review of 363 studies"},"url":"https://link.springer.com/article/10.1007/s10902-013-9435-x"}],"cta":null},{"id":"pior-semana-hobby","ordinal":3,"title":{"pt":"A pior semana é a melhor hora pro hobby","en":"Your worst week is the best time for a hobby"},"claim":{"pt":"Na semana mais pesada, marque o hobby na agenda em vez de esperar sobrar energia.","en":"In your heaviest week, put the hobby on the calendar instead of waiting for spare energy."},"body":{"pt":"Uma revisão de 363 estudos concluiu que o lazer te faz bem conforme as necessidades que ele satisfaz — inclusive duas que quase ninguém planeja: sentir que aquilo importa pra você e estar com gente de quem você gosta (Newman, Tay & Diener, 2014). Duas pessoas na mesma caminhada saem com recuperação diferente.\n\nDá pra construir isso de propósito. Chamam de moldar o próprio lazer: buscar atividades com meta, aprendizado e conexão, em vez de deixar o tempo livre virar rolagem infinita. Nas semanas em que a pessoa moldava mais o lazer, ela relatava mais sentido e mais engajamento (Petrou, Bakker & van den Heuvel, 2016).\n\n**E é nas semanas de trabalho mais pesado que as pessoas moldam mais o próprio lazer** (Petrou & Bakker, 2015), exatamente quando mais precisam. Nem todo lazer precisa de meta: o tédio sem objetivo alimenta a criatividade, e as duas coisas convivem. Mas, na semana impossível, esperar sobrar energia é o mesmo que não fazer. Marque o hobby como você marcaria uma reunião.","en":"A review of 363 studies concluded that leisure does you good in proportion to the needs it satisfies — including two almost nobody plans for: feeling that the thing matters to you, and being with people you like (Newman, Tay & Diener, 2014). Two people on the same walk come away with different recovery.\n\nYou can build this on purpose. Researchers call it leisure crafting: going after activities with a goal, learning and connection, instead of letting free time collapse into endless scrolling. In the weeks people crafted their leisure more, they reported more meaning and more engagement (Petrou, Bakker & van den Heuvel, 2016).\n\n**And people craft their leisure most in the weeks when work is heaviest** (Petrou & Bakker, 2015), exactly when they need it. Not all leisure needs a goal: aimless boredom feeds creativity, and both can be true. But in the impossible week, waiting for spare energy means not doing it. Book the hobby the way you would book a meeting."},"image":{"path":"glossary-play/idea.3.70ce6faf.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · revisão de 363 estudos","en":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · review of 363 studies"},"url":"https://link.springer.com/article/10.1007/s10902-013-9435-x"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-play';

-- glossary-contemplate · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"mente-vaga-metade","ordinal":1,"title":{"pt":"Sua mente passa metade do dia em outro lugar","en":"Your mind wanders through half your waking life"},"claim":{"pt":"Quando notar que a cabeça saiu, volte pro que está na sua frente: divagar vem antes do humor cair.","en":"The moment you notice your mind left, come back to what is in front of you: the drifting comes before the bad mood."},"body":{"pt":"Em 2010, dois pesquisadores de Harvard puseram um app pra tocar no celular de 2.250 adultos em horas aleatórias e perguntar três coisas: o que você está fazendo, no que está pensando e quão feliz está. Juntaram mais de 250 mil respostas colhidas no dia real das pessoas (Killingsworth & Gilbert, Science, 2010).\n\nA mente estava longe da tarefa em quase toda atividade — no trabalho, no ônibus, até no sexo: 46,9% da vida acordada. **E a divagação vinha antes da queda de humor, não depois.** Você não escapa pra dentro da cabeça porque está mal; fica mal porque escapou. A leitura causal é a melhor inferência dos autores, não uma prova fechada, mas o padrão apareceu forte.\n\nDivagar não é defeito: é a marca de uma mente que ensaia o futuro e remói o passado. Por isso o treino não é impedir a fuga, é encurtá-la. Quando perceber que saiu, volte de propósito pro que está na sua frente, sem se xingar por ter saído. Cada retorno desses é um pedaço daquela metade de volta.","en":"In 2010, two Harvard researchers built an app that pinged 2,250 adults at random hours and asked three things: what are you doing, what are you thinking about, and how happy are you. They collected more than 250,000 answers from people's real days (Killingsworth & Gilbert, Science, 2010).\n\nMinds sat away from the task during almost every activity — at work, on the bus, even during sex: 46.9% of waking life. **And the wandering came before the mood dropped, not after.** You don't slip into your head because you feel bad; you feel bad because you slipped. The causal reading is the authors' best inference rather than settled proof, but the pattern showed up strong.\n\nWandering is no defect: it is the mark of a mind that rehearses the future and chews over the past. So the training is not to block the exit, it is to shorten it. The moment you notice you left, come back on purpose to what sits in front of you, without scolding yourself for leaving. Each return reclaims a piece of that half."},"image":{"path":"glossary-contemplate/idea.1.29ff1f11.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Goyal M, et al., 2014 · JAMA Internal Medicine · n=3.515 (47 ensaios)","en":"Goyal M, et al., 2014 · JAMA Internal Medicine · n=3,515 (47 trials)"},"url":"https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/1809754"}],"cta":null},{"id":"meditacao-efeito-modesto","ordinal":2,"title":{"pt":"Meditar funciona menos do que te venderam","en":"Meditation works less than you were sold"},"claim":{"pt":"Meditar ganha de não fazer nada, mas não ganha de sair pra caminhar.","en":"Meditating beats doing nothing, but it does not beat going out for a walk."},"body":{"pt":"A revisão mais cuidadosa do assunto juntou 47 ensaios clínicos randomizados, com 3.515 pessoas (Goyal et al., JAMA Internal Medicine, 2014). Programas estruturados de meditação melhoraram ansiedade, depressão e dor, com efeito entre pequeno e moderado: real e mensurável, longe da transformação de antes-e-depois que os apps vendem. **Nesses mesmos dados, nada indicou que meditar seja melhor que remédio, exercício ou terapia.**\n\nO caso mais sólido é recaída de depressão. O curso de oito semanas de terapia cognitiva baseada em mindfulness, a MBCT, corta em cerca de um terço o risco de recair, frente ao cuidado habitual (Kuyken, JAMA Psychiatry, 2016, com 1.258 pacientes).\n\nE o que o folheto não diz: uma revisão de 83 estudos achou cerca de 1 em cada 12 praticantes relatando efeito adverso — ansiedade, angústia, sensação de desconexão. Em pesquisas de campo, sem instrutor, chega a 1 em 3. Se for praticar, prefira um programa guiado com instrutor a um app solto às duas da manhã, e pare se aparecer angústia forte.","en":"The most careful review of this pooled 47 randomized trials and 3,515 people (Goyal et al., JAMA Internal Medicine, 2014). Structured meditation programs improved anxiety, depression and pain, with an effect between small and moderate: real and measurable, nowhere near the before-and-after transformation apps sell. **In that same data, nothing showed meditating to beat medication, exercise or therapy.**\n\nThe strongest case is depression relapse. MBCT, the eight-week mindfulness-based cognitive therapy course, cuts the risk of relapsing by about a third compared with usual care (Kuyken, JAMA Psychiatry, 2016, 1,258 patients).\n\nAnd the part the brochure skips: a review of 83 studies found roughly 1 in 12 practitioners reporting an adverse effect — anxiety, distress, a sense of disconnection. In field surveys, with no instructor, it reaches 1 in 3. So if you practise, pick a guided program with a teacher over a loose app at two in the morning, and stop if heavy distress shows up."},"image":{"path":"glossary-contemplate/idea.2.61ad76b3.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Goyal M, et al., 2014 · JAMA Internal Medicine · n=3.515 (47 ensaios)","en":"Goyal M, et al., 2014 · JAMA Internal Medicine · n=3,515 (47 trials)"},"url":"https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/1809754"}],"cta":null},{"id":"portas-da-contemplacao","ordinal":3,"title":{"pt":"Contemplar não é só sentar em silêncio","en":"Contemplation is not only sitting in silence"},"claim":{"pt":"Escreva à mão por 15 minutos sobre o que está pesando, e não um rabisco rápido.","en":"Write by hand for 15 minutes about whatever is weighing on you, not a quick scribble."},"body":{"pt":"Contemplar é voltar a atenção pra dentro de propósito, e sentar em silêncio é só uma porta. Escrever é outra, com evidência própria: uma meta-análise de 146 estudos mostrou que colocar no papel o que te incomoda traz um benefício pequeno mas real pra saúde física e mental (Frattaroli, 2006). **O ganho é maior justamente pra quem está sob muito estresse ou tende ao pessimismo.** E o relógio conta: sessões acima de quinze minutos funcionam melhor que rabiscos rápidos.\n\nNa prática, é caderno, caneta e quinze minutos sobre o que está pesando. Não é lista de tarefas nem diário de gratidão. A gramática não importa, porque ninguém vai ler.\n\nSe no meio a cabeça fugir pra outra coisa, volte pro papel: **perceber que saiu e voltar é a habilidade que você treina aqui**, com ou sem almofada de meditação embaixo de você.","en":"Contemplation means turning attention inward on purpose, and sitting in silence is only one door. Writing is another, with evidence of its own: a meta-analysis of 146 studies found that putting what bothers you on paper brings a small but real benefit to physical and mental health (Frattaroli, 2006). **The gain runs biggest for people under heavy stress or prone to pessimism.** And the clock counts: sessions over fifteen minutes work better than quick scribbles.\n\nIn practice it is a notebook, a pen and fifteen minutes about whatever is weighing on you. Not a to-do list, not a gratitude journal. Grammar does not matter, because nobody will read it.\n\nWhen your head slips off mid-page, come back to the paper: **noticing you left and returning is the skill you are training here**, cushion or no cushion."},"image":{"path":"glossary-contemplate/idea.3.4991f93c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Goyal M, et al., 2014 · JAMA Internal Medicine · n=3.515 (47 ensaios)","en":"Goyal M, et al., 2014 · JAMA Internal Medicine · n=3,515 (47 trials)"},"url":"https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/1809754"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-contemplate';

-- glossary-dexterity · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"sentar-e-levantar","ordinal":1,"title":{"pt":"Você consegue levantar do chão sem as mãos?","en":"Can you get off the floor without your hands?"},"claim":{"pt":"Sente no chão e levante sem usar as mãos: quanto mais apoios você precisa, mais curta tende a ser a vida.","en":"Sit on the floor and stand up without your hands: the more supports you need, the shorter life tends to be."},"body":{"pt":"Pesquisadores brasileiros criaram o teste de sentar-e-levantar: sentar no chão de pernas cruzadas e subir sem apoiar mãos, joelhos ou cotovelo. Eles acompanharam 2 mil adultos entre 51 e 80 anos (Brito et al., Eur J Prev Cardiol, 2014). Quem subia precisando de três ou quatro apoios tinha **5 a 6 vezes** mais risco de morrer nos anos seguintes do que quem subia sem tocar o chão, e a diferença continua ali depois de descontar idade, peso e condição do coração.\n\nO gesto lê o corpo se organizando no espaço: músculo, articulação, ouvido interno e o sentido da própria posição trabalhando juntos no mesmo segundo. Quando uma dessas peças começa a falhar, a subida entrega antes de qualquer sintoma.\n\nDecorar o movimento não faz você viver mais, porque o teste só reflete uma capacidade por baixo. Mas **sentar e levantar do chão algumas vezes por dia** treina exatamente essa capacidade. Comece hoje, com espaço livre em volta.","en":"Brazilian researchers built the sitting-rising test: sit cross-legged on the floor, then stand back up without pushing off with your hands, knees or an elbow. They followed 2,000 adults aged 51 to 80 (Brito et al., Eur J Prev Cardiol, 2014). People who needed three or four points of support on the way up carried **5 to 6 times** the risk of dying in the years that followed, compared with those who rose without touching the floor, and that gap survives adjustment for age, weight and heart condition.\n\nThe move reads your body organizing itself in space: muscle, joint, inner ear and the sense of where your limbs are, all working inside the same second. When one of those parts starts to fail, the rise gives it away before any symptom does.\n\nDrilling the movement won't add years, because the test only mirrors a capacity underneath. But **sitting down and getting up off the floor a few times a day** trains that capacity. Start today, with room around you."},"image":{"path":"glossary-dexterity/idea.1.da399a1b.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Brito et al., 2014 · Eur J Prev Cardiol · teste de sentar-e-levantar, n=2.002","en":"Brito et al., 2014 · Eur J Prev Cardiol · sitting-rising test, n=2,002"},"url":"https://doi.org/10.1177/2047487312471759"}],"cta":null},{"id":"dinapenia","ordinal":2,"title":{"pt":"Sua força chega tarde quando você tropeça","en":"Your strength arrives late when you stumble"},"claim":{"pt":"O que a idade tira primeiro é a velocidade da força, não a força: segurar um tropeço leva milissegundos.","en":"What age takes first is the speed of your force, not the force: catching a stumble takes milliseconds."},"body":{"pt":"Em 2023, quedas mataram 41.400 americanos acima de 65 anos, e as mortes por queda subiram 51% em uma década. Uma em cada quatro pessoas idosas cai todo ano.\n\nO que a idade tira primeiro não é a força bruta: é a velocidade com que você produz força. Essa perda de potência tem nome, **dinapenia**, e não se confunde com a sarcopenia, que é a perda de massa muscular. A potência cai mais rápido que o tamanho do músculo e que a força máxima.\n\nSegurar uma escorregada é um movimento de milissegundos. O tornozelo reage, o quadril corrige, o braço sai na hora certa. Quem perdeu potência ainda tem a força: ela só chega depois que o corpo já foi ao chão. O tornozelo pesa nessa conta. Um estudo com 372 mulheres achou pouca dorsiflexão, a capacidade de puxar o pé pra cima em direção à canela, andando junto com mais quedas. **Cinco minutos por dia de mobilidade de tornozelo e quadril** rendem mais que uma maratona de alongamento no fim do mês.","en":"In 2023, falls killed 41,400 Americans over 65, and fall deaths rose 51% in a single decade. One in four older adults falls every year.\n\nWhat age takes first isn't raw strength: it's how fast you produce force. That loss of power has a name, **dynapenia**, and it is not sarcopenia, the loss of muscle mass. Power drops faster than muscle size or peak strength do.\n\nCatching yourself on a slip is a movement of milliseconds. The ankle reacts, the hip corrects, the arm shoots out at the right instant. Someone who lost power still owns the strength: it just arrives after the body already hit the floor. The ankle carries weight here. A study of 372 women found little dorsiflexion, the ability to pull your foot up toward your shin, going hand in hand with more falls. **Five minutes a day of ankle and hip mobility** does more than a stretching marathon at the end of the month."},"image":{"path":"glossary-dexterity/idea.2.21cabecf.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Brito et al., 2014 · Eur J Prev Cardiol · teste de sentar-e-levantar, n=2.002","en":"Brito et al., 2014 · Eur J Prev Cardiol · sitting-rising test, n=2,002"},"url":"https://doi.org/10.1177/2047487312471759"}],"cta":null},{"id":"equilibrio-corta-quedas","ordinal":3,"title":{"pt":"Alongar não impede você de cair","en":"Stretching won't keep you off the floor"},"claim":{"pt":"Alongar não previne queda. Treine equilíbrio de propósito três vezes por semana, com força funcional.","en":"Stretching doesn't prevent falls. Train balance on purpose three times a week, with functional strength."},"body":{"pt":"Uma revisão Cochrane de 108 estudos, com 23 mil pessoas, encontrou evidência forte de que programas de equilíbrio e movimento funcional reduzem quedas. Musculação sozinha, dança sozinha, caminhada sozinha? Evidência incerta. **O que corta queda é desafiar o equilíbrio de propósito.**\n\nO exemplo mais bem replicado é o Tai Chi. Num estudo com 256 adultos entre 70 e 92 anos, seis meses de prática deixaram o grupo com 55% menos risco de cair várias vezes do que o grupo que só alongava. Aquela sequência lenta e aparentemente boba é treino de equilíbrio disfarçado.\n\nO alongamento estático não faz o que a maioria pensa. Uma revisão Cochrane não achou redução de dor muscular depois do treino, e outras revisões não acharam menos lesões em quem alonga antes de treinar. Flexibilidade é o quanto a articulação estica de forma passiva; mobilidade é o controle ativo dentro dessa amplitude, e é ela que protege. **Reserve três sessões por semana** de equilíbrio com força funcional moderada, a recomendação da OMS.","en":"A Cochrane review of 108 trials, covering 23,000 people, found strong evidence that balance and functional-movement programs reduce falls. Strength training alone, dance alone, walking alone? Uncertain. **What cuts falls is challenging your balance on purpose.**\n\nThe best-replicated example is Tai Chi. In a study of 256 adults aged 70 to 92, six months of practice left the group with 55% lower risk of falling repeatedly than the group that only stretched. That slow, seemingly silly sequence is balance training in disguise.\n\nStatic stretching doesn't do what most people think. A Cochrane review found no drop in soreness after a workout, and other reviews found no fewer injuries among people who stretch before training. Flexibility is how far a joint stretches passively; mobility is active control inside that range, and mobility is what protects you. **Book three sessions a week** of balance plus moderate functional strength, the WHO recommendation."},"image":{"path":"glossary-dexterity/idea.3.286c0f3b.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Brito et al., 2014 · Eur J Prev Cardiol · teste de sentar-e-levantar, n=2.002","en":"Brito et al., 2014 · Eur J Prev Cardiol · sitting-rising test, n=2,002"},"url":"https://doi.org/10.1177/2047487312471759"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-dexterity';

-- glossary-romance · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"comemorar-a-vitoria","ordinal":1,"title":{"pt":"No casal, comemorar pesa mais que consolar","en":"For couples, celebrating beats consoling"},"claim":{"pt":"Quando seu parceiro chegar com uma boa notícia, largue o que estiver fazendo e pergunte como foi.","en":"When your partner walks in with good news, drop what you're doing and ask how it went."},"body":{"pt":"Qualquer pessoa decente aparece na tragédia. A psicóloga Shelly Gable virou a lente pro momento oposto: a hora em que alguém chega em casa com uma boa notícia — passou na prova, fechou o cliente, recebeu um elogio. A resposta do parceiro tem quatro formas, e só uma constrói o vínculo: a **resposta ativa-construtiva**, quando você larga o que está fazendo, faz perguntas e se anima junto de verdade (“sério? conta tudo, como foi?”). As outras três corroem em silêncio: o “que bom, amor” dito sem levantar a cabeça, o “será que você dá conta dessa responsabilidade?” e o assunto trocado na hora. Em quatro estudos com casais, Gable viu que comemorar junto as boas notícias previu mais intimidade e satisfação do que o apoio nos momentos ruins. Faz sentido: segurar a barra na queda é o mínimo. Aparecer na alegria, sem competir e sem inveja disfarçada, é raro — e o outro sente a diferença. Hoje, quando vier a boa notícia, pare tudo e peça detalhes.","en":"Anyone decent shows up for the disaster. Psychologist Shelly Gable turned the lens on the opposite moment: when someone walks in with good news — passed the exam, closed the client, got the compliment. Your partner's answer takes one of four shapes, and only one builds the bond: the **active-constructive response**, where you drop what you are doing, ask questions and light up with them for real (“seriously? tell me everything”). The other three erode it quietly: the “nice, honey” said without looking up, the “are you sure you can handle that?”, and the quick change of subject. Across four studies of couples, Gable found that celebrating good news together predicted more intimacy and satisfaction than support during the hard times did. It tracks: holding someone up after a fall is the floor. Showing up for the joy, with no competing and no disguised envy, is rare — and your partner feels the difference. Today, when the good news lands, stop everything and ask for details."},"image":{"path":"glossary-romance/idea.2.70ee662c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Gottman & Levenson, 1992 · J. Personality and Social Psychology · n=73 casais","en":"Gottman & Levenson, 1992 · J. Personality and Social Psychology · n=73 couples"},"url":"https://www.johngottman.net/wp-content/uploads/2011/05/Marital-processes-predictive-of-later-dissolution-behavior-physiology-and-health.pdf"}],"cta":null},{"id":"coisa-nova-junto","ordinal":2,"title":{"pt":"Conforto não é o que segura um casal","en":"Comfort isn't what holds a couple together"},"claim":{"pt":"Marquem uma coisa que vocês dois não fazem sempre: uma aula, um bairro novo, uma receita difícil.","en":"Book one thing the two of you don't do often: a class, a new neighborhood, a hard recipe."},"body":{"pt":"O tédio não avisa que chegou. O psicólogo Arthur Aron testou o que acontece quando um casal faz junto algo novo e um pouco excitante — repare: não confortável, novo. Os casais sorteados para uma tarefa nova e estimulante saíam avaliando a relação como melhor do que os que fizeram uma tarefa morna. O mecanismo tem nome: **autoexpansão** — a gente entra numa relação em parte pra crescer, pra virar uma versão maior de si mesmo através do outro. Quando vocês param de viver coisas novas juntos, essa expansão trava, e o que ocupa o lugar dela é o tédio, que come a satisfação por dentro. Não precisa ser paraquedismo, nem precisa ser caro. Precisa ser algo que vocês dois não fazem sempre: uma aula, um bairro que nenhum dos dois conhece, um jogo, uma receita difícil. **O ingrediente ativo é o friozinho de “não sei como isso vai sair”**, não o preço nem o esforço. Escolha uma e marque data essa semana.","en":"Boredom doesn't announce itself. Psychologist Arthur Aron tested what happens when a couple does something new and a little exciting together — note the wording: not comfortable, new. Couples randomly assigned to a novel, stimulating task rated the relationship better afterward than couples given a dull one. The mechanism has a name: **self-expansion** — we pair up partly to grow, to become a bigger version of ourselves through someone else. When you stop living new things together, that expansion stalls, and what moves into the empty space is boredom, which eats satisfaction from the inside. It doesn't have to be skydiving, and it doesn't have to be expensive. It has to be something the two of you don't do all the time: a class, a neighborhood neither of you knows, a game, a hard recipe. **The active ingredient is the small thrill of “I don't know how this will turn out”**, not the price or the effort. Pick one and set a date this week."},"image":{"path":"glossary-romance/idea.4.fddf34fe.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Gottman & Levenson, 1992 · J. Personality and Social Psychology · n=73 casais","en":"Gottman & Levenson, 1992 · J. Personality and Social Psychology · n=73 couples"},"url":"https://www.johngottman.net/wp-content/uploads/2011/05/Marital-processes-predictive-of-later-dissolution-behavior-physiology-and-health.pdf"}],"cta":null},{"id":"manutencao-e-comportamento","ordinal":3,"title":{"pt":"Amor é comportamento, não sentimento","en":"Love is behavior, not a feeling"},"claim":{"pt":"Não espere a inspiração voltar: puxe sua parte da casa sem ser cobrado e diga “a gente resolve isso junto”.","en":"Don't wait to feel it: carry your share at home without being asked and say “we'll figure this out together”."},"body":{"pt":"Manter uma relação não é um sentimento que você tem ou não tem; é um conjunto de ações. As pesquisadoras Laura Stafford e Daniel Canary perguntaram a centenas de pessoas o que elas de fato fazem pra sustentar a relação, e cinco estratégias apareceram de novo e de novo: **ser leve no dia a dia, falar do que sente, deixar claro que há um futuro, puxar sua parte da casa sem ser cobrado e cultivar amigos que são dos dois.** Nenhuma delas é traço de personalidade. Todas dão pra fazer amanhã, cansado, sem inspiração nenhuma.\n\nSe vocês estão numa fase morna, um dado pra tirar o peso da culpa: uma revisão que juntou 165 estudos e 165 mil pessoas achou que a satisfação do casal cai por volta dos 10 anos de relação, chega ao fundo e volta a subir para muitos casais. O vale dos 10 anos é comum, não é sentença. O que o outro enxerga não é o que você sente, é o que você faz. Escolha uma das cinco e faça hoje.","en":"Keeping a relationship alive isn't a feeling you either have or don't; it's a set of actions. Researchers Laura Stafford and Daniel Canary asked hundreds of people what they actually do to sustain their relationship, and five strategies came up again and again: **be light day to day, say what you feel, make the future explicit, carry your share of the house without being asked, and grow friends who belong to both of you.** None of them is a personality trait. Every one can be done tomorrow, tired, with no inspiration at all — which is exactly why they work.\n\nIf you're in a flat stretch, one finding to lift the guilt: a review pooling 165 studies and 165,000 people found that couple satisfaction dips around year 10, bottoms out, and climbs again for many couples. The 10-year valley is common, not a verdict. What your partner sees isn't what you feel, it's what you do. Pick one of the five and do it today."},"image":{"path":"glossary-romance/idea.3.9461a4de.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Gottman & Levenson, 1992 · J. Personality and Social Psychology · n=73 casais","en":"Gottman & Levenson, 1992 · J. Personality and Social Psychology · n=73 couples"},"url":"https://www.johngottman.net/wp-content/uploads/2011/05/Marital-processes-predictive-of-later-dissolution-behavior-physiology-and-health.pdf"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-romance';

-- glossary-learn: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-learn'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- glossary-strength: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-strength'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- glossary-play: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-play'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- glossary-contemplate: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-contemplate'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- glossary-dexterity: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-dexterity'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- glossary-romance: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-romance'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);


-- O vídeo PT de `sofa-um-pedaco` afirma que um hobby exigente entrega 4 dos 4
-- ingredientes do descanso; o texto da ideia diz 3 (e o corte novo deixa o
-- número explícito no verso E no corpo). É o erro que motivou o portão de
-- fidelidade do runner: sai da coluna pra ser gerado de novo, já contra o
-- texto definitivo. O EN, que está correto, fica. O arquivo antigo segue no
-- bucket — reverter é reapontar o caminho.
update public.learning_material m
   set ideas = (
     select jsonb_agg(
              case when i->>'id' = 'sofa-um-pedaco'
                   then jsonb_set(i, '{video,pt}', 'null'::jsonb)
                   else i end
              order by (i->>'ordinal')::int)
       from jsonb_array_elements(m.ideas) i)
 where m.slug = 'glossary-play';

commit;
