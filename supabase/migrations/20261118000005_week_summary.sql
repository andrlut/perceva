-- migration: 20261118000005_week_summary.sql
-- purpose: "Resumo da semana" (frente 4, aprovada pelo André em 18/11/2026).
--          Toda segunda a pessoa vê a semana que fechou (segunda a domingo,
--          no fuso dela) em números exatos, sem IA, e o Premium ganha 3
--          observações da IA + 1 sugestão de prática.
--
--   1. week_summary(p_week_start date, p_tz text) — a leitura da semana num
--      pedido só, SECURITY INVOKER + STABLE: roda como quem chama, então a RLS
--      self-only de cada tabela é a fronteira (mesmo padrão das mcp_*).
--      Blocos: práticas por área (semana × anterior × média das 4 anteriores),
--      Dedicação (XP), dias fechados (regra do DaySeal), moedas ganhas e
--      gastas, recompensas resgatadas com DIAS desde o último resgate, humor
--      (média, melhor e pior dia, tags) e, com o módulo `vida` ligado, quantas
--      práticas caíram nas áreas das cenas de "A vida que eu quero".
--   2. week_insight — o cache das observações da IA: uma linha por pessoa e
--      semana, só com o TEXTO GERADO (nunca as notas que entraram no pedido).
--      Quem escreve é a Edge Function perceva-ai (service_role), depois de
--      passar pelo ai_begin/ai_settle; o app só lê e pode apagar (LGPD).
--
--   3. app_config `ai`: consent_version 1 → 2. O texto do aceite da IA passa
--      a cobrir o Resumo da semana (os números, as anotações do humor e as
--      recompensas da semana vão ao modelo; as observações ficam guardadas),
--      e quem aceitou o texto 1 vê a tela de novo. O app sobe
--      AI_CONSENT_VERSION pra 2 no mesmo PR (regra de 20261118000003).
--
-- affected tables: week_insight (nova), app_config (linha ai: consent_version)
-- new rpcs:        week_summary(date, text) — authenticated
-- breaking?        no — função e tabela novas. O aceite antigo (versão 1)
--                  deixa de valer: o app com o texto 1 mostra "atualize o
--                  app"; o app novo pede o aceite de novo.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
--   SEMANA = segunda a domingo (decisão do André, 18/11). p_week_start pode
--   ser qualquer dia: a função normaliza pra segunda da semana ISO dele.
--
--   FUSO: não existe fuso guardado por pessoa (character.locale também não
--   existe). O app manda o fuso do aparelho (Intl); a função só aceita um nome
--   que o Postgres conheça e cai em America/Sao_Paulo (a constante do
--   perceva-mcp) no resto. Ele só serve pra três leituras que nascem como
--   instante: "hoje", o dia local do resgate (redeemed_at) e o dia em que a
--   prática nasceu (created_at). Práticas e humor já são gravados com o dia
--   local (completed_local_date, skipped_for, logged_for).
--
--   DIAS FECHADOS = a regra do DaySeal (app/components/DaySeal.tsx), sobre o
--   predicado único de app/lib/recurrence.ts (isOpenOnDay), portado como o
--   get_day_plan do conector já fez:
--     aberta(D) ⟺ agendada(D) ∧ zero conclusões em D ∧ sem pulo em D
--   e a prática não pode estar aberta antes do dia em que nasceu. Um dia sem
--   nada aberto é: complete (feitas, nenhum pulo), cleared (feitas + pulos),
--   settled (só pulos) — os três FECHAM o dia — ou none (nada agendado, sem
--   selo: uma terça vazia não tinha contrato pra fechar). Como no calendário,
--   só práticas ativas entram no "aberta".
--
--   MÉDIA DAS 4 SEMANAS = das 4 semanas ANTERIORES à escolhida, só das que a
--   conta já existia (avg_weeks diz quantas entraram). Contagens: média das
--   somas semanais. Humor: média dos dias registrados nas 4 semanas.
--
--   RECOMPENSA também é penalidade (o André paga moedas pra fumar/beber): por
--   recompensa resgatada na semana vêm os DIAS desde o último resgate (hoje),
--   os dias sem antes do 1º resgate da semana e o recorde, como o get_rewards
--   do conector. O texto da tela não comemora resgate.
--
--   MOEDAS GANHAS = das práticas (task_completion.coins_granted), a mesma
--   régua do conector; gastas = resgates (cost_paid) pelo dia local.

