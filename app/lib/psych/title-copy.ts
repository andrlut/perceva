import type { BigFiveBucket, BigFiveTrait } from '@/lib/psych/big-five-content';
import type { EcrStyle } from '@/lib/psych/ecr-r-content';
import type { SchwartzMeta } from '@/lib/psych/schwartz-content';
import type { StrengthSlug } from '@/lib/psych/strengths-content';

/**
 * Títulos para os quatro instrumentos que não tinham nome em forma de
 * TÍTULO — só rótulo.
 *
 * DISC e Tipos já nascem com nome ("O Relojoeiro", "O Farol Silencioso").
 * Os outros quatro produzem rótulos de escala: "Curiosidade", "Abertura",
 * "Seguro", "Auto-Transcendência". Nenhum deles se sustenta sob o nome de
 * alguém — "Curiosidade" não é um título, é uma medida. Aqui cada rótulo
 * vira uma pessoa.
 *
 * Três regras que valem para todos:
 *
 *   1. Nada de linguagem clínica ou de diagnóstico. Apego é o caso mais
 *      sensível: "Ansioso" e "Evitante" são categorias de pesquisa, e sob
 *      um nome viram rótulo de defeito. Aqui são descritos como jeito de
 *      se ligar, não como falha.
 *   2. Big Five é NÃO-HIERÁRQUICO por decisão travada (#122-#126), então
 *      os dois polos de cada traço ganham título e nenhum é "melhor". Só
 *      a faixa do meio fica de fora — meio-termo não é assinatura.
 *   3. Sem superlativo e sem épico. "O Guerreiro" está fora do vocabulário
 *      desta marca tanto quanto "gamifique sua vida".
 */

export interface TitleCopy {
  pt: string;
  en: string;
}

/** Forças de Caráter — a força de assinatura vira a pessoa. */
export const STRENGTH_TITLES: Record<StrengthSlug, TitleCopy> = {
  creativity: { pt: 'Quem Inventa Jeito', en: 'The One Who Finds a Way' },
  curiosity: { pt: 'Curioso por Natureza', en: 'Curious by Nature' },
  judgment: { pt: 'Quem Pesa Antes', en: 'The One Who Weighs First' },
  love_of_learning: { pt: 'Aprendiz Permanente', en: 'Lifelong Learner' },
  perspective: { pt: 'Quem Enxerga de Longe', en: 'The Long View' },
  bravery: { pt: 'Quem Encara', en: 'The One Who Faces It' },
  perseverance: { pt: 'Quem Não Larga', en: 'The One Who Holds On' },
  honesty: { pt: 'De Palavra', en: 'Good for Their Word' },
  zest: { pt: 'Cheio de Vida', en: 'Full of Life' },
  love: { pt: 'Quem Se Apega de Verdade', en: 'The One Who Truly Bonds' },
  kindness: { pt: 'Quem Estende a Mão', en: 'The One Who Lends a Hand' },
  social_intelligence: { pt: 'Quem Lê a Sala', en: 'The One Who Reads the Room' },
  teamwork: { pt: 'Quem Puxa Junto', en: 'The One Who Pulls Together' },
  fairness: { pt: 'Quem Divide Igual', en: 'The Even Hand' },
  leadership: { pt: 'Quem Toma a Frente', en: 'The One Who Steps Up' },
  forgiveness: { pt: 'Quem Vira a Página', en: 'The One Who Turns the Page' },
  humility: { pt: 'Sem Alarde', en: 'Without Fanfare' },
  prudence: { pt: 'Passo Firme', en: 'Steady Step' },
  self_regulation: { pt: 'Quem Se Segura', en: 'The One Who Holds Steady' },
  appreciation_of_beauty: { pt: 'Quem Repara', en: 'The One Who Notices' },
  gratitude: { pt: 'Quem Agradece', en: 'The Grateful One' },
  hope: { pt: 'Quem Aposta no Depois', en: 'The One Who Bets on Later' },
  humor: { pt: 'Quem Alivia o Ar', en: 'The One Who Lightens the Air' },
  spirituality: { pt: 'Quem Busca Sentido', en: 'The One Who Seeks Meaning' },
};

/** Valores — o meta-valor dominante, os quatro do modelo de Schwartz. */
export const SCHWARTZ_META_TITLES: Record<SchwartzMeta, TitleCopy> = {
  self_transcendence: { pt: 'Movido por Outros', en: 'Moved by Others' },
  self_enhancement: { pt: 'Movido por Conquista', en: 'Moved by Achievement' },
  openness_to_change: { pt: 'Movido pelo Novo', en: 'Moved by the New' },
  conservation: { pt: 'Movido por Raiz', en: 'Moved by Roots' },
};

/**
 * Apego — jeito de se ligar, nunca diagnóstico.
 *
 * Os nomes de pesquisa (preocupado, evitante, temeroso) descrevem o que
 * falta. Estes descrevem o que a pessoa faz, que é a mesma informação sem
 * a sentença.
 */
export const ECR_STYLE_TITLES: Record<EcrStyle, TitleCopy> = {
  secure: { pt: 'Base Segura', en: 'Secure Base' },
  preoccupied: { pt: 'Coração Atento', en: 'Attentive Heart' },
  dismissive: { pt: 'Espaço Próprio', en: 'Room of Their Own' },
  fearful: { pt: 'Passo Cauteloso', en: 'Careful Step' },
};

/**
 * Big Five — o traço mais DISTINTIVO, nos dois polos.
 *
 * Distintividade, e não maior nota: por nota, neuroticismo alto viraria a
 * assinatura de identidade de alguém, e a própria tela de resultado diz
 * que cada traço é espectro e não nota. A faixa do meio não gera título.
 */
export const BIG_FIVE_TITLES: Record<
  BigFiveTrait,
  Partial<Record<BigFiveBucket, TitleCopy>>
> = {
  openness: {
    high: { pt: 'Mente Aberta', en: 'Open Mind' },
    low: { pt: 'Pés no Chão', en: 'Feet on the Ground' },
  },
  conscientiousness: {
    high: { pt: 'Quem Termina', en: 'The Finisher' },
    low: { pt: 'Quem Improvisa', en: 'The Improviser' },
  },
  extraversion: {
    high: { pt: 'Quem Chega Junto', en: 'The One Who Shows Up' },
    low: { pt: 'Quem Prefere o Miúdo', en: 'The One Who Prefers Small' },
  },
  agreeableness: {
    high: { pt: 'Quem Cede Primeiro', en: 'The First to Give' },
    low: { pt: 'Quem Diz na Cara', en: 'The One Who Says It Plain' },
  },
  neuroticism: {
    high: { pt: 'Quem Sente Fundo', en: 'The One Who Feels Deep' },
    low: { pt: 'Quem Não Se Abala', en: 'The Unshaken' },
  },
};
