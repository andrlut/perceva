-- migration: 20260919000004_learning_material_category.sql
-- purpose: taxonomia nova do Recanto — Livro / Pesquisa / Fundamentos — numa coluna
--          nova `learning_material.category`, que passa a ser a fonte da verdade.
--          `type` (summary/news/explainer) vira espelho LEGADO mantido por trigger:
--          o app da loja faz `TYPE_META[card.type].glyph` sem fallback, então um
--          valor novo em `type` fecharia a aba Recanto de quem ainda roda o bundle
--          antigo. Com o espelho, o bundle antigo continua vendo só valores que
--          conhece; o bundle novo lê `category`. Quando a produção inteira estiver
--          no bundle novo, uma migration futura remove o trigger e a coluna `type`.
--
--          Mapa: summary -> book; news -> research; explainer glossary-* ->
--          foundation (as 12 matérias das subs — "o Perceva por dentro");
--          demais explainer -> research. Espelho: book -> summary; research e
--          foundation -> explainer ('news' deixa de ser escrito).
--
--          Os modelos de raciocínio (material_type_template) passam a ser chaveados
--          pela categoria e são reescritos no modelo "ideias primeiro": o número de
--          ideias sai dos achados independentes (padrão 1, cada ideia a mais
--          precisa de estudo, mecanismo ou ação diferente), não de "3 ideias
--          load-bearing" / 7 passos de artigo longo. Pesquisa é escrita pra durar
--          (sem manchete presa à data). Fundamentos é sob demanda do mantenedor,
--          nunca sorteado pelo planner.
--
-- affected tables: learning_material (+category, +trigger), learning_idea_public
--                  (view, +category no fim), material_type_template (chaves e
--                  conteúdo), material_topic_seed (check de type)
-- new rpcs:        none
-- breaking?        no — `type` continua preenchido e válido pro app da loja; a
--                  view só ganha uma coluna no fim
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   o trigger de revisões (snapshot_material_revision) só grava quando texto ou
--   ideias mudam — trocar a categoria não gera revisão

begin;

-- 1. coluna nova + espelho legado ------------------------------------------------

alter table public.learning_material
  add column if not exists category text;

comment on column public.learning_material.category is
  'Categoria do material (fonte da verdade): book = Livro, research = Pesquisa, foundation = Fundamentos. `type` é espelho legado mantido por trigger.';

create or replace function public.learning_material_sync_legacy_type()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  -- escritor legado que só manda `type`: infere a categoria
  if new.category is null then
    new.category := case new.type when 'summary' then 'book' else 'research' end;
  end if;
  -- a categoria manda; `type` só espelha pro bundle antigo do app
  new.type := case new.category when 'book' then 'summary' else 'explainer' end;
  return new;
end
$fn$;

drop trigger if exists learning_material_sync_legacy_type on public.learning_material;
create trigger learning_material_sync_legacy_type
  before insert or update of category, type on public.learning_material
  for each row execute function public.learning_material_sync_legacy_type();

update public.learning_material
set category = case
  when type = 'summary' then 'book'
  when type = 'news' then 'research'
  when slug like 'glossary-%' then 'foundation'
  else 'research'
end
where category is null;

alter table public.learning_material
  alter column category set not null;

alter table public.learning_material
  add constraint learning_material_category_check
  check (category in ('book', 'research', 'foundation'));

do $guard$
declare
  n_book int; n_research int; n_foundation int; n_news int;
begin
  select count(*) filter (where category = 'book'),
         count(*) filter (where category = 'research'),
         count(*) filter (where category = 'foundation'),
         count(*) filter (where type = 'news')
    into n_book, n_research, n_foundation, n_news
  from public.learning_material
  where is_archived = false;
  if n_foundation <> 12 then
    raise exception 'learning_material_category: esperava 12 foundation (glossary-*), achou %', n_foundation;
  end if;
  if n_news <> 0 then
    raise exception 'learning_material_category: ainda há % linha(s) com type=news', n_news;
  end if;
  raise notice 'learning_material_category: book=% research=% foundation=%', n_book, n_research, n_foundation;
