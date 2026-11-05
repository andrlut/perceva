-- migration: 20261104000006_learning_card_fixes_and_remotion_video.sql
-- purpose: (1) corrige título/verso de 9 cards de ideia em que o verso não respondia o
--          título, prometia mais do que o texto sustenta ou era charada (revisão do André
--          em 2026-11-04 a partir de job-crafting-additive#2: "o card não diz o que eu
--          deveria ter entendido"). Só título e verso; corpo, imagem e vídeos intactos —
--          sem text_revised_at, porque o vídeo segue o corpo, que não mudou.
--          (2) troca o vídeo PT de buying-time-chores · comprar-tempo (Notebook, fidelidade 65,
--          needs_review) pelo primeiro vídeo do modelo novo, feito em Remotion
--          (tools/video, branch test/video-ideia-remotion): roteiro saído só do texto da ideia,
--          sem dados de pesquisa, Elenco Perceva, voz Gemini TTS Kore conferida por transcrição.
--          Fonte de verdade dos textos: learning-drops/ideas-specs/<slug>.json (atualizados
--          no mesmo commit).
-- affected tables: learning_material (ideas)
-- breaking?        no
-- bucket (subido antes, cache imutável):
--   buying-time-chores/idea.1.pt.v2.mp4          (720x1280, 50 s, 2,4 MB)
--   buying-time-chores/idea.1.pt.v2.poster.webp
-- o vídeo antigo (idea.1.pt.mp4) fica no bucket; o lado EN segue o do Notebook.

begin;

-- job-crafting-additive · faca-o-mapa-voce-mesmo · title + claim
update public.learning_material m
set ideas = (
  select jsonb_agg(case when i->>'id' = 'faca-o-mapa-voce-mesmo' then i || jsonb_build_object('title', jsonb_build_object('pt', 'Pra mudar seu trabalho, comece anotando seu dia', 'en', 'To change your job, start by logging your day'), 'claim', jsonb_build_object('pt', 'Anote por uma semana pra onde vão seu tempo e sua energia em cada tarefa, e puxe o dia pro que você faz bem.', 'en', 'For a week, log where your time and energy go, task by task, then pull your day toward what you do well.')) else i end order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'job-crafting-additive';

-- glossary-career · tres-lentes · title + claim
update public.learning_material m
set ideas = (
  select jsonb_agg(case when i->>'id' = 'tres-lentes' then i || jsonb_build_object('title', jsonb_build_object('pt', 'Emprego, carreira ou chamado: qual é o seu?', 'en', 'Job, career or calling: which is yours?'), 'claim', jsonb_build_object('pt', 'Complete “eu trabalho principalmente pra...”: quem vê o trabalho como chamado tende a estar mais satisfeito.', 'en', 'Finish the sentence “I work mainly to...”: people who see work as a calling tend to be more satisfied.')) else i end order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'glossary-career';

-- glossary-career · autonomia-alavanca · title + claim
update public.learning_material m
set ideas = (
  select jsonb_agg(case when i->>'id' = 'autonomia-alavanca' then i || jsonb_build_object('title', jsonb_build_object('pt', 'Autonomia é o que mais pesa no trabalho', 'en', 'Autonomy weighs most in job satisfaction'), 'claim', jsonb_build_object('pt', 'Escolha uma tarefa do trabalho nesta semana e passe a fazer do seu jeito: decidir o como é o que mais anda junto com satisfação.', 'en', 'Pick one task at work this week and start doing it your way: deciding how is what tracks satisfaction most.')) else i end order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'glossary-career';

-- play-deprivation-adults · instinto-nao-passatempo · title
update public.learning_material m
set ideas = (
  select jsonb_agg(case when i->>'id' = 'instinto-nao-passatempo' then i || jsonb_build_object('title', jsonb_build_object('pt', 'A vontade de brincar é instinto, não passatempo', 'en', 'The urge to play is an instinct, not a pastime')) else i end order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'play-deprivation-adults';

-- summary-why-we-sleep · epidemia-inexistente · title + claim
update public.learning_material m
set ideas = (
  select jsonb_agg(case when i->>'id' = 'epidemia-inexistente' then i || jsonb_build_object('title', jsonb_build_object('pt', 'Nem todo número do Why We Sleep se sustenta', 'en', 'Not every number in Why We Sleep holds up'), 'claim', jsonb_build_object('pt', 'Antes de repetir uma estatística dramática de sono, abra a fonte: a “epidemia da OMS” do livro não existe.', 'en', 'Before repeating a dramatic sleep statistic, check its source: the book''s “WHO epidemic” doesn''t exist.')) else i end order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'summary-why-we-sleep';

-- glossary-play · sofa-um-pedaco · claim
update public.learning_material m
set ideas = (
  select jsonb_agg(case when i->>'id' = 'sofa-um-pedaco' then i || jsonb_build_object('claim', jsonb_build_object('pt', 'Troque a tarde no sofá por um hobby que exige algo de você: ele desliga do trabalho e dá desafio e controle.', 'en', 'Swap the afternoon on the couch for a hobby that asks something of you: it unplugs you from work and gives challenge and control.')) else i end order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'glossary-play';

-- news-pink-noise-sleep-2026-09 · som-cronometrado-cerebro · title + claim
update public.learning_material m
set ideas = (
  select jsonb_agg(case when i->>'id' = 'som-cronometrado-cerebro' then i || jsonb_build_object('title', jsonb_build_object('pt', 'Ruído pro sono profundo ainda é de laboratório', 'en', 'Deep-sleep sound is still lab-only'), 'claim', jsonb_build_object('pt', 'Não compre app de ruído pro sono: o efeito só apareceu com som cronometrado no laboratório, e seu horário de sono rende mais.', 'en', 'Skip sleep-noise apps for now: the effect only showed up with precisely timed sound in a lab, and your sleep schedule matters more.')) else i end order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'news-pink-noise-sleep-2026-09';

-- summary-deep-work · residuo-de-atencao · claim
update public.learning_material m
set ideas = (
  select jsonb_agg(case when i->>'id' = 'residuo-de-atencao' then i || jsonb_build_object('claim', jsonb_build_object('pt', 'Termine o que está aberto antes de trocar de tarefa: cada troca deixa um resíduo que derruba o foco do que vem depois.', 'en', 'Finish what''s open before switching tasks: every switch leaves residue that drags down your focus on what comes next.')) else i end order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'summary-deep-work';

-- summary-deep-work · abracar-o-tedio · title + claim
update public.learning_material m
set ideas = (
  select jsonb_agg(case when i->>'id' = 'abracar-o-tedio' then i || jsonb_build_object('title', jsonb_build_object('pt', 'O celular na fila cobra no trabalho', 'en', 'Your phone in line costs you at work'), 'claim', jsonb_build_object('pt', 'Na próxima fila, espere sem sacar o celular: fugir de todo tédio treina o cérebro a fugir da tarefa difícil.', 'en', 'Next time you''re in line, wait without pulling out your phone: dodging every dull moment trains you to dodge hard work.')) else i end order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'summary-deep-work';

-- guarda: os textos novos têm que estar lá
do $g$ declare n int; begin
  select count(*) into n from public.learning_material m, jsonb_array_elements(m.ideas) i where
    (m.slug = 'job-crafting-additive' and i->>'id' = 'faca-o-mapa-voce-mesmo' and i->'title'->>'pt' = 'Pra mudar seu trabalho, comece anotando seu dia')
    or (m.slug = 'glossary-career' and i->>'id' = 'tres-lentes' and i->'title'->>'pt' = 'Emprego, carreira ou chamado: qual é o seu?')
    or (m.slug = 'glossary-career' and i->>'id' = 'autonomia-alavanca' and i->'title'->>'pt' = 'Autonomia é o que mais pesa no trabalho')
    or (m.slug = 'play-deprivation-adults' and i->>'id' = 'instinto-nao-passatempo' and i->'title'->>'pt' = 'A vontade de brincar é instinto, não passatempo')
    or (m.slug = 'summary-why-we-sleep' and i->>'id' = 'epidemia-inexistente' and i->'title'->>'pt' = 'Nem todo número do Why We Sleep se sustenta')
    or (m.slug = 'glossary-play' and i->>'id' = 'sofa-um-pedaco' and i->'claim'->>'pt' = 'Troque a tarde no sofá por um hobby que exige algo de você: ele desliga do trabalho e dá desafio e controle.')
    or (m.slug = 'news-pink-noise-sleep-2026-09' and i->>'id' = 'som-cronometrado-cerebro' and i->'title'->>'pt' = 'Ruído pro sono profundo ainda é de laboratório')
    or (m.slug = 'summary-deep-work' and i->>'id' = 'residuo-de-atencao' and i->'claim'->>'pt' = 'Termine o que está aberto antes de trocar de tarefa: cada troca deixa um resíduo que derruba o foco do que vem depois.')
    or (m.slug = 'summary-deep-work' and i->>'id' = 'abracar-o-tedio' and i->'title'->>'pt' = 'O celular na fila cobra no trabalho');
  if n <> 9 then raise exception 'card fixes: esperava 9 ideias, achou %', n; end if;
end $g$;

-- buying-time-chores · comprar-tempo · video.pt → Remotion
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'comprar-tempo' then
      jsonb_set(i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'buying-time-chores/idea.1.pt.v2.mp4',
               'duration_seconds', 50,
               'poster', 'buying-time-chores/idea.1.pt.v2.poster.webp',
               'producer', 'remotion')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'buying-time-chores';

do $g$ declare n int; begin
  select count(*) into n from public.learning_material m, jsonb_array_elements(m.ideas) i
  where m.slug = 'buying-time-chores' and i->>'id' = 'comprar-tempo'
    and i->'video'->'pt'->>'path' = 'buying-time-chores/idea.1.pt.v2.mp4'
    and i->'video'->'en'->>'path' is not null;
  if n <> 1 then raise exception 'remotion video: guarda falhou (%)', n; end if;
end $g$;

commit;
