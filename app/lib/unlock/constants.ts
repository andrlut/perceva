/**
 * Trancas progressivas — o que existe, quando destrava, e o kill-switch.
 * Doc: "Onboarding simples — proposta" (Fase 2), decisões de 18–19/10.
 */

/** OTA kill-switch: false = nada tranca, portas não aparecem. */
export const UNLOCK_GATES_ENABLED: boolean = true;

/**
 * Contas criadas antes disto recebem tudo aberto (`grandfather`): quem já
 * usa o app nunca perde acesso. AJUSTAR PRA DATA DO PROMOTE em produção
 * (hoje aponta pro início dos testes, pra contas novas de teste verem as
 * trancas).
 */
export const GATES_SINCE = '2026-10-19T00:00:00Z';

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

/** Features that live behind a tab (lock icon in the nav bar). */
export const TAB_FEATURE: Record<string, UnlockFeature | undefined> = {
  rewards: 'rewards',
  learning: 'learning',
  character: 'me',
};
