// Autoconhecimento: os seis instrumentos, derivados aqui.
//
// Mesma doutrina do `isOpenOnDay` que já vive no index.ts: a regra é
// PORTADA VERBATIM do cliente, não reescrita em SQL. Derivar um blend DISC
// ou um código de quatro letras em Postgres criaria uma segunda
// implementação da mesma pergunta, e a primeira vez que uma das duas
// mudasse o app e o conector passariam a discordar sobre quem o usuário é.
// Aqui, se `app/lib/psych/*-content.ts` mudar, este arquivo tem que mudar
// junto — e o teste é olhar os dois lado a lado.
//
// Os NOMES também vivem no cliente (`disc-content.ts`, `types-content.ts`,
// `title-copy.ts`). Estão duplicados abaixo porque uma Edge Function não
// importa de `app/`. É duplicação consciente de conteúdo estável: são
// nomes autorais que quase não mudam, e a alternativa — devolver só
// códigos como "CS" e "INFJ" — jogaria fora justamente a parte legível.

export type Row = { facet_id: string; score_decimal: number };

// ─── DISC ────────────────────────────────────────────────────────────────

type DiscFactor = 'd' | 'i' | 's' | 'c';
const DISC_FACTOR_ORDER: DiscFactor[] = ['d', 'i', 's', 'c'];
const OPPOSITE: Record<DiscFactor, DiscFactor> = { d: 's', s: 'd', i: 'c', c: 'i' };
const BLEND_GAP = 0.75;

const DISC_NAMES: Record<string, string> = {
  D: 'O Timoneiro',
  DI: 'O Vanguardeiro',
  DC: 'O Estrategista',
  I: 'A Faísca',
  ID: 'O Catalisador',
  IS: 'O Anfitrião',
  S: 'O Porto Seguro',
  SI: 'O Tecelão',
  SC: 'O Guardião',
  C: 'O Cartógrafo',
  CD: 'O Arquiteto',
  CS: 'O Relojoeiro',
};

const DISC_FACTOR_PT: Record<DiscFactor, string> = {
  d: 'Dominância',
  i: 'Influência',
  s: 'Estabilidade',
  c: 'Conformidade',
};

/** Verbatim de app/lib/psych/disc-content.ts:blendFromScores. */
function blendFromScores(scores: Record<DiscFactor, number>): string {
  const ranked = [...DISC_FACTOR_ORDER].sort((a, b) => scores[b] - scores[a]);
  const primary = ranked[0];
  const adjacent = DISC_FACTOR_ORDER.filter(
    (f) => f !== primary && f !== OPPOSITE[primary],
  );
  const secondary =
    scores[adjacent[0]] >= scores[adjacent[1]] ? adjacent[0] : adjacent[1];
  if (scores[primary] - scores[secondary] >= BLEND_GAP) {
    return primary.toUpperCase();
  }
  return primary.toUpperCase() + secondary.toUpperCase();
}

// ─── Tipos ───────────────────────────────────────────────────────────────

type AxisSlug = 'energy' | 'perception' | 'decision' | 'organization';
const AXIS_ORDER: AxisSlug[] = ['energy', 'perception', 'decision', 'organization'];
const AXIS_LETTERS: Record<AxisSlug, { a: string; b: string }> = {
  energy: { a: 'E', b: 'I' },
  perception: { a: 'S', b: 'N' },
  decision: { a: 'T', b: 'F' },
  organization: { a: 'J', b: 'P' },
};

const TYPE_NAMES: Record<string, string> = {
  INTJ: 'O Cartógrafo do Longo Prazo',
  INTP: 'O Construtor do Possível',
  ENTJ: 'O Condutor da Travessia',
  ENTP: 'O Provocador de Ideias',
  INFJ: 'O Farol Silencioso',
  INFP: 'O Guardião do Sentido',
  ENFJ: 'O Tecelão de Pessoas',
  ENFP: 'O Semeador de Possíveis',
  ISTJ: 'O Fiador da Palavra Dada',
  ISFJ: 'O Zelador do Vínculo',
  ESTJ: 'O Maestro do Concreto',
  ESFJ: 'O Elo da Comunidade',
  ISTP: 'O Desmontador Silencioso',
  ISFP: 'O Artífice do Instante',
  ESTP: 'O Piloto do Agora',
  ESFP: 'O Acendedor de Presença',
};