end
$guard$;

-- 2. view das ideias: + category no fim (create or replace só aceita coluna nova no fim)

create or replace view public.learning_idea_public
with (security_invoker = true) as
select
  m.id                                   as material_id,
  m.slug,
  m.type,
  m.dimension_id,
  m.released_at,
  i->>'id'                               as idea_id,
  (i->>'ordinal')::smallint              as ordinal,
  i->'title'->>'pt'                      as title_pt,
  i->'title'->>'en'                      as title_en,
  i->'claim'->>'pt'                      as claim_pt,
  i->'claim'->>'en'                      as claim_en,
  i->'image'->>'path'                    as image_path,
  i->'video'->'pt'->>'path'              as video_pt_path,
  i->'video'->'en'->>'path'              as video_en_path,
  m.category
from public.learning_material m
cross join lateral jsonb_array_elements(m.ideas) as i
where m.is_archived = false
  and m.released_at <= now();

grant select on public.learning_idea_public to authenticated;

-- 3. backlog de pautas: mesma taxonomia (0 linhas hoje) ------------------------

alter table public.material_topic_seed
  drop constraint if exists material_topic_seed_type_check;

update public.material_topic_seed
set type = case type when 'summary' then 'book' else 'research' end
where type in ('summary', 'news', 'explainer');

alter table public.material_topic_seed
  add constraint material_topic_seed_type_check
  check (type in ('book', 'research', 'foundation'));

-- 4. modelos de raciocínio por categoria --------------------------------------

alter table public.material_type_template
  drop constraint if exists material_type_template_type_check;

delete from public.material_type_template where type = 'news';
update public.material_type_template set type = 'book' where type = 'summary';
update public.material_type_template set type = 'research' where type = 'explainer';

insert into public.material_type_template
  (type, reasoning_steps, editorial_rules, target_minutes, required_directives, recommended_directives)
values
  ('foundation', '{"steps": []}'::jsonb, '{"rules": []}'::jsonb, 4, array['source'], array['stat'])
on conflict (type) do nothing;

alter table public.material_type_template
  add constraint material_type_template_type_check
  check (type in ('book', 'research', 'foundation'));

