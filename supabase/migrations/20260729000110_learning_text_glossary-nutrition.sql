-- migration: 20260729000110_learning_text_glossary-nutrition.sql
-- purpose: Big-release rewrite — glossary-nutrition (explainer, health).
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
    'glossary-nutrition', 'explainer', 'health', $topic$glossary-nutrition$topic$, 7,
    $title_pt$Comida não é só caloria$title_pt$,
    $title_en$Food isn't just calories$title_en$,
    $summary_pt$As três coisas que a ciência diz que importam na comida — e por que a guerra entre dietas é, em boa parte, teatro.$summary_pt$,
    $summary_en$The three things science says actually matter in food — and why the war between diets is mostly theater.$summary_en$,
    $body_pt$Imagine dois cafés da manhã. No papel, são idênticos: mesmas calorias, mesma proteína, mesma gordura, mesmo açúcar, mesma fibra. A única diferença é a origem — um foi montado com comida de verdade, o outro saiu embalado de uma fábrica. Faz sentido pensar que você comeria a mesma quantidade dos dois.

Não come. Num experimento do NIH americano, as pessoas na versão ultraprocessada comeram 500 calorias a mais por dia — sem perceber, com a comida totalmente liberada nas duas dietas. Em duas semanas ganharam quase um quilo, que perderam de volta assim que trocaram pra comida de verdade.

Esse é o incômodo central da nutrição: quase tudo que você ouve fala de quanto comer. Quase nada fala do que a comida faz com você antes de você decidir quanto. Este texto é sobre as três coisas que realmente movem o ponteiro — e sobre por que a guerra entre dietas é, em boa parte, teatro.

## 1. Comida não é só caloria

Comece pelo experimento que abriu este texto. Em 2019, o pesquisador Kevin Hall internou 20 adultos num centro do NIH e controlou cada garfada por um mês. Duas semanas comendo ultraprocessados, duas semanas comendo comida minimamente processada — e aqui está o truque: as duas dietas foram igualadas no papel. Mesma quantidade de calorias oferecidas, mesma proporção de carboidrato, gordura, proteína, açúcar, sódio e fibra. As pessoas podiam comer o quanto quisessem.

Mesmo com tudo igualado, elas comeram **508 calorias a mais por dia** na dieta ultraprocessada. O extra veio de carboidrato e gordura, não de proteína. Ganharam peso numa dieta e perderam na outra — só pela forma como a comida foi construída.

O que conta como ultraprocessado? O termo é do pesquisador brasileiro Carlos Monteiro, que criou a classificação NOVA. Não é "comida com conservante" nem "comida industrializada" de forma vaga. É comida feita principalmente de substâncias extraídas de alimentos — óleos, amidos, açúcares, proteínas isoladas — mais aditivos, com pouco ou nenhum alimento inteiro dentro. Refrigerante, salgadinho, nugget, pão de forma industrial, a maioria dos cereais matinais. Se a lista de ingredientes tem coisas que você não teria na sua cozinha, é um bom sinal.

Por que isso te faz comer mais? A comida ultraprocessada é macia, densa em calorias e some rápido — você mastiga menos e engole mais antes de o corpo perceber que comeu. Ela carrega pouca fibra e muita caloria por garfada, então enche o estômago devagar em relação à energia que entrega. Você termina o prato antes de o sinal de saciedade chegar.

Isso não é um detalhe de nicho. Num levantamento dos dados de nutrição dos EUA (Steele et al., *BMJ Open*, 2016, dados NHANES), ultraprocessados já respondem por 58% de todas as calorias do americano médio — e por quase 90% do açúcar adicionado. A comida-padrão do mundo rico virou justamente o tipo que engana o seu apetite.

Um aviso honesto: o estudo de Hall é pequeno e curto — 20 pessoas, duas semanas por dieta. Ele prova que o ultraprocessado faz comer mais, não que causa esta ou aquela doença em 20 anos. Essa parte vem de estudos populacionais grandes, que mostram correlação forte mas não fecham a causa sozinhos.

