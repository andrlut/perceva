-- migration: 20261018000004_learning_idea_training_start.sql
-- purpose: O começo da agenda do Treino de ideias passa a morar no servidor.
--          Até aqui a regra "a favorita entra no treino no dia SEGUINTE ao
--          que foi guardada" só existia nos dois leitores (app e MCP), e o
--          train_idea tratava train_due nulo como "vence já": pelo conector
--          dava pra treinar uma ideia favoritada cinco minutos antes e
--          empurrá-la 3 dias. Agora:
--            - review_idea carimba train_due = dia local + 1 ao favoritar
--              (só se ainda não houver agenda; re-favoritar não reinicia);
--            - as favoritas que já existem ganham o mesmo carimbo;
--            - train_idea só treina favoritas e, por garantia, deriva o
--              começo de reviewed_at quando train_due vier nulo;
--            - train_idea deixa de devolver firm_favorites, que contava
--              ideias de material arquivado e divergia do baralho.
--
-- affected tables: learning_idea_collect (backfill de train_due)
-- changed rpcs:    review_idea(text, text, boolean) → review_idea(text, text, boolean, date default null)
--                  train_idea(text, text, boolean, date) — mesmo nome e args
-- breaking?        no — o p_today novo tem default: clientes antigos chamam
--                  review_idea com 3 args nomeados e o PostgREST preenche
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   escrita pelo editor (nunca heredoc): PT com acento em comentários e mensagens
--   sem p_today (app antigo), o dia local cai na constante America/Sao_Paulo,
--     a mesma do conector MCP

begin;

-- ── 1. review_idea carimba o começo do treino ─────────────────────────────
-- Assinatura muda (p_today novo), então o antigo sai antes: create or replace
-- com outra lista de argumentos criaria uma sobrecarga ambígua.
drop function if exists public.review_idea(text, text, boolean);

create function public.review_idea(
  p_slug text,
  p_idea_id text,
  p_favorite boolean,
  p_today date default null
)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_char    uuid := auth.uid();
  v_mat     uuid;
  v_now     timestamptz := now();
  v_today   date;
  v_pending integer;
  v_favs    integer;
begin
  if v_char is null then
    raise exception 'not authenticated';
  end if;
  if p_favorite is null then
    raise exception 'p_favorite must be true or false';
  end if;
  if p_today is not null and (p_today < current_date - 1 or p_today > current_date + 1) then
    raise exception 'p_today out of range: %', p_today;
  end if;
  v_today := coalesce(p_today, (v_now at time zone 'America/Sao_Paulo')::date);

  select id into v_mat
  from public.learning_material
  where slug = p_slug and is_archived = false;
  if v_mat is null then
    raise exception 'material not found: %', p_slug;
  end if;

  update public.learning_idea_collect
     set favorite = p_favorite,
         reviewed_at = v_now,
         -- Favoritar abre a agenda no dia seguinte (tentar lembrar um minuto
         -- depois de ler é releitura). Quem já tinha agenda a mantém.
         train_due = case
           when p_favorite and train_due is null then v_today + 1
           else train_due
         end
   where character_id = v_char
     and material_id = v_mat
     and idea_id = p_idea_id;
  if not found then
    raise exception 'idea not collected: %/%', p_slug, p_idea_id;
  end if;

  select count(*) filter (where reviewed_at is null),
         count(*) filter (where favorite is true)
    into v_pending, v_favs
  from public.learning_idea_collect
  where character_id = v_char;

  return json_build_object(
    'favorite', p_favorite,
    'reviewed_at', v_now,
    'pending_reviews', v_pending,
    'favorites', v_favs
  );
end
$fn$;

revoke all on function public.review_idea(text, text, boolean, date) from public, anon;
grant execute on function public.review_idea(text, text, boolean, date) to authenticated;

-- ── 2. favoritas que já existem ganham o mesmo começo ─────────────────────
update public.learning_idea_collect
   set train_due = (reviewed_at at time zone 'America/Sao_Paulo')::date + 1
 where favorite is true
   and train_due is null
   and reviewed_at is not null;

-- ── 3. train_idea: só favoritas; começo derivado se faltar ────────────────
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

  select train_box, train_due, trained_on, favorite, reviewed_at
    into v_row
  from public.learning_idea_collect
  where character_id = v_char
    and material_id = v_mat
    and idea_id = p_idea_id
  for update;
  if not found then
    raise exception 'idea not collected: %/%', p_slug, p_idea_id;
  end if;
  if v_row.favorite is not true then
    raise exception 'idea not in training (not a favorite): %/%', p_slug, p_idea_id;
  end if;

  v_box := v_row.train_box;
  -- Toda favorita tem train_due desde o carimbo do review_idea; o coalesce é
  -- a rede pra uma linha que escape dele.
  v_due := coalesce(
    v_row.train_due,
    (v_row.reviewed_at at time zone 'America/Sao_Paulo')::date + 1
  );
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

  return json_build_object(
    'counted', v_reason in ('missed', 'advanced'),
    'reason', v_reason,
    'remembered', p_remembered,
    'box', v_box,
    'firm', v_box >= 3,
    'due', v_due
  );
end
$fn$;

revoke all on function public.train_idea(text, text, boolean, date) from public, anon;
grant execute on function public.train_idea(text, text, boolean, date) to authenticated;

commit;
