-- migration: 20260729000230_learning_text_summary-outlive.sql
-- purpose: Big-release polish — summary-outlive (summary, health).
-- affected: learning_material (upsert by slug) + learning_material_sub.
--           snapshot_material_revision trigger snapshots prior state + bumps version.
-- released_at: kept (unchanged).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'polish for big-release-20260729';

insert into public.learning_material
  (slug, type, dimension_id, topic, reading_minutes,
   title_pt, title_en, summary_pt, summary_en,
   body_pt, body_en,
   takeaways_pt, takeaways_en,
   tracking_pt, tracking_en,
   source_url, source_label_pt, source_label_en,
   reasoning_log, released_at)
values (
  'summary-outlive', 'summary', 'health', $topic$summary-outlive$topic$, 6,
  $title_pt$Outlive: o que sobra depois do ceticismo$title_pt$,
  $title_en$Outlive: What Survives a Skeptic's Read$title_en$,
  $summary_pt$O livro-referência de longevidade de Peter Attia separado em três pilhas: consenso sólido, opinião informada e o que ignorar.$summary_pt$,
  $summary_en$Peter Attia's landmark longevity book, sorted into three piles: solid consensus, informed opinion, and what to skip.$summary_en$,
  $body_pt$Em 2023, Peter Attia publicou *Outlive*, um livro que virou referência na conversa sobre longevidade. A pergunta dele é específica: por que a medicina moderna falha em prevenir as quatro doenças que, pelos números de mortalidade que ele cita, matam 80% das pessoas em países desenvolvidos? Cardiovascular, câncer, neurodegenerativa, metabólica. As respostas dele formam o que ele chama de Medicina 3.0 — uma abordagem preventiva, proativa e personalizada, focada em manter saúde funcional ao longo do tempo, não só em estender a vida.

> Medicine 3.0 prioriza prevenção muito mais que tratamento.

A diferença entre o livro e os centenas de "como viver mais" que existem é que Attia não é evangelista de uma intervenção. Ele monta um framework. Algumas peças desse framework são consenso mainstream apresentado bem. Outras são opinião informada que ele defende como se fosse consenso. Vale separar os dois.

## 1. Os quatro cavaleiros e a tese central

A organização do livro gira em torno do que Attia chama de Quatro Cavaleiros. São as quatro famílias de doença que dominam a mortalidade adulta depois dos 50: doença cardiovascular ateroesclerótica (infarto, AVC), câncer, doenças neurodegenerativas (Alzheimer) e diabetes tipo 2. Juntas, respondem por cerca de 80% das mortes não-acidentais nos países ricos — pelos números de mortalidade que Attia cita.

A inovação retórica dele é apontar que resistência à insulina — a condição metabólica que precede o diabetes tipo 2 — também aparece como fator de risco nas outras três. Daí vem o conceito de "Diabetes Tipo 3" pra Alzheimer (proposto antes do Attia, mas popularizado por ele): a hipótese de que disfunção metabólica cerebral é parte central do mecanismo.

Eric Topol, cardiologista respeitado, descreveu a apresentação leiga desses Cavaleiros como a melhor que já viu. Mas vale apontar onde a moldura é mais retórica que substantiva. A premissa de "uma raiz única (insulina)" é poderosa pedagogicamente, mas reducionista — o papel da insulina em câncer e Alzheimer ainda é hipótese, não consenso. E o modelo agressivo de prevenção cardiovascular dele soa radical, mas não é. Attia mede apoB — uma proteína que carrega o "colesterol ruim" e prediz risco cardíaco melhor que o LDL clássico — e não só o LDL-C. A recomendação é baixar esse marcador "o mais cedo e o mais baixo possível". Isso coincide com o que cardiologistas preventivos mainstream já fazem na maioria dos casos; a diferença é mais de intensidade que de fundamento.

## 2. A parte que sobrevive sem ressalva: exercício

Se há um capítulo do livro que vale o preço sozinho, é o de exercício. Attia argumenta — corretamente, segundo o consenso atual — que a capacidade cardiorrespiratória (basicamente, o condicionamento aeróbico) é o fator de risco de morte mais forte — e o único que dá pra treinar de verdade. Sair dos 25% piores de condicionamento pra os 25% melhores corresponde a aproximadamente 5 vezes menos risco de morte — efeito **maior** que parar de fumar. Estudo de 122 mil pessoas, publicado no *JAMA Network Open* em 2018 (Mandsager et al.).

A receita que ele defende é ~80% Zone 2 + 20% trabalho de VO2 max — a capacidade máxima do corpo de consumir oxigênio sob esforço, treinada com intervalos de alta intensidade — mais treino de força pesado, mais estabilidade e mobilidade. Zone 2 é a faixa de intensidade aeróbica em que o corpo ainda queima principalmente gordura como combustível. É nela que se constroem a fundação aeróbica e a densidade mitocondrial — a mitocôndria é a estrutura dentro da célula que gera energia aeróbica.

> Se eu pudesse prescrever um único medicamento pra saúde e longevidade, seria exercício — e dentro disso, o tipo mais importante seria a eficiência aeróbica, o que chamamos de Zone 2.

A direção dessa receita é boa ciência. Mas Attia extrapola a divisão exata 80/20 do treinamento de elite endurance pro adulto comum, e a evidência de ensaios randomizados especificamente apoiando essa proporção é fina. Brad Stanfield, médico que faz vídeos críticos sobre longevidade, aponta isso: Zone 2 importa, mas a dose exata é opinião, não regra.

Attia também propõe o Decatlo Centenário — uma forma criativa de planejamento. Que tarefas físicas alguém quer poder fazer na sua "Década Marginal", os últimos 10 anos de vida? Carregar mala de 30 lbs, levantar do chão sem ajuda, pegar neto no colo. Como a função decai de 10 a 15% por década depois dos 50 — número que Attia cita para justificar o método —, é preciso chegar aos 50 com o dobro da forma que se vai precisar aos 80. É um frame útil pra dar direção concreta ao treino.

## 3. Onde o livro tropeça e o que sobra disso

O capítulo de screening agressivo é o mais contestado. Attia defende ressonância de corpo inteiro de rotina pra rastrear câncer cedo. Eric Topol criticou explicitamente: leva a cascata de biópsias por achados acidentais, ansiedade do paciente, e zero ganho prospectivo de mortalidade comprovado em populações sem fator de risco.

A farmacologia é a parte mais especulativa. Attia toma rapamicina off-label. O sinal de extensão de vida em outras espécies (camundongos especialmente) é o mais forte de qualquer droga já testada. Mas em humanos? Zero dados de outcome de longo prazo. O ensaio PEARL de 2024 foi largamente nulo nos endpoints funcionais que mediu. Bryan Johnson — outro evangelista da longevidade — notavelmente parou rapamicina citando efeitos colaterais.

E depois tem a questão de acesso. A clínica do Attia, Early Medical, cobra, segundo relatos, entre cinco e seis dígitos anuais por paciente e atende menos de 100 pessoas. Críticos chamam de "saúde pra os 0,1%." As prescrições de exercício, sono e nutrição democratizam — qualquer um pode aplicar. A camada de testes de biomarcadores avançados e GP-concierge, não. Attia reconhece esse gap mas não o resolve.

Mas o gap é menor do que parece. Boa parte do que faz diferença em *Outlive* não depende de consultório de seis dígitos:

:::list-icon
flask | Peça apoB no próximo exame de sangue de rotina — é fator de risco reconhecido em diretriz, custo marginal, não é teste exótico.
checkmark-circle | Peça Lp(a) uma vez na vida — é uma partícula de colesterol herdada geneticamente, e o valor quase não muda com dieta; testou uma vez, resolveu.
close-circle | Não peça ressonância de corpo inteiro sem indicação de risco específica.
close-circle | Não comece rapamicina por conta própria — o ensaio PEARL (2024) foi nulo nos desfechos funcionais em humanos.
barbell | Zone 2 + força pesada — de graça, e é o item com a evidência mais forte de todos.
:::

Vale ler? Sim, uma vez, com ceticismo. *Outlive* é a melhor síntese mainstream do caso preventivo pra healthspan (anos vividos com função plena) que existe pro leitor não-técnico, especialmente nas seções de exercício e metabolismo. Trate os capítulos de screening agressivo e farmacologia como opinião informada, não consenso. E o modelo da clínica como aspiracional, não literal.

*Nota separada*: o nome de Attia apareceu nos arquivos Epstein liberados em janeiro de 2026, e a CBS News rompeu o vínculo com ele em fevereiro. Isso afeta o mensageiro, não a ciência do livro — vale avaliar uma coisa e outra separadas.

:::source[Attia, P. — Outlive · Harmony 2023 · ISBN 978-0593236598. Review: Topol, Ground Truths](https://erictopol.substack.com/p/a-review-of-outlive)$body_pt$,
  $body_en$In 2023, Peter Attia published *Outlive*, a book that became a reference in the longevity conversation. His question is specific: why does modern medicine fail to prevent the four diseases that, by the mortality figures he cites, kill 80% of people in developed countries? Cardiovascular, cancer, neurodegenerative, metabolic. His answers form what he calls Medicine 3.0 — a preventive, proactive, personalized approach focused on maintaining functional health over time, not just extending life.

> Medicine 3.0 places a far greater emphasis on prevention than treatment.

The difference between the book and the hundreds of "how to live longer" out there is that Attia isn't an evangelist for a single intervention. He builds a framework. Some pieces of that framework are mainstream consensus presented well. Others are informed opinion he defends as if it were consensus. Worth separating the two.

## 1. The Four Horsemen and the central thesis

The book is organized around what Attia calls the Four Horsemen. These are the four disease families that dominate adult mortality after 50: atherosclerotic cardiovascular disease (heart attack, stroke), cancer, neurodegenerative diseases (Alzheimer's), and type 2 diabetes. Together, they account for about 80% of non-accidental deaths in wealthy countries — by the mortality figures Attia cites.

His rhetorical innovation is to point out that insulin resistance — the metabolic condition that precedes type 2 diabetes — also appears as a risk factor in the other three. That's where the "Type 3 Diabetes" framing for Alzheimer's comes from (proposed before Attia, but popularized by him): the hypothesis that cerebral metabolic dysfunction is central to the mechanism.

Eric Topol, a respected cardiologist, called the lay presentation of these Horsemen the best he's ever seen. But the framing is sometimes more rhetorical than substantive. The "single root (insulin)" premise is pedagogically powerful but reductive — the role of insulin in cancer and Alzheimer's is still hypothesis, not consensus. And his aggressive cardiovascular prevention model sounds radical but isn't. Attia measures apoB — a protein that carries "bad cholesterol" and predicts cardiac risk better than classic LDL — not just LDL-C. His recommendation is to lower that marker "as early and as low as possible." That overlaps with what preventive cardiologists already do in most cases; the difference is more about intensity than foundation.

## 2. The part that survives unqualified: exercise

If there's one chapter that's worth the price of the book alone, it's the one on exercise. Attia argues — correctly, by current consensus — that cardiorespiratory fitness (basically, aerobic conditioning) is the strongest — and most trainable — risk factor for mortality. Going from the bottom 25% of fitness to the top 25% corresponds to roughly 5 times lower mortality risk — a **larger** effect than quitting smoking. Study of 122,000 people, published in *JAMA Network Open* in 2018 (Mandsager et al.).

The recipe he advocates is ~80% Zone 2 + 20% VO2 max work — the body's maximum capacity to consume oxygen under effort, trained with high-intensity intervals — plus heavy strength training, plus stability and mobility. Zone 2 is the aerobic intensity range where the body still burns mostly fat as fuel. That's where aerobic foundation and mitochondrial density get built — mitochondria being the structure inside the cell that generates aerobic energy.

> If I could only prescribe one drug for health and longevity, it would be exercise — and within that, the single most important type would be aerobic efficiency, what we call Zone 2.

The direction of this recipe is good science. But Attia extrapolates the exact 80/20 split from elite endurance training to the average adult, and the randomized-trial evidence specifically supporting that proportion is thin. Brad Stanfield, a physician who makes critical videos on longevity, points this out: Zone 2 matters, but the precise dose is opinion, not rule.

Attia also proposes the Centenarian Decathlon — a creative way of planning. What physical tasks does someone want to still be able to perform in their "Marginal Decade" — the last 10 years of life? Carry a 30-lb suitcase, get off the floor unaided, lift a grandchild. Since function declines 10 to 15% per decade after 50 — a figure Attia cites to justify the method — someone would have to reach 50 twice as fit as they'll need to be at 80. It's a useful frame for giving training a concrete direction.

## 3. Where the book stumbles and what's left

The aggressive screening chapter is the most contested. Attia advocates routine whole-body MRI to screen for cancer early. Eric Topol criticized this explicitly: it leads to a cascade of biopsies from incidental findings, patient anxiety, and zero proven prospective mortality benefit in populations without risk factors.

Pharmacology is the most speculative part. Attia takes rapamycin off-label. The lifespan extension signal in other species (mice especially) is the strongest of any drug ever tested. But in humans? Zero long-term outcome data. The 2024 PEARL trial was largely null on the functional endpoints it measured. Bryan Johnson — another longevity evangelist — notably stopped rapamycin citing side effects.

And then there's the access question. Attia's clinic, Early Medical, reportedly charges between five and six figures annually per patient and serves fewer than 100 people. Critics call it "healthcare for the 0.1%." The exercise, sleep, and nutrition prescriptions democratize — anyone can apply them. The layer of advanced biomarker testing and concierge GP, doesn't. Attia acknowledges this gap but doesn't solve it.

But the gap is smaller than it looks. Most of what actually moves the needle in *Outlive* needs no six-figure clinic at all:

:::list-icon
flask | Ask for apoB at your next routine blood draw — it's a guideline-recognized risk marker, marginal cost, not an exotic test.
checkmark-circle | Test Lp(a) once in your life — it's a genetically inherited cholesterol particle whose value barely moves with diet; test once, done.
close-circle | Don't order a whole-body MRI without a specific risk reason.
close-circle | Don't start rapamycin on your own — the 2024 PEARL trial was null on human functional endpoints.
barbell | Zone 2 plus heavy strength — free, and the item with the strongest evidence of all.
:::

Worth reading? Yes, once, with skepticism. *Outlive* is the best mainstream synthesis of the prevention-first case for healthspan (years lived in full function) available to the non-technical reader, especially in the exercise and metabolism sections. Treat the aggressive screening and pharmacology chapters as informed opinion, not consensus. And the clinic model as aspirational, not literal.

*Separate note*: Attia's name appeared in the Epstein files released in January 2026, and CBS News ended its relationship with him in February. This affects the messenger, not the book's science — worth evaluating each separately.

:::source[Attia, P. — Outlive · Harmony 2023 · ISBN 978-0593236598. Review: Topol, Ground Truths](https://erictopol.substack.com/p/a-review-of-outlive)$body_en$,
  array[$tkpt0$Capacidade cardiorrespiratória é o fator de risco de morte mais forte que dá pra treinar — sair dos 25% piores para os 25% melhores corta o risco em ~5x, mais que parar de fumar.$tkpt0$, $tkpt1$O capítulo de exercício (Zone 2 + força pesada) é ciência sólida e de graça; o screening agressivo e a rapamicina são opinião especulativa que ele defende como consenso.$tkpt1$, $tkpt2$Peça apoB e Lp(a) no próximo exame de sangue de rotina — quase todo o valor prático de Outlive não depende de clínica de seis dígitos.$tkpt2$]::text[],
  array[$tken0$Cardiorespiratory fitness is the strongest death-risk factor you can actually train — moving from the bottom 25% to the top 25% cuts risk ~5x, more than quitting smoking.$tken0$, $tken1$The exercise chapter (Zone 2 + heavy strength) is solid, free science; aggressive screening and rapamycin are speculative opinion he frames as consensus.$tken1$, $tken2$Ask for apoB and Lp(a) at your next routine blood draw — nearly all of Outlive's practical value needs no six-figure clinic.$tken2$]::text[],
  $trk_pt$Quando você registra treinos aeróbicos e de força no Perceva, está aplicando exatamente a parte de Outlive com a evidência mais forte. Acompanhe a consistência dos seus treinos de Zone 2 e força na dimensão Corpo ao longo das semanas para ver a fundação aeróbica sendo construída na prática.$trk_pt$,
  $trk_en$When you log aerobic and strength workouts in Perceva, you're applying exactly the part of Outlive with the strongest evidence. Track your Zone 2 and strength consistency in the Body dimension over the weeks to see the aerobic foundation getting built in practice.$trk_en$,
  $src_url$https://erictopol.substack.com/p/a-review-of-outlive$src_url$,
  $src_pt$Attia, P. — Outlive · Harmony 2023 · ISBN 978-0593236598. Resenha: Topol, Ground Truths$src_pt$,
  $src_en$Attia, P. — Outlive · Harmony 2023 · ISBN 978-0593236598. Review: Topol, Ground Truths$src_en$,
  $rlog${"template_type":"summary","template_version":2,"voice_principles_applied":["Three ideas, not seven — three heading sections (cavaleiros, exercise, where it stumbles)","Prose-led — one :::list-icon recipe + closing :::source only","Native PT and native EN — reworked the flagged sentences fresh in each language rather than translating","Define jargon on first mention — added glosses for VO2 max and mitochondria; Zone 2, apoB, Lp(a), healthspan already defined inline","Concrete examples beat abstract noun lists — Decathlon tasks, the two blood-draw tests","Read aloud test — split the two run-on sentences flagged for length"],"steps":[{"id":"sourcing_fix","answer_pt":"Atribuí cada número duro que estava solto: os dois 80% e o declínio de 10-15%/década passam a citar 'os números de mortalidade que Attia cita'; o preço da clínica virou 'segundo relatos'; e o falso-preciso 90% virou 'na maioria dos casos', consistente com o resto do texto que já nomeava Mandsager et al. e o ensaio PEARL.","answer_en":"Attributed every loose hard number: both 80% figures and the 10-15%/decade decline now cite 'the mortality figures Attia cites'; the clinic pricing became 'reportedly'; and the fake-precise 90% became 'in most cases', consistent with the rest of the piece which already named Mandsager et al. and the PEARL trial."},{"id":"banned_phrase_fix","answer_pt":"Removi 'preditor modificável' (FAIL) reescrevendo como 'o fator de risco de morte mais forte — e o único que dá pra treinar de verdade', e troquei 'Zone 2 é importante' por 'Zone 2 importa' para eliminar o filler 'é importante'.","answer_en":"Removed the PT 'preditor modificável' by rewriting to 'strongest — and most trainable — risk factor for mortality' in EN for parallelism; the PT 'é importante' filler became 'importa'."},{"id":"jargon_fix","answer_pt":"VO2 max ganhou glosa do que mede ('a capacidade máxima do corpo de consumir oxigênio sob esforço'), separando isso do protocolo de treino; mitocôndria ganhou sua própria definição em vez de pegar carona na de Zone 2.","answer_en":"VO2 max got a gloss of what it measures ('the body's maximum capacity to consume oxygen under effort'), separated from the training protocol; mitochondria got its own definition instead of riding on Zone 2's."},{"id":"voice_fix","answer_pt":"Coloquei o parágrafo do Decatlo Centenário em terceira pessoa ('Que tarefas físicas alguém quer poder fazer') para casar com o registro analítico de resenha do resto do texto.","answer_en":"Put the Centenarian Decathlon paragraph in third person ('What physical tasks does someone want to still be able to perform') to match the book-review analytical register of the rest."},{"id":"sentence_length_fix","answer_pt":"Quebrei a frase dos Quatro Cavaleiros e o parágrafo do apoB (antes ~54 palavras) em orações curtas, cada uma com um ponto só.","answer_en":"Split the Four Horsemen sentence and the apoB run-on (previously ~54 words) into short clauses, each carrying a single point."}],"main_points":[{"id":"1_quatro_cavaleiros","what_pt":"Os Quatro Cavaleiros (cardiovascular, câncer, neurodegenerativa, diabetes tipo 2) e a tese de que resistência à insulina os conecta; forte como pedagogia, parcialmente hipótese como mecanismo.","what_en":"The Four Horsemen (cardiovascular, cancer, neurodegenerative, type 2 diabetes) and the thesis that insulin resistance links them; strong as pedagogy, partly hypothesis as mechanism.","why_pt":"Separa o que é consenso apresentado bem (apoB, prevenção precoce) do que é moldura retórica (raiz única na insulina).","why_en":"It separates consensus presented well (apoB, early prevention) from rhetorical framing (a single insulin root).","how_to_know_pt":"Topol chamou a apresentação leiga de melhor que já viu, mas o papel da insulina em câncer/Alzheimer segue hipótese, não consenso."},{"id":"2_exercicio","what_pt":"O capítulo de exercício: capacidade cardiorrespiratória como o fator de risco mais treinável, com a receita Zone 2 + VO2 max + força.","what_en":"The exercise chapter: cardiorespiratory fitness as the most trainable risk factor, with the Zone 2 + VO2 max + strength recipe.","why_pt":"É a parte com a evidência mais forte e de aplicação gratuita — o que sobrevive sem ressalva.","why_en":"It's the strongest-evidence, free-to-apply part — what survives unqualified.","how_to_know_pt":"Mandsager et al. 2018 (JAMA Network Open, n=122 mil): sair dos 25% piores para os 25% melhores ~ 5x menos risco de morte, mais que parar de fumar."},{"id":"3_onde_tropeca","what_pt":"Onde o livro tropeça: screening agressivo, rapamicina e a clínica de seis dígitos — e o kit prático e barato que sobra.","what_en":"Where the book stumbles: aggressive screening, rapamycin, and the six-figure clinic — and the cheap, practical kit that's left.","why_pt":"Distingue opinião especulativa defendida como consenso do que qualquer leitor pode aplicar sem consultório caro.","why_en":"It distinguishes speculative opinion framed as consensus from what any reader can apply without an expensive clinic.","how_to_know_pt":"Topol criticou a ressonância de corpo inteiro; o ensaio PEARL de 2024 foi nulo nos desfechos funcionais da rapamicina; apoB e Lp(a) são testes de custo marginal em diretriz."}]}$rlog$::jsonb, now()
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
  released_at = learning_material.released_at;

insert into public.learning_material_sub (material_id, sub_id)
select m.id, v.sub_id
from public.learning_material m
cross join (values ('strength'), ('nutrition')) as v(sub_id)
where m.slug = 'summary-outlive'
on conflict (material_id, sub_id) do nothing;

commit;
