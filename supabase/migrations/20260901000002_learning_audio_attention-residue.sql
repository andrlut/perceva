-- migration: 20260901000002_learning_audio_attention-residue.sql
-- purpose: register the NotebookLM/Gemini Notebook deep-dive audio (EN) for the
--          attention-residue learning material
--
-- affected tables: learning_material_media (1 upsert)
-- new rpcs:        none
-- breaking?       no — additive catalog row
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   the file attention-residue/audio.en.m4a (17:47, AAC 64k mono faststart,
--   8.9 MB) was uploaded to the public `learning-media` bucket and verified
--   reachable (HTTP 200, audio/mp4) BEFORE this migration ran.

begin;

insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', 'en', 'attention-residue/audio.en.m4a', 1067, 'notebooklm',
       '{"title": "Clear attention residue with three lines"}'::jsonb
from public.learning_material m
where m.slug = 'attention-residue'
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

commit;
