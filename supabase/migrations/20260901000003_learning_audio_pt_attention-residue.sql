-- migration: 20260901000003_learning_audio_pt_attention-residue.sql
-- purpose: register the Gemini Notebook deep-dive audio (PT) for the
--          attention-residue learning material (pairs with 20260901000002's EN row)
--
-- affected tables: learning_material_media (1 upsert)
-- new rpcs:        none
-- breaking?       no — additive catalog row
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   the file attention-residue/audio.pt.m4a (16:20, AAC 64k mono faststart,
--   8.2 MB) was uploaded to the public `learning-media` bucket and verified
--   reachable (HTTP 200, audio/mp4) BEFORE this migration ran.

begin;

insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', 'pt', 'attention-residue/audio.pt.m4a', 980, 'notebooklm',
       '{"title": "Como eliminar o resíduo de atenção"}'::jsonb
from public.learning_material m
where m.slug = 'attention-residue'
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

commit;
