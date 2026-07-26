-- migration: 20260726000001_free_disc_tipos_instruments.sql
-- purpose: Move the `disc` and `tipos` instruments from premium to free.
--          They become funnel entry points; the four remaining deep
--          instruments (big_five_120, schwartz_pvq, ecr_r, strengths)
--          stay premium. Mirrors the client-side change in
--          app/lib/premium/constants.ts (PREMIUM_INSTRUMENT_IDS).
--
-- affected tables: psych_session (BEFORE INSERT trigger function body only)
-- new rpcs:        none
-- breaking?        no — strictly loosens the gate; nothing that worked
--                  before stops working. Decision: Artur, 2026-07-26.

begin;

create or replace function public.enforce_premium_instrument()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.instrument_id in
     ('big_five_120', 'schwartz_pvq', 'ecr_r', 'strengths') then
    select subscription_tier into v_tier from public.profile where id = auth.uid();
    if v_tier is distinct from 'premium' then
      raise exception 'premium_instrument'
        using errcode = 'P0001', hint = 'premium_instrument';
    end if;
  end if;
  return new;
end $$;

commit;
