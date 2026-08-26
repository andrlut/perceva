-- migration: 20260825000003_premium_source.sql
-- purpose: Track WHO granted premium — 'manual' (Studio/admin, used for the
--          beta testers) vs 'revenuecat' (paid store subscription, written by
--          the revenuecat-webhook edge function). The webhook only ever
--          downgrades rows it owns (premium_source = 'revenuecat'), so manual
--          tester grants can never be clobbered by subscription-lifecycle
--          events or a future sync job.
--
-- affected tables: profile (new column + check)
-- new rpcs:        none
-- breaking?        no — additive; default 'manual' matches how every existing
--                  premium row was granted.

begin;

alter table public.profile
  add column if not exists premium_source text not null default 'manual';

alter table public.profile
  drop constraint if exists profile_premium_source_chk;
alter table public.profile
  add constraint profile_premium_source_chk
    check (premium_source in ('manual', 'revenuecat'));

comment on column public.profile.premium_source is
  'Origin of subscription_tier: manual (Studio/admin grant) or revenuecat '
  '(store subscription via the revenuecat-webhook edge function). Revoke '
  'paths must only touch rows where premium_source = revenuecat.';

commit;