/** Verbatim de types-content.ts: letterForAxis + codeFromAxisMeans. */
function codeFromAxisMeans(means: Record<AxisSlug, number>): string {
  return AXIS_ORDER.map((ax) =>
    means[ax] >= 3 ? AXIS_LETTERS[ax].a : AXIS_LETTERS[ax].b,
  ).join('');
}

/** Verbatim de types-content.ts:clarityBand — quão longe do meio (3,0). */
function clarityBand(mean: number): string {
  const d = Math.abs(mean - 3);
  if (d >= 1.5) return 'nítida';
  if (d >= 1.0) return 'marcada';
  if (d >= 0.5) return 'perceptível';
  return 'leve';
}

// ─── Apego (ECR-R) ───────────────────────────────────────────────────────

const ECR_TITLES: Record<string, string> = {
  secure: 'Base Segura',
  preoccupied: 'Coração Atento',
  dismissive: 'Espaço Próprio',
  fearful: 'Passo Cauteloso',
};

/**
 * Verbatim de ecr-r-content.ts:styleFromScales. Corte = 4, o meio de 1..7.
 * Quem está perto de 4 num dos eixos é limítrofe — daí o `borderline` no
 * retorno: sem ele, o modelo lê um rótulo como se fosse categoria dura.
 */
function styleFromScales(anxiety: number, avoidance: number): string {
  const highAnx = anxiety >= 4;
  const highAvo = avoidance >= 4;
  if (!highAnx && !highAvo) return 'secure';
  if (highAnx && !highAvo) return 'preoccupied';
  if (!highAnx && highAvo) return 'dismissive';
  return 'fearful';
}

// ─── Big Five ────────────────────────────────────────────────────────────

const BIG_FIVE_PT: Record<string, string> = {
  openness: 'Abertura',
  conscientiousness: 'Conscienciosidade',
  extraversion: 'Extroversão',
  agreeableness: 'Amabilidade',
  neuroticism: 'Sensibilidade',
};

const BIG_FIVE_TITLES: Record<string, Record<string, string>> = {
  openness: { high: 'Mente Aberta', low: 'Pés no Chão' },
  conscientiousness: { high: 'Quem Termina', low: 'Quem Improvisa' },
  extraversion: { high: 'Quem Chega Junto', low: 'Quem Prefere o Miúdo' },
  agreeableness: { high: 'Quem Cede Primeiro', low: 'Quem Diz na Cara' },
  neuroticism: { high: 'Quem Sente Fundo', low: 'Quem Não Se Abala' },
};

/** Verbatim de big-five-content.ts:bucketForTraitScore. Bruto em [24, 120]. */
function bucketForTraitScore(raw: number): string {
  const n = Math.max(0, Math.min(1, (raw - 24) / 96));
  if (n < 0.33) return 'low';
  if (n < 0.66) return 'mid';
  return 'high';
}

// ─── Forças e Valores ────────────────────────────────────────────────────

