-- migration: 20260907000001_profile_identity.sql
-- purpose: guarda a personalização do Emblema no perfil — título escolhido,
--          paleta, órbita e as marcas máximas por canal.
--
-- affected tables: profile (uma coluna nova)
-- new rpcs:        none
-- breaking?        no — coluna aditiva com default, nada existente muda
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
--   Molde copiado de profile.modules (20260824000003), e pela mesma razão:
--   é PREFERÊNCIA, não entitlement. Escrita direto pelo cliente — a policy
--   profile_self_update já permite, e o trigger lock_subscription_tier
--   protege APENAS subscription_tier. Se algum dia um cosmético virar pago,
--   a barreira segue o padrão dos free_limits (trigger de BEFORE INSERT),
--   nunca esta coluna.
--
--   NÃO reusar profile.modules pra isto: aquela coluna significa "quais
--   superfícies do app existem" e é tipada Record<string, boolean> no
--   cliente. Misturar cosmético com o registry de módulos custaria um
--   widening de tipo e confundiria dois eixos que não têm relação.
--
--   NÃO reusar profile.avatar_url: é text, existe desde o dia 1 e está
--   morto (zero uso no cliente). Um jsonb próprio custa menos que dar dois
--   sentidos a uma coluna.
--
--   Shape esperado (todas as chaves opcionais):
--     {
--       "title":   { "source": "disc", "key": "CS" },
--       "palette": "gilded",
--       "orbit":   "icons" | "dots" | "none",
--       "best":    { "xp30": 3235, "read30": 9 }
--     }
--
--   `best` é a marca máxima já atingida em cada canal de janela móvel. Ela
--   só sobe. Existe porque três dos quatro canais do Emblema RECUAM: sem
--   guardar o recorde, uma celebração de "cruzou o limiar" dispararia de
--   novo toda vez que o valor oscilasse em torno do mesmo número — que é
--   exatamente a cobrança que o produto não faz. Instrumentos ficam fora
--   do `best` porque psych_session já é permanente por natureza.

begin;

alter table public.profile
  add column if not exists identity jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.profile
    add constraint profile_identity_is_object
    check (jsonb_typeof(identity) = 'object');
exception when duplicate_object then null;
end $$;

comment on column public.profile.identity is
  'Personalização do Emblema: título escolhido, paleta, órbita e marcas '
  'máximas por canal. Preferência, não entitlement — escrita pelo cliente '
  'sob a policy profile_self_update.';

commit;
