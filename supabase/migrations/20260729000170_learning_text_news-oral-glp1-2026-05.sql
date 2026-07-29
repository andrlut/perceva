-- migration: 20260729000170_learning_text_news-oral-glp1-2026-05.sql
-- purpose: Big-release expand — news-oral-glp1-2026-05 (news, health).
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
  'news-oral-glp1-2026-05', 'news', 'health', $topic$news-oral-glp1-2026-05$topic$, 4,
  $title_pt$Pílula oral segura a perda de peso pós-Ozempic$title_pt$,
  $title_en$Oral pill holds weight loss after Ozempic$title_en$,
  $summary_pt$Primeira evidência fase 3 de que dá pra sair da agulha sem devolver o resultado.$summary_pt$,
  $summary_en$First phase 3 evidence you can step off the needle without giving the result back.$summary_en$,
  $body_pt$Ozempic, Wegovy, Mounjaro e Zepbound imitam o GLP-1 — o hormônio que o intestino solta depois das refeições pra avisar o cérebro que você já comeu. Quem emagreceu com eles convive com um medo concreto: parar a injeção semanal costuma trazer a maior parte do peso de volta em poucos meses. A gordura não aprendeu nada; o remédio segurava o apetite, e sem ele o corpo tende a voltar pro ponto de partida.

Um ensaio fase 3 publicado em 12 de maio de 2026 na *Nature Medicine* testou uma saída pela primeira vez: trocar a injeção semanal por um comprimido diário. Quem fez a troca segurou entre 75% e 80% do peso já perdido. Quem trocou por placebo recuperou boa parte dele.

## 1. A primeira prova de que dá pra largar a agulha

O estudo se chama ATTAIN-MAINTAIN. Foram 376 adultos que já tinham emagrecido com tirzepatida ou semaglutida injetável. Todos pararam a injeção. Um grupo passou a tomar orforglipron, um comprimido oral diário; o outro passou a tomar placebo. Um ano de acompanhamento.

O resultado: no grupo que vinha da tirzepatida, a pílula preservou cerca de 75% do peso perdido, contra 49% no placebo. No grupo que vinha da semaglutida, 79% contra 38%. Tudo com significância estatística forte (p<0,001).

Mas o número que mais importa não é a média. É quantas pessoas precisaram de resgate — voltar a um remédio antiobesidade porque o peso disparou de novo. Na pílula, menos de 1 em cada 5 precisou (17% e 22%). No placebo, de metade a dois terços (49% e 65%). Isso é decisão clínica real, não média de planilha.

Calibre a confiança nos números. O desenho é forte: peer-reviewed na Nature Medicine, randomizado e duplo-cego. O financiamento não ajuda. A Eli Lilly, que fabrica o orforglipron, bancou o estudo; vários coautores são funcionários dela e o autor principal declara consultoria paga. Não é replicação independente.

:::quote{author="Dr. Louis Aronne", source="Weill Cornell Medicine, 2026"}
Obesidade é uma condição crônica, como a pressão alta — e exige tratamento crônico.
:::

## 2. Não é "Ozempic em comprimido" — e não é tão forte quanto a injeção

A imprensa vendeu o orforglipron como "o Ozempic em pílula". As duas metades dessa frase pedem cuidado.

Primeiro, o que ele realmente é. Semaglutida e tirzepatida são peptídeos — cadeias de proteína frágeis, que o ácido do estômago destrói. Por isso vêm em injeção. Orforglipron é outra coisa: uma molécula pequena, sintética, cerca de dez vezes menor. Ela sobrevive ao estômago sozinha.

Isso resolve o problema que travou a primeira pílula GLP-1, a Rybelsus. Pra ser absorvida, a Rybelsus exige um facilitador químico e regras chatas: estômago vazio, só água pura, esperar 30 minutos antes de comer ou tomar qualquer outro remédio. O orforglipron não precisa de nada disso. Toma a qualquer hora.

