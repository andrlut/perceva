-- migration: 20260908000001_profile_about.sql
-- purpose: dois campos de contexto que o usuário escreve sobre si — profissão
--          e uma nota livre — para o conector responder a partir da vida dele,
--          e não só dos números.
--
-- affected tables: profile (duas colunas novas)
-- new rpcs:        none
-- breaking?        no — colunas aditivas e anuláveis, nada existente muda
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
--   O QUE FICOU DE FORA, E POR QUÊ. Peso, altura e sexo foram avaliados e
--   recusados. O motivo não é que sejam tabu — o app já trata dado sensível
--   de saúde (a série de humor com notas é saúde mental, classificada assim
--   em docs/retro-lgpd-consentimento.md). É que a LGPD exige finalidade
--   ESPECÍFICA por categoria (Art. 11, I), e coletar "por via das dúvidas"
--   não se sustenta: nenhuma conta deste app usa peso ou altura. O único uso
--   seria recomendação nutricional ou de treino, que é exatamente o que o
--   posicionamento veta (sem coach, sem prescrição). Sexo não muda nenhuma
--   resposta que o produto dá.
--
--   `about` é texto livre e, como as notas de humor, pode conter qualquer
--   categoria sensível — inclusive sobre terceiros. Duas consequências que o
--   cliente precisa honrar: a finalidade é dita NO CAMPO ("isto vai para o
--   Claude quando você usa o conector"), e o campo nasce vazio, então
--   preencher é o ato de consentir com aquela finalidade. Nada aqui é
--   inferido nem preenchido pelo app.
--
--   Colunas simples em vez de jsonb: são dois escalares com limite de
--   tamanho, e coluna tipada valida no banco. Também NÃO entram em
--   `profile.identity`, que significa "personalização do Emblema" — misturar
--   contexto de vida com cosmético repetiria o erro que já evitamos ao não
--   usar `profile.modules` para isso.

begin;

alter table public.profile
  add column if not exists profession text,
  add column if not exists about text;

do $$ begin
  alter table public.profile
    add constraint profile_profession_len
    check (profession is null or char_length(profession) <= 80);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.profile
    add constraint profile_about_len
    check (about is null or char_length(about) <= 600);
exception when duplicate_object then null;
end $$;

comment on column public.profile.profession is
  'O que a pessoa faz, em texto curto. Escrito por ela; muda a textura do que '
  'o conector diz sobre carreira e sobre o tempo do dia.';

comment on column public.profile.about is
  'Nota livre de contexto ("o que estou vivendo agora"). Escrita pela pessoa '
  'com a finalidade declarada de informar o conector. Pode conter dado '
  'sensível: tratar com o mesmo cuidado das notas de humor.';

commit;
