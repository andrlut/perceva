-- migration: 20261105000001_partner_campaign_7_days.sql
-- purpose: Programa Paker Health, segunda versão (decisão do mantenedor,
--          2026-11-05). A sequência cai de 28 para 7 dias seguidos e a
--          recompensa vira DUAS: 30% de desconto no plano anual do Perceva
--          Premium e um cupom de desconto no site da Paker Health. As duas
--          só aparecem NO APP, depois dos 7 dias (a landing e o folheto não
--          mostram código nenhum). Os códigos ainda não existem: entram
--          depois pelo Studio, e até lá a tela diz que estão a caminho.
--
--   1. partner_campaign: streak_goal 28 → 7 e max_skips 4 → 1 (um pulo liga
--      a sequência dentro dos 7 dias); pitch e recompensa reescritos pras
--      duas recompensas; colunas novas perceva_reward_pt/_en, o texto do
--      desconto do Premium (NULL = campanha sem desconto do Perceva).
--      reward_pt/_en seguem sendo a recompensa do PARCEIRO.
--   2. partner_campaign_secret.perceva_code: o código do desconto do
--      Premium, ao lado do coupon_code do parceiro. Mesma regra: sem acesso
--      do cliente, só volta pela RPC depois do claim.
--   3. Quem já fez o claim continua vendo a campanha depois que ela acaba
--      ou é pausada (ends_at / is_active pelo Studio): os códigos entram
--      depois, e o app é o único lugar por onde eles chegam. A policy de
--      leitura de partner_campaign e o partner_campaign_status passam a
--      aceitar "janela ativa OU claim feito". Entrar e fazer o claim seguem
--      presos à janela ativa.
--   4. _partner_streak: a régua de "feito no dia d" aperta. Com 28 dias, a
--      faixa d-1..d+1 (data UTC de created_at) somada ao p_today até
--      current_date + 1 dava uns 2 dias de graça (~7% do alvo); com 7 dias
--      seriam 29% (a sequência fechava em 5 dias reais). Agora a conclusão
--      (e o pulo) do dia d só conta se foi inserida no dia d ou no d+1 no
--      fuso de São Paulo, a mesma constante do log_mood do MCP.
--   5. partner_campaign_status: mesma assinatura da 20261104000009, duas
--      chaves novas no jsonb — perceva_code_ready e perceva_code (só com
--      claim feito e código liberado) — e a leitura da campanha do item 3.
--      Um claim só vale pelas duas recompensas.
--
-- affected tables: partner_campaign (+perceva_reward_pt, +perceva_reward_en;
--                  linha paker-health reescrita; policy de leitura
--                  partner_campaign_read_active → partner_campaign_read_visible),
--                  partner_campaign_secret (+perceva_code), task_completion
--                  (só o comentário de created_at)
-- changed rpcs:    partner_campaign_status(text, date) — +perceva_code_ready,
--                  +perceva_code no objeto devolvido; responde pra quem já fez
--                  o claim mesmo fora da janela;
--                  _partner_streak(text, uuid, date) (interno) — janela de
--                  created_at em São Paulo, d..d+1
-- unchanged rpcs:  claim_partner_coupon (lê streak_goal ao vivo e devolve
--                  partner_campaign_status, então já sai com o alvo de 7 e
--                  com as chaves novas; segue exigindo a janela ativa) e
--                  join_partner_campaign
-- breaking?        no — o objeto do status só ganha chaves; as colunas novas
--                  são nulláveis; a policy só alarga (quem já via continua
--                  vendo).
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   ORDEM DE SUBIDA: esta migration vai pra cloud ANTES do merge/OTA do
--     app. O cliente novo pede perceva_reward_pt/_en no select de
--     partner_campaign, e o PostgREST responde 400 sem elas (o cartão da
--     Home e a tela da campanha somem calados)
--   escrita pelo editor (nunca heredoc): PT com acento em comentários
--   sem migração de dados: a campanha entrou no ar em 2026-11-04 (09), e
--     _partner_streak nunca olha antes de starts_at, então ninguém pode ter
--     pegado o cupom com o alvo de 28. A guarda avisa (notice) quantos
--     claims existem, por garantia; claim já feito continua valendo pelas
--     duas recompensas
--   os códigos entram pelo Studio, quando cada um estiver pronto:
--     update public.partner_campaign_secret
--        set perceva_code = '<código do Premium>'
--      where campaign_id = 'paker-health';
--     update public.partner_campaign_secret
--        set coupon_code = '<código da Paker Health>'
--      where campaign_id = 'paker-health';
--   DECIDIR ANTES DE PREENCHER perceva_code: hoje ele é UM código pra todo
--     mundo, e o portão do banco (o código só volta depois do claim) só
--     segura até o primeiro claim. Quem pegar pode postar o código num grupo
--     e qualquer um resgata sem o programa. O código personalizado de oferta
--     da App Store e o código promocional personalizado da Play têm teto de
--     resgates: resgate vazado come o teto, e quem fechar os 7 dias depois
--     vê um código que a loja recusa. E uma loja não aceita o código da
--     outra (com iOS no programa, são dois códigos). Saídas, cada uma em
--     outra migration:
--       (a) lote com um código por pessoa: tabela partner_campaign_code
--           (code, character_id, assigned_at); claim_partner_coupon pega um
--           livre com FOR UPDATE SKIP LOCKED e o status devolve só o da
--           pessoa;
--       (b) nenhum código: a oferta anual com desconto vai pelo servidor
--           (offering/oferta do RevenueCat pra quem tem linha em
--           partner_coupon_claim).
--     Se ficar o código único, configurar teto e validade na loja já
--     contando com vazamento. O teste manual
--     (supabase/tests/partner_campaign_streak.sql) cobre o portão: nulo
--     antes do claim, o código depois.
--   a régua de "feito no dia d" (item 4): conclusão com
--     completed_local_date = d inserida em d ou d+1 no fuso de São Paulo
--     (created_at at time zone 'America/Sao_Paulo'). Registrar tarde da
--     noite ou na manhã seguinte conta; marcar amanhã hoje, não; marcar
--     semanas depois, também não. O mesmo vale pro pulo (skipped_for = d).
--     Limite conhecido: o "ontem" do primeiro dia ainda vale, então o
--     mínimo real pra fechar 7 dias é 6 dias (entrar no dia D marcando
--     D-1 e D). Custo: quem está a leste de São Paulo e marca nas primeiras
--     horas do próprio dia (Europa de madrugada, Ásia de manhã) não conta;
--     o público do programa é brasileiro. Os fusos do Brasil a oeste de
--     São Paulo (Manaus, Acre) ganham no máximo 1-2 h de "amanhã" no fim
--     da noite.