const STRENGTH_TITLES: Record<string, string> = {
  creativity: 'Quem Inventa Jeito',
  curiosity: 'Curioso por Natureza',
  judgment: 'Quem Pesa Antes',
  love_of_learning: 'Aprendiz Permanente',
  perspective: 'Quem Enxerga de Longe',
  bravery: 'Quem Encara',
  perseverance: 'Quem Não Larga',
  honesty: 'De Palavra',
  zest: 'Cheio de Vida',
  love: 'Quem Se Apega de Verdade',
  kindness: 'Quem Estende a Mão',
  social_intelligence: 'Quem Lê a Sala',
  teamwork: 'Quem Puxa Junto',
  fairness: 'Quem Divide Igual',
  leadership: 'Quem Toma a Frente',
  forgiveness: 'Quem Vira a Página',
  humility: 'Sem Alarde',
  prudence: 'Passo Firme',
  self_regulation: 'Quem Se Segura',
  appreciation_of_beauty: 'Quem Repara',
  gratitude: 'Quem Agradece',
  hope: 'Quem Aposta no Depois',
  humor: 'Quem Alivia o Ar',
  spirituality: 'Quem Busca Sentido',
};

const STRENGTH_PT: Record<string, string> = {
  creativity: 'Criatividade',
  curiosity: 'Curiosidade',
  judgment: 'Discernimento',
  love_of_learning: 'Amor ao Aprendizado',
  perspective: 'Perspectiva',
  bravery: 'Bravura',
  perseverance: 'Perseverança',
  honesty: 'Autenticidade',
  zest: 'Vitalidade',
  love: 'Amor',
  kindness: 'Bondade',
  social_intelligence: 'Inteligência Social',
  teamwork: 'Trabalho em Equipe',
  fairness: 'Senso de Justiça',
  leadership: 'Liderança',
  forgiveness: 'Perdão',
  humility: 'Humildade',
  prudence: 'Prudência',
  self_regulation: 'Autorregulação',
  appreciation_of_beauty: 'Apreciação da Beleza',
  gratitude: 'Gratidão',
  hope: 'Esperança',
  humor: 'Humor',
  spirituality: 'Propósito',
};

const META_TITLES: Record<string, string> = {
  self_transcendence: 'Movido por Outros',
  self_enhancement: 'Movido por Conquista',
  openness_to_change: 'Movido pelo Novo',
  conservation: 'Movido por Raiz',
};

const META_PT: Record<string, string> = {
  self_transcendence: 'Auto-Transcendência',
  self_enhancement: 'Auto-Promoção',
  openness_to_change: 'Abertura à Mudança',
  conservation: 'Conservação',
};

// ─── Derivação ───────────────────────────────────────────────────────────

function topOf(
  rows: Row[],
  pick: (id: string) => string | null,
): { key: string; score: number } | null {
  let best: { key: string; score: number } | null = null;
  for (const r of rows) {
    const k = pick(r.facet_id);
    if (k === null) continue;
    const v = Number(r.score_decimal);
    if (!best || v > best.score) best = { key: k, score: v };
  }
  return best;
}

const round = (n: number) => Number(n.toFixed(2));

export function deriveDisc(rows: Row[]) {
  const f = {} as Record<DiscFactor, number>;
  for (const r of rows) {
    const m = r.facet_id.match(/^disc:factor:(d|i|s|c)$/);
    if (m) f[m[1] as DiscFactor] = Number(r.score_decimal);
  }
  if (!DISC_FACTOR_ORDER.every((k) => f[k] !== undefined)) return null;
  const code = blendFromScores(f);
  return {
    code,
    title: DISC_NAMES[code] ?? code,
    factors: DISC_FACTOR_ORDER.map((k) => ({
      factor: DISC_FACTOR_PT[k],
      score: round(f[k]),
      scale: '1..5',
    })),
  };
}

export function deriveTypes(rows: Row[]) {
  const m = {} as Record<AxisSlug, number>;
  for (const r of rows) {
    const g = r.facet_id.match(/^tipos:axis:(.+)$/);
    if (g && AXIS_ORDER.includes(g[1] as AxisSlug)) {
      m[g[1] as AxisSlug] = Number(r.score_decimal);
    }
  }
  if (!AXIS_ORDER.every((a) => m[a] !== undefined)) return null;
  const code = codeFromAxisMeans(m);
  return {
    code,
    title: TYPE_NAMES[code] ?? code,
    axes: AXIS_ORDER.map((a) => ({
      axis: a,
      letter: m[a] >= 3 ? AXIS_LETTERS[a].a : AXIS_LETTERS[a].b,
      mean: round(m[a]),
      clarity: clarityBand(m[a]),
    })),
  };
}

