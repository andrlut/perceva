-- migration: 20260925000002_catalog_once_a_week_targets.sql
-- purpose: three catalog practices meant as "once a week" were turned into
--          daily-ish commitments by the recurrence_unified migration, which
--          multiplied target_count by the number of listed days. Their own
--          copy says once a week ("Um dia limpo por semana", "Encontro
--          presencial na semana", "Algo planejado"). All three are in the
--          onboarding starter pack, where "Dia sem ultraprocessado" read as
--          a 3-star practice EVERY day.
--
-- affected tables: task_template (3 rows: recurrence + target_count)
-- new rpcs:        none
-- breaking?        no — adopted practices keep their own copy; only new
--                  adoptions pick up the corrected cadence.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   * {"type":"weekly"} with no days = flexible: once, any day of the week.
--   * play_sport_1h (2x on Wed/Sat) and movement_strength_3x (Mon/Wed/Fri)
--     are genuinely multi-day and stay as they are.

begin;

update public.task_template
   set recurrence = '{"type":"weekly"}'::jsonb,
       target_count = 1
 where id in (
   'nutrition_no_ultraprocessed',
   'circle_meet_in_person',
   'romance_intentional_date'
 );

commit;
