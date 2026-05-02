-- ============================================================================
-- RPG Tasks — Initial schema (Phase 1)
--
-- Tables: profile, character, dimension, character_dimension,
--         task, task_dimension, task_completion
-- Plus: RLS policies, signup trigger, dimension seed.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- DIMENSIONS (catalog — public read for authenticated users)
-- ──────────────────────────────────────────────────────────────────────────

create table public.dimension (
  id text primary key,
  display_name text not null,
  color text not null,
  icon text not null,
  sort_order integer not null
);

alter table public.dimension enable row level security;

create policy "dimension_read_authenticated"
  on public.dimension for select
  to authenticated using (true);

insert into public.dimension (id, display_name, color, icon, sort_order) values
  ('health',     'Health',     '#FF6B7A', 'heart',    1),
  ('strength',   'Strength',   '#FF8A3D', 'dumbbell', 2),
  ('mind',       'Mind',       '#B07BFF', 'brain',    3),
  ('wealth',     'Wealth',     '#FFC83D', 'coin',     4),
  ('social',     'Social',     '#4DD0FF', 'users',    5),
  ('discipline', 'Discipline', '#2EC4B6', 'shield',   6);

-- ──────────────────────────────────────────────────────────────────────────
-- PROFILE (1:1 with auth.users)
-- ──────────────────────────────────────────────────────────────────────────

create table public.profile (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile enable row level security;

create policy "profile_self_select" on public.profile
  for select to authenticated using (id = auth.uid());

create policy "profile_self_update" on public.profile
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "profile_self_insert" on public.profile
  for insert to authenticated with check (id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────
-- CHARACTER (1:1 with profile/user)
-- ──────────────────────────────────────────────────────────────────────────

create table public.character (
  id uuid primary key references public.profile(id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.character enable row level security;

create policy "character_self_select" on public.character
  for select to authenticated using (id = auth.uid());

create policy "character_self_update" on public.character
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "character_self_insert" on public.character
  for insert to authenticated with check (id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────
-- CHARACTER_DIMENSION (per-character XP per dimension)
-- ──────────────────────────────────────────────────────────────────────────

create table public.character_dimension (
  character_id uuid not null references public.character(id) on delete cascade,
  dimension_id text not null references public.dimension(id) on delete restrict,
  xp integer not null default 0 check (xp >= 0),
  primary key (character_id, dimension_id)
);

alter table public.character_dimension enable row level security;

create policy "char_dim_self_all" on public.character_dimension
  for all to authenticated
  using (character_id = auth.uid())
  with check (character_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────
-- TASK (definitions)
-- ──────────────────────────────────────────────────────────────────────────

create table public.task (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.character(id) on delete cascade,
  title text not null,
  description text,
  difficulty smallint not null check (difficulty between 1 and 5),
  task_type text not null check (task_type in ('one_shot', 'daily', 'weekly')),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_character_idx on public.task (character_id) where is_archived = false;

alter table public.task enable row level security;

create policy "task_self_all" on public.task
  for all to authenticated
  using (character_id = auth.uid())
  with check (character_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────
-- TASK_DIMENSION (M:N: a task can grant XP in multiple dimensions)
-- ──────────────────────────────────────────────────────────────────────────

create table public.task_dimension (
  task_id uuid not null references public.task(id) on delete cascade,
  dimension_id text not null references public.dimension(id) on delete restrict,
  primary key (task_id, dimension_id)
);

alter table public.task_dimension enable row level security;

create policy "task_dim_self_all" on public.task_dimension
  for all to authenticated
  using (
    exists (
      select 1 from public.task t
      where t.id = task_dimension.task_id and t.character_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.task t
      where t.id = task_dimension.task_id and t.character_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────────────────
-- TASK_COMPLETION (immutable history of completed tasks)
-- ──────────────────────────────────────────────────────────────────────────

create table public.task_completion (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.task(id) on delete cascade,
  character_id uuid not null references public.character(id) on delete cascade,
  completed_at timestamptz not null default now(),
  xp_granted integer not null check (xp_granted >= 0),
  coins_granted integer not null check (coins_granted >= 0)
);

create index task_completion_character_idx
  on public.task_completion (character_id, completed_at desc);

alter table public.task_completion enable row level security;

create policy "task_completion_self_select" on public.task_completion
  for select to authenticated using (character_id = auth.uid());

create policy "task_completion_self_insert" on public.task_completion
  for insert to authenticated with check (character_id = auth.uid());

-- task_completions are immutable: no update / delete policies.

-- ──────────────────────────────────────────────────────────────────────────
-- updated_at trigger (generic)
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profile_touch_updated_at
  before update on public.profile
  for each row execute function public.touch_updated_at();

create trigger character_touch_updated_at
  before update on public.character
  for each row execute function public.touch_updated_at();

create trigger task_touch_updated_at
  before update on public.task
  for each row execute function public.touch_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- SIGNUP TRIGGER
-- On new auth.users row, auto-create profile, character, and seed
-- character_dimension rows for every known dimension.
-- ──────────────────────────────────────────────────────────────────────────

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

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
