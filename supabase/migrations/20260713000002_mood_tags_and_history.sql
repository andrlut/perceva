-- ============================================================================
-- Mood check-in — Phase 2: optional tags + retroactive logging
--
-- 1. mood_tag: a small SYSTEM catalog of tappable emotion words (bilingual,
--    public-read). Optional, capped, never a required field.
-- 2. mood_log.tags: the selected mood_tag slugs on a day's entry.
-- 3. log_mood v2: accepts p_tags (validated against the catalog) AND widens
--    the date window so any PAST day can be logged/edited from the history
--    day view. Only the future stays blocked (+1 for device/UTC tz skew).
-- ============================================================================

begin;

-- ─── 1. Tag catalog (system, public-read) ────────────────────────────────────
create table public.mood_tag (
  slug       text primary key,
  label_pt   text not null,
  label_en   text not null,
  emoji      text,
  tag_group  text not null default 'emotion'
             check (tag_group in ('emotion', 'context')),
  sort_order int not null default 0,
  is_active  boolean not null default true
);

alter table public.mood_tag enable row level security;

create policy "mood_tag_public_read" on public.mood_tag
  for select to authenticated using (true);

insert into public.mood_tag (slug, label_pt, label_en, emoji, tag_group, sort_order) values
  ('energetic',   'Energético',     'Energetic',   '⚡',  'emotion',  10),
  ('tired',       'Cansado',        'Tired',       '🥱', 'emotion',  20),
  ('calm',        'Tranquilo',      'Calm',        '😌', 'emotion',  30),
  ('anxious',     'Ansioso',        'Anxious',     '😰', 'emotion',  40),
  ('excited',     'Animado',        'Excited',     '🤩', 'emotion',  50),
  ('irritated',   'Irritado',       'Irritated',   '😤', 'emotion',  60),
  ('in_pain',     'Com dor',        'In pain',     '🤕', 'emotion',  70),
  ('sad',         'Triste',         'Sad',         '😔', 'emotion',  80),
  ('grateful',    'Grato',          'Grateful',    '🙏', 'emotion',  90),
  ('focused',     'Focado',         'Focused',     '🎯', 'emotion', 100),
  ('overwhelmed', 'Sobrecarregado', 'Overwhelmed', '🌊', 'emotion', 110),
  ('scattered',   'Disperso',       'Scattered',   '🌫', 'emotion', 120);

-- ─── 2. tags column on mood_log ───────────────────────────────────────────────
alter table public.mood_log add column tags text[];

-- ─── 3. log_mood v2 (tags + retroactive) ──────────────────────────────────────
-- Drop the 3-arg signature so PostgREST unambiguously resolves the shipped
-- client's {p_mood, p_note, p_logged_for} call to the new 4-arg (p_tags default).
drop function if exists public.log_mood(smallint, text, date);

create or replace function public.log_mood(
  p_mood       smallint,
  p_note       text default null,
  p_logged_for date default current_date,
  p_tags       text[] default null
) returns public.mood_log
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row  public.mood_log;
  v_tags text[];
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_mood < 1 or p_mood > 5 then
    raise exception 'Mood must be 1-5, got %', p_mood;
  end if;
  -- Retroactive logging allowed for any past day (history day view); only the
  -- future is blocked. +1 absorbs device-vs-UTC timezone skew for "today".
  if p_logged_for > current_date + 1 then
    raise exception 'Cannot log mood for a future day';
  end if;

  -- Keep only known, active tag slugs (drop anything the client sent that
  -- isn't in the catalog); null when nothing valid remains.
  if p_tags is not null then
    select array_agg(mt.slug order by mt.sort_order)
      into v_tags
      from public.mood_tag mt
      where mt.slug = any (p_tags) and mt.is_active;
  end if;

  insert into public.mood_log (character_id, logged_for, mood, note, tags)
  values (auth.uid(), p_logged_for, p_mood, nullif(btrim(p_note), ''), v_tags)
  on conflict (character_id, logged_for)
  do update set
    mood = excluded.mood,
    note = excluded.note,
    tags = excluded.tags,
    updated_at = now()
  returning * into v_row;

  return v_row;
end $$;

grant execute on function public.log_mood(smallint, text, date, text[]) to authenticated;

commit;
