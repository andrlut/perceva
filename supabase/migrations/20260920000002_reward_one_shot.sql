-- migration: 20260920000002_reward_one_shot.sql
-- purpose: recompensa de compra única — some da Vault depois de comprada
--
-- affected tables: reward (+is_one_shot), reward_template (+is_one_shot)
-- rpcs:            redeem_reward, redeem_reward_n — recusam a segunda compra de uma única
-- breaking?        no — a coluna nasce false, que é exatamente o comportamento de hoje.
--                  Precisa de OTA junto (o cliente é quem esconde o card da Vault).
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
-- ──────────────────────────────────────────────────────────────────────────
-- POR QUE FLAG POR RECOMPENSA, E NÃO REGRA DE CATEGORIA
--
--   A leitura fácil seria "categoria Bem é sempre única". O catálogo desmente:
--   'Livro novo' e 'Tênis de corrida' são Bem e são recompráveis por desenho.
--   E a prática desmente de novo — a 'Mesa Sensetup' que motivou isto está
--   cadastrada como INDULGÊNCIA, não Bem, então uma lei de categoria não teria
--   pegado justamente o caso que a pediu. Categoria é um proxy ruim pra "acaba
--   quando compra"; quem sabe é quem cadastrou.
--
-- A COMPRA É DERIVADA, NÃO É UM SEGUNDO ESTADO
--
--   Não existe coluna 'já comprei'. Uma recompensa única some quando EXISTE
--   linha em reward_redemption pra ela. Isso sai de graça em três lugares:
--     · vender de volta (sell_reward) apaga a linha, então ela reaparece na
--       Vault sozinha — sem nada pra ressincronizar;
--     · usar (used_at) mantém a linha, então ela continua fora da Vault, que é
--       o certo: a geladeira está na sua casa;
--     · não encosta em is_archived. "Comprei" e "arquivei" são coisas
--       diferentes, e a tela de gerenciar continua listando a recompensa pra
--       edição — só a vitrine esconde.
--
-- POR QUE A RPC TAMBÉM GUARDA
--
--   Esconder o card é UI. A regra real mora aqui: sem o guard, um segundo
--   resgate deixaria duas geladeiras no banco e cobraria duas vezes. Vale o
--   mesmo raciocínio da 20260920000001 — o cliente não é a fronteira.
-- ──────────────────────────────────────────────────────────────────────────

begin;

alter table public.reward
  add column if not exists is_one_shot boolean not null default false;

alter table public.reward_template
  add column if not exists is_one_shot boolean not null default false;

comment on column public.reward.is_one_shot is
  'Compra única: some da vitrine da Vault assim que existe um reward_redemption. '
  'Escolha de quem cadastrou, não da categoria — ver 20260920000002.';

comment on column public.reward_template.is_one_shot is
  'Valor inicial do is_one_shot quando o template é adotado.';

-- Só os três que são inequivocamente uma aquisição que fecha. Fone, teclado,
-- tênis e livro ficam false de propósito: são recompráveis, e é mais barato o
-- usuário ligar a chave num caso do que descobrir que a recompensa sumiu.
update public.reward_template
  set is_one_shot = true
  where id in ('phone', 'appliance', 'dreamitem');

-- ── redeem_reward — guard de compra única ──

create or replace function public.redeem_reward(p_reward_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_reward record;
  v_balance integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_reward
  from public.reward
  where id = p_reward_id and character_id = auth.uid() and is_archived = false;

  if not found then
    raise exception 'Reward not found or not owned by current user';
  end if;

  if v_reward.is_one_shot and exists (
    select 1 from public.reward_redemption
    where reward_id = p_reward_id and character_id = auth.uid()
  ) then
    raise exception 'Reward already acquired' using hint = 'one_shot_owned';
  end if;

  select coins into v_balance from public.character where id = auth.uid();
  if v_balance is null or v_balance < v_reward.cost then
    raise exception 'Insufficient coins (have %, need %)', coalesce(v_balance, 0), v_reward.cost;
  end if;

  update public.character
  set coins = coins - v_reward.cost
  where id = auth.uid();

  insert into public.reward_redemption (reward_id, character_id, cost_paid)
  values (p_reward_id, auth.uid(), v_reward.cost);

  return json_build_object('cost_paid', v_reward.cost);
end;
$fn$;

-- ── redeem_reward_n — mesmo guard, mais o teto de 1 unidade ──

create or replace function public.redeem_reward_n(p_reward_id uuid, p_qty integer)
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
    insert into public.reward_redemption (reward_id, character_id, cost_paid)
    values (p_reward_id, v_uid, v_reward.cost)
    returning id into v_id;
    v_ids := array_append(v_ids, v_id);
  end loop;

  return json_build_object(
    'qty', p_qty,
    'unit_cost', v_reward.cost,
    'total_paid', v_total,
    'redemption_ids', to_jsonb(v_ids)
  );
end;
$fn$;

commit;
