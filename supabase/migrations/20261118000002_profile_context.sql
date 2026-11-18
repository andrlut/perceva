-- migration: 20261118000002_profile_context.sql
-- purpose: "Sobre você" (frente 2 do perfil completo, 18/11): o contexto que a
--          pessoa escreve sobre si pra IA — jeito da IA, ritmo do dia, foco
--          dos próximos 90 dias, fase de vida e com quem mora, o que costuma
--          travar. Tudo opcional, tudo nasce vazio.
--
-- affected tables: profile_context (nova, 1:1 com character)
-- new rpcs:        none (o cliente e o conector escrevem direto, sob RLS)
-- breaking?        no — tabela nova, nada existente muda
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
--   QUEM LÊ: o card "Sobre você" em /perfil; o conector (get_self_knowledge
--   lê, update_about_me grava, get_setup_checklist conta o que falta); e a
--   IA do "Conte seu dia" (perceva-ai), que lê esta linha pra falar no jeito
--   que a pessoa pediu. `profession` e `about` ("Seu momento") CONTINUAM em
--   `profile` (20260908000001) — os 7 campos do card são esses 2 + os 5 daqui.
--
--   Tabela própria, e não jsonb em `profile`: `profile.identity` é o Emblema e
--   `profile.modules` é o registro de superfícies; contexto de vida não se
--   mistura com nenhum dos dois (mesma regra de 20260908000001/20261118000001).
--   E uma escrita aqui (inclusive a do conector) não alcança módulos, plano,
--   Emblema nem nome.
--
--   Colunas tipadas: as escolhas de toque são listas fechadas (check), os
--   horários são `time`, o único texto livre é o foco (140) e os assuntos que
--   a IA evita (até 5, 40 cada). Nada de peso, altura, sexo, religião,
--   orientação, diagnóstico, renda ou nome de terceiros — sem uso escrito,
--   fica fora (LGPD art. 6, III; mesma decisão de set/26).
--
--   Texto livre pode trazer dado sensível. A finalidade é dita no campo e ele
--   nasce vazio: preencher é o ato de consentir com aquele uso.
--
--   Carimbos são do servidor (trigger): created_at, updated_at e
--   focus_set_at — quando o foco dos 90 dias foi escrito, pra IA saber se ele
--   já venceu. O cliente não tem grant nessas colunas.
--
--   Upsert por character_id (o PostgREST põe a PK no SET do ON CONFLICT, por
--   isso o grant de update inclui character_id; a RLS WITH CHECK e o trigger
--   impedem mover a linha pra outra pessoa).

begin;

create table if not exists public.profile_context (
  character_id  uuid primary key references public.character(id) on delete cascade,

  -- 1 · Jeito da IA
  ai_tone       text check (ai_tone in ('direct', 'warm')),
  ai_push       text check (ai_push in ('none', 'light', 'firm')),
  ai_avoid      text[] not null default '{}' check (cardinality(ai_avoid) <= 5),

  -- 2 · Ritmo (hora local)
  wake_time     time,
  sleep_time    time,
  work_start    time,
  work_end      time,
  best_time     text check (best_time in ('morning', 'afternoon', 'evening', 'night')),

  -- 3 · Foco dos próximos 90 dias
  focus_90d     text check (focus_90d is null or char_length(btrim(focus_90d)) between 1 and 140),
  focus_set_at  timestamptz,

  -- 4 · Fase de vida (até 2) e com quem mora
  life_phase    text[] not null default '{}' check (
    cardinality(life_phase) <= 2
    and life_phase <@ array[
      'studying', 'early_career', 'career_growth', 'changing_course',
      'between_jobs', 'small_kids', 'caregiving', 'retired'
    ]::text[]
  ),
  living_with   text[] not null default '{}' check (
    cardinality(living_with) <= 4
    and living_with <@ array['alone', 'partner', 'kids', 'family', 'roommates']::text[]
    -- "moro só" exclui as outras
    and not ('alone' = any(living_with) and cardinality(living_with) > 1)
  ),

  -- 5 · O que costuma travar (até 3)
  blockers      text[] not null default '{}' check (
    cardinality(blockers) <= 3
    and blockers <@ array[
      'time', 'energy', 'money', 'phone', 'environment',
      'forgetting', 'motivation', 'perfectionism', 'other_people'
    ]::text[]
  ),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Horário de trabalho é um par: os dois ou nenhum (turno da noite vale).
  constraint profile_context_work_pair check ((work_start is null) = (work_end is null))
);

comment on table public.profile_context is
  'Sobre você: contexto que a pessoa escreve sobre si pra IA (1 linha por '
  'pessoa, tudo opcional). Lido pelo card em /perfil, pelo conector (perceva-mcp) '
  'e pelo Conte seu dia (perceva-ai). profession/about seguem em profile.';
comment on column public.profile_context.ai_tone is
  'Tom que a IA usa: direct (direta) | warm (acolhedora). null = sem preferência.';
comment on column public.profile_context.ai_push is
  'Quanto a IA cobra: none (sem cobrar) | light (leve) | firm (firme). null = sem preferência.';
