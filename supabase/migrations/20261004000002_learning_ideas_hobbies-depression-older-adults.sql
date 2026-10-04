-- migration: 20261004000002_learning_ideas_hobbies-depression-older-adults.sql
-- purpose: publica as ideias (Recanto em ideias) e a capa de 1 material(is) do Learning:
--          hobbies-depression-older-adults · 2 ideia(s) · capa
--
-- affected tables: learning_material (ideas, hero_image_url), learning_idea_collect (coletas órfãs)
-- new rpcs:        none
-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem
--                  `ideas` continua na tela legada, byte a byte
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   GERADO por tools/content-media/emit-migration.mjs em 2026-10-04 — não editar
--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)
--   e reemita.
--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto
--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.
--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):
--     hobbies-depression-older-adults/idea.1.2680ae6c.webp  (960x1200, gemini-api)
--     hobbies-depression-older-adults/idea.2.f20b1e4c.webp  (960x1200, gemini-api)
--   capas no bucket learning-media (subir ANTES de aplicar; vira hero_image_url):
--     hobbies-depression-older-adults/cover.0e724229.webp  (768x1152, gemini-api)
--   vídeos por ideia: nenhum novo — os já publicados são herdados por id (ver o update)

begin;

-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.
do $guard$
declare
  missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array['hobbies-depression-older-adults']) as s
  where not exists (select 1 from public.learning_material m where m.slug = s);
  if missing is not null then
    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;
  end if;
end
$guard$;

-- hobbies-depression-older-adults: capa (hero_image_url do manifest, --with-cover)
update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/hobbies-depression-older-adults/cover.0e724229.webp',
    updated_at = now()
where slug = 'hobbies-depression-older-adults';

-- hobbies-depression-older-adults · 2 ideia(s)
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
  from jsonb_array_elements($ideas$[{"id":"hobby-menos-depressao","ordinal":1,"title":{"pt":"Ter um hobby anda junto com menos depressão","en":"Having a hobby goes with less depression"},"claim":{"pt":"Depois dos 65, ter um hobby vem com mais satisfação com a vida e menos sintomas de depressão.","en":"After 65, a hobby comes with more satisfaction with life and fewer depressive symptoms."},"body":{"pt":"Mak e colegas juntaram cinco estudos de longo prazo com 93.263 pessoas acima de 65 anos, em 16 países, da Inglaterra ao Japão e à China (Nature Medicine, 2023). Quem disse ter um hobby relatou menos sintomas de depressão, mais felicidade e mais **satisfação com a vida**, que foi a ligação mais forte. O padrão se repetiu de país em país. Hobby, ali, era o que a própria pessoa chamava assim: tricô, leitura, cozinhar algo especial, um projeto na garagem. O efeito é pequeno, e o estudo é observacional, ou seja, mede o que as pessoas já fazem sem sortear quem ganha um hobby. Quem entra em depressão também larga o que gostava, então a relação corre nos dois sentidos. Mesmo assim, comparando cada pessoa com ela mesma ao longo dos anos, o hobby veio antes da queda nos sintomas. Se você não tem nenhum, **escolha um que caiba na sua semana** e trate como compromisso.","en":"Mak and colleagues pooled five long-running studies covering 93,263 people over 65 in 16 countries, from England to Japan and China (Nature Medicine, 2023). Those who said they had a hobby reported fewer depressive symptoms, more happiness and more **satisfaction with life**, which was the strongest link. The pattern held from one country to the next. A hobby there was whatever you called one: knitting, reading, cooking something special, a project in the garage. The effect is small, and the study is observational: it records what people already do instead of randomly assigning hobbies. Depression also makes you drop the things you enjoyed, so the arrow runs both ways. Still, when each person was compared with their own earlier years, the hobby came first and the drop in symptoms followed. If you have none, **pick one that fits your week** and treat it as an appointment."},"image":{"path":"hobbies-depression-older-adults/idea.1.2680ae6c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Mak et al., 2023 · Nature Medicine · 93.263 pessoas, 16 países","en":"Mak et al., 2023 · Nature Medicine · 93,263 people, 16 countries"},"url":"https://www.nature.com/articles/s41591-023-02506-1"},{"label":{"pt":"ScienceDaily · resumo do estudo de Mak et al.","en":"ScienceDaily · summary of Mak et al."},"url":"https://www.sciencedaily.com/releases/2023/09/230911141131.htm"}],"cta":null},{"id":"hobby-uma-vez-por-semana","ordinal":2,"title":{"pt":"Hobby uma vez por semana já conta","en":"A weekly hobby already counts"},"claim":{"pt":"Um encontro semanal com seu hobby já anda junto com menos depressão, sem precisar ser todo dia.","en":"One weekly session with your hobby already goes with less depression, no daily habit required."},"body":{"pt":"Pra medir frequência, Bone e colegas seguiram 19.134 americanos acima de 50 anos, com a depressão avaliada a cada dois anos entre 2008 e 2016 (Social Science & Medicine, 2022). Quem se dedicava a hobbies ou projetos toda semana teve **cerca de 19% menos chance de depressão** dois anos depois. Cozinhar ou fazer pão toda semana mostrou um sinal parecido, perto de 15% menos chance. A versão preliminar do estudo, divulgada antes da revisão por pares, pôs até o ritmo mensal perto de 20%, número que ainda precisa ser conferido, então trate como pista. O semanal é o dado firme. Os dados são observacionais, ou seja, medem o que as pessoas já fazem, sem sortear quem ganha um hobby, e a amostra é de gente mais velha. O recado é que o ganho não pede horas diárias, pede um encontro que se repita. Na prática, **reserve um horário fixo por semana** pro seu hobby, do jeito que você marcaria uma consulta.","en":"To get at frequency, Bone and colleagues followed 19,134 Americans over 50, checking for depression every two years from 2008 to 2016 (Social Science & Medicine, 2022). Those who worked on hobbies or projects every week had **about 19% lower odds of depression** two years later. Weekly cooking or baking showed a similar signal, around 15% lower odds. The study's preprint, released before peer review, put even a monthly rhythm near 20%, a figure still to be checked, so treat it as a lead. The weekly number is the solid one. The data are observational, meaning they record what people already do without randomly handing anyone a hobby, and the sample is older adults. The point is that the benefit doesn't ask for hours a day. It asks for a slot that keeps coming back. So **book a fixed weekly slot** for your hobby, the way you'd book a doctor's appointment."},"image":{"path":"hobbies-depression-older-adults/idea.2.f20b1e4c.webp","width":960,"height":1200},"video":{"pt":null,"en":null},"sources":[{"label":{"pt":"Bone et al., 2022 · Social Science & Medicine · 19.134 adultos 50+","en":"Bone et al., 2022 · Social Science & Medicine · 19,134 adults 50+"},"url":"https://www.sciencedirect.com/science/article/pii/S0277953622000065"}],"cta":null}]$ideas$::jsonb) n
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
where m.slug = 'hobbies-depression-older-adults';

-- hobbies-depression-older-adults: coletas de ids que saíram do JSON (re-corte)
delete from public.learning_idea_collect c
using public.learning_material m
where m.id = c.material_id
  and m.slug = 'hobbies-depression-older-adults'
  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);

commit;
