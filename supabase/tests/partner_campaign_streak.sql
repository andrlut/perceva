-- Checagens manuais da 20261104000009_partner_campaign.sql. NÃO é migration
-- e NÃO é pgTAP (`supabase test db` não é o runner deste arquivo).
--
-- Rodar contra o banco LOCAL depois de `supabase db reset` (nunca na cloud),
-- como superusuário (o `postgres` local não insere em auth.users):
--   docker exec -i -e PGPASSWORD=postgres supabase_db_rpgtasks \
--     psql -h 127.0.0.1 -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
--     < supabase/tests/partner_campaign_streak.sql
--
-- Tudo roda numa transação que termina em ROLLBACK: cria um usuário de teste,
-- duas campanhas de teste e apaga tudo no fim. Cada cenário imprime
-- "ok  <cenário>"; o primeiro que falha aborta com o esperado × obtido.
--
-- Os dias são relativos a current_date (UTC no servidor): k = 0 é hoje,
-- k = 1 é ontem. Conclusão "no dia" = inserida ao meio-dia UTC do próprio
-- dia; "atrasada" = inserida 7 dias depois do dia local.
--
-- Não testa o EXECUTE negado chamando a função como authenticated: o Postgres
-- local já deu SEGFAULT em "permission denied" de função (a cloud não) — por
-- isso a checagem de privilégio usa has_function_privilege.

begin;

-- ─── fixtures ───────────────────────────────────────────────────────────────

insert into auth.users (id, email, aud, role)
values ('00000000-0000-4000-8000-0000000c0de1', 'streak-test@example.invalid',
        'authenticated', 'authenticated');

-- auth.uid() lê este GUC; as RPCs SECURITY DEFINER rodam como postgres mesmo
select set_config(
  'request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000c0de1", "role": "authenticated"}',
  true
);

insert into public.partner_campaign (
  id, partner_name, title_pt, title_en, pitch_pt, pitch_en, reward_pt, reward_en,
  template_id, streak_goal, max_skips, starts_at
) values
  ('streak-test', 'Teste', 'Teste', 'Test', 'p', 'p', 'r', 'r',
   'nutrition_daily_supplement', 28, 4, now() - interval '120 days'),
  ('streak-late-start', 'Teste', 'Teste', 'Test', 'p', 'p', 'r', 'r',
   'nutrition_daily_supplement', 28, 4, now() - interval '2 days');

insert into public.partner_campaign_secret (campaign_id, coupon_code)
values ('streak-test', null);

-- a prática da campanha, adotada pelo caminho do app
select public.start_task_from_template('nutrition_daily_supplement');

-- Reescreve o histórico da prática: dias feitos no dia, pulos no dia, e as
-- versões "atrasadas" de cada um. O gatilho carimba task_skip.created_at com
-- now(); o pulo "no dia" é movido de volta com um UPDATE (como postgres; não
-- há gatilho de update), o atrasado fica com o carimbo de hoje.
create function pg_temp.set_days(
  p_done      int[],
  p_skip      int[] default '{}',
  p_late_done int[] default '{}',
  p_late_skip int[] default '{}'
)
returns void
language plpgsql
as $$
declare
  v_uid  uuid := '00000000-0000-4000-8000-0000000c0de1';
  v_task uuid;
  k      int;
begin
  select id into v_task
  from public.task
  where character_id = v_uid
    and coalesce(origin_template_id, template_id) = 'nutrition_daily_supplement'
  order by created_at desc
  limit 1;

  delete from public.task_completion where character_id = v_uid;
  delete from public.task_skip where character_id = v_uid;

  foreach k in array p_done loop
    insert into public.task_completion
      (task_id, character_id, completed_at, completed_local_date, xp_granted, coins_granted, created_at)
    values
      (v_task, v_uid, (current_date - k) + time '12:00', current_date - k, 10, 10,
       (current_date - k) + time '12:00');
  end loop;

  foreach k in array p_late_done loop
    insert into public.task_completion
      (task_id, character_id, completed_at, completed_local_date, xp_granted, coins_granted, created_at)
    values
      (v_task, v_uid, (current_date - k) + time '12:00', current_date - k, 10, 10,
       (current_date - k + 7) + time '12:00');
  end loop;

  foreach k in array p_skip loop
    insert into public.task_skip (task_id, character_id, skipped_for)
    values (v_task, v_uid, current_date - k);
    update public.task_skip
    set created_at = (current_date - k) + time '20:00'
    where task_id = v_task and skipped_for = current_date - k;
  end loop;

  foreach k in array p_late_skip loop
    insert into public.task_skip (task_id, character_id, skipped_for)
    values (v_task, v_uid, current_date - k);
  end loop;
end $$;

