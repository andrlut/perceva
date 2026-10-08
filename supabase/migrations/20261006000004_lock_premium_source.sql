-- RPC-01 (auditoria de segurança 2026-10-06): fecha o furo do "Premium
-- vitalício".
--
-- O gatilho lock_subscription_tier travava só subscription_tier: com a
-- chave pública do app, o próprio usuário conseguia mudar premium_source
-- pra 'manual' e cancelar na loja — o webhook do RevenueCat só rebaixa
-- perfis com premium_source = 'revenuecat', então o Premium ficava pra
-- sempre.
--
-- 1) O mesmo gatilho (BEFORE UPDATE em profile) passa a travar também
--    premium_source contra o cliente (authenticated/anon). O webhook
--    (service_role) e concessões manuais via Studio (postgres) não entram
--    na condição e continuam funcionando como hoje.
-- 2) Sai a política profile_self_insert, que o app não usa — a linha do
--    profile nasce no handle_new_user (security definer) no signup. Por
--    ela dava pra inserir a própria linha já com tier/source arbitrários,
--    já que o gatilho acima só roda em UPDATE.

create or replace function public.lock_subscription_tier()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    -- Silently ignore self-grant attempts from the app.
    if new.subscription_tier is distinct from old.subscription_tier then
      new.subscription_tier := old.subscription_tier;
    end if;
    if new.premium_source is distinct from old.premium_source then
      new.premium_source := old.premium_source;
    end if;
  end if;
  return new;
end $$;

drop policy if exists profile_self_insert on public.profile;
