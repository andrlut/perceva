-- migration: 20260825000002_app_config.sql
-- purpose: app_config — tiny public-read key/value store the client can poll
--          for release facts the bundle cannot know about itself. First use:
--          "android_release" tells installed binaries when a NEWER native
--          build is live on the Play Store (an OTA can never reach an older
--          runtime, so the app must be able to say "update via the store").
--
-- affected tables: app_config (new)
-- new rpcs:        none
-- breaking?       no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   RELEASE RITUAL: whenever a new production build goes LIVE on the Play
--   Store, update the android_release row (new migration or Studio):
--     update app_config
--       set value = jsonb_set(value, '{version}', '"X.Y.Z"'), updated_at = now()
--       where key = 'android_release';
--   No client write path on purpose — Studio/migrations only.

begin;

create table if not exists public.app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

create policy "app_config_public_read" on public.app_config
  for select to authenticated using (true);
-- No insert/update/delete policies: the client only reads.

insert into public.app_config (key, value) values
  ('android_release', '{"version": "1.3.0", "package": "perceva.app"}'::jsonb)
on conflict (key) do nothing;

commit;
