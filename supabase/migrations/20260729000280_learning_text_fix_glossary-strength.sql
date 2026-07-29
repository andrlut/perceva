-- migration: 20260729000280_learning_text_fix_glossary-strength.sql
-- purpose: big-release audit fix — set missing source_url from inline source
-- affected: learning_material. Revision trigger bumps version. released_at kept.
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'set missing source_url from inline source';

update public.learning_material set
  source_url = $src$https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2707428$src$
where slug = 'glossary-strength';

commit;
