-- ============================================================================
-- Psych — DISC behavioral profile (autoral)
--
-- Seeds the `disc` instrument: 4 factors × 11 items = 44 total. Items are
-- 100% authored, inspired by Marston's public-domain DISC model (Dominance,
-- Influence, Steadiness, Conscientiousness) WITHOUT reproducing any
-- copyrighted commercial DISC instrument's wording. Uses the generic
-- all-caps "DISC" (never the trademarked stylized "DiSC").
--
-- Format: NORMATIVE / Likert. One numeric answer per item (1..5 agreement),
-- factor score = mean of that factor's items with reverse-coding via
-- (scale_max + 1 - raw) = (6 - raw). This is the drop-in analog of the
-- ecr_mean method (4 flat facets, no parent rollup) — the app's schema
-- stores exactly one raw_value per (session,item), which IS the normative
-- model. Forced-choice / ipsative was rejected because it would fight that
-- one-answer-per-item contract.
--
-- Scale: 1..5 (Discordo totalmente → Concordo totalmente)
--
-- Reverse-scoring: 3 of 11 per factor (~27%), worded so that strong
-- agreement signals LOW on the factor.
--
-- Category: self_knowledge — so submit_psych_session does NOT bridge to
-- character_sub_score / assessment_log (that bridge is wellbeing-only).
--
-- Results are presented in the client as an intra-person primary+secondary
-- style blend (rank the 4 factor means). No population norms yet, so
-- psych_score.percentile stays null.
-- ============================================================================

begin;

-- ─── 1. Widen scoring_method CHECK to allow 'disc_mean' ────────────────────
-- The constraint (migration 20260507000004) hard-codes only the 4 existing
-- methods, so the instrument INSERT below would be rejected without this.
-- Must run BEFORE the instrument insert.

alter table public.psych_instrument
  drop constraint if exists psych_instrument_scoring_method_check;

alter table public.psych_instrument
  add constraint psych_instrument_scoring_method_check
    check (scoring_method in (
      'wellbeing_decimal',
      'big_five_sum',
      'schwartz_centered',
      'ecr_mean',
      'disc_mean'
    ));

-- ─── 2. Scoring: add the disc_mean branch ──────────────────────────────────
-- Full CREATE OR REPLACE of _psych_score_session carrying every existing
-- branch (from 20260507000004) plus a new disc_mean branch. disc_mean is a
-- structural clone of ecr_mean, differing only in the reverse formula
-- (6 - raw on a 1..5 scale) and left flat over 4 factors (no parent rollup).

