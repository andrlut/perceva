-- ============================================================================
-- task.template_id — track which tasks were adopted from a system template.
--
-- Mirrors quest.template_id. Lets the My Tasks UI distinguish between:
--   - "Custom" tasks (template_id NULL): user made it from scratch
--   - "Adopted" tasks (template_id set): user took it from the catalog
--
-- ON DELETE SET NULL — if a template is ever pulled from the catalog, the
-- user's adopted task survives but loses its origin link (matches quests).
-- ============================================================================

begin;

alter table public.task
  add column template_id text references public.task_template(id) on delete set null;

create index task_template_id_idx on public.task (template_id) where template_id is not null;

-- start_task_from_template: stamp the new task with its origin.
create or replace function public.start_task_from_template(
  p_template_id text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template public.task_template%rowtype;
  v_new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_template from public.task_template where id = p_template_id;
  if not found then
    raise exception 'Unknown template: %', p_template_id;
  end if;

  insert into public.task (
    character_id, title, description, difficulty, task_type,
    recurrence, target_count, sub_id, template_id,
    metric_type, metric_label, base_value, increment_per_star
  ) values (
    auth.uid(), v_template.title, v_template.description,
    v_template.difficulty, v_template.task_type,
    v_template.recurrence, v_template.target_count, v_template.sub_id, v_template.id,
    v_template.metric_type, v_template.metric_label,
    v_template.base_value, v_template.increment_per_star
  )
  returning id into v_new_id;

  return v_new_id;
end $$;

grant execute on function public.start_task_from_template(text) to authenticated;

commit;
