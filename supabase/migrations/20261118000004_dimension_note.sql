-- migration: 20261118000004_dimension_note.sql
-- purpose: Norte por área (frente 5, caminho B). Em cada área que importa pra
--          pessoa: a frase "Quero poder escolher…" (want, ≤ 140), a frase
--          opcional de como está hoje (today, ≤ 140) e as datas que alimentam
--          a revisão de 6 meses ("Ainda é isso?").
--
-- affected tables: dimension_note (nova)
-- new rpcs:        set_dimension_notes(jsonb)
-- breaking?        no — tabela nova. A meta numérica segue onde está
--                  (character_sub_score, source = 'desired'); a frase é a
--                  razão e o número fica embaixo, como régua.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
--   Uma linha por (pessoa, área), no máximo 6. `matters` é a escolha da
--   pessoa: a frase não é pra toda área. Desmarcar esconde (matters = false)
--   sem apagar o texto; limpar as duas frases de uma área desmarcada apaga a
--   linha (o RPC faz isso), então "apagar" = esvaziar e salvar.
--
--   Não é versionada (life_vision é): a revisão compara a frase com a data em
--   que ela foi escrita ou confirmada. updated_at = a última mudança de
--   matters/want/today; reviewed_at = a última vez que a pessoa escreveu ou
--   respondeu "Ainda é". Os dois são do servidor (trigger): o cliente só
--   consegue mexer em reviewed_at, e nunca pra depois de agora.
--
--   PK surrogada + unicidade por ÍNDICE, não constraint. Uma tabela cuja PK
--   (ou unique constraint) é só as duas FKs vira junção N:N pro PostgREST, e
--   character ↔ dimension já tem uma (character_dimension): uma segunda
--   deixaria ambíguo qualquer embed entre as duas (incidente de 2026-11-15,
--   partner_campaign_track_pk). O ON CONFLICT do RPC infere o índice único.
--
--   O Norte é núcleo grátis: sem trava de plano nem de módulo. A sugestão da
--   frase vinda de "A vida que eu quero" (módulo vida) é só de superfície, no
--   cliente; esta tabela não lê life_vision.
--
--   Texto livre pode trazer dado sensível, como as notas de humor. Os campos
--   nascem vazios e a finalidade é dita na tela; o conector do claude.ai lê
--   só as áreas marcadas, sob a RLS da própria pessoa.
--
--   set_dimension_notes é SECURITY INVOKER: grava sob a RLS e os grants de
--   coluna de quem chama. A RLS self-only é a fronteira.

begin;

create table if not exists public.dimension_note (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references public.character(id) on delete cascade,
  dimension_id  text not null references public.dimension(id) on delete restrict,
  -- A pessoa disse que esta área importa agora.
  matters       boolean not null default true,
  -- Completa "Quero poder escolher…" (ex.: "comprar o básico sem olhar o preço").
  want          text check (want is null or char_length(want) between 1 and 140),
  -- Opcional: como está hoje, numa frase ("Hoje → Quero").
  today         text check (today is null or char_length(today) between 1 and 140),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  reviewed_at   timestamptz not null default now()
);

create unique index if not exists dimension_note_char_dim_uidx
  on public.dimension_note (character_id, dimension_id);

comment on table public.dimension_note is
  'Norte por área: o que a pessoa quer poder escolher em cada área que importa '
  '(want) e, opcional, como está hoje (today). Uma linha por (pessoa, área). '
  'A meta 0..5 continua em character_sub_score (source = desired).';

-- ─── Normalização + datas (SECURITY INVOKER) ────────────────────────────────