Segundo, a parte que a manchete some. "Tão forte quanto a injeção" não é o que os dados mostram. Sozinho, sem injeção antes, o orforglipron entrega cerca de 12% de perda de peso em 72 semanas (ensaio ATTAIN-1). A semaglutida injetável faz uns 15%; a tirzepatida, quase 21%. A pílula é mais fraca que as duas injeções na largada.

Ou seja, o que o ATTAIN-MAINTAIN mostrou não é que a pílula leva você ao mesmo lugar partindo do zero. É que ela é forte o suficiente pra segurar um platô que você já alcançou com a injeção mais potente. Manutenção, não milagre.

Os efeitos colaterais são os da classe: náusea em cerca de um terço dos pacientes (contra 10% no placebo), constipação comum, e de 5% a 10% abandonam por causa disso. Não apareceu sinal de dano ao fígado. A classe carrega um alerta de tumor de tireoide — mas ele vem de estudos com roedores em dose alta, não de casos humanos confirmados.

## 3. O que fazer com isso hoje: quase nada, e de propósito

Aqui está o anticlímax: hoje, você não faz nada. O orforglipron ainda não tem aprovação da FDA. A Lilly já submeteu o pedido e ganhou uma via de análise acelerada, então uma decisão até o fim de 2026 é plausível — mas não é data confirmada. Não tem o que comprar nem o que trocar.

E o mais importante: quase tudo que já valia continua valendo. GLP-1 exige uso contínuo pra manter o resultado — não é "fiz um ciclo e acabou". O estudo mediu só o peso na balança, não a composição corporal; ou seja, não diz nada sobre músculo. E durante qualquer emagrecimento com GLP-1, sem treino de força e proteína suficiente, você perde massa magra — músculo — junto com a gordura.

:::list-icon
barbell | Treino de força 2-3x na semana pra segurar músculo durante qualquer perda de peso.
restaurant | Proteína suficiente todo dia — o alicerce que o remédio não substitui.
bed | Sono de verdade: apetite desregulado começa com noites curtas.
medkit | Transição de injetável pra oral é conversa com médico, quando (e se) for aprovado.
newspaper | Não decida sua medicação por post de rede social nem manchete.
:::

Pra quem está em GLP-1 hoje, essa notícia é otimismo cauteloso: talvez venha aí uma rampa de saída da agulha que não jogue o peso de volta. Não é ação pra esta semana. Pra todo mundo mais, nada muda — força, proteína e sono seguem movendo o ponteiro, com remédio ou sem.

