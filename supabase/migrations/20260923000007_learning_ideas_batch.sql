-- migration: 20260923000007_learning_ideas_batch.sql
-- purpose: publica as ideias (Recanto em ideias) de 6 material(is) do Learning:
--          attachment-styles-love · 2 ideia(s)
--          attention-residue · 2 ideia(s)
--          catch-up-sleep-weekend · 2 ideia(s)
--          cbt-i-vs-sleep-hygiene · 3 ideia(s)
--          does-money-buy-happiness · 2 ideia(s)
--          explainer-career-capital · 2 ideia(s)
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
--     attachment-styles-love/idea.1.0f1b078a.webp  (960x1200, gemini-api)
--     attachment-styles-love/idea.2.66aa133c.webp  (960x1200, gemini-api)
--     attention-residue/idea.1.e1ed06d0.webp  (960x1200, gemini-api)
--     attention-residue/idea.2.be90ddcc.webp  (960x1200, gemini-api)
--     catch-up-sleep-weekend/idea.1.c073f38c.webp  (960x1200, gemini-api)
--     catch-up-sleep-weekend/idea.3.ac589061.webp  (960x1200, gemini-api)
--     cbt-i-vs-sleep-hygiene/idea.1.39608cd1.webp  (960x1200, gemini-api)
--     cbt-i-vs-sleep-hygiene/idea.2.c2c940ae.webp  (960x1200, gemini-api)
--     cbt-i-vs-sleep-hygiene/idea.4.e3da596c.webp  (960x1200, gemini-api)
--     does-money-buy-happiness/idea.1.0fec5afb.webp  (960x1200, gemini-api)
--     does-money-buy-happiness/idea.3.1793a786.webp  (960x1200, gemini-api)
--     explainer-career-capital/idea.1.834a117a.webp  (960x1200, gemini-api)
--     explainer-career-capital/idea.2.3e876af4.webp  (960x1200, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['attachment-styles-love', 'attention-residue', 'catch-up-sleep-weekend', 'cbt-i-vs-sleep-hygiene', 'does-money-buy-happiness', 'explainer-career-capital']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- attachment-styles-love · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"dois-numeros-nao-rotulo","ordinal":1,"title":{"pt":"Ninguém tem um tipo de apego fixo","en":"Nobody has a fixed attachment type"},"claim":{"pt":"Leia seus dois números de apego como termômetro, não como rótulo: eles mudam com a experiência.","en":"Read your two attachment numbers as a thermometer, not a label: they move with experience."},"body":{"pt":"No ECR-R — as 36 perguntas sobre como você se sente perto de quem ama — você não ganha um tipo. Ganha dois números, medidos em grau. Um é ansiedade de apego: o quanto você fica de olho em sinais de abandono. O outro é evitação: o quanto intimidade e depender de alguém te dão desconforto.\n\n“Ansioso”, “evitativo”, “seguro”, “temeroso” são quadrantes desenhados depois, cruzando esses dois eixos. **Quem criou a medida foi claro: são dimensões contínuas, não diagnósticos** (Fraley, Waller & Brennan, 2000). Os números pesam: numa meta-análise de 132 estudos com 71 mil pessoas, ansiedade e evitação previram menos satisfação, a sua e a do seu parceiro (Candel & Turliuc, 2019). Prever não é condenar — o apego muda com a experiência, mesmo resistindo mais que o humor (Fraley, 2002).\n\nPor isso o rótulo atrapalha: “sou assim” é saída fácil justo onde dá pra mudar. Refaça o ECR-R a cada poucos meses e trate os dois números como termômetro.","en":"The ECR-R — the 36 questions about how you feel around the people you love — does not hand you a type. It hands you two numbers, measured by degree. One is attachment anxiety: how closely you watch for signs of being left. The other is avoidance: how much closeness and depending on someone make you uncomfortable.\n\n“Anxious”, “avoidant”, “secure”, “fearful” are quadrants drawn afterward by crossing those two axes. **The people who built the measure said it plainly: these are continuous dimensions, not diagnoses** (Fraley, Waller & Brennan, 2000). The numbers do carry weight: across 132 studies and 71,000 people, anxiety and avoidance predicted lower satisfaction, yours and your partner's (Candel & Turliuc, 2019). Predicting is not sentencing — attachment shifts with experience, even while it resists more than mood does (Fraley, 2002).\n\nThat is why the label gets in the way: “I'm just like this” is an easy out at the exact spot where change is possible. Retake the ECR-R every few months and treat both numbers as a thermometer."},"image":{"path":"attachment-styles-love/idea.1.0f1b078a.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Candel & Turliuc, 2019 · Personality and Individual Differences · meta-análise, N=71.011","en":"Candel & Turliuc, 2019 · Personality and Individual Differences · meta-analysis, N=71,011"},"url":"https://www.sciencedirect.com/science/article/abs/pii/S0191886919302673"}],"cta":null},{"id":"alarme-e-botao-de-mudo","ordinal":2,"title":{"pt":"Cobrar e se fechar são o mesmo alarme do apego","en":"Chasing and withdrawing are one attachment alarm"},"claim":{"pt":"Na próxima briga, diga “tô me sentindo inseguro agora” em vez de “você nunca me dá atenção”.","en":"In your next fight, say “I'm feeling insecure right now” instead of “you never pay attention to me”."},"body":{"pt":"Uma resposta seca, um silêncio, uma viagem: chega o sinal de ameaça e cada pessoa faz uma coisa com o próprio alarme. Quem pontua alto em ansiedade hiperativa, ou seja, sobe o volume: monitora o clima, cobra reasseguramento, gruda e às vezes protesta — dez mensagens, uma briga provocada, a ameaça de ir embora só pra ver se o outro corre atrás. Quem pontua alto em evitação desativa: aperta o mudo, engole a necessidade, aumenta a distância, se convence de que não precisa de ninguém. Parece calma, e é o mesmo alarme abafado (Mikulincer & Shaver, 2007).\n\nJunte os dois e começa a dança perseguir-recuar. Num estudo com 539 casais recém-casados, dois parceiros inseguros perderam mais satisfação ao longo do tempo do que a conta simples previa (Peters, Meltzer & McNulty, 2025).\n\n**Nomeie o alarme, não o parceiro.** Se você cobra, peça direto: “preciso de dez minutos seus hoje”. Se você se fecha, avise antes: “preciso de um tempo sozinho e já volto”.","en":"A curt reply, a silence, a trip away: the threat signal lands and each person does something with their own alarm. People high on anxiety hyperactivate — they turn the volume up. They track the mood, fish for reassurance, cling, and sometimes protest: ten texts, a picked fight, a threat to leave just to see whether the other person chases. People high on avoidance deactivate — they hit mute. They swallow the need, widen the distance, decide they need nobody. It looks like calm, and it is the same alarm, muffled (Mikulincer & Shaver, 2007).\n\nPut the two together and the pursue-withdraw dance begins. Among 539 newlywed couples, two insecure partners lost more satisfaction over time than simple arithmetic predicted (Peters, Meltzer & McNulty, 2025).\n\n**Name the alarm, not the partner.** If you cling, ask straight out: “I need ten minutes with you today”. If you shut down, give warning: “I need some time alone and I'll be back”."},"image":{"path":"attachment-styles-love/idea.2.66aa133c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Candel & Turliuc, 2019 · Personality and Individual Differences · meta-análise, N=71.011","en":"Candel & Turliuc, 2019 · Personality and Individual Differences · meta-analysis, N=71,011"},"url":"https://www.sciencedirect.com/science/article/abs/pii/S0191886919302673"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'attachment-styles-love';

-- attention-residue · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"residuo-cobra-da-proxima","ordinal":1,"title":{"pt":"A reunião ruim das 14h estraga as 15h","en":"Your bad 2pm meeting wrecks your 3pm"},"claim":{"pt":"Parte do seu foco fica na tarefa anterior e você decide pior na seguinte, mesmo fazendo uma coisa só.","en":"Part of your focus stays on the last task and you decide worse on the next one, even doing one thing."},"body":{"pt":"Sophie Leroy, da Universidade de Washington, montou dois experimentos de laboratório em 2009. Todo mundo começava resolvendo anagramas — embaralhar letras até virar palavra. Uma parte conseguia terminar; a outra era interrompida no meio e mandada pra uma tarefa sem nenhuma relação: ler currículos e decidir quem contratar.\n\nEntre as duas ela encaixou uma tarefa de decisão lexical — a tela pisca sequências de letras e você diz se aquilo é palavra de verdade. Se as palavras do anagrama continuam ativas na sua cabeça, você reconhece elas mais rápido. A velocidade da sua mão entrega onde a atenção ficou.\n\nQuem saiu pela metade carregou mais resíduo e leu os currículos pior. **Não era multitarefa**: na hora dos currículos eles faziam uma coisa só, sem distração nenhuma.\n\nNo seu dia, a reunião ruim das 14h não estraga as 14h. Estraga as 15h, e a culpa cai no sono ou na semana pesada. Quando a hora seguinte render mal, olhe o que ficou aberto na anterior. Ressalva: laboratório, amostra universitária, sem replicação independente.","en":"Sophie Leroy, a researcher at the University of Washington, ran two lab experiments in 2009. Everyone started on anagrams — scrambled letters you rearrange into a word. Some were allowed to finish; the rest were cut off mid-puzzle and pushed into something unrelated: reading résumés and deciding who to hire.\n\nBetween the two she slipped in a lexical decision task — strings of letters flash and you say whether each one is a real word. If the anagram words are still live in your head, you recognize them faster. The speed of your hand gives away where your attention stayed.\n\nThe people cut off mid-puzzle carried more residue, and they read the résumés worse. **This was not multitasking**: during the résumés they were doing one thing, undistracted.\n\nIn your own day, the bad two o'clock meeting doesn't wreck two o'clock. It wrecks three, and you blame the short night. When the next hour goes badly, look at what stayed open in the one before. Caveat: lab work, university samples, no independent replication."},"image":{"path":"attention-residue/idea.1.e1ed06d0.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Leroy, 2009 · Organizational Behavior and Human Decision Processes 109(2):168–181 · dois experimentos de laboratório","en":"Leroy, 2009 · Organizational Behavior and Human Decision Processes 109(2):168–181 · two laboratory experiments"},"url":"https://doi.org/10.1016/j.obhdp.2009.04.002"}],"cta":null},{"id":"terminar-nao-e-fechar","ordinal":2,"title":{"pt":"Terminar a tarefa não solta sua atenção","en":"Finishing a task doesn't free your attention"},"claim":{"pt":"Antes de trocar de tarefa, escreva três linhas: onde parou, o que falta e qual é o próximo passo.","en":"Before you switch tasks, write three lines: where you stopped, what's unresolved and the next step."},"body":{"pt":"A leitura fácil do experimento de Sophie Leroy é “termine o que começou”. Mas entre quem terminou o anagrama, o desempenho não foi igual. Um grupo terminou sob pressão de tempo, com o relógio no pescoço; o outro, sem pressa nenhuma. Quem terminou sob pressão soltou melhor a tarefa e foi melhor na tarefa seguinte. Terminar era idêntico nos dois casos. O que mudou foi a sensação de assunto encerrado, sem pontas soltas.\n\nO que prende sua atenção não é a tarefa inacabada. É o **loop aberto**: a pergunta sem resposta, o “depois eu resolvo”. Terminar é só a forma mais cara de fechar o loop.\n\nA mais barata Leroy testou com Theresa Glomb e batizou de plano de retomada: antes de trocar de tarefa, escreva três linhas — onde parou, o que ficou pendente, qual é o próximo passo. Num estudo de campo com 202 profissionais (Leroy e Glomb, Organization Science, 2018), quem escreveu chegou na tarefa seguinte com menos resíduo, decidiu melhor e lembrou mais informação. Custa um minuto.","en":"The easy reading of Sophie Leroy's experiment is “finish what you start.” But among the people who did finish the anagram, performance was not the same. One group finished under time pressure, clock on their neck; the other finished at leisure. The ones under pressure let go of the task better and did better on the next one. Finishing was identical in both cases. What differed was the sense that the matter was settled, no loose ends.\n\nWhat holds your attention hostage isn't the unfinished task. It's the **open loop**: the unanswered question, the “I'll deal with it later.” Finishing is just the most expensive way to close one.\n\nThe cheapest way Leroy tested with Theresa Glomb and called the ready-to-resume plan: before you switch, write three lines — where you stopped, what's unresolved, what comes next. In a field study with 202 working professionals (Leroy and Glomb, Organization Science, 2018), the people who wrote them arrived at the next task with less residue, decided better and recalled more. It costs a minute."},"image":{"path":"attention-residue/idea.2.be90ddcc.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Leroy, 2009 · Organizational Behavior and Human Decision Processes 109(2):168–181 · dois experimentos de laboratório","en":"Leroy, 2009 · Organizational Behavior and Human Decision Processes 109(2):168–181 · two laboratory experiments"},"url":"https://doi.org/10.1016/j.obhdp.2009.04.002"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'attention-residue';

-- catch-up-sleep-weekend · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"acorda-descansado","ordinal":1,"title":{"pt":"Dormir até tarde no sábado não é pra todo mundo","en":"Sleeping in on Saturday isn't for everyone"},"claim":{"pt":"Dormir mais no fim de semana só compensa quem dorme menos de 6h durante a semana.","en":"Sleeping in on weekends only pays off if you sleep under six hours on weekdays."},"body":{"pt":"Em 2019, Christopher Depner e Kenneth Wright trancaram 36 adultos saudáveis num laboratório por duas semanas. Um grupo dormiu 5 horas por cinco noites, ganhou dois dias livres e voltou pra rotina curta — o seu fim de semana, replicado. Eles dormiram mais de uma hora extra por noite, e mesmo assim a sensibilidade à insulina, o quanto o corpo responde ao hormônio que tira açúcar do sangue, caiu de 9% a 27% (Depner et al., Current Biology, 2019). **Humor e atenção voltam; o metabolismo não volta junto.**\n\nFora do laboratório, o benefício aparece recortado. No ELSA-Brasil (2025), quem compensava mais de 90 minutos teve 38% menos chance de cálcio novo nas coronárias, mas só entre quem dormia pouco na semana. A manchete de 19% menos doença cardíaca saiu de um resumo de congresso sem revisão; com sensor no pulso, o mesmo banco britânico não achou benefício (Chaput et al., Sleep, 2024).\n\nDorme 7 horas nos dias úteis? Essa evidência não fala de você. Menos de 6? O menor risco fica por volta de 40 a 60 minutos extras.","en":"In 2019, Christopher Depner and Kenneth Wright locked 36 healthy adults in a Colorado lab for two weeks. One group slept five hours a night for five nights, got two free days, then went back to the short schedule — your weekend, rebuilt indoors. They did sleep in, more than an extra hour a night. Their insulin sensitivity, how well the body answers the hormone that clears sugar from the blood, still fell by 9% to 27% (Depner et al., Current Biology, 2019). **Mood and focus come back. Your metabolism does not.**\n\nOutside the lab, the benefit is narrow. In ELSA-Brasil (2025), people who caught up more than 90 minutes had 38% lower odds of new calcium in their coronary arteries, but only among those genuinely short during the week. The 19% heart headline came from an unreviewed congress abstract; with wrist sensors, the same British database found no benefit (Chaput et al., Sleep, 2024).\n\nSleeping seven hours on weekdays? This evidence is not about you. Under six? The lowest risk sits near 40 to 60 extra minutes."},"image":{"path":"catch-up-sleep-weekend/idea.1.c073f38c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Depner et al., 2019 · Current Biology 29(6) · ensaio randomizado em laboratório, n=36","en":"Depner et al., 2019 · Current Biology 29(6) · randomized in-laboratory trial, n=36"},"url":"https://doi.org/10.1016/j.cub.2019.01.069"},{"label":{"pt":"Chaput et al., 2024 · Sleep 47(11) · UK Biobank, acelerômetro, n=73.513","en":"Chaput et al., 2024 · Sleep 47(11) · UK Biobank, accelerometer, n=73,513"},"url":"https://doi.org/10.1093/sleep/zsae135"}],"cta":null},{"id":"tres-fusos","ordinal":2,"title":{"pt":"Acordar tarde no sábado atrasa seu relógio","en":"Late Saturday wake-ups delay your body clock"},"claim":{"pt":"No fim de semana, acorde no máximo uma hora mais tarde que nos dias úteis.","en":"On weekends, wake up no more than an hour later than you do on weekdays."},"body":{"pt":"Em 2006, o cronobiólogo Till Roenneberg batizou de jet lag social a diferença entre o meio do seu sono nos dias de trabalho e nos dias livres. Faça a sua conta: meia-noite às 6h na semana dá meio às 3h; das 2h às 11h no sábado, o meio vira 6h30. **Três horas e meia de diferença — como atravessar três fusos toda sexta e voltar toda segunda, sem sair de casa.**\n\nEm 2024, Daniel Windred e colegas processaram mais de 10 milhões de horas de sensor de 60.977 adultos britânicos e montaram um índice de regularidade: o quanto seus horários de deitar e levantar se repetem dia após dia. Os mais regulares morreram de 20% a 48% menos que os mais irregulares, e a regularidade previu melhor que a duração total (Windred et al., Sleep, 2024).\n\nDormir até as 11h faz duas coisas que brigam: repõe horas e empurra o relógio pra frente. Se for compensar, deite mais cedo em vez de levantar mais tarde. E pegue sol nos primeiros 30 minutos depois de acordar, domingo incluído.","en":"In 2006, chronobiologist Till Roenneberg gave it a name: social jetlag, the gap between the midpoint of your sleep on workdays and on free days. Do your own math. Midnight to 6am on weekdays puts the midpoint at 3am; 2am to 11am on Saturday moves it to 6:30am. **Three and a half hours — like crossing three time zones every Friday and flying home every Monday, without leaving your bedroom.**\n\nIn 2024, Daniel Windred and colleagues processed more than 10 million hours of sensor data from 60,977 British adults and built a sleep regularity index: how closely your bed and wake times repeat day after day. The most regular sleepers died 20% to 48% less often than the least regular, and regularity predicted outcomes better than total duration (Windred et al., Sleep, 2024).\n\nSleeping until eleven does two things that fight each other: it puts hours back and pushes your clock later. If you need to catch up, go to bed earlier instead of getting up later. And get outside within 30 minutes of waking, Sunday included."},"image":{"path":"catch-up-sleep-weekend/idea.3.ac589061.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Windred et al., 2024 · Sleep 47(1) · índice de regularidade do sono, n=60.977","en":"Windred et al., 2024 · Sleep 47(1) · sleep regularity index, n=60,977"},"url":"https://doi.org/10.1093/sleep/zsad253"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'catch-up-sleep-weekend';

-- cbt-i-vs-sleep-hygiene · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"lista-nao-e-tratamento","ordinal":1,"title":{"pt":"Você cumpriu a lista do sono. E segue acordado.","en":"You kept the sleep checklist. Still awake."},"claim":{"pt":"Se você dorme mal há mais de três meses, procure terapia cognitivo-comportamental, não outra lista de hábitos.","en":"If you've slept badly for over three months, look for cognitive behavioral therapy, not another habit checklist."},"body":{"pt":"Higiene do sono é a lista que você já conhece: quarto escuro, nada de café à tarde, celular fora da cama. Em 2016, o American College of Physicians revisou os ensaios randomizados e cravou que todo adulto com insônia crônica deve começar pela terapia cognitivo-comportamental para insônia, a TCC-I — um protocolo de quatro a oito semanas, com diário e tarefa de casa. Recomendação forte, evidência de alta qualidade. Cinco anos depois, a Academia Americana de Medicina do Sono sugeriu que clínicos **não usem higiene do sono como terapia isolada**.\n\nIsolada carrega tudo. Café às onze da noite continua má ideia, e a higiene segue como ingrediente dentro da TCC-I. Uma revisão de 2015 liderada por Leah Irish, na Sleep Medicine Reviews, mostrou o buraco: cafeína e álcool são bem estudados, horário de exercício e ruído bem menos, e empilhar itens fracos não vira efeito de tratamento.\n\nInsônia crônica tem endereço: dificuldade de dormir em três noites por semana, por três meses, com custo no dia seguinte. Pra noite ruim ocasional, a lista basta.","en":"Sleep hygiene is the checklist you already know: dark room, no coffee after lunch, phone out of the bedroom. In 2016 the American College of Physicians reviewed the randomized trials and said it plainly — every adult with chronic insomnia should start with cognitive behavioral therapy for insomnia, CBT-I, a four-to-eight week protocol with a diary and homework. Strong recommendation, high-quality evidence. Five years later the American Academy of Sleep Medicine suggested clinicians **not use sleep hygiene as a stand-alone therapy**.\n\nStand-alone carries the whole sentence. Coffee at eleven at night is still a bad idea, and hygiene stays an ingredient inside CBT-I. A 2015 review led by Leah Irish in Sleep Medicine Reviews showed the hole: caffeine and alcohol are well studied, exercise timing and noise much less, and stacking weak items never adds up to a treatment.\n\nChronic insomnia has an address: trouble sleeping three nights a week, for three months, with a cost the next day. For the occasional rough night, the checklist is enough."},"image":{"path":"cbt-i-vs-sleep-hygiene/idea.1.39608cd1.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Qaseem et al., 2016 · Annals of Internal Medicine 165(2) · guideline do American College of Physicians","en":"Qaseem et al., 2016 · Annals of Internal Medicine 165(2) · American College of Physicians guideline"},"url":"https://www.acpjournals.org/doi/10.7326/M15-2175"},{"label":{"pt":"Edinger et al., 2021 · Journal of Clinical Sleep Medicine 17(2) · guideline da American Academy of Sleep Medicine","en":"Edinger et al., 2021 · Journal of Clinical Sleep Medicine 17(2) · American Academy of Sleep Medicine guideline"},"url":"https://pubmed.ncbi.nlm.nih.gov/33164742/"}],"cta":null},{"id":"menos-tempo-na-cama","ordinal":2,"title":{"pt":"Contra a insônia, fique menos tempo na cama","en":"For insomnia, spend less time in bed"},"claim":{"pt":"Fique na cama só as horas em que você realmente dorme e aumente esse tempo 15 minutos por vez.","en":"Stay in bed only for the hours you actually sleep, then add fifteen minutes at a time."},"body":{"pt":"A restrição de sono, criada por Arthur Spielman em 1987, manda o contrário do óbvio. Oito horas e meia deitado e cinco e meia dormindo? A janela permitida encolhe pra perto dessas cinco e meia. O alvo é a pressão homeostática do sono — a fome de sono, que cresce a cada hora acordado e só é saciada dormindo. Cama com sobra de tempo dilui essa fome e devolve sono leve. Cama apertada concentra. Quando você volta a dormir quase todo o tempo em que está deitado, alargue quinze minutos por vez, sempre ancorando a hora de acordar.\n\n**O preço vem antes do prêmio:** na primeira ou segunda semana você fica mais mole de dia. Numa meta-análise de ensaios randomizados, a terapia tirou 26 minutos de vigília no meio da noite, e o ganho seguia no seguimento longo (Trauer et al., Annals of Internal Medicine, 2015).\n\nFaça duas semanas de diário de sono antes de encolher nada. E se você ronca alto ou acorda cansado depois de oito horas na cama, procure médico primeiro: restringir sono não trata apneia.","en":"Sleep restriction, built by Arthur Spielman in 1987, asks for the opposite of the obvious. Eight and a half hours in bed, five and a half asleep? Your allowed window shrinks toward that five and a half. The target is homeostatic sleep pressure — sleep hunger, which builds with every waking hour and is only fed by sleeping. A roomy schedule dilutes that hunger and hands back light sleep. A tight one concentrates it. Once you sleep through almost all your time in bed, widen the window fifteen minutes at a time, always anchoring your wake-up hour.\n\n**The price arrives before the payoff:** the first week or two you feel duller during the day. In a meta-analysis of randomized trials, the therapy cut 26 minutes of night-time wakefulness, and the gain held at long-term follow-up (Trauer et al., Annals of Internal Medicine, 2015).\n\nKeep a sleep diary for two weeks before shrinking anything. And if you snore loudly or wake up exhausted after eight hours in bed, see a doctor first: restricting sleep does not treat apnea."},"image":{"path":"cbt-i-vs-sleep-hygiene/idea.2.c2c940ae.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Qaseem et al., 2016 · Annals of Internal Medicine 165(2) · guideline do American College of Physicians","en":"Qaseem et al., 2016 · Annals of Internal Medicine 165(2) · American College of Physicians guideline"},"url":"https://www.acpjournals.org/doi/10.7326/M15-2175"},{"label":{"pt":"Edinger et al., 2021 · Journal of Clinical Sleep Medicine 17(2) · guideline da American Academy of Sleep Medicine","en":"Edinger et al., 2021 · Journal of Clinical Sleep Medicine 17(2) · American Academy of Sleep Medicine guideline"},"url":"https://pubmed.ncbi.nlm.nih.gov/33164742/"}],"cta":null},{"id":"levante-em-20-minutos","ordinal":3,"title":{"pt":"Ficar acordado na cama alimenta a insônia","en":"Lying awake in bed feeds your insomnia"},"claim":{"pt":"Não pegou no sono em uns 20 minutos, levante e vá pra outro cômodo. Volte só quando estiver com sono.","en":"If sleep hasn't come in 20 minutes, get up and go to another room. Come back only when you feel sleepy."},"body":{"pt":"O controle de estímulo, desenhado por Richard Bootzin em 1972, parte de uma coisa banal: o cérebro aprende por associação. Se você passa duas horas por noite deitado acordado, rolando, planejando, olhando o teto, a cama deixa de ser um sinal de sono e vira um sinal de vigília. Você treinou isso sem querer, noite após noite.\n\nDesfazer o treino tem duas regras. **A cama serve pra dormir e pra sexo, mais nada** — sem ler, sem telefone, sem TV, sem esperar o sono chegar deitado. E se o sono não veio em uns 20 minutos, você levanta, vai pra outro cômodo, faz algo chato com luz fraca e só volta quando estiver com sono de novo. Sem olhar o relógio. Quantas vezes forem necessárias: nas primeiras noites, podem ser cinco.\n\nIsso não é dica de conforto. É uma das peças que fazem o trabalho pesado da terapia cognitivo-comportamental para insônia, o tratamento de primeira linha pra insônia crônica.","en":"Stimulus control, designed by Richard Bootzin in 1972, starts from something ordinary: your brain learns by association. Spend two hours a night lying awake, turning over, planning, staring at the ceiling, and the bed stops being a signal for sleep and becomes a signal for being awake. You trained that without meaning to, night after night.\n\nUndoing the training takes two rules. **The bed is for sleep and for sex, nothing else** — no reading, no phone, no TV, no lying there waiting for sleep to arrive. And if sleep hasn't come in about 20 minutes, you get up, move to another room, do something boring under dim light, and come back only when you feel sleepy again. Without checking the clock. As many times as it takes: the first nights, it can be five.\n\nThis is not a comfort tip. It is one of the pieces doing the heavy lifting in cognitive behavioral therapy for insomnia, the first-line treatment for chronic insomnia."},"image":{"path":"cbt-i-vs-sleep-hygiene/idea.4.e3da596c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Edinger et al., 2021 · Journal of Clinical Sleep Medicine 17(2) · guideline da American Academy of Sleep Medicine","en":"Edinger et al., 2021 · Journal of Clinical Sleep Medicine 17(2) · American Academy of Sleep Medicine guideline"},"url":"https://pubmed.ncbi.nlm.nih.gov/33164742/"},{"label":{"pt":"Qaseem et al., 2016 · Annals of Internal Medicine 165(2) · guideline do American College of Physicians","en":"Qaseem et al., 2016 · Annals of Internal Medicine 165(2) · American College of Physicians guideline"},"url":"https://www.acpjournals.org/doi/10.7326/M15-2175"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'cbt-i-vs-sleep-hygiene';

-- does-money-buy-happiness · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"teto-dos-75-mil","ordinal":1,"title":{"pt":"Pra quem dinheiro não compra felicidade","en":"The people money doesn't make happier"},"claim":{"pt":"Se ganhar mais não mexeu no seu humor, o problema não é dinheiro: é luto, relação ou saúde mental.","en":"If a raise didn't lift your mood, the problem isn't money: it's grief, a relationship or your mental health."},"body":{"pt":"A frase de jantar diz que dinheiro compra felicidade só até uns 75 mil dólares por ano. Em 2023, Daniel Kahneman e Matthew Killingsworth, que vinham defendendo lados opostos, juntaram os dados numa colaboração adversarial: dois rivais desenhando juntos um teste que os dois aceitariam como veredito. O resultado: **pra cerca de 80% das pessoas, a felicidade continua subindo com a renda, sem teto à vista** (Killingsworth, Kahneman & Mellers, 2023). O platô existe, mas mora numa faixa de gente, não numa faixa de salário: pros 15 a 20% que já pontuavam mais baixo em felicidade, ela sobe até uns 100 mil por ano e aí empaca de verdade. O artigo nomeia o que trava esse grupo: **luto, coração partido, depressão clínica**. Ganhar mais não traz ninguém de volta nem cura uma depressão. Então, se o seu último aumento deixou o humor exatamente onde estava, pare de tratar renda como a resposta e olhe pra onde a dor realmente está.","en":"The dinner-table line says money buys happiness only up to about $75,000 a year. In 2023, Daniel Kahneman and Matthew Killingsworth, who had spent years on opposite sides, pooled their data in an adversarial collaboration: two rivals designing together a test both would accept as the verdict. The result: **for roughly 80% of people, happiness keeps climbing with income, with no ceiling in sight** (Killingsworth, Kahneman & Mellers, 2023). The plateau is real, but it lives in a band of people, not a band of salary: for the 15-20% who already scored lowest on happiness, it rises to about $100,000 a year and then genuinely stalls. The paper names what jams that group: **grief, heartbreak, clinical depression**. A bigger paycheck brings nobody back and cures no depression. So if your last raise left your mood exactly where it was, stop treating income as the answer and look at where the pain actually sits."},"image":{"path":"does-money-buy-happiness/idea.1.0fec5afb.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Killingsworth, Kahneman & Mellers, 2023 · PNAS 120(10) · n=33.391","en":"Killingsworth, Kahneman & Mellers, 2023 · PNAS 120(10) · n=33,391"},"url":"https://www.pnas.org/doi/10.1073/pnas.2208661120"}],"cta":null},{"id":"renda-logaritmica","ordinal":2,"title":{"pt":"A felicidade não conta em reais.","en":"Happiness doesn't count in dollars."},"claim":{"pt":"Dobrar de 3 pra 6 mil por mês dá o mesmo salto de felicidade que dobrar de 30 pra 60 mil.","en":"Doubling from $30k to $60k a year buys the same happiness jump as doubling from $300k to $600k."},"body":{"pt":"Nada disso funciona em reais lineares. Funciona em **renda logarítmica**: o que mexe na felicidade não é quantos reais a mais entram na conta, é quantas vezes a sua renda multiplica. Dobrar de 3 pra 6 mil por mês dá mais ou menos o mesmo salto que dobrar de 30 pra 60 mil — só que o segundo salto custa dez vezes mais dinheiro. Cada degrau fica exponencialmente mais caro: nos dados não aparece teto, mas o seu bolso encontra um bem antes. São estudos americanos e correlacionais, e os ganhos lá em cima só foram medidos até uns 500 mil por ano (Killingsworth, Kahneman & Mellers, 2023). Daí duas consequências práticas. Se a sua renda é baixa, aumentá-la é o maior salto disponível, e ele só fica mais caro depois. Se dobrar já virou fantasia, **pare de comprar status e gaste onde o dia dói**: menos deslocamento, menos estresse, mais tempo livre.","en":"None of this runs on linear dollars. It runs on **log income**: what moves happiness is not how many more dollars land in your account, it is how many times your income multiplies. Doubling from $30k to $60k buys roughly the same jump as doubling from $300k to $600k — except the second jump costs ten times as much money. Every step gets exponentially pricier: the data show no ceiling, but your wallet hits one long before. These are American, correlational studies, and the gains up top were only measured out to about $500k a year (Killingsworth, Kahneman & Mellers, 2023). Two practical consequences follow. If your income is low, raising it is the biggest jump on the table, and it only gets pricier from here. Once doubling has turned into fantasy, **stop buying status and spend where the day hurts**: a shorter commute, less stress, more free time."},"image":{"path":"does-money-buy-happiness/idea.3.1793a786.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Killingsworth, Kahneman & Mellers, 2023 · PNAS 120(10) · n=33.391","en":"Killingsworth, Kahneman & Mellers, 2023 · PNAS 120(10) · n=33,391"},"url":"https://www.pnas.org/doi/10.1073/pnas.2208661120"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'does-money-buy-happiness';

-- explainer-career-capital · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"capital-de-carreira","ordinal":1,"title":{"pt":"'Siga sua paixão' inverte a ordem.","en":"'Follow your passion' gets the order backwards."},"claim":{"pt":"Construa uma habilidade rara primeiro. É com ela que você compra autonomia e propósito.","en":"Build a rare skill first. That is what buys you autonomy and meaning."},"body":{"pt":"Quase metade dos trabalhadores com diploma nos Estados Unidos diz que interesse pesa mais que salário na hora de escolher um emprego (Cech, 2021). O conselho virou régua — e inverte a ordem.\n\nCal Newport chama de hipótese da paixão a crença de que existe dentro de você uma paixão pronta esperando ser descoberta. **O que torna um trabalho ótimo — autonomia, impacto, criatividade — é raro, e coisa rara só se compra com coisa rara: uma habilidade que pouca gente tem.** Newport chama essa moeda de capital de carreira.\n\nNa prática: escolha uma habilidade que o mercado paga e que você já faz razoavelmente bem, treine o ponto específico que ainda faz mal e dê meses antes de julgar. Quando ela ficar rara, use pra negociar autonomia e projetos melhores.\n\nDuas ressalvas honestas. **O livro de Newport é síntese jornalística, não ciência revisada por pares.** E perseguir paixão é em parte privilégio: trabalhadores de origem operária que seguem esse princípio acabam com mais frequência em empregos instáveis e mal pagos (Cech, 2021).","en":"Nearly half of degree-holding workers in the US say interest matters more than pay when they pick a job (Cech, 2021). The advice became the yardstick. It also has the order backwards.\n\nCal Newport calls it the passion hypothesis: the belief that a finished passion sits inside you, waiting to be found. **What makes work great — autonomy, impact, creativity — is rare, and rare things are bought only with rare things: a skill few people have.** Newport calls that currency career capital.\n\nIn practice: pick a skill the market pays for that you already do decently, drill the specific part you still do badly, and give it months before you judge. Once the skill is rare, trade it for autonomy and better projects.\n\nTwo honest caveats. **Newport's book is popular synthesis, not peer-reviewed science.** And chasing passion is partly a privilege: workers from working-class backgrounds who follow it end up more often in unstable, badly paid jobs (Cech, 2021)."},"image":{"path":"explainer-career-capital/idea.1.834a117a.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"O'Keefe, Dweck & Walton, 2018 · Psychological Science, 29(10) · 5 estudos, ~470 participantes","en":"O'Keefe, Dweck & Walton, 2018 · Psychological Science, 29(10) · 5 studies, ~470 participants"},"url":"https://doi.org/10.1177/0956797618780643"}],"cta":null},{"id":"interesse-construido","ordinal":2,"title":{"pt":"Quem acha que a paixão é pronta desiste antes.","en":"Thinking passion is ready-made makes you quit."},"claim":{"pt":"Quando a vontade cair, pergunte se a área está errada ou se você só chegou no platô.","en":"When your drive drops, ask whether the field is wrong or you just hit the plateau."},"body":{"pt":"Em 2018, O'Keefe, Dweck e Walton testaram duas formas de encarar o interesse, em cinco estudos com cerca de 470 pessoas (Psychological Science). Na teoria fixa, as paixões já existem prontas e você apenas as descobre. Na teoria de crescimento, o interesse se desenvolve conforme você se envolve com algo.\n\nO grupo de mentalidade fixa mostrou menos curiosidade por qualquer coisa fora do foco atual. E o achado decisivo: **quando um interesse novo ficava difícil, a vontade dessas pessoas caía muito mais do que a do grupo de crescimento.** O efeito era causal — empurrar alguém pra visão fixa já produzia a queda.\n\nPense em quem largou o violão, a programação ou um idioma exatamente quando o brilho de iniciante passou e o platô começou. **A habilidade não sumiu; o conforto sumiu.**\n\nEntão, quando a vontade despencar, separe as duas coisas. A área está mesmo errada — às vezes está (Chen, Ellsworth e Schwarz, 2015) — ou você só chegou no platô.","en":"In 2018, O'Keefe, Dweck and Walton tested two ways of seeing interest, across five studies with around 470 people (Psychological Science). Under a fixed theory, passions already exist, fully formed, and you merely find them. Under a growth theory, interest develops as you engage with something.\n\nThe fixed-mindset group showed less curiosity about anything outside its current focus. And the decisive finding: **when a new interest got hard, their motivation fell far more than the growth group's.** The effect was causal — nudging people toward the fixed view produced the drop by itself.\n\nThink of anyone who quit guitar, coding or a language right when the beginner glow wore off and the plateau began. **The skill did not vanish; the comfort did.**\n\nSo when your drive collapses, separate the two. The field really is wrong — sometimes it is (Chen, Ellsworth and Schwarz, 2015) — or you just reached the plateau."},"image":{"path":"explainer-career-capital/idea.2.3e876af4.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"O'Keefe, Dweck & Walton, 2018 · Psychological Science, 29(10) · 5 estudos, ~470 participantes","en":"O'Keefe, Dweck & Walton, 2018 · Psychological Science, 29(10) · 5 studies, ~470 participants"},"url":"https://doi.org/10.1177/0956797618780643"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'explainer-career-capital';

-- attachment-styles-love: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'attachment-styles-love'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- attention-residue: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'attention-residue'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- catch-up-sleep-weekend: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'catch-up-sleep-weekend'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- cbt-i-vs-sleep-hygiene: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'cbt-i-vs-sleep-hygiene'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- does-money-buy-happiness: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'does-money-buy-happiness'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- explainer-career-capital: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'explainer-career-capital'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
