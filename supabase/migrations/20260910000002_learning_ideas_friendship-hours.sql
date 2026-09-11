-- migration: 20260910000002_learning_ideas_friendship-hours.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          friendship-hours · 3 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-10 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     friendship-hours/idea.1.3d7b4a8c.webp  (960x1200, gemini-api)
--     friendship-hours/idea.2.f2bcd362.webp  (960x1200, gemini-api)
--     friendship-hours/idea.3.004dd62f.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     friendship-hours/cover.0de34658.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum (video = {pt: null, en: null})

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['friendship-hours']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- friendship-hours: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/friendship-hours/cover.0de34658.webp',
    updated_at = now()
where slug = 'friendship-hours';

-- friendship-hours · 3 ideia(s)
update public.learning_material
set ideas = $ideas$[{"id":"relogio-da-amizade","ordinal":1,"title":{"pt":"Ninguém vira seu amigo em três cafés.","en":"Nobody becomes a friend over three coffees."},"claim":{"pt":"Nos dados de Hall, amigo casual sai por ~50 horas juntos; amigo, ~90; amigo próximo, 200 ou mais.","en":"In Hall's data, a casual friend runs about 50 hours together; a friend, ~90; a close friend, 200+."},"body":{"pt":"Jeffrey Hall, da Universidade do Kansas, procurou 355 adultos que tinham mudado de cidade nos seis meses anteriores e pediu duas coisas: estimar quantas horas já tinham passado com um conhecido novo e dizer em que degrau de proximidade aquela pessoa estava (Hall, Journal of Social and Personal Relationships, 2019). Os números ficaram em torno de 40 a 60 horas pra virar amigo casual, 80 a 100 pra virar amigo e 200 ou mais pra entrar no círculo próximo. A imprensa arredondou pra **50/90/200**.\n\nTrate como ordem de grandeza, não como cronômetro. As horas são lembradas de memória, saíram de duas amostras do mesmo laboratório — a segunda, com 112 calouros, deu números bem menores — e ninguém de fora replicou os limiares.\n\nMesmo assim, a conta muda. Escolha alguém que você gostaria de ter como amigo e some as horas reais dos últimos seis meses. Se der oito, o problema nunca foi química.","en":"Jeffrey Hall, at the University of Kansas, tracked down 355 adults who had moved to a new city in the previous six months and asked them two things: estimate the hours already spent with one new acquaintance, and place that person on a closeness ladder (Hall, Journal of Social and Personal Relationships, 2019). The answers clustered around 40 to 60 hours to reach casual friend, 80 to 100 to reach friend, and 200 or more to land in the close circle. The press rounded that to **50/90/200**.\n\nRead it as an order of magnitude, not a stopwatch. The hours were recalled from memory, they come from two samples run by the same lab — the second one, 112 freshmen, produced far lower figures — and no outside group has replicated the thresholds.\n\nThe arithmetic still lands. Pick someone you would like as a friend and add up your real hours over the last six months. If it comes to eight, chemistry was never the problem."},"image":{"path":"friendship-hours/idea.1.3d7b4a8c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Hall, 2019 · Journal of Social and Personal Relationships · n=355 adultos recém-mudados","en":"Hall, 2019 · Journal of Social and Personal Relationships · n=355 recently relocated adults"},"url":"https://journals.sagepub.com/doi/full/10.1177/0265407518761225"},{"label":{"pt":"Universidade do Kansas · release de 6 de março de 2018 (método e falas de Hall)","en":"University of Kansas · March 6, 2018 release (method and Hall's quotes)"},"url":"https://news.ku.edu/news/article/2018/03/06/study-reveals-number-hours-it-takes-make-friend"}],"cta":null},{"id":"hora-de-trabalho-nao-conta","ordinal":2,"title":{"pt":"O relógio não corre no trabalho.","en":"The friendship clock doesn't run at work."},"claim":{"pt":"Horas de lazer juntos preveem proximidade. Horas de trabalho ou de aula quase não mexem o ponteiro.","en":"Leisure hours together predict closeness. Work and classroom hours barely move the hand."},"body":{"pt":"Nos dois estudos de Hall, o tipo de hora pesou mais do que a quantidade: tempo de lazer — conversa jogada fora, piada, comida junto, um jogo, um show — previu proximidade muito melhor do que tempo em contexto obrigatório, como trabalho e sala de aula. No release da Universidade do Kansas, Hall resume sem rodeio: as horas trabalhando lado a lado “não contam tanto”.\n\nO porquê está na teoria que ele usa, a **Communicate Bond Belong** — conversar custa energia, e esse gasto só vira vínculo quando a outra pessoa está ali por vontade própria, não por escala (Hall & Davis, 2017). Daí o colega de quatro anos continuar sendo o colega de quatro anos.\n\nUma honestidade: ninguém testou encontros curtos e frequentes contra um encontro raro e planejado com o total de horas igualado. Os dados falam do tipo de hora, não do espaçamento. Então faça o que está comprovado — vire hora obrigatória em hora escolhida: almoço fora da mesa, caminhada depois do expediente.","en":"Across both of Hall's studies, the kind of hour mattered more than the count: leisure time — hanging around, joking, eating together, playing something, going to a show — predicted closeness far better than time in obligatory settings like work and class. In the University of Kansas release, Hall says it flatly: hours spent working together “don't count as much.”\n\nThe reason sits in the theory he reads the data through, **Communicate Bond Belong** — talking costs energy, and that spend only buys a bond when the other person is there of their own accord rather than by roster (Hall & Davis, 2017). Which is why the colleague of four years stays the colleague of four years.\n\nOne honest gap: nobody has run short frequent meetups against one rare planned evening with total hours held equal. The data speak to the kind of hour, not the spacing. So do the part that is evidenced — turn obligatory time into chosen time: lunch away from the desk, a walk after the shift."},"image":{"path":"friendship-hours/idea.2.f2bcd362.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Universidade do Kansas · release de 6 de março de 2018 (falas de Hall sobre lazer x trabalho)","en":"University of Kansas · March 6, 2018 release (Hall on leisure vs. work time)"},"url":"https://news.ku.edu/news/article/2018/03/06/study-reveals-number-hours-it-takes-make-friend"},{"label":{"pt":"Hall & Davis, 2017 · Communication Theory · teoria Communicate Bond Belong","en":"Hall & Davis, 2017 · Communication Theory · Communicate Bond Belong theory"},"url":"https://www.researchgate.net/publication/309544892_Proposing_the_Communicate_Bond_Belong_Theory_Evolutionary_Intersections_With_Episodic_Interpersonal_Communication_Proposing_the_Communicate_Bond_Belong_Theory"}],"cta":null},{"id":"mudanca-derruba-o-circulo","ordinal":3,"title":{"pt":"Ninguém briga. Os amigos só somem.","en":"Nobody fights. The friends just fade."},"claim":{"pt":"18 meses depois de uma mudança, só 48,6% dos amigos próximos seguiam no círculo íntimo — contra 70,3% dos parentes.","en":"Eighteen months after a move, only 48.6% of close friends were still in the inner circle; family, 70.3%."},"body":{"pt":"Roberts e Dunbar mapearam a rede social inteira de 25 jovens britânicos na virada da escola pra universidade e voltaram a medir por 18 meses — 1.291 pessoas catalogadas (Human Nature, 2015). A proximidade emocional com amigos caiu de forma significativa no período; com a família, subiu. Amostra pequena, mas o padrão reaparece em escala: num painel alemão com 36.716 adultos, o contato presencial com a família ficou estável ao longo da vida enquanto o contato com amigos foi caindo (Sander, Schupp & Richter, Developmental Psychology, 2017).\n\n**Mudança de cidade, emprego novo ou filho não briga com os seus amigos — só apaga as horas de lazer que sustentavam a relação.** No mesmo estudo de Roberts e Dunbar, o que segurou as amizades sobreviventes se dividiu por gênero: falar com mais frequência protegeu mais as delas; fazer coisas juntos protegeu mais as deles. Escolha duas pessoas e devolva horas ao calendário desta semana.","en":"Roberts and Dunbar mapped the entire personal network of 25 British teenagers across the move from school to university and re-measured for 18 months — 1,291 network members catalogued (Human Nature, 2015). Emotional closeness to friends fell significantly over that window, while closeness to family rose. Small sample, but the pattern reappears at scale: in a German panel of 36,716 adults, in-person contact with family held steady across the lifespan while contact with friends declined (Sander, Schupp & Richter, Developmental Psychology, 2017).\n\n**A move, a new job or a baby doesn't pick a fight with your friends — it just deletes the leisure hours the friendship ran on.** In the same Roberts and Dunbar data, what protected the surviving friendships split by gender: talking more often helped the women's most; doing things together helped the men's most. Pick two people and put hours back on this week's calendar."},"image":{"path":"friendship-hours/idea.3.004dd62f.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Roberts & Dunbar, 2015 · Human Nature · n=25, 18 meses de acompanhamento","en":"Roberts & Dunbar, 2015 · Human Nature · n=25, 18-month follow-up"},"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC4626528/"},{"label":{"pt":"Sander, Schupp & Richter, 2017 · Developmental Psychology · n=36.716","en":"Sander, Schupp & Richter, 2017 · Developmental Psychology · n=36,716"},"url":"https://pubmed.ncbi.nlm.nih.gov/28541063/"}],"cta":null}]$ideas$::jsonb,
    updated_at = now()
where slug = 'friendship-hours';

-- friendship-hours: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'friendship-hours'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
