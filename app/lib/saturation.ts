/**
 * Saturação — a régua fixa de "quanto é bastante" numa área (sub).
 *
 * Uma sub ENCHE com 300 XP a cada 30 dias: é o mínimo de uma prática de 1★
 * (10 XP) feita todo dia. Passou disso, a área está cheia — energia a mais
 * numa área só não aumenta o desenho. É isso que faz o formato falar de
 * equilíbrio, a filosofia do app: treinar tudo, não uma coisa só.
 *
 * Validado contra os dados do dono (set/2026): com 300, quatro das doze
 * áreas enchem em 30 dias, e as que ficam vazias são as que ele de fato não
 * treina (ou nem tem prática recorrente configurada).
 *
 * Uma constante, dois lugares que a leem, pra as telas nunca divergirem:
 *   - Eu → Praticada: cada ponta do hex e cada barra enchem até ela;
 *   - Perfil → Emblema: a área acende com ela, e o disco cheio é o XP de
 *     ter enchido as doze (12 × 300 = 3.600).
 */
export const SUB_SATURATION_30D = 300;

/** A régua proporcional a uma janela de `days` dias (semana ≈ 70, trimestre ≈ 840). */
export function subSaturationFor(days: number): number {
  return (SUB_SATURATION_30D * Math.max(1, days)) / 30;
}

/**
 * Dias da janela que já passaram. A régua de um período em andamento conta
 * só esses: no dia 19 do mês a área enche com 190, não com 310 — senão todo
 * mês corrente pareceria vazio. Janelas fechadas contam inteiras.
 */
export function elapsedDays(start: Date, end: Date, now: Date = new Date()): number {
  const last = end.getTime() < now.getTime() ? end : now;
  return Math.max(1, Math.floor((last.getTime() - start.getTime()) / 86400000) + 1);
}
