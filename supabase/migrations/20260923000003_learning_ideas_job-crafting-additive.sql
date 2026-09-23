-- migration: 20260923000003_learning_ideas_job-crafting-additive.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          job-crafting-additive · 3 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-23 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     job-crafting-additive/idea.1.8c90163d.webp  (960x1200, gemini-api)
--     job-crafting-additive/idea.2.bf07795e.webp  (960x1200, gemini-api)
--     job-crafting-additive/idea.3.07d9d4dd.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     job-crafting-additive/cover.876e7e28.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['job-crafting-additive']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- job-crafting-additive: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/job-crafting-additive/cover.876e7e28.webp',
    updated_at = now()
where slug = 'job-crafting-additive';

-- job-crafting-additive · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"mudar-sem-pedir","ordinal":1,"title":{"pt":"Redesenhe seu cargo sem pedir permissão","en":"Change your job without asking HR"},"claim":{"pt":"Mude uma coisa esta semana no que você faz, com quem você trabalha ou no sentido que dá ao trabalho.","en":"Change one thing this week in what you do, who you work with or what the work is for."},"body":{"pt":"Em 2001, Wrzesniewski e Dutton deram nome a um comportamento comum e invisível: **job crafting são as mudanças que o próprio funcionário faz nas bordas do trabalho**, sem que ninguém reescreva a descrição do cargo. São três alavancas. Tarefa: você puxa pra si a análise que ninguém quer e vai soltando o que só ocupa agenda. Relação: você troca o almoço de sempre por um café com quem destrava as coisas em outra área. Sentido: você para de se descrever como quem responde e-mails e passa a se ver como quem tira o obstáculo do caminho dos outros. Rudolph, Katz, Lavigne e Zacher juntaram 122 amostras e 35.670 trabalhadores em 2017 e acharam **correlação de .45 entre job crafting e engajamento** — alta pra área, onde a maioria dos números fica entre .10 e .30. É correlação, não prova de causa: quem já está engajado provavelmente mexe mais no próprio trabalho. Mesmo assim, testar custa uma mudança pequena, escolhida por você.","en":"Wrzesniewski and Dutton named the behaviour in 2001: **job crafting is the change an employee makes to the edges of their own work**, with nobody rewriting the job description. Three levers. Tasks: you pull in the messy analysis nobody wants and quietly let go of the thing that only fills your calendar. Relationships: you swap the usual lunch table for a coffee with the person two floors down who unblocks things. Meaning: you stop describing yourself as the one who answers email and start seeing yourself as the one who clears the path for everyone else. Rudolph, Katz, Lavigne and Zacher pooled 122 samples and 35,670 workers in 2017 and found job crafting **correlating .45 with work engagement** — large in this field, where most numbers land between .10 and .30. It is correlation, not proof: engaged people probably craft more. Testing it still costs you one small change."},"image":{"path":"job-crafting-additive/idea.1.8c90163d.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Wrzesniewski & Dutton, 2001 · Academy of Management Review","en":"Wrzesniewski & Dutton, 2001 · Academy of Management Review"},"url":"https://doi.org/10.5465/amr.2001.4378011"},{"label":{"pt":"Rudolph et al., 2017 · Journal of Vocational Behavior","en":"Rudolph et al., 2017 · Journal of Vocational Behavior"},"url":"https://www.sciencedirect.com/science/article/abs/pii/S0001879117300477"}],"cta":null},{"id":"somar-em-vez-de-cortar","ordinal":2,"title":{"pt":"Cortar as tarefas chatas piora o trabalho","en":"Cutting the bad parts is the wrong change"},"claim":{"pt":"Adicione um desafio novo em vez de cortar o que incomoda, porque cortar te deixa mais perto de pedir demissão.","en":"Add a harder demand instead of dropping the one you hate, because dropping it leaves you closer to quitting."},"body":{"pt":"Tims, Bakker e Derks validaram com 1.181 trabalhadores holandeses uma escala que separa o comportamento em quatro movimentos: aumentar recursos estruturais (autonomia, chance de aprender), aumentar recursos sociais (feedback, apoio do chefe), assumir demandas mais desafiadoras e diminuir as demandas que atrapalham. Na meta-análise de Rudolph e colegas, os três primeiros puxam pra cima e o quarto puxa pra baixo. **Assumir desafio a mais teve correlação de .42 com desempenho avaliado por chefe e colegas** — não por autoavaliação, o que deixa o número bem mais confiável. Já diminuir o que atrapalha anda junto de menos satisfação e mais intenção de pedir demissão. A explicação provável é desconfortável: **quem está no limite é justamente quem mais tenta fugir da tarefa pesada**, e desviar dela não resolve o cansaço, só mantém ela viva na cabeça. Antes de tirar a reunião do calendário, pergunte que projeto você pode puxar pra você neste mês.","en":"Tims, Bakker and Derks validated a scale with 1,181 Dutch workers that splits the behaviour into four moves: adding structural resources (autonomy, room to learn), adding social resources (feedback, backing from your boss), taking on harder demands, and shrinking the demands that get in the way. In Rudolph and colleagues' pooled data the first three point one way and the fourth points the other. **Taking on harder demands correlated .42 with performance rated by bosses and peers** — not self-rated, which is exactly what makes that number worth something. Shrinking the annoying demands travelled with lower job satisfaction and a stronger intention to quit. The likely mechanism stings: **the people who dodge a heavy demand are usually the ones already running on empty**, and dodging never touches the exhaustion, it just keeps the task alive in your head. Before you drop the meeting, ask which project you could pull toward you this month."},"image":{"path":"job-crafting-additive/idea.2.bf07795e.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Rudolph et al., 2017 · Journal of Vocational Behavior","en":"Rudolph et al., 2017 · Journal of Vocational Behavior"},"url":"https://www.sciencedirect.com/science/article/abs/pii/S0001879117300477"},{"label":{"pt":"Tims, Bakker & Derks, 2012 · Escala de Job Crafting","en":"Tims, Bakker & Derks, 2012 · Job Crafting Scale"},"url":"https://doi.org/10.1016/j.jvb.2011.05.009"}],"cta":null},{"id":"faca-o-mapa-voce-mesmo","ordinal":3,"title":{"pt":"Ninguém vai redesenhar seu cargo por você","en":"Nobody else will change your workday"},"claim":{"pt":"Reserve duas manhãs pra mapear pra onde vão seu tempo e sua energia no trabalho e redesenhar o próprio dia.","en":"Block two mornings to map where your time and energy go at work, then redraw your own workday."},"body":{"pt":"Duas formas de rodar o mesmo exercício já foram testadas, e só uma mexeu o ponteiro. Van Wingerden e colegas aplicaram o caderno de job crafting — o exercício de redesenhar o próprio trabalho — da Universidade de Michigan com 32 professores holandeses: ao longo de vários dias, cada um mapeou pra onde iam de fato seu tempo e sua energia e só então redesenhou o próprio dia em direção ao que faz bem. **O redesenho aumentou com efeito moderado (d = 0,42, uma diferença que dá pra ver sem estatística) e o engajamento subiu junto (0,36)** — em 32 pessoas, então é pista, não prova. Sakuraya e colegas testaram o formato que empresa compra: dois encontros de 120 minutos, em aula, com 281 funcionários japoneses sorteados em seis unidades. Nada se moveu, nem aos três nem aos seis meses. **A leitura mais provável é que o ganho está em quem olha pro próprio dia** — leitura, não comparação direta: nenhum dos dois estudos testou os dois formatos na mesma amostra.","en":"Two ways of running the same exercise have been tested, and only one moved anything. Van Wingerden and colleagues used the University of Michigan job crafting workbook — the exercise for redesigning your own job — with 32 Dutch teachers: over several days each one mapped where their time and energy actually went, then redrew their own day toward what they are good at. **Crafting rose with a moderate effect (d = 0.42, a shift you can see without statistics) and engagement followed at 0.36** — in 32 people, so treat it as a lead rather than proof. Sakuraya and colleagues tested the version companies buy: two 120-minute classroom sessions, 281 Japanese employees, six worksites randomised. Nothing moved at three months or at six. **The likeliest reading is that the gain belongs to whoever does the looking** — a reading, not a head-to-head test: neither study ran the solo and the group version in the same sample."},"image":{"path":"job-crafting-additive/idea.3.07d9d4dd.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Exercício de job crafting · Universidade de Michigan","en":"Job Crafting Exercise · University of Michigan"},"url":"https://positiveorgs.bus.umich.edu/cpo-tools/job-crafting-exercise/"},{"label":{"pt":"Sakuraya et al., 2020 · ensaio randomizado com 281 funcionários","en":"Sakuraya et al., 2020 · randomised trial with 281 employees"},"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC7047874/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'job-crafting-additive';

-- job-crafting-additive: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'job-crafting-additive'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