comment on column public.profile_context.ai_avoid is
  'Assuntos que a pessoa NÃO quer que a IA puxe (texto dela, até 5, 40 cada).';
comment on column public.profile_context.wake_time is 'Hora local em que costuma acordar.';
comment on column public.profile_context.sleep_time is 'Hora local em que costuma dormir.';
comment on column public.profile_context.work_start is 'Início do horário de trabalho/estudo (par com work_end).';
comment on column public.profile_context.work_end is 'Fim do horário de trabalho/estudo (pode ser < work_start: turno da noite).';
comment on column public.profile_context.best_time is
  'Melhor hora do dia pra ela: morning | afternoon | evening | night.';
comment on column public.profile_context.focus_90d is
  'Foco dos próximos 90 dias, uma frase dela (≤140). Pode conter dado sensível.';
comment on column public.profile_context.focus_set_at is
  'Quando o foco foi escrito (servidor). Passou de 90 dias = perguntar se ainda vale.';
comment on column public.profile_context.life_phase is
  'Fase de vida (até 2): studying | early_career | career_growth | changing_course | '
  'between_jobs | small_kids | caregiving | retired.';
comment on column public.profile_context.living_with is
  'Com quem mora: alone (exclusivo) | partner | kids | family | roommates.';
comment on column public.profile_context.blockers is
  'O que costuma travar (até 3): time | energy | money | phone | environment | '
  'forgetting | motivation | perfectionism | other_people.';

-- ─── Validação + carimbos (SECURITY INVOKER) ────────────────────────────────

create or replace function public.profile_context_validate()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item text;
begin
  -- Assuntos que a IA evita: 1..40 caracteres cada, sem repetição (sem caixa).
  -- (coalesce: um null explícito cai no NOT NULL da coluna, com a mensagem dele)
  foreach v_item in array coalesce(new.ai_avoid, '{}') loop
    if v_item is null or char_length(btrim(v_item)) not between 1 and 40 then
      raise exception 'cada assunto tem de 1 a 40 caracteres' using errcode = '22023';
    end if;
  end loop;
  if (select count(distinct lower(btrim(x))) from unnest(new.ai_avoid) as x)
       <> cardinality(new.ai_avoid) then
    raise exception 'ai_avoid tem assunto repetido' using errcode = '22023';
  end if;

  -- Listas fechadas: sem repetição (o check da coluna já valida os valores).
  if (select count(distinct x) from unnest(new.life_phase) as x) <> cardinality(new.life_phase)
     or (select count(distinct x) from unnest(new.living_with) as x) <> cardinality(new.living_with)
     or (select count(distinct x) from unnest(new.blockers) as x) <> cardinality(new.blockers) then
    raise exception 'lista com valor repetido' using errcode = '22023';
  end if;

  -- Carimbos são do servidor.
  if tg_op = 'INSERT' then
    new.created_at   := now();
    new.updated_at   := now();
    new.focus_set_at := case when new.focus_90d is null then null else now() end;
  else
    new.character_id := old.character_id;   -- a linha nunca muda de dona
    new.created_at   := old.created_at;
    new.updated_at   := now();
    if new.focus_90d is distinct from old.focus_90d then
      new.focus_set_at := case when new.focus_90d is null then null else now() end;
    else
      new.focus_set_at := old.focus_set_at;
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.profile_context_validate() from public, anon, authenticated;

drop trigger if exists profile_context_validate on public.profile_context;
create trigger profile_context_validate
  before insert or update on public.profile_context
  for each row execute function public.profile_context_validate();

-- ─── RLS: self-only ─────────────────────────────────────────────────────────

alter table public.profile_context enable row level security;

drop policy if exists "profile_context_self_select" on public.profile_context;
create policy "profile_context_self_select" on public.profile_context
  for select to authenticated using (character_id = auth.uid());

drop policy if exists "profile_context_self_insert" on public.profile_context;
create policy "profile_context_self_insert" on public.profile_context
  for insert to authenticated with check (character_id = auth.uid());

drop policy if exists "profile_context_self_update" on public.profile_context;
create policy "profile_context_self_update" on public.profile_context
  for update to authenticated
  using (character_id = auth.uid())
  with check (character_id = auth.uid());

-- Apagar tudo (LGPD art. 18).
drop policy if exists "profile_context_self_delete" on public.profile_context;
create policy "profile_context_self_delete" on public.profile_context
  for delete to authenticated using (character_id = auth.uid());

-- O grant padrão do Supabase dá ALL pra anon/authenticated em tabela nova.
-- Fica só o necessário; os carimbos são do servidor.
revoke all on public.profile_context from public, anon, authenticated;
grant select, delete on public.profile_context to authenticated;
grant insert (
  character_id,
  ai_tone, ai_push, ai_avoid,
  wake_time, sleep_time, work_start, work_end, best_time,
  focus_90d, life_phase, living_with, blockers
) on public.profile_context to authenticated;
grant update (
  character_id,
  ai_tone, ai_push, ai_avoid,
  wake_time, sleep_time, work_start, work_end, best_time,
  focus_90d, life_phase, living_with, blockers
) on public.profile_context to authenticated;

commit;
