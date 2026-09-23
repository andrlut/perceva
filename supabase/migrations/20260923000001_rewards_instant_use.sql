-- migration: 20260923000001_rewards_instant_use.sql
-- purpose: retire the reward bank. A redemption is a use: paid for and enjoyed
--          in the same act, on the day it happened (today from the Vault, or a
--          past day picked in the calendar). Undo deletes the row and refunds
--          the coins. Rewards now follow the practices pattern — act today,
--          look back in the calendar to undo or to log a day that passed.
--
-- affected tables: reward_redemption (backfill: rows still "banked" get
--                  used_at = redeemed_at; the column stays and is always equal
--                  to redeemed_at from now on)
-- new rpcs:        redeem_reward_n(uuid, integer, timestamptz) — replaces the
--                  (uuid, integer) overload; undo_reward_redemption(uuid)
-- dropped rpcs:    redeem_reward(uuid), use_reward(uuid), unuse_reward(uuid),
--                  sell_reward(uuid), redeem_reward_n(uuid, integer)
-- breaking?        yes for an app bundle older than this release — it ships in
--                  the same PR, and the MCP function never called any of them.
--
-- notes:
--   migrations are write-once; never edit after applying
--   * Why: buy → bank → use → history was three screens and four RPCs for a
--     thing the owner never does — what he buys, he has. The bank also broke
--     the days-since metric (a use on another day read as a second event).
--   * The old (uuid, integer) overload is dropped BEFORE the new one is
--     created: PostgREST refuses an RPC call that matches two overloads, and a
--     call with two named args would match both.
--   * p_at may not be in the future (same guard as complete_task,
--     20260501000007) nor older than 366 days — the calendar never offers
--     more, and a typo should not rewrite last year's ledger.
--   * undo refunds cost_paid (the price at the time), never the reward's
--     current cost, so a price change afterwards cannot mint or burn coins.
--   * reward_redemption_bank_idx (partial on used_at is null) becomes empty
--     and stays; dropping an index is a separate, reversible decision.

begin;

-- ─── Backfill: whatever was banked was used when it was bought ─────────────
update public.reward_redemption
  set used_at = redeemed_at
  where used_at is null;

-- ─── Drop the bank-era RPCs ────────────────────────────────────────────────
drop function if exists public.redeem_reward(uuid);
drop function if exists public.use_reward(uuid);
drop function if exists public.unuse_reward(uuid);
drop function if exists public.sell_reward(uuid);
drop function if exists public.redeem_reward_n(uuid, integer);

-- ─── RPC: redeem_reward_n(p_reward_id, p_qty, p_at) ────────────────────────
-- Pays for and uses p_qty units of a reward at p_at (default now). One row
-- per unit, both timestamps stamped with p_at. Same one-shot guards as before.
create or replace function public.redeem_reward_n(
  p_reward_id uuid,
  p_qty integer,
  p_at timestamptz default now()
)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_reward record;
  v_balance integer;
  v_total integer;
  v_uid uuid := auth.uid();
  v_at timestamptz := coalesce(p_at, now());
  v_ids uuid[] := array[]::uuid[];
  v_id uuid;
  i integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_qty is null or p_qty < 1 then
    raise exception 'Quantity must be at least 1';
  end if;
  if p_qty > 50 then
    raise exception 'Quantity capped at 50';
  end if;

  if v_at > now() + interval '5 minutes' then
    raise exception 'Redemption timestamp cannot be in the future';
  end if;
  if v_at < now() - interval '366 days' then
    raise exception 'Redemption timestamp is too far in the past';
  end if;

  select * into v_reward
  from public.reward
  where id = p_reward_id
    and character_id = v_uid
    and is_archived = false;

  if not found then
    raise exception 'Reward not found or not owned by current user';
  end if;

  if v_reward.is_one_shot then
    if p_qty > 1 then
      raise exception 'One-shot reward: single unit only'
        using hint = 'one_shot_single_unit';
    end if;
    if exists (
      select 1 from public.reward_redemption
      where reward_id = p_reward_id and character_id = v_uid
    ) then
      raise exception 'Reward already acquired' using hint = 'one_shot_owned';
    end if;
  end if;

  v_total := v_reward.cost * p_qty;

  select coins into v_balance from public.character where id = v_uid;
  if v_balance is null or v_balance < v_total then
    raise exception 'Insufficient coins (have %, need %)',
      coalesce(v_balance, 0), v_total;
  end if;

  update public.character
    set coins = coins - v_total
    where id = v_uid;

  for i in 1 .. p_qty loop
    insert into public.reward_redemption
      (reward_id, character_id, cost_paid, redeemed_at, used_at)
    values (p_reward_id, v_uid, v_reward.cost, v_at, v_at)
    returning id into v_id;
    v_ids := array_append(v_ids, v_id);
  end loop;

  return json_build_object(
    'qty', p_qty,
    'unit_cost', v_reward.cost,
    'total_paid', v_total,
    'redeemed_at', v_at,
    'redemption_ids', to_jsonb(v_ids)
  );
end;
$fn$;

revoke all on function public.redeem_reward_n(uuid, integer, timestamptz) from public;
grant execute on function public.redeem_reward_n(uuid, integer, timestamptz) to authenticated;

-- ─── RPC: undo_reward_redemption(p_redemption_id) ──────────────────────────
-- The one way back: refund what was paid, delete the row. Works on any
-- redemption the caller owns — there is no "used" state to protect any more.
create or replace function public.undo_reward_redemption(p_redemption_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_row record;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select id, character_id, cost_paid
    into v_row
    from public.reward_redemption
    where id = p_redemption_id
    for update;

  if not found then
    raise exception 'Redemption not found';
  end if;
  if v_row.character_id <> v_uid then
    raise exception 'Not authorized';
  end if;

  update public.character
    set coins = coins + v_row.cost_paid
    where id = v_uid;

  delete from public.reward_redemption where id = p_redemption_id;

  return json_build_object('refund', v_row.cost_paid);
end;
$fn$;

revoke all on function public.undo_reward_redemption(uuid) from public;
grant execute on function public.undo_reward_redemption(uuid) to authenticated;

commit;