begin;

-- ─── 1. week_summary ─────────────────────────────────────────────────────────

create or replace function public.week_summary(
  p_week_start date,
  p_tz text default 'America/Sao_Paulo'
) returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid          uuid := auth.uid();
  v_tz           text := 'America/Sao_Paulo';
  v_today        date;
  v_start        date;   -- segunda
  v_end          date;   -- domingo
  v_hist         date;   -- segunda de 4 semanas antes
  v_last         date;   -- último dia já vivido da semana
  v_first_week   date;   -- segunda da semana em que a conta nasceu
  v_n_hist       int;    -- quantas das 4 semanas anteriores a conta viveu
  v_has_prev     boolean;
  v_premium      boolean := false;
  v_vida         boolean := false;
  v_practices    jsonb;
  v_days         jsonb;
  v_coins        jsonb;
  v_rewards      jsonb;
  v_mood         jsonb;
  v_life         jsonb := null;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_week_start is null then
    raise exception 'week_start is required' using errcode = '22023';
  end if;

  -- O fuso do aparelho é um palpite: nome desconhecido não derruba a leitura.
  if p_tz is not null and char_length(p_tz) between 1 and 64 then
    begin
      perform now() at time zone p_tz;
      v_tz := p_tz;
    exception when others then
      v_tz := 'America/Sao_Paulo';
    end;
  end if;

  v_today := (now() at time zone v_tz)::date;
  v_start := p_week_start - (extract(isodow from p_week_start)::int - 1);
  v_end   := v_start + 6;
  v_hist  := v_start - 28;
  v_last  := least(v_end, v_today);

  if v_start > v_today then
    raise exception 'week_in_future' using errcode = '22023';
  end if;

  select (p.created_at at time zone v_tz)::date,
         p.subscription_tier = 'premium',
         coalesce(p.modules -> 'vida' = 'true'::jsonb, false)
    into v_first_week, v_premium, v_vida
    from public.profile p
   where p.id = v_uid;

  v_first_week := coalesce(v_first_week, v_start);
  v_first_week := v_first_week - (extract(isodow from v_first_week)::int - 1);
  -- Semanas inteiras entre a 1ª semana da conta e a escolhida, até 4.
  v_n_hist   := greatest(0, least(4, (v_start - v_first_week) / 7));
  v_has_prev := v_n_hist >= 1;

  -- ── Práticas, Dedicação e moedas ganhas, semana a semana ─────────────────
  -- wk = 0..3 são as 4 semanas anteriores (3 = a anterior), 4 = a escolhida.
  with comp as (
    select tc.id, tc.completed_local_date as d,
           coalesce(tc.xp_granted, 0) as xp,
           coalesce(tc.coins_granted, 0) as coins,
           (tc.completed_local_date - v_hist) / 7 as wk
      from public.task_completion tc
     where tc.character_id = v_uid
       and tc.completed_local_date between v_hist and v_end
  ),
  wk_tot as (
    select c.wk, count(*) as n, sum(c.xp) as xp, sum(c.coins) as coins,
           count(distinct c.d) as active_days
      from comp c group by c.wk
  ),
  -- Uma conta por (conclusão × área distinta), como as pílulas do DaySeal.
  comp_dim as (
    select distinct c.id, c.wk, ds.dimension_id
      from comp c
      join public.task_completion_sub tcs on tcs.completion_id = c.id
      join public.dimension_sub ds on ds.id = tcs.sub_id
  ),
  dim_n as (
    select cd.wk, cd.dimension_id, count(*) as n
      from comp_dim cd group by cd.wk, cd.dimension_id
  ),
  dim_xp as (
    select c.wk, ds.dimension_id, sum(tcs.xp_granted) as xp
      from comp c
      join public.task_completion_sub tcs on tcs.completion_id = c.id
      join public.dimension_sub ds on ds.id = tcs.sub_id
     group by c.wk, ds.dimension_id
  )
  select jsonb_build_object(
    'completions', jsonb_build_object(
      'this', coalesce((select n from wk_tot where wk = 4), 0),
      'prev', case when v_has_prev then coalesce((select n from wk_tot where wk = 3), 0) end,
      'avg4', case when v_n_hist > 0 then round(coalesce((
                select sum(n) from wk_tot where wk between 4 - v_n_hist and 3), 0)::numeric / v_n_hist, 1) end
    ),
    'active_days', jsonb_build_object(
      'this', coalesce((select active_days from wk_tot where wk = 4), 0),
      'prev', case when v_has_prev then coalesce((select active_days from wk_tot where wk = 3), 0) end,
      'avg4', case when v_n_hist > 0 then round(coalesce((
                select sum(active_days) from wk_tot where wk between 4 - v_n_hist and 3), 0)::numeric / v_n_hist, 1) end
    ),
    'xp', jsonb_build_object(
      'this', coalesce((select xp from wk_tot where wk = 4), 0),
      'prev', case when v_has_prev then coalesce((select xp from wk_tot where wk = 3), 0) end,
      'avg4', case when v_n_hist > 0 then round(coalesce((
                select sum(xp) from wk_tot where wk between 4 - v_n_hist and 3), 0)::numeric / v_n_hist, 1) end
    ),
    'coins_earned', jsonb_build_object(
      'this', coalesce((select coins from wk_tot where wk = 4), 0),
      'prev', case when v_has_prev then coalesce((select coins from wk_tot where wk = 3), 0) end,
      'avg4', case when v_n_hist > 0 then round(coalesce((
                select sum(coins) from wk_tot where wk between 4 - v_n_hist and 3), 0)::numeric / v_n_hist, 1) end
    ),
    'by_dimension', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'dimension_id', d.id,
        'completions', jsonb_build_object(
          'this', coalesce((select n from dim_n where wk = 4 and dimension_id = d.id), 0),
          'prev', case when v_has_prev then coalesce((select n from dim_n where wk = 3 and dimension_id = d.id), 0) end,
          'avg4', case when v_n_hist > 0 then round(coalesce((
                    select sum(n) from dim_n where wk between 4 - v_n_hist and 3 and dimension_id = d.id), 0)::numeric / v_n_hist, 1) end
        ),
        'xp', jsonb_build_object(
          'this', coalesce((select xp from dim_xp where wk = 4 and dimension_id = d.id), 0),
          'prev', case when v_has_prev then coalesce((select xp from dim_xp where wk = 3 and dimension_id = d.id), 0) end,
          'avg4', case when v_n_hist > 0 then round(coalesce((
                    select sum(xp) from dim_xp where wk between 4 - v_n_hist and 3 and dimension_id = d.id), 0)::numeric / v_n_hist, 1) end
        )
      ) order by d.sort_order), '[]'::jsonb)
      from public.dimension d
    ),
    -- Conclusões da semana sem área (prática só de moedas).
    'coins_only', (
      select count(*) from comp c
       where c.wk = 4
         and not exists (select 1 from public.task_completion_sub tcs where tcs.completion_id = c.id)
    )
  )
  into v_practices;

  -- ── Dias fechados (DaySeal) ──────────────────────────────────────────────
  with days as (
    select g::date as d, (g::date - v_hist) / 7 as wk
      from generate_series(greatest(v_hist, v_first_week), v_last, interval '1 day') as g
  ),
  tasks as (
    select t.id, t.recurrence, (t.created_at at time zone v_tz)::date as since
      from public.task t
     where t.character_id = v_uid and not t.is_archived
  ),
  done as (
    select tc.completed_local_date as d, count(*) as n
      from public.task_completion tc
     where tc.character_id = v_uid
       and tc.completed_local_date between v_hist and v_end
     group by tc.completed_local_date
  ),
  skipped as (
    select s.skipped_for as d, count(*) as n
      from public.task_skip s
      join public.task t on t.id = s.task_id
     where s.character_id = v_uid
       and s.skipped_for between v_hist and v_end
     group by s.skipped_for
  ),
  open_n as (
    select dd.d, count(*) as n
      from days dd
      join tasks t on t.since <= dd.d
     where not exists (select 1 from public.task_completion tc
                        where tc.task_id = t.id and tc.completed_local_date = dd.d)
       and not exists (select 1 from public.task_skip s
                        where s.task_id = t.id and s.skipped_for = dd.d)
       and (case coalesce(t.recurrence ->> 'type', 'daily')
              when 'weekly' then
                jsonb_typeof(t.recurrence -> 'days') = 'array'
                and (t.recurrence -> 'days') @> to_jsonb(extract(dow from dd.d)::int)
              when 'monthly' then
                jsonb_typeof(t.recurrence -> 'day') = 'number'
                and (t.recurrence ->> 'day')::numeric between 1 and 31
                and (
                  extract(day from dd.d) = (t.recurrence ->> 'day')::numeric
                  or (
                    (t.recurrence ->> 'day')::numeric
                      > extract(day from (date_trunc('month', dd.d::timestamp) + interval '1 month - 1 day'))
                    and dd.d = (date_trunc('month', dd.d::timestamp) + interval '1 month - 1 day')::date
                  )
                )
              -- one_shot foi aposentado (vira semanal sem dias = nunca agendada)
              when 'one_shot' then false
              else true
            end)
     group by dd.d
  ),
  state as (
    select dd.d, dd.wk,
           coalesce(o.n, 0) as open_n,
           coalesce(dn.n, 0) as done_n,
           coalesce(sk.n, 0) as skip_n,
           case
             when coalesce(o.n, 0) > 0 then 'open'
             when coalesce(dn.n, 0) > 0 and coalesce(sk.n, 0) = 0 then 'complete'
             when coalesce(dn.n, 0) > 0 then 'cleared'
             when coalesce(sk.n, 0) > 0 then 'settled'
             else 'none'
           end as st
      from days dd
      left join open_n o on o.d = dd.d
      left join done dn on dn.d = dd.d
      left join skipped sk on sk.d = dd.d
  ),
  closed as (
    select s.wk,
           count(*) filter (where s.st in ('complete', 'cleared', 'settled')) as n,
           count(*) filter (where s.st = 'complete') as full_n
      from state s group by s.wk
  )
  select jsonb_build_object(
    'closed', jsonb_build_object(
      'this', coalesce((select n from closed where wk = 4), 0),
      'prev', case when v_has_prev then coalesce((select n from closed where wk = 3), 0) end,
      'avg4', case when v_n_hist > 0 then round(coalesce((
                select sum(n) from closed where wk between 4 - v_n_hist and 3), 0)::numeric / v_n_hist, 1) end
    ),
    'complete', coalesce((select full_n from closed where wk = 4), 0),
    -- Os 7 dias da semana; os que ainda não chegaram vêm como "future".
    'list', (
      select jsonb_agg(jsonb_build_object(
        'date', g.d,
        'state', coalesce(s.st, case when g.d > v_today then 'future' else 'none' end),
        'done', coalesce(s.done_n, 0),
        'skipped', coalesce(s.skip_n, 0),
        'open', coalesce(s.open_n, 0)
      ) order by g.d)
      from (select (v_start + i) as d from generate_series(0, 6) as i) g
      left join state s on s.d = g.d
    )
  )
  into v_days;

  -- ── Moedas gastas e recompensas ──────────────────────────────────────────
  with red as (
    select r.reward_id, r.cost_paid,
           (r.redeemed_at at time zone v_tz)::date as d
      from public.reward_redemption r
     where r.character_id = v_uid
  ),
  red_gap as (
    select red.*, red.d - lag(red.d) over (partition by red.reward_id order by red.d) as gap
      from red
  ),
  spent as (
    select (red.d - v_hist) / 7 as wk, sum(red.cost_paid) as coins
      from red where red.d between v_hist and v_end
     group by 1
  ),
  rw as (
    select g.reward_id,
           count(*) filter (where g.d between v_start and v_end) as times,
           coalesce(sum(g.cost_paid) filter (where g.d between v_start and v_end), 0) as coins,
           min(g.d) filter (where g.d between v_start and v_end) as first_in_week,
           max(g.d) filter (where g.d between v_start and v_end) as last_in_week,
           max(g.d) as last_day,
           max(g.gap) as best_gap,
           count(*) as total
      from red_gap g
     group by g.reward_id
    having count(*) filter (where g.d between v_start and v_end) > 0
  )
  select
    jsonb_build_object(
      'earned', v_practices -> 'coins_earned',
      'spent', jsonb_build_object(
        'this', coalesce((select coins from spent where wk = 4), 0),
        'prev', case when v_has_prev then coalesce((select coins from spent where wk = 3), 0) end,
        'avg4', case when v_n_hist > 0 then round(coalesce((
                  select sum(coins) from spent where wk between 4 - v_n_hist and 3), 0)::numeric / v_n_hist, 1) end
      ),
      'balance', (select c.coins from public.character c where c.id = v_uid)
    ),
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'reward_id', rw.reward_id,
        'title', rr.title,
        'icon', rr.icon,
        'times', rw.times,
        'coins', rw.coins,
        'last_in_week', rw.last_in_week,
        -- Hoje: dias desde o último resgate (de qualquer época).
        'days_since_last', v_today - rw.last_day,
        -- Quantos dias sem até o 1º resgate desta semana (null = foi o 1º).
        'days_without_before', (
          select max(g2.gap) from red_gap g2
           where g2.reward_id = rw.reward_id and g2.d = rw.first_in_week
        ),
        'previous_best_gap_days', case when rw.total > 1 then rw.best_gap end,
        'is_longest_streak_ever', (v_today - rw.last_day) > coalesce(rw.best_gap, 0),
        'redemptions_total', rw.total
      ) order by rw.times desc, rw.coins desc), '[]'::jsonb)
      from rw
      join public.reward rr on rr.id = rw.reward_id
    )
  into v_coins, v_rewards;

  -- ── Humor ────────────────────────────────────────────────────────────────
  with m as (
    select ml.logged_for as d, ml.mood, coalesce(ml.tags, '{}'::text[]) as tags,
           (ml.logged_for - v_hist) / 7 as wk
      from public.mood_log ml
     where ml.character_id = v_uid
       and ml.logged_for between v_hist and v_end
  ),
  tag_n as (
    select u.tag, count(*) as n
      from m, lateral unnest(m.tags) as u(tag)
     where m.wk = 4
     group by u.tag
  )
  select jsonb_build_object(
    'days_logged', (select count(*) from m where wk = 4),
    'avg', jsonb_build_object(
      'this', (select round(avg(mood)::numeric, 2) from m where wk = 4),
      'prev', case when v_has_prev then (select round(avg(mood)::numeric, 2) from m where wk = 3) end,
      'avg4', case when v_n_hist > 0 then (
                select round(avg(mood)::numeric, 2) from m where wk between 4 - v_n_hist and 3) end
    ),
    -- Empate: o dia mais recente.
    'best', (select jsonb_build_object('date', d, 'mood', mood)
               from m where wk = 4 order by mood desc, d desc limit 1),
    'worst', (select jsonb_build_object('date', d, 'mood', mood)
                from m where wk = 4 order by mood asc, d desc limit 1),
    'days', (select coalesce(jsonb_agg(jsonb_build_object('date', d, 'mood', mood) order by d), '[]'::jsonb)
               from m where wk = 4),
    'top_tags', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'tag', x.tag,
        'label_pt', mt.label_pt,
        'label_en', mt.label_en,
        'valence', mt.valence,
        'days', x.n
      ) order by x.n desc, x.tag), '[]'::jsonb)
      from (select * from tag_n order by n desc, tag limit 5) x
      left join public.mood_tag mt on mt.slug = x.tag
    )
  )
  into v_mood;

  -- ── A vida que eu quero (só com o módulo ligado, que é Premium) ──────────
  if v_premium and v_vida then
    with lv as (
      select v.scene_1, v.scene_1_dim, v.scene_2, v.scene_2_dim, v.scene_3, v.scene_3_dim
        from public.life_vision v
       where v.character_id = v_uid
       order by v.created_at desc
       limit 1
    ),
    scenes as (
      select 1 as n, lv.scene_1 as txt, lv.scene_1_dim as dim from lv
      union all
      select 2, lv.scene_2, lv.scene_2_dim from lv where lv.scene_2 is not null
      union all
      select 3, lv.scene_3, lv.scene_3_dim from lv where lv.scene_3 is not null
    ),
    wcomp as (
      select distinct tc.id, ds.dimension_id
        from public.task_completion tc
        join public.task_completion_sub tcs on tcs.completion_id = tc.id
        join public.dimension_sub ds on ds.id = tcs.sub_id
       where tc.character_id = v_uid
         and tc.completed_local_date between v_start and v_end
    )
    select case when exists (select 1 from lv) then jsonb_build_object(
      'scenes', (
        select jsonb_agg(jsonb_build_object(
          'n', s.n,
          'text', s.txt,
          'dimension_id', s.dim,
          'completions', (select count(distinct w.id) from wcomp w where w.dimension_id = s.dim)
        ) order by s.n)
        from scenes s
      ),
      'in_scenes', (select count(distinct w.id) from wcomp w
                     where w.dimension_id in (select s.dim from scenes s)),
      'total', (v_practices #>> '{completions,this}')::int
    ) end
    into v_life;
  end if;

  return jsonb_build_object(
    'week', jsonb_build_object(
      'start', v_start,
      'end', v_end,
      'today', v_today,
      'tz', v_tz,
      'complete', v_end < v_today,
      'days_elapsed', greatest(0, least(7, v_today - v_start + 1)),
      'first_week', v_first_week,
      'avg_weeks', v_n_hist
    ),
    'practices', v_practices - 'coins_earned' - 'xp',
    'dedication', jsonb_build_object('xp', v_practices -> 'xp'),
    'days', v_days,
    'coins', v_coins,
    'rewards', v_rewards,
    'mood', v_mood,
    'life', v_life
  );
end $$;

comment on function public.week_summary(date, text) is
  'Resumo da semana (segunda a domingo) em números exatos, sem IA. SECURITY '
  'INVOKER: a RLS self-only é a fronteira.';

revoke all on function public.week_summary(date, text) from public, anon;
grant execute on function public.week_summary(date, text) to authenticated;

-- ─── 2. week_insight — cache das observações da IA ──────────────────────────

create table if not exists public.week_insight (
  character_id uuid not null references public.character(id) on delete cascade,
  -- Sempre uma segunda.
  week_start   date not null check (extract(isodow from week_start) = 1),
  locale       text not null check (locale in ('pt', 'en')),
  -- 1 a 3 frases curtas, só o texto gerado.
  observations jsonb not null
                 check (jsonb_typeof(observations) = 'array'
                        and jsonb_array_length(observations) between 1 and 3),
  -- { "title": …, "why": …, "dimension_id": … } ou null.
  suggestion   jsonb check (suggestion is null or jsonb_typeof(suggestion) = 'object'),
  model        text,
  -- O request id do razão (ai_credit_ledger.ref), pra ligar custo e texto.
  ref          text,
  created_at   timestamptz not null default now(),
  primary key (character_id, week_start)
);

comment on table public.week_insight is
  'Observações da IA do Resumo da semana: uma linha por pessoa e semana, só o '
  'texto gerado. Escrita pela Edge Function perceva-ai (service_role).';

alter table public.week_insight enable row level security;

drop policy if exists "week_insight_self_read" on public.week_insight;
create policy "week_insight_self_read" on public.week_insight
  for select to authenticated using (character_id = auth.uid());

drop policy if exists "week_insight_self_delete" on public.week_insight;
create policy "week_insight_self_delete" on public.week_insight
  for delete to authenticated using (character_id = auth.uid());

-- O app lê e apaga; escrever é só da função (texto da IA, gerado uma vez).
revoke all on public.week_insight from anon;
revoke insert, update, truncate, references, trigger on public.week_insight from authenticated;
grant select, delete on public.week_insight to authenticated;

-- ─── 3. O aceite da IA passa a cobrir o Resumo da semana ────────────────────

update public.app_config
   set value = value || jsonb_build_object('consent_version', 2)
 where key = 'ai';

commit;
