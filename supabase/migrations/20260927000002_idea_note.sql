-- Nota da pessoa sobre uma ideia que ela absorveu.
--
-- Mora em `learning_idea_collect` porque a chave já é (quem, material,
-- ideia) e a linha já carrega `reviewed_at`/`favorite` — a nota pega
-- carona na pilha de revisão sem tabela nova e sem política nova.
--
-- Escrita SÓ pela RPC, de propósito. A nota nunca cria a linha de coleta:
-- `collect_idea` cunha XP e moeda via `mark_material_read` quando a última
-- ideia do material entra, e um campo de texto não pode ser caminho pra
-- economia. Anotar pressupõe ter absorvido — que é exatamente o conjunto
-- que aparece em "Minhas ideias", então a regra é invisível na tela.

alter table public.learning_idea_collect
  add column if not exists note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.learning_idea_collect'::regclass
      and conname = 'learning_idea_collect_note_len'
  ) then
    alter table public.learning_idea_collect
      add constraint learning_idea_collect_note_len
      check (note is null or char_length(note) <= 2000);
  end if;
end $$;

-- Os privilégios desta tabela são POR COLUNA (herdados do setup original),
-- e privilégio por coluna não se estende a coluna nova: sem este grant o
-- cliente lê a linha inteira menos `note`, sem erro nenhum, e a tela
-- mostraria "sem nota" pra sempre. Leitura direta sim; escrita não — quem
-- escreve é a RPC abaixo.
grant select (note) on public.learning_idea_collect to authenticated;

create or replace function public.set_idea_note(
  p_slug text,
  p_idea_id text,
  p_note text
)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_char uuid := auth.uid();
  v_mat  uuid;
  v_note text;
begin
  if v_char is null then
    raise exception 'not authenticated';
  end if;

  select id into v_mat
  from public.learning_material
  where slug = p_slug and is_archived = false;
  if v_mat is null then
    raise exception 'material not found: %', p_slug;
  end if;

  -- Texto em branco apaga a nota: é o mesmo gesto de limpar o campo.
  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 2000 then
    raise exception 'note too long: % chars (max 2000)', char_length(v_note);
  end if;

  update public.learning_idea_collect
     set note = v_note
   where character_id = v_char
     and material_id = v_mat
     and idea_id = p_idea_id;

  if not found then
    raise exception 'idea not collected: % / %', p_slug, p_idea_id;
  end if;

  return json_build_object(
    'has_note', v_note is not null,
    'length', coalesce(char_length(v_note), 0)
  );
end
$function$;

revoke all on function public.set_idea_note(text, text, text) from public;
grant execute on function public.set_idea_note(text, text, text) to authenticated;

comment on column public.learning_idea_collect.note is
  'Nota livre da pessoa sobre a ideia absorvida. Escrita só por set_idea_note(); nunca cria a linha de coleta (isso cunharia XP).';