create or replace function public._psych_score_session(
  p_session_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inst   text;
  v_method text;
begin
  select s.instrument_id, i.scoring_method
    into v_inst, v_method
  from public.psych_session s
  join public.psych_instrument i on i.id = s.instrument_id
  where s.id = p_session_id;

  if v_inst is null then
    raise exception 'Session % not found', p_session_id;
  end if;

  delete from public.psych_score where session_id = p_session_id;

  -- ---- wellbeing_decimal ----
  if v_method = 'wellbeing_decimal' then
    insert into public.psych_score (session_id, facet_id, score_decimal)
    select
      pa.session_id,
      f.id,
      greatest(0::numeric, least(5::numeric, avg(
        case when pi.reverse_scored
             then ((6 - pa.raw_value) - 1) / 4.0
             else (pa.raw_value - 1) / 4.0
        end
      ) * 5))::numeric(6,3)
    from public.psych_facet f
    join public.psych_item pi on (
      pi.facet_id = f.id
      or pi.facet_id in (
        select c.id from public.psych_facet c where c.parent_facet_id = f.id
      )
    )
    join public.psych_answer pa
      on pa.item_id = pi.id and pa.session_id = p_session_id
    where f.instrument_id = v_inst
    group by pa.session_id, f.id;

  -- ---- big_five_sum ----
  elsif v_method = 'big_five_sum' then
    insert into public.psych_score (session_id, facet_id, score_decimal)
    select pa.session_id, pi.facet_id,
      sum(case when pi.reverse_scored
               then (6 - pa.raw_value)
               else pa.raw_value end)::numeric(6,3)
    from public.psych_answer pa
    join public.psych_item  pi on pi.id = pa.item_id
    join public.psych_facet f  on f.id  = pi.facet_id
    where pa.session_id = p_session_id
      and f.parent_facet_id is not null
    group by pa.session_id, pi.facet_id;

    insert into public.psych_score (session_id, facet_id, score_decimal)
    select p_session_id, parent.id,
      sum(ps.score_decimal)::numeric(6,3)
    from public.psych_facet parent
    join public.psych_facet child on child.parent_facet_id = parent.id
    join public.psych_score ps    on ps.facet_id = child.id
                                  and ps.session_id = p_session_id
    where parent.instrument_id = v_inst
      and parent.parent_facet_id is null
    group by parent.id;

  -- ---- schwartz_centered ----
  elsif v_method = 'schwartz_centered' then
    insert into public.psych_score (session_id, facet_id, score_decimal)
    select pa.session_id, pi.facet_id,
      (avg(pa.raw_value) - (
        select avg(pa2.raw_value)::numeric
        from public.psych_answer pa2
        where pa2.session_id = p_session_id
      ))::numeric(6,3)
    from public.psych_answer pa
    join public.psych_item  pi on pi.id = pa.item_id
    join public.psych_facet f  on f.id  = pi.facet_id
    where pa.session_id = p_session_id
      and f.parent_facet_id is not null
    group by pa.session_id, pi.facet_id;

    insert into public.psych_score (session_id, facet_id, score_decimal)
    select p_session_id, parent.id,
      avg(ps.score_decimal)::numeric(6,3)
    from public.psych_facet parent
    join public.psych_facet child on child.parent_facet_id = parent.id
    join public.psych_score ps    on ps.facet_id = child.id
                                  and ps.session_id = p_session_id
    where parent.instrument_id = v_inst
      and parent.parent_facet_id is null
    group by parent.id;

  -- ---- ecr_mean ----
  elsif v_method = 'ecr_mean' then
    insert into public.psych_score (session_id, facet_id, score_decimal)
    select pa.session_id, pi.facet_id,
      avg(case when pi.reverse_scored
               then (8 - pa.raw_value)
               else pa.raw_value end)::numeric(6,3)
    from public.psych_answer pa
    join public.psych_item pi on pi.id = pa.item_id
    where pa.session_id = p_session_id
      and pi.facet_id is not null
    group by pa.session_id, pi.facet_id;

  -- ---- disc_mean ----
  -- Per-factor mean of raw values with reverse-coding via (6 - raw) on a
  -- 1..5 scale. DISC has 4 flat facets (D/I/S/C) — no parent rollup. The
  -- primary+secondary style blend is derived in the client from the 4 means.
  elsif v_method = 'disc_mean' then
    insert into public.psych_score (session_id, facet_id, score_decimal)
    select pa.session_id, pi.facet_id,
      avg(case when pi.reverse_scored
               then (6 - pa.raw_value)
               else pa.raw_value end)::numeric(6,3)
    from public.psych_answer pa
    join public.psych_item pi on pi.id = pa.item_id
    where pa.session_id = p_session_id
      and pi.facet_id is not null
    group by pa.session_id, pi.facet_id;

  else
    raise notice 'Unknown scoring_method: %', v_method;
  end if;
end $$;

-- ─── 3. Instrument ─────────────────────────────────────────────────────────

insert into public.psych_instrument
  (id, name, description, category, version,
   item_count, scale_min, scale_max, scoring_doc_url,
   scoring_method, scale_labels)
values (
  'disc',
  'DISC — Perfil Comportamental',
  'Inventário DISC de 44 itens, autoral, inspirado no modelo comportamental ' ||
  'de Marston (Dominância, Influência, Estabilidade, Conformidade). Devolve ' ||
  'seu estilo comportamental predominante — como você tende a agir e se ' ||
  'relacionar. Reflexão, não diagnóstico.',
  'self_knowledge', '1.0', 44, 1, 5,
  'docs/psych-instruments-v1.md#disc',
  'disc_mean',
  '{
    "pt": [
      {"label": "Discordo totalmente", "value": 1},
      {"label": "Discordo",            "value": 2},
      {"label": "Neutro",              "value": 3},
      {"label": "Concordo",            "value": 4},
      {"label": "Concordo totalmente", "value": 5}
    ],
    "en": [
      {"label": "Strongly disagree",   "value": 1},
      {"label": "Disagree",            "value": 2},
      {"label": "Neutral",             "value": 3},
      {"label": "Agree",               "value": 4},
      {"label": "Strongly agree",      "value": 5}
    ]
  }'::jsonb
);