-- Pesquisa: uma pergunta respondida pela ciência (estudo novo, mito, conceito)
update public.material_type_template
set reasoning_steps = $j${"steps": [
  {"id": "question", "label_pt": "A pergunta do leitor", "label_en": "The reader's question",
   "prompt_pt": "Que pergunta real do leitor este material responde? Nomeie o assunto sem rodeio (proteína, sono, amizade…). A curiosidade mora na resposta, nunca no assunto: o leitor precisa saber do que se trata antes de saber a resposta.",
   "prompt_en": "What real question does this material answer for the reader? Name the subject plainly (protein, sleep, friendship…). Curiosity lives in the answer, never in the subject: the reader must know what it is about before knowing the answer."},
  {"id": "findings", "label_pt": "Achados independentes", "label_en": "Independent findings",
   "prompt_pt": "Liste os achados que o dossiê sustenta, cada um com estudo nomeado, número e o que muda pro leitor. Comece supondo UM. Um achado só vira ideia própria se diferir dos outros no estudo, no mecanismo ou na ação; senão vira parágrafo dentro de outro. Contexto, ressalva e 'o que fazer' não são achados.",
   "prompt_en": "List the findings the dossier supports, each with a named study, a number and what it changes for the reader. Start by assuming ONE. A finding becomes its own idea only if it differs from the others in study, mechanism or action; otherwise it becomes a paragraph inside another. Context, caveats and 'what to do' are not findings."},
  {"id": "main_claim", "label_pt": "A afirmação principal", "label_en": "The main claim",
   "prompt_pt": "A frase que o leitor leva pra casa: o assunto nomeado + uma âncora palpável (número com estudo, comparação, analogia). Vira o verso do card da ideia 1.",
   "prompt_en": "The sentence the reader takes home: the subject named + a tangible anchor (a number with its study, a comparison, an analogy). It becomes the back of idea 1's card."},
  {"id": "mechanism", "label_pt": "Por que funciona", "label_en": "Why it works",
   "prompt_pt": "O mecanismo por baixo do achado, com um exemplo concreto do dia a dia.",
   "prompt_en": "The mechanism under the finding, with one concrete everyday example."},
  {"id": "evidence", "label_pt": "Força da evidência", "label_en": "Strength of the evidence",
   "prompt_pt": "Tipo de estudo, tamanho da amostra, ressalvas honestas (observacional, preprint, efeito pequeno). Estudo novo é pauta, não manchete: nada de 'acaba de sair' — a data aparece só na citação.",
   "prompt_en": "Study design, sample size, honest caveats (observational, preprint, small effect). A new study is a lead, not a headline: no 'just out' — the date only appears in the citation."},
  {"id": "what_stays_true", "label_pt": "O que isso não muda", "label_en": "What this does not change",
   "prompt_pt": "O que continua valendo apesar do achado — evita a leitura alarmista ou exagerada.",
   "prompt_en": "What still holds despite the finding — it prevents the alarmist or overblown reading."},
  {"id": "action", "label_pt": "O que fazer", "label_en": "What to do",
   "prompt_pt": "Uma ação concreta e testável que sai do achado. Se o achado não pede ação, diga isso.",
   "prompt_en": "One concrete, testable action that follows from the finding. If the finding calls for no action, say so."}
]}$j$::jsonb,
    editorial_rules = $j${"rules": [
  {"id": "evergreen", "label_pt": "Escrito pra durar: sem 'acaba de sair', sem manchete presa à data; a data do estudo aparece só na citação.", "label_en": "Written to last: no 'just out', no date-bound headline; the study date only appears in the citation."},
  {"id": "subject_named", "label_pt": "Título e verso do card nomeiam o assunto: ninguém pode perguntar '30g de quê?'.", "label_en": "Title and card back name the subject: nobody should have to ask '30g of what?'."},
  {"id": "tangible_anchor", "label_pt": "Cada ideia carrega uma âncora palpável: número com estudo nomeado, comparação ou analogia. Frase vaga não fica na cabeça.", "label_en": "Every idea carries a tangible anchor: a number with its named study, a comparison or an analogy. Vague sentences do not stick."},
  {"id": "ideas_earned", "label_pt": "Uma ideia por achado independente; ideia extra só com estudo, mecanismo ou ação diferente. O número de ideias sai dos achados, nunca do tamanho do artigo.", "label_en": "One idea per independent finding; an extra idea only with a different study, mechanism or action. The idea count comes from the findings, never from the article length."},
  {"id": "honest_caveats", "label_pt": "Estudos contestados ou simplificados precisam ser sinalizados.", "label_en": "Contested or simplified studies must be flagged."},
  {"id": "translate_jargon", "label_pt": "Jargão técnico nunca aparece sem definição.", "label_en": "Technical jargon never appears without a definition."},
  {"id": "source_required", "label_pt": "Bloco :::source no fim com fonte primária verificável.", "label_en": ":::source block at the end with a verifiable primary source."},
  {"id": "bilingual_parity", "label_pt": "PT e EN cobrem os mesmos pontos, idioma natural em cada lado (não tradução literal).", "label_en": "PT and EN cover the same points in natural language on each side (not literal translation)."}
]}$j$::jsonb,
    target_minutes = 4,
    required_directives = array['source'],
    recommended_directives = array['stat', 'compare', 'callout', 'list-icon'],
    updated_at = now()
where type = 'research';