## 2. A guerra das dietas é quase toda teatro

Se comida de verdade importa tanto, qual dieta é a certa? Low carb? Jejum? Cetogênica? Aqui vem a parte que a indústria de dietas não quer que você saiba: quando a qualidade da comida e as calorias são parecidas, o rótulo da dieta quase não muda o resultado.

O teste mais limpo disso é o estudo DIETFITS, de Stanford, publicado no *JAMA* em 2018. Seiscentas e nove pessoas foram sorteadas pra uma dieta "low fat saudável" ou "low carb saudável" e acompanhadas por um ano. As duas cortaram ultraprocessado e açúcar e priorizaram comida de verdade. No fim de 12 meses, a diferença de peso entre os dois grupos foi estatisticamente igual a zero. E mais: nem o perfil genético nem a resposta de insulina de cada pessoa previram quem se daria melhor em qual dieta — a promessa favorita do marketing de dieta personalizada.

Some a isso uma análise de 59 estudos que comparou as dietas de marca — Atkins, Zone, Weight Watchers e companhia (Johnston et al., *JAMA*, 2014). Entre elas, a diferença foi pequena demais pra importar. O contraste que vale é fazer dieta contra não fazer, não Atkins contra Zone.

Isso não significa que caloria não conta. Conta — déficit calórico é física, você precisa gastar mais do que entra pra perder gordura. O que muda é de onde vem a força do resultado: não de uma proporção mágica de macronutriente, e sim de quanto tempo você consegue sustentar o hábito. A melhor dieta é a que você mantém.

E cuidado com a régua de bolso mais repetida: "cada 3.500 calorias de déficit derrete meio quilo de gordura". É uma simplificação estática que superestima quanto você vai perder. O erro é ignorar a adaptação metabólica: conforme você emagrece, o corpo fica menor e gasta menos energia, então o mesmo déficit rende cada vez menos. Modelos mais honestos, construídos a partir de dados controlados, preveem uma perda mais lenta — e batem melhor com a balança real. Por isso o platô depois de alguns meses é regra, não fracasso pessoal.

## 3. Os três números que valem a pena guardar

Se dá pra esquecer o rótulo da dieta, o que sobra pra prestar atenção? Três números.

O primeiro é fibra. Fibra é a parte das plantas que seu corpo não digere — a casca do feijão, o farelo do grão, o fio do talo. Ela alimenta suas bactérias intestinais, alenta a digestão e ajuda você a se sentir cheio com menos caloria. Uma revisão de 185 estudos publicada na *The Lancet* ligou comer mais fibra a um risco 15% a 30% menor de morrer, com o benefício subindo até uns 25 a 30 gramas por dia. A parte constrangedora: menos de 1 em cada 10 adultos chega perto disso. (Esse é o número mais sólido; a porcentagem exata varia conforme o estudo.) O benefício da fibra vem sobretudo de dados populacionais, então trate como uma aposta muito bem apoiada, não como lei da física.

O segundo é proteína. Aqui mora a confusão mais comum da nutrição. Você já ouviu que precisa de 0,8 grama de proteína por quilo de peso — para alguém de 70 quilos, uns 56 gramas por dia. Só que esse número, a RDA (a dose diária recomendada), foi calculado como o piso pra não perder massa muscular num adulto parado. É a dose mínima pra não ter deficiência, não o alvo pra construir músculo, envelhecer bem ou se sentir saciado. Para ganho de músculo com treino, uma meta-análise de 49 estudos mostrou que o benefício se estabiliza perto de 1,6 grama por quilo (Morton et al., *British Journal of Sports Medicine*, 2018) — cerca de 112 gramas pra mesma pessoa de 70 quilos. Acima disso não sobra ganho extra. Proteína também é o macronutriente que mais sacia por caloria: a mesma refeição com mais proteína te deixa cheio por mais tempo.

O terceiro é açúcar. A OMS recomenda manter os "açúcares livres" abaixo de 10% das suas calorias — e, de bônus, abaixo de 5%. "Açúcar livre" é o que foi adicionado à comida mais o que está no suco e no mel, não o açúcar preso na fruta inteira. A fruta continua liberada; o problema é o refrigerante, o doce e o suco.

