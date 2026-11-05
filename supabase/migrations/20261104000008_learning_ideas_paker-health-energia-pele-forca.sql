-- migration: 20261104000008_learning_ideas_paker-health-energia-pele-forca.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          paker-health-energia-pele-forca · 3 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-11-05 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     paker-health-energia-pele-forca/idea.1.341e207a.webp  (960x1200, gemini-api)
--     paker-health-energia-pele-forca/idea.2.d499026a.webp  (960x1200, gemini-api)
--     paker-health-energia-pele-forca/idea.3.e9f98822.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     paker-health-energia-pele-forca/cover.53422e6e.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['paker-health-energia-pele-forca']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- paker-health-energia-pele-forca: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/paker-health-energia-pele-forca/cover.53422e6e.webp',
    updated_at = now()
where slug = 'paker-health-energia-pele-forca';

-- paker-health-energia-pele-forca · 3 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"pre-treino-energia","ordinal":1,"title":{"pt":"Pré-treino dá energia para o treino render","en":"Pre-workout gives your training more energy"},"claim":{"pt":"Tome o pré-treino de 30 a 60 minutos antes, para chegar no treino com disposição.","en":"Take your pre-workout 30 to 60 minutes before, so you start training ready to go."},"body":{"pt":"Um bom pré-treino junta ingredientes que trabalham em frentes diferentes. A **cafeína** é a estrela: auxilia no aumento do estado de alerta e na melhora da concentração, e o posicionamento da International Society of Sports Nutrition (2021) mostra que ela melhora o desempenho tanto de quem treina há anos quanto de quem está começando. A arginina é precursora do óxido nítrico, ligado à dilatação dos vasos. A beta-alanina forma carnosina no músculo, que ajuda a segurar a acidez do esforço intenso. A taurina, aminoácido comum nas bebidas de energia, melhorou a resistência numa meta-análise de Waldron e colegas (2018). E a tirosina é matéria-prima da dopamina e da noradrenalina, ligadas ao foco. No FortPaker, os cinco vêm juntos numa dose de 10 g. Tome **de 30 a 60 minutos antes** do treino, misturado na água. Contém cafeína: evite perto da hora de dormir, na gravidez e se você é sensível a estimulantes.","en":"A good pre-workout brings together ingredients that work on different fronts. **Caffeine** is the star: it helps increase alertness and improve concentration, and the International Society of Sports Nutrition position stand (2021) shows it improves performance both in people who have trained for years and in beginners. Arginine is a precursor of nitric oxide, which is linked to blood vessel dilation. Beta-alanine builds carnosine in muscle, which helps buffer the acidity of hard efforts. Taurine, an amino acid common in energy drinks, improved endurance in a meta-analysis by Waldron and colleagues (2018). And tyrosine is the raw material for dopamine and noradrenaline, both linked to focus. In FortPaker, all five come together in a 10 g serving. Take it **30 to 60 minutes before** training, mixed in water. It contains caffeine: avoid it close to bedtime, during pregnancy and if you are sensitive to stimulants."},"image":{"path":"paker-health-energia-pele-forca/idea.1.341e207a.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Guest et al., 2021 · ISSN · posicionamento sobre cafeína e exercício","en":"Guest et al., 2021 · ISSN · position stand on caffeine and exercise"},"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC7777221/"},{"label":{"pt":"Waldron et al., 2018 · Sports Medicine · meta-análise sobre taurina","en":"Waldron et al., 2018 · Sports Medicine · taurine meta-analysis"},"url":"https://research.stmarys.ac.uk/id/eprint/2159"},{"label":{"pt":"Trexler et al., 2015 · ISSN · posicionamento sobre beta-alanina","en":"Trexler et al., 2015 · ISSN · position stand on beta-alanine"},"url":"https://jissn.biomedcentral.com/articles/10.1186/s12970-015-0090-y"}],"cta":null},{"id":"colageno-constancia","ordinal":2,"title":{"pt":"Colágeno pede constância para aparecer na pele","en":"Collagen needs consistency to show on your skin"},"claim":{"pt":"Tome colágeno todo dia por pelo menos 8 semanas, junto com vitamina C, que ajuda o corpo a formar colágeno.","en":"Take collagen every day for at least 8 weeks, with vitamin C, which helps your body form collagen."},"body":{"pt":"O colágeno é a proteína que dá estrutura à pele, e o corpo passa a fabricar menos dele com a idade. Os suplementos trazem colágeno hidrolisado, quebrado em **peptídeos** pequenos que o intestino absorve. Num estudo de Proksch e colegas (2014), mulheres de 45 a 65 anos que tomaram 2,5 g de peptídeos de colágeno por dia, durante 8 semanas, tiveram rugas menores ao redor dos olhos do que o grupo que tomou placebo. O detalhe que conta é o tempo: a pele se renova devagar, e o resultado aparece em semanas, não em dias. A **vitamina C** entra porque auxilia na formação do colágeno, e o zinco contribui para a manutenção da pele, dos cabelos e das unhas. A Collagenpaker reúne 2,5 g de peptídeos, vitamina C, zinco, selênio e ácido hialurônico numa dose de 5 g. O segredo é virar hábito: o mesmo horário todo dia, misturada na água ou no suco.","en":"Collagen is the protein that gives skin its structure, and the body makes less of it as we age. Supplements bring hydrolyzed collagen, broken down into small **peptides** the gut can absorb. In a study by Proksch and colleagues (2014), women aged 45 to 65 who took 2.5 g of collagen peptides a day for 8 weeks had smaller wrinkles around the eyes than the group that took a placebo. The detail that matters is time: skin renews itself slowly, and results show up in weeks, not days. **Vitamin C** is there because it helps form collagen, and zinc helps maintain skin, hair and nails. Collagenpaker brings together 2.5 g of peptides, vitamin C, zinc, selenium and hyaluronic acid in a 5 g serving. The secret is making it a habit: the same time every day, mixed into water or juice."},"image":{"path":"paker-health-energia-pele-forca/idea.2.d499026a.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Proksch et al., 2014 · Skin Pharmacology and Physiology · ensaio com peptídeos de colágeno","en":"Proksch et al., 2014 · Skin Pharmacology and Physiology · collagen peptide trial"},"url":"https://pubmed.ncbi.nlm.nih.gov/24401291/"}],"cta":null},{"id":"creatina-alem-da-musculacao","ordinal":3,"title":{"pt":"Creatina não é só para quem faz musculação","en":"Creatine isn't just for bodybuilders"},"claim":{"pt":"Tome 3 a 5 g de creatina todo dia, em qualquer horário, para manter o estoque do músculo cheio.","en":"Take 3 to 5 g of creatine every day, at any time, to keep your muscle stores full."},"body":{"pt":"A creatina é um dos suplementos mais estudados do mundo. O corpo já produz e guarda creatina nos músculos, onde ela vira **fosfocreatina**, a reserva de energia dos esforços curtos e intensos. Por isso ela auxilia no aumento do desempenho físico em exercícios repetidos de curta duração e alta intensidade, como tiros, saltos e séries de força. O posicionamento da International Society of Sports Nutrition (Kreider e colegas, 2017) concluiu que a creatina monoidratada traz benefícios de adolescentes a idosos e é segura para pessoas saudáveis, sem efeitos colaterais graves. Com 3 a 5 g por dia, os estoques do músculo enchem em 3 a 4 semanas. Não precisa tomar antes do treino: o efeito vem do **estoque cheio**, não da hora da dose. A CreaPaker é creatina monoidratada micronizada, que se mistura fácil na água, no suco ou no shake.","en":"Creatine is one of the most studied supplements in the world. Your body already makes creatine and stores it in muscle, where it becomes **phosphocreatine**, the energy reserve for short, intense efforts. That is why it helps increase physical performance in repeated short, high-intensity exercise, like sprints, jumps and strength sets. The International Society of Sports Nutrition position stand (Kreider and colleagues, 2017) concluded that creatine monohydrate brings benefits from teenagers to older adults and is safe for healthy people, with no serious side effects. At 3 to 5 g a day, muscle stores fill up in 3 to 4 weeks. You don't need to take it before training: the effect comes from **full stores**, not from when you take the dose. CreaPaker is micronized creatine monohydrate, which mixes easily into water, juice or a shake."},"image":{"path":"paker-health-energia-pele-forca/idea.3.e9f98822.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Kreider et al., 2017 · ISSN · posicionamento sobre creatina","en":"Kreider et al., 2017 · ISSN · position stand on creatine"},"url":"https://doi.org/10.1186/s12970-017-0173-z"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'paker-health-energia-pele-forca';

-- paker-health-energia-pele-forca: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'paker-health-energia-pele-forca'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
