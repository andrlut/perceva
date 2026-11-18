-- migration: 20261118000001_life_vision.sql
-- purpose: guarda "A vida que eu quero" (módulo `vida`): a vida dos sonhos da
--          pessoa em até 3 cenas com área, uma frase curta, até 3 subs em que
--          ela gastaria sem culpa, até 3 cortes e a 1ª prática ligada à cena 1.
--
-- affected tables: life_vision (nova)
-- new rpcs:        none (o cliente escreve direto, sob RLS)
-- breaking?        no — tabela nova, nada existente muda
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
--   VERSIONADA. Salvar = uma linha nova; a vigente é a mais recente por
--   created_at. Não existe UPDATE (nem policy, nem grant): o histórico é o que
--   permite ler "o que mudou desde março" e revisitar a cada 6 meses. A pessoa
--   apaga versões (LGPD art. 18) — DELETE self.
--
--   Tabela própria, e não jsonb em `profile`: `profile.identity` é o Emblema e
--   `profile.modules` é o registro de superfícies; contexto de vida não se
--   mistura com nenhum dos dois (mesma regra de 20260907000001/20260908000001).
--
--   Colunas tipadas em vez de um jsonb de cenas: o banco valida tamanho, área
--   (FK pro catálogo de dimensões) e a regra "cena preenchida tem área".
--
--   Texto livre pode trazer dado sensível (saúde, terceiros), como as notas de
--   humor e o `about`. A finalidade é dita na tela e os campos nascem vazios:
--   escrever é o ato de consentir com aquele uso. Nada é inferido pelo app.
--
--   Módulo é Premium (2026-10-13), mas como os outros módulos (week_item) a
--   tabela não tem trava de plano: o gate é de superfície, no cliente, e o
--   dado é da própria pessoa. RLS self-only é a fronteira.
--
--   O trigger de validação é SECURITY INVOKER: lê dimension_sub (leitura
--   pública pra authenticated) e task sob a RLS de quem insere — então
--   `first_task_id` só passa se a prática for DA PESSOA (a FK sozinha aceitaria
--   o id de outra conta e revelaria que ele existe). Também segura enxurrada:
--   no máximo 30 versões em 24 h por pessoa.

begin;

create table if not exists public.life_vision (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references public.character(id) on delete cascade,
  -- "Em poucas palavras" (ex.: "poder de escolha"). Opcional.
  headline      text check (headline is null or char_length(btrim(headline)) between 1 and 60),
  scene_1       text not null check (char_length(btrim(scene_1)) between 1 and 140),
  scene_1_dim   text not null references public.dimension(id),
  scene_2       text check (scene_2 is null or char_length(btrim(scene_2)) between 1 and 140),
  scene_2_dim   text references public.dimension(id),
  scene_3       text check (scene_3 is null or char_length(btrim(scene_3)) between 1 and 140),
  scene_3_dim   text references public.dimension(id),
  -- Até 3 sub ids (dimension_sub.id) em que a pessoa gastaria sem culpa.
  guilt_free    text[] not null default '{}' check (cardinality(guilt_free) <= 3),
  -- Até 3 cortes curtos (≤ 60 cada, validado no trigger).
  cuts          text[] not null default '{}' check (cardinality(cuts) <= 3),
  -- A 1ª prática que aproxima da cena 1. Prática apagada → some o vínculo.
  first_task_id uuid references public.task(id) on delete set null,
  created_at    timestamptz not null default now(),
  -- Cena preenchida tem área; área sem cena não existe.
  constraint life_vision_scene_2_dim check ((scene_2 is null) = (scene_2_dim is null)),
  constraint life_vision_scene_3_dim check ((scene_3 is null) = (scene_3_dim is null))
);

create index if not exists life_vision_char_created_idx
  on public.life_vision (character_id, created_at desc);

comment on table public.life_vision is
  'A vida que eu quero (módulo vida): uma linha por versão; a vigente é a mais '
  'recente. Escrita pelo cliente sob RLS, sem update; a pessoa apaga versões.';

-- ─── Validação (SECURITY INVOKER, só no INSERT) ─────────────────────────────

create or replace function public.life_vision_validate()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cut text;
begin
  -- guilt_free: sub ids do catálogo, sem repetição.
  if cardinality(new.guilt_free) > 0 then
    if (select count(distinct g) from unnest(new.guilt_free) as g) <> cardinality(new.guilt_free) then
      raise exception 'guilt_free tem sub repetida' using errcode = '22023';
    end if;
    if exists (
      select 1 from unnest(new.guilt_free) as g
      where not exists (select 1 from public.dimension_sub s where s.id = g)
    ) then
      raise exception 'guilt_free tem sub desconhecida' using errcode = '22023';
    end if;
  end if;

  -- cuts: cada um entre 1 e 60 caracteres.
  foreach v_cut in array new.cuts loop
    if v_cut is null or char_length(btrim(v_cut)) not between 1 and 60 then
      raise exception 'cada corte tem de 1 a 60 caracteres' using errcode = '22023';
    end if;
  end loop;

  -- first_task_id: só uma prática da própria pessoa (a RLS de task filtra).
  if new.first_task_id is not null and not exists (
    select 1 from public.task t
    where t.id = new.first_task_id and t.character_id = new.character_id
  ) then
    raise exception 'first_task_id não é uma prática sua' using errcode = '22023';
  end if;

  -- Enxurrada: no máximo 30 versões em 24 h.
  if (
    select count(*) from public.life_vision v
    where v.character_id = new.character_id
      and v.created_at > now() - interval '24 hours'
  ) >= 30 then
    raise exception 'muitas versões em 24 horas' using errcode = '54000';
  end if;

  return new;
end;
$$;

revoke execute on function public.life_vision_validate() from public, anon, authenticated;

drop trigger if exists life_vision_validate on public.life_vision;
create trigger life_vision_validate
  before insert on public.life_vision
  for each row execute function public.life_vision_validate();

-- ─── RLS: self-only, sem update ─────────────────────────────────────────────

alter table public.life_vision enable row level security;

drop policy if exists "life_vision_self_select" on public.life_vision;
create policy "life_vision_self_select" on public.life_vision
  for select to authenticated using (character_id = auth.uid());

drop policy if exists "life_vision_self_insert" on public.life_vision;
create policy "life_vision_self_insert" on public.life_vision
  for insert to authenticated with check (character_id = auth.uid());

drop policy if exists "life_vision_self_delete" on public.life_vision;
create policy "life_vision_self_delete" on public.life_vision
  for delete to authenticated using (character_id = auth.uid());

-- O grant padrão do Supabase dá ALL pra anon/authenticated em tabela nova.
-- Fica só o necessário; id e created_at são do servidor.
revoke all on public.life_vision from public, anon, authenticated;
grant select, delete on public.life_vision to authenticated;
grant insert (
  character_id, headline,
  scene_1, scene_1_dim, scene_2, scene_2_dim, scene_3, scene_3_dim,
  guilt_free, cuts, first_task_id
) on public.life_vision to authenticated;

commit;