-- ─── 4. Factors (4 leaf facets, no parent) ─────────────────────────────────

insert into public.psych_facet
  (id, instrument_id, parent_facet_id, slug, name, description, position)
values
  ('disc:factor:d', 'disc', null,
   'dominance', 'Dominância',
   'Foco em resultado, controle e desafio. Direto, assertivo, decidido.',
   1),
  ('disc:factor:i', 'disc', null,
   'influence', 'Influência',
   'Foco em pessoas e entusiasmo. Expressivo, sociável, persuasivo.',
   2),
  ('disc:factor:s', 'disc', null,
   'steadiness', 'Estabilidade',
   'Foco em ritmo constante e cooperação. Paciente, leal, calmo.',
   3),
  ('disc:factor:c', 'disc', null,
   'conscientiousness', 'Conformidade',
   'Foco em precisão, qualidade e regras. Analítico, cauteloso, caprichoso.',
   4);

-- ─── 5. Items (44) ─────────────────────────────────────────────────────────

insert into public.psych_item
  (id, instrument_id, facet_id, position, text_pt, text_en,
   reverse_scored, options_jsonb)
values
  -- ───────────── Dominância (11 items, 8 forward + 3 reverse) ─────────────
  ('disc_d_1', 'disc', 'disc:factor:d', 1,
   'Quando ninguém decide, eu assumo o comando e toco o barco.',
   'When nobody''s deciding, I take charge and get things moving.',
   false, null),
  ('disc_d_2', 'disc', 'disc:factor:d', 2,
   'Falo o que penso na lata, mesmo que a pessoa não goste.',
   'I say what I think straight up, even if the person won''t like it.',
   false, null),
  ('disc_d_3', 'disc', 'disc:factor:d', 3,
   'Fico bem incomodado quando as coisas andam devagar demais.',
   'It really bugs me when things move too slowly.',
   false, null),
  ('disc_d_4', 'disc', 'disc:factor:d', 4,
   'Gosto de competir e de sair na frente dos outros.',
   'I like to compete and come out ahead of others.',
   false, null),
  ('disc_d_5', 'disc', 'disc:factor:d', 5,
   'Encaro os problemas de frente em vez de ficar rodeando.',
   'I face problems head-on instead of tiptoeing around them.',
   false, null),
  ('disc_d_6', 'disc', 'disc:factor:d', 6,
   'Faço questão de tocar as coisas do meu jeito, sem ficar pedindo aval.',
   'I insist on doing things my own way, without asking for approval.',
   false, null),
  ('disc_d_7', 'disc', 'disc:factor:d', 7,
   'O que me move é bater a meta e ver o resultado.',
   'What drives me is hitting the goal and seeing the result.',
   false, null),
  ('disc_d_8', 'disc', 'disc:factor:d', 8,
   'Não tenho medo de bater de frente pra defender o que acho certo.',
   'I''m not afraid to clash with someone to stand up for what I think is right.',
   false, null),
  ('disc_d_9', 'disc', 'disc:factor:d', 9,
   'Prefiro que outra pessoa assuma as decisões difíceis.',
   'I''d rather someone else take on the hard decisions.',
   true, null),
  ('disc_d_10', 'disc', 'disc:factor:d', 10,
   'Costumo ceder pra não criar atrito com os outros.',
   'I tend to give in to avoid friction with others.',
   true, null),
  ('disc_d_11', 'disc', 'disc:factor:d', 11,
   'Tô tranquilo em seguir o ritmo do grupo, sem pressa de chegar num resultado.',
   'I''m fine following the group''s pace, in no rush to reach a result.',
   true, null),

  -- ───────────── Influência (11 items, 8 forward + 3 reverse) ─────────────
  ('disc_i_1', 'disc', 'disc:factor:i', 12,
   'Chego num lugar novo e já começo a conversar com quem tá do meu lado.',
   'I get somewhere new and start chatting with whoever''s next to me.',
   false, null),
  ('disc_i_2', 'disc', 'disc:factor:i', 13,
   'Consigo convencer as pessoas mais no entusiasmo do que no argumento frio.',
   'I win people over more with enthusiasm than with cold arguments.',
   false, null),
  ('disc_i_3', 'disc', 'disc:factor:i', 14,
   'Quando o clima tá baixo, sou eu que costumo animar a galera.',
   'When the mood is down, I''m usually the one who lifts everyone up.',
   false, null),
  ('disc_i_4', 'disc', 'disc:factor:i', 15,
   'Fico bem melhor quando percebem e elogiam o que eu fiz.',
   'I feel a lot better when people notice and praise what I did.',
   false, null),
  ('disc_i_5', 'disc', 'disc:factor:i', 16,
   'Mesmo sem ter preparado nada, consigo falar de improviso na hora.',
   'Even with nothing prepared, I can speak off the cuff on the spot.',
   false, null),
  ('disc_i_6', 'disc', 'disc:factor:i', 17,
   'Tendo a enxergar o lado bom das situações e passo isso pra frente.',
   'I tend to see the bright side of things and pass that on to others.',
   false, null),
  ('disc_i_7', 'disc', 'disc:factor:i', 18,
   'Passo o dia trocando mensagem e falando com um monte de gente.',
   'I spend the day messaging and talking to lots of different people.',
   false, null),
  ('disc_i_8', 'disc', 'disc:factor:i', 19,
   'Numa roda, é fácil eu virar o centro das atenções.',
   'In a group, I easily end up as the center of attention.',
   false, null),
  ('disc_i_9', 'disc', 'disc:factor:i', 20,
   'Prefiro um fim de semana quieto em casa a sair pra socializar.',
   'I''d rather have a quiet weekend at home than go out and socialize.',
   true, null),
  ('disc_i_10', 'disc', 'disc:factor:i', 21,
   'Perto de gente que não conheço, prefiro ficar mais na minha.',
   'Around people I don''t know, I''d rather keep to myself.',
   true, null),
  ('disc_i_11', 'disc', 'disc:factor:i', 22,
   'Tanto faz pra mim se reparam ou não no que eu faço.',
   'It makes no difference to me whether people notice what I do.',
   true, null),

  -- ───────────── Estabilidade (11 items, 8 forward + 3 reverse) ───────────
  ('disc_s_1', 'disc', 'disc:factor:s', 23,
   'Prefiro seguir uma rotina conhecida do que mudar as coisas do nada.',
   'I''d rather stick to a familiar routine than change things out of nowhere.',
   false, null),
  ('disc_s_2', 'disc', 'disc:factor:s', 24,
   'Mesmo quando tudo tá corrido, consigo manter a calma.',
   'Even when everything''s hectic, I manage to stay calm.',
   false, null),
  ('disc_s_3', 'disc', 'disc:factor:s', 25,
   'Quando alguém tá desabafando, escuto até o fim sem interromper.',
   'When someone''s venting, I listen all the way through without cutting in.',
   false, null),
  ('disc_s_4', 'disc', 'disc:factor:s', 26,
   'Fico do lado das pessoas próximas mesmo quando as coisas ficam difíceis.',
   'I stick by the people close to me even when things get hard.',
   false, null),
  ('disc_s_5', 'disc', 'disc:factor:s', 27,
   'Prefiro dar um jeito no clima do que entrar numa discussão aberta.',
   'I''d rather smooth things over than get into an open argument.',
   false, null),
  ('disc_s_6', 'disc', 'disc:factor:s', 28,
   'Gosto de saber o que vem pela frente antes de começar algo.',
   'I like knowing what''s coming before I start something.',
   false, null),
  ('disc_s_7', 'disc', 'disc:factor:s', 29,
   'Faço questão de ajudar quem tá sobrecarregado, mesmo sem pedirem.',
   'I go out of my way to help someone who''s overloaded, even without being asked.',
   false, null),
  ('disc_s_8', 'disc', 'disc:factor:s', 30,
   'Vou no meu ritmo e não gosto de ser apressado nas coisas.',
   'I move at my own pace and don''t like being rushed through things.',
   false, null),
  ('disc_s_9', 'disc', 'disc:factor:s', 31,
   'Me empolgo com mudança e fico logo entediado quando tudo vira rotina.',
   'Change excites me, and I get bored fast when everything turns into routine.',
   true, null),
  ('disc_s_10', 'disc', 'disc:factor:s', 32,
   'Ficar muito tempo parado na mesma coisa me deixa inquieto.',
   'Staying on the same thing for too long makes me restless.',
   true, null),
  ('disc_s_11', 'disc', 'disc:factor:s', 33,
   'Quando o plano muda de repente, me adapto fácil sem me abalar.',
   'When the plan changes suddenly, I adapt easily without getting rattled.',
   true, null),

  -- ───────────── Conformidade (11 items, 8 forward + 3 reverse) ───────────
  ('disc_c_1', 'disc', 'disc:factor:c', 34,
   'Antes de entregar qualquer coisa, reviso tudo pra ter certeza que não tem erro.',
   'Before I hand anything in, I go back over it to make sure there are no mistakes.',
   false, null),
  ('disc_c_2', 'disc', 'disc:factor:c', 35,
   'Gosto de seguir um passo a passo claro em vez de ir improvisando.',
   'I like following a clear step-by-step rather than improvising.',
   false, null),
  ('disc_c_3', 'disc', 'disc:factor:c', 36,
   'Antes de decidir, quero ver os dados e entender como as coisas funcionam.',
   'Before I decide, I want to see the data and understand how things work.',
   false, null),
  ('disc_c_4', 'disc', 'disc:factor:c', 37,
   'Me incomoda quando algo fica meio torto ou mal acabado.',
   'It bothers me when something is left crooked or half-finished.',
   false, null),
  ('disc_c_5', 'disc', 'disc:factor:c', 38,
   'Prefiro caprichar e demorar um pouco mais a entregar rápido e cheio de erro.',
   'I''d rather take a bit longer and do it well than rush and leave errors.',
   false, null),
  ('disc_c_6', 'disc', 'disc:factor:c', 39,
   'Gosto de ter minhas coisas organizadas e cada uma no seu lugar.',
   'I like keeping my things organized, each one in its place.',
   false, null),
  ('disc_c_7', 'disc', 'disc:factor:c', 40,
   'Quando vou fazer algo importante, pesquiso e me preparo antes de começar.',
   'When something matters, I research and prepare before I start.',
   false, null),
  ('disc_c_8', 'disc', 'disc:factor:c', 41,
   'Fico remoendo quando percebo que cometi um erro num trabalho meu.',
   'I keep dwelling on it when I realize I made a mistake in my work.',
   false, null),
  ('disc_c_9', 'disc', 'disc:factor:c', 42,
   'Costumo tomar decisões no impulso, sem ficar analisando muito.',
   'I tend to make decisions on impulse, without overanalyzing.',
   true, null),
  ('disc_c_10', 'disc', 'disc:factor:c', 43,
   'Detalhe pequeno não me pega; se tá mais ou menos, tá bom pra mim.',
   'Small details don''t hook me; if it''s more or less right, that''s good enough.',
   true, null),
  ('disc_c_11', 'disc', 'disc:factor:c', 44,
   'Prefiro seguir na intuição a ficar preso a regras e procedimentos.',
   'I''d rather go with my gut than get stuck on rules and procedures.',
   true, null);

commit;
