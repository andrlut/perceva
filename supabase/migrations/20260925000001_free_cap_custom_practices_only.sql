-- migration: 20260925000001_free_cap_custom_practices_only.sql
-- purpose: practices adopted from the system catalog are unlimited on the
--          free plan; only CUSTOM practices (template_id is null) count
--          toward the 10-practice cap. Decision by the maintainer on
--          2026-09-25 so the onboarding starter pack (12 catalog practices,
--          one per sub-area) fits a free account.
--
-- affected tables: task (function enforce_free_creation_limit replaced;
--                  new triggers guard_task_template_link and
--                  enforce_free_limit_unlink)
-- new rpcs:        none
-- breaking?        no — every existing client path already leaves
--                  template_id alone (inserts never send it; the edit path
--                  only ever sets it to null).
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   * The catalog link becomes what grants "unlimited", so it must be
--     unforgeable: only the SECURITY DEFINER adoption RPC
--     (start_task_from_template, current_user = owner) may stamp it. A
--     client (current_user = 'authenticated') can neither insert a row with
--     a template_id nor point an existing row at a template.
--   * Dropping the link (template_id → null) is the product's "you edited a
--     catalog practice, now it's yours" path (useUpdateTask
--     dropTemplateLink). On an active row that turns a free slot into a
--     custom one, so it re-runs the cap — otherwise adopt-then-edit would
--     mint unlimited custom practices.
--   * Restoring an archived catalog practice (enforce_free_limit_restore,
--     20260922000001) is exempt through the same template_id test; restoring
--     a custom one still counts custom rows only.
--   * BEFORE triggers fire in name order: enforce_free_limit (e) runs before
--     guard_task_template_link (g); a forged insert is exempted by the first
--     and rejected by the second, so the order is harmless either way.

begin;

-- ─── Free-tier caps: catalog practices no longer count ─────────────────────
create or replace function public.enforce_free_creation_limit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tier  text;
  v_count int;
  v_limit int;
begin
  -- Non-app inserts (Studio / migrations / signup trigger) run without a JWT.
  if auth.uid() is null then
    return new;
  end if;

  -- Premium = unlimited.
  select subscription_tier into v_tier from public.profile where id = auth.uid();
  if v_tier = 'premium' then
    return new;
  end if;

  if TG_TABLE_NAME = 'task' then
    -- Catalog practices are free and unlimited; only custom ones count.
    if new.template_id is not null then
      return new;
    end if;
    v_limit := 10;
    select count(*) into v_count from public.task
      where character_id = new.character_id
        and is_archived = false
        and template_id is null;
  elsif TG_TABLE_NAME = 'reward' then
    v_limit := 5;
    select count(*) into v_count from public.reward
      where character_id = new.character_id and is_archived = false;
  elsif TG_TABLE_NAME = 'skill' then
    v_limit := 3;
    select count(*) into v_count from public.skill
      where character_id = new.character_id;
  elsif TG_TABLE_NAME = 'quest' then
    v_limit := 3;
    select count(*) into v_count from public.quest
      where character_id = new.character_id and status = 'active';
  else
    return new;
  end if;

  if v_count >= v_limit then
    raise exception 'free_limit_reached'
      using errcode = 'P0001', detail = TG_TABLE_NAME, hint = 'free_limit';
  end if;

  return new;
end $$;

-- ─── The catalog link is set only by the adoption RPC ──────────────────────
create or replace function public.guard_task_template_link()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user = 'authenticated' and new.template_id is not null then
    if TG_OP = 'INSERT'
       or new.template_id is distinct from old.template_id then
      raise exception 'template_link_forbidden'
        using errcode = '42501',
              hint = 'adopt catalog practices through start_task_from_template';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists guard_task_template_link on public.task;
create trigger guard_task_template_link
  before insert or update of template_id on public.task
  for each row execute function public.guard_task_template_link();

-- ─── Unlinking an active catalog practice claims a custom slot ─────────────
-- The stored row still carries its template_id while this BEFORE trigger
-- runs, so the count covers the OTHER custom practices only.
drop trigger if exists enforce_free_limit_unlink on public.task;
create trigger enforce_free_limit_unlink
  before update of template_id on public.task
  for each row
  when (old.template_id is not null
        and new.template_id is null
        and new.is_archived = false)
  execute function public.enforce_free_creation_limit();

commit;
