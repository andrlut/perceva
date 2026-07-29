-- migration: 20260729000080_learning_text_glossary-dexterity.sql
-- purpose: Big-release rewrite — glossary-dexterity (explainer, body).
-- affected: learning_material (upsert by slug) + learning_material_sub.
--           snapshot_material_revision trigger snapshots prior state + bumps version.
-- released_at: now() (re-dated for the release).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'rewrite for big-release-20260729';

with up as (
  insert into public.learning_material
    (slug, type, dimension_id, topic, reading_minutes,
     title_pt, title_en, summary_pt, summary_en,
     body_pt, body_en,
     takeaways_pt, takeaways_en,
     tracking_pt, tracking_en,
     source_url, source_label_pt, source_label_en,
     reasoning_log, released_at)
  values (
    'glossary-dexterity', 'explainer', 'body', $topic$glossary-dexterity$topic$, 6,
    $title_pt$Levantar do chão prediz quanto você vive$title_pt$,
    $title_en$Getting off the floor predicts how long you live$title_en$,
    $summary_pt$Equilíbrio, coordenação e a capacidade de levantar do chão preveem sua longevidade melhor que muitos exames — e treinam separado da força.$summary_pt$,
    $summary_en$Balance, coordination and the ability to rise from the floor predict how long you live better than most clinical tests — and they train separately from strength.$summary_en$,
    $body_pt$Senta no chão de pernas cruzadas e levanta sem usar as mãos, os joelhos ou o cotovelo pra se apoiar. Parece truque de festa. Mas a facilidade com que você faz isso — quantos apoios precisa, se cambaleia na subida — diz mais sobre quanto tempo você vai viver do que boa parte dos exames do seu check-up.

Pesquisadores brasileiros criaram exatamente esse teste, o teste de sentar-e-levantar, e acompanharam 2 mil adultos entre 51 e 80 anos. Quem levantava com dificuldade, precisando de três ou quatro apoios, tinha **5 a 6 vezes** mais risco de morrer nos anos seguintes do que quem subia limpo, sem tocar o chão.

O detalhe que muda tudo: esse risco aparece mesmo depois de descontar idade, peso e condição do coração. O teste não mede força. Mede outra coisa — equilíbrio, coordenação, a capacidade de o corpo se organizar no espaço. Um eixo inteiro do corpo que a academia raramente treina de propósito, e que quase ninguém sabe que está perdendo.

## 1. O eixo que a força não cobre

Você pode ser forte e ainda assim ir ao chão. Soa contraintuitivo, mas força e equilíbrio são capacidades diferentes, treinadas por circuitos diferentes. Dá pra ter agachamento pesado e mesmo assim não conseguir ficar parado num pé só.

Um estudo com 1.702 adultos testou algo ainda mais simples: ficar 10 segundos parado num pé só, sem apoio. Quem não conseguia tinha 84% mais risco de morrer nos sete anos seguintes — de novo, depois de descontar idade, sexo e doenças. Uma em cada cinco pessoas falhou.

A velocidade com que você caminha no dia a dia funciona quase como um sinal vital. Juntando nove estudos e 34 mil idosos, cada 0,1 metro por segundo a mais na velocidade de caminhada veio com 12% menos risco de morte. Fisioterapeutas chamam a velocidade de marcha de "o sexto sinal vital", ao lado de pressão e batimentos.

Por que testes tão bobos preveem tanto? Porque levantar do chão, equilibrar num pé, andar rápido — cada um exige que dezenas de sistemas conversem ao mesmo tempo: músculo, articulação, ouvido interno, e o sentido que o corpo tem da própria posição. Quando um deles começa a falhar, o teste denuncia antes de qualquer sintoma. É o termômetro mais barato de um corpo que ainda funciona como um time.

## 2. O que falha primeiro não é a força — é a velocidade

Quando o corpo perde esse eixo, o desfecho não é dramático de cara. É uma queda. Em 2023, quedas mataram 41.400 americanos com mais de 65 anos e levaram 3,85 milhões ao pronto-socorro — um custo de cerca de 80 bilhões de dólares por ano pro sistema de saúde. As mortes por queda subiram 51% em uma década. Uma em cada quatro pessoas idosas cai todo ano.

Aqui está a parte que quase ninguém entende: o que falha primeiro com a idade não é a força bruta. É a velocidade com que você produz força. Os cientistas deram um nome a isso: dinapenia — a perda de potência muscular, diferente da sarcopenia, que é a perda de massa muscular. A potência, que é força rápida, cai mais rápido que o tamanho ou a força máxima do músculo.

Por que isso importa? Porque escorregar e se segurar é um movimento de milissegundos. Não adianta ter força se ela chega tarde. O tornozelo tem que reagir, o quadril tem que corrigir, o braço tem que sair na hora certa. Quem perdeu potência ainda tem a força — só que ela chega depois que o corpo já foi ao chão.

> Se mover, pra pessoa comum, principalmente quem já é mais velho, e a capacidade de levantar do chão são muito relevantes pra autonomia.
> — Claudio Gil Araújo

Dois conceitos costumam virar sinônimo, e não deveriam. Flexibilidade é o quanto uma articulação estica de forma passiva — o quanto você alcança os dedos do pé. Mobilidade é o controle ativo dentro dessa amplitude — usar o movimento com equilíbrio e coordenação. A segunda é a que protege. Amplitude de tornozelo, por exemplo: um estudo com 372 mulheres achou que tornozelo travado (pouca dorsiflexão — a capacidade de puxar o pé pra cima em direção à canela) andava junto com mais quedas.

Um cuidado honesto: você vai ler em todo lugar que a propriocepção — o sentido que te diz onde seu corpo está sem você olhar — despenca com a idade. A ciência é menos certa disso. Uma revisão de 2026 concluiu que essa perda é "pequena, depende do teste e depende da articulação". Traduzindo: o eixo importa, mas nem toda explicação de wellness sobre ele está comprovada.

## 3. A receita que corta quedas

Passar no teste não é o objetivo — ele só reflete uma capacidade por baixo. Treinar pra decorar o teste não te faz viver mais; treinar a capacidade que ele mede, sim. E aqui a evidência é clara. Uma revisão Cochrane de 108 estudos, com 23 mil pessoas, encontrou evidência forte de que programas de equilíbrio e movimento funcional reduzem quedas. Musculação sozinha, dança sozinha, caminhada sozinha? Evidência incerta. O que corta queda é treinar o equilíbrio de propósito.

O exemplo mais bem replicado é o Tai Chi. Num estudo com 256 adultos entre 70 e 92 anos, o grupo que praticou por seis meses teve quase metade das quedas do grupo que só alongava — 55% menos risco de cair várias vezes. Meta-análises depois confirmaram. Aquela sequência lenta e aparentemente boba de movimentos é, na prática, treino de equilíbrio disfarçado.

:::list-icon
walk | Fique 10 segundos num pé só enquanto escova os dentes. Troque de pé. Largue a parede quando se sentir firme.
body | Sente e levante do chão sem usar as mãos, algumas vezes por dia. É o teste virando treino.
fitness | Treino multicomponente 3x na semana: equilíbrio mais força funcional em intensidade moderada (recomendação da OMS).
leaf | Uma aula de Tai Chi, yoga ou dança que exija mudar de direção e de peso — o cérebro treina coordenação.
timer | Mobilidade de tornozelo e quadril: 5 minutos por dia rendem mais que uma maratona de alongamento por mês.
:::

E o alongamento estático, aquele de segurar o músculo esticado por 30 segundos? Ele não faz o que a maioria pensa. Uma revisão Cochrane não achou redução de dor muscular depois do treino, e outras revisões não acharam menos lesões em quem alonga antes de treinar. O ganho de flexibilidade é real, mas é local e passageiro — não é o que te protege de cair. Alongar não é errado; só não confunda com treino de equilíbrio.

A força te tira do sofá. O equilíbrio te mantém de pé quando o tapete escorrega aos 70. São dois seguros diferentes, e a maioria das pessoas paga só um. A boa notícia é que o segundo é barato: não precisa de academia, nem de peso, nem de roupa. Precisa de você, um pé só, e a decisão de não se apoiar na parede enquanto ainda dá pra treinar sem ela.

:::source[Brito et al., 2014 · Eur J Prev Cardiol · n=2.002](https://doi.org/10.1177/2047487312471759)$body_pt$,
    $body_en$Sit down on the floor, cross-legged, and stand back up without using your hands, your knees, or an elbow to push off. It looks like a party trick. But how easily you do it — how many props you need, whether you wobble on the way up — says more about how long you'll live than most of the tests in your annual checkup.

Brazilian researchers built exactly that test — the sitting-rising test — and followed 2,000 adults between 51 and 80. People who struggled to get up, needing three or four points of support, had **5 to 6 times** the risk of dying in the following years compared to those who rose clean, without touching the floor.

Here's the detail that changes everything: the risk holds even after you account for age, weight, and heart condition. The test isn't measuring strength. It's measuring something else — balance, coordination, your body's ability to organize itself in space. A whole axis of the body the gym rarely trains on purpose, and that almost nobody knows they're losing.

## 1. The axis strength doesn't cover

You can be strong and still hit the floor. It sounds backwards, but strength and balance are different capacities, wired through different circuits. You can have a heavy squat and still fail to stand still on one leg.

A study of 1,702 adults tested something even simpler: standing on one leg for 10 seconds, no support. People who couldn't had 84% higher risk of dying over the next seven years — again, after adjusting for age, sex, and illness. One in five failed.

The speed you walk at, day to day, behaves almost like a vital sign. Pooling nine studies and 34,000 older adults, every extra 0.1 meters per second of walking speed came with 12% lower risk of death. Physical therapists call gait speed "the sixth vital sign," next to blood pressure and heart rate.

Why do such silly tests predict so much? Because rising from the floor, balancing on one foot, walking briskly — each one demands that dozens of systems talk at once: muscle, joint, inner ear, and the sense your body has of its own position. When one starts to fail, the test catches it before any symptom does. It's the cheapest thermometer for a body that still works like a team.

## 2. What fails first isn't strength — it's speed

When the body loses this axis, the ending isn't dramatic at first. It's a fall. In 2023, falls killed 41,400 Americans over 65 and sent 3.85 million to the emergency room — roughly $80 billion a year for the health system. Fall deaths rose 51% in a single decade. One in four older adults falls every year.

Here's the part almost nobody understands: what fails first with age isn't raw strength. It's how fast you produce force. Scientists gave it a name — dynapenia, the loss of muscle power, distinct from sarcopenia, the loss of muscle mass. Power, meaning fast force, drops faster than muscle size or peak strength.

Why does that matter? Because slipping and catching yourself is a movement of milliseconds. Strength is useless if it arrives late. The ankle has to react, the hip has to correct, the arm has to shoot out at the right instant. Someone who's lost power still has the strength — it just arrives after the body already went down.

> Moving, for the average person, especially those who are older, and the ability to rise from the floor is very much relevant for autonomy.
> — Claudio Gil Araújo

Two words usually get treated as synonyms, and they shouldn't be. Flexibility is how far a joint stretches passively — how close you get to your toes. Mobility is active control inside that range — using the movement with balance and coordination. The second one is what protects you. Ankle range is a good example: a study of 372 women found a stiff ankle (little dorsiflexion — the ability to pull your foot up toward your shin) went hand in hand with more falls.

One honest caveat: you'll read everywhere that proprioception — the sense that tells you where your body is without looking — collapses with age. The science is less settled than that. A 2026 review concluded the decline is "small, outcome-dependent, and task-dependent." Translation: the axis matters, but not every wellness claim about it is proven.

## 3. The recipe that cuts falls

Passing the test isn't the goal — it just reflects a capacity underneath. Training to ace the test won't make you live longer; training the capacity it measures will. And here the evidence is clear. A Cochrane review of 108 trials, 23,000 people, found strong evidence that balance and functional-movement programs reduce falls. Strength training alone, dance alone, walking alone? Uncertain. What cuts falls is training balance on purpose.

The best-replicated example is Tai Chi. In a study of 256 adults aged 70 to 92, the group that practiced for six months had nearly half the falls of the group that only stretched — 55% lower risk of falling repeatedly. Later meta-analyses confirmed it. That slow, seemingly silly sequence of movements is, in practice, balance training in disguise.

:::list-icon
walk | Stand on one leg for 10 seconds while you brush your teeth. Switch feet. Drop the wall once you feel steady.
body | Sit down and stand up from the floor without using your hands, a few times a day. It's the test turned into training.
fitness | Multicomponent training 3× a week: balance plus functional strength at moderate intensity (WHO's recommendation).
leaf | A Tai Chi, yoga, or dance class that makes you shift direction and weight — your brain trains coordination.
timer | Ankle and hip mobility: 5 minutes a day beats a monthly stretching marathon.
:::

And static stretching — holding a muscle long for 30 seconds? It doesn't do what most people think. A Cochrane review found no reduction in post-workout soreness, and other reviews found no drop in injuries for people who stretch before training. The flexibility gain is real, but it's local and short-lived — it isn't what keeps you off the floor. Stretching isn't wrong; just don't confuse it with balance training.

Strength gets you off the couch. Balance keeps you upright when the rug slips at 70. They're two different insurance policies, and most people only pay for one. The good news is that the second is cheap: no gym, no weights, no gear. It needs you, one leg, and the decision not to lean on the wall while you can still train without it.

:::source[Brito et al., 2014 · Eur J Prev Cardiol · n=2,002](https://doi.org/10.1177/2047487312471759)$body_en$,
    array[$tkpt0$Se você não consegue ficar 10 segundos parado num pé só, seu risco de morte é 84% maior — teste hoje, perto de uma parede pra segurança.$tkpt0$, $tkpt1$Equilíbrio e coordenação são um eixo separado da força: dá pra ser forte e ainda cair. Quedas matam 41 mil pessoas por ano só nos EUA.$tkpt1$, $tkpt2$Alongar não previne queda. O que previne é treino de equilíbrio e movimento funcional, 3x na semana — Tai Chi corta quedas em cerca de 50%.$tkpt2$]::text[],
    array[$tken0$If you can't stand on one leg for 10 seconds, your mortality risk is 84% higher — test it today, near a wall for safety.$tken0$, $tken1$Balance and coordination are a separate axis from strength: you can be strong and still fall. Falls kill 41,000 people a year in the US alone.$tken1$, $tken2$Stretching doesn't prevent falls. Balance and functional-movement training does, 3× a week — Tai Chi cuts falls by roughly 50%.$tken2$]::text[],
    $trk_pt$No Perceva, a sub Destreza é onde isso vira prática. Registrar tarefas de equilíbrio e mobilidade — ficar num pé só enquanto escova os dentes, praticar levantar do chão sem apoio, uma sessão de Tai Chi — alimenta essa dimensão e mostra, ao longo das semanas, se você está treinando o eixo que a força não cobre. Skills como "segundos num pé só" ou "pontos no teste de sentar-levantar" transformam esses testes num número que sobe com o tempo.$trk_pt$,
    $trk_en$In Perceva, the Dexterity sub is where this becomes practice. Logging balance and mobility tasks — standing on one leg while you brush your teeth, practicing rising from the floor without support, a Tai Chi session — feeds this dimension and shows, across weeks, whether you're training the axis strength doesn't cover. Skills like "seconds on one leg" or "sitting-rising score" turn these tests into a number that climbs over time.$trk_en$,
    $src_url$https://doi.org/10.1177/2047487312471759$src_url$,
    $src_pt$Brito et al., 2014 · Eur J Prev Cardiol · n=2.002$src_pt$,
    $src_en$Brito et al., 2014 · Eur J Prev Cardiol · n=2,002$src_en$,
    $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Three ideas not seven: merged 10 dossier facts into 3 hero ideas (silent axis / speed-not-strength / the recipe)","Prose-led: only 2 body cards (one list-icon recipe + closing source) plus one markdown blockquote; headline stat woven into hook prose instead of a stat card","Native PT and native EN written fresh in each language, not translated","Define jargon on first mention: sitting-rising test, gait speed / sixth vital sign, dynapenia vs sarcopenia, dorsiflexion, proprioception, mobility vs flexibility","Concrete examples beat abstract lists: floor-rise test, brush-teeth one-leg drill, grocery-bag-style at-home checks","Honest caveats flagged: observational (not causal) test effect sizes, and the overstated proprioception-decline claim","Read-aloud test: short sentences, consistent second-person voice, no filler ('vale lembrar', 'no fim das contas', 'It's worth noting')"],"steps":[{"id":"hook","answer_pt":"Abre com a cena física de sentar no chão e levantar sem apoio — um 'truque de festa' que prevê mortalidade melhor que exames de rotina. A curiosity gap: por que um gesto tão bobo prediz tanto? Porque não mede força, mede um eixo escondido (equilíbrio/coordenação) que ninguém sabe que está perdendo.","answer_en":"Opens with the physical scene of sitting on the floor and rising without support — a 'party trick' that predicts mortality better than routine tests. The curiosity gap: why does such a silly gesture predict so much? Because it doesn't measure strength, it measures a hidden axis (balance/coordination) nobody knows they're losing."},{"id":"thesis","answer_pt":"Equilíbrio, coordenação, potência e amplitude articular formam um eixo do corpo que prediz longevidade de forma independente da força e do preparo cardíaco — e treina separado deles. Número headline: no teste de sentar-e-levantar, quem pontua 0–3 tem 5–6x mais risco de morte que quem pontua 8–10.","answer_en":"Balance, coordination, power and joint range form a body axis that predicts longevity independently of strength and cardio — and trains separately from them. Headline number: on the sitting-rising test, scoring 0–3 carries 5–6× the mortality risk of scoring 8–10."},{"id":"real_definition","answer_pt":"O que 'destreza' realmente é: não é flexibilidade (quanto a articulação estica, passivo) nem força bruta. É controle motor ativo — equilíbrio, coordenação e velocidade de força — a capacidade do corpo de se organizar no espaço e reagir a tempo. Contraste central: força tira do sofá; equilíbrio te mantém de pé quando o tapete escorrega.","answer_en":"What 'dexterity' really is: not flexibility (how far a joint stretches, passive) nor raw strength. It's active motor control — balance, coordination and speed of force — the body's ability to organize itself in space and react in time. Core contrast: strength gets you off the couch; balance keeps you upright when the rug slips."},{"id":"stakes","answer_pt":"Ironclad: falhar em ficar 10 segundos num pé só se associa a 84% mais risco de morte por qualquer causa em 7 anos (n=1.702, Br J Sports Med 2022). E quedas — o desfecho letal desse declínio — mataram 41.400 idosos nos EUA em 2023, com alta de 51% em uma década.","answer_en":"Ironclad: failing a 10-second one-leg stance is linked to 84% higher all-cause mortality over 7 years (n=1,702, Br J Sports Med 2022). And falls — the lethal endpoint of this decline — killed 41,400 older Americans in 2023, up 51% in a decade."},{"id":"mechanism","answer_pt":"Por baixo: o que falha primeiro não é a força, é a velocidade de força — dinapenia (perda de potência), que cai mais rápido que a massa (sarcopenia). Segurar-se numa escorregada é questão de milissegundos; a força que chega tarde não impede a queda. Exemplo concreto: tornozelo travado (baixa dorsiflexão) anda junto com mais quedas em mulheres 40–80.","answer_en":"Under the hood: what fails first isn't strength, it's speed of force — dynapenia (loss of power), which drops faster than mass (sarcopenia). Catching a slip is a matter of milliseconds; strength that arrives late doesn't stop the fall. Concrete example: a stiff ankle (low dorsiflexion) tracks with more falls in women 40–80."},{"id":"myth_busts","answer_pt":"Três correções, dadas como prosa: (1) ser forte não protege de cair — força e equilíbrio são circuitos diferentes; (2) alongamento estático não reduz dor, lesão nem quedas — ganho local e passageiro, não protetor (Cochrane); (3) 'propriocepção despenca com a idade' é exagero — revisão de 2026 diz que o declínio é pequeno e depende do teste/articulação.","answer_en":"Three corrections, delivered as prose: (1) being strong doesn't protect against falling — strength and balance are different circuits; (2) static stretching doesn't reduce soreness, injury or falls — a local, short-lived gain, not protective (Cochrane); (3) 'proprioception collapses with age' is overstated — a 2026 review says the decline is small and task/joint-dependent."},{"id":"recipe","answer_pt":"O que fazer amanhã, em :::list-icon baseado na OMS 2020 e na Cochrane: um pé só ao escovar os dentes; sentar-e-levantar do chão sem mãos; treino multicomponente 3x/semana (equilíbrio + força funcional moderada); uma aula de Tai Chi/yoga/dança com troca de direção; 5 min/dia de mobilidade de tornozelo e quadril. Tai Chi corta ~50% das quedas recorrentes.","answer_en":"What to do tomorrow, in a :::list-icon based on WHO 2020 and Cochrane: one leg while brushing teeth; sit-and-rise from the floor hands-free; multicomponent training 3×/week (balance + moderate functional strength); a Tai Chi/yoga/dance class with direction changes; 5 min/day of ankle and hip mobility. Tai Chi cuts recurrent falls by ~50%."}],"main_points":[{"id":"1_silent_axis","what_pt":"Equilíbrio, coordenação e velocidade de marcha são um eixo do corpo separado da força — e preveem quanto você vive de forma independente.","what_en":"Balance, coordination and gait speed are a body axis separate from strength — and they independently predict how long you live.","why_pt":"Testes simples (sentar-levantar, 10 segundos num pé só, velocidade de caminhada) preveem mortalidade mesmo descontando idade, sexo e coração; a velocidade de marcha virou 'o sexto sinal vital'.","why_en":"Simple tests (sit-to-rise, 10-second one-leg stance, walking speed) predict mortality even after adjusting for age, sex and heart; gait speed became 'the sixth vital sign'.","how_to_know_pt":"Falhe (ou passe) em ficar 10 segundos num pé só sem apoio, perto de uma parede: falhar se associa a 84% mais risco de morte em 7 anos."},{"id":"2_speed_not_strength","what_pt":"O que falha primeiro com a idade não é a força bruta — é a velocidade de gerar força (dinapenia), e é ela que te salva numa escorregada.","what_en":"What fails first with age isn't raw strength — it's the speed of generating force (dynapenia), and that's what saves you in a slip.","why_pt":"Segurar-se numa queda é um movimento de milissegundos; a potência cai mais rápido que a massa muscular, então a força chega tarde e o corpo já foi ao chão. Quedas matam 41 mil idosos/ano nos EUA.","why_en":"Catching a fall is a millisecond movement; power declines faster than muscle mass, so strength arrives late and the body already hit the floor. Falls kill 41,000 older adults/year in the US.","how_to_know_pt":"Repare se você consegue reagir rápido — descer de um degrau, mudar de direção andando — não só levantar peso devagar. Se o rápido some antes do forte, é potência que está indo."},{"id":"3_recipe_cuts_falls","what_pt":"O que corta quedas é treino específico de equilíbrio e movimento funcional 3x na semana — não alongamento, não musculação sozinha.","what_en":"What cuts falls is specific balance and functional-movement training 3× a week — not stretching, not strength alone.","why_pt":"A Cochrane (108 estudos, 23 mil pessoas) e a OMS 2020 dão evidência forte pra treino multicomponente de equilíbrio; o Tai Chi corta cerca de 50% das quedas recorrentes; alongamento estático não reduz lesão nem queda.","why_en":"Cochrane (108 trials, 23,000 people) and WHO 2020 give strong evidence for multicomponent balance training; Tai Chi cuts recurrent falls by ~50%; static stretching reduces neither injury nor falls.","how_to_know_pt":"Se sua rotina não tem nenhum momento em que você desafia o equilíbrio de propósito (um pé só, mudar de direção, levantar do chão), você está treinando força mas não esse eixo."}]}$rlog$::jsonb, now()
  )
  on conflict (slug) do update set
    type = excluded.type,
    dimension_id = excluded.dimension_id,
    topic = excluded.topic,
    reading_minutes = excluded.reading_minutes,
    title_pt = excluded.title_pt, title_en = excluded.title_en,
    summary_pt = excluded.summary_pt, summary_en = excluded.summary_en,
    body_pt = excluded.body_pt, body_en = excluded.body_en,
    takeaways_pt = excluded.takeaways_pt, takeaways_en = excluded.takeaways_en,
    tracking_pt = excluded.tracking_pt, tracking_en = excluded.tracking_en,
    source_url = excluded.source_url,
    source_label_pt = excluded.source_label_pt, source_label_en = excluded.source_label_en,
    reasoning_log = excluded.reasoning_log,
    released_at = now()
  returning id
)
  insert into public.learning_material_sub (material_id, sub_id)
  select id, 'dexterity' from up on conflict (material_id, sub_id) do nothing;

commit;
