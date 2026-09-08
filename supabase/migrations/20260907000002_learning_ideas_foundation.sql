-- migration: 20260907000002_learning_ideas_foundation.sql
-- purpose: fundação do "Recanto em ideias" — cada material passa a poder carregar
--          1..5 ideias (jsonb), o usuário "absorve" ideias virando o card, e o
--          XP de material com ideias vira genérico (sem dimensão).
--
-- affected tables: learning_material (+ideas, +idea_count),
--                  learning_material_revision (+ideas, trigger recriado),
--                  learning_idea_collect (nova), learning_idea_public (view nova)
-- new rpcs:        collect_idea(text, text); mark_material_read(text) reescrita
--                  com DOIS ramos (legado byte a byte / ideias genérico)
-- breaking?       no — material sem `ideas` continua exatamente como hoje,
--                  inclusive o XP por dimensão. Só materiais com `ideas` mudam.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   escrita pelo editor (nunca heredoc): PT com acento em comentários e mensagens
--   contrato de `ideas[]` (por ideia): { id, ordinal, title{pt,en}, claim{pt,en},
--     body{pt,en}, image{path,width,height}|null, video{pt{path,duration_seconds,
--     poster}|null, en|null}, sources[{label{pt,en},url}], cta|null }
--   o vídeo POR IDEIA mora aqui dentro porque learning_material_media tem
--     UNIQUE (material_id, kind, locale) — um vídeo por material e idioma.
--   a "invariante" total_xp = Σ character_dimension.xp era só um comentário em
--     20260514000010:27 (sem constraint); complete_quest já credita total_xp
--     sem dimensão desde 20260501000009. Material com ideias segue esse padrão.

begin;

-- ─── 1. learning_material: ideas + idea_count ─────────────────────────────

alter table public.learning_material
  add column ideas jsonb;

alter table public.learning_material
  add constraint learning_material_ideas_shape
    check (
      ideas is null
      or (jsonb_typeof(ideas) = 'array' and jsonb_array_length(ideas) between 1 and 5)
    );

-- O feed lê SÓ este inteiro (nunca o jsonb): "N ideias · M absorvidas".
alter table public.learning_material
  add column idea_count smallint
    generated always as (coalesce(jsonb_array_length(ideas), 0)) stored;

comment on column public.learning_material.ideas is
  '1..5 ideias (jsonb). NULL = material legado (tela antiga). Ver 20260907000002 para o contrato.';
comment on column public.learning_material.idea_count is
  'Gerada: jsonb_array_length(ideas) ou 0. É a única coisa que o feed seleciona.';

-- ─── 2. revisão: snapshot passa a cobrir `ideas` ─────────────────────────

alter table public.learning_material_revision
  add column ideas jsonb;

create or replace function public.snapshot_material_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  if (
    old.body_pt is distinct from new.body_pt
    or old.body_en is distinct from new.body_en
    or old.takeaways_pt is distinct from new.takeaways_pt
    or old.takeaways_en is distinct from new.takeaways_en
    or old.signs_pt is distinct from new.signs_pt
    or old.signs_en is distinct from new.signs_en
    or old.tracking_pt is distinct from new.tracking_pt
    or old.tracking_en is distinct from new.tracking_en
    or old.reasoning_log is distinct from new.reasoning_log
    or old.ideas is distinct from new.ideas
  ) then
    insert into public.learning_material_revision (
      material_id, version,
      body_pt, body_en,
      takeaways_pt, takeaways_en,
      signs_pt, signs_en,
      tracking_pt, tracking_en,
      reasoning_log,
      ideas,
      edited_by,
      edit_summary
    ) values (
      old.id, old.version,
      old.body_pt, old.body_en,
      old.takeaways_pt, old.takeaways_en,
      old.signs_pt, old.signs_en,
      old.tracking_pt, old.tracking_en,
      old.reasoning_log,
      old.ideas,
      coalesce(current_setting('app.edited_by', true), 'unknown'),
      coalesce(current_setting('app.edit_summary', true), null)
    );

    if new.version = old.version then
      new.version := old.version + 1;
    end if;
  end if;

  return new;
end $func$;

-- ─── 3. learning_idea_collect — "absorvi esta ideia" ─────────────────────
-- Chaveada pelo `id` da ideia (imutável), não pela posição: um recorte que
-- preserva ids preserva a coleção. Imutável como learning_view (sem update/
-- delete): absorver não desfaz, por desenho.

create table public.learning_idea_collect (
  character_id uuid not null references public.character(id) on delete cascade,
  material_id  uuid not null references public.learning_material(id) on delete cascade,
  idea_id      text not null,
  collected_at timestamptz not null default now(),
  primary key (character_id, material_id, idea_id)
);

create index learning_idea_collect_character_material_idx
  on public.learning_idea_collect (character_id, material_id);

alter table public.learning_idea_collect enable row level security;

create policy "learning_idea_collect_self_select" on public.learning_idea_collect
  for select to authenticated using (character_id = auth.uid());

create policy "learning_idea_collect_self_insert" on public.learning_idea_collect
  for insert to authenticated with check (character_id = auth.uid());

-- ─── 4. mark_material_read — dois ramos ──────────────────────────────────
-- idea_count = 0  → corpo de 20260514000010, byte a byte (5 + 5×sub, XP por
--                   dimensão, moedas 1:1). Os materiais legados não mudam nada.
-- idea_count > 0  → XP genérico 10 + 2×ideias, só character.total_xp/coins.