begin;

-- ─── 1. Campanha: 7 dias, duas recompensas ──────────────────────────────────

alter table public.partner_campaign
  add column if not exists perceva_reward_pt text,
  add column if not exists perceva_reward_en text;

comment on column public.partner_campaign.perceva_reward_pt is
  'Texto do desconto do Perceva Premium que a campanha dá junto com a recompensa do parceiro (reward_pt). NULL = campanha sem desconto do Perceva. O código mora em partner_campaign_secret.perceva_code.';
comment on column public.partner_campaign.perceva_reward_en is
  'en de perceva_reward_pt.';

comment on table public.partner_campaign is
  'Campanha de parceiro (evento patrocinado): entrar, adotar a prática template_id e manter streak_goal dias seguidos (max_skips pulos ligam a sequência sem contar) libera as recompensas: a do parceiro (reward_pt/_en) e, quando há, o desconto do Perceva Premium (perceva_reward_pt/_en). Um claim vale pelas duas. O cliente vê as campanhas dentro da janela ativa e, fora dela, só a que já fez o claim (os códigos chegam depois). Escrita só pelo Studio.';

update public.partner_campaign
set streak_goal       = 7,
    max_skips         = 1,
    -- sem o número de dias: o alvo é streak_goal, e a UI já o mostra
    pitch_pt          = 'Tome o seu suplemento todo dia e libere dois descontos: no plano anual do Perceva Premium e no site da Paker Health.',
    pitch_en          = 'Take your supplement every day and unlock two discounts: on the annual Perceva Premium plan and on the Paker Health website.',
    reward_pt         = 'Cupom de desconto no site da Paker Health',
    reward_en         = 'Discount coupon on the Paker Health website',
    perceva_reward_pt = '30% de desconto no plano anual do Perceva Premium',
    perceva_reward_en = '30% off the annual Perceva Premium plan'
where id = 'paker-health';

-- ─── 2. O código do Premium, ao lado do código do parceiro ──────────────────

alter table public.partner_campaign_secret
  add column if not exists perceva_code text;

comment on column public.partner_campaign_secret.perceva_code is
  'Código do desconto do Perceva Premium da campanha (hoje um só pra todo mundo; ver as notas da 20261105000001 antes de preencher). Preenchido pelo Studio; só volta pra quem já fez o claim (partner_campaign_status).';