export function deriveEcr(rows: Row[]) {
  let anxiety: number | undefined;
  let avoidance: number | undefined;
  for (const r of rows) {
    const m = r.facet_id.match(/^ecr_r:scale:(anxiety|avoidance)$/);
    if (m?.[1] === 'anxiety') anxiety = Number(r.score_decimal);
    if (m?.[1] === 'avoidance') avoidance = Number(r.score_decimal);
  }
  if (anxiety === undefined || avoidance === undefined) return null;
  const style = styleFromScales(anxiety, avoidance);
  return {
    style,
    title: ECR_TITLES[style],
    anxiety: round(anxiety),
    avoidance: round(avoidance),
    scale: '1..7, corte em 4',
    // Perto do corte o rótulo é convenção, não categoria. Dito no payload
    // para o modelo não tratar "evitante" como diagnóstico.
    borderline: Math.abs(anxiety - 4) < 0.5 || Math.abs(avoidance - 4) < 0.5,
  };
}

export function deriveBigFive(rows: Row[]) {
  const traits: { trait: string; raw: number; bucket: string; dist: number }[] = [];
  for (const r of rows) {
    const m = r.facet_id.match(/^big_five:trait:([a-z_]+)$/);
    if (!m) continue;
    const raw = Number(r.score_decimal);
    traits.push({
      trait: m[1],
      raw,
      bucket: bucketForTraitScore(raw),
      dist: Math.abs((raw - 24) / 96 - 0.5),
    });
  }
  if (traits.length === 0) return null;
  // O traço mais DISTANTE do meio, e não o de maior nota: por nota,
  // sensibilidade alta viraria a assinatura de identidade de alguém, e o
  // enquadramento não-hierárquico é decisão travada do produto.
  const signature = traits.reduce((a, b) => (b.dist > a.dist ? b : a));
  const title =
    signature.bucket === 'mid'
      ? null
      : (BIG_FIVE_TITLES[signature.trait]?.[signature.bucket] ?? null);
  return {
    signature_trait: BIG_FIVE_PT[signature.trait] ?? signature.trait,
    signature_level: signature.bucket,
    title,
    traits: traits.map((t) => ({
      trait: BIG_FIVE_PT[t.trait] ?? t.trait,
      level: t.bucket,
      raw: round(t.raw),
      scale: '24..120',
    })),
  };
}

export function deriveStrengths(rows: Row[]) {
  const ranked = rows
    .map((r) => {
      const m = r.facet_id.match(/^strengths:strength:(.+)$/);
      return m ? { slug: m[1], score: Number(r.score_decimal) } : null;
    })
    .filter((x): x is { slug: string; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return null;
  return {
    title: STRENGTH_TITLES[ranked[0].slug] ?? null,
    top: ranked.slice(0, 5).map((r) => ({
      strength: STRENGTH_PT[r.slug] ?? r.slug,
      score: round(r.score),
    })),
  };
}

export function deriveValues(rows: Row[]) {
  const top = topOf(rows, (id) => {
    const m = id.match(/^schwartz:meta:([a-z_]+)$/);
    return m ? m[1] : null;
  });
  if (!top) return null;
  const metas = rows
    .map((r) => {
      const m = r.facet_id.match(/^schwartz:meta:([a-z_]+)$/);
      return m ? { meta: META_PT[m[1]] ?? m[1], score: round(Number(r.score_decimal)) } : null;
    })
    .filter((x) => x !== null)
    .sort((a, b) => (b!.score ?? 0) - (a!.score ?? 0));
  return {
    title: META_TITLES[top.key] ?? null,
    dominant: META_PT[top.key] ?? top.key,
    metas,
  };
}
