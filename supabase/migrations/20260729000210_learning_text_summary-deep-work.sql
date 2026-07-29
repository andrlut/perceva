-- migration: 20260729000210_learning_text_summary-deep-work.sql
-- purpose: Big-release expand — summary-deep-work (summary, craft).
-- affected: learning_material (upsert by slug) + learning_material_sub.
--           snapshot_material_revision trigger snapshots prior state + bumps version.
-- released_at: kept (unchanged).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'expand for big-release-20260729';

insert into public.learning_material
  (slug, type, dimension_id, topic, reading_minutes,
   title_pt, title_en, summary_pt, summary_en,
   body_pt, body_en,
   takeaways_pt, takeaways_en,
   tracking_pt, tracking_en,
   source_url, source_label_pt, source_label_en,
   reasoning_log, released_at)
values (
  'summary-deep-work', 'summary', 'craft', $topic$summary-deep-work$topic$, 6,
  $title_pt$Deep Work — o foco como vantagem$title_pt$,
  $title_en$Deep Work — focus as an edge$title_en$,
  $summary_pt$A defesa mais clara do foco profundo como vantagem profissional — e onde Newport força a barra.$summary_pt$,
  $summary_en$The clearest case for deep focus as a career edge — and where Newport overreaches.$summary_en$,
  $body_pt$Atenção virou artigo de luxo. Cal Newport escreveu *Deep Work* (Grand Central, 2016) a partir de um incômodo: quase todo trabalho de conhecimento virou um borrão de e-mail, chat e reunião — raso, reativo e fácil de copiar.

A tese é direta. Duas forças de mercado comem o trabalho raso: automação e globalização replicam qualquer tarefa fácil. Sobram duas habilidades escassas — dominar coisas difíceis rápido e produzir num nível de elite. As duas exigem foco profundo. Ou seja: a capacidade de concentrar sem distração está ficando **rara e valiosa ao mesmo tempo**.

:::quote{author="Cal Newport", source="Deep Work (2016)"}
Deep work is becoming both rare and increasingly valuable — and those who cultivate it will thrive.
:::

## 1. Foco é um multiplicador — no sentido literal

Newport resume o livro numa equação simples: multiplique o tempo dedicado pela intensidade do foco — é esse produto que determina a qualidade do trabalho. Repare que é uma multiplicação, não uma soma. Corte a intensidade pela metade e você entrega metade do resultado nas mesmas horas.

O que derruba a intensidade tem nome: **resíduo de atenção**. Quando você troca de tarefa, um pedaço da sua cabeça fica preso na anterior. Você senta pra escrever, mas metade da atenção ainda está naquele e-mail de trinta segundos atrás. Esse arrasto degrada a tarefa seguinte mesmo depois que você "fechou" a primeira.

O termo é de Sophie Leroy (2009). Nos experimentos dela, cada troca de tarefa inacabada derrubava o desempenho. A conta prática é dura: um dia recortado em dez interrupções não rende um décimo de um bloco contínuo — rende bem menos, porque cada retomada paga o pedágio do resíduo. Por isso o trabalho raso é mais caro do que parece. Ele não só ocupa tempo: ele derruba a intensidade do tempo em volta.

## 2. Profundidade constrói habilidade — mas não sozinha

Foco sustentado não é só conforto. É o mecanismo pelo qual você fica bom em algo. Newport se apoia na **prática deliberada**: progresso de elite não vem de repetir o que você já domina, e sim de treinar de forma esforçada, com feedback, no limite da sua capacidade. É treinar a parte que dói, não a que flui. E isso exige profundidade — ninguém pratica deliberadamente checando notificação.

O conceito é de K. Anders Ericsson (1993). Mas é aqui que Newport força a mão, e a honestidade pede dois contrapesos.

O primeiro: uma meta-análise de Macnamara e colegas (2014) atribuiu à prática deliberada só cerca de **12% da variação** na performance entre áreas. Em algumas, como profissões, o peso é bem menor. Talento, contexto (nascer numa família de músicos) e timing carregam o resto. Profundidade é necessária; não é suficiente.

O segundo é mais sutil. Newport empresta de Daniel Coyle a ideia de que a repetição focada envolve os neurônios em **mielina** — a bainha que isola o circuito e "cimenta" a habilidade. A mielinização existe, mas a versão forte da história (quanto mais reps focadas, mais mielina, mais talento) é simplificação de divulgação, não mecanismo fechado pela neurociência. É boa motivação, não é prova.

A leitura sóbria: profundidade é a melhor alavanca que **você controla**. Não é a única coisa que decide o resultado.

## 3. Proteger a profundidade é um sistema, não força de vontade

"Foque mais" é conselho vazio. Newport troca a força de vontade por estrutura — e começa oferecendo quatro filosofias de agenda. Escolha a que cabe na sua vida, não a mais heroica.

:::list-icon
moon | **Monástica** — isole-se quase por completo do raso. Boa pra quem tem um único produto a defender. Faça: corte e-mail e reunião a ponto de virar inacessível.
sync | **Bimodal** — divida o calendário em estações: semanas de reclusão profunda alternadas com períodos abertos. Faça: reserve uma semana por mês só pro trabalho difícil.
timer | **Rítmica** — um bloco profundo fixo, todo dia, virado hábito. A mais realista pra quem tem emprego. Faça: bloqueie 90 min toda manhã antes de abrir o e-mail.
sparkles | **Jornalística** — mergulhe na profundidade em qualquer brecha da agenda. Poderosa, mas exige um músculo de foco já treinado. Faça: ao ver 40 min livres, entre direto na tarefa difícil, sem aquecer.
:::

Pra maioria, a rítmica vence: ela não depende de heroísmo nem de agenda vazia, só de um gatilho diário repetido até virar automático.

Mas agendar profundidade é metade do trabalho. A outra é cortar o raso. Newport chama de **produtividade de horário fixo**: escolha primeiro a hora de largar o trabalho, depois encolha reuniões e e-mail reativo pra caber nesse teto. Sem teto, o raso incha até ocupar o dia inteiro. Ele também pede pra **abraçar o tédio**. Se você saca o celular no primeiro segundo de marasmo, treina o cérebro a fugir de qualquer desconforto. E aí não aguenta o mesmo desconforto na hora do trabalho profundo. A metade restauradora disso se apoia na Teoria da Restauração da Atenção (Berman, Jonides e Kaplan, 2008): caminhadas na natureza melhoraram tarefas de atenção logo depois. O estudo é pequeno e antigo, mas o efeito geral se sustenta em meta-análise para exposições mais longas — direção certa, número impreciso. E, sobre ferramentas, Newport propõe o **filtro do artesão**. Você tende a adotar um app assim que ele oferece qualquer vantagem. Adote só se o ganho pros seus objetivos mais importantes superar de longe o custo à sua concentração.

Um aviso honesto fecha o capítulo. Quase todos os exemplos do livro — Newport (professor concursado), o romancista Neal Stephenson, o acadêmico Adam Grant — controlam a própria agenda. Um operário de turno ou alguém num escritório aberto e reativo começa de outro lugar. As quatro filosofias pressupõem uma autonomia de calendário que talvez você não tenha.

O saldo: *Deep Work* é uma tese de um botão só — proteja a atenção e o resto melhora. O exagero está em sugerir que profundidade quase garante maestria (a evidência diz ~12%, não 100%) e em generalizar a partir de profissões incomumente autônomas. Leia como um manual de defesa do foco num mundo desenhado pra fragmentá-lo — não como uma promessa de excelência.

:::source[Deep Work — Cal Newport (Grand Central, 2016)](https://www.hachettebookgroup.com/titles/cal-newport/deep-work/9781455586691/)$body_pt$,
  $body_en$Attention has become a luxury good. Cal Newport wrote *Deep Work* (Grand Central, 2016) from a single irritation: nearly all knowledge work has melted into a blur of email, chat, and meetings — shallow, reactive, easy to copy.

His argument is blunt. Two market forces devour shallow work: automation and globalization can replicate any easy task. What stays scarce is the ability to master hard things fast and to produce at an elite level. Both demand deep focus. So the capacity to concentrate without distraction is turning **rare and valuable at the same time**.

:::quote{author="Cal Newport", source="Deep Work (2016)"}
Deep work is becoming both rare and increasingly valuable — and those who cultivate it will thrive.
:::

## 1. Focus is a multiplier — in the literal sense

Newport boils the book down to one simple equation: multiply the time you put in by the intensity of your focus — that product is what sets the quality of the work. Note that it multiplies, it doesn't add. Halve your intensity and you ship half the result in the same hours.

What drags intensity down has a name: **attention residue**. When you switch tasks, part of your head stays stuck on the last one. You sit down to write, but half your attention is still on that email from thirty seconds ago. The drag degrades the next task even after you've "closed" the first.

The term is Sophie Leroy's (2009). In her experiments, every switch to a new task before finishing the last one dragged performance down. The practical math stings: a day chopped into ten interruptions doesn't yield a tenth of one unbroken block — it yields far less, because every restart pays the residue toll. That's why shallow work costs more than it looks. It doesn't just take time; it lowers the intensity of the time around it.

## 2. Depth builds skill — but not on its own

Sustained focus isn't just comfortable. It's the mechanism by which you get good at something. Newport leans on **deliberate practice**: elite progress comes not from repeating what you already do well, but from effortful, feedback-driven work at the edge of your ability. It's drilling the part that hurts, not the part that flows. And that needs depth — nobody practices deliberately while checking notifications.

The concept is K. Anders Ericsson's (1993). But this is where Newport pushes too far, and honesty asks for two counterweights.

First: a meta-analysis by Macnamara and colleagues (2014) credited deliberate practice with only about **12% of the variance** in performance across domains. In some, like professions, the share is far smaller. Talent, context (being born into a family of musicians), and timing carry the rest. Depth is necessary; it isn't sufficient.

The second is subtler. Newport borrows from Daniel Coyle the idea that focused repetition wraps neurons in **myelin** — the sheath that insulates a circuit and "cements" a skill. Myelination is real, but the strong version of the story (more focused reps means more myelin means more talent) is a popular-science simplification, not a settled neuroscience mechanism. Good motivation, not proof.

The sober read: depth is the best lever **you control**. It isn't the only thing that decides the outcome.

## 3. Protecting depth is a system, not willpower

"Focus more" is empty advice. Newport swaps willpower for structure, starting with four scheduling philosophies. Pick the one that fits your life, not the most heroic one.

:::list-icon
moon | **Monastic** — isolate yourself almost entirely from the shallow. Good if you have one product to defend. Do: cut email and meetings until you're effectively unreachable.
sync | **Bimodal** — split the calendar into seasons: weeks of deep seclusion alternating with open periods. Do: reserve one week a month for the hard work only.
timer | **Rhythmic** — a fixed deep block, every day, turned into habit. The most realistic for anyone with a job. Do: block 90 min every morning before you open email.
sparkles | **Journalistic** — drop into depth in any gap that opens. Powerful, but it needs an already-trained focus muscle. Do: when 40 free minutes appear, dive straight into the hard task, no warm-up.
:::

For most people, rhythmic wins: it needs no heroism and no empty calendar, just a daily trigger repeated until it runs on autopilot.

But scheduling depth is only half the job. The other half is cutting the shallow. Newport calls it **fixed-schedule productivity**: choose your quitting time first, then shrink meetings and reactive email to fit under that cap. Without a cap, shallow work swells to fill the whole day. He also asks you to **embrace boredom**. Reach for your phone at the first dull second and you train your brain to flee any discomfort. Then it can't sit with the same discomfort deep work demands. The restorative half rests on Attention Restoration Theory (Berman, Jonides, and Kaplan, 2008): walks in nature improved attention tasks right afterward. That study is small and old, but the broad effect holds up in meta-analysis for longer exposures — right direction, imprecise number. On tools, Newport offers the **craftsman's filter**. You tend to adopt an app the moment it offers any upside at all. Adopt one only if its gain to your most important goals clearly outweighs its cost to your concentration.

An honest warning closes the chapter. Almost every example in the book — Newport (a tenured professor), the novelist Neal Stephenson, the academic Adam Grant — controls his own calendar. A shift worker, or someone in a reactive open-plan office, starts somewhere else entirely. The four philosophies quietly assume a scheduling autonomy you may not have.

The balance: *Deep Work* is a one-knob thesis — protect your attention and the rest improves. The overreach is implying depth nearly guarantees mastery (the evidence says ~12%, not 100%) and generalizing from unusually autonomous professions. Read it as a manual for defending focus in a world built to fragment it — not as a promise of excellence.

:::source[Deep Work — Cal Newport (Grand Central, 2016)](https://www.hachettebookgroup.com/titles/cal-newport/deep-work/9781455586691/)$body_en$,
  array[$tkpt0$A qualidade do trabalho é o tempo multiplicado pela intensidade do foco: com a atenção picada, você entrega bem menos nas mesmas horas.$tkpt0$, $tkpt1$A prática deliberada (treinar no limite, com feedback) constrói habilidade — mas explica só ~12% da performance, então foco ajuda, não basta.$tkpt1$, $tkpt2$Das quatro filosofias de Newport, a rítmica (um bloco profundo fixo por dia) é a única realista para quem trabalha.$tkpt2$]::text[],
  array[$tken0$Work quality is time multiplied by the intensity of focus: with attention fragmented, you deliver far less in the same hours.$tken0$, $tken1$Deliberate practice (training at the edge, with feedback) builds skill — but explains only ~12% of performance, so focus helps, it isn't enough.$tken1$, $tken2$Of Newport's four philosophies, the rhythmic one (a fixed daily deep block) is the only realistic one for working adults.$tken2$]::text[],
  $trk_pt$Esse summary fica em Aprender, sob o sub Construir (Craft). A forma de aplicar é criar uma prática diária — um bloco rítmico de 90 min de trabalho profundo, antes do e-mail — alocada ao sub Construir. O app rastreia isso como streak: cada dia que você cumpre o bloco mantém a sequência viva, e a curva de momentum mostra, ao longo das semanas, se a profundidade virou hábito ou ainda é exceção.$trk_pt$,
  $trk_en$This summary lives in Learn under the Build sub (Craft). The way to apply it is to create a daily practice — a rhythmic 90-min deep-work block before email — allocated to the Build sub. The app tracks it as a streak: every day you hit the block keeps the run alive, and the momentum curve shows, over weeks, whether depth has become a habit or is still the exception.$trk_en$,
  $src_url$https://www.hachettebookgroup.com/titles/cal-newport/deep-work/9781455586691/$src_url$,
  $src_pt$Deep Work — Cal Newport (Grand Central, 2016)$src_pt$,
  $src_en$Deep Work — Cal Newport (Grand Central, 2016)$src_en$,
  $rlog${"template_type":"summary","template_version":1,"voice_principles_applied":["Three ideas, not seven","Prose-led (2 body cards: list-icon recipe + closing source)","Native PT and EN — parallel, not translated","Define jargon on first mention (resíduo de atenção, prática deliberada, mielina, produtividade de horário fixo)","Concrete examples over abstract noun lists (anchored 'contexto' with 'nascer numa família de músicos')","Consistent 'você' voice","Read-aloud sentence length (split four 30-37 word sentences)"],"steps":[{"id":"author_question","answer_pt":"Por que o trabalho de conhecimento virou um borrão raso de e-mail/chat/reunião — e o que se perde quando ninguém mais consegue focar fundo?","answer_en":"Why has knowledge work dissolved into a shallow blur of email/chat/meetings — and what is lost when no one can focus deeply anymore?"},{"id":"author_thesis","answer_pt":"A hipótese do deep work: a capacidade de focar sem distração em tarefa cognitivamente exigente está ficando rara E valiosa ao mesmo tempo, logo é economicamente premiada.","answer_en":"The deep work hypothesis: the ability to focus without distraction on cognitively demanding work is becoming both rare AND valuable, so it is economically prized."},{"id":"core_ideas","answer_pt":"Exatamente 3: (1) foco é multiplicador e a troca de tarefa custa via resíduo de atenção (Leroy 2009); (2) profundidade vira habilidade via prática deliberada (Ericsson 1993), com o contraponto Macnamara ~12% dobrado aqui; (3) as 4 filosofias de agendamento, cada uma com âncora comportamental, rítmica como padrão realista.","answer_en":"Exactly 3: (1) focus is a multiplier and task-switching costs via attention residue (Leroy 2009); (2) depth compounds into skill via deliberate practice (Ericsson 1993), with the Macnamara ~12% counterweight folded in; (3) the 4 scheduling philosophies, each with a behavioral anchor, rhythmic as the realistic default."},{"id":"evidence","answer_pt":"Resíduo de atenção: Leroy 2009 (Organizational Behavior and Human Decision Processes). Prática deliberada: Ericsson 1993, definido em linguagem simples. Contraponto: Macnamara et al. 2014, Psychological Science — só ~12% da variância.","answer_en":"Attention residue: Leroy 2009 (Organizational Behavior and Human Decision Processes). Deliberate practice: Ericsson 1993, defined plainly. Counterweight: Macnamara et al. 2014, Psychological Science — only ~12% of variance."},{"id":"actionable","answer_pt":"Escolha uma das 4 filosofias; para a maioria, a rítmica: bloqueie 90 min de profundidade toda manhã antes do e-mail. Drene o raso. Rastreado como tarefa diária no sub Construir via streak.","answer_en":"Pick one of the 4 philosophies; for most, rhythmic: block 90 min of depth every morning before email. Drain the shallows. Tracked as a daily task under the Build sub via streak."},{"id":"verdict","answer_pt":"Tese de um botão só: proteja a atenção e o resto melhora. Exagero: sugerir que profundidade quase garante maestria — Macnamara mostra ~12%. Vale como manual de defesa do foco, não como promessa de excelência.","answer_en":"One-knob thesis: protect attention and the rest improves. Overreach: implying depth nearly guarantees mastery — Macnamara shows ~12%. Worth it as a manual for defending focus, not a promise of excellence."}],"main_points":[{"id":"1_foco_multiplicador","what_pt":"Foco é um multiplicador: a qualidade do trabalho é o tempo vezes a intensidade da atenção, e trocar de tarefa deixa resíduo que derruba essa intensidade.","what_en":"Focus is a multiplier: work quality is time times the intensity of attention, and switching tasks leaves residue that drags that intensity down.","why_pt":"Mostra por que um dia picado em dez interrupções rende muito menos que um bloco contínuo — cada retomada paga o pedágio do resíduo (Leroy, 2009).","why_en":"Shows why a day chopped into ten interruptions yields far less than one continuous block — every restart pays the residue toll (Leroy, 2009).","how_to_know_pt":"O leitor consegue nomear 'resíduo de atenção' e explicar por que é multiplicação, não soma."},{"id":"2_profundidade_habilidade","what_pt":"Profundidade constrói habilidade via prática deliberada — treinar no limite, com feedback — mas não sozinha.","what_en":"Depth builds skill via deliberate practice — training at the edge, with feedback — but not on its own.","why_pt":"A meta-análise de Macnamara (2014) atribui à prática deliberada só ~12% da variância; talento, contexto e timing carregam o resto.","why_en":"Macnamara's meta-analysis (2014) credits deliberate practice with only ~12% of the variance; talent, context, and timing carry the rest.","how_to_know_pt":"O leitor sabe que profundidade é necessária mas não suficiente e cita o contrapeso dos ~12%."},{"id":"3_sistema_nao_forca","what_pt":"Proteger a profundidade é um sistema — quatro filosofias de agenda, com a rítmica como padrão realista — não força de vontade.","what_en":"Protecting depth is a system — four scheduling philosophies, with the rhythmic one as the realistic default — not willpower.","why_pt":"Sem estrutura, o raso incha até tomar o dia; a rítmica só exige um bloco diário repetido até virar automático.","why_en":"Without structure, the shallow swells to fill the day; the rhythmic philosophy only needs a daily block repeated until it runs on autopilot.","how_to_know_pt":"O leitor escolhe uma filosofia e sabe bloquear 90 min de profundidade toda manhã antes do e-mail."}]}$rlog$::jsonb, now()
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
cross join (values ('build')) as v(sub_id)
where m.slug = 'summary-deep-work'
on conflict (material_id, sub_id) do nothing;

commit;