create function pg_temp.expect(p_label text, p_campaign text, p_streak int, p_skips int)
returns void
language plpgsql
as $$
declare
  r record;
begin
  select * into r
  from public._partner_streak(p_campaign, '00000000-0000-4000-8000-0000000c0de1', current_date);
  if r.streak_days is distinct from p_streak or r.skips_used is distinct from p_skips then
    raise exception '%: esperava streak=% skips=%, veio streak=% skips=%',
      p_label, p_streak, p_skips, r.streak_days, r.skips_used;
  end if;
  raise notice 'ok  %', p_label;
end $$;

-- ─── a caminhada (_partner_streak) ──────────────────────────────────────────

select pg_temp.set_days('{}');
select pg_temp.expect('histórico vazio', 'streak-test', 0, 0);

select pg_temp.set_days('{0}');
select pg_temp.expect('feito só hoje', 'streak-test', 1, 0);

select pg_temp.set_days('{1}');
select pg_temp.expect('feito ontem, hoje ainda não (hoje é neutro)', 'streak-test', 1, 0);

select pg_temp.set_days('{1,2}', '{}', '{}', '{0}');
select pg_temp.expect('hoje pulado e não feito: neutro, não gasta pulo', 'streak-test', 2, 0);

select pg_temp.set_days(array(select generate_series(0, 27)));
select pg_temp.expect('28 seguidos terminando hoje', 'streak-test', 28, 0);

select pg_temp.set_days(array(select generate_series(1, 28)));
select pg_temp.expect('28 seguidos terminando ontem', 'streak-test', 28, 0);

select pg_temp.set_days(array(select generate_series(0, 40)));
select pg_temp.expect('41 seguidos: para no alvo', 'streak-test', 28, 0);

select pg_temp.set_days('{0,1,3,4}');
select pg_temp.expect('buraco anteontem', 'streak-test', 2, 0);

select pg_temp.set_days('{0,2,3}', '{1}');
select pg_temp.expect('um pulo ligando a sequência', 'streak-test', 3, 1);

select pg_temp.set_days('{0,2,4,6,8,10}', '{1,3,5,7,9}');
select pg_temp.expect('5 pulos com teto 4: o quinto quebra', 'streak-test', 5, 4);

select pg_temp.set_days('{0}', '{1,2}');
select pg_temp.expect('pulos na ponta, sem dia feito depois: não gastam', 'streak-test', 1, 0);

select pg_temp.set_days('{0,1,2,3,4,5,6,7,8,9,11,12}', '{}', '{10}');
select pg_temp.expect('conclusão inserida uma semana depois do dia não conta', 'streak-test', 10, 0);

select pg_temp.set_days('{0,1,2,3,5,6}', '{}', '{}', '{4}');
select pg_temp.expect('pulo inserido 4 dias depois não liga', 'streak-test', 4, 0);

select pg_temp.set_days(array(select generate_series(0, 9)));
select pg_temp.expect('nada antes de starts_at (começou anteontem)', 'streak-late-start', 3, 0);

-- editar a prática no task-form corta template_id (dropTemplateLink); a
-- sequência segue pela origem, carimbada na adoção
do $$
declare
  v_origin text;
begin
  update public.task set template_id = null, title = 'Creatina 5 g'
  where character_id = '00000000-0000-4000-8000-0000000c0de1'
    and template_id = 'nutrition_daily_supplement';
  select origin_template_id into v_origin from public.task
  where character_id = '00000000-0000-4000-8000-0000000c0de1'
  limit 1;
  assert v_origin = 'nutrition_daily_supplement',
    'origin_template_id devia ter sido carimbado na adoção e sobrevivido à edição';
end $$;
select pg_temp.expect('prática editada (vínculo cortado) segue contando', 'streak-test', 10, 0);

-- ─── gatilho, policy e privilégios ──────────────────────────────────────────

do $$
declare
  v_task uuid;
  v_created timestamptz;
begin
  select id into v_task from public.task
  where character_id = '00000000-0000-4000-8000-0000000c0de1'
  limit 1;

  delete from public.task_skip where task_id = v_task;
  insert into public.task_skip (task_id, character_id, skipped_for, created_at)
  values (v_task, '00000000-0000-4000-8000-0000000c0de1', current_date - 30, '2020-01-01');
  select created_at into v_created from public.task_skip
  where task_id = v_task and skipped_for = current_date - 30;
  assert v_created = now(), 'task_skip.created_at devia ser carimbado com now()';
  delete from public.task_skip where task_id = v_task;

  assert not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'task_completion'
      and policyname = 'task_completion_self_insert'
  ), 'task_completion_self_insert devia ter saído';
  assert not has_table_privilege('authenticated', 'public.task_completion', 'insert'),
    'authenticated não devia ter INSERT em task_completion';
  assert not has_table_privilege('authenticated', 'public.partner_campaign_secret', 'select'),
    'authenticated não devia ler partner_campaign_secret';
  assert not has_function_privilege('authenticated', 'public._partner_streak(text, uuid, date)', 'execute'),
    'authenticated não devia executar _partner_streak';
  assert has_function_privilege('authenticated', 'public.partner_campaign_status(text, date)', 'execute'),
    'authenticated devia executar partner_campaign_status';
  assert not has_function_privilege('anon', 'public.claim_partner_coupon(text, date)', 'execute'),
    'anon não devia executar claim_partner_coupon';

  raise notice 'ok  gatilho do task_skip, policy e privilégios';
