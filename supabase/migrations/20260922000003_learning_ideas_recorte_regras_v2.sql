-- migration: 20260922000003_learning_ideas_recorte_regras_v2.sql
-- purpose: publica as ideias (Recanto em ideias) de 4 material(is) do Learning:
--          protein-distribution-30g-myth · 3 ideia(s)
--          news-loneliness-memory-2026-04 · 1 ideia(s)
--          bids-for-connection · 2 ideia(s)
--          summary-deep-work · 4 ideia(s)
--
-- affected tables: learning_material (ideas), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-22 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     protein-distribution-30g-myth/idea.1.98c55935.webp  (960x1200, gemini-api)
--     protein-distribution-30g-myth/idea.2.46bf8889.webp  (960x1200, gemini-api)
--     protein-distribution-30g-myth/idea.3.4f4d3263.webp  (960x1200, gemini-api)
--     news-loneliness-memory-2026-04/idea.1.e5fb2b2f.webp  (960x1200, gemini-api)
--     bids-for-connection/idea.1.535fe1c0.webp  (960x1200, gemini-api)
--     bids-for-connection/idea.2.43af0a67.webp  (960x1200, gemini-api)
--     summary-deep-work/idea.1.31b7007d.webp  (960x1200, gemini-api)
--     summary-deep-work/idea.2.af3c8d26.webp  (960x1200, gemini-api)
--     summary-deep-work/idea.3.dbc3850b.webp  (960x1200, gemini-api)
--     summary-deep-work/idea.4.d4f4081c.webp  (960x1200, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['protein-distribution-30g-myth', 'news-loneliness-memory-2026-04', 'bids-for-connection', 'summary-deep-work']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- protein-distribution-30g-myth · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"nao-existe-teto-de-absorcao","ordinal":1,"title":{"pt":"Você só absorve 30g de proteína?","en":"Do you only absorb 30g of protein?"},"claim":{"pt":"Não existe teto de proteína por refeição: o corpo aproveita o que você comer.","en":"There is no protein ceiling per meal: your body uses whatever you eat."},"body":{"pt":"Em 2009, Daniel Moore e colegas deram proteína de ovo em doses diferentes a seis rapazes que tinham treinado uma perna só. Vinte gramas dispararam a síntese proteica muscular — a velocidade com que o músculo monta fibra nova. Quarenta gramas não dispararam mais que isso. Repare no que foi medido: a resposta do músculo. **Ninguém contou aminoácido perdido nas fezes, ninguém avaliou digestão.** Do laboratório pro vestiário, \"a resposta satura\" virou \"o corpo só absorve\".\n\nEm 2023, o grupo de Jorn Trommelen foi atrás do teto de propósito: 36 pessoas, treino de corpo inteiro, e depois 25 ou 100 gramas de proteína do leite, rastreadas com aminoácidos marcados quimicamente. A dose de 100 gramas rendeu 20% mais aminoácido incorporado nas primeiras quatro horas e 40% mais entre a quarta e a décima segunda, sem teto nenhum (Trommelen et al., Cell Reports Medicine, 2023).\n\n**Proteína a mais numa refeição não vira desperdício**: vira uma resposta mais espalhada no tempo. Coma os 60 gramas de picanha do seu prato inteiros.","en":"In 2009, Daniel Moore and colleagues gave egg protein at different doses to six young men who had trained one leg only. Twenty grams fired up muscle protein synthesis — the rate at which muscle builds new fibre. Forty grams fired it no higher. Look at what got measured: the muscle's response. **Nobody counted amino acids lost in stool, nobody assessed digestion.** Between the lab and the locker room, \"the response saturates\" turned into \"your body can't absorb it\".\n\nIn 2023, Jorn Trommelen's group went hunting for that ceiling on purpose: 36 people, whole-body training, then 25 or 100 grams of milk protein, tracked with chemically tagged amino acids. The 100-gram dose put 20% more amino acid into muscle in the first four hours and 40% more between hour four and hour twelve, with no ceiling anywhere (Trommelen et al., Cell Reports Medicine, 2023).\n\n**Extra protein in one meal doesn't become waste**: it becomes a response spread over more time. Eat the whole 60 grams of steak on your plate."},"image":{"path":"protein-distribution-30g-myth/idea.1.98c55935.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Trommelen et al., 2023 · Cell Reports Medicine 4(12) · ensaio randomizado com traçadores isotópicos","en":"Trommelen et al., 2023 · Cell Reports Medicine 4(12) · randomized trial with stable-isotope tracers"},"url":"https://doi.org/10.1016/j.xcrm.2023.101324"}],"cta":null},{"id":"gatilho-da-leucina","ordinal":2,"title":{"pt":"Quanta proteína liga o músculo por refeição?","en":"How much protein switches muscle on in a meal?"},"claim":{"pt":"O que liga o músculo não é o total de proteína: são 2,5 a 3 g de leucina por refeição.","en":"What switches muscle on isn't total protein: it's 2.5 to 3 grams of leucine per meal."},"body":{"pt":"Proteína é uma coleção de aminoácidos, e um deles acumula dois empregos. A leucina é tijolo como os outros e também é o interruptor: quando ela sobe rápido no sangue, aciona o mTOR, um sensor dentro da célula muscular que liga a linha de montagem de proteína nova. Leucina de menos, e a linha não liga direito.\n\n**O gatilho fica entre 2,5 e 3 gramas de leucina, que moram em uns 20 a 30 gramas de proteína animal de boa qualidade**: carne, ovo, leite, whey. Fonte vegetal traz menos leucina por grama e precisa de dose maior pro mesmo efeito. Por isso 30 gramas nunca foi uma constante do corpo humano: é uma média grosseira, de um tipo de proteína, pra um tipo de pessoa.\n\nE o número se mexe com a idade. **Moore voltou ao assunto em 2015: homens de uns 22 anos saturavam a resposta com 0,24 grama por quilo de peso por refeição, contra 0,40 dos de uns 71.** Depois dos 60, some um pouco em cada refeição.","en":"Protein isn't one thing. It's a set of amino acids, and one of them holds two jobs: leucine. It's a brick like the others, and it's also the switch. When it climbs fast enough in your blood, it trips mTOR, a sensor inside the muscle cell that starts the assembly line for new protein. Too little leucine and the line never really starts.\n\n**The trigger sits between 2.5 and 3 grams of leucine, which live inside roughly 20 to 30 grams of good animal protein**: meat, eggs, milk, whey. Plant sources carry less leucine per gram and need a bigger dose for the same effect. Which is why 30 grams was never a constant of the human body: it's a rough average, for one kind of protein, in one kind of person.\n\nAnd the number moves with age. **Moore came back to the question in 2015: men around 22 saturated the response at 0.24 grams per kilo of body weight per meal, against 0.40 in men around 71.** Past 60, add a little to every meal."},"image":{"path":"protein-distribution-30g-myth/idea.2.46bf8889.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Trommelen et al., 2023 · Cell Reports Medicine 4(12) · ensaio randomizado com traçadores isotópicos","en":"Trommelen et al., 2023 · Cell Reports Medicine 4(12) · randomized trial with stable-isotope tracers"},"url":"https://doi.org/10.1016/j.xcrm.2023.101324"}],"cta":null},{"id":"buraco-do-cafe-da-manha","ordinal":3,"title":{"pt":"Onde falta proteína no seu dia?","en":"Where is your day missing protein?"},"claim":{"pt":"Coma 25 a 30 g de proteína no café da manhã: dois ovos e um iogurte grego resolvem.","en":"Put 25 to 30 grams of protein into breakfast: two eggs and a Greek yogurt cover it."},"body":{"pt":"Refaça o seu dia de ontem em gramas. Pão na chapa com café com leite: perto de 7. Marmita com arroz, feijão e duas colheres de frango: uns 20. Jantar com bife, ovo e queijo: passa de 50. O interruptor da construção muscular foi acionado uma vez só, à noite.\n\nEm 2014, Mamerow e colegas serviram a oito adultos a mesma proteína por dia, em alimentação controlada, sete dias em cada padrão (Journal of Nutrition). Ou empilhada no jantar, 10, 15 e 65 gramas, ou dividida por igual entre as três refeições. **O padrão dividido rendeu cerca de 25% mais síntese proteica muscular em 24 horas, com a mesma comida.**\n\nDois ovos dão 12 gramas; um pote de iogurte grego, uns 16. **O total do dia continua sendo a alavanca maior**: numa análise de 23 ensaios de hipertrofia (Schoenfeld, Aragon e Krieger, 2013), o efeito do horário quase sumiu depois de ajustar pelo total. Doença renal ou dieta com proteína restringida: pergunte ao seu médico.","en":"Rebuild yesterday in grams. Toast and coffee with milk: around 7. A lunchbox of rice, beans and two spoonfuls of chicken: about 20. Dinner with steak, egg and cheese: past 50. The muscle-building switch got flipped exactly once, at night.\n\nIn 2014, Mamerow and colleagues fed eight adults the same protein every day, under controlled feeding, seven days on each pattern (Journal of Nutrition). Either piled onto dinner, 10, 15 and 65 grams, or spread evenly across the three meals. **The even pattern produced about 25% more muscle protein synthesis over 24 hours, on identical food.**\n\nTwo eggs give you 12 grams; a pot of Greek yogurt, about 16. **Daily total is still the bigger lever**: in an analysis of 23 hypertrophy trials (Schoenfeld, Aragon and Krieger, 2013), the timing effect all but vanished once total protein was accounted for. Kidney disease or a medically restricted diet: ask your doctor."},"image":{"path":"protein-distribution-30g-myth/idea.3.4f4d3263.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Mamerow et al., 2014 · Journal of Nutrition 144(6) · ensaio cruzado com alimentação controlada","en":"Mamerow et al., 2014 · Journal of Nutrition 144(6) · controlled-feeding crossover trial"},"url":"https://pubmed.ncbi.nlm.nih.gov/24477298/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'protein-distribution-30g-myth';

-- news-loneliness-memory-2026-04 · 1 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"nivel-nao-velocidade","ordinal":1,"title":{"pt":"A solidão acelera a perda de memória?","en":"Does loneliness speed up memory loss?"},"claim":{"pt":"Pessoas solitárias têm memória pior, mas a queda ao longo do tempo é a mesma.","en":"Lonely people have worse memory, but it doesn't fall any faster over time."},"body":{"pt":"Desde 2023 se repete que a solidão empurra você pra demência. Um estudo europeu de abril de 2026 separou duas coisas que essa frase misturava. A primeira é o nível: onde a sua memória está hoje. A segunda é a taxa de declínio: a velocidade com que ela cai ano após ano. No levantamento SHARE — 10.217 adultos mais velhos, testados em três momentos ao longo de seis anos —, quem se dizia mais solitário lembrou um pouco menos de uma lista de palavras. Já a velocidade da queda saiu praticamente igual nos dois grupos (Venegas-Sanabria et al., Aging & Mental Health, 2026). **A solidão parece te colocar alguns degraus abaixo, não te fazer descer mais rápido.** É um estudo observacional: mostra associação, não causa. Então não largue a decisão de cuidar dos vínculos, **troque o motivo**. Marque um contato fixo por semana com alguém de quem você gosta e ligue em vez de mandar mensagem. O retorno é a sua atenção desta semana, não a de 2046.","en":"Since 2023 the line has been that loneliness pushes you toward dementia. A European study published in April 2026 pulled that sentence apart into two separate claims. One is the level: where your memory sits today. The other is the rate of decline: how fast it drops year after year. In the SHARE survey — 10,217 older adults, tested at three points across six years — people who called themselves lonelier recalled a bit less of a word list. The speed of the fall came out essentially the same in both groups (Venegas-Sanabria et al., Aging & Mental Health, 2026). **Loneliness seems to start you a few steps lower, not send you down any faster.** The design is observational, so it shows association, not cause. Keep tending your bonds and **swap the reason**. Book one steady contact a week with someone you actually like, and call instead of texting. The payoff lands on this week's attention, not on 2046."},"image":{"path":"news-loneliness-memory-2026-04/idea.1.e5fb2b2f.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Venegas-Sanabria et al., 2026 · Aging & Mental Health · coorte SHARE n=10.217","en":"Venegas-Sanabria et al., 2026 · Aging & Mental Health · SHARE cohort n=10,217"},"url":"https://doi.org/10.1080/13607863.2026.2624569"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'news-loneliness-memory-2026-04';

-- bids-for-connection · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"bid-pedido-de-atencao","ordinal":1,"title":{"pt":"O “olha isso” do parceiro é um pedido de quê?","en":"What’s your partner’s “look at this” asking for?"},"claim":{"pt":"Todo “olha isso” do parceiro é um pedido de atenção: tire os olhos da tela e responda.","en":"Every “look at this” from your partner asks for your attention: put the screen down and answer."},"body":{"pt":"Seu parceiro solta “nossa, olha isso” e você está no meio de um e-mail. O psicólogo John Gottman chama esse momento de bid: qualquer tentativa de puxar o outro pra interação, seja uma pergunta, um comentário solto ou uma brincadeira. O conteúdo pesa pouco. O “olha isso” não é sobre o vídeo no celular. É uma pergunta miúda sobre se você está ali. Janice Driver e John Gottman filmaram 49 casais recém-casados num jantar comum e, em separado, numa discussão de 15 minutos sobre um conflito (Driver & Gottman, Family Process, 2004). **Quem fazia mais pedidos brincalhões e respondia com entusiasmo à mesa mostrou mais humor e carinho na briga.** Os autores falam em inferência cautelosa: o mais provável é que as duas coisas se alimentem, e só uma intervenção provaria causa. Então trate como aposta barata. No próximo “olha isso”, tire os olhos da tela e pergunte “mostra, o que foi?”. Seguir digitando em silêncio é o que o manual do estudo chama de afastar-se. **O pior cenário é um jantar mais atento.**","en":"Your partner says “oh wow, look at this” while you’re halfway through an email. Psychologist John Gottman calls that a bid: any attempt to draw the other person into interaction, whether a question, a stray remark or a joke. The content barely matters. “Look at this” isn’t about the video on the phone. It’s a tiny check on whether you’re there. Janice Driver and John Gottman filmed 49 newlywed couples over an ordinary dinner and, separately, in a 15-minute discussion of a conflict (Driver & Gottman, Family Process, 2004). **Couples who made more playful bids and answered with enthusiasm at the table showed more humor and affection when they argued.** The authors call it a cautious inference: most likely each feeds the other, and only an intervention could prove cause. So treat it as a cheap bet. Next time you hear “look at this,” take your eyes off the screen and ask, “Show me, what happened?” Carrying on in silence is what the study’s manual calls turning away. **The worst case is a more attentive dinner.**"},"image":{"path":"bids-for-connection/idea.1.535fe1c0.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Driver & Gottman, 2004 · Family Process 43(3) · recém-casados, n=49 (texto completo)","en":"Driver & Gottman, 2004 · Family Process 43(3) · newlyweds, n=49 (full text)"},"url":"https://www.johngottman.net/wp-content/uploads/2011/05/Daily-Marital-Interations-and-Positive-Affect-During-Marital-Conflict-Among-Newlywed-Couples.pdf"}],"cta":null},{"id":"numero-do-divorcio-sem-fonte","ordinal":2,"title":{"pt":"Ignorar um pedido de atenção prevê divórcio?","en":"Does a missed “look at this” predict divorce?"},"claim":{"pt":"Nada comprova que ignorar o “olha isso” do parceiro preveja divórcio. Não trate seus deslizes como veredito.","en":"There’s no proof that ignoring your partner’s “look at this” predicts divorce. Don’t treat your slips as a verdict."},"body":{"pt":"A frase circula por toda parte, até no [blog do Gottman Institute](https://www.gottman.com/blog/want-to-improve-your-relationship-start-paying-more-attention-to-bids/). Casais que seguiam casados seis anos depois atendiam os pedidos de atenção do parceiro 86% das vezes, e os que se separaram, só 33%. A trilha desse número termina num livro de autoajuda, The Relationship Cure (Gottman & DeClaire, 2001). Ele não está no estudo revisado sobre esses pedidos, que nunca mediu divórcio, nem em nenhum artigo de periódico. Pode até ser verdade. Só não há como conferir. Já os famosos 90% de acerto vêm de outras pesquisas, com outros instrumentos: Buehlman, Gottman e Katz (1992) chegaram a 93,6% com entrevistas em que recém-casados contavam a história do casal. Heyman e Slep (2001) apontaram o perigo de prever divórcio sem **validação cruzada**, ou seja, sem testar a fórmula em casais que não ajudaram a construí-la. Sem ela, o acerto sai inflado. O próprio Gottman Institute diz que esse acerto mede o quanto um casal se parece com o grupo que se separou. **Não transforme os pedidos que você deixou passar num veredito sobre o seu casamento.**","en":"The line is everywhere, even on the [Gottman Institute’s blog](https://www.gottman.com/blog/want-to-improve-your-relationship-start-paying-more-attention-to-bids/). Couples still married six years later answered their partner’s requests for attention 86% of the time, and couples who divorced only 33%. Follow that figure back and it stops at a self-help book, The Relationship Cure (Gottman & DeClaire, 2001). It isn’t in the peer-reviewed study of those requests, which never measured divorce, and it never turned up in a journal article. It might be true. There’s just no way to check. The famous 90% accuracy comes from other research, using other tools: Buehlman, Gottman and Katz (1992) reported 93.6% from interviews in which newlyweds told the story of their relationship. Heyman and Slep (2001) warned about predicting divorce without **cross-validation**, meaning testing a formula on couples who played no part in building it. Skip that step and accuracy comes out inflated. The Gottman Institute itself says the figure describes how closely a couple resembles the group that split up. **Don’t turn the requests you missed into a verdict on your marriage.**"},"image":{"path":"bids-for-connection/idea.2.43af0a67.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"The Gottman Institute · blog que repete os 86% × 33% · fonte secundária","en":"The Gottman Institute · blog restating 86% vs 33% · secondary source"},"url":"https://www.gottman.com/blog/want-to-improve-your-relationship-start-paying-more-attention-to-bids/"},{"label":{"pt":"The Gottman Institute · FAQ de pesquisa","en":"The Gottman Institute · research FAQ"},"url":"https://www.gottman.com/about/research/faq/"},{"label":{"pt":"Andrew Gelman · Statistical Modeling · crítica aos “90% de acerto”","en":"Andrew Gelman · Statistical Modeling · critique of the “90% accuracy” claims"},"url":"https://statmodeling.stat.columbia.edu/2010/06/04/a_wikipedia_whi/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'bids-for-connection';

-- summary-deep-work · 4 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"residuo-de-atencao","ordinal":1,"title":{"pt":"Foco não soma. Multiplica.","en":"Focus doesn't add. It multiplies."},"claim":{"pt":"Qualidade é tempo vezes intensidade. Cada troca de tarefa deixa resíduo e derruba a intensidade do que vem depois.","en":"Quality is time times intensity. Every task switch leaves residue that drags down whatever comes next."},"body":{"pt":"Newport resume o livro numa multiplicação: a qualidade do que você entrega é o tempo dedicado vezes a intensidade do foco. Repare que multiplica, não soma — corte a intensidade pela metade e você entrega metade do resultado nas mesmas horas.\n\nO que derruba a intensidade tem nome: **resíduo de atenção**. Quando você troca de tarefa, um pedaço da cabeça fica preso na anterior. Você senta pra escrever, mas metade da atenção ainda está no e-mail de trinta segundos atrás. O termo é de Sophie Leroy (2009): nos experimentos dela, cada troca feita antes de terminar a tarefa anterior derrubava o desempenho.\n\nA conta prática é dura. Um dia recortado em dez interrupções não rende um décimo de um bloco contínuo — rende bem menos, porque cada retomada paga o pedágio do resíduo. **O trabalho raso não só ocupa tempo: ele derruba a intensidade do tempo em volta.** Antes de responder “só uma mensagem”, termine o que já está aberto.","en":"Newport boils the book down to a multiplication: the quality of what you ship is the time you put in times the intensity of your focus. It multiplies, it doesn't add — halve the intensity and you ship half the result in the same hours.\n\nWhat drags intensity down has a name: **attention residue**. When you switch tasks, part of your head stays stuck on the last one. You sit down to write, but half your attention is still on that email from thirty seconds ago. The term is Sophie Leroy's (2009): in her experiments, every switch made before finishing the previous task dragged performance down.\n\nThe practical math stings. A day chopped into ten interruptions doesn't yield a tenth of one unbroken block — it yields far less, because every restart pays the residue toll. **Shallow work doesn't just take time; it lowers the intensity of the time around it.** Before you answer “just one message”, finish what is already open."},"image":{"path":"summary-deep-work/idea.1.31b7007d.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Deep Work — Cal Newport (Grand Central, 2016)","en":"Deep Work — Cal Newport (Grand Central, 2016)"},"url":"https://www.hachettebookgroup.com/titles/cal-newport/deep-work/9781455586691/"}],"cta":null},{"id":"doze-por-cento","ordinal":2,"title":{"pt":"Quanto da maestria vem do treino focado?","en":"How much of mastery comes from focused practice?"},"claim":{"pt":"Treino focado é a melhor alavanca que você controla, mas talento, contexto e timing decidem a maior parte do resultado.","en":"Focused practice is the best lever you control, but talent, context and timing decide most of the outcome."},"body":{"pt":"Newport vende o foco profundo como o caminho pra ficar bom em algo. O motor é a **prática deliberada**, conceito de K. Anders Ericsson (1993): treino focado e esforçado, com feedback, no limite da sua capacidade. É treinar a parte que dói, não a que flui, e ninguém faz isso checando notificação.\n\nO livro exagera no tamanho do efeito. Uma meta-análise de Macnamara e colegas (2014) atribuiu à prática deliberada só cerca de **12% da variação no desempenho** entre áreas, ou seja, das diferenças entre uma pessoa e outra. Em profissões, o peso foi bem menor. Talento, contexto (nascer numa família de músicos) e timing carregam o resto.\n\nEsse número não diz que treinar é inútil, e também não prova que treinar é indispensável. Diz que o treino ajuda e não basta. Pegue a parte em que você ainda erra e treine só ela, com feedback. Só não leia um resultado fraco como prova de que faltou esforço.","en":"Newport sells deep focus as the road to getting good at something. The engine is **deliberate practice**, K. Anders Ericsson's concept (1993): focused, effortful work, with feedback, at the edge of your ability. You drill the part that hurts, not the part that flows, and nobody does that while checking notifications.\n\nThe book overstates the size of the effect. A meta-analysis by Macnamara and colleagues (2014) credited deliberate practice with only about **12% of the variance in performance** across domains, meaning the differences between one person and the next. In professions, the share was far smaller. Talent, context (being born into a family of musicians) and timing carry the rest.\n\nThat number doesn't make practice useless, and it doesn't prove practice is indispensable either. It says practice helps and isn't enough. Pick the part you still get wrong and drill just that, with feedback. Just don't read a weak result as proof you didn't try hard enough."},"image":{"path":"summary-deep-work/idea.2.af3c8d26.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Deep Work — Cal Newport (Grand Central, 2016)","en":"Deep Work — Cal Newport (Grand Central, 2016)"},"url":"https://www.hachettebookgroup.com/titles/cal-newport/deep-work/9781455586691/"}],"cta":null},{"id":"bloco-ritmico","ordinal":3,"title":{"pt":"Seu problema de foco não é força de vontade.","en":"Your focus problem isn't willpower."},"claim":{"pt":"Bloqueie 90 minutos toda manhã pro trabalho difícil, antes de abrir o e-mail.","en":"Block 90 minutes every morning for the hard work, before you open email."},"body":{"pt":"“Foque mais” é conselho vazio. No livro, Newport troca força de vontade por estrutura: quatro filosofias de agenda, e você escolhe a que cabe na sua vida, não a mais heroica. A monástica corta e-mail e reunião quase por completo. A bimodal alterna semanas de reclusão com períodos abertos. A jornalística mergulha em qualquer brecha da agenda, mas pede um músculo de foco já treinado.\n\nA quarta, a **rítmica**, é um bloco profundo fixo, todo dia, virado hábito. Pra quem tem emprego, ela vence: não depende de heroísmo nem de agenda vazia, só de um gatilho diário repetido até virar automático. **Bloqueie 90 minutos toda manhã, antes de abrir o e-mail.**\n\nUm aviso honesto: quase todos os exemplos do livro, do próprio Newport (professor concursado) ao romancista Neal Stephenson, controlam a própria agenda. Num trabalho de turno ou num escritório aberto e reativo, você começa de outro lugar.","en":"“Focus more” is empty advice. In the book, Newport swaps willpower for structure: four scheduling philosophies, and you pick the one that fits your life, not the most heroic one. The monastic cuts email and meetings almost entirely. The bimodal alternates weeks of seclusion with open stretches. The journalistic dives into any gap in the calendar, but needs a focus muscle you've already trained.\n\nThe fourth, the **rhythmic**, is a fixed deep block, every day, turned into habit. If you have a job, it wins: it needs no heroism and no empty calendar, just a daily trigger repeated until it runs on autopilot. **Block 90 minutes every morning, before you open email.**\n\nOne honest warning: almost every example in the book, from Newport himself (a tenured professor) to the novelist Neal Stephenson, controls his own calendar. On a shift job or in a reactive open-plan office, you start somewhere else."},"image":{"path":"summary-deep-work/idea.3.dbc3850b.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Deep Work — Cal Newport (Grand Central, 2016)","en":"Deep Work — Cal Newport (Grand Central, 2016)"},"url":"https://www.hachettebookgroup.com/titles/cal-newport/deep-work/9781455586691/"}],"cta":null},{"id":"abracar-o-tedio","ordinal":4,"title":{"pt":"Tédio: o celular na fila cobra no trabalho.","en":"Boredom: the phone in line costs you at work."},"claim":{"pt":"Sacar o celular a cada segundo de marasmo treina o cérebro a fugir do desconforto que o foco profundo exige.","en":"Reaching for your phone at every dull second trains your brain to flee the discomfort deep work demands."},"body":{"pt":"Newport pede pra você **abraçar o tédio**. A tese dele é simples: cada vez que você saca o celular no primeiro segundo de marasmo, treina o cérebro a fugir de qualquer desconforto. A fila parada, a espera curta, o intervalo sem nada pra fazer: tudo vira gatilho pra tela.\n\nA conta chega depois, na mesa de trabalho. A tarefa difícil também incomoda. Ela pede que você fique com um problema que ainda não se resolveu, e um cérebro acostumado a escapar de todo incômodo não aguenta ficar ali. Ele procura a saída mais próxima. **O hábito de fora do expediente decide o quanto você aguenta dentro dele.**\n\nÉ uma tese do autor, não um resultado medido. Trate como um teste que você faz em você mesmo. Comece pela próxima fila: espere sem tirar o celular do bolso e repare na vontade de sacar. Depois deixe ela passar.","en":"Newport asks you to **embrace boredom**. His thesis is simple: every time you reach for your phone at the first dull second, you train your brain to flee any discomfort. A stalled queue, a short wait, a gap with nothing to do: each one becomes a cue for the screen.\n\nThe bill comes due later, at your desk. Hard work is uncomfortable too. It asks you to stay with a problem that hasn't cracked yet, and a brain used to escaping every itch can't stay put. It goes looking for the nearest exit. **The habit you keep off the clock decides what you can stand while on it.**\n\nThis is the author's argument, not a measured result. Treat it as an experiment you run on yourself. Start with the next queue: wait without taking the phone out of your pocket, and notice the urge to reach for it. Then let it pass."},"image":{"path":"summary-deep-work/idea.4.d4f4081c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Deep Work — Cal Newport (Grand Central, 2016)","en":"Deep Work — Cal Newport (Grand Central, 2016)"},"url":"https://www.hachettebookgroup.com/titles/cal-newport/deep-work/9781455586691/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'summary-deep-work';

-- protein-distribution-30g-myth: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'protein-distribution-30g-myth'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- news-loneliness-memory-2026-04: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'news-loneliness-memory-2026-04'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- bids-for-connection: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'bids-for-connection'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

-- summary-deep-work: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'summary-deep-work'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
