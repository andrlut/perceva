-- migration: 20260927000001_learning_ideas_glossary-play.sql
-- purpose: publica as ideias (Recanto em ideias) de 1 material(is) do Learning:
--          glossary-play · 3 ideia(s)
--
-- affected tables: learning_material (ideas), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-27 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     glossary-play/idea.1.f6b41d82.webp  (960x1200, gemini-api)
--     glossary-play/idea.2.f2486373.webp  (960x1200, gemini-api)
--     glossary-play/idea.3.70ce6faf.webp  (960x1200, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['glossary-play']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- glossary-play · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"sofa-um-pedaco","ordinal":1,"title":{"pt":"O sofá só entrega um pedaço do descanso","en":"The couch delivers only part of your rest"},"claim":{"pt":"Troque a tarde no sofá por um hobby que exige algo de você: ele entrega 3 dos 4 ingredientes do descanso.","en":"Trade the couch afternoon for a hobby that asks something of you: it delivers 3 of rest's 4 ingredients."},"body":{"pt":"Em 2007, duas pesquisadoras mediram o que o tempo livre precisa entregar pra de fato te recuperar (Sonnentag & Fritz, 2007). A lista tem quatro ingredientes, nem um a mais. Desligamento: tirar o trabalho da cabeça. Relaxamento: corpo e mente em marcha lenta, sem cobrança. Maestria: um desafio que você escolheu, tipo violão ou um prato difícil. Controle: você decidindo o que fazer com o tempo. Uma meta-análise de 54 estudos e 26.592 pessoas (Bennett, Bakker & Field, 2018) confirmou os quatro, e desligar do trabalho é o que mais pesa.\n\nAgora conte. **A tarde no sofá entrega 1 dos 4: relaxamento, e nada mais.** Aprender a fazer pão entrega 3 dos 4 de uma vez: desligamento, maestria e controle. O quarto fica de fora por definição — relaxar é marcha lenta, e um hobby exigente não é marcha lenta. Então o sofá não é inútil: ele é o único que enche esse. O erro é achar que ele enche os outros três.","en":"In 2007, two researchers measured what free time has to deliver before it actually restores you (Sonnentag & Fritz, 2007). The list runs to four ingredients, no more. Detachment: getting work out of your head. Relaxation: body and mind in low gear, nothing demanded of you. Mastery: a challenge you picked, like guitar or a hard recipe. Control: you deciding what the hours are for. A meta-analysis of 54 studies and 26,592 people (Bennett, Bakker & Field, 2018) backed all four, and detaching from work carries the most weight.\n\nNow count. **An afternoon on the couch delivers 1 of the 4: relaxation, and nothing else.** Learning to bake bread delivers 3 of the 4 at once: detachment, mastery and control. The fourth is out by definition — relaxation means low gear, and a demanding hobby is not low gear. So the couch is not useless: it is the only one that fills that one. The mistake is thinking it fills the other three."},"image":{"path":"glossary-play/idea.1.f6b41d82.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · revisão de 363 estudos","en":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · review of 363 studies"},"url":"https://link.springer.com/article/10.1007/s10902-013-9435-x"}],"cta":null},{"id":"ferias-somem","ordinal":2,"title":{"pt":"Suas férias somem antes da mala desfeita","en":"Your vacation fades before you unpack"},"claim":{"pt":"Em vez de contar os dias pra viagem, proteja uma janela por dia sem nenhuma notificação de trabalho.","en":"Instead of counting the days to the trip, guard one window every day with zero work notifications."},"body":{"pt":"A solução que todo mundo imagina pro cansaço é a mesma: umas boas férias. Uma meta-análise de 13 estudos mediu gente antes e depois de viagens de 11 dias, em média (Speth, Wendsche & Wegge, 2023). Elas voltavam com mais ânimo, mas o efeito era modesto, e a satisfação com a vida quase não se mexia.\n\nE o ganho evapora. Entre 54 trabalhadores numa viagem de três semanas, o bem-estar fez pico por volta do oitavo dia e voltou ao normal menos de uma semana depois da volta (de Bloom et al., 2010). Entre 131 professores, o alívio do esgotamento sumia em cerca de um mês, mais rápido pra quem voltava pra uma pilha de trabalho (Kühnel & Sonnentag, 2011).\n\n**Não é a viagem que cura, é o desligar.** Homens convocados pra reserva militar, sem praia nenhuma, voltaram com menos estresse que os colegas que ficaram no trabalho (Etzion, Eden & Lapidot, 1998). Uma viagem por ano não conserta um ano de tempo livre mal usado.","en":"Everyone pictures the same cure for exhaustion: a good vacation. A meta-analysis of 13 studies measured people before and after trips lasting 11 days on average (Speth, Wendsche & Wegge, 2023). They came back with more energy, but the effect was modest, and life satisfaction barely moved.\n\nAnd the gain evaporates. Among 54 workers on a three-week trip, well-being peaked around day eight and was back to baseline less than a week after the return (de Bloom et al., 2010). Among 131 teachers, burnout relief faded within about a month, faster for anyone who came back to a pile of work (Kühnel & Sonnentag, 2011).\n\n**It is not the trip that heals, it is the detaching.** Men called up for reserve duty, with no beach anywhere in it, came back with less stress than colleagues who stayed at work (Etzion, Eden & Lapidot, 1998). One trip a year will not fix a year of badly spent free time."},"image":{"path":"glossary-play/idea.2.f2486373.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · revisão de 363 estudos","en":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · review of 363 studies"},"url":"https://link.springer.com/article/10.1007/s10902-013-9435-x"}],"cta":null},{"id":"pior-semana-hobby","ordinal":3,"title":{"pt":"A pior semana é a melhor hora pro hobby","en":"Your worst week is the best time for a hobby"},"claim":{"pt":"Na semana mais pesada, marque o hobby na agenda em vez de esperar sobrar energia.","en":"In your heaviest week, put the hobby on the calendar instead of waiting for spare energy."},"body":{"pt":"Uma revisão de 363 estudos concluiu que o lazer te faz bem conforme as necessidades que ele satisfaz — inclusive duas que quase ninguém planeja: sentir que aquilo importa pra você e estar com gente de quem você gosta (Newman, Tay & Diener, 2014). Duas pessoas na mesma caminhada saem com recuperação diferente.\n\nDá pra construir isso de propósito. Chamam de moldar o próprio lazer: buscar atividades com meta, aprendizado e conexão, em vez de deixar o tempo livre virar rolagem infinita. Nas semanas em que a pessoa moldava mais o lazer, ela relatava mais sentido e mais engajamento (Petrou, Bakker & van den Heuvel, 2016).\n\n**E é nas semanas de trabalho mais pesado que as pessoas moldam mais o próprio lazer** (Petrou & Bakker, 2015), exatamente quando mais precisam. Nem todo lazer precisa de meta: o tédio sem objetivo alimenta a criatividade, e as duas coisas convivem. Mas, na semana impossível, esperar sobrar energia é o mesmo que não fazer. Marque o hobby como você marcaria uma reunião.","en":"A review of 363 studies concluded that leisure does you good in proportion to the needs it satisfies — including two almost nobody plans for: feeling that the thing matters to you, and being with people you like (Newman, Tay & Diener, 2014). Two people on the same walk come away with different recovery.\n\nYou can build this on purpose. Researchers call it leisure crafting: going after activities with a goal, learning and connection, instead of letting free time collapse into endless scrolling. In the weeks people crafted their leisure more, they reported more meaning and more engagement (Petrou, Bakker & van den Heuvel, 2016).\n\n**And people craft their leisure most in the weeks when work is heaviest** (Petrou & Bakker, 2015), exactly when they need it. Not all leisure needs a goal: aimless boredom feeds creativity, and both can be true. But in the impossible week, waiting for spare energy means not doing it. Book the hobby the way you would book a meeting."},"image":{"path":"glossary-play/idea.3.70ce6faf.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · revisão de 363 estudos","en":"Newman, Tay & Diener, 2014 · Journal of Happiness Studies · review of 363 studies"},"url":"https://link.springer.com/article/10.1007/s10902-013-9435-x"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'glossary-play';

-- glossary-play: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'glossary-play'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);


-- O vídeo EN desta ideia é o antigo (gerado antes da revisão de 23/09) e o
-- gráfico de barras dele deixa o hobby com as QUATRO barras preenchidas —
-- relaxamento em parte —, enquanto o texto diz 3 de 4. As barras são
-- invenção visual do modelo, não estão na fonte: o Notebook gerou o vídeo A
-- PARTIR do nosso texto, então ele não pode ser evidência sobre o mundo.
-- Zerando o `en` pra ele voltar à fila do runner como tier 2 (EN da ideia 1)
-- e nascer do texto novo. O arquivo antigo continua no bucket: voltar atrás
-- é reapontar o caminho. O PT (`idea.1.pt.v2.mp4`, 1/4 × 3/4) está correto e
-- fica.
update public.learning_material m
   set ideas = (
     select jsonb_agg(
              case when i->>'id' = 'sofa-um-pedaco'
                   then jsonb_set(i, '{video,en}', 'null'::jsonb)
                   else i end
              order by (i->>'ordinal')::int)
       from jsonb_array_elements(m.ideas) i)
 where m.slug = 'glossary-play';

commit;
