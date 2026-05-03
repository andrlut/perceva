-- ============================================================================
-- Assessment history — split self-assessment from questionnaire and keep a
-- timestamped log of every score change.
--
-- character_sub used to hold ONE score per (char, sub). Now we split by source:
--
--   character_sub_score(char, source, sub) → current score per source
--     source ∈ {'self', 'questionnaire'}
--
--   assessment_log(char, source, sub, score, recorded_at) → append-only
--     event history. Lets us draw "how I've changed over time" charts later.
--
-- This sets up plumbing for the questionnaire sprint without building it yet.
-- The hex on the Hero tab continues to show source='self'.
-- ============================================================================

begin;

-- ─── 1. Current snapshot per (char, source, sub) ─────────────────────────
create table public.character_sub_score (
  character_id uuid not null references public.character(id) on delete cascade,
  source       text not null check (source in ('self', 'questionnaire')),
  sub_id       text not null references public.dimension_sub(id) on delete cascade,
  score        smallint not null default 0 check (score between 0 and 5),
  updated_at   timestamptz not null default now(),
  primary key (character_id, source, sub_id)
);

alter table public.character_sub_score enable row level security;

create policy "css_self_all" on public.character_sub_score
  for all to authenticated
  using (character_id = auth.uid())
  with check (character_id = auth.uid());

-- ─── 2. Append-only history of every score recorded ──────────────────────
create table public.assessment_log (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.character(id) on delete cascade,
  source       text not null check (source in ('self', 'questionnaire')),
  sub_id       text not null references public.dimension_sub(id) on delete cascade,
  score        smallint not null check (score between 0 and 5),
  recorded_at  timestamptz not null default now()
);

create index assessment_log_char_source_sub_idx
  on public.assessment_log (character_id, source, sub_id, recorded_at desc);

alter table public.assessment_log enable row level security;

create policy "alog_self_select" on public.assessment_log
  for select to authenticated using (character_id = auth.uid());

create policy "alog_self_insert" on public.assessment_log
  for insert to authenticated with check (character_id = auth.uid());
-- log is immutable: no update/delete policies

-- ─── 3. Migrate existing character_sub → character_sub_score(self) ───────
insert into public.character_sub_score (character_id, source, sub_id, score)
  select character_id, 'self', sub_id, subjective_score from public.character_sub;

-- ─── 4. RPC: atomic upsert + log append ──────────────────────────────────
create or replace function public.set_sub_score(
  p_source text,
  p_sub_id text,
  p_score  smallint
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_source not in ('self', 'questionnaire') then
    raise exception 'Invalid source: %', p_source;
  end if;
  if p_score < 0 or p_score > 5 then
    raise exception 'Score must be 0-5, got %', p_score;
  end if;
  if not exists (select 1 from public.dimension_sub where id = p_sub_id) then
    raise exception 'Unknown sub_id: %', p_sub_id;
  end if;

  insert into public.character_sub_score (character_id, source, sub_id, score)
  values (auth.uid(), p_source, p_sub_id, p_score)
  on conflict (character_id, source, sub_id)
  do update set score = excluded.score, updated_at = now();

  insert into public.assessment_log (character_id, source, sub_id, score)
  values (auth.uid(), p_source, p_sub_id, p_score);
end $$;

grant execute on function public.set_sub_score(text, text, smallint) to authenticated;

-- ─── 5. Update handle_new_user trigger ───────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1),
      'Adventurer'
    )
  );

  insert into public.character (id) values (new.id);

  insert into public.character_dimension (character_id, dimension_id)
    select new.id, d.id from public.dimension d;

  -- Self-assessment baseline (12 rows at 0). No questionnaire row until taken.
  insert into public.character_sub_score (character_id, source, sub_id)
    select new.id, 'self', s.id from public.dimension_sub s;

  perform public.seed_sample_tasks(new.id);

  return new;
end $$;

-- ─── 6. Drop legacy character_sub (data migrated above) ──────────────────
drop table public.character_sub;

commit;
