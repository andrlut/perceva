-- partner_campaign_track_pk — HOTFIX da 20261115000002 (2026-11-15).
--
-- A tabela partner_campaign_track nasceu com a chave primária composta
-- (campaign_id, template_id), as duas colunas FKs. O PostgREST enxerga uma
-- tabela assim como JUNÇÃO N:N entre partner_campaign e task_template, e a
-- partir daí o embed `practice:task_template ( title, icon )` no select de
-- partner_campaign — que TODO app em circulação faz, produção inclusa —
-- passou a ter duas relações possíveis e respondeu HTTP 300 (PGRST201).
-- Efeito: a consulta da campanha falhava, o cartão da Home, o chip Parceria
-- e a tela /campaign sumiam.
--
-- Correção: chave primária surrogada (id) e a unicidade de
-- (campaign_id, template_id) por ÍNDICE único, não constraint, pra tabela
-- deixar de parecer junção de uma vez. O embed `tracks:partner_campaign_track`
-- continua resolvendo pelo FK campaign_id.
--
-- changed table: partner_campaign_track (+id pk, pkey composta vira índice único)

begin;

alter table public.partner_campaign_track
  drop constraint if exists partner_campaign_track_pkey;

alter table public.partner_campaign_track
  add column if not exists id uuid not null default gen_random_uuid();

alter table public.partner_campaign_track
  add primary key (id);

create unique index if not exists partner_campaign_track_campaign_template_idx
  on public.partner_campaign_track (campaign_id, template_id);

comment on table public.partner_campaign_track is
  'As práticas que valem pra sequência de uma campanha de parceiro (uma por linha, sort_order = ordem na tela). Inclui a principal (partner_campaign.template_id). Qualquer uma conta o dia. Escrita só pelo Studio. PK surrogada de propósito: com PK (campaign_id, template_id) o PostgREST a trata como junção N:N e o embed practice:task_template de partner_campaign fica ambíguo (HTTP 300).';

notify pgrst, 'reload schema';

do $guard$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.partner_campaign_track'::regclass
      and contype in ('p', 'u')
      and array_length(conkey, 1) > 1
  ) then
    raise exception 'partner_campaign_track_pk: ainda existe constraint composta (junção pro PostgREST)';
  end if;
  raise notice 'partner_campaign_track_pk: PK surrogada; embed practice:task_template volta a resolver';
end
$guard$;

commit;
