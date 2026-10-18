-- migration: 20261018000003_learning_idea_training.sql
-- purpose: Treino de ideias. As favoritas de Minhas ideias entram num treino
--          espaçado: a pessoa vê o título, tenta lembrar a resposta de
--          cabeça, vira o card e diz se lembrou. Acertou, a ideia volta em
--          3, 7 e 21 dias e depois fica "firme" (a cada 60); errou, volta
--          amanhã. O mesmo registro serve o app e o conector MCP (a IA da
--          pessoa pergunta em voz alta e registra o resultado).
--
-- affected tables: learning_idea_collect (+train_box, +train_due, +trained_on)
-- new rpcs:        train_idea(p_slug text, p_idea_id text, p_remembered boolean, p_today date)
-- breaking?        no — colunas novas com default/anuláveis; clientes antigos ignoram
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   escrita pelo editor (nunca heredoc): PT com acento em comentários e mensagens
--   zero economia: treinar não toca XP, moedas nem learning_view
--   o dia é LOCAL e vem do cliente (p_today): o current_date do Postgres é UTC
--     e erraria o dia entre 21h e meia-noite em Brasília; a faixa aceita é
--     current_date ± 1, o que cobre qualquer fuso
--   a primeira resposta do dia decide: uma segunda chamada no mesmo dia (a
--     volta do card no fim do treino, um toque duplo, a IA repetindo) não
--     mexe na agenda — é isso que torna a escrita segura pra um LLM

begin;

-- ── 1. colunas do treino ──────────────────────────────────────────────────
alter table public.learning_idea_collect
  add column if not exists train_box smallint not null default 0
    check (train_box between 0 and 3),
  add column if not exists train_due date,
  add column if not exists trained_on date;

comment on column public.learning_idea_collect.train_box is
  'Acertos seguidos no treino, em dias espaçados (0..3). 3 = firme. Errar zera. Escrita só por train_idea().';
comment on column public.learning_idea_collect.train_due is
  'Dia local em que a ideia volta ao treino. null = nunca treinada (a favorita entra no dia seguinte ao da revisão).';
comment on column public.learning_idea_collect.trained_on is
  'Dia local da última resposta no treino. A primeira resposta de cada dia é a que mexe na agenda.';

-- Os privilégios desta tabela são POR COLUNA (ver 20260927000002): coluna
-- nova não herda o select, e o app leria "nunca treinada" pra sempre, sem
-- erro. Leitura direta sim; escrita só pela RPC (não há policy de update).
grant select (train_box, train_due, trained_on) on public.learning_idea_collect to authenticated;

-- ── 2. RPC train_idea ─────────────────────────────────────────────────────
-- Regras da agenda (uma decisão por ideia por dia):
--   já respondida hoje           → nada muda (reason already_trained_today)
--   não lembrou                  → box 0, volta amanhã (reason missed)
--   lembrou antes do dia marcado → nada muda além do dia da resposta
--                                  (reason not_due_yet): adiantar não empurra
--   lembrou no dia (ou depois)   → box + 1; volta em 3 / 7 / 21 dias; quem já
--                                  era firme volta em 60 (reason advanced)
-- Treinar exige a ideia na coleção (como review_idea): id inventado falha alto.
create or replace function public.train_idea(
  p_slug text,
  p_idea_id text,
  p_remembered boolean,
  p_today date
)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_char    uuid := auth.uid();
  v_mat     uuid;
  v_row     record;
  v_box     smallint;
  v_due     date;
  v_on      date;
  v_reason  text;
  v_firm    integer;
begin
  if v_char is null then
    raise exception 'not authenticated';
  end if;
  if p_remembered is null then
    raise exception 'p_remembered must be true or false';
  end if;
  if p_today is null or p_today < current_date - 1 or p_today > current_date + 1 then
    raise exception 'p_today out of range: %', p_today;
  end if;

  select id into v_mat
  from public.learning_material
  where slug = p_slug and is_archived = false;
  if v_mat is null then
    raise exception 'material not found: %', p_slug;
  end if;

  select train_box, train_due, trained_on
    into v_row
  from public.learning_idea_collect
  where character_id = v_char
    and material_id = v_mat
    and idea_id = p_idea_id
  for update;
  if not found then
    raise exception 'idea not collected: %/%', p_slug, p_idea_id;
  end if;

  v_box := v_row.train_box;
  v_due := v_row.train_due;
  v_on  := v_row.trained_on;

  if v_on is not distinct from p_today then
    v_reason := 'already_trained_today';
  elsif not p_remembered then
    v_box := 0;
    v_due := p_today + 1;
    v_on := p_today;
    v_reason := 'missed';
  elsif v_due is not null and v_due > p_today then
    v_on := p_today;
    v_reason := 'not_due_yet';
  else
    v_due := p_today + case
      when v_box >= 3 then 60
      when v_box = 2 then 21
      when v_box = 1 then 7
      else 3
    end;
    v_box := least(v_box + 1, 3);
    v_on := p_today;
    v_reason := 'advanced';
  end if;

  if v_reason <> 'already_trained_today' then
    update public.learning_idea_collect
       set train_box = v_box,
           train_due = v_due,
           trained_on = v_on
     where character_id = v_char
       and material_id = v_mat
       and idea_id = p_idea_id;
  end if;

  select count(*) filter (where favorite is true and train_box >= 3)
    into v_firm
  from public.learning_idea_collect
  where character_id = v_char;

  return json_build_object(
    'counted', v_reason in ('missed', 'advanced'),
    'reason', v_reason,
    'remembered', p_remembered,
    'box', v_box,
    'firm', v_box >= 3,
    'due', v_due,
    'firm_favorites', v_firm
  );
end
$fn$;

revoke all on function public.train_idea(text, text, boolean, date) from public, anon;
grant execute on function public.train_idea(text, text, boolean, date) to authenticated;

comment on function public.train_idea(text, text, boolean, date) is
  'Treino de ideias: registra se a pessoa lembrou de uma ideia absorvida e move a agenda (3/7/21/60 dias; errou, amanhã). Uma decisão por ideia por dia local (p_today). Não toca XP nem moedas.';

commit;
