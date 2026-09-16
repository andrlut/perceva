-- migration: 20260916000002_learning_ideas_bids-for-connection.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          bids-for-connection · 3 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-16 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     bids-for-connection/idea.1.535fe1c0.webp  (960x1200, gemini-api)
--     bids-for-connection/idea.2.1a6358f0.webp  (960x1200, gemini-api)
--     bids-for-connection/idea.3.773fb850.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     bids-for-connection/cover.5e2f978d.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum (video = {pt: null, en: null})

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['bids-for-connection']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- bids-for-connection: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/bids-for-connection/cover.5e2f978d.webp',
    updated_at = now()
where slug = 'bids-for-connection';

-- bids-for-connection · 3 ideia(s)
update public.learning_material
set ideas = $ideas$[{"id":"bid-pedido-de-atencao","ordinal":1,"title":{"pt":"Bids: o “olha isso” não é sobre a paisagem","en":"Bids: “look at this” isn’t about the view"},"claim":{"pt":"Bid é qualquer tentativa de puxar o outro pra interação. A resposta se volta pra ele, ignora ou ataca.","en":"A bid is any attempt to draw your partner in. The reply turns toward it, turns away, or turns against it."},"body":{"pt":"Janice Driver e John Gottman filmaram recém-casados jantando e codificaram cada tentativa de interação, o que eles chamam de bid: um pedido de atenção. O manual do estudo (Driver & Gottman, Family Process, 2004) separa sete tipos de pedido, seis neutros ou positivos e um negativo. Um comentário solto pode ser um. Uma brincadeira também: os pesquisadores codificaram os pedidos brincalhões à parte. A resposta cai em três famílias. **Voltar-se para** é acolher o pedido. Afastar-se é ignorar. Voltar-se contra é responder com hostilidade. O exemplo do próprio artigo: no meio de uma discussão, a esposa pergunta “o que aconteceu com as suas meias?”, e o marido ri. Pelo manual, isso é voltar-se para, mesmo em plena briga. Os autores sugerem que os bids podem ser as unidades básicas com que um casal constrói a amizade. Nesta semana, repare nos pedidos que chegam até você no jantar, principalmente os disfarçados de comentário jogado no ar. **Você só responde melhor ao pedido que enxerga.**","en":"Janice Driver and John Gottman filmed newlyweds over dinner and coded every attempt to interact, which they call a bid: a request for attention. The study’s manual (Driver & Gottman, Family Process, 2004) sorts bids into seven types, six neutral or positive and one negative. A stray remark can be one. So can a joke; the researchers coded playful bids separately. Replies fall into three families. **Turning toward** means taking the bid up. Turning away means ignoring it. Turning against means answering with hostility. The paper’s own example: mid-argument, the wife asks, “What happened to your socks?” and the husband laughs. By the manual, that counts as turning toward, fight and all. The authors suggest bids may be the basic units couples use to build their friendship. This week, watch for the bids that reach you at dinner, especially the ones disguised as an offhand comment. **You can only answer the bids you notice.**"},"image":{"path":"bids-for-connection/idea.1.535fe1c0.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Driver & Gottman, 2004 · Family Process · n=49 (texto completo)","en":"Driver & Gottman, 2004 · Family Process · n=49 (full text)"},"url":"https://www.johngottman.net/wp-content/uploads/2011/05/Daily-Marital-Interations-and-Positive-Affect-During-Marital-Conflict-Among-Newlywed-Couples.pdf"}],"cta":null},{"id":"numero-do-divorcio-sem-fonte","ordinal":2,"title":{"pt":"Bids e divórcio: o número famoso não tem fonte","en":"Bids and divorce: the famous stat has no source"},"claim":{"pt":"Os 86% contra 33% vêm de um livro de autoajuda de 2001. Os 90% de acerto são de outros estudos, e contestados.","en":"The 86% vs 33% stat traces to a 2001 self-help book. The 90% accuracy comes from other, contested studies."},"body":{"pt":"A frase circula em todo lugar: casais que seguiam casados seis anos depois atendiam os pedidos de atenção 86% das vezes, e os que se separaram, 33%. Quem segue a trilha dessa dupla de números chega a um livro de autoajuda, The Relationship Cure (Gottman & DeClaire, 2001). A frase não aparece no estudo revisado sobre bids, que nem mediu divórcio. Os famosos 90% de acerto vêm de outras pesquisas: 93,6% com entrevistas sobre a história do casal (Buehlman, Gottman & Katz, 1992) e a codificação de brigas de Gottman & Levenson (1992), de onde também sai a proporção de cinco interações positivas pra cada negativa. Heyman & Slep (2001) apontaram a falha: os modelos foram avaliados nos mesmos casais que serviram pra construí-los, o que infla o acerto. Faltou **validação cruzada**, ou seja, testar a fórmula em casais novos. Quando ler que um hábito “prevê o divórcio com X%”, pergunte o que foi medido e se o teste usou gente nova.","en":"The line is everywhere: couples still married six years on turned toward bids 86% of the time, and couples who divorced only 33%. Follow that pair of numbers back and you land in a self-help book, The Relationship Cure (Gottman & DeClaire, 2001). It isn’t in the peer-reviewed bids study, which never measured divorce. The famous 90% accuracy comes from other research: 93.6% from interviews about a couple’s shared history (Buehlman, Gottman & Katz, 1992), and Gottman & Levenson’s 1992 coding of arguments, which is also where the five-positives-per-negative ratio comes from. Heyman & Slep (2001) named the flaw: models were scored on the same couples used to build them, which inflates accuracy. What was missing is **cross-validation**, testing the formula on couples it has never seen. Next time a headline says a habit “predicts divorce with X% accuracy,” ask what was measured and whether the test used fresh couples."},"image":{"path":"bids-for-connection/idea.2.1a6358f0.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Gottman Institute · blog que repete os 86% × 33% (fonte secundária)","en":"Gottman Institute · blog restating 86% vs 33% (secondary source)"},"url":"https://www.gottman.com/blog/want-to-improve-your-relationship-start-paying-more-attention-to-bids/"},{"label":{"pt":"Gottman & Levenson, 1992 · J. Pers. Soc. Psychol. · PubMed","en":"Gottman & Levenson, 1992 · J. Pers. Soc. Psychol. · PubMed"},"url":"https://pubmed.ncbi.nlm.nih.gov/1403613/"},{"label":{"pt":"Andrew Gelman · crítica estatística aos “90%”","en":"Andrew Gelman · statistical critique of the “90%” claims"},"url":"https://statmodeling.stat.columbia.edu/2010/06/04/a_wikipedia_whi/"}],"cta":null},{"id":"jantar-atento-briga-branda","ordinal":3,"title":{"pt":"Bids: resposta no jantar, briga mais branda","en":"Bids: dinner-table replies, softer fights"},"claim":{"pt":"Em 49 recém-casados, atender pedidos de atenção no jantar andou junto com mais humor na briga. Correlação, não prova.","en":"In 49 newlywed couples, answering bids at dinner went with more humor and affection in fights. Correlation, not proof."},"body":{"pt":"Driver & Gottman (Family Process, 2004) filmaram 49 casais recém-casados em dois momentos do mesmo ano: um jantar comum e uma discussão de 15 minutos sobre um conflito. Quem mais fazia pedidos brincalhões e respondia com entusiasmo à mesa mostrou mais humor e carinho na hora de discutir. A análise achou a seta do jantar pra briga um pouco mais forte do que a contrária, mas os autores falam em inferência cautelosa e em provável mão dupla. Por que isso importa: no grupo maior, de 130 recém-casados, o afeto positivo durante a briga foi a única variável que previu estabilidade e satisfação seis anos depois (Gottman e colegas, 1998). Os próprios autores chamam o achado de preliminar e dizem que só uma intervenção provaria causa. **Atender o pedido é uma aposta barata, não uma garantia.** No próximo “olha isso”, tire os olhos da tela e pergunte o que é.","en":"Driver & Gottman (Family Process, 2004) filmed 49 newlywed couples twice in the same year: at an ordinary dinner and in a 15-minute talk about a conflict. Couples who made more playful bids and answered with enthusiasm at the table showed more humor and affection when they argued. The analysis found the arrow from dinner to fight slightly stronger than the reverse, but the authors call it a cautious inference and expect it runs both ways. Why it matters: in the larger group of 130 newlyweds, positive affect during conflict was the only variable that predicted both stability and satisfaction six years later (Gottman and colleagues, 1998). The authors call their result preliminary and say only an intervention could prove cause. **Answering a bid is a cheap bet, not a guarantee.** Next time you hear “look at this,” take your eyes off the screen and ask what it is."},"image":{"path":"bids-for-connection/idea.3.773fb850.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Driver & Gottman, 2004 · Family Process · n=49 (texto completo)","en":"Driver & Gottman, 2004 · Family Process · n=49 (full text)"},"url":"https://www.johngottman.net/wp-content/uploads/2011/05/Daily-Marital-Interations-and-Positive-Affect-During-Marital-Conflict-Among-Newlywed-Couples.pdf"},{"label":{"pt":"Driver & Gottman, 2004 · resumo na editora (Wiley)","en":"Driver & Gottman, 2004 · publisher abstract (Wiley)"},"url":"https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1545-5300.2004.00024.x"}],"cta":null}]$ideas$::jsonb,
    updated_at = now()
where slug = 'bids-for-connection';

-- bids-for-connection: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'bids-for-connection'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
