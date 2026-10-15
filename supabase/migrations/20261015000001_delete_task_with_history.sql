-- migration: 20261015000001_delete_task_with_history.sql
-- purpose: apagar de vez uma prática arquivada MESMO com histórico
--
-- affected tables: none (só a função)
-- rpcs:            delete_task (mesma assinatura)
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   decisão do dono (2026-10-15, opção A): apagar a prática apaga também as
--   conclusões dela (task_completion → task_completion_sub e task_skip saem
--   por ON DELETE CASCADE), mas o XP e as moedas já ganhos FICAM no
--   personagem (character.total_xp/coins e character_dimension.xp não são
--   estornados). Antes a função recusava qualquer prática com conclusões.
--   agora exige que a prática esteja ARQUIVADA (o app só oferece apagar no
--   rodapé Arquivadas) — uma prática ativa não some com um toque.
--   a trava de missão continua: quest_requirement aponta pra task sem
--   cascade, e apagar quebraria a missão.

begin;

create or replace function public.delete_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner uuid;
  v_archived boolean;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Row lock: serializes against complete_task (FOR KEY SHARE via RI).
  select character_id, is_archived
    into v_owner, v_archived
    from public.task
    where id = p_task_id
    for update;

  if not found then
    raise exception 'task not found';
  end if;
  if v_owner <> v_uid then
    raise exception 'not authorized';
  end if;
  if not v_archived then
    raise exception 'archive the task before deleting it';
  end if;

  if exists (
    select 1 from public.quest_requirement where task_id = p_task_id
  ) then
    raise exception 'cannot hard-delete task referenced by a quest; archive instead';
  end if;

  -- Completions (and their sub rows) and skips go with it by cascade; the XP
  -- and coins they paid stay on the character on purpose.
  delete from public.task where id = p_task_id;
end;
$function$;

revoke execute on function public.delete_task(uuid) from public, anon;
grant execute on function public.delete_task(uuid) to authenticated;

commit;
