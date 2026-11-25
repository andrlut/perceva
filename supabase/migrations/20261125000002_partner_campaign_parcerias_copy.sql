-- migration: 20261125000002_partner_campaign_parcerias_copy.sql
-- purpose: título e texto da campanha da Paker Health no modelo "Parcerias"
--          (caminho B da revisão de 25/11): os cupons em Recompensas, as
--          práticas da campanha como sugestão, nenhum desafio.
--
-- affected tables: partner_campaign (só a linha 'paker-health', só texto)
-- new rpcs:        none
-- breaking?       no — o texto serve ao app da loja de hoje e ao novo: não cita
--                  a aba "Parcerias", que só existe a partir da versão nova
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   o servidor do desafio (streak_goal, _partner_streak, secure_partner_unlock)
--   continua como está, dormente: o app deixa de mostrá-lo

begin;

update public.partner_campaign
set title_pt = 'Parceria Paker Health',
    title_en = 'Paker Health partnership',
    pitch_pt = 'Seus cupons da Paker Health estão em Recompensas: 10% pra todo mundo e 17% pra assinantes Premium. Quer lembrar do suplemento? Coloque a prática na sua lista.',
    pitch_en = 'Your Paker Health coupons are in Rewards: 10% for everyone and 17% for Premium subscribers. Want a reminder to take your supplement? Add the practice to your list.'
where id = 'paker-health';

commit;