create or replace function public.mark_material_read(p_slug text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_material record;
  v_existing record;
  v_sub_count integer;
  v_xp_per_sub constant integer := 5;
  v_xp_base constant integer := 5;
  v_xp_base_ideas constant integer := 10;
  v_xp_per_idea constant integer := 2;
  v_total_xp integer;
  v_total_coins integer;
  v_elem record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_material
  from public.learning_material
  where slug = p_slug and is_archived = false;
  if not found then
    raise exception 'Material not found: %', p_slug;
  end if;

  -- Idempotente: já lido devolve o snapshot.
  select * into v_existing
  from public.learning_view
  where character_id = auth.uid() and material_id = v_material.id;
  if found then
    return json_build_object(
      'already_read', true,
      'xp_awarded', v_existing.xp_awarded,
      'coins_awarded', v_existing.coins_awarded
    );
  end if;

  if coalesce(v_material.idea_count, 0) = 0 then
    -- ── ramo legado (inalterado) ──
    select count(*) into v_sub_count
    from public.learning_material_sub
    where material_id = v_material.id;

    v_total_xp := v_xp_base + (v_xp_per_sub * v_sub_count);
    v_total_coins := v_total_xp;

    insert into public.learning_view (character_id, material_id, xp_awarded, coins_awarded)
    values (auth.uid(), v_material.id, v_total_xp, v_total_coins);

    update public.character_dimension
    set xp = xp + v_xp_base
    where character_id = auth.uid() and dimension_id = v_material.dimension_id;

    for v_elem in
      select ds.dimension_id
      from public.learning_material_sub lms
      join public.dimension_sub ds on ds.id = lms.sub_id
      where lms.material_id = v_material.id
    loop
      update public.character_dimension
      set xp = xp + v_xp_per_sub
      where character_id = auth.uid() and dimension_id = v_elem.dimension_id;
    end loop;

    update public.character
    set total_xp = total_xp + v_total_xp,
        coins = coins + v_total_coins
    where id = auth.uid();
  else
    -- ── ramo ideias: XP genérico, sem dimensão ──
    v_total_xp := v_xp_base_ideas + (v_xp_per_idea * v_material.idea_count);
    v_total_coins := v_total_xp;

    insert into public.learning_view (character_id, material_id, xp_awarded, coins_awarded)
    values (auth.uid(), v_material.id, v_total_xp, v_total_coins);

    update public.character
    set total_xp = total_xp + v_total_xp,
        coins = coins + v_total_coins
    where id = auth.uid();
    if not found then
      raise exception 'character row missing for %', auth.uid();
    end if;
  end if;

  return json_build_object(
    'already_read', false,
    'xp_awarded', v_total_xp,
    'coins_awarded', v_total_coins
  );
end $$;

grant execute on function public.mark_material_read(text) to authenticated;

-- ─── 5. collect_idea(slug, idea_id) ──────────────────────────────────────
-- Virar o card. Idempotente por (character, material, idea). Quando a última
-- ideia viva é absorvida, fecha o material via mark_material_read (que já é
-- idempotente: material lido antes de ter ideias devolve already_read=true).

create or replace function public.collect_idea(p_slug text, p_idea_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_material record;
  v_exists boolean;
  v_collected integer;
  v_award json;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id, slug, ideas, idea_count into v_material
  from public.learning_material
  where slug = p_slug and is_archived = false and released_at <= now();
  if not found then
    raise exception 'Material not found: %', p_slug;
  end if;
  if v_material.ideas is null then
    raise exception 'Material has no ideas: %', p_slug;
  end if;

  select exists (
    select 1 from jsonb_array_elements(v_material.ideas) i
    where i->>'id' = p_idea_id
  ) into v_exists;
  if not v_exists then
    raise exception 'Idea not found: % / %', p_slug, p_idea_id;
  end if;

  insert into public.learning_idea_collect (character_id, material_id, idea_id)
  values (auth.uid(), v_material.id, p_idea_id)
  on conflict do nothing;

  -- Conta só ids que ainda existem no material (um recorte pode ter removido).
  select count(*) into v_collected
  from public.learning_idea_collect c
  where c.character_id = auth.uid()
    and c.material_id = v_material.id
    and exists (
      select 1 from jsonb_array_elements(v_material.ideas) i
      where i->>'id' = c.idea_id
    );

  v_award := null;
  if v_collected >= v_material.idea_count then
    v_award := public.mark_material_read(p_slug);
  end if;

  return json_build_object(
    'collected', v_collected,
    'total', v_material.idea_count,
    'completed', v_collected >= v_material.idea_count,
    'already_read', coalesce((v_award->>'already_read')::boolean, false),
    'xp_awarded', coalesce((v_award->>'xp_awarded')::integer, 0),
    'coins_awarded', coalesce((v_award->>'coins_awarded')::integer, 0)
  );
end $$;

grant execute on function public.collect_idea(text, text) to authenticated;

-- ─── 6. learning_idea_public — uma linha por ideia publicada ─────────────
-- Fonte do Explorar por ideia, de "Minhas ideias" e do MCP. O feed continua
-- só com idea_count. security_invoker: herda a RLS de learning_material.

create or replace view public.learning_idea_public
with (security_invoker = true) as
select
  m.id                                   as material_id,
  m.slug,
  m.type,
  m.dimension_id,
  m.released_at,
  i->>'id'                               as idea_id,
  (i->>'ordinal')::smallint              as ordinal,
  i->'title'->>'pt'                      as title_pt,
  i->'title'->>'en'                      as title_en,
  i->'claim'->>'pt'                      as claim_pt,
  i->'claim'->>'en'                      as claim_en,
  i->'image'->>'path'                    as image_path,
  i->'video'->'pt'->>'path'              as video_pt_path,
  i->'video'->'en'->>'path'              as video_en_path
from public.learning_material m
cross join lateral jsonb_array_elements(m.ideas) as i
where m.is_archived = false
  and m.released_at <= now();

grant select on public.learning_idea_public to authenticated;

commit;
