-- migration: 20261002000004_free_limit_only_custom_tasks.sql
--
-- NO-OP deliberado (reafirmação): redefine enforce_free_creation_limit com
-- corpo FUNCIONALMENTE IDÊNTICO ao de 20260925000001 (catálogo ilimitado no
-- free; o limite de 10 conta só template_id is null).
--
-- Histórico: escrita durante a auditoria do Premium de 2026-10-02 a partir da
-- leitura da migration ANTIGA (20260707000001), antes de encontrarmos que a
-- 20260925000001 do André já havia feito a mudança — inclusive com o
-- guard_task_template_link, que esta migration NÃO toca. Aplicada ao banco
-- antes da descoberta; fica no histórico como reafirmação sem efeito.

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
