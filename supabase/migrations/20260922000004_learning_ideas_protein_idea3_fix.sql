-- migration: 20260922000004_learning_ideas_protein_idea3_fix.sql
-- purpose: publica as ideias (Recanto em ideias) de 1 material(is) do Learning:
--          protein-distribution-30g-myth · 3 ideia(s)
--
-- affected tables: learning_material (ideas), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-09-22 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     protein-distribution-30g-myth/idea.1.98c55935.webp  (960x1200, gemini-api)
--     protein-distribution-30g-myth/idea.2.46bf8889.webp  (960x1200, gemini-api)
--     protein-distribution-30g-myth/idea.3.4f4d3263.webp  (960x1200, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['protein-distribution-30g-myth']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- protein-distribution-30g-myth · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"nao-existe-teto-de-absorcao","ordinal":1,"title":{"pt":"Você só absorve 30g de proteína?","en":"Do you only absorb 30g of protein?"},"claim":{"pt":"Não existe teto de proteína por refeição: o corpo aproveita o que você comer.","en":"There is no protein ceiling per meal: your body uses whatever you eat."},"body":{"pt":"Em 2009, Daniel Moore e colegas deram proteína de ovo em doses diferentes a seis rapazes que tinham treinado uma perna só. Vinte gramas dispararam a síntese proteica muscular — a velocidade com que o músculo monta fibra nova. Quarenta gramas não dispararam mais que isso. Repare no que foi medido: a resposta do músculo. **Ninguém contou aminoácido perdido nas fezes, ninguém avaliou digestão.** Do laboratório pro vestiário, \"a resposta satura\" virou \"o corpo só absorve\".\n\nEm 2023, o grupo de Jorn Trommelen foi atrás do teto de propósito: 36 pessoas, treino de corpo inteiro, e depois 25 ou 100 gramas de proteína do leite, rastreadas com aminoácidos marcados quimicamente. A dose de 100 gramas rendeu 20% mais aminoácido incorporado nas primeiras quatro horas e 40% mais entre a quarta e a décima segunda, sem teto nenhum (Trommelen et al., Cell Reports Medicine, 2023).\n\n**Proteína a mais numa refeição não vira desperdício**: vira uma resposta mais espalhada no tempo. Coma os 60 gramas de picanha do seu prato inteiros.","en":"In 2009, Daniel Moore and colleagues gave egg protein at different doses to six young men who had trained one leg only. Twenty grams fired up muscle protein synthesis — the rate at which muscle builds new fibre. Forty grams fired it no higher. Look at what got measured: the muscle's response. **Nobody counted amino acids lost in stool, nobody assessed digestion.** Between the lab and the locker room, \"the response saturates\" turned into \"your body can't absorb it\".\n\nIn 2023, Jorn Trommelen's group went hunting for that ceiling on purpose: 36 people, whole-body training, then 25 or 100 grams of milk protein, tracked with chemically tagged amino acids. The 100-gram dose put 20% more amino acid into muscle in the first four hours and 40% more between hour four and hour twelve, with no ceiling anywhere (Trommelen et al., Cell Reports Medicine, 2023).\n\n**Extra protein in one meal doesn't become waste**: it becomes a response spread over more time. Eat the whole 60 grams of steak on your plate."},"image":{"path":"protein-distribution-30g-myth/idea.1.98c55935.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Trommelen et al., 2023 · Cell Reports Medicine 4(12) · ensaio randomizado com traçadores isotópicos","en":"Trommelen et al., 2023 · Cell Reports Medicine 4(12) · randomized trial with stable-isotope tracers"},"url":"https://doi.org/10.1016/j.xcrm.2023.101324"}],"cta":null},{"id":"gatilho-da-leucina","ordinal":2,"title":{"pt":"Quanta proteína liga o músculo por refeição?","en":"How much protein switches muscle on in a meal?"},"claim":{"pt":"O que liga o músculo não é o total de proteína: são 2,5 a 3 g de leucina por refeição.","en":"What switches muscle on isn't total protein: it's 2.5 to 3 grams of leucine per meal."},"body":{"pt":"Proteína é uma coleção de aminoácidos, e um deles acumula dois empregos. A leucina é tijolo como os outros e também é o interruptor: quando ela sobe rápido no sangue, aciona o mTOR, um sensor dentro da célula muscular que liga a linha de montagem de proteína nova. Leucina de menos, e a linha não liga direito.\n\n**O gatilho fica entre 2,5 e 3 gramas de leucina, que moram em uns 20 a 30 gramas de proteína animal de boa qualidade**: carne, ovo, leite, whey. Fonte vegetal traz menos leucina por grama e precisa de dose maior pro mesmo efeito. Por isso 30 gramas nunca foi uma constante do corpo humano: é uma média grosseira, de um tipo de proteína, pra um tipo de pessoa.\n\nE o número se mexe com a idade. **Moore voltou ao assunto em 2015: homens de uns 22 anos saturavam a resposta com 0,24 grama por quilo de peso por refeição, contra 0,40 dos de uns 71.** Depois dos 60, some um pouco em cada refeição.","en":"Protein isn't one thing. It's a set of amino acids, and one of them holds two jobs: leucine. It's a brick like the others, and it's also the switch. When it climbs fast enough in your blood, it trips mTOR, a sensor inside the muscle cell that starts the assembly line for new protein. Too little leucine and the line never really starts.\n\n**The trigger sits between 2.5 and 3 grams of leucine, which live inside roughly 20 to 30 grams of good animal protein**: meat, eggs, milk, whey. Plant sources carry less leucine per gram and need a bigger dose for the same effect. Which is why 30 grams was never a constant of the human body: it's a rough average, for one kind of protein, in one kind of person.\n\nAnd the number moves with age. **Moore came back to the question in 2015: men around 22 saturated the response at 0.24 grams per kilo of body weight per meal, against 0.40 in men around 71.** Past 60, add a little to every meal."},"image":{"path":"protein-distribution-30g-myth/idea.2.46bf8889.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Trommelen et al., 2023 · Cell Reports Medicine 4(12) · ensaio randomizado com traçadores isotópicos","en":"Trommelen et al., 2023 · Cell Reports Medicine 4(12) · randomized trial with stable-isotope tracers"},"url":"https://doi.org/10.1016/j.xcrm.2023.101324"}],"cta":null},{"id":"buraco-do-cafe-da-manha","ordinal":3,"title":{"pt":"Onde falta proteína no seu dia?","en":"Where is your day missing protein?"},"claim":{"pt":"Quatro refeições com 25 a 30 g de proteína rendem mais músculo que concentrar tudo no jantar.","en":"Four meals with 25 to 30 grams of protein build more muscle than loading it all at dinner."},"body":{"pt":"Refaça o seu dia de ontem em gramas. Pão na chapa com café com leite: perto de 7. Marmita com arroz, feijão e duas colheres de frango: uns 20. Jantar com bife, ovo e queijo: passa de 50. O interruptor da construção muscular foi acionado uma vez só, à noite.\n\nEm 2014, Mamerow e colegas serviram a oito adultos a mesma proteína por dia, em alimentação controlada (Journal of Nutrition): empilhada no jantar, ou dividida por igual entre as refeições. **O padrão dividido rendeu cerca de 25% mais síntese muscular em 24 horas, com a mesma comida.** Areta e colegas (2013) deram os mesmos 80 gramas de whey em 8 doses de 10, 4 de 20 ou 2 de 40: **as quatro doses de 20 ganharam.**\n\nNa prática, mire 0,4 grama por quilo em pelo menos quatro refeições. O buraco costuma ser o café da manhã: dois ovos dão 12 gramas, um pote de iogurte grego uns 16. Doença renal ou dieta com proteína restringida: pergunte ao seu médico.","en":"Rebuild yesterday in grams. Toast and coffee with milk: around 7. A lunchbox of rice, beans and two spoonfuls of chicken: about 20. Dinner with steak, egg and cheese: past 50. The muscle-building switch got flipped exactly once, at night.\n\nIn 2014, Mamerow and colleagues fed eight adults the same daily protein under controlled feeding (Journal of Nutrition): piled onto dinner, or split evenly across the meals. **The even pattern produced about 25% more muscle protein synthesis over 24 hours, on identical food.** Areta and colleagues (2013) gave the same 80 grams of whey as 8 doses of 10, 4 of 20 or 2 of 40: **the four 20-gram doses won.**\n\nIn practice, aim for 0.4 grams per kilo across at least four meals. The gap is usually breakfast: two eggs give 12 grams, a pot of Greek yogurt about 16. Kidney disease or a protein-restricted diet: ask your doctor."},"image":{"path":"protein-distribution-30g-myth/idea.3.4f4d3263.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Mamerow et al., 2014 · Journal of Nutrition 144(6) · ensaio cruzado com alimentação controlada","en":"Mamerow et al., 2014 · Journal of Nutrition 144(6) · controlled-feeding crossover trial"},"url":"https://pubmed.ncbi.nlm.nih.gov/24477298/"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'protein-distribution-30g-myth';

-- protein-distribution-30g-myth: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'protein-distribution-30g-myth'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