Junta tudo numa rotina:

:::list-icon
restaurant | Monte o prato em volta de comida de verdade: se a lista de ingredientes é longa, coma menos.
leaf | Mire 25 a 30 g de fibra por dia — feijão, aveia, frutas com casca, verduras, grãos integrais.
fitness | Coloque proteína em toda refeição; mire perto de 1,6 g por quilo se você treina.
water | Corte a caloria líquida primeiro: refrigerante e suco são o açúcar livre mais fácil de eliminar.
checkmark-circle | Escolha a dieta que você consegue manter por um ano, não a mais radical por três semanas.
:::

O jornalista Michael Pollan destilou décadas de pesquisa em nutrição em sete palavras que envelheceram melhor que qualquer dieta da moda:

> Coma comida. Não demais. Principalmente plantas.

Nenhum desses números te obriga a contar caloria pra sempre nem a jurar lealdade a uma tribo alimentar. Comida de verdade regula seu apetite sozinha, fibra e proteína fazem o trabalho pesado da saciedade, e a única dieta que funciona é a que sobrevive ao seu calendário. O resto é marketing.

:::source[Hall et al., 2019 · Cell Metabolism · n=20 (RCT cruzado)](https://www.cell.com/cell-metabolism/fulltext/S1550-4131%2819%2930248-7)$body_pt$,
    $body_en$Picture two breakfasts. On paper they're identical: same calories, same protein, same fat, same sugar, same fiber. The only difference is where they came from — one was built from whole food, the other came shrink-wrapped from a factory. You'd assume you'd eat the same amount of either.

You wouldn't. In an NIH experiment, people on the ultra-processed version ate 500 more calories a day — without noticing, with food fully unrestricted on both diets. In two weeks they gained nearly a kilo, which they lost again the moment they switched back to whole food.

That's the quiet problem with nutrition: almost everything you hear is about how much to eat. Almost nothing is about what the food does to you before you decide how much. This is about the three things that actually move the needle — and why the war between diets is mostly theater.

## 1. Food isn't just calories

Start with the experiment that opened this piece. In 2019, researcher Kevin Hall admitted 20 adults to an NIH ward and controlled every bite for a month. Two weeks eating ultra-processed food, two weeks eating minimally processed food — and here's the trick: the two diets were matched on paper. Same calories offered, same ratio of carbs, fat, protein, sugar, sodium, and fiber. People could eat as much as they wanted.

Even with everything matched, they ate **508 more calories a day** on the ultra-processed diet. The surplus came from carbs and fat, not protein. They gained weight on one diet and lost it on the other — purely from how the food was built.

So what counts as ultra-processed? The term comes from Brazilian researcher Carlos Monteiro, who created the NOVA classification. It isn't a vague "food with preservatives" or "industrial food." It's food made mostly from substances extracted from foods — oils, starches, sugars, isolated proteins — plus additives, with little or no intact food inside. Soda, chips, nuggets, mass-market sliced bread, most breakfast cereals. If the ingredient list has things you'd never keep in your kitchen, that's a good tell.

Why does it make you eat more? Ultra-processed food is soft, calorie-dense, and gone fast — you chew less and swallow more before your body registers the meal. It carries little fiber and a lot of calories per bite, so it fills your stomach slowly relative to the energy it delivers. You clear the plate before the fullness signal arrives.

This isn't a niche detail. In an analysis of U.S. nutrition data (Steele et al., *BMJ Open*, 2016, NHANES data), ultra-processed foods already supply 58% of the average American's calories — and nearly 90% of their added sugar. The default food of the rich world is precisely the kind that fools your appetite.

One honest caveat: Hall's study is small and short — 20 people, two weeks per diet. It proves ultra-processed food makes you eat more, not that it causes any specific disease over 20 years. That part comes from large population studies, which show a strong correlation but can't nail causation on their own.

## 2. The diet wars are mostly theater

If whole food matters this much, which diet is the right one? Low-carb? Fasting? Keto? Here's the part the diet industry would rather you didn't know: once food quality and calories are similar, the diet's label barely changes the outcome.

The cleanest test of this is Stanford's DIETFITS trial, published in *JAMA* in 2018. Six hundred and nine people were randomly assigned to a "healthy low-fat" or "healthy low-carb" diet and followed for a year. Both cut ultra-processed food and sugar and leaned on whole food. After 12 months, the weight difference between the two groups was statistically zero. And neither genetic profile nor insulin response predicted who'd do better on which diet — the favorite promise of personalized-diet marketing.

Add to that an analysis of 59 trials comparing the brand-name diets — Atkins, Zone, Weight Watchers, and the rest (Johnston et al., *JAMA*, 2014). The differences between them were too small to matter. The contrast worth caring about is dieting versus not dieting, not Atkins versus Zone.

None of this means calories don't count. They do — a calorie deficit is physics, you have to burn more than you take in to lose fat. What changes is where the result comes from: not a magic macronutrient ratio, but how long you can keep the habit going. The best diet is the one you actually stick to.

And be wary of the most repeated rule of thumb: "every 3,500-calorie deficit melts a pound of fat." It's a static oversimplification that overpredicts how much you'll lose. The flaw is ignoring metabolic adaptation: as you slim down, your body gets smaller and burns less energy, so the same deficit buys less and less. More honest models, built from controlled feeding data, predict a slower loss — and match the real scale better. That's why the plateau after a few months is the rule, not a personal failure.

## 3. The three numbers worth keeping

If you can forget the diet label, what's left to watch? Three numbers.

The first is fiber. Fiber is the part of plants your body can't digest — the skin of a bean, the bran of a grain, the string in a celery stalk. It feeds your gut bacteria, slows digestion, and helps you feel full on fewer calories. A review of 185 studies published in *The Lancet* linked eating more fiber to a 15% to 30% lower risk of dying, with the benefit climbing up to about 25 to 30 grams a day. The embarrassing part: fewer than 1 in 10 adults gets close. (That's the solid figure; the exact percentage shifts study to study.) The fiber benefit comes mostly from population data, so treat it as a very well-supported bet, not a law of physics.