:::source[Aronne LJ et al., 2026 · Nature Medicine · ATTAIN-MAINTAIN](https://www.nature.com/articles/s41591-026-04386-7)$body_pt$,
  $body_en$Ozempic, Wegovy, Mounjaro, and Zepbound mimic GLP-1 — the hormone your gut releases after a meal to tell your brain you've eaten. Anyone who lost weight on them lives with a real fear: stop the weekly shot and most of the weight tends to come back within months. The fat learned nothing; the drug was holding your appetite down, and without it the body drifts back toward the starting line.

A phase 3 trial published May 12, 2026 in *Nature Medicine* tested an exit for the first time: swap the weekly injection for a daily pill. People who made the switch held onto 75-80% of the weight they'd already lost. People who switched to a placebo regained a big chunk of it.

## 1. The first proof you can drop the needle

The trial is called ATTAIN-MAINTAIN. It enrolled 376 adults who had already lost weight on injectable tirzepatide or semaglutide. Everyone came off the shot. One group started taking orforglipron, a once-daily oral pill; the other took a placebo. They were followed for a year.

The result: in the tirzepatide group, the pill preserved about 75% of the lost weight, against 49% on placebo. In the semaglutide group, 79% against 38%. All of it strongly significant (p<0.001).

The number that matters most isn't the average, though. It's how many people needed rescue — going back on an anti-obesity drug because the weight shot back up. On the pill, fewer than 1 in 5 did (17% and 22%). On placebo, half to two-thirds (49% and 65%). That's a real clinical decision, not a spreadsheet mean.

Calibrate your confidence in the figures. The design is strong: peer-reviewed in Nature Medicine, randomized and double-blind. The funding doesn't help. Eli Lilly, which makes orforglipron, paid for the trial; several co-authors are Lilly employees, and the lead author discloses paid consulting. This is not an independent replication.

:::quote{author="Dr. Louis Aronne", source="Weill Cornell Medicine, 2026"}
Obesity is a chronic condition like high blood pressure, and requires chronic treatment.
:::

## 2. It's not "Ozempic in a pill" — and it's not as strong as the shot

The press sold orforglipron as "Ozempic in a pill." Both halves of that phrase need care.

First, what it actually is. Semaglutide and tirzepatide are peptides — fragile protein chains that stomach acid destroys. That's why they come as injections. Orforglipron is something else: a small synthetic molecule, roughly ten times smaller. It survives the stomach on its own.

That solves the problem that hobbled the first oral GLP-1, Rybelsus. To be absorbed, Rybelsus needs a chemical helper and a set of annoying rules: empty stomach, plain water only, wait 30 minutes before eating or taking any other pill. Orforglipron needs none of that. Take it whenever.

Second, the part the headline drops. "As strong as the shot" isn't what the data says. On its own, with no prior injection, orforglipron delivers about 12% weight loss over 72 weeks (the ATTAIN-1 trial). Injectable semaglutide does around 15%; tirzepatide, nearly 21%. The pill is weaker than both shots from a standing start.

So what ATTAIN-MAINTAIN showed isn't that the pill takes you to the same place from zero. It's that the pill is strong enough to hold a plateau you already reached on the stronger injection. Maintenance, not miracle.

The side effects are the class's usual: nausea in about a third of patients (vs 10% on placebo), common constipation, and 5-10% quitting because of it. No liver signal appeared. The class carries a thyroid-tumor warning — but that comes from high-dose rodent studies, not confirmed human cases.

## 3. What to do about it today: almost nothing, on purpose

Here's the anticlimax: today, you do nothing. Orforglipron has no FDA approval yet. Lilly filed its application and won an expedited-review path, so a decision by late 2026 is plausible — but it's not a confirmed date. There's nothing to buy and nothing to switch.

And the bigger point: almost everything that was already true still is. GLP-1 still requires ongoing use to keep the result — it's not "I did a cycle and I'm done." The trial measured scale weight only, not body composition, so it says nothing about muscle. During any GLP-1 weight loss, without strength training and enough protein, you lose lean mass — muscle — along with the fat.

:::list-icon
barbell | Strength train 2-3x a week to hold muscle through any weight loss.
restaurant | Enough protein every day — the base the drug won't replace.
bed | Real sleep: a dysregulated appetite starts with short nights.
medkit | Injectable-to-oral is a doctor conversation, when (and if) it's approved.
newspaper | Don't decide your medication off a social post or a headline.
:::

For anyone on GLP-1 today, this news is cautious optimism: maybe an off-ramp from the needle is coming, one that won't hand the weight back. It's not an action for this week. For everyone else, nothing changes — strength, protein, and sleep still move the needle, drug or no drug.

:::source[Aronne LJ et al., 2026 · Nature Medicine · ATTAIN-MAINTAIN](https://www.nature.com/articles/s41591-026-04386-7)$body_en$,
  array[$tkpt0$A pílula oral diária orforglipron segurou 75-80% do peso já perdido depois que as pessoas largaram a injeção — contra 38-49% no placebo. Primeiro dado fase 3 desse tipo.$tkpt0$, $tkpt1$Não é 'a injeção em pílula': sozinho ele emagrece menos (~12%) que semaglutida (~15%) ou tirzepatida (~21%). Serve pra manter um platô, não pra chegar nele.$tkpt1$, $tkpt2$Ainda sem aprovação da FDA e financiado pela fabricante. Nada muda hoje: força + proteína + sono seguem sendo o alicerce.$tkpt2$]::text[],
  array[$tken0$The daily oral pill orforglipron held 75-80% of already-lost weight after people came off the injection — vs 38-49% on placebo. First phase 3 data of its kind.$tken0$, $tken1$It's not 'the shot in a pill': on its own it loses less (~12%) than semaglutide (~15%) or tirzepatide (~21%). It maintains a plateau, it doesn't get you there.$tken1$, $tken2$Still no FDA approval and funded by the maker. Nothing changes today: strength + protein + sleep stay the foundation.$tken2$]::text[],
  $trk_pt$Esse news vive em Aprender, na sub Nutrição (Saúde). A implicação prática é pra quem usa ou pensa em GLP-1: o resultado depende de manter força e proteína durante a perda. Conecta com suas tasks de treino de força e registro de refeições, e com o explainer de Nutrição.$trk_pt$,
  $trk_en$This news lives in Learn, under Nutrition (Health). The practical hook is for anyone on or considering GLP-1: the result depends on holding strength and protein through the loss. It connects to your strength-training and meal-logging tasks, and the Nutrition explainer.$trk_en$,
  $src_url$https://www.nature.com/articles/s41591-026-04386-7$src_url$,
  $src_pt$Aronne et al., 2026 · Nature Medicine · ATTAIN-MAINTAIN · n=376$src_pt$,
  $src_en$Aronne et al., 2026 · Nature Medicine · ATTAIN-MAINTAIN · n=376$src_en$,
  $rlog${"template_type":"news","template_version":2,"voice_principles_applied":["3 ideas, not 7 — merged the 6 news reasoning steps into 3 hero sections","Prose-led — only 2 body cards (one :::quote, one :::list-icon) plus the closing :::source","Native PT and native EN written fresh, not translated — different cadence each side","Jargon defined on first mention: GLP-1, peptídeo vs molécula pequena, resgate/rescue, massa magra","Concrete check over abstraction — the rescue-therapy ratio (<1 in 5 vs half to two-thirds) instead of only the averaged percentage","Honest caveats flagged: sponsor funding, not FDA-approved, potency overclaim scoped to maintenance only, mice-not-human thyroid warning, scale-weight-not-body-composition"],"steps":[{"id":"fact","answer_pt":"Em 12/05/2026, a Nature Medicine publicou o ATTAIN-MAINTAIN (Aronne et al., n=376): trocar a injeção semanal de GLP-1 por orforglipron oral diário preservou 75-80% do peso perdido, contra 38-49% no placebo, ao longo de 1 ano.","answer_en":"On 2026-05-12, Nature Medicine published ATTAIN-MAINTAIN (Aronne et al., n=376): switching weekly injectable GLP-1 for daily oral orforglipron preserved 75-80% of lost weight vs 38-49% on placebo over one year."},{"id":"novelty","answer_pt":"Antes: parar GLP-1 injetável significava recuperar quase todo o peso, e as pílulas orais (Rybelsus) eram fracas e chatas de tomar. Depois: existe um oral fácil e potente o bastante pra segurar o resultado. O sinal mais forte é o resgate — menos de 1 em 5 na pílula voltou a remédio antiobesidade, contra metade a dois terços no placebo.","answer_en":"Before: quitting injectable GLP-1 meant regaining nearly everything, and oral pills (Rybelsus) were weak and fussy to take. After: there's an oral option easy and strong enough to hold the result. The strongest signal is rescue — under 1 in 5 on the pill restarted anti-obesity meds, vs half to two-thirds on placebo."},{"id":"evidence_status","answer_pt":"Peer-reviewed na Nature Medicine, randomizado e duplo-cego (padrão-ouro de desenho). Mas financiado pela Eli Lilly, fabricante; vários coautores são funcionários e o autor líder declara consultoria paga — não é replicação independente. Os números diferem um pouco entre o abstract publicado e uma versão de congresso.","answer_en":"Peer-reviewed in Nature Medicine, randomized and double-blind (gold-standard design). But funded by Eli Lilly, the maker; several co-authors are employees and the lead author discloses paid consulting — not an independent replication. Figures differ slightly between the published abstract and a conference cut."},{"id":"implication","answer_pt":"Pra quem usa GLP-1 injetável e teme parar, aparece uma possível saída — no futuro, com aprovação e receita. Hoje não muda a rotina de ninguém: não está aprovado nos EUA (decisão plausível pro fim de 2026, não confirmada).","answer_en":"For people on injectable GLP-1 afraid to stop, a possible exit appears — in the future, with approval and a prescription. Today it changes no one's routine: not approved in the US (a decision by late 2026 is plausible, not confirmed)."},{"id":"what_stays_true","answer_pt":"GLP-1 continua exigindo uso crônico. Estilo de vida segue sendo o alicerce. O estudo mediu só o peso, não a composição corporal — sem treino de força e proteína suficiente, a perda em GLP-1 leva músculo junto com a gordura.","answer_en":"GLP-1 still requires chronic use. Lifestyle stays the foundation. The trial measured only weight, not body composition — without strength training and enough protein, GLP-1 loss takes muscle along with fat."},{"id":"action_or_not","answer_pt":"Veredito: não aja agora. É otimismo cauteloso, não decisão desta semana. Quem usa GLP-1 anota pra conversar com o médico quando (e se) for aprovado; quem não usa segue com força, proteína e sono.","answer_en":"Verdict: don't act now. It's cautious optimism, not a this-week decision. GLP-1 users note it for a doctor talk when (and if) it's approved; everyone else keeps strength, protein, and sleep."}],"main_points":[{"id":"1_needle_exit","what_pt":"Um ensaio fase 3 (ATTAIN-MAINTAIN, n=376) mostrou que trocar a injeção semanal por um comprimido diário de orforglipron segura 75-80% do peso já perdido — contra 38-49% no placebo.","why_pt":"Até agora, largar o GLP-1 injetável significava recuperar quase tudo. É a primeira evidência randomizada de uma rampa de saída da agulha.","how_to_know_pt":"Vale pra quem já emagreceu com semaglutida ou tirzepatida injetável e teme parar. Não vale como forma de começar a emagrecer.","what_en":"A phase 3 trial (ATTAIN-MAINTAIN, n=376) showed switching the weekly injection for a daily orforglipron pill holds 75-80% of already-lost weight — vs 38-49% on placebo.","why_en":"Until now, quitting injectable GLP-1 meant regaining almost everything. This is the first randomized evidence of an off-ramp from the needle."},{"id":"2_not_ozempic_pill","what_pt":"Orforglipron é uma molécula pequena (não um peptídeo), cerca de 10x menor que a semaglutida, que sobrevive ao estômago sem as regras chatas da Rybelsus — mas sozinho emagrece menos que as injeções (~12% vs ~15-21%).","why_pt":"A manchete 'Ozempic em pílula' erra dos dois lados: subestima a novidade real (via oral fácil) e superestima a potência.","how_to_know_pt":"Se você espera trocar a injeção por uma pílula igualmente potente pra começar do zero, o dado não sustenta. Ele sustenta manter um platô já alcançado.","what_en":"Orforglipron is a small molecule (not a peptide), about 10x smaller than semaglutide, surviving the stomach without Rybelsus's fussy rules — but on its own it loses less than the shots (~12% vs ~15-21%).","why_en":"The 'Ozempic in a pill' headline is wrong on both sides: it undersells the real novelty (an easy oral route) and oversells the potency."},{"id":"3_do_almost_nothing","what_pt":"Hoje não há ação: o orforglipron não tem aprovação da FDA e o estudo foi financiado pela fabricante. O que continua valendo é força, proteína e sono.","why_pt":"O estudo mediu só a balança, não músculo. Sem treino de força e proteína, qualquer perda em GLP-1 leva massa magra junto — e isso o remédio não resolve.","how_to_know_pt":"Se você usa GLP-1, é otimismo cauteloso e conversa futura com o médico. Se não usa, nada muda na sua rotina.","what_en":"There's no action today: orforglipron has no FDA approval and the trial was maker-funded. What still holds is strength, protein, and sleep.","why_en":"The trial measured only the scale, not muscle. Without strength training and protein, any GLP-1 loss takes lean mass with it — and the drug doesn't fix that."}]}$rlog$::jsonb, now()
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
cross join (values ('nutrition'), ('strength')) as v(sub_id)
where m.slug = 'news-oral-glp1-2026-05'
on conflict (material_id, sub_id) do nothing;

commit;