end $$;

-- ─── status → join → claim ──────────────────────────────────────────────────

select pg_temp.set_days(array(select generate_series(0, 9)));

do $$
declare
  s jsonb;
begin
  s := public.partner_campaign_status('streak-test', current_date);
  assert (s->>'member')::boolean = false, 'status: ainda não é membro';
  assert (s->>'adopted')::boolean = true, 'status: a prática foi adotada';
  assert (s->>'task_id') is not null, 'status: task_id da prática';
  assert (s->>'done_today')::boolean = true, 'status: feito hoje';
  assert (s->>'streak_days')::int = 10, 'status: 10 dias';
  assert (s->>'goal')::int = 28 and (s->>'max_skips')::int = 4, 'status: alvo e teto';
  assert (s->>'unlocked')::boolean = false, 'status: ainda trancado';
  assert (s->>'coupon_code') is null, 'status: sem código antes do claim';

  begin
    perform public.partner_campaign_status('streak-test', current_date + 2);
    raise exception 'p_today fora da faixa devia falhar';
  exception when others then
    if sqlerrm <> 'invalid_local_date' then raise; end if;
  end;

  begin
    perform public.partner_campaign_status('nao-existe', current_date);
    raise exception 'campanha inexistente devia falhar';
  exception when others then
    if sqlerrm <> 'campaign_not_found' then raise; end if;
  end;

  begin
    perform public.claim_partner_coupon('streak-test', current_date);
    raise exception 'claim sem entrar devia falhar';
  exception when others then
    if sqlerrm <> 'not_a_member' then raise; end if;
  end;

  perform public.join_partner_campaign('streak-test', 'origem-inventada');
  perform public.join_partner_campaign('streak-test', 'banner');
  assert (
    select source from public.partner_campaign_member
    where campaign_id = 'streak-test'
      and character_id = '00000000-0000-4000-8000-0000000c0de1'
  ) = 'app', 'join: source inválido vira app e o segundo join não sobrescreve';

  begin
    perform public.claim_partner_coupon('streak-test', current_date);
    raise exception 'claim abaixo do alvo devia falhar';
  exception when others then
    if sqlerrm <> 'streak_not_reached' then raise; end if;
  end;

  raise notice 'ok  status, join e recusas do claim';
end $$;

select pg_temp.set_days(array(select generate_series(0, 27)));

do $$
declare
  s jsonb;
  v_first timestamptz;
begin
  s := public.claim_partner_coupon('streak-test', current_date);
  assert (s->>'member')::boolean, 'claim: membro';
  assert (s->>'claimed')::boolean, 'claim: claimed';
  assert (s->>'unlocked')::boolean, 'claim: unlocked';
  assert (s->>'coupon_ready')::boolean = false, 'claim: código ainda não liberado';
  assert (s->>'coupon_code') is null, 'claim: sem código enquanto não liberado';
  assert (
    select streak_at_claim from public.partner_coupon_claim
    where campaign_id = 'streak-test'
      and character_id = '00000000-0000-4000-8000-0000000c0de1'
  ) = 28, 'claim: streak_at_claim = 28';
  v_first := (s->>'claimed_at')::timestamptz;

  update public.partner_campaign_secret set coupon_code = 'PAKER-TESTE'
  where campaign_id = 'streak-test';
  s := public.partner_campaign_status('streak-test', current_date);
  assert s->>'coupon_code' = 'PAKER-TESTE', 'status: código depois do claim e da liberação';

  -- quebrar a sequência depois do claim não tira o cupom
  perform pg_temp.set_days('{}');
  s := public.claim_partner_coupon('streak-test', current_date);
  assert (s->>'streak_days')::int = 0, 'depois: sequência zerada';
  assert (s->>'claimed')::boolean and (s->>'unlocked')::boolean, 'depois: continua liberado';
  assert (s->>'claimed_at')::timestamptz = v_first, 'depois: o primeiro claimed_at fica';
  assert s->>'coupon_code' = 'PAKER-TESTE', 'depois: o código continua';

  raise notice 'ok  claim, liberação do código e claim idempotente';
end $$;

rollback;