The second is protein. This is where nutrition's most common confusion lives. You've heard you need 0.8 grams of protein per kilo of body weight — for someone weighing 70 kilos, about 56 grams a day. But that number, the RDA (recommended dietary allowance), was set as the floor to avoid losing muscle mass in a sedentary adult. It's the minimum to prevent deficiency, not the target for building muscle, aging well, or staying full. For muscle gain with training, a meta-analysis of 49 trials found the benefit plateaus around 1.6 grams per kilo (Morton et al., *British Journal of Sports Medicine*, 2018) — about 112 grams for that same 70-kilo person. Above that, no extra gain. Protein is also the macronutrient that satisfies most per calorie: the same meal with more protein keeps you full longer.

The third is sugar. The WHO recommends keeping "free sugars" below 10% of your calories — and, for a bonus, below 5%. "Free sugar" is what's added to food plus what's in juice and honey, not the sugar locked inside whole fruit. Whole fruit stays fine; the problem is soda, sweets, and juice.

Put it into a routine:

:::list-icon
restaurant | Build the plate around whole food: the longer the ingredient list, the less of it you should eat.
leaf | Aim for 25 to 30 g of fiber a day — beans, oats, fruit with skin, vegetables, whole grains.
fitness | Put protein in every meal; aim near 1.6 g per kilo if you train.
water | Cut liquid calories first: soda and juice are the easiest free sugar to drop.
checkmark-circle | Pick the diet you can hold for a year, not the most extreme one for three weeks.
:::

Journalist Michael Pollan distilled decades of nutrition research into seven words that have aged better than any fad diet:

> Eat food. Not too much. Mostly plants.

None of these numbers forces you to count calories forever or swear loyalty to a food tribe. Whole food regulates your appetite on its own, fiber and protein do the heavy lifting of fullness, and the only diet that works is the one that survives your calendar. The rest is marketing.