create or replace function public.dimension_note_touch()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Uma linha só, sem espaço sobrando; vazio vira null (o check exige 1..140).
  new.want  := nullif(btrim(regexp_replace(coalesce(new.want, ''), '\s+', ' ', 'g')), '');
  new.today := nullif(btrim(regexp_replace(coalesce(new.today, ''), '\s+', ' ', 'g')), '');

  if tg_op = 'INSERT' then
    new.created_at  := now();
    new.updated_at  := now();
    new.reviewed_at := now();
  else
    -- Identidade e criação não mudam.
    new.id           := old.id;
    new.character_id := old.character_id;
    new.dimension_id := old.dimension_id;
    new.created_at   := old.created_at;

    if (new.matters, new.want, new.today) is distinct from (old.matters, old.want, old.today) then
      -- Escrever (ou marcar/desmarcar) também conta como revisão.
      new.updated_at  := now();
      new.reviewed_at := now();
    else
      new.updated_at  := old.updated_at;
      -- "Ainda é isso?" → "Ainda é": a data da revisão anda até agora, nunca além.
      new.reviewed_at := least(new.reviewed_at, now());
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.dimension_note_touch() from public, anon, authenticated;

drop trigger if exists dimension_note_touch on public.dimension_note;
create trigger dimension_note_touch
  before insert or update on public.dimension_note
  for each row execute function public.dimension_note_touch();

-- ─── RLS: self-only ─────────────────────────────────────────────────────────

alter table public.dimension_note enable row level security;

drop policy if exists "dimension_note_self_select" on public.dimension_note;
create policy "dimension_note_self_select" on public.dimension_note
  for select to authenticated using (character_id = auth.uid());

drop policy if exists "dimension_note_self_insert" on public.dimension_note;
create policy "dimension_note_self_insert" on public.dimension_note
  for insert to authenticated with check (character_id = auth.uid());

drop policy if exists "dimension_note_self_update" on public.dimension_note;
create policy "dimension_note_self_update" on public.dimension_note
  for update to authenticated
  using (character_id = auth.uid())
  with check (character_id = auth.uid());

drop policy if exists "dimension_note_self_delete" on public.dimension_note;
create policy "dimension_note_self_delete" on public.dimension_note
  for delete to authenticated using (character_id = auth.uid());

-- O grant padrão do Supabase dá ALL pra anon/authenticated em tabela nova.
-- Fica só o necessário: datas e ids são do servidor.
revoke all on public.dimension_note from public, anon, authenticated;
grant select, delete on public.dimension_note to authenticated;
grant insert (character_id, dimension_id, matters, want, today)
  on public.dimension_note to authenticated;
grant update (matters, want, today, reviewed_at)
  on public.dimension_note to authenticated;

-- ─── RPC: salvar as áreas do editor numa transação ──────────────────────────

create or replace function public.set_dimension_notes(p_notes jsonb)
returns setof public.dimension_note
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_item    jsonb;
  v_dim     text;
  v_matters boolean;
  v_want    text;
  v_today   text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_notes is null or jsonb_typeof(p_notes) <> 'array' or jsonb_array_length(p_notes) > 6 then
    raise exception 'p_notes: um array de até 6 áreas' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_notes) loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'p_notes: cada área é um objeto' using errcode = '22023';
    end if;
    v_dim     := v_item ->> 'dimension_id';
    v_matters := coalesce((v_item ->> 'matters')::boolean, false);
    v_want    := nullif(btrim(regexp_replace(coalesce(v_item ->> 'want', ''), '\s+', ' ', 'g')), '');
    v_today   := nullif(btrim(regexp_replace(coalesce(v_item ->> 'today', ''), '\s+', ' ', 'g')), '');

    if v_dim is null then
      raise exception 'p_notes: dimension_id obrigatório' using errcode = '22023';
    end if;

    if not v_matters and v_want is null and v_today is null then
      -- Área desmarcada e sem frase: não sobra nada a guardar.
      delete from public.dimension_note
        where character_id = v_uid and dimension_id = v_dim;
    else
      insert into public.dimension_note (character_id, dimension_id, matters, want, today)
      values (v_uid, v_dim, v_matters, v_want, v_today)
      on conflict (character_id, dimension_id) do update
        set matters = excluded.matters,
            want    = excluded.want,
            today   = excluded.today;
    end if;
  end loop;

  return query
    select n.* from public.dimension_note n
    where n.character_id = v_uid
    order by n.dimension_id;
end;
$$;

revoke execute on function public.set_dimension_notes(jsonb) from public, anon;
grant execute on function public.set_dimension_notes(jsonb) to authenticated;

commit;
