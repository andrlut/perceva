-- migration: 20261008000003_harden_rpc_grants_and_quest_economy.sql
-- purpose: Tarefa 7 do roadmap da auditoria de 2026-10-06 — endurecimento
--          das funções e da economia. Fecha os achados RPC-02, RPC-03,
--          RLS-02, RLS-03 e REL-01, e completa a tarefa 5 (RPC-01).
--
--   1. Apaga 3 funções SECURITY DEFINER mortas (nada no app, no conector
--      nem em outra função as chama): seed_sample_rewards e
--      compute_streak_days aceitavam o UUID de QUALQUER usuário, sem login;
--      submit_questionnaire é a entrada da Avaliação v1, que o app deixou
--      de usar em 2026-05-07 (#117).
--   2. Nenhuma função SECURITY DEFINER executa sem login: tira EXECUTE de
--      PUBLIC e anon de todas. O padrão "revoke ... from public" das
--      migrations antigas não tirava o anon, que recebe grant explícito do
--      default ACL do schema — por isso 36 funções seguiam abertas.
--   3. Helpers internos e funções de gatilho saem também do authenticated:
--      só são chamados de dentro de outras SECURITY DEFINER (como postgres)
--      ou disparados por gatilho, que não confere EXECUTE.
--   4. Muda o padrão para funções FUTURAS criadas pelo postgres: sem
--      PUBLIC (global) e sem anon (schema public). authenticated e
--      service_role continuam recebendo pelo default do schema.
--   5. expire_overdue_quests: expira só as missões de quem chama (antes,
--      qualquer anônimo varria as missões de todo mundo, e o app, como
--      authenticated, não tinha permissão — a expiração nunca rodava pelo
--      app) e o ramo de skill lia qr.target_value, coluna que não existe
--      (o alvo é min_value). Com o ramo vivo de novo: sem alvo válido a
--      razão parcial é 0 (least() ignora NULL e daria 1.0), e cada missão
--      é travada (FOR UPDATE) e expirada antes de pagar, então chamadas
--      simultâneas não pagam duas vezes.
--   6. Resgates só pelas funções: sai o INSERT direto em reward_redemption,
--      que somado ao undo_reward_redemption criava moedas infinitas.
--   7. Missões: o cliente só lê e abandona (ativa → abandonada). Antes a
--      policy FOR ALL deixava editar recompensa, reativar missão concluída
--      e furar o limite free de 3 ativas trocando o status. Requisitos e
--      progresso de desafio só pelas funções.
--   8. start_custom_quest aplica no servidor a regra que o app já aplica
--      (app/lib/quests/reward.ts): XP derivado com teto de 400 (XP é
--      medida, não moeda) e moedas livres até 99.999 (MAX_COINS_INPUT).
--      E os requisitos só apontam pra prática própria e skill do catálogo
--      ou própria (achado RPC-04/RLS-08: um UUID alheio travava o
--      hard-delete da prática da vítima).
--   9. Complemento da tarefa 5 (20261006000004): search_path fixo no
--      lock_subscription_tier (alerta do advisor) e sem privilégio de
--      INSERT do cliente em profile.
--  10. Excluir a conta deixa de falhar para quem tem missão com requisito
--      de prática (ou de skill própria): as FKs de quest_requirement viram
--      NO ACTION conferida no commit (achado LGPD-13; em 2026-10-08 havia 1 conta nessa
--      situação, sem conseguir se excluir).
--
-- affected tables: reward_redemption, quest, quest_requirement,
--                  quest_challenge_log, profile (grants/policies)
-- new rpcs:        none (dropadas: seed_sample_rewards, compute_streak_days,
--                  submit_questionnaire)
-- breaking?        no para o app atual — conferido em app/lib, app/app,
--                  app/components e supabase/functions: nenhuma RPC é chamada
--                  antes do login; as únicas escritas diretas nessas tabelas
--                  são quest.update({status:'abandoned'}) (useAbandonQuest),
--                  que continua permitida. A expiração de missões passa a
--                  funcionar pelo app (com recompensa parcial quando o
--                  personagem permite), que é o comportamento desenhado.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   continua aberto, por decisão de produto: complete_quest paga sem
--   conferir o progresso dos requisitos (cria-e-conclui rende até 400 XP e
--   99.999 moedas por missão, só na própria conta).

begin;

-- 1. Funções mortas -------------------------------------------------------
drop function if exists public.seed_sample_rewards(uuid);
drop function if exists public.compute_streak_days(uuid, date);
drop function if exists public.submit_questionnaire(jsonb, integer);

-- 2. Nenhuma SECURITY DEFINER sem login -----------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prosecdef
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
  end loop;
end $$;

-- 3. Helpers internos e gatilhos fora do alcance do cliente ---------------
revoke execute on function
  public._psych_score_session(uuid),
  public.psych_seed_session_items(uuid),
  public.handle_new_user(),
  public.enforce_premium_instrument(),
  public.snapshot_material_revision()
from authenticated;

-- 4. Padrão para funções futuras ------------------------------------------
alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon;

-- 5. expire_overdue_quests: só as do próprio usuário ----------------------
create or replace function public.expire_overdue_quests()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid           uuid := auth.uid();
  v_quest         record;
  v_allow_partial boolean;
  v_progress      numeric;
  v_ratio         numeric;
  v_partial_xp    integer;
  v_partial_coins integer;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  for v_quest in
    select id, character_id, quest_type, challenge_target_value, reward_xp, reward_coins
    from quest
    where status = 'active'
      and deadline < now()
      and character_id = v_uid
    for update
  loop
    -- Expira ANTES de pagar e só se ainda estiver ativa: duas chamadas
    -- simultâneas não pagam a mesma missão duas vezes.
    update quest
    set status = 'expired'
    where id = v_quest.id
      and status = 'active';
    if not found then
      continue;
    end if;

    -- read the character's partial-reward preference
    select allow_partial_quest_reward into v_allow_partial
    from character
    where id = v_quest.character_id;

    if v_allow_partial then
      v_ratio := 0;

      if v_quest.quest_type = 'challenge'
         and coalesce(v_quest.challenge_target_value, 0) > 0 then
        select coalesce(max(value), 0) into v_progress
        from quest_challenge_log
        where quest_id = v_quest.id;
        v_ratio := least(v_progress / v_quest.challenge_target_value, 1.0);

      elsif v_quest.quest_type = 'skill' then
        -- least() ignora NULL: sem alvo válido a DIVISÃO vira NULL e tem
        -- que virar 0 antes do least(), senão least(NULL, 1.0) = 1.0 pagaria
        -- a missão inteira sem progresso nenhum.
        select least(
          coalesce(
            coalesce(
              (select sl.value
               from skill_log sl
               join quest_requirement qr
                 on qr.skill_id = sl.skill_id
                and qr.quest_id = v_quest.id
                and qr.kind = 'reach_skill_value'
               where sl.character_id = v_quest.character_id
               order by sl.logged_at desc
               limit 1),
              0
            )
            /
            (select qr.min_value
             from quest_requirement qr
             where qr.quest_id = v_quest.id
               and qr.kind = 'reach_skill_value'
               and qr.min_value > 0
             limit 1),
            0
          ),
          1.0
        ) into v_ratio;
      end if;

      -- grant partial reward proportional to progress
      if coalesce(v_ratio, 0) > 0 then
        v_partial_xp    := floor(coalesce(v_quest.reward_xp, 0)    * v_ratio);
        v_partial_coins := floor(coalesce(v_quest.reward_coins, 0) * v_ratio);
        if v_partial_xp > 0 or v_partial_coins > 0 then
          update character
          set total_xp = total_xp + v_partial_xp,
              coins    = coins    + v_partial_coins
          where id = v_quest.character_id;
        end if;
      end if;
    end if;
  end loop;
end;
$$;

revoke execute on function public.expire_overdue_quests() from public, anon;
grant execute on function public.expire_overdue_quests() to authenticated;

-- 6. Resgates: só redeem_reward_n / undo_reward_redemption ---------------
drop policy if exists reward_redemption_self_insert on public.reward_redemption;
revoke insert, update, delete, truncate on public.reward_redemption from anon, authenticated;

-- 7. Missões: o cliente lê e abandona; o resto é pelas funções ------------
drop policy if exists quest_self_all on public.quest;
create policy quest_self_select on public.quest
  for select to authenticated
  using (character_id = (select auth.uid()));
create policy quest_self_abandon on public.quest
  for update to authenticated
  using (character_id = (select auth.uid()) and status = 'active')
  with check (character_id = (select auth.uid()) and status = 'abandoned');
revoke insert, update, delete, truncate on public.quest from anon, authenticated;
grant update (status) on public.quest to authenticated;

drop policy if exists quest_req_self_all on public.quest_requirement;
create policy quest_req_self_select on public.quest_requirement
  for select to authenticated
  using (exists (
    select 1 from public.quest q
    where q.id = quest_requirement.quest_id
      and q.character_id = (select auth.uid())
  ));
revoke insert, update, delete, truncate on public.quest_requirement from anon, authenticated;

drop policy if exists "quest_challenge_log: self-insert" on public.quest_challenge_log;
alter policy "quest_challenge_log: self-read" on public.quest_challenge_log to authenticated;
revoke insert, update, delete, truncate on public.quest_challenge_log from anon, authenticated;

-- 8. start_custom_quest: teto no servidor ---------------------------------
create or replace function public.start_custom_quest(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_quest_id uuid;
  v_req jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  insert into public.quest (
    character_id, title, description, deadline,
    reward_xp, reward_coins, allow_partial
  ) values (
    auth.uid(),
    p_payload->>'title',
    p_payload->>'description',
    (p_payload->>'deadline')::timestamptz,
    -- XP é medida: derivado no app (10/estrela, 20..400) e com teto aqui.
    least(greatest(coalesce((p_payload->>'reward_xp')::numeric, 0), 0), 400)::int,
    -- Moeda é livre (decisão do dono, 2026-09-07); o teto só barra abuso.
    least(greatest(coalesce((p_payload->>'reward_coins')::numeric, 0), 0), 99999)::int,
    coalesce((p_payload->>'allow_partial')::boolean, false)
  )
  returning id into v_quest_id;

  for v_req in select jsonb_array_elements(p_payload->'requirements') loop
    -- Requisito só aponta pra prática própria e pra skill do catálogo ou
    -- própria: um UUID alheio aqui travava o hard-delete da prática da vítima.
    if nullif(v_req->>'task_id', '') is not null and not exists (
      select 1 from public.task t
      where t.id = (v_req->>'task_id')::uuid
        and t.character_id = auth.uid()
    ) then
      raise exception 'Task not found';
    end if;
    if nullif(v_req->>'skill_id', '') is not null and not exists (
      select 1 from public.skill s
      where s.id = v_req->>'skill_id'
        and (s.character_id is null or s.character_id = auth.uid())
    ) then
      raise exception 'Skill not found';
    end if;

    insert into public.quest_requirement (
      quest_id, kind, task_id, dimension_id, skill_id, sub_id,
      target_count, min_value, sort_order
    ) values (
      v_quest_id,
      v_req->>'kind',
      nullif(v_req->>'task_id', '')::uuid,
      nullif(v_req->>'dimension_id', ''),
      nullif(v_req->>'skill_id', ''),
      nullif(v_req->>'sub_id', ''),
      nullif(v_req->>'target_count', '')::int,
      nullif(v_req->>'min_value', '')::numeric,
      coalesce(nullif(v_req->>'sort_order', '')::int, 0)
    );
  end loop;

  return v_quest_id;
end $$;

-- 9. Complemento da tarefa 5 ----------------------------------------------
alter function public.lock_subscription_tier() set search_path = '';
revoke insert on public.profile from anon, authenticated;

-- 10. Excluir a conta não pode travar numa missão ------------------------
-- Na cascata da exclusão de conta a prática (ou a skill própria) pode ser
-- apagada ANTES da missão que a referencia. Com SET NULL o requisito ficava
-- com task_id nulo e a CHECK quest_requirement_kind_payload abortava a
-- exclusão inteira; com RESTRICT a skill própria travava na hora. NO ACTION
-- sozinho não basta: cada passo da cascata é um statement próprio e a
-- checagem roda no fim dele, antes da missão ir embora. Por isso a chave é
-- conferida no COMMIT (deferrable initially deferred), quando a missão e os
-- requisitos já foram junto. Fora da exclusão de conta nada muda: delete_task
-- já recusa prática usada por missão, e apagar uma skill referenciada
-- continua recusado (no commit, em vez de na hora).
alter table public.quest_requirement
  drop constraint quest_requirement_task_id_fkey,
  add constraint quest_requirement_task_id_fkey
    foreign key (task_id) references public.task(id) on delete no action
    deferrable initially deferred;
alter table public.quest_requirement
  drop constraint quest_requirement_skill_id_fkey,
  add constraint quest_requirement_skill_id_fkey
    foreign key (skill_id) references public.skill(id) on delete no action
    deferrable initially deferred;

notify pgrst, 'reload schema';

commit;