:::source[Hall et al., 2019 · Cell Metabolism · n=20 (crossover RCT)](https://www.cell.com/cell-metabolism/fulltext/S1550-4131%2819%2930248-7)$body_en$,
    array[$tkpt0$Ultraprocessado te faz comer ~500 calorias a mais por dia mesmo com calorias e macros igualados — comida de verdade regula seu apetite sozinha.$tkpt0$, $tkpt1$Qual dieta você segue quase não muda o resultado: com comida e calorias parecidas, low carb e low fat empatam. A melhor é a que você mantém por um ano.$tkpt1$, $tkpt2$Três números valem mais que qualquer rótulo: 25-30 g de fibra por dia, ~1,6 g de proteína por quilo se você treina, e açúcar livre abaixo de 10% das calorias.$tkpt2$]::text[],
    array[$tken0$Ultra-processed food makes you eat ~500 more kcal/day even when calories and macros are matched — whole food regulates your appetite on its own.$tken0$, $tken1$Which diet you follow barely changes the outcome: with food and calories similar, low-carb and low-fat tie. The best one is the one you keep for a year.$tken1$, $tken2$Three numbers beat any label: 25-30 g of fiber a day, ~1.6 g of protein per kilo if you train, and free sugar under 10% of your calories.$tken2$]::text[],
    $trk_pt$Cada refeição que você registra no seu sub de Nutrição é menos um exercício de contar caloria e mais um voto: comida de verdade em vez de embalada, fibra e proteína em vez de macio e vazio. Ao longo das semanas, o app mostra menos o número do prato e mais o padrão — se sua rotina está girando em torno de comida que sacia sozinha ou de comida que te engana. É esse padrão, não a dieta da moda, que move o ponteiro.$trk_pt$,
    $trk_en$Every meal you log under your Nutrition sub is less about counting calories and more of a vote: whole food over shrink-wrapped, fiber and protein over soft and empty. Over the weeks, the app shows less of the number on the plate and more of the pattern — whether your routine is built around food that fills you up on its own or food that fools you. That pattern, not the fad diet, is what moves the needle.$trk_en$,
    $src_url$https://www.cell.com/cell-metabolism/fulltext/S1550-4131%2819%2930248-7$src_url$,
    $src_pt$Hall et al., 2019 · Cell Metabolism · n=20 (RCT cruzado)$src_pt$,
    $src_en$Hall et al., 2019 · Cell Metabolism · n=20 (crossover RCT)$src_en$,
    $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Three ideas not seven","Prose-led with a single list-icon recipe + closing source","Native PT and native EN written in parallel","Define jargon on first mention (ultraprocessado/NOVA, RDA, açúcar livre, fibra, adaptação metabólica)","Concrete examples over abstract noun lists","Every hard stat now names a study, author or journal"],"steps":[{"id":"hook","answer_pt":"Dois cafés da manhã idênticos no papel geram fomes diferentes — o experimento do NIH (Hall) mostra 500 kcal/dia a mais no ultraprocessado com tudo igualado. Abre o texto sem card de stat, com a cena concreta.","answer_en":"Two breakfasts identical on paper produce different hungers — Hall's NIH experiment shows +500 kcal/day on ultra-processed with everything matched. Opens with the concrete scene, no top stat card."},{"id":"idea_1","answer_pt":"Comida não é só caloria: a forma como é construída muda quanto você come. Define ultraprocessado via NOVA/Monteiro e ancora o mecanismo (macia, densa, pouca fibra). Fecha com o caveat honesto sobre o tamanho do estudo.","answer_en":"Food isn't just calories: how it's built changes how much you eat. Defines ultra-processed via NOVA/Monteiro and anchors the mechanism (soft, dense, low fiber). Closes with the honest small-study caveat."},{"id":"idea_2","answer_pt":"A guerra das dietas é teatro: DIETFITS (JAMA 2018) e a meta-análise de marcas (Johnston, JAMA 2014) mostram empate quando comida e calorias se equiparam. Déficit é física, mas a força vem da aderência. Mito da régua de 3.500 kcal desmontado como prosa.","answer_en":"The diet wars are theater: DIETFITS (JAMA 2018) and the brand meta-analysis (Johnston, JAMA 2014) show a tie once food and calories match. Deficit is physics, but the leverage is adherence. The 3,500-kcal rule myth debunked as prose."},{"id":"idea_3","answer_pt":"Três números que sobram: fibra (25-30 g, The Lancet), proteína (RDA vs 1,6 g/kg, Morton 2018), açúcar livre (<10%, OMS). Recipe em list-icon + citação do Pollan como blockquote iconico.","answer_en":"Three numbers that remain: fiber (25-30 g, The Lancet), protein (RDA vs 1.6 g/kg, Morton 2018), free sugar (<10%, WHO). Recipe in list-icon + Pollan's iconic blockquote."},{"id":"close","answer_pt":"Fecha ligando os três: comida de verdade regula o apetite, fibra e proteína carregam a saciedade, e a dieta que funciona é a que sobrevive ao calendário. O resto é marketing.","answer_en":"Closes by tying the three together: whole food regulates appetite, fiber and protein carry fullness, and the diet that works is the one that survives your calendar. The rest is marketing."},{"id":"review_fixes","answer_pt":"Correções pós-review: adicionados takeaways_en e tracking_en; três stats agora citam a fonte inline — Steele et al. (BMJ Open 2016, NHANES) para os 58%/90%, Johnston et al. (JAMA 2014) para os 59 estudos, Morton et al. (BJSM 2018) para 1,6 g/kg.","answer_en":"Post-review fixes: added takeaways_en and tracking_en; three stats now cite the source inline — Steele et al. (BMJ Open 2016, NHANES) for 58%/90%, Johnston et al. (JAMA 2014) for the 59-trial comparison, Morton et al. (BJSM 2018) for 1.6 g/kg."}],"main_points":[{"id":"1_comida_nao_e_so_caloria","what_pt":"A forma como a comida é construída — não só suas calorias — determina quanto você come.","why_pt":"O RCT de Hall igualou dois cardápios no papel e ainda assim o ultraprocessado gerou +508 kcal/dia.","how_to_know_pt":"Olhe a lista de ingredientes: se tem coisas que você não teria na cozinha, é ultraprocessado.","what_en":"How food is built — not just its calories — drives how much you eat.","why_en":"Hall's RCT matched two menus on paper and ultra-processed still drove +508 kcal/day.","how_to_know_pt_alt":""},{"id":"2_dietas_sao_teatro","what_pt":"Quando comida e calorias se equiparam, o rótulo da dieta quase não muda o resultado.","why_pt":"DIETFITS (JAMA 2018) e a meta-análise de marcas (Johnston, JAMA 2014) deram empate.","how_to_know_pt":"Se a dieta prometida corta comida de verdade e você não a sustenta por um ano, o rótulo é irrelevante.","what_en":"Once food and calories match, the diet label barely changes the result.","why_en":"DIETFITS (JAMA 2018) and the brand meta-analysis (Johnston, JAMA 2014) came out even.","how_to_know_pt_alt":""},{"id":"3_tres_numeros","what_pt":"Três números merecem atenção: fibra, proteína e açúcar livre.","why_pt":"Fibra liga-se a menor mortalidade (The Lancet), proteína satura em ~1,6 g/kg (Morton 2018), açúcar livre abaixo de 10% (OMS).","how_to_know_pt":"Mire 25-30 g de fibra, ~1,6 g/kg de proteína se treina, e corte a caloria líquida primeiro.","what_en":"Three numbers deserve attention: fiber, protein, and free sugar.","why_en":"Fiber links to lower mortality (The Lancet), protein plateaus at ~1.6 g/kg (Morton 2018), free sugar under 10% (WHO).","how_to_know_pt_alt":""}]}$rlog$::jsonb, now()
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
  select id, 'nutrition' from up on conflict (material_id, sub_id) do nothing;

commit;
