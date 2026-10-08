-- migration: 20261008000001_learning_no_auto_reward.sql
-- purpose: ler no Recanto deixa de pagar XP e moedas automaticamente; quem
--          quiser recompensa adota a prática de catálogo "Absorver uma ideia"
--
-- affected tables: task_template, task_template_sub (1 linha cada);
--                  função mark_material_read (os dois ramos pagam 0)
-- new rpcs:        none
-- breaking?        no — mesma assinatura e mesmo retorno (xp_awarded e
--                  coins_awarded agora vêm 0); o app esconde as dicas "+N XP"
--                  quando o valor é 0
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   decisão do dono (2026-10-08): a recompensa automática era a única do app
--   que a pessoa não escolheu (moedas ignoravam Nada/Metade/Igual/Dobro e o XP
--   não entrava em nenhuma área do hex). Agora ler é registrado (learning_view
--   segue gravando a leitura, com 0/0) e a recompensa vem de uma prática que a
--   pessoa adota e marca, sob as regras de todas as práticas.
--   o histórico não muda: linhas antigas de learning_view mantêm o que pagaram.
--   espelho no client: app/lib/learningXp.ts (agora 0).

begin;

create or replace function public.mark_material_read(p_slug text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_material record;
  v_existing record;
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

  -- Idempotente: já lido devolve o snapshot (leituras antigas mantêm o que
  -- pagaram na época).
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

  -- Registra a leitura; não paga nada (ver nota no cabeçalho).
  insert into public.learning_view (character_id, material_id, xp_awarded, coins_awarded)
  values (auth.uid(), v_material.id, 0, 0);

  return json_build_object(
    'already_read', false,
    'xp_awarded', 0,
    'coins_awarded', 0
  );
end $$;

-- A recompensa por aprender vira escolha: prática de catálogo, 1★ em Aprender.
insert into public.task_template
  (id, title, description, task_type, recurrence, target_count, sort_order, icon)
values
  ('learn_absorb_idea',
   'Absorver uma ideia no Recanto',
   'Ler uma ideia até o fim e virar a carta.',
   'daily', '{"type": "daily"}'::jsonb, 1, 40, 'bulb-outline')
on conflict (id) do nothing;

insert into public.task_template_sub (template_id, sub_id, stars)
values ('learn_absorb_idea', 'learn', 1)
on conflict do nothing;

commit;
