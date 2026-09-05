/**
 * Recompensa de uma missão/meta personalizada — fonte única.
 *
 * A taxa NÃO é palpite: sai do catálogo de missões de sistema
 * (20260527000002_quest_templates_sub_stars.sql), que paga
 *
 *     20★ → 200 XP / 40 moedas      (janela de 30 dias)
 *     12★ → 120 XP / 24 moedas      (janela de 21 dias)
 *      8★ →  80 XP / 16 moedas      (janela de 14 dias)
 *
 * Dez XP e duas moedas por estrela nos três tiers, com durações
 * diferentes. Ou seja: no modelo do catálogo, DIFICULDADE é a estrela e
 * PRAZO é só a janela em que ela cabe — a mesma missão em 14 ou em 30
 * dias vale o mesmo. É por isso que a fórmula antiga desta tela
 * (`50 + 10 * dias`) estava errada em espécie, não só em escala: ela
 * pagava pelo tempo, então esticar o prazo aumentava o prêmio de uma
 * missão mais FÁCIL.
 *
 * Derivar em vez de pedir dois números ao usuário é deliberado (decisão
 * do dono, 2026-09-04: "na minha opinião deveria ser igual sempre"):
 * elimina a decisão, e torna impossível criar uma missão que paga
 * desproporcional ao que exige.
 */

/** XP por estrela exigida. Ancorado no catálogo de sistema. */
export const XP_PER_STAR = 10;

/** Moedas por estrela exigida. Ancorado no catálogo de sistema. */
export const COINS_PER_STAR = 2;

/** Piso — uma missão trivial ainda precisa valer alguma coisa. */
const MIN_XP = 20;
const MIN_COINS = 4;

/**
 * Teto — 2× o tier mais alto do catálogo (20★ = 200 XP). Existe para que
 * um alvo absurdo (500★) não vire uma fábrica de XP que distorce a curva
 * de nível, que é linear em (nível-1)×100.
 */
export const MAX_QUEST_XP = 400;
const MAX_QUEST_COINS = 80;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Recompensa derivada do total de estrelas exigidas pela missão.
 * `totalStars` é a soma dos alvos de todos os requisitos.
 */
export function deriveQuestReward(totalStars: number): {
  xp: number;
  coins: number;
} {
  const stars = Number.isFinite(totalStars) ? Math.max(0, totalStars) : 0;
  return {
    xp: clamp(Math.round(stars * XP_PER_STAR), MIN_XP, MAX_QUEST_XP),
    coins: clamp(Math.round(stars * COINS_PER_STAR), MIN_COINS, MAX_QUEST_COINS),
  };
}
