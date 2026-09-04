-- migration: 20260904000001_reward_template_pt.sql
-- purpose: traduzir de verdade as 23 recompensas do catálogo para pt-BR
--
-- affected tables: public.reward_template (title_pt, description_pt)
-- new rpcs:        none
-- breaking?        no — só conteúdo; nenhuma coluna, tipo ou policy muda
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
--   POR QUE ISSO EXISTIA QUEBRADO: 20260506000001 (locale_columns) precisava
--   marcar title_pt/description_pt como NOT NULL na mesma transação em que
--   as criou, então fez um backfill-placeholder — `set title_pt = title` nas
--   linhas 106-109 — copiando o INGLÊS para dentro da coluna portuguesa. O
--   cabeçalho daquela migration (linhas 17-22) prometia um "follow-up content
--   PR" para quitar o placeholder. Ele nunca veio. Resultado: a vitrine de
--   recompensas mostrava inglês nos DOIS idiomas, porque pick() (em
--   app/lib/i18n/catalog.ts:20-23) devolve o _pt sempre que ele não está
--   vazio — e ele não estava, estava em inglês. Esta migration quita esse
--   placeholder para reward_template.
--
--   title/description continuam sendo a fonte EN e NÃO são tocados: a tela
--   resolve o idioma em render (TemplateCard) e o dedupe da Vault casa
--   contra os dois títulos.
--
--   Ainda em aberto (mesma dívida, outras tabelas):
--     - public.skill  → display_name_pt/description_pt/population_stat_pt
--       receberam o mesmo placeholder em 20260506000001:112-115
--     - public.task_template → o bug ESPELHADO: nunca ganhou colunas de
--       locale e o seed é pt-BR puro, então quem usa o app em inglês vê as
--       sugestões de prática em português

begin;

-- ─── INDULGÊNCIAS (baratas, recorrentes, o loop rápido) ────────────────────
update public.reward_template set
  title_pt       = 'Café especial',
  description_pt = 'Um agrado pra você.'
where id = 'coffee';

update public.reward_template set
  title_pt       = '30 min de TV sem culpa',
  description_pt = 'Série, documentário, bobagem. Sem celular.'
where id = 'tv30';

update public.reward_template set
  title_pt       = '1 hora de jogo',
  description_pt = 'Sem grind, sem meta — só jogar.'
where id = 'gaming1h';

update public.reward_template set
  title_pt       = 'Sobremesa',
  description_pt = 'Sorvete. Brigadeiro. O que for.'
where id = 'dessert';

update public.reward_template set
  title_pt       = 'Noite de cinema',
  description_pt = 'Você escolhe o filme. E faz a pipoca.'
where id = 'movie';

update public.reward_template set
  title_pt       = 'Pedir comida',
  description_pt = 'Sem cozinhar, sem louça, sem julgamento.'
where id = 'takeout';

update public.reward_template set
  title_pt       = 'Uma gelada',
  description_pt = 'Cerveja, ou o que preferir. Depois de merecer.'
where id = 'beer';

update public.reward_template set
  title_pt       = 'Dia de descanso sem culpa',
  description_pt = 'Sem checklist, sem app, sem vergonha.'
where id = 'restday';

update public.reward_template set
  title_pt       = 'Álbum novo, do começo ao fim',
  description_pt = 'Fone no ouvido. Mundo desligado.'
where id = 'musicsession';

-- ─── BENS (compra única, material — dá pra juntar) ─────────────────────────
update public.reward_template set
  title_pt       = 'Livro novo',
  description_pt = 'Pra pilha. Ou pra finalmente começar.'
where id = 'book';

update public.reward_template set
  title_pt       = 'Fone sem fio',
  description_pt = 'Aposentar o que está morrendo.'
where id = 'headphones';

update public.reward_template set
  title_pt       = 'Tênis de corrida',
  description_pt = 'Um cuidado com os pés que te carregam.'
where id = 'runningshoes';

update public.reward_template set
  title_pt       = 'Teclado mecânico',
  description_pt = 'Terapia em forma de clique.'
where id = 'keyboard';

update public.reward_template set
  title_pt       = 'Celular novo',
  description_pt = 'Quando o atual realmente não dá mais.'
where id = 'phone';

update public.reward_template set
  title_pt       = 'Eletrodoméstico grande',
  description_pt = 'Geladeira, máquina — as trocas sem graça.'
where id = 'appliance';

update public.reward_template set
  title_pt       = 'Item dos sonhos',
  description_pt = 'Aquela coisa grande da lista de desejos.'
where id = 'dreamitem';

-- ─── EXPERIÊNCIAS (única, não material) ────────────────────────────────────
update public.reward_template set
  title_pt       = 'Jantar bom fora',
  description_pt = 'Restaurante de verdade, não delivery.'
where id = 'dinner';

update public.reward_template set
  title_pt       = 'Show ao vivo',
  description_pt = 'Luz, som e gente junto.'
where id = 'concert';

update public.reward_template set
  title_pt       = 'Curso ou workshop',
  description_pt = 'Aprender algo novo de propósito.'
where id = 'course';

update public.reward_template set
  title_pt       = 'Viagem de fim de semana',
  description_pt = 'Dois dias em qualquer lugar que não aqui.'
where id = 'weekendtrip';

update public.reward_template set
  title_pt       = 'Massagem ou dia de spa',
  description_pt = 'O corpo agradece.'
where id = 'massage';

update public.reward_template set
  title_pt       = 'Viagem grande pra fora',
  description_pt = 'Passaporte, mala, o pacote completo.'
where id = 'bigtrip';

update public.reward_template set
  title_pt       = 'Ingresso de jogo ou evento',
  description_pt = 'Partida, luta, corrida — o que for.'
where id = 'event';

-- Trava de segurança: se algum id acima tiver sido renomeado, esta migration
-- passaria silenciosamente e deixaria inglês na coluna. Falhe alto em vez.
do $$
declare
  n int;
begin
  select count(*) into n
    from public.reward_template
   where title_pt = title;
  if n > 0 then
    raise exception
      'reward_template: % linha(s) ainda com title_pt == title (inglês). '
      'Confira os ids contra o seed de 20260501000006.', n;
  end if;
end $$;

commit;