-- Livro: as ideias de uma obra (livro ou artigo longo)
update public.material_type_template
set reasoning_steps = $j${"steps": [
  {"id": "author_question", "label_pt": "A pergunta do autor", "label_en": "The author's question",
   "prompt_pt": "O que o autor estava tentando responder? 1-2 frases que situam a obra e nomeiam o assunto.",
   "prompt_en": "What was the author trying to answer? 1-2 sentences that situate the work and name its subject."},
  {"id": "author_thesis", "label_pt": "A tese do autor", "label_en": "The author's thesis",
   "prompt_pt": "Em uma frase, idealmente nas palavras do autor (com :::quote).",
   "prompt_en": "In one sentence, ideally in the author's words (with :::quote)."},
  {"id": "ideas", "label_pt": "As ideias da obra", "label_en": "The work's ideas",
   "prompt_pt": "Quantas ideias a obra realmente sustenta (1 a 5)? Cada uma com o que é · por que importa · como aplicar, e com estudo, mecanismo ou ação próprios. Uma ideia que só repete outra com exemplo diferente não é ideia nova; uma seção que é só contexto também não. Sobra de capítulo não vira ideia.",
   "prompt_en": "How many ideas does the work really sustain (1 to 5)? Each with what it is · why it matters · how to apply it, and with its own study, mechanism or action. An idea that only repeats another with a different example is not a new idea; neither is a section that is only context. Chapter leftovers do not become ideas."},
  {"id": "evidence", "label_pt": "Evidência e críticas", "label_en": "Evidence and critics",
   "prompt_pt": "O que o autor apresentou como prova, E o que os críticos legítimos dizem. :::callout{kind=warn} pra ressalvas honestas.",
   "prompt_en": "What the author offered as proof, AND what legitimate critics say. :::callout{kind=warn} for honest caveats."},
  {"id": "actionable", "label_pt": "O que muda na prática", "label_en": "What changes in practice",
   "prompt_pt": "O que muda na vida do leitor se ele aceitar a tese? Uma ação concreta por ideia, no máximo.",
   "prompt_en": "What changes in the reader's life if they accept the thesis? At most one concrete action per idea."},
  {"id": "verdict", "label_pt": "Veredito", "label_en": "Verdict",
   "prompt_pt": "Vale ler o original? Pra quem? Em 1 parágrafo. Honestidade > marketing.",
   "prompt_en": "Is the original worth reading? For whom? In 1 paragraph. Honesty > marketing."}
]}$j$::jsonb,
    editorial_rules = $j${"rules": [
  {"id": "attribute_clearly", "label_pt": "Toda ideia atribuída ao autor com :::quote ou nome explícito — não passar opinião do autor como fato.", "label_en": "Every idea attributed to the author with :::quote or explicit naming — don't pass the author's opinion as fact."},
  {"id": "critics_honestly", "label_pt": "Críticas reais e atribuídas (não 'alguns dizem que...').", "label_en": "Real, attributed critics (no 'some say...')."},
  {"id": "subject_named", "label_pt": "Título e verso do card nomeiam o assunto da ideia, não só o livro.", "label_en": "Title and card back name the idea's subject, not just the book."},
  {"id": "tangible_anchor", "label_pt": "Cada ideia carrega uma âncora palpável: número, comparação, analogia ou ferramenta nomeada.", "label_en": "Every idea carries a tangible anchor: a number, a comparison, an analogy or a named tool."},
  {"id": "ideas_earned", "label_pt": "O número de ideias é o que a obra sustenta, não o número de seções: ideia extra só com estudo, mecanismo ou ação diferente.", "label_en": "The idea count is what the work sustains, not the number of sections: an extra idea only with a different study, mechanism or action."},
  {"id": "source_required", "label_pt": "Bloco :::source com a obra + ano + ISBN/DOI quando aplicável.", "label_en": ":::source block with the work + year + ISBN/DOI when applicable."},
  {"id": "no_spoiler_excess", "label_pt": "Destilar não é copiar — pegue a forma do raciocínio do autor, não cite blocos longos.", "label_en": "Distilling is not copying — capture the shape of the author's reasoning, don't paste long blocks."},
  {"id": "bilingual_parity", "label_pt": "PT e EN cobrem os mesmos pontos, idioma natural em cada lado.", "label_en": "PT and EN cover the same points in natural language on each side."}
]}$j$::jsonb,
    target_minutes = 7,
    required_directives = array['quote', 'source'],
    recommended_directives = array['stat', 'callout', 'compare', 'list-icon'],
    updated_at = now()
