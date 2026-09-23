-- migration: 20260923000004_learning_ideas_batch.sql
-- purpose: publica as ideias (Recanto em ideias) de 6 material(is) do Learning:
--          summary-antifragile · 3 ideia(s)
--          summary-atomic-habits · 3 ideia(s)
--          summary-outlive · 4 ideia(s)
--          summary-psychology-of-money · 3 ideia(s)
--          summary-why-we-sleep · 3 ideia(s)
--          job-crafting-additive · 2 ideia(s)
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
--     summary-antifragile/idea.1.a8344274.webp  (960x1200, gemini-api)
--     summary-antifragile/idea.2.69d947bb.webp  (960x1200, gemini-api)
--     summary-antifragile/idea.3.5ec0a623.webp  (960x1200, gemini-api)
--     summary-atomic-habits/idea.1.d9ac80d6.webp  (960x1200, gemini-api)
--     summary-atomic-habits/idea.3.df9de58f.webp  (960x1200, gemini-api)
--     summary-atomic-habits/idea.4.dc08dff9.webp  (960x1200, gemini-api)
--     summary-outlive/idea.1.13c1f540.webp  (960x1200, gemini-api)
--     summary-outlive/idea.2.95725b1d.webp  (960x1200, gemini-api)
--     summary-outlive/idea.3.6e777519.webp  (960x1200, gemini-api)
--     summary-outlive/idea.4.1ccaca53.webp  (960x1200, gemini-api)
--     summary-psychology-of-money/idea.1.40e891c8.webp  (960x1200, gemini-api)
--     summary-psychology-of-money/idea.3.34d8269f.webp  (960x1200, gemini-api)
--     summary-psychology-of-money/idea.4.761dae89.webp  (960x1200, gemini-api)
--     summary-why-we-sleep/idea.2.720137d7.webp  (960x1200, gemini-api)
--     summary-why-we-sleep/idea.3.7d3bd99f.webp  (960x1200, gemini-api)
--     summary-why-we-sleep/idea.4.81ed5228.webp  (960x1200, gemini-api)
--     job-crafting-additive/idea.2.bf07795e.webp  (960x1200, gemini-api)
--     job-crafting-additive/idea.3.07d9d4dd.webp  (960x1200, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['summary-antifragile', 'summary-atomic-habits', 'summary-outlive', 'summary-psychology-of-money', 'summary-why-we-sleep', 'job-crafting-additive']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- summary-antifragile · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"terceiro-estado","ordinal":1,"title":{"pt":"Antifrágil não é o mesmo que resistente.","en":"Antifragile is not the same as resilient."},"claim":{"pt":"Sem estresse o corpo atrofia: programe desconforto toda semana, como um treino pesado ou um banho frio.","en":"Without stress the body wastes away: schedule discomfort every week, like a hard workout or a cold shower."},"body":{"pt":"O vento apaga uma vela e alimenta uma fogueira. Taleb abre o livro com essa imagem e organiza o mundo em três figuras. Dâmocles, o frágil, janta sob uma espada presa por um fio: um evento ruim destrói tudo. A Fênix, o resiliente, renasce das cinzas — apanha e volta ao estado original, sem aprender nada. A Hidra é o antifrágil: corte uma cabeça e nascem duas. **O dano é justamente o que a fortalece.**\n\nO mecanismo tem nome: hormese — uma dose pequena de estresse fortalece, mesmo que a dose grande destrua. Na toxicologia, curvas de dose que estimulam em quantidade baixa e prejudicam em quantidade alta são mais comuns do que se supunha (Calabrese & Baldwin, Nature, 2003).\n\nMúsculo cresce porque o treino o danifica primeiro. Osso mantém densidade porque a carga o desafia — a Lei de Wolff. Sem estressores, o corpo atrofia, como depois de um mês de cama. **Programe desconforto voluntário toda semana**: um treino pesado, um banho frio, um jejum curto.","en":"The wind snuffs out a candle and feeds a bonfire. Taleb opens the book with that image and sorts the world into three figures. Damocles, the fragile, dines under a sword hung by a single hair: one bad event ends everything. The Phoenix, the resilient, rises from the ashes — takes the hit, returns to its original state, learns nothing. The Hydra is the antifragile: cut off one head and two grow back. **Harm is exactly what makes it stronger.**\n\nThe mechanism has a name: hormesis — a small dose of a stressor strengthens, even though a large dose would destroy. In toxicology, dose curves that stimulate at low amounts and harm at high ones are far more common than once assumed (Calabrese & Baldwin, Nature, 2003).\n\nMuscle grows because training damages it first. Bone keeps its density because load keeps challenging it — Wolff's Law. Strip a body of stressors and it wastes away, like after a month in bed. **Schedule voluntary discomfort every week** — a hard workout, a cold shower, a short fast."},"image":{"path":"summary-antifragile/idea.1.a8344274.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Antifrágil — Nassim Taleb (Random House, 2012)","en":"Antifragile — Nassim Taleb (Random House, 2012)"},"url":"https://www.penguinrandomhouse.com/books/176227/antifragile-by-nassim-nicholas-taleb/"}],"cta":null},{"id":"via-negativa","ordinal":2,"title":{"pt":"Melhorar começa por tirar, não por somar.","en":"Improving starts by removing, not adding."},"claim":{"pt":"Na dúvida entre adicionar e remover, remova. Comece tirando um ultraprocessado ou uma assinatura.","en":"When torn between adding and removing, remove. Start by cutting one ultra-processed food or one subscription."},"body":{"pt":"Se estresse na dose certa fortalece, eliminar todo desconforto cobra um preço escondido. Taleb dá nome a quem nos cobra: o fragilista — quem intervém num sistema complexo atrás de um ganho pequeno e visível, ignorando o dano grande e invisível. O médico que prescreve remédio pra qualquer incômodo passageiro. O pai que corta da infância a tentativa e erro.\n\nO dano causado por quem queria ajudar tem nome: iatrogenia — o prejuízo provocado pelo próprio tratamento. Taleb pega o termo de Ivan Illich, que em *Medical Nemesis* (1975) já acusava a medicina industrializada de patologizar o normal.\n\nA heurística mais prática do livro é a via negativa: você ganha mais tirando do que acrescentando. **A intervenção é que precisa provar que é segura; o seu corpo não precisa provar que se cura sozinho.** Por décadas, a ausência de evidência de dano sustentou o cigarro, a gordura trans e a talidomida — até a evidência aparecer. Comece por uma subtração: um ultraprocessado, uma assinatura, um hábito que te fragiliza. Na dúvida entre adicionar e remover, remova.","en":"If the right dose of stress strengthens you, erasing every discomfort carries a hidden bill. Taleb names the person who hands it over: the fragilista — someone who meddles in a complex system for a small, visible gain while ignoring the large, invisible harm. The doctor who medicates every passing ache. The parent who edits trial and error out of childhood.\n\nHarm done by the would-be helper has a name too: iatrogenics — injury caused by the treatment itself. Taleb borrows it from Ivan Illich, whose *Medical Nemesis* (1975) accused industrialized medicine of pathologizing the normal.\n\nThe book's most practical rule is the via negativa: you gain more by removing than by adding. **The intervention has to prove it's safe; your body doesn't have to prove it can heal itself.** For decades, absence of evidence of harm propped up smoking, trans fats and thalidomide — until the evidence showed up. Start with one subtraction: an ultra-processed food, a subscription, a habit that makes you fragile. When torn between adding and removing, remove."},"image":{"path":"summary-antifragile/idea.2.69d947bb.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Antifrágil — Nassim Taleb (Random House, 2012)","en":"Antifragile — Nassim Taleb (Random House, 2012)"},"url":"https://www.penguinrandomhouse.com/books/176227/antifragile-by-nassim-nicholas-taleb/"}],"cta":null},{"id":"barbell","ordinal":3,"title":{"pt":"O dinheiro antifrágil não fica no meio-termo","en":"Antifragile money never sits in the middle"},"claim":{"pt":"Ponha algo como 90% do dinheiro em segurança extrema e 10% em apostas ousadas. Nada no meio.","en":"Put something like 90% of your money in extreme safety and 10% in bold bets. Nothing in the middle."},"body":{"pt":"Antifragilidade não é buscar risco a esmo. É estruturar a exposição. A estratégia barbell (halteres, em inglês) carrega peso só nas duas pontas e evita o meio — onde moram os riscos que ninguém enxerga. Nas finanças, Taleb ilustra com algo como 90% em segurança extrema e 10% em apostas de altíssimo risco (*Antifrágil*, 2012). **A perda máxima fica travada; o ganho fica em aberto.** Investir \"moderado\" parece prudente, mas é onde a perda não tem trava.\n\nFora do dinheiro, a forma é a mesma. Na carreira: um trabalho estável que paga as contas mais um projeto ousado nas horas livres.\n\nA prova do barbell é, em boa parte, o histórico de trader do próprio Taleb — com o conflito de interesse de quem elogia a estratégia que o enriqueceu. A Kirkus Reviews chamou o livro de \"mais sugestivo do que prescritivo\". A biologia é real; o salto pra mercados e carreiras é analogia, não teoria testada. Monte o seu barbell sabendo disso: quase tudo em segurança, uma fatia pequena em ousadia, nada no meio.","en":"Antifragility isn't chasing risk at random. It's structuring your exposure. The barbell strategy loads weight only at the two ends and skips the middle — where the risks nobody sees live. In money, Taleb illustrates it as roughly 90% in extreme safety and 10% in very high-risk bets (*Antifragile*, 2012). **The worst loss is capped; the gain stays open.** Investing \"moderately\" feels prudent, but it's exactly where the loss has no floor.\n\nBeyond money, the shape is the same. In a career: a stable job that pays the bills plus a bold side project on your own time.\n\nThe evidence for the barbell is largely Taleb's own trading record — with the obvious conflict of a man praising the strategy that made him rich. Kirkus Reviews called the book \"more suggestive than prescriptive.\" The biology is real; the leap to markets and careers is analogy, not tested theory. Build your barbell knowing that: almost everything in safety, a small slice in boldness, nothing in the middle."},"image":{"path":"summary-antifragile/idea.3.5ec0a623.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Antifrágil — Nassim Taleb (Random House, 2012)","en":"Antifragile — Nassim Taleb (Random House, 2012)"},"url":"https://www.penguinrandomhouse.com/books/176227/antifragile-by-nassim-nicholas-taleb/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'summary-antifragile';

-- summary-atomic-habits · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"66-dias-nao-21","ordinal":1,"title":{"pt":"Um hábito novo não se fixa em 21 dias","en":"A new habit does not stick in 21 days"},"claim":{"pt":"Um hábito novo leva 66 dias pra virar automático, não 21. Se ele for difícil, pode levar 254.","en":"A new habit goes automatic at 66 days, not 21. If it is a hard one, it can take 254."},"body":{"pt":"Em 1960, o cirurgião plástico Maxwell Maltz reparou que seus pacientes levavam \"no mínimo uns 21 dias\" pra se acostumar com o rosto novo. Observação de corredor, nenhum experimento. Meio século depois, alguém finalmente cronometrou.\n\nEm 2010, Phillippa Lally (University College London) acompanhou 96 voluntários repetindo um comportamento novo no mesmo contexto por 12 semanas. **A automaticidade média chegou aos 66 dias, com intervalo real de 18 a 254**, dependendo da pessoa e da tarefa. Beber um copo d'água vira automático rápido; 50 abdominais, não.\n\nO achado mais útil nem é o número. Perder um dia isolado não derrubou a curva de ninguém — o hábito não zera porque você faltou numa terça. **\"Nunca falhe duas vezes seguidas\"** é dos raros conselhos de hábito com respaldo experimental direto.\n\nEntão pare de contar dias e adote a regra: um dia perdido é ruído, dois seguidos viram tendência. E se o hábito que você escolheu é grande, conte com o lado longo do intervalo.","en":"In 1960, plastic surgeon Maxwell Maltz noticed his patients needed \"a minimum of about 21 days\" to get used to their new face. A hallway observation, not an experiment. Half a century later, someone finally put a stopwatch on it.\n\nIn 2010, Phillippa Lally (University College London) tracked 96 volunteers repeating a new behavior in the same context for 12 weeks. **Automaticity landed at 66 days on average, with a real range of 18 to 254**, depending on the person and the task. A glass of water goes automatic fast; 50 sit-ups, not so much.\n\nThe most useful finding isn't the number. Missing a single day dented nobody's curve — your habit doesn't reset because you skipped a Tuesday. **\"Never miss twice\"** is one of the rare habit tips with direct experimental backing.\n\nSo stop counting days and take the rule instead: one missed day is noise, two in a row is a trend. And if the habit you picked is a big one, plan for the long end of that range."},"image":{"path":"summary-atomic-habits/idea.1.d9ac80d6.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Hábitos Atômicos — James Clear (Avery, 2018)","en":"Atomic Habits — James Clear (Avery, 2018)"},"url":"https://jamesclear.com/atomic-habits"}],"cta":null},{"id":"ambiente-vence-vontade","ordinal":2,"title":{"pt":"Ambiente vence força de vontade nos hábitos","en":"Environment beats willpower on habits"},"claim":{"pt":"Encaixe o hábito novo logo depois de um que você já faz: \"depois do café, dois minutos de leitura\".","en":"Bolt the new habit onto one you already do: \"after coffee, two minutes of reading\"."},"body":{"pt":"Wendy Wood mostrou que hábito não é decisão: é uma associação contexto → resposta gravada pela repetição. A deixa aparece no ambiente e a resposta vem atrás, quase sempre enquanto você pensa em outra coisa. Cerca de 43% do comportamento diário se repete no mesmo cenário (Wood, 2019). **Por isso ambiente vence força de vontade** — quando a vontade entra em cena, a deixa já disparou.\n\nO loop que Clear usa — deixa, desejo, resposta, recompensa — não é descoberta dele. É o ciclo que Charles Duhigg popularizou em 2012, e a neurociência embaixo foi medida em ratos num labirinto, não em gente formando hábito no dia a dia.\n\nA parte prática não depende disso. Mude o cenário antes de tentar mudar você: **encaixe o hábito novo logo depois de um que já existe** e encolha ele até caber em dois minutos — \"ler uma página\", não \"ler trinta\".","en":"Wendy Wood showed a habit isn't a decision: it's a context → response association carved by repetition. The cue shows up in your surroundings and the response follows, usually while you're thinking about something else. About 43% of daily behavior repeats in the same setting (Wood, 2019). **That's why environment beats willpower** — by the time willpower arrives, the cue has already fired.\n\nThe loop Clear uses — cue, craving, response, reward — isn't his discovery. It's the cycle Charles Duhigg popularized in 2012, and the neuroscience under it was measured in rats running a maze, not in people forming habits day to day.\n\nThe practical part doesn't depend on that. Change the setting before you try to change yourself: **bolt the new habit onto one you already do** and shrink it until it fits in two minutes — \"read one page\", not \"read thirty\"."},"image":{"path":"summary-atomic-habits/idea.3.df9de58f.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Hábitos Atômicos — James Clear (Avery, 2018)","en":"Atomic Habits — James Clear (Avery, 2018)"},"url":"https://jamesclear.com/atomic-habits"}],"cta":null},{"id":"voto-na-identidade","ordinal":3,"title":{"pt":"O hábito pega quando vira identidade","en":"A habit sticks when it becomes identity"},"claim":{"pt":"Troque \"estou tentando parar de fumar\" por \"eu não sou fumante\" e cheque se o hábito aconteceu.","en":"Swap \"I'm trying to quit smoking\" for \"I'm not a smoker\", then check whether the habit happened."},"body":{"pt":"O teste do Clear é simples. \"Estou tentando parar de fumar\" preserva a identidade de fumante; \"eu não sou fumante\" troca ela. Cada ação vira um voto na pessoa que você está se tornando, e a mudança deixa de depender de quanto você aguenta.\n\nÉ também o pilar com menos prova. Clear apoia a identidade na teoria de autoeficácia de Albert Bandura, de 1977 — uma teoria geral e respeitada sobre a crença na própria capacidade, **não um estudo que isole a mudança de identidade como causa da durabilidade do hábito**. É a ideia mais citada em conversa de bar e a menos testada em laboratório.\n\nUse como bússola, não como lei. Escreva a frase no presente — \"eu sou alguém que treina\" — e deixe ela escolher o hábito da semana. **Depois meça se o hábito aconteceu**, que é a parte que dá pra provar.","en":"Clear's test is simple. \"I'm trying to quit smoking\" keeps the smoker's identity; \"I'm not a smoker\" swaps it. Every action becomes a vote for the person you're becoming, and change stops riding on how much strain you can take.\n\nIt's also the pillar with the least proof. Clear rests identity on Albert Bandura's 1977 self-efficacy theory — a respected, general theory about belief in your own capability, **not a study isolating identity change as the cause of a habit's durability**. It's the idea most quoted in casual talk and the least tested in a lab.\n\nUse it as a compass, not a law. Write the sentence in the present tense — \"I'm someone who trains\" — and let it pick this week's habit. **Then measure whether the habit actually happened**, which is the part you can prove."},"image":{"path":"summary-atomic-habits/idea.4.dc08dff9.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Hábitos Atômicos — James Clear (Avery, 2018)","en":"Atomic Habits — James Clear (Avery, 2018)"},"url":"https://jamesclear.com/atomic-habits"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'summary-atomic-habits';

-- summary-outlive · 4 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"quatro-cavaleiros","ordinal":1,"title":{"pt":"Quatro doenças matam a maioria depois dos 50","en":"Four diseases kill most people after 50"},"claim":{"pt":"Quatro doenças matam a maioria dos adultos, e a resistência à insulina liga as quatro.","en":"Four diseases kill most adults after 50, and insulin resistance links all four."},"body":{"pt":"Attia organiza a mortalidade adulta depois dos 50 em quatro famílias de doença: cardiovascular ateroesclerótica (infarto, AVC), câncer, neurodegenerativa (Alzheimer) e diabetes tipo 2. Juntas, respondem por cerca de 80% das mortes não-acidentais nos países ricos — pelos números de mortalidade que ele cita em Outlive. São os Quatro Cavaleiros, e o cardiologista Eric Topol chamou essa apresentação para o leigo de melhor que já viu.\n\nA jogada vem depois: a resistência à insulina — a condição metabólica que precede o diabetes tipo 2 — também aparece como fator de risco nas outras três. Daí o apelido “Diabetes Tipo 3” para o Alzheimer, proposto antes dele e popularizado por ele. **Uma raiz única é poderosa como didática e reducionista como mecanismo**: o papel da insulina em câncer e Alzheimer segue hipótese, não consenso.\n\nTrate a saúde metabólica como o terreno comum das quatro doenças, e a raiz única como uma suspeita ainda em aberto. O pedaço que já é consenso é o cardiovascular.","en":"Attia sorts adult mortality after 50 into four disease families: atherosclerotic cardiovascular disease (heart attack, stroke), cancer, neurodegenerative disease (Alzheimer's) and type 2 diabetes. Together they account for about 80% of non-accidental deaths in wealthy countries — by the mortality figures he cites in Outlive. He calls them the Four Horsemen, and cardiologist Eric Topol called that lay presentation the best he has ever seen.\n\nThe move comes next: insulin resistance — the metabolic condition that precedes type 2 diabetes — also shows up as a risk factor in the other three. Hence the “Type 3 Diabetes” label for Alzheimer's, coined before him and popularized by him. **A single root is powerful teaching and reductive mechanism**: insulin's role in cancer and Alzheimer's is still hypothesis, not consensus.\n\nTreat metabolic health as the common ground of all four diseases, and the single root as a suspicion still open. The piece that is already consensus is the cardiovascular one."},"image":{"path":"summary-outlive/idea.1.13c1f540.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Attia, P. — Outlive · Harmony, 2023. Resenha: Topol · Ground Truths","en":"Attia, P. — Outlive · Harmony, 2023. Review: Topol · Ground Truths"},"url":"https://erictopol.substack.com/p/a-review-of-outlive"}],"cta":null},{"id":"risco-treinavel","ordinal":2,"title":{"pt":"Sedentarismo pesa mais que cigarro","en":"Being unfit weighs more than smoking"},"claim":{"pt":"Sair do fundo do condicionamento aeróbico reduz mais o seu risco de morrer do que parar de fumar.","en":"Climbing out of the bottom of aerobic fitness cuts your risk of dying more than quitting smoking."},"body":{"pt":"Se você fosse mudar uma coisa só, seria essa. Attia diz que, se pudesse prescrever um único medicamento para saúde e longevidade, seria exercício. O número por trás disso: sair dos 25% piores de capacidade cardiorrespiratória — o seu condicionamento aeróbico — para os 25% melhores corresponde a aproximadamente 5 vezes menos risco de morte, **efeito maior que parar de fumar**. São 122 mil pessoas, no JAMA Network Open, 2018 (Mandsager et al.).\n\nA receita que ele defende: cerca de 80% do volume em Zone 2 — a faixa aeróbica em que o corpo ainda queima principalmente gordura como combustível — e 20% em trabalho de VO2 max, a capacidade máxima de consumir oxigênio sob esforço, treinada em intervalos intensos. Mais força pesada, estabilidade e mobilidade.\n\nA direção é boa ciência; a proporção exata, não. O 80/20 vem do treino de elite de endurance, e a evidência de ensaios randomizados para o adulto comum é fina — o médico Brad Stanfield aponta isso. Fique com a forma: quase todo o volume fácil, uma fatia curta e intensa.","en":"If you only change one thing, change this. Attia says that if he could prescribe a single drug for health and longevity, it would be exercise. The number behind it: moving from the bottom 25% of cardiorespiratory fitness — your aerobic conditioning — to the top 25% corresponds to roughly 5 times lower mortality risk, **a larger effect than quitting smoking**. That is 122,000 people, in JAMA Network Open, 2018 (Mandsager et al.).\n\nThe recipe he advocates: about 80% of your volume in Zone 2 — the aerobic range where the body still burns mostly fat as fuel — and 20% in VO2 max work, the maximum oxygen your body can use under effort, trained in hard intervals. Plus heavy strength, stability and mobility.\n\nThe direction is good science; the exact split is not. The 80/20 comes from elite endurance training, and randomized-trial evidence for the average adult is thin — physician Brad Stanfield makes that point. Keep the shape: nearly all your volume easy, one short hard slice."},"image":{"path":"summary-outlive/idea.2.95725b1d.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Attia, P. — Outlive · Harmony, 2023. Resenha: Topol · Ground Truths","en":"Attia, P. — Outlive · Harmony, 2023. Review: Topol · Ground Truths"},"url":"https://erictopol.substack.com/p/a-review-of-outlive"}],"cta":null},{"id":"decatlo-centenario","ordinal":3,"title":{"pt":"Treine hoje para o corpo dos seus 80 anos","en":"Train today for the body you will have at 80"},"claim":{"pt":"Chegue aos 50 com o dobro da forma que você vai precisar aos 80.","en":"Reach 50 with twice the capacity you will need at 80."},"body":{"pt":"Attia propõe um exercício de planejamento que chama de Decatlo Centenário. A pergunta é simples: que tarefas físicas você quer ainda conseguir fazer na sua Década Marginal, os últimos 10 anos de vida? Carregar uma mala de 30 libras, levantar do chão sem ajuda, pegar um neto no colo. A lista é sua, e é ela que vira o alvo do treino.\n\nA conta que sustenta o método: a função decai de 10 a 15% por década depois dos 50 — número que Attia cita em Outlive para justificar o Decatlo. **Para levantar do chão sem ajuda aos 80, você precisa chegar aos 50 com o dobro da forma que vai precisar lá.** Treinar para o que você aguenta hoje é treinar para perder.\n\nO ganho aqui é direção concreta. Em vez de “ficar em forma”, você treina para uma tarefa com data marcada. Escreva cinco coisas que quer poder fazer aos 80 e deixe que elas escolham o seu treino.","en":"Attia proposes a planning exercise he calls the Centenarian Decathlon. The question is simple: which physical tasks do you want to still perform in your Marginal Decade, the last 10 years of your life? Carry a 30-lb suitcase, get off the floor unaided, lift a grandchild. The list is yours, and it becomes the target your training aims at.\n\nThe arithmetic behind the method: function declines 10 to 15% per decade after 50 — a figure Attia cites in Outlive to justify the Decathlon. **To get off the floor unaided at 80, you have to arrive at 50 twice as fit as you will need to be then.** Training for what you can handle today is training to fall short.\n\nThe gain here is concrete direction. Instead of “getting in shape,” you train for a task with a date on it. Write down five things you want to still do at 80 and let them pick your workouts."},"image":{"path":"summary-outlive/idea.3.6e777519.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Attia, P. — Outlive · Harmony, 2023. Resenha: Topol · Ground Truths","en":"Attia, P. — Outlive · Harmony, 2023. Review: Topol · Ground Truths"},"url":"https://erictopol.substack.com/p/a-review-of-outlive"}],"cta":null},{"id":"aposta-cara","ordinal":4,"title":{"pt":"Dois exames que o check-up comum não pede","en":"Two blood tests your check-up skips"},"claim":{"pt":"Peça apoB no próximo exame de sangue e Lp(a) uma vez na vida.","en":"Ask for apoB at your next blood test, and Lp(a) once in your life."},"body":{"pt":"O capítulo de rastreamento é o mais contestado do livro. Attia defende ressonância de corpo inteiro de rotina para achar câncer cedo, e Eric Topol criticou isso explicitamente: cascata de biópsias por achados acidentais, ansiedade do paciente e zero ganho de mortalidade comprovado em quem não tem fator de risco específico.\n\nA farmacologia é ainda mais especulativa. Attia toma rapamicina off-label. Em camundongos, o sinal de extensão de vida é o mais forte de qualquer droga já testada — mas em humanos não há dados de desfecho de longo prazo, e **o ensaio PEARL, de 2024, foi largamente nulo nos desfechos funcionais que mediu**. Some a clínica dele, que cobra, segundo relatos, entre cinco e seis dígitos por ano.\n\nO que sobra é barato. Peça apoB — a proteína que carrega o colesterol ruim e prediz risco cardíaco melhor que o LDL clássico — no próximo exame de rotina. E peça Lp(a), uma partícula de colesterol herdada geneticamente, uma vez: o valor quase não muda com dieta, então testou uma vez, resolveu.","en":"The screening chapter is the most contested part of the book. Attia advocates routine whole-body MRI to catch cancer early, and Eric Topol criticized that explicitly: a cascade of biopsies from incidental findings, patient anxiety, and zero proven mortality benefit in people without a specific risk factor.\n\nPharmacology is more speculative still. Attia takes rapamycin off-label. In mice, the lifespan extension signal is the strongest of any drug ever tested — but in humans there is no long-term outcome data, and **the 2024 PEARL trial came out largely null on the functional endpoints it measured**. Add his clinic, which reportedly charges five to six figures a year.\n\nWhat is left costs almost nothing. Ask for apoB — the protein that carries bad cholesterol and predicts cardiac risk better than classic LDL — at your next routine blood draw. And ask for Lp(a), a cholesterol particle you inherit, once: the value barely moves with diet, so test once and you are done."},"image":{"path":"summary-outlive/idea.4.1ccaca53.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Attia, P. — Outlive · Harmony, 2023. Resenha: Topol · Ground Truths","en":"Attia, P. — Outlive · Harmony, 2023. Review: Topol · Ground Truths"},"url":"https://erictopol.substack.com/p/a-review-of-outlive"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'summary-outlive';

-- summary-psychology-of-money · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"comportamento-vence-diploma","ordinal":1,"title":{"pt":"Entender de dinheiro não é enriquecer","en":"Knowing finance is not getting rich"},"claim":{"pt":"O que faz alguém enriquecer é comportamento, e o seu vem da década em que você cresceu.","en":"What makes someone rich is behavior, and yours comes from the decade you grew up in."},"body":{"pt":"Em 2010, Grace Groner morreu aos 100 anos e deixou cerca de 7 milhões de dólares para caridade. Secretária aposentada, nunca teve carro e morava num apartamento de um cômodo: nos anos 1930 comprou algumas ações modestas e esqueceu delas por mais de sessenta anos. No mesmo ano, Richard Fuscone — formado em Harvard e Chicago, ex-vice-presidente da Merrill Lynch na América Latina — declarou falência pessoal. **Uma sabia menos e ficou rica; o outro sabia tudo e quebrou.**\n\nPara Morgan Housel, dinheiro é habilidade branda, não técnica. E o comportamento tem origem: em \"Depression Babies\" (2011), os economistas Ulrike Malmendier e Stefan Nagel cruzaram dados domésticos americanos de 1964 a 2004 e acharam algo teimoso — quem viveu anos de bolsa ruim arrisca menos pelo resto da vida, mesmo depois de a economia se recuperar. Seu apetite a risco (o quanto de perda você tolera para perseguir ganho) é em parte um acidente da década em que você cresceu. Pergunte qual susto antigo ainda decide por você hoje.","en":"In 2010 Grace Groner died at 100 and left about $7 million to charity. A retired secretary, she never owned a car and lived in a one-room apartment: in the 1930s she bought a few modest shares and forgot about them for more than sixty years. That same year Richard Fuscone — Harvard- and Chicago-educated, a former vice-chairman of Merrill Lynch Latin America — filed for personal bankruptcy. **She knew less and grew rich; he knew everything and went bust.**\n\nMorgan Housel calls money a soft skill, not a technical one. And behavior has a source. In \"Depression Babies\" (2011), economists Ulrike Malmendier and Stefan Nagel combed US household data from 1964 to 2004 and found something stubborn: people who lived through years of a bad stock market take less risk for the rest of their lives, even after the economy recovers. Your appetite for risk (how much loss you stomach to chase a gain) is partly an accident of the decade you grew up in. Ask which old scare still decides for you today."},"image":{"path":"summary-psychology-of-money/idea.1.40e891c8.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Morgan Housel · The Psychology of Money · Harriman House, 2020","en":"Morgan Housel · The Psychology of Money · Harriman House, 2020"},"url":"https://harriman-house.com/authors/morgan-housel/the-psychology-of-money/9780857197689"}],"cta":null},{"id":"gap-comportamental","ordinal":2,"title":{"pt":"Seu dinheiro rendeu menos que o seu fundo.","en":"Your money earned less than your fund did."},"claim":{"pt":"Espere 72 horas antes de comprar ou vender no impulso: a pressa custa 1,1 ponto de rendimento por ano.","en":"Wait 72 hours before buying or selling on impulse: hurry costs 1.1 points of return a year."},"body":{"pt":"A diferença entre o que um fundo rendeu e o que o investidor daquele fundo levou pra casa tem nome: gap comportamental. Ele nasce de um reflexo — você põe dinheiro depois da alta e tira depois da queda.\n\nA Morningstar mediu isso no relatório \"Mind the Gap 2024\", com mais de 20 mil fundos: nos dez anos até dezembro de 2023, o fundo médio rendeu 7,3% ao ano e o investidor médio daquele mesmo fundo ganhou 6,3%. **Aquele 1,1 ponto, todo ano, é o pedágio de comprar animado e vender assustado.**\n\nComo saber se é com você? Olhe seus três últimos movimentos grandes de dinheiro. Reforçou depois de um ano bom e recuou depois de um ano ruim? O gap está se formando em tempo real. Duas travas simples: espere 72 horas antes de mexer no impulso e mantenha uma margem de erro — dinheiro que você não encosta, pra que o pânico nunca seja obrigado a decidir por você.","en":"The distance between what a fund returned and what the investor in that fund actually took home has a name: the behavior gap. It grows out of one reflex — you put money in after the rise and pull it out after the fall.\n\nMorningstar measured it in its \"Mind the Gap 2024\" report, across more than 20,000 funds: over the ten years to December 2023, the average fund returned 7.3% a year and the average investor in those same funds earned 6.3%. **That 1.1 point, every year, is the toll for buying excited and selling scared.**\n\nIs it happening to you? Look at your last three big money moves. Did you add after a good year and retreat after a bad one? The gap is forming in real time. Two simple brakes: wait 72 hours before acting on impulse, and keep room for error — money you never touch, so panic is never forced to decide for you."},"image":{"path":"summary-psychology-of-money/idea.3.34d8269f.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Morgan Housel · The Psychology of Money · Harriman House, 2020","en":"Morgan Housel · The Psychology of Money · Harriman House, 2020"},"url":"https://harriman-house.com/authors/morgan-housel/the-psychology-of-money/9780857197689"}],"cta":null},{"id":"educacao-financeira-funciona","ordinal":3,"title":{"pt":"Educação financeira tem prazo de validade","en":"Money education has a shelf life"},"claim":{"pt":"Trate educação financeira como treino: um livro ou um curso de dinheiro por ano muda seu comportamento.","en":"Treat financial education as training: one money book or course a year changes how you behave."},"body":{"pt":"Nas entrelinhas, o livro sugere que comportamento importa mais que conhecimento. Isso é meia verdade. Em 2020, os pesquisadores Tim Kaiser, Annamaria Lusardi e colegas juntaram 76 experimentos controlados — estudos em que as pessoas são sorteadas para receber ou não uma formação, o padrão-ouro para provar causa — somando mais de 160 mil participantes. O resultado contraria o mantra: **educação financeira muda comportamento de verdade, com efeito pelo menos três vezes maior do que se achava antes.**\n\nA síntese justa não é \"comportamento no lugar de conhecimento\", e sim \"os dois importam\". Então trate a formação como treino, não como enfeite: marque um livro ou um curso de dinheiro por ano, do mesmo jeito que marcaria uma consulta. E separe ciência de sabedoria — as frases mais amadas do livro, como ter um \"suficiente\", são aforismos, não afirmações testáveis.","en":"Between the lines, the book implies that behavior matters more than knowledge. That's a half-truth. In 2020, researchers Tim Kaiser, Annamaria Lusardi and colleagues pooled 76 randomized controlled trials — studies where people are randomly assigned to receive training or not, the gold standard for proving cause — covering more than 160,000 participants. The result cuts against the mantra: **financial education really does change behavior, with an effect at least three times larger than earlier work suggested.**\n\nThe fair synthesis isn't \"behavior instead of knowledge\". It's \"both matter\". So treat the training as training, not decoration: put one money book or one course on the calendar each year, the way you'd book a check-up. And keep science apart from wisdom — the book's most beloved lines, like having an \"enough\", are aphorisms, not testable claims."},"image":{"path":"summary-psychology-of-money/idea.4.761dae89.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Morgan Housel · The Psychology of Money · Harriman House, 2020","en":"Morgan Housel · The Psychology of Money · Harriman House, 2020"},"url":"https://harriman-house.com/authors/morgan-housel/the-psychology-of-money/9780857197689"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'summary-psychology-of-money';

-- summary-why-we-sleep · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"epidemia-inexistente","ordinal":1,"title":{"pt":"A auditoria que rachou o Why We Sleep","en":"The audit that cracked Why We Sleep"},"claim":{"pt":"A epidemia de sono da OMS não existe: a nota de rodapé do livro levava a um documentário.","en":"The WHO sleep epidemic does not exist: the book's footnote led to a documentary."},"body":{"pt":"Em 2019, o pesquisador independente Alexey Guzey publicou uma auditoria linha a linha de Why We Sleep, com citações. O golpe mais limpo saiu de uma nota de rodapé. Guzey rastreou a epidemia de sono \"declarada pela OMS\" até um documentário da National Geographic, que nem cita a OMS. A origem provável é uma página do CDC americano, e a própria agência já tinha trocado \"epidemia\" por \"problema\" dois anos antes de o livro sair.\n\nO câncer também não dobra. Uma meta-análise de 2018 — estudo que junta e reprocessa dezenas de pesquisas anteriores — reuniu mais de 1,5 milhão de pessoas e não achou associação significativa entre duração do sono e câncer. Some a isso um gráfico com a barra de 5 horas apagada e um artigo na revista Neuron retratado a pedido do próprio Walker. **Berkeley revisou a queixa e fechou o caso sem apontar má conduta.**\n\nA direção do livro está certa: sono importa. Antes de repetir uma estatística dramática de sono, abra a fonte dela.","en":"In 2019, independent researcher Alexey Guzey published a line-by-line audit of Why We Sleep, fully cited. The cleanest hit landed on a footnote. Guzey traced the \"WHO-declared\" sleep epidemic to a National Geographic documentary that never mentions the WHO. The likely real source is a US CDC web page, and the agency itself had already softened \"epidemic\" to \"problem\" two years before the book came out.\n\nCancer doesn't double either. A 2018 meta-analysis — a study that pools and reprocesses dozens of earlier ones — gathered more than 1.5 million people and found no significant link between sleep duration and cancer. Add a chart with the 5-hour bar deleted, and a Neuron paper retracted at Walker's own request. **Berkeley reviewed the complaint and closed it with no finding of misconduct.**\n\nThe book points the right way: sleep matters. Before you repeat a dramatic sleep statistic, open its source."},"image":{"path":"summary-why-we-sleep/idea.2.720137d7.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Walker, Why We Sleep · Scribner 2017 · auditoria de Guzey, 2019","en":"Walker, Why We Sleep · Scribner 2017 · Guzey's 2019 audit"},"url":"https://guzey.com/books/why-we-sleep/"}],"cta":null},{"id":"sete-ou-mais","ordinal":2,"title":{"pt":"Why We Sleep acerta na meta de 8 horas?","en":"Is Why We Sleep right about 8 hours?"},"claim":{"pt":"Mire 7 horas de sono ou mais. Oito cravadas nunca foi a recomendação.","en":"Aim for 7 hours of sleep or more. A hard 8 was never the recommendation."},"body":{"pt":"O consenso clínico nunca foi \"8 horas cravadas\". A declaração conjunta da Academia Americana de Medicina do Sono e da Sleep Research Society, de 2015, recomenda 7 horas ou mais por noite pra adultos de 18 a 60 anos. Dormir menos que isso de forma crônica aparece ligado a ganho de peso, diabetes, hipertensão e depressão no conjunto dos estudos.\n\nE mais sono não é sempre melhor. O estudo de Kripke, de 2002, acompanhou 1,1 milhão de adultos e encontrou a menor mortalidade em torno de 7 horas, com risco maior tanto abaixo de 6h quanto acima de 8h. **É uma curva em U, não a ladeira reta que o livro desenha.** Como quase toda pesquisa de sono, é observacional: mostra correlação, não prova de causa.\n\nSete-ou-mais, não oito-ou-fracasso. Se você funciona bem com 7 horas, um número redondo não é prova de que você está falhando. Mire 7 horas ou mais sempre no mesmo horário.","en":"The clinical consensus was never \"a hard 8 hours.\" The 2015 joint statement from the American Academy of Sleep Medicine and the Sleep Research Society recommends 7 or more hours a night for adults aged 18 to 60. Chronically sleeping less than that shows up linked to weight gain, diabetes, hypertension and depression across the literature.\n\nAnd more sleep isn't always better. Kripke's 2002 study followed 1.1 million adults and found the lowest mortality around 7 hours, with higher risk both below 6h and above 8h. **That's a U-shaped curve, not the downhill ramp the book draws.** Like almost all sleep research, it's observational: it shows correlation, not proof of cause.\n\nSeven-or-more, not eight-or-fail. If you feel fine on 7 hours, a round number is no proof that you're falling short. Aim for 7 hours or more, at the same time every night."},"image":{"path":"summary-why-we-sleep/idea.3.7d3bd99f.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Walker, Why We Sleep · Scribner 2017 · auditoria de Guzey, 2019","en":"Walker, Why We Sleep · Scribner 2017 · Guzey's 2019 audit"},"url":"https://guzey.com/books/why-we-sleep/"}],"cta":null},{"id":"ortossonia","ordinal":3,"title":{"pt":"Medir o sono te tira o sono","en":"Tracking your sleep costs you sleep"},"claim":{"pt":"Se conferir o sono te deixa ansioso, pare de medir por algumas semanas.","en":"If checking your sleep data makes you anxious, stop measuring for a few weeks."},"body":{"pt":"O próprio livro tem um efeito colateral. Clínicos do sono relatam pacientes que desenvolveram insônia depois de ler Why We Sleep com medo. O padrão tem nome: **ortossonia** — a obsessão em dormir \"perfeitamente\", muitas vezes alimentada por dado de wearable, que acaba estragando justo o sono que tenta proteger.\n\nDá pra reconhecer em você mesmo. Você mira as 8 horas cravadas, acorda, confere o que o aparelho registrou da noite e passa o dia esperando o cansaço chegar. Na noite seguinte, deita já medindo se vai dormir. **Vigiar o sono é o oposto de dormir.**\n\nA saída é consenso médico, não invenção do Walker: se ler sobre sono te deixa ansioso, pare de ler. E se o número do aparelho te assombra de manhã, pare de conferir por algumas semanas. Sem nada pra comparar, a ansiedade fica sem alvo, e o resto da rotina — horário regular, quarto escuro e fresco — segue funcionando sozinho.","en":"The book comes with a side effect. Sleep clinicians report patients who developed insomnia after reading Why We Sleep scared. The pattern has a name: **orthosomnia** — an obsession with sleeping \"perfectly,\" often fueled by wearable data, that ends up wrecking the very sleep it tries to protect.\n\nYou can spot it in yourself. You aim for a hard 8 hours, wake up, check what the device logged overnight, then spend the day waiting for the tiredness to arrive. The next night you lie down already measuring whether you'll fall asleep. **Watching your sleep is the opposite of sleeping.**\n\nThe way out is medical consensus, not a Walker invention: if reading about sleep makes you anxious, stop reading. And if the device's verdict haunts your mornings, stop checking it for a few weeks. With nothing to compare, the anxiety loses its target, while the rest of the routine — steady hours, a dark and cool room — keeps working on its own."},"image":{"path":"summary-why-we-sleep/idea.4.81ed5228.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Walker, Why We Sleep · Scribner 2017 · auditoria de Guzey, 2019","en":"Walker, Why We Sleep · Scribner 2017 · Guzey's 2019 audit"},"url":"https://guzey.com/books/why-we-sleep/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'summary-why-we-sleep';

-- job-crafting-additive · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"somar-em-vez-de-cortar","ordinal":1,"title":{"pt":"Cortar as tarefas chatas piora o trabalho","en":"Cutting the boring tasks is the wrong change"},"claim":{"pt":"Em vez de cortar a tarefa que te irrita, puxe pra você um projeto mais difícil neste mês.","en":"Instead of dropping the task you hate, pull a harder project toward you this month."},"body":{"pt":"Tims, Bakker e Derks separaram o job crafting — as mudanças que você mesmo faz nas bordas do trabalho, sem ninguém reescrever seu cargo — em quatro movimentos: mais autonomia e chance de aprender, mais feedback e apoio do chefe, assumir demandas mais desafiadoras, e diminuir as demandas que atrapalham. Na meta-análise de Rudolph e colegas, em 2017, os três primeiros andam junto com engajamento e desempenho, e o quarto anda na direção contrária. **Assumir desafio a mais teve correlação de .42 com desempenho avaliado por chefe e colegas**, não por autoavaliação, o que deixa o número bem mais confiável. Encolher o que atrapalha aparece junto de menos satisfação e mais vontade de pedir demissão. O motivo provável incomoda: **quem está no limite é justamente quem mais tenta fugir da tarefa pesada**, e desviar dela não resolve o cansaço que motivou a fuga. Devolver uma tarefa mal alocada continua valendo. Só não espere que subtrair seja o motor. Antes de tirar a reunião do calendário, escolha um projeto maior do que o seu tamanho atual e puxe pra você.","en":"Tims, Bakker and Derks split job crafting — the changes you make to the edges of your own job, with nobody rewriting your title — into four moves: adding autonomy and room to learn, adding feedback and backing from your boss, taking on harder demands, and shrinking the demands that get in the way. In the 2017 meta-analysis by Rudolph and colleagues, the first three travel with engagement and performance, and the fourth travels the opposite way. **Taking on harder demands correlated .42 with performance rated by bosses and peers**, not by the worker, which makes the number harder to wave away. Shrinking the hindering part came with lower satisfaction and a stronger urge to quit. The likely reason stings: **the people most tempted to dodge the heavy task are the ones already at their limit**, and dodging never touches the exhaustion that drove it. Handing back a badly assigned task is still fine. Subtraction just isn't the engine. Before you drop the meeting, pick a project slightly bigger than you are and pull it toward you."},"image":{"path":"job-crafting-additive/idea.2.bf07795e.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Rudolph et al., 2017 · Journal of Vocational Behavior · 122 amostras, 35.670 trabalhadores","en":"Rudolph et al., 2017 · Journal of Vocational Behavior · 122 samples, 35,670 workers"},"url":"https://www.sciencedirect.com/science/article/abs/pii/S0001879117300477"},{"label":{"pt":"Tims, Bakker & Derks, 2012 · Escala de Job Crafting","en":"Tims, Bakker & Derks, 2012 · Job Crafting Scale"},"url":"https://doi.org/10.1016/j.jvb.2011.05.009"}],"cta":null},{"id":"faca-o-mapa-voce-mesmo","ordinal":2,"title":{"pt":"O treinamento da empresa não muda seu trabalho","en":"Company training won't change your workday"},"claim":{"pt":"Passe uma semana anotando pra onde vão de fato seu tempo e sua energia, e só então redesenhe seu dia.","en":"Spend a week writing down where your time and energy actually go, then redraw your own workday."},"body":{"pt":"Empresas leem essa literatura e marcam um treinamento. Sakuraya e colegas testaram esse formato com 281 funcionários japoneses em seis unidades sorteadas entre treinar e não treinar: dois encontros de 120 minutos, em formato de aula. **Não mexeu nada** — nem o engajamento nem o próprio comportamento de redesenhar o trabalho, aos três ou aos seis meses. O caderno de job crafting da Universidade de Michigan pede outra coisa. Ao longo de vários dias, você anota pra onde vão de fato seu tempo e sua energia, tarefa por tarefa, e só então redesenha o dia em direção ao que você faz bem. Van Wingerden e colegas aplicaram o caderno com 32 professores holandeses, e o comportamento de redesenho subiu com efeito moderado (d = 0,42). São 32 pessoas, então é pista, não prova, e nenhum dos dois estudos comparou os dois formatos na mesma amostra. **A diferença provável está em quem faz o trabalho de olhar pro próprio dia**: a aula entrega o conceito, o caderno obriga você a desenhar. Ele cabe em duas manhãs, e dá pra fazer sozinho.","en":"Companies read this literature and book a training session. Sakuraya and colleagues tested that format with 281 Japanese employees across six worksites, randomised into trained and untrained: two 120-minute sessions, classroom style. **Nothing moved** — not engagement, not the crafting behaviour itself, at three months or at six. The University of Michigan job crafting workbook asks for something else. Over several days you write down where your time and energy actually go, task by task, and only then redraw the day toward what you are good at. Van Wingerden and colleagues ran the workbook with 32 Dutch teachers, and crafting behaviour rose with a moderate effect (d = 0.42). That is 32 people, so treat it as a lead rather than proof, and neither study pitted the two formats against each other in the same sample. **The likely difference is who does the work of looking at their own day**: the class hands you the concept, the workbook makes you draw it. It fits in two mornings, and you can run it alone."},"image":{"path":"job-crafting-additive/idea.3.07d9d4dd.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Exercício de job crafting · Universidade de Michigan","en":"Job Crafting Exercise · University of Michigan"},"url":"https://positiveorgs.bus.umich.edu/cpo-tools/job-crafting-exercise/"},{"label":{"pt":"Sakuraya et al., 2020 · ensaio randomizado com 281 funcionários","en":"Sakuraya et al., 2020 · randomised trial with 281 employees"},"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC7047874/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'job-crafting-additive';

-- summary-antifragile: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'summary-antifragile'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- summary-atomic-habits: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'summary-atomic-habits'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- summary-outlive: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'summary-outlive'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- summary-psychology-of-money: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'summary-psychology-of-money'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- summary-why-we-sleep: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'summary-why-we-sleep'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- job-crafting-additive: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'job-crafting-additive'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