comment on table public.partner_campaign_secret is
  'Os códigos da campanha: coupon_code (do parceiro) e perceva_code (do Perceva Premium). Sem policy e sem grant pro cliente: só as funções SECURITY DEFINER leem, e cada código só volta pra quem já fez o claim e depois de liberado (partner_campaign_status). Preenchido pelo Studio.';

-- a tabela continua sem policy (RLS ligada desde a 09); coluna nova não
-- ganha grant sozinha, mas o revoke fica reafirmado
alter table public.partner_campaign_secret enable row level security;
revoke all on public.partner_campaign_secret from public, anon, authenticated;

-- ─── 3. Quem fez o claim continua vendo a campanha ──────────────────────────

-- A policy da 09 só deixava passar a janela ativa: com ends_at no passado ou
-- is_active = false, o cartão da Home e a tela da campanha sumiam até pra
-- quem já tinha garantido as recompensas e ainda esperava um código. Agora:
-- janela ativa OU claim da própria pessoa. A subconsulta passa pelo RLS de
-- partner_coupon_claim (self-select), que diz a mesma coisa.
drop policy if exists partner_campaign_read_active on public.partner_campaign;
drop policy if exists partner_campaign_read_visible on public.partner_campaign;
create policy partner_campaign_read_visible on public.partner_campaign
  for select to authenticated
  using (
    (is_active and starts_at <= now() and (ends_at is null or ends_at > now()))
    or exists (
      select 1
      from public.partner_coupon_claim cl
      where cl.campaign_id = partner_campaign.id
        and cl.character_id = (select auth.uid())
    )
  );

-- ─── 4. A régua do dia, no fuso de São Paulo ────────────────────────────────