where type = 'book';

-- Fundamentos: o Perceva por dentro (subs, telas, filosofia) — sob demanda
update public.material_type_template
set reasoning_steps = $j${"steps": [
  {"id": "feature", "label_pt": "Qual parte do Perceva", "label_en": "Which part of Perceva",
   "prompt_pt": "A sub, a tela ou o princípio do app que este material explica, com o nome exato que aparece no app.",
   "prompt_en": "The sub, screen or principle of the app this material explains, with the exact name the app shows."},
  {"id": "question", "label_pt": "A dúvida de quem usa", "label_en": "The user's question",
   "prompt_pt": "Que dúvida real alguém tem ao usar essa parte? (Por que ganhar moedas? Por que avaliar as subs?)",
   "prompt_en": "What real question does someone have when using this part? (Why earn coins? Why rate the subs?)"},
  {"id": "science", "label_pt": "A ciência por trás", "label_en": "The science behind it",
   "prompt_pt": "O que a pesquisa diz, com estudo nomeado, número e ressalvas. Explica, não vende: se a evidência é fraca, diga que é fraca.",
   "prompt_en": "What the research says, with a named study, a number and caveats. Explain, don't sell: if the evidence is weak, say it is weak."},
  {"id": "design_choice", "label_pt": "Por que o Perceva é assim", "label_en": "Why Perceva works this way",
   "prompt_pt": "Como a ciência vira escolha de desenho no app — e o limite dessa escolha.",
   "prompt_en": "How the science turns into a design choice in the app — and the limit of that choice."},
  {"id": "how_to_use", "label_pt": "Como usar no app", "label_en": "How to use it in the app",
   "prompt_pt": "Um passo concreto na tela correspondente. Só descreva o que o app faz hoje.",
   "prompt_en": "One concrete step on the matching screen. Only describe what the app does today."}
]}$j$::jsonb,
    editorial_rules = $j${"rules": [
  {"id": "no_marketing", "label_pt": "Explica, não vende: evidência fraca é dita como fraca; nenhuma promessa que a pesquisa não sustenta.", "label_en": "Explain, don't sell: weak evidence is called weak; no promise the research does not support."},
  {"id": "app_accurate", "label_pt": "Só descreve o que o app faz hoje, com os nomes que aparecem na tela.", "label_en": "Only describes what the app does today, with the names shown on screen."},
  {"id": "subject_named", "label_pt": "Título e verso do card nomeiam o assunto.", "label_en": "Title and card back name the subject."},
  {"id": "tangible_anchor", "label_pt": "Cada ideia carrega uma âncora palpável: número com estudo, comparação ou analogia.", "label_en": "Every idea carries a tangible anchor: a number with its study, a comparison or an analogy."},
  {"id": "ideas_earned", "label_pt": "Ideia extra só com estudo, mecanismo ou ação diferente.", "label_en": "An extra idea only with a different study, mechanism or action."},
  {"id": "evergreen", "label_pt": "Escrito pra durar.", "label_en": "Written to last."},
  {"id": "source_required", "label_pt": "Bloco :::source no fim com fonte primária verificável.", "label_en": ":::source block at the end with a verifiable primary source."},
  {"id": "bilingual_parity", "label_pt": "PT e EN cobrem os mesmos pontos, idioma natural em cada lado.", "label_en": "PT and EN cover the same points in natural language on each side."}
]}$j$::jsonb,
    target_minutes = 4,
    required_directives = array['source'],
    recommended_directives = array['stat', 'callout', 'list-icon'],
    updated_at = now()
where type = 'foundation';

do $guard$
begin
  if (select count(*) from public.material_type_template
      where type in ('book', 'research', 'foundation')
        and jsonb_array_length(reasoning_steps->'steps') >= 5) <> 3 then
    raise exception 'learning_material_category: os 3 modelos de raciocínio não foram gravados';
  end if;
end
$guard$;

commit;
