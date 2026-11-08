/**
 * Trancas progressivas — o que existe, quando destrava, e o kill-switch.
 * Doc: "Onboarding simples — proposta" (Fase 2), decisões de 18–19/10.
 */

/** OTA kill-switch: false = nada tranca, portas não aparecem. */
export const UNLOCK_GATES_ENABLED: boolean = true;

/**
 * Contas criadas antes disto recebem tudo aberto (`grandfather`): quem já
 * usa o app nunca perde acesso. Fixado na data do promote em produção
 * (2026-11-04): só contas criadas a partir daí veem as trancas.
 */
export const GATES_SINCE = '2026-11-04T00:00:00Z';

export const UNLOCK_FEATURES = [
  /** Aba Recompensas (e as moedas). */
  'rewards',
  /** Aba Aprender (Recanto). */
  'learning',
  /** Aba Eu, com o primeiro retrato (Percebida). */
  'me',
  /** Eu · Praticada. */
  'me_practiced',
  /** Eu · Desejada. */
  'me_desired',
] as const;

export type UnlockFeature = (typeof UNLOCK_FEATURES)[number];

/** Gatilhos de progressão — chute inicial, ajustar com os dados do funil. */
export const UNLOCK_TRIGGERS = {
  /** Recompensas: a N-ésima prática feita ("você juntou moedas"). */
  rewardsAfterCompletions: 3,
  /** Praticada: dias distintos com ao menos uma prática feita. */
  practicedAfterDays: 7,
} as const;

/**
 * The one idea the Recanto card on Hoje shows while Aprender is locked
 * (André, 19/10: a fixed, strong idea about habits — not the "66 days" one).
 * From the Atomic Habits summary: "O hábito pega quando vira identidade".
 */
export const RECANTO_CARD_IDEA = {
  slug: 'summary-atomic-habits',
  ideaId: 'voto-na-identidade',
} as const;

/** Features that live behind a tab (lock icon in the nav bar). */
export const TAB_FEATURE: Record<string, UnlockFeature | undefined> = {
  rewards: 'rewards',
  learning: 'learning',
  character: 'me',
};