-- Igual à 20261104000009 (mesma assinatura, mesma caminhada), menos a faixa
-- de created_at: era a data UTC entre d-1 e d+1, agora é a data em São
-- Paulo entre d e d+1 (ver notas). Interno: sem EXECUTE pro cliente
-- (p_character é qualquer pessoa); só status e claim chamam, com auth.uid().
create or replace function public._partner_streak(
  p_campaign_id text,
  p_character   uuid,
  p_today       date,
  out streak_days integer,
  out skips_used  integer,
  out done_today  boolean
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_goal      integer;
  v_max_skips integer;
  v_template  text;
  v_from      date;
  v_done      date[];
  v_skipped   date[];
  v_day       date;
  v_pending   integer := 0;
begin
  streak_days := 0;
  skips_used  := 0;
  done_today  := false;

  -- A caminhada nunca precisa de mais que hoje (neutro) + goal dias feitos
  -- + max_skips pulos: goal + max_skips + 1 dias, cortados em starts_at.
  select c.streak_goal, c.max_skips, c.template_id,
         greatest(p_today - (c.streak_goal + c.max_skips)::integer,
                  (c.starts_at at time zone 'UTC')::date)
    into v_goal, v_max_skips, v_template, v_from
  from public.partner_campaign c
  where c.id = p_campaign_id;
  if not found or p_character is null or p_today is null or v_from > p_today then
    return;
  end if;

  -- feito no dia d = inserido em d ou d+1 em São Paulo: tarde da noite e a
  -- manhã seguinte contam; amanhã marcado hoje e semanas depois, não
  select coalesce(array_agg(distinct tc.completed_local_date), '{}'::date[])
    into v_done
  from public.task_completion tc
  join public.task t on t.id = tc.task_id
  where tc.character_id = p_character
    and t.character_id = p_character
    and coalesce(t.origin_template_id, t.template_id) = v_template
    and tc.completed_local_date between v_from and p_today
    and (tc.created_at at time zone 'America/Sao_Paulo')::date
        between tc.completed_local_date and tc.completed_local_date + 1;

  select coalesce(array_agg(distinct s.skipped_for), '{}'::date[])
    into v_skipped
  from public.task_skip s
  join public.task t on t.id = s.task_id
  where s.character_id = p_character
    and t.character_id = p_character
    and coalesce(t.origin_template_id, t.template_id) = v_template
    and s.skipped_for between v_from and p_today
    and (s.created_at at time zone 'America/Sao_Paulo')::date
        between s.skipped_for and s.skipped_for + 1;

  done_today := p_today = any (v_done);

  v_day := p_today;
  while v_day >= v_from loop
    if v_day = any (v_done) then
      streak_days := streak_days + 1;
      skips_used := skips_used + v_pending;
      v_pending := 0;
      exit when streak_days >= v_goal;
    elsif v_day = p_today then
      null;  -- hoje ainda sem conclusão: neutro
    elsif v_day = any (v_skipped) and skips_used + v_pending < v_max_skips then
      v_pending := v_pending + 1;
    else
      exit;
    end if;
    v_day := v_day - 1;
  end loop;
end
$fn$;

revoke execute on function public._partner_streak(text, uuid, date) from public, anon, authenticated;

comment on function public._partner_streak(text, uuid, date) is
  'Interno (sem EXECUTE pro cliente): sequência de dias da campanha pra uma pessoa, terminando em p_today. Dia d conta quando a conclusão (ou o pulo) foi inserida em d ou d+1 no fuso de São Paulo. Usado por partner_campaign_status e claim_partner_coupon.';

comment on column public.task_completion.created_at is
  'Hora do servidor em que a conclusão foi inserida (now(), nunca o cliente). completed_at/completed_local_date são do cliente; a sequência das campanhas só conta conclusões inseridas no dia local ou no seguinte, no fuso de São Paulo (_partner_streak).';

-- ─── 5. Status com o código do Premium ──────────────────────────────────────

-- Igual à 20261104000009 (mesma assinatura, mesmas chaves, mesmas regras),
-- mais perceva_code_ready / perceva_code e a leitura da campanha do item 3.
-- Os dois códigos seguem a mesma regra: *_ready diz se já foi liberado (pra
-- tela dizer a verdade antes do claim), e o código em si só volta depois do
-- claim.
create or replace function public.partner_campaign_status(
  p_campaign_id text,
  p_today       date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid          uuid := auth.uid();
  v_campaign     public.partner_campaign%rowtype;
  v_joined_at    timestamptz;
  v_task_id      uuid;
  v_streak       integer;
  v_skips        integer;
  v_done_today   boolean;
  v_claimed_at   timestamptz;
  v_code         text;
  v_perceva_code text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_today is null or p_today < current_date - 1 or p_today > current_date + 1 then
    raise exception 'invalid_local_date' using detail = coalesce(p_today::text, 'null');
  end if;

  select cl.claimed_at into v_claimed_at
  from public.partner_coupon_claim cl
  where cl.campaign_id = p_campaign_id and cl.character_id = v_uid;

  -- quem já fez o claim lê a campanha fora da janela (os códigos chegam
  -- depois, e só por aqui); pra todo o resto, só a janela ativa
  select * into v_campaign
  from public.partner_campaign c
  where c.id = p_campaign_id
    and (
      v_claimed_at is not null
      or (c.is_active
          and c.starts_at <= now()
          and (c.ends_at is null or c.ends_at > now()))
    );
  if not found then
    raise exception 'campaign_not_found' using detail = coalesce(p_campaign_id, 'null');
  end if;

  select m.joined_at into v_joined_at
  from public.partner_campaign_member m
  where m.campaign_id = v_campaign.id and m.character_id = v_uid;

  -- a prática da campanha mesmo depois de editada (origem, não o vínculo)
  select t.id into v_task_id
  from public.task t
  where t.character_id = v_uid
    and coalesce(t.origin_template_id, t.template_id) = v_campaign.template_id
    and t.is_archived = false
  order by t.created_at desc
  limit 1;

  select s.streak_days, s.skips_used, s.done_today
    into v_streak, v_skips, v_done_today
  from public._partner_streak(v_campaign.id, v_uid, p_today) s;

  select nullif(btrim(sec.coupon_code), ''),
         nullif(btrim(sec.perceva_code), '')
    into v_code, v_perceva_code
  from public.partner_campaign_secret sec
  where sec.campaign_id = v_campaign.id;

  return jsonb_build_object(
    'campaign_id',        v_campaign.id,
    'member',             v_joined_at is not null,
    'joined_at',          v_joined_at,
    'adopted',            v_task_id is not null,
    'task_id',            v_task_id,
    'done_today',         coalesce(v_done_today, false),
    'streak_days',        coalesce(v_streak, 0),
    'skips_used',         coalesce(v_skips, 0),
    'max_skips',          v_campaign.max_skips,
    'goal',               v_campaign.streak_goal,
    'unlocked',           v_claimed_at is not null or coalesce(v_streak, 0) >= v_campaign.streak_goal,
    'claimed',            v_claimed_at is not null,
    'claimed_at',         v_claimed_at,
    'coupon_ready',       v_code is not null,
    'coupon_code',        case when v_claimed_at is not null then v_code end,
    'perceva_code_ready', v_perceva_code is not null,
    'perceva_code',       case when v_claimed_at is not null then v_perceva_code end
  );
end
$fn$;

revoke execute on function public.partner_campaign_status(text, date) from public, anon;
grant execute on function public.partner_campaign_status(text, date) to authenticated;

comment on function public.partner_campaign_status(text, date) is
  'Campanha de parceiro: estado da pessoa (entrou, adotou a prática, sequência, pulos, recompensas). p_today = dia local (current_date ± 1). Janela ativa, ou fora dela pra quem já fez o claim. coupon_code (parceiro) e perceva_code (Premium) só depois do claim; coupon_ready / perceva_code_ready dizem se cada um já foi liberado.';

-- ─── 6. Logo do parceiro no material ────────────────────────────────────────

-- O logo da Paker no canto superior direito da capa e do topo do material
-- (pedido do André: "só pra identificar que é deles"). É uma camada no app
-- (components/learning/SponsorLogo), não queimada na imagem: o topo da capa
-- é do título. O arquivo já está no bucket (learning-media, imutável).
update public.learning_material
set sponsor = sponsor || '{"logo_path": "partners/paker-health/logo.386f5d72.webp"}'::jsonb
where slug = 'paker-health-energia-pele-forca'
  and sponsor is not null;

-- ─── guarda ─────────────────────────────────────────────────────────────────

do $guard$
declare
  v_missing text[] := '{}';
  v_claims  integer;
begin
  if not exists (
    select 1 from public.partner_campaign
    where id = 'paker-health'
      and streak_goal = 7
      and max_skips = 1
      and coalesce(perceva_reward_pt, '') <> ''
      and coalesce(perceva_reward_en, '') <> ''
  ) then
    v_missing := array_append(v_missing, 'partner_campaign paker-health com 7 dias, 1 pulo e o desconto do Premium');
  end if;
  if (
    select count(*) from information_schema.columns
    where table_schema = 'public'
      and table_name = 'partner_campaign'
      and column_name in ('perceva_reward_pt', 'perceva_reward_en')
  ) <> 2 then
    v_missing := array_append(v_missing, 'partner_campaign.perceva_reward_pt/perceva_reward_en');
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'partner_campaign_secret'
      and column_name = 'perceva_code'
  ) then
    v_missing := array_append(v_missing, 'partner_campaign_secret.perceva_code');
  end if;
  if has_table_privilege('authenticated', 'public.partner_campaign_secret', 'select')
     or has_table_privilege('anon', 'public.partner_campaign_secret', 'select') then
    v_missing := array_append(v_missing, 'revoke de partner_campaign_secret (cliente ainda lê)');
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'partner_campaign'
      and policyname = 'partner_campaign_read_active'
  ) or not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'partner_campaign'
      and policyname = 'partner_campaign_read_visible'
      and qual like '%partner_coupon_claim%'
  ) then
    v_missing := array_append(v_missing, 'policy partner_campaign_read_visible (janela ativa ou claim)');
  end if;
  if position('America/Sao_Paulo' in
       pg_get_functiondef('public._partner_streak(text, uuid, date)'::regprocedure)) = 0 then
    v_missing := array_append(v_missing, '_partner_streak com a janela em São Paulo');
  end if;
  if has_function_privilege('authenticated', 'public._partner_streak(text, uuid, date)', 'execute')
     or has_function_privilege('anon', 'public._partner_streak(text, uuid, date)', 'execute') then
    v_missing := array_append(v_missing, 'revoke de _partner_streak (cliente ainda executa)');
  end if;
  if not exists (
    select 1 from public.learning_material
    where slug = 'paker-health-energia-pele-forca'
      and sponsor->>'logo_path' = 'partners/paker-health/logo.386f5d72.webp'
  ) then
    v_missing := array_append(v_missing, 'learning_material.sponsor.logo_path da Paker');
  end if;
  if position('perceva_code_ready' in
       pg_get_functiondef('public.partner_campaign_status(text, date)'::regprocedure)) = 0 then
    v_missing := array_append(v_missing, 'partner_campaign_status com perceva_code_ready');
  end if;

  if array_length(v_missing, 1) > 0 then
    raise exception 'partner_campaign_7_days: faltou %', array_to_string(v_missing, '; ');
  end if;

  select count(*) into v_claims
  from public.partner_coupon_claim
  where campaign_id = 'paker-health';
  raise notice 'partner_campaign_7_days: paker-health com 7 dias e duas recompensas (códigos ainda sem valor); claims existentes: %', v_claims;
end
$guard$;

commit;
