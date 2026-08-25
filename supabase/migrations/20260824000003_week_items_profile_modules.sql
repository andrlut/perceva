-- migration: 20260824000003_week_items_profile_modules.sql
-- purpose: "Minha Semana" module foundation — the weekly sheet (3 bigs +
--          life-admin items with an optional day chip) and per-user module
--          toggles on profile. First module of the opt-in architecture.
--
-- affected tables: profile (new column: modules), week_item (new)
-- new rpcs:        none (direct CRUD via RLS)
-- breaking?       no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   week_item is wired to ZERO gamification by design (mood_log precedent):
--   checking an item grants no XP, no coins, no Momentum. The sheet carries
--   the life-admin that is NOT a practice; the two worlds never mix.

begin;

-- ── profile.modules — per-user opt-in module toggles ─────────────────────────
-- Shape: {"semana": true, ...} — merged client-side over MODULE_DEFAULTS, so
-- an absent key falls back to the module's default (semana defaults ON).
-- Written directly by the client (RLS profile_self_update already allows it;
-- the lock_subscription_tier trigger protects ONLY subscription_tier). This is
-- preference, not entitlement — if a module is ever paid, enforcement follows
-- the free_limits trigger pattern, never this column.
alter table public.profile
  add column if not exists modules jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.profile
    add constraint profile_modules_is_object
    check (jsonb_typeof(modules) = 'object');
exception when duplicate_object then null;
end $$;

-- ── week_item — one row per line of the weekly sheet ─────────────────────────
-- week_start is the LOCAL date the client computes from settings.weekStart
-- (sunday|monday) and freezes per row — "the week is a user-local concept",
-- same doctrine as task_skip.skipped_for / mood_log.logged_for. The server
-- never knows timezones and never derives weeks.
--
-- slot 1..3  = one of "As 3 da Semana" (3 physical slots — the max-3 rule is
--              schema, not copy). null = a regular "Mais desta semana" item.
-- day 0..6   = optional day-of-week chip (0=Sunday, matching the client's
--              recurrence.days convention). null = "some time this week".
-- Carry-over = UPDATE week_start to the new week (the item moves; an undone
--              item left behind simply stays in its old week, uncharged).
create table if not exists public.week_item (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.character(id) on delete cascade,
  week_start   date not null,
  slot         smallint check (slot between 1 and 3),
  title        text not null,
  -- "Primeira ação concreta" of a big (slot item). Nudged in the UI, never
  -- required — adult kindness allows a draft.
  first_action text,
  day          smallint check (day between 0 and 6),
  done_at      timestamptz,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Three slots per week, hard: the sheet cannot hold a 4th big.
create unique index if not exists week_item_slot_unique
  on public.week_item (character_id, week_start, slot)
  where slot is not null;

create index if not exists week_item_char_week_idx
  on public.week_item (character_id, week_start);

alter table public.week_item enable row level security;

-- Self-only: character.id == auth.uid() (1:1 with auth.users), the standard
-- personal-table policy set. DELETE is deliberately allowed — the sheet is
-- the user's own planning text (LGPD: they can erase it), not an immutable log.
create policy "week_item_self_select" on public.week_item
  for select to authenticated using (character_id = auth.uid());

create policy "week_item_self_insert" on public.week_item
  for insert to authenticated with check (character_id = auth.uid());

create policy "week_item_self_update" on public.week_item
  for update to authenticated
  using (character_id = auth.uid())
  with check (character_id = auth.uid());

create policy "week_item_self_delete" on public.week_item
  for delete to authenticated using (character_id = auth.uid());

commit;
