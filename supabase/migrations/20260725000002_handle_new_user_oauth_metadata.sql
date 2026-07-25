-- ─── handle_new_user: read OAuth metadata (Google Sign-In) ──────────────
-- Google/OAuth signups via signInWithIdToken store their claims in
-- raw_user_meta_data as `full_name` / `name` (and `avatar_url` / `picture`),
-- never `display_name` — so until now a Google user landed with the email
-- prefix as display_name and no avatar. Two changes vs. the previous
-- definition (20260503000007_task_templates.sql):
--   1. display_name coalesce chain gains full_name and name.
--   2. profile.avatar_url is seeded from avatar_url/picture when present.
-- Everything else (character, 6 dims, 12 sub scores, no auto-seeded tasks)
-- is copied verbatim. CREATE OR REPLACE keeps this idempotent; the trigger
-- on auth.users already points at this function name.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Adventurer'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );

  insert into public.character (id) values (new.id);

  insert into public.character_dimension (character_id, dimension_id)
    select new.id, d.id from public.dimension d;

  insert into public.character_sub_score (character_id, source, sub_id)
    select new.id, 'self', s.id from public.dimension_sub s;

  -- No more auto-seeded tasks. User adopts from task_template or creates own.

  return new;
end $$;
