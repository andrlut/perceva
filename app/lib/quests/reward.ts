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
 * Teto do XP — 2× o tier mais alto do catálogo (20★ = 200 XP).
 *
 * XP é MEDIDA, não moeda: alimenta a curva de nível e o hex da Dedicação,
 * que são leituras sobre o quanto a pessoa praticou. Deixar o usuário
 * digitar XP seria deixá-lo calibrar a própria balança — o resultado não é
 * "gastar errado", é ACREDITAR errado, e é exatamente o que o pilar da
 * identidade praticada existe para manter honesto. Por isso o XP continua
 * derivado e com teto, e a moeda não.
 */
export const MAX_QUEST_XP = 400;

/**
 * Teto da SUGESTÃO de moedas. Não é limite do valor final: a partir de
 * 2026-09-07 o usuário edita o número livremente (decisão do dono — "quero
 * colocar uma quest de dieta de 30 dias que paga 500 moedas porque é muito
 * desafio pra mim").
 *
 * Abrir foi a decisão certa por três razões:
 *   1. Moeda é dinheiro que a pessoa gasta com ela mesma, e ela já define
 *      os preços do Vault. Não há outra pessoa nesta economia.
 *   2. Estrela mede VOLUME de prática, não dificuldade. As mesmas 60★ são
 *      brutais para uma pessoa e triviais para outra; a fórmula não tem
 *      como saber, o usuário tem.
 *   3. A trava era teatro: `quest` só tem `check (reward_coins >= 0)` e
 *      `start_custom_quest` repassa o payload. O clamp era client-side,
 *      então prendia apenas quem usava a tela honestamente.
 */
const MAX_QUEST_COINS = 80;

/** Bound do CAMPO editável — pega dedo gordo, não define política. */
export const MAX_COINS_INPUT = 99999;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Recompensa SUGERIDA a partir do total de estrelas exigidas.
 *
 * O XP daqui é final. As moedas são só o valor inicial do campo: assim que
 * o usuário digita, o número dele manda (ver `quest-create.tsx`).
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
