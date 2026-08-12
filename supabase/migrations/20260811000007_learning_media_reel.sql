-- migration: 20260811000001_learning_media_reel.sql
-- purpose: teaser reel cards ("Explorar" feed) as learning media — accept
--          kind='reel' in learning_material_media. One row per material per
--          locale (existing UNIQUE), path = card 1, page_paths = the ordered
--          set of teaser cards (each shown as an independent publication).
-- breaking? no — additive (mirrors 20260725000004 which added 'video')
begin;

alter table public.learning_material_media
  drop constraint if exists learning_material_media_kind_check;

alter table public.learning_material_media
  add constraint learning_material_media_kind_check
  check (kind in ('audio', 'infographic', 'deck', 'video', 'reel'));

comment on column public.learning_material_media.page_paths is
  'deck/reel: ordered bucket-relative paths of every rasterized page / teaser card';

commit;
