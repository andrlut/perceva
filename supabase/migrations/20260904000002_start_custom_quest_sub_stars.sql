-- migration: 20260904000002_start_custom_quest_sub_stars.sql
-- purpose: (a) deixar quest personalizada usar o kind 'accumulate_sub_stars';
--          (b) fechar leitura cruzada em sub_stars_progress
--
-- affected tables: none (só funções)
-- new rpcs:        none — dois `create or replace` de RPCs existentes
-- breaking?        no — nenhum caller legítimo muda de comportamento
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
-- ─── (a) start_custom_quest não sabia escrever sub_id ──────────────────────
--   A função nasceu em 20260501000009:207-250, ANTES da coluna
--   quest_requirement.sub_id existir (ela chegou em 20260527000001:36-37).
--   O INSERT do loop nunca a preencheu. Consequência: qualquer payload com
--   kind 'accumulate_sub_stars' grava sub_id = null, viola o CHECK
--   quest_requirement_kind_payload (20260527000001:47-52) e faz ROLLBACK da
--   quest inteira. Ou seja: criar missão personalizada por estrelas em subs
--   era impossível, mesmo com o botão na tela.
--
--   Este é o gêmeo de 20260527000003_start_quest_handles_sub_stars.sql, que
--   fez exatamente esta correção em start_quest_from_template e esqueceu a
--   irmã.
--
--   Delta vs. o corpo original: DUAS colunas no INSERT do loop.
--     - sub_id      → o que destrava o kind
--     - sort_order  → passa a importar porque uma missão multi-sub tem N
--                     requisitos do MESMO kind, e o cliente os ordena por
--                     essa coluna (app/lib/api/quests.ts:163). Vai com
--                     coalesce: a coluna é NOT NULL DEFAULT 0
--                     (20260501000009:102) e um NULL cru quebraria.
--   Todo o resto é cópia fiel.
--
-- ─── (b) sub_stars_progress vazava progresso entre usuários ────────────────
--   A versão vigente (20260527000001:60-77) é SECURITY DEFINER e junta
--   `quest q on q.id = p_quest_id` SEM predicado de dono, somando as
--   estrelas de q.character_id. Qualquer usuário autenticado que adivinhe
--   ou obtenha um uuid de quest lê o progresso de outra pessoa — o
--   security definer contorna a RLS que deveria barrar isso.
--
--   Acrescentamos `and q.character_id = auth.uid()`. Nenhum caller legítimo
--   muda: app (app/lib/api/quests.ts:128-140) e MCP só consultam quests do
--   próprio usuário, e para eles o predicado é sempre verdadeiro. Para um
--   uuid alheio a função passa a devolver 0 em vez do total real.

begin;

-- ──────────────────────────────────────────────────────────────────────────
-- (a) start_custom_quest — agora escreve sub_id e sort_order
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.start_custom_quest(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
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
    coalesce((p_payload->>'reward_xp')::int, 0),
    coalesce((p_payload->>'reward_coins')::int, 0),
    coalesce((p_payload->>'allow_partial')::boolean, false)
  )
  returning id into v_quest_id;

  for v_req in select jsonb_array_elements(p_payload->'requirements') loop
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

grant execute on function public.start_custom_quest(jsonb) to authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- (b) sub_stars_progress — só o dono da quest
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.sub_stars_progress(
  p_quest_id uuid,
  p_sub_id   text
) returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(tcs.stars), 0)::integer
  from public.task_completion_sub tcs
  join public.task_completion tc on tc.id = tcs.completion_id
  join public.quest q on q.id = p_quest_id
  where tcs.sub_id = p_sub_id
    and q.character_id = auth.uid()
    and tc.character_id = q.character_id
    and tc.completed_at >= q.started_at
    and tc.completed_at <  q.deadline
$$;

grant execute on function public.sub_stars_progress(uuid, text) to authenticated;

commit;
