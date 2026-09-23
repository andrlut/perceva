-- migration: 20260923000008_learning_ideas_batch.sql
-- purpose: publica as ideias (Recanto em ideias) de 5 material(is) do Learning:
--          friendship-hours · 3 ideia(s)
--          ikea-effect · 2 ideia(s)
--          non-instrumental-play · 2 ideia(s)
--          play-deprivation-adults · 3 ideia(s)
--          summary-good-life · 3 ideia(s)
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
--     friendship-hours/idea.1.3d7b4a8c.webp  (960x1200, gemini-api)
--     friendship-hours/idea.2.f2bcd362.webp  (960x1200, gemini-api)
--     friendship-hours/idea.3.004dd62f.webp  (960x1200, gemini-api)
--     ikea-effect/idea.1.4fcce72a.webp  (960x1200, gemini-api)
--     ikea-effect/idea.3.3c49e9f1.webp  (960x1200, gemini-api)
--     non-instrumental-play/idea.2.9de5dc4b.webp  (960x1200, gemini-api)
--     non-instrumental-play/idea.3.1f9f5a54.webp  (960x1200, gemini-api)
--     play-deprivation-adults/idea.1.a115ecec.webp  (960x1200, gemini-api)
--     play-deprivation-adults/idea.2.56f33711.webp  (960x1200, gemini-api)
--     play-deprivation-adults/idea.3.fe7f3807.webp  (960x1200, gemini-api)
--     summary-good-life/idea.1.def97f59.webp  (960x1200, gemini-api)
--     summary-good-life/idea.2.26e40a9e.webp  (960x1200, gemini-api)
--     summary-good-life/idea.3.20e545ab.webp  (960x1200, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['friendship-hours', 'ikea-effect', 'non-instrumental-play', 'play-deprivation-adults', 'summary-good-life']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- friendship-hours · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"relogio-da-amizade","ordinal":1,"title":{"pt":"Amizade não se faz em três cafés","en":"Friendship isn't built over three coffees"},"claim":{"pt":"Amigo casual leva 50 horas juntos; amigo, 90; próximo, 200.","en":"A casual friend takes 50 hours together; a friend, 90; a close friend, 200."},"body":{"pt":"Jeffrey Hall, da Universidade do Kansas, procurou 355 adultos que tinham mudado de cidade nos seis meses anteriores e pediu duas coisas: estimar quantas horas já tinham passado com um conhecido novo e dizer em que degrau de proximidade aquela pessoa estava (Hall, Journal of Social and Personal Relationships, 2019). Os números ficaram entre 40 e 60 horas pra virar amigo casual, 80 a 100 pra virar amigo e 200 ou mais pra entrar no círculo próximo. A imprensa arredondou pra **50/90/200**.\n\nTrate como ordem de grandeza, não como cronômetro. As horas foram lembradas de memória, as duas amostras saíram do mesmo laboratório — a segunda, com 112 calouros, deu números bem menores — e ninguém de fora replicou os limiares.\n\nMesmo assim, a conta muda. Escolha alguém que você gostaria de ter como amigo e some as horas reais dos últimos seis meses: três cafés e dois almoços não passam de quatro. Se der oito, o problema nunca foi química.","en":"Jeffrey Hall, at the University of Kansas, tracked down 355 adults who had moved to a new city in the previous six months and asked them two things: estimate the hours already spent with one new acquaintance, and place that person on a closeness ladder (Hall, Journal of Social and Personal Relationships, 2019). The answers clustered around 40 to 60 hours to reach casual friend, 80 to 100 to reach friend, and 200 or more to land in the close circle. The press rounded that to **50/90/200**.\n\nRead it as an order of magnitude, not a stopwatch. The hours were recalled from memory, both samples came out of the same lab — the second one, 112 freshmen, produced far lower figures — and no outside group has replicated the thresholds.\n\nThe arithmetic still lands. Pick someone you would like as a friend and add up your real hours over the last six months: three coffees and two lunches barely clear four. If it comes to eight, chemistry was never the problem."},"image":{"path":"friendship-hours/idea.1.3d7b4a8c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Hall, 2019 · Journal of Social and Personal Relationships · n=355 adultos recém-mudados","en":"Hall, 2019 · Journal of Social and Personal Relationships · n=355 recently relocated adults"},"url":"https://journals.sagepub.com/doi/full/10.1177/0265407518761225"},{"label":{"pt":"Universidade do Kansas · release de 6 de março de 2018 (método e falas de Hall)","en":"University of Kansas · March 6, 2018 release (method and Hall's quotes)"},"url":"https://news.ku.edu/news/article/2018/03/06/study-reveals-number-hours-it-takes-make-friend"}],"cta":null},{"id":"hora-de-trabalho-nao-conta","ordinal":2,"title":{"pt":"O relógio da amizade não corre no trabalho","en":"The friendship clock doesn't run at work"},"claim":{"pt":"Hora de trabalho não vira amizade: marque um almoço fora da mesa ou uma caminhada depois do expediente.","en":"Hours at work don't build friendship: book a lunch away from the desk or a walk after the shift."},"body":{"pt":"Nos dois estudos de Hall, o tipo de hora pesou mais do que a quantidade: tempo de lazer — conversa jogada fora, piada, comida junto, um jogo, um show — previu proximidade muito melhor do que tempo em contexto obrigatório, como trabalho e sala de aula. No release da Universidade do Kansas, Hall resume sem rodeio: as horas trabalhando lado a lado “não contam tanto”.\n\nO porquê está na teoria que ele usa, a **Communicate Bond Belong** — conversar custa energia, e esse gasto só vira vínculo quando a outra pessoa está ali por vontade própria, não por escala (Hall & Davis, 2017). Daí o colega de quatro anos continuar sendo o colega de quatro anos.\n\nUma honestidade: ninguém testou encontros curtos e frequentes contra um encontro raro e planejado com o total de horas igualado. Os dados falam do tipo de hora, não do espaçamento. Então faça o que está comprovado e vire hora obrigatória em hora escolhida.","en":"Across both of Hall's studies, the kind of hour mattered more than the count: leisure time — hanging around, joking, eating together, playing something, going to a show — predicted closeness far better than time in obligatory settings like work and class. In the University of Kansas release, Hall says it flatly: hours spent working side by side “don't count as much.”\n\nThe reason sits in the theory he reads the data through, **Communicate Bond Belong** — talking costs energy, and that spend only buys a bond when the other person is there of their own accord rather than by roster (Hall & Davis, 2017). Which is why the colleague of four years stays the colleague of four years.\n\nOne honest gap: nobody has run short frequent meetups against one rare planned evening with total hours held equal. The data speak to the kind of hour, not the spacing. So do the part that is evidenced, and turn obligatory time into chosen time."},"image":{"path":"friendship-hours/idea.2.f2bcd362.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Universidade do Kansas · release de 6 de março de 2018 (falas de Hall sobre lazer x trabalho)","en":"University of Kansas · March 6, 2018 release (Hall on leisure vs. work time)"},"url":"https://news.ku.edu/news/article/2018/03/06/study-reveals-number-hours-it-takes-make-friend"},{"label":{"pt":"Hall & Davis, 2017 · Communication Theory · teoria Communicate Bond Belong","en":"Hall & Davis, 2017 · Communication Theory · Communicate Bond Belong theory"},"url":"https://www.researchgate.net/publication/309544892_Proposing_the_Communicate_Bond_Belong_Theory_Evolutionary_Intersections_With_Episodic_Interpersonal_Communication_Proposing_the_Communicate_Bond_Belong_Theory"}],"cta":null},{"id":"mudanca-derruba-o-circulo","ordinal":3,"title":{"pt":"Ninguém briga, a amizade morre de agenda","en":"Nobody fights, the friendship just fades"},"claim":{"pt":"Depois de uma mudança de vida, escolha duas pessoas e reserve horas fixas com elas.","en":"After a life change, pick two people and block standing hours with them."},"body":{"pt":"Roberts e Dunbar mapearam a rede social inteira de 25 jovens britânicos na virada da escola pra universidade e voltaram a medir por 18 meses — 1.291 pessoas catalogadas (Human Nature, 2015). No fim do período, só 48,6% dos amigos próximos seguiam no círculo íntimo; entre os laços de família, 70,3%. Amostra pequena, mas o padrão reaparece em escala: num painel alemão com 36.716 adultos, o contato presencial com a família ficou estável ao longo da vida enquanto o contato com amigos foi caindo (Sander, Schupp & Richter, Developmental Psychology, 2017).\n\n**Mudança de cidade, emprego novo ou filho não briga com os seus amigos — só apaga as horas de lazer que sustentavam a relação.** O que segurou as amizades sobreviventes se dividiu por gênero: falar com mais frequência protegeu mais as delas; fazer coisas juntos protegeu mais as deles. Escolha duas pessoas, não dez, e marque com elas algo recorrente e barato de manter: mesmo dia, mesmo lugar.","en":"Roberts and Dunbar mapped the entire personal network of 25 British teenagers across the move from school to university and re-measured for 18 months — 1,291 network members catalogued (Human Nature, 2015). By the end, only 48.6% of the old close friends were still in the inner circle; among family ties, 70.3%. Small sample, but the pattern reappears at scale: in a German panel of 36,716 adults, in-person contact with family held steady across the lifespan while contact with friends declined (Sander, Schupp & Richter, Developmental Psychology, 2017).\n\n**A move, a new job or a baby doesn't pick a fight with your friends — it just deletes the leisure hours the friendship ran on.** What protected the surviving friendships split by gender: talking more often helped the women's most; doing things together helped the men's most. So pick two people, not ten, and give them something recurring and cheap to keep: same day, same place."},"image":{"path":"friendship-hours/idea.3.004dd62f.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Roberts & Dunbar, 2015 · Human Nature · n=25, 18 meses de acompanhamento","en":"Roberts & Dunbar, 2015 · Human Nature · n=25, 18-month follow-up"},"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC4626528/"},{"label":{"pt":"Sander, Schupp & Richter, 2017 · Developmental Psychology · n=36.716","en":"Sander, Schupp & Richter, 2017 · Developmental Psychology · n=36,716"},"url":"https://pubmed.ncbi.nlm.nih.gov/28541063/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'friendship-hours';

-- ikea-effect · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"apego-no-montador","ordinal":1,"title":{"pt":"Você superestima a estante que montou","en":"You overrate the shelf you put together"},"claim":{"pt":"O que você monta com as próprias mãos vale mais pra você do que pra quem compra.","en":"What you build with your own hands is worth more to you than to whoever buys it."},"body":{"pt":"Em 2012, Michael Norton, Daniel Mochon e Dan Ariely deram instruções de dobradura a gente sem prática nenhuma. Saíram sapos de papel tortos. Aí perguntaram quanto cada um pagaria pelo próprio bicho, e quanto gente de fora pagaria por ele: os construtores pediram cinco vezes mais, perto do que os de fora topavam pagar por origami de especialista (Journal of Consumer Psychology, 2012). Eles olharam pra um sapo torto e viram trabalho de mestre.\n\n**O valor extra só pousa na coisa pronta.** Nos estudos 3 e 4, os autores destruíram o objeto recém-montado e interromperam outras montagens no meio. Nos dois casos o apego sumiu. Uma replicação posterior, com kits de artesanato, achou apego extra mesmo em trabalho não terminado.\n\nJuntando 55 estudos e 5.454 pessoas, o efeito é moderado (Pelled, Psychology & Marketing, 2026): um dedo no prato da balança, o bastante pra estragar decisão apertada. Termine coisas pequenas de propósito.","en":"In 2012, Michael Norton, Daniel Mochon and Dan Ariely handed folding instructions to people who had never tried origami. Out came lumpy paper frogs. Then they asked each folder what they would pay for their own animal, and asked outsiders the same question: the folders wanted five times more, close to what outsiders paid for origami folded by an expert (Journal of Consumer Psychology, 2012). They looked at a crooked frog and saw a master's work.\n\n**The premium only lands on a finished thing.** In studies 3 and 4, the authors destroyed the object right after assembly and cut other people off halfway through. Both times the attachment vanished. A later replication with craft kits found extra attachment even on unfinished work.\n\nPool 55 studies and 5,454 people and the effect comes out moderate (Pelled, Psychology & Marketing, 2026): a thumb on the scale, enough to ruin a close call. Finish small things on purpose."},"image":{"path":"ikea-effect/idea.1.4fcce72a.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology 22(3):453-460 · 4 experimentos","en":"Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology 22(3):453-460 · 4 experiments"},"url":"https://doi.org/10.1016/j.jcps.2011.08.002"}],"cta":null},{"id":"preco-em-vez-de-opiniao","ordinal":2,"title":{"pt":"Elogio de amigo não diz se a estante ficou boa","en":"Praise won't tell you if your shelf is any good"},"claim":{"pt":"Pra saber se o que você fez é bom, pergunte quanto a pessoa pagaria, não se ela gostou.","en":"To learn if what you made is any good, ask what someone would pay, not whether they liked it."},"body":{"pt":"O que você construiu virou prova de quem você é. Crítica ao objeto chega como veredito sobre você, e por isso 'o que você achou?' só colhe elogio: ninguém quer te machucar de graça.\n\nO experimento do origami já trazia a pergunta melhor. Em vez de opinião, Norton, Mochon e Ariely pediram preço, aos construtores e a gente de fora (Journal of Consumer Psychology, 2012). Foi aí que a cegueira apareceu: quem dobrou precificou papel amassado perto de trabalho de especialista. **Número é difícil de inflar por educação.**\n\nA segunda defesa é contra o custo afundado, o tempo e o dinheiro que já foram e não voltam, e que justamente por isso não deveriam pesar na decisão de continuar. O apego inverte a conta: quanto mais horas você enterrou, mais valiosa a coisa parece. Antes de seguir, pergunte a si mesmo: se eu chegasse hoje nesse projeto do zero, eu começaria?","en":"What you made became evidence about who you are. Criticism of the object lands as a verdict on you, which is why 'what do you think?' only ever harvests praise: nobody wants to hurt you for free.\n\nThe origami experiment already carried the better question. Instead of opinions, Norton, Mochon and Ariely asked for prices, from the folders and from outsiders (Journal of Consumer Psychology, 2012). That is where the blindness showed up: the folders priced crumpled paper near expert work. **A number is hard to inflate out of politeness.**\n\nThe second guard is against sunk cost, the time and money already gone, which you never get back and which for that very reason should not weigh on whether you continue. Attachment flips the maths: the more hours you have buried, the more valuable the thing looks. Before you carry on, ask yourself: if I walked into this project today from scratch, would I start it?"},"image":{"path":"ikea-effect/idea.3.3c49e9f1.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology 22(3):453-460 · experimento do origami","en":"Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology 22(3):453-460 · the origami experiment"},"url":"https://doi.org/10.1016/j.jcps.2011.08.002"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'ikea-effect';

-- non-instrumental-play · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"premio-mata-o-prazer","ordinal":1,"title":{"pt":"Prêmio e número matam a vontade do hobby","en":"A prize or a score kills the joy of a hobby"},"claim":{"pt":"Pare de medir o hobby: contar passos, páginas ou quilômetros faz você fazer mais e gostar menos.","en":"Stop measuring your hobby: counting steps, pages or miles makes you do more of it and enjoy it less."},"body":{"pt":"Em 1973, três psicólogos deram canetas a crianças que adoravam desenhar e prometeram a um dos grupos um certificado premiado antes de começar. Semanas depois, era esse grupo que desenhava menos no tempo livre; as outras crianças continuaram iguais. É o efeito de sobrejustificação (Lepper, Greene e Nisbett, 1973): **a recompensa externa reescreve o motivo**, de “eu faço porque gosto” pra “eu faço pela recompensa”. Tira a recompensa, e a vontade vai junto.\n\nMétrica faz o mesmo estrago sem prêmio nenhum. Uma pesquisa de 2016 (Etkin) mostrou que, quando as pessoas passam a medir o lazer — contar passos, páginas, quilômetros —, elas fazem mais e gostam menos. O número vira o ponto, e a brincadeira vira tarefa. Postar o resultado funciona parecido: adiciona plateia e cobrança onde não havia nenhuma.\n\nEntão tire o placar: escolha um hobby em que você **não acompanha nenhum número e não mostra o resultado pra ninguém**. Se você não faria aquilo sem ninguém vendo, o motivo já foi reescrito.","en":"In 1973, three psychologists handed markers to children who loved drawing and promised one group a fancy certificate before they began. Weeks later, that was the group drawing less in their free time; the other children carried on exactly as before. Psychologists call it the overjustification effect (Lepper, Greene and Nisbett, 1973): **an outside reward rewrites the reason**, from “I do this because I like it” to “I do this for the reward”. Take the reward away and the urge leaves with it.\n\nA metric does the same damage with no prize attached. A 2016 study (Etkin) found that once people start measuring their leisure — counting steps, pages, miles — they do more of it and enjoy it less. The number becomes the point, and play becomes a chore. Posting the result works the same way: it adds an audience where there was none.\n\nSo put the scoreboard away: pick a hobby where you **track no number and show the result to nobody**. If you would not do it with nobody watching, the reason has already been rewritten."},"image":{"path":"non-instrumental-play/idea.2.9de5dc4b.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Sonnentag & Fritz, 2007 · Journal of Occupational Health Psychology 12(3) · n=930","en":"Sonnentag & Fritz, 2007 · Journal of Occupational Health Psychology 12(3) · n=930"},"url":"https://doi.org/10.1037/1076-8998.12.3.204"}],"cta":null},{"id":"espaco-sem-placar","ordinal":2,"title":{"pt":"Seu hobby pago não é o seu descanso","en":"Your paid hobby is not your rest"},"claim":{"pt":"Virar profissional não mata o prazer do hobby, mas o seu descanso tem que vir de outro lugar.","en":"Going pro doesn't kill the joy of a hobby, but your rest has to come from somewhere else."},"body":{"pt":"Monetizar nem sempre estraga o que você gosta de fazer. Uma meta-análise de 1999 (Deci, Koestner e Ryan) mostrou que o efeito da recompensa é forte para prêmios tangíveis e esperados, enquanto elogio e recompensas inesperadas se comportam diferente. O hobby sério que passa a render não morre: **ele muda de categoria**.\n\nO que ele perde é a função de descansar. O trabalho liga sistemas de esforço no seu corpo — atenção, cortisol, pressão — e a cabeça só volta ao repouso quando esses sistemas desligam, o que exige ausência de cobrança, não só ausência de escritório (Sonnentag e Fritz, 2007). Pense no fotógrafo amador que virou fotógrafo de casamento: a mesma câmera que esvaziava a cabeça agora vem com cliente, prazo e crítica. A atividade é a mesma; a estrutura mudou tudo.\n\nNão é falta de disciplina. Sonnentag (2018) chama de paradoxo da recuperação: quem tem as maiores demandas é quem menos consegue espaço. **Se o seu único hobby virou renda, você precisa de outro em que não dá pra ganhar nada.**","en":"Getting paid does not always ruin what you love doing. A 1999 meta-analysis (Deci, Koestner and Ryan) showed the reward effect is strong for tangible, expected prizes, while praise and unexpected rewards behave differently. A serious hobby that starts paying does not die: **it changes category**.\n\nWhat it loses is the resting job. Work switches on effort systems in your body — attention, cortisol, blood pressure — and your head only settles once those systems go quiet, which takes the absence of demand, not just the absence of the office (Sonnentag and Fritz, 2007). Picture the amateur photographer who now shoots weddings: the same camera that used to empty his head arrives with a client, a deadline and criticism. The activity is identical; the structure changed everything.\n\nThis is not a discipline problem. Sonnentag (2018) calls it the recovery paradox: the people under the heaviest demands are the ones with the least room. **If your only hobby now pays, you need another one with nothing to win.**"},"image":{"path":"non-instrumental-play/idea.3.1f9f5a54.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Sonnentag & Fritz, 2007 · Journal of Occupational Health Psychology 12(3) · n=930 · recuperação exige demanda desligada","en":"Sonnentag & Fritz, 2007 · Journal of Occupational Health Psychology 12(3) · n=930 · recovery needs demand switched off"},"url":"https://doi.org/10.1037/1076-8998.12.3.204"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'non-instrumental-play';

-- play-deprivation-adults · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"instinto-nao-passatempo","ordinal":1,"title":{"pt":"Brincar fica na mesma prateleira do medo","en":"Play sits on the same shelf as fear"},"claim":{"pt":"A vontade de brincar não é preferência de lazer: é um instinto que vem de fábrica, como a fome.","en":"Wanting to play is not a leisure preference: it is a built-in instinct, and it works like hunger."},"body":{"pt":"Dois ratos jovens se pegam, rolam e se prendem no chão — e soltam um chiado agudo em 50 quilohertz, muito acima do que o seu ouvido capta. Faça cócegas num rato e ele chia igual, depois vem atrás da sua mão pedindo mais. Jaak Panksepp, que registrou esses chiados, propôs que eles são um ancestral da nossa risada (Panksepp e Burgdorf, Physiology & Behavior, 2000).\n\nO que pesa aqui é onde ele guardou a brincadeira: entre os sete sistemas emocionais primários dos mamíferos — circuitos que já vêm montados de fábrica —, ao lado de MEDO e PÂNICO/LUTO. O circuito de pegar e rolar passa por estruturas fundas do cérebro e depende pouco do neocórtex, a camada externa enrugada que cuida de linguagem e planejamento. **A vontade de brincar não é uma decisão sua.** Ela se parece mais com fome.\n\nPanksepp especulou que a brincadeira funciona como apetite: se você não gasta, ela se acumula. É especulação, e tirada de rato. Mesmo assim muda a frase: em vez de \"eu não tenho brincado\", \"eu tenho uma conta aberta\".","en":"Two young rats chase, tumble and pin each other, and out comes a high chirp at 50 kilohertz, far above anything your ear catches. Tickle a rat and you get the same chirp, then it comes back for your hand, asking for more. Jaak Panksepp, who recorded those chirps, argued they are an ancestor of human laughter (Panksepp and Burgdorf, Physiology & Behavior, 2000).\n\nWhat matters here is the shelf he put play on: among the seven primary emotional systems of the mammal brain — circuits that ship pre-built — right next to FEAR and PANIC/GRIEF. The chase-and-wrestle circuit runs through deep brain structures and barely depends on the neocortex, the wrinkled outer layer handling language and planning. **Wanting to play is not a decision you make.** It behaves more like hunger.\n\nPanksepp speculated that play works like an appetite: unspent, it builds up. That is speculation, and it came from rats. It still changes the sentence — from \"I haven't been playing\" to \"I am carrying a balance\"."},"image":{"path":"play-deprivation-adults/idea.1.a115ecec.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Bijlsma et al., 2022 · Journal of Neuroscience 42(46) · ratos juvenis privados de brincadeira social","en":"Bijlsma et al., 2022 · Journal of Neuroscience 42(46) · juvenile rats deprived of social play"},"url":"https://www.jneurosci.org/content/42/46/8716"}],"cta":null},{"id":"freio-pre-frontal","ordinal":2,"title":{"pt":"Ninguém testou privar um adulto de brincar","en":"No one has tested play deprivation in adults"},"claim":{"pt":"Só em ratos: filhotes criados sem brincar viraram adultos com mais dificuldade de trocar de estratégia.","en":"In rats only: pups raised without play became adults who struggled to drop a strategy that stopped paying."},"body":{"pt":"A evidência mais firme saiu em 2022. Bijlsma e colegas criaram ratos jovens sem nenhum companheiro de brincadeira, justamente na fase da vida em que ratos mais brincam, e foram olhar o cérebro deles já adultos (Bijlsma et al., Journal of Neuroscience, 2022).\n\nNo córtex pré-frontal medial — a região atrás da testa que segura impulso e troca de plano — uns neurônios empurram o vizinho a disparar e outros mandam calar. Os que mandam calar são o freio do circuito, e nesses ratos o freio estava mais fraco na vida adulta. O comportamento combinou: menos flexibilidade cognitiva, que é largar uma estratégia que parou de pagar. No labirinto, os pesquisadores invertem a regra e o rato rígido continua indo pra esquerda.\n\n**São filhotes, numa janela de desenvolvimento, privados de toda brincadeira social.** Do rato pro adulto que parou de jogar bola é analogia, não cadeia causal demonstrada: esse experimento nunca foi feito em gente. E a versão assustadora, de que privação vira violência, vem de um piloto com 26 assassinos condenados que nunca passou por revisão por pares.","en":"The firmest evidence landed in 2022. Bijlsma and colleagues raised young rats with no playmates, through the stretch of life when rats play most, then waited for adulthood and looked inside their brains (Bijlsma et al., Journal of Neuroscience, 2022).\n\nIn the medial prefrontal cortex — the patch behind your forehead that holds impulses and switches plans — some neurons push their neighbors to fire and others tell them to go quiet. The ones that say go quiet are the brakes of the circuit, and in these rats those brakes were weaker in adulthood. Behavior matched: less cognitive flexibility, which is dropping a strategy that stopped paying. In the maze, researchers flip the rule and the rigid rat keeps turning left.\n\n**These are pups, inside a developmental window, deprived of all social play.** Going from there to an adult who quit playing is analogy, not a demonstrated causal chain: no one has run that experiment on people. And the scary version, that deprivation breeds violence, rests on a pilot of 26 convicted murderers that never went through peer review."},"image":{"path":"play-deprivation-adults/idea.2.56f33711.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Bijlsma et al., 2022 · Journal of Neuroscience 42(46):8716–8728 · sinapses inibitórias do córtex pré-frontal medial","en":"Bijlsma et al., 2022 · Journal of Neuroscience 42(46):8716–8728 · medial prefrontal inhibitory synapses"},"url":"https://www.jneurosci.org/content/42/46/8716"}],"cta":null},{"id":"final-em-aberto","ordinal":3,"title":{"pt":"Voltar a brincar não depende da sua agenda","en":"Playing again does not depend on your calendar"},"claim":{"pt":"Amanhã, brinque dez minutos com outra pessoa numa atividade cujo final você não consiga prever.","en":"Tomorrow, play for ten minutes with someone else at something whose ending you cannot predict."},"body":{"pt":"Brincadeira não se define pelo tamanho do bloco na agenda, e sim pelo desenho da atividade: final em aberto, nada pra mostrar depois. Quem espera o tempo livre chegar está esperando uma coisa que não chega há anos.\n\n**Teste caseiro: liste o que você fez no último domingo.** Se cada item tinha finalidade — treinar, adiantar, resolver, descansar pra render na segunda —, o sistema está parado. Não é diagnóstico: não existe escala de privação de brincadeira, nem critério no DSM, o manual de diagnóstico psiquiátrico. O questionário de René Proyer, validado com 1.796 adultos em duas amostras (Proyer, Personality and Individual Differences, 2017), mede o quanto você é brincalhão, não o que está faltando.\n\nChame alguém: o que faltou aos ratos do estudo foi brincadeira social, não solitária. Uma vez por semana, estrague uma rotina de propósito — outro caminho de volta pra casa, jantar fora de hora. E quando te provocarem de brincadeira, entre no jogo em vez de explicar por que a piada não procede.","en":"Play is not defined by the size of the block on your calendar. It is defined by the shape of the activity: an open ending, nothing to show afterward. Waiting for free time to arrive means waiting for something that has not arrived in years.\n\n**Home test: list what you did last Sunday.** If every item had a purpose — train, get ahead, fix something, rest so Monday goes better — the system is idle. That is not a diagnosis. No play-deprivation scale exists, and the DSM, the psychiatric diagnostic manual, has no criteria for it. René Proyer's questionnaire, validated across 1,796 adults in two samples (Proyer, Personality and Individual Differences, 2017), measures how playful you are, not what you are missing.\n\nBring someone in: what those rats lost was social play, not solitary play. Once a week, wreck a routine on purpose — a different way home, dinner at the wrong hour. And when someone teases you, play along instead of explaining why the joke does not land."},"image":{"path":"play-deprivation-adults/idea.3.fe7f3807.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Bijlsma et al., 2022 · Journal of Neuroscience 42(46) · ratos juvenis privados de brincadeira social","en":"Bijlsma et al., 2022 · Journal of Neuroscience 42(46) · juvenile rats deprived of social play"},"url":"https://www.jneurosci.org/content/42/46/8716"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'play-deprivation-adults';

-- summary-good-life · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"relacao-preve-saude","ordinal":1,"title":{"pt":"Suas relações preveem mais que o colesterol","en":"Your ties predict more than your cholesterol"},"claim":{"pt":"Quem está satisfeito com as relações aos 50 chega mais saudável aos 80.","en":"People satisfied with their relationships at 50 arrive at 80 in better health."},"body":{"pt":"Em 1938, Harvard começou a acompanhar 724 rapazes e nunca parou: exame de sangue, entrevista na sala de casa, conversa com as esposas, escaneamento de cérebro décadas depois — a cada dois anos, pela vida inteira. Oitenta e cinco anos depois, o que separou quem chegou bem aos 80 não foi dinheiro, fama nem genética. Foi **a satisfação com as relações aos 50**. Waldinger repete em toda entrevista que isso previu saúde melhor que o colesterol; a comparação vem das falas dele, não de uma tabela publicada pondo os dois lado a lado.\n\nA musculatura do achado veio de fora de Harvard. Em 2010, Julianne Holt-Lunstad empilhou 148 estudos numa conta só — uma meta-análise, com **308.849 pessoas** somadas. Quem tinha relações mais fortes teve cerca de 50% mais chance de continuar vivo ao longo do acompanhamento.\n\nNada disso é experimento: ninguém sorteou quem teria casamento feliz e quem teria solidão. Relação prevê saúde; que cause, não está provado. Ainda assim, pare de tratar saúde e vida social como duas listas separadas.","en":"In 1938, Harvard started following 724 young men and never stopped: blood work, interviews in the living room, conversations with the wives, brain scans decades later — every two years, for the rest of those lives. Eighty-five years on, what separated the men who arrived healthy at 80 wasn't money, fame or genes. It was **how satisfied they were with their relationships at 50**. Waldinger says in every interview that this beat cholesterol as a predictor; that comparison comes from his interviews, not from a published table setting the two side by side.\n\nThe muscle behind the finding came from outside Harvard. In 2010, Julianne Holt-Lunstad pooled 148 studies into one calculation — a meta-analysis covering **308,849 people**. Those with stronger social relationships had roughly 50% higher odds of still being alive across the follow-up.\n\nNone of this is an experiment: nobody assigned who got a happy marriage and who got isolation. Relationships predict health; cause is not proven. Even so, stop keeping health and social life as two separate lists."},"image":{"path":"summary-good-life/idea.1.def97f59.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Waldinger & Schulz · The Good Life (Simon & Schuster, 2023) · 724 homens acompanhados desde 1938","en":"Waldinger & Schulz · The Good Life (Simon & Schuster, 2023) · 724 men followed since 1938"},"url":"https://the-good-life-book.com/"}],"cta":null},{"id":"calor-nao-contagem","ordinal":2,"title":{"pt":"A dor dói diferente num casamento ruim","en":"Pain lands harder in an unhappy marriage"},"claim":{"pt":"Uma relação boa não tira a dor do corpo, tira o poder que a dor tem sobre o seu dia.","en":"A good relationship doesn't take pain out of your body, it takes away its power over your day."},"body":{"pt":"Waldinger e Schulz acompanharam 47 casais na casa dos 80 anos num sub-estudo diário: cada pessoa anotava, dia após dia, quanta dor física sentia e quão feliz estava. Nos dias de mais dor, o humor despencava — mas só entre quem estava num casamento insatisfeito. Entre os casais mais satisfeitos, dor e humor se descolaram: **a dor continuava lá, o dia bom também**.\n\nNo mesmo estudo, o vínculo entre passar tempo com os outros e estar feliz naquele dia ficou marginal, bem no limite da significância estatística. Não é a presença de gente que produz o efeito, é o calor do laço — tempo com quem te esgota não conta.\n\nA crítica mais justa ao livro vem da revista Psychology Today: Waldinger e Schulz nunca definem com precisão o que é uma boa relação. É calor, confiança, sentir-se visto? O livro fica na intuição. Sem régua publicada, use a sua: **no seu pior dia desta semana, quem deixou o dia ainda de pé?**","en":"Waldinger and Schulz followed 47 couples in their 80s through a daily sub-study: each person logged, day after day, how much physical pain they felt and how happy they were. On higher-pain days, mood dropped — but only among people in an unhappy marriage. Among the most satisfied couples, pain and mood came apart: **the pain was still there, and so was the good day**.\n\nIn the same study, the link between time spent around others and being happy that day was only marginal, right at the edge of statistical significance. Company isn't what produces the effect, warmth is — hours with someone who drains you don't count.\n\nThe fairest criticism of the book comes from Psychology Today: Waldinger and Schulz never pin down what a good relationship actually is. Warmth, trust, feeling seen? The book stays on intuition. With no published yardstick, use your own: **on your worst day this week, who kept the day standing?**"},"image":{"path":"summary-good-life/idea.2.26e40a9e.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Waldinger & Schulz · The Good Life (Simon & Schuster, 2023) · sub-estudo com 47 casais na casa dos 80 anos","en":"Waldinger & Schulz · The Good Life (Simon & Schuster, 2023) · sub-study of 47 couples in their 80s"},"url":"https://the-good-life-book.com/"}],"cta":null},{"id":"fitness-social","ordinal":3,"title":{"pt":"Relações precisam de treino, igual ao corpo","en":"Relationships need training, just like the body"},"claim":{"pt":"Marque tempo recorrente com quem importa, do mesmo jeito que você marca um treino.","en":"Block recurring time for the people who matter, the way you book a workout."},"body":{"pt":"A gente trata o corpo como manutenção — treino, comida, sono — e trata as relações como permanentes por natureza: os amigos vão estar lá, a família vai estar lá. Waldinger e Schulz, que dirigem o estudo de 85 anos de Harvard, chamam isso de erro e propõem o oposto, o **fitness social**: encarar cada vínculo como músculo, que sem uso atrofia. Manter um laço é escolha repetida, não estado garantido.\n\nOs autores embrulham a prática numa sigla, o W.I.S.E.R.; é um invento didático deles, bom pra lembrar dos passos, mas não um método testado em laboratório com efeito medido.\n\nNa prática, são dois movimentos pequenos: reserve tempo recorrente pra quem importa, do mesmo jeito que você marca um treino, e mande hoje a mensagem que você vem adiando. **Depois de 85 anos de dados, o que segura uma vida em pé não são os gestos enormes, são os pequenos repetidos por décadas.**","en":"We treat the body as upkeep — training, food, sleep — and treat relationships as permanent by nature: the friends will be there, the family will be there. Waldinger and Schulz, who run Harvard's 85-year study, call that a mistake and propose the opposite, **social fitness**: treating every bond as a muscle that atrophies when unused. Keeping a bond alive is a repeated choice, not a guaranteed state.\n\nThe authors wrap the practice in an acronym, W.I.S.E.R.; it's their teaching device, handy for remembering the steps, but not a lab-tested method with a measured effect.\n\nIn practice it comes down to two small moves: block recurring time for the people who matter, the way you book a workout, and send today the message you keep putting off. **After 85 years of data, what holds a life up isn't the grand gestures, it's the small ones repeated for decades.**"},"image":{"path":"summary-good-life/idea.3.20e545ab.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Waldinger & Schulz · The Good Life (Simon & Schuster, 2023) · o conceito de fitness social","en":"Waldinger & Schulz · The Good Life (Simon & Schuster, 2023) · the social fitness idea"},"url":"https://the-good-life-book.com/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'summary-good-life';

-- friendship-hours: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'friendship-hours'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- ikea-effect: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'ikea-effect'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- non-instrumental-play: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'non-instrumental-play'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- play-deprivation-adults: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'play-deprivation-adults'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- summary-good-life: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'summary-good-life'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
