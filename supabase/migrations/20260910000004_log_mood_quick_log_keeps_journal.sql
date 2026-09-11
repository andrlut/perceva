-- migration: 20260910000004_log_mood_quick_log_keeps_journal.sql
-- purpose: um registro rápido (só o humor) não apaga mais a nota e as tags do dia
--
-- affected tables: none (só a RPC log_mood)
-- new rpcs:        none — create or replace da log_mood, MESMA assinatura e retorno
-- breaking?        no — só muda o que acontece numa chamada com nota E tags nulas
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
-- O DEFEITO
--   log_mood (20260713000002) faz upsert cego:
--     on conflict (character_id, logged_for) do update set
--       mood = excluded.mood, note = excluded.note, tags = excluded.tags
--   O registro rápido — tocar numa carinha na Home ou na folha da noite — manda
--   só {p_mood}. Se o dia já tinha nota e tags, elas eram substituídas por null.
--   O caminho é real: o cache "sem registro" do cliente pode ter horas (o app
--   não refaz a leitura ao voltar pro primeiro plano), e o dia pode ter sido
--   registrado nesse meio-tempo pelo MCP (por voz), em outro aparelho, ou numa
--   versão do app sem as guardas de cliente. As guardas do #400 protegem só as
--   versões novas e só os casos que conseguem enxergar; a única proteção que
--   vale pra todo cliente — inclusive os binários antigos em campo — é aqui.
--
-- A REGRA
--   Uma chamada com p_note E p_tags nulos é um REGISTRO RÁPIDO: atualiza o humor
--   e PRESERVA a nota e as tags do dia. Qualquer outra chamada é uma EDIÇÃO
--   COMPLETA e substitui, exatamente como antes.
--
-- POR QUE ESTA REGRA E NÃO "null = manter"
--   A tela completa manda a nota apagada como null (`note.trim() || null`), então
--   "null = manter o que existe" tornaria impossível apagar uma nota. O que
--   distingue os dois casos é outra coisa: a tela completa SEMPRE manda o array
--   de tags (`tagsDraft ?? savedTags`, com savedTags = tags ?? []), em toda
--   versão desde a #268, enquanto o registro rápido não manda nem nota nem tags:
--     tela completa, nota apagada, tags desmarcadas -> p_note null, p_tags {}   -> substitui (apaga as duas)
--     tela completa, com nota e/ou tags             -> substitui (como antes)
--     registro rápido                               -> p_note null, p_tags null -> PRESERVA
--
-- COMPATIBILIDADE
--   Nenhum cliente em campo muda de comportamento. A exceção conhecida é o
--   bundle da #267 (fase 1, antes de existirem tags), que mandava {mood, note}
--   sem tags: nele, apagar a nota viraria registro rápido e a nota antiga
--   ficaria. #267 e #268 são ambas de 2026-07-14, antes do lançamento na Play
--   (2026-07-15), então esse código não existe em campo. O MCP não usa esta RPC
--   (faz o próprio read -> merge -> upsert sob RLS). Uma chamada com só a nota,
--   sem tags, continua substituindo as tags — nenhum chamador faz isso.
--
-- SEGURANÇA
--   Mesmo SECURITY DEFINER, mesma checagem de auth.uid(), mesmo alvo de conflito
--   (character_id = auth.uid(), logged_for). O CASE só lê a linha em conflito,
--   que por construção é do PRÓPRIO usuário — a mesma que o upsert já podia
--   sobrescrever. Nenhuma superfície nova, nenhum grant novo.
--
-- VALIDAÇÃO
--   Revisão adversarial (segurança, semântica, SQL): zero achados confirmados.
--   Teste real no banco de produção dentro de um único bloco DO terminado em
--   exceção (rollback garantido da DDL e das escritas): semear entrada completa
--   -> registro rápido preservou nota e tags -> edição completa apagou as duas
--   -> registro rápido em dia vazio inseriu. Conferido depois que a função em
--   produção seguia a original e que nenhuma linha sentinela ficou.

begin;

create or replace function public.log_mood(
  p_mood       smallint,
  p_note       text default null,
  p_logged_for date default current_date,
  p_tags       text[] default null
) returns public.mood_log
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row   public.mood_log;
  v_tags  text[];
  -- Registro rápido: só o humor, sem nota E sem tags. Ver o cabeçalho.
  v_quick boolean := p_note is null and p_tags is null;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_mood < 1 or p_mood > 5 then
    raise exception 'Mood must be 1-5, got %', p_mood;
  end if;
  -- Retroactive logging allowed for any past day (history day view); only the
  -- future is blocked. +1 absorbs device-vs-UTC timezone skew for "today".
  if p_logged_for > current_date + 1 then
    raise exception 'Cannot log mood for a future day';
  end if;

  -- Keep only known, active tag slugs (drop anything the client sent that
  -- isn't in the catalog); null when nothing valid remains.
  if p_tags is not null then
    select array_agg(mt.slug order by mt.sort_order)
      into v_tags
      from public.mood_tag mt
      where mt.slug = any (p_tags) and mt.is_active;
  end if;

  insert into public.mood_log as ml (character_id, logged_for, mood, note, tags)
  values (auth.uid(), p_logged_for, p_mood, nullif(btrim(p_note), ''), v_tags)
  on conflict (character_id, logged_for)
  do update set
    mood = excluded.mood,
    -- Registro rápido: a nota e as tags do dia ficam. Edição completa: substitui.
    note = case when v_quick then ml.note else excluded.note end,
    tags = case when v_quick then ml.tags else excluded.tags end,
    updated_at = now()
  returning * into v_row;

  return v_row;
end $$;

grant execute on function public.log_mood(smallint, text, date, text[]) to authenticated;

commit;
