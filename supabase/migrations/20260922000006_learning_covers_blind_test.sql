-- Capas novas para os 4 materiais reprovados no teste cego de capa.
--
-- O teste: um leitor vê SÓ a capa, sem título nem resumo, e diz de que
-- assunto o material fala. As 4 abaixo puxavam para o assunto da metáfora,
-- não para o do material:
--
--   protein-distribution-30g-myth  três interruptores  -> "ativação e progressão"
--   glossary-play                  mãos sovando pão    -> "receitas de cozinha"
--   glossary-learn                 alpinista           -> "superação, desafio"
--   glossary-strength              mão gigante amparando -> "força para superar obstáculos"
--
-- As novas mostram o assunto dentro do quadro (quatro pratos servidos, o
-- domingo no sofá, o livro todo marcado, uma flexão no tapete) e foram
-- relidas por leitor cego depois de renderizadas: "refeição/proteína",
-- "repouso", "estudo", "força" — todas com confiança alta.
--
-- Só `hero_image_url` muda; texto, ideias e mídia ficam intocados. Os
-- arquivos antigos (`cover.webp`) continuam no bucket: o nome novo carrega
-- o sha8 do prompt, então um rollback é reapontar a coluna.

update public.learning_material
   set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/protein-distribution-30g-myth/cover.a7dbc2d9.webp'
 where slug = 'protein-distribution-30g-myth';

update public.learning_material
   set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-play/cover.d12305d8.webp'
 where slug = 'glossary-play';

update public.learning_material
   set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-learn/cover.d86f6308.webp'
 where slug = 'glossary-learn';

update public.learning_material
   set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-strength/cover.8615af17.webp'
 where slug = 'glossary-strength';
