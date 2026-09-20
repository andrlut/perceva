-- migration: 20260920000001_economy_server_only.sql
-- purpose: fecha dois furos pré-existentes da economia — o cliente podia escrever direto em
--          character/character_dimension, e um overload legado de complete_task continuava
--          exposto no schema
--
-- affected tables: character, character_dimension — só privilégios e policies, nenhuma DDL de dados
-- rpcs:            drop de public.complete_task(uuid, timestamptz), o overload legado
-- breaking?        no — o app só LÊ as duas tabelas (app/lib/api/character.ts, linhas 34 e 40) e
--                  só chama complete_task pela assinatura de 5 args (app/lib/api/tasks.ts:486).
--                  Sem OTA: a mudança é 100% servidor.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   economia de um jogador só: os dois furos afetam apenas o saldo de quem chama, então isto é
--   integridade/endurecimento, não vazamento de dado alheio
--
-- ──────────────────────────────────────────────────────────────────────────
-- FURO 1 — character era escrevível pelo cliente
--
--   A policy character_self_update nasceu no schema inicial (20260501000001) e nunca caiu:
--   `for update to authenticated using (id = auth.uid())`. Com ela, um PATCH no PostgREST
--   reescrevia coins e total_xp — a economia inteira (recompensa custa moeda; o dono se cobra
--   moeda por vício) contornada numa requisição. character_dimension era pior: char_dim_self_all
--   é `for all`, então INSERT e DELETE no XP por dimensão também passavam.
--
--   O conserto NÃO pode ser revoke por coluna. O authenticated tem grant de TABELA
--   (relacl = authenticated=arwdDxtm/postgres, e attacl vazio em todas as colunas), e no
--   Postgres revogar privilégio de coluna não morde um grant de tabela: um
--   `revoke update (coins, total_xp)` passaria sem erro e sem efeito nenhum. Por isso aqui é
--   `revoke all` + `grant select` — o privilégio volta explícito, um só, e fica legível.
--
--   Também não há coluna legítima a preservar. character tem id, total_xp, coins, created_at,
--   updated_at e allow_partial_quest_reward, e nenhuma é escrita pelo cliente hoje (o toggle
--   de recompensa parcial não tem UI; só a RPC de expiração o lê). Quem escreve são as RPCs
--   SECURITY DEFINER, que rodam como postgres — dono das tabelas, portanto acima da RLS e
--   destes grants. handle_new_user() também é SECURITY DEFINER, então o cadastro segue criando
--   character e character_dimension normalmente.
--
--   Fica valendo o invariante: o cliente LÊ character e character_dimension, e só. Escrita nova
--   entra como RPC, que é onde a regra da economia já mora.
--
--   TRUNCATE entra no revoke de propósito: ele ignora RLS. Enquanto authenticated tivesse o
--   privilégio, a única coisa que segurava um TRUNCATE em character era o PostgREST não saber
--   emitir um.
--
-- FURO 2 — overload legado de complete_task
--
--   public.complete_task(uuid, timestamptz) é anterior ao modelo multi-sub
--   (20260501000007_retroactive_completion / 20260502000001_streak_multiplier): SECURITY DEFINER,
--   EXECUTE pra PUBLIC e anon, lê task.difficulty e aplica streak_multiplier. A coluna difficulty
--   não existe mais, então hoje ele só estoura em runtime — mas é uma porta de cunhagem
--   SECURITY DEFINER parada no schema, carregando o bônus de streak que a Momentum aposentou e
--   que não deve voltar por cima dela. A #421 derrubou os overloads de 4 args e passou por este.
--
--   Ninguém chama com dois args: o app manda p_local_date em toda chamada (tasks.ts:486), e nem
--   SQL das migrations, nem Edge Function (perceva-mcp), nem view ou trigger referenciam a
--   assinatura. Depois deste drop sobra um único candidato por nome pro PostgREST, como a #421
--   já queria.
--
--   Detalhe que o teste levantou: os args 3..5 da assinatura de 5 têm DEFAULT NULL, então uma
--   chamada POSICIONAL com dois args passa a cair nela em vez de estourar. É o desfecho que se
--   quer — o caminho moderno, sem streak — e não muda nada pro app, que chama por nome. Pela
--   mesma razão o `grant execute` da de 5 args não é tocado aqui: a #421 já deixou EXECUTE só
--   pra authenticated nela.
-- ──────────────────────────────────────────────────────────────────────────

begin;

-- ── FURO 1 — character e character_dimension viram somente-leitura pro cliente ──

revoke all on table public.character from authenticated, anon;
revoke all on table public.character_dimension from authenticated, anon;

grant select on table public.character to authenticated;
grant select on table public.character_dimension to authenticated;

-- character_self_select fica: é por ela que o app lê a linha (app/lib/api/character.ts:34).
-- As duas de escrita saem — insert incluso: a linha sempre nasce do handle_new_user(), e a
-- policy só servia pra deixar criar um character com saldo escolhido caso a linha faltasse.
drop policy if exists "character_self_update" on public.character;
drop policy if exists "character_self_insert" on public.character;

-- char_dim_self_all é `for all`, então cobre também o SELECT que o app precisa
-- (character.ts:40). Trocada por uma de leitura — dropar sem repor derrubaria a home junto.
drop policy if exists "char_dim_self_all" on public.character_dimension;

create policy "char_dim_self_select" on public.character_dimension
  for select to authenticated
  using (character_id = auth.uid());

comment on table public.character is
  'Economia do personagem (total_xp, coins). Somente leitura pelo cliente desde '
  '20260920000001: XP e moedas mudam só pelas RPCs SECURITY DEFINER (complete_task, '
  'complete_template, delete_task_completion, redeem_reward, complete_quest, ...).';

comment on table public.character_dimension is
  'XP por dimensão. Somente leitura pelo cliente desde 20260920000001 — escrita só pelas '
  'RPCs SECURITY DEFINER.';

-- ── FURO 2 — overload legado de complete_task ──

drop function if exists public.complete_task(uuid, timestamptz);

commit;
