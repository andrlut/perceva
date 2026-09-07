import { useMemo } from 'react';

import { useDailySummary } from '@/lib/api/history';
import { useRecentReadCount } from '@/lib/api/learning';
import { DEEP_INSTRUMENT_IDS, useCompletedInstruments } from '@/lib/api/psych';
import type { DimensionId, SubId } from '@/lib/db/types';
import { DIMENSION_ORDER, SUBS_BY_DIM, SUB_META } from '@/theme/dimensions';

/**
 * O Emblema — o glifo da marca lendo os dados do usuário.
 *
 * Quatro canais, três deles em JANELA MÓVEL de 30 dias (todo dia entra um
 * dia e sai o mais antigo — não existe "virou o mês e zerou"):
 *
 *   anéis          → esforço: XP acumulado nos últimos 30 dias
 *   braços + bolas → autoconhecimento: instrumentos concluídos (PERMANENTE)
 *   centro + órbita→ práticas: as subs mais praticadas nos últimos 30 dias
 *   halo           → leitura: materiais lidos nos últimos 30 dias
 *
 * O autoconhecimento é a exceção deliberada: questionário é coisa de poucas
 * vezes na vida, então ali é acumulado e nunca recua.
 *
 * Recuo nos outros três é comportamento normal e NÃO pode ganhar copy de
 * perda em lugar nenhum — sem "você perdeu", sem contador regressivo.
 */

export const EMBLEMA_WINDOW_DAYS = 30;

/**
 * A escada dos anéis, em XP acumulado na janela de 30 dias.
 *
 * A escada é uma TAXA DIÁRIA, não um número solto: cada anel vale +20 XP
 * por dia de média, e o disco cheio é ter mantido 100 XP por dia no mês.
 * É o que torna a leitura ensinável — "fechei o disco" quer dizer uma
 * coisa só, e não muda de significado conforme o app cresce.
 *
 *   anel 1 →  20 XP/dia    anel 4 →  80 XP/dia
 *   anel 2 →  40 XP/dia    anel 5 → 100 XP/dia (disco cheio)
 *
 * O teto é alcançável de propósito: em 30 dias reais o dono fez 3.235 XP,
 * então quem mantém o ritmo fecha o disco em vez de olhar para um anel que
 * nunca enche.
 */
export const LADDER_5 = [600, 1200, 1800, 2400, 3000] as const;

/**
 * Versão de 3 degraus pra capa, terminando no mesmo teto: 33, 67 e 100 XP
 * por dia. A posição relativa lê igual nos dois tamanhos.
 */
export const LADDER_3 = [1000, 2000, 3000] as const;

/**
 * Piso para uma área ACENDER na órbita: menos de 100 XP no mês é ter
 * passado por ali, não é ter treinado.
 *
 * Vale para os doze satélites, que ficam desenhados sempre — apagados
 * dizem o que falta. NÃO vale para o centro, que é o sub de maior volume
 * com ou sem piso: senão o emblema de uma conta nova ficaria sem miolo.
 */
export const PRACTICE_FLOOR_XP = 100;

/** Materiais lidos em 30 dias que deixam o halo cheio. ~2 drops por semana. */
export const GLOW_FULL_READS = 8;

/**
 * Quantas subs o emblema mostra ao todo (1 no centro + 4 orbitando).
 *
 * Teto obrigatório, não estética: o dono praticou os DOZE subs na janela,
 * então "só desenha o que foi praticado" não limparia nada. O emblema diz
 * "o que você mais treina", não é um inventário.
 */
export const MAX_SUBS_SHOWN = 5;

/**
 * Ângulo fixo por sub, 30° de distância entre vizinhos.
 *
 * Fixo — e não ordenado por volume — de propósito: o mesmo sub cai sempre
 * no mesmo canto, então o emblema vira reconhecível como SEU.
 *
 * A ordem é derivada de `DIMENSION_ORDER` + `SUBS_BY_DIM`, exatamente como
 * o HexChart monta os doze eixos — assim o emblema e o hex nunca podem
 * discordar sobre qual sub vem antes de qual.
 *
 * O deslocamento de -77° (e não -90°, que poria o primeiro sub no topo)
 * existe pra não colidir com as bolinhas das pontas dos braços, que caem
 * em 147,9° e -32,1°. Ambas têm resíduo 27,9 módulo 30, e -77 põe todo
 * satélite a 14,9° delas — a maior separação possível nesta grade.
 */
export const SUB_ORDER: SubId[] = DIMENSION_ORDER.flatMap(
  (dim) => SUBS_BY_DIM[dim],
);

export function angleForSub(subId: SubId): number {
  const i = SUB_ORDER.indexOf(subId);
  return (i < 0 ? 0 : i) * 30 - 77;
}

export interface EmblemaSub {
  subId: SubId;
  iconName: string;
  dimensionId: DimensionId;
  /** XP do sub na janela. */
  xp: number;
  /** 0..1 — fatia relativa ao sub mais praticado. Dita o tamanho. */
  weight: number;
  /** Graus, 0 = topo. */
  angle: number;
}

export interface EmblemaState {
  /** XP acumulado na janela. */
  xp30: number;
  /** Materiais lidos na janela. */
  read30: number;
  /** Instrumentos profundos concluídos, 0..6. */
  instruments: number;
  /** O sub mais praticado na janela, ou null se não houve prática. */
  center: EmblemaSub | null;
  /**
   * As demais áreas por volume, do 2º ao 5º lugar.
   *
   * NÃO é mais o que a órbita desenha — ela mostra as doze em posição
   * fixa. Serve só à linha de texto do /perfil, que nomeia as áreas mais
   * treinadas do mês.
   */
  satellites: EmblemaSub[];
  /**
   * XP por sub na janela, para TODOS os doze — inclusive os zerados.
   *
   * É o que a órbita consome: as doze em posição fixa, acesas acima do
   * piso e apagadas abaixo dele. Sem o mapa cheio dá para listar o que foi
   * feito, mas não para desenhar o que falta.
   */
  subXp: Record<SubId, number>;
  /** Alguma das três queries ainda carregando. */
  loading: boolean;
}

/**
 * Estados falsos pra julgar o desenho sem depender da conta — o go/no-go da
 * Fase 0 precisa ver conta nova e emblema cheio lado a lado. Deixar em
 * `null` fora do banco de provas.
 */
export type EmblemaDebugState = 'zero' | 'early' | 'mid' | 'full';
export const EMBLEMA_DEBUG: EmblemaDebugState | null = null;

interface DebugShape {
  xp30: number;
  read30: number;
  instruments: number;
  subs: [SubId, number][];
}

const DEBUG_STATES: Record<EmblemaDebugState, DebugShape> = {
  zero: { xp30: 0, read30: 0, instruments: 0, subs: [] },
  early: {
    xp30: 520,
    read30: 2,
    instruments: 1,
    subs: [
      ['sleep', 180],
      ['strength', 140],
      ['build', 90],
    ],
  },
  // Números reais do dono na janela de 2026-08-08 a 09-06.
  mid: {
    xp30: 2100,
    read30: 5,
    instruments: 4,
    subs: [
      ['build', 578],
      ['sleep', 452],
      ['strength', 416],
      ['circle', 374],
      ['career', 279],
      ['play', 271],
    ],
  },
  full: {
    xp30: 4400,
    read30: 9,
    instruments: 6,
    subs: [
      ['build', 700],
      ['sleep', 620],
      ['strength', 540],
      ['circle', 480],
      ['career', 400],
    ],
  },
};

const EMPTY_SUBS: { center: EmblemaSub | null; satellites: EmblemaSub[] } = {
  center: null,
  satellites: [],
};

/** Mapa dos doze subs zerado — base para somar a janela por cima. */
function emptySubXp(): Record<SubId, number> {
  return Object.fromEntries(SUB_ORDER.map((s) => [s, 0])) as Record<
    SubId,
    number
  >;
}

function buildSubs(entries: [SubId, number][]) {
  const sorted = entries
    .filter(([, xp]) => xp > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SUBS_SHOWN);
  if (sorted.length === 0) return EMPTY_SUBS;

  const max = sorted[0][1];
  const mapped: EmblemaSub[] = sorted.map(([subId, xp]) => ({
    subId,
    iconName: SUB_META[subId].iconName,
    dimensionId: SUB_META[subId].dimensionId,
    xp,
    // Piso em 0.45 pra que o 5º sub não vire um ponto invisível quando o
    // primeiro domina a janela (no dono: 578 contra 20 no último).
    weight: Math.max(0.45, xp / max),
    angle: angleForSub(subId),
  }));
  return { center: mapped[0], satellites: mapped.slice(1) };
}

/**
 * Lê os quatro canais. Duas queries de dados no total — `useDailySummary`
 * alimenta anéis E centro/órbita, porque o `bySub` dela já vem somado.
 *
 * `useCharacter` NÃO é tocado de propósito: ele já é hub de quatro selects,
 * e pendurar mais um ali encarece o cold start de todas as abas.
 */
export function useEmblemaState(): EmblemaState {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (EMBLEMA_WINDOW_DAYS - 1));

  const daily = useDailySummary(from, to);
  const reads = useRecentReadCount(EMBLEMA_WINDOW_DAYS);
  const instruments = useCompletedInstruments();

  const dailyData = daily.data;
  const readData = reads.data;
  const instrumentData = instruments.data;
  const loading = daily.isLoading || reads.isLoading || instruments.isLoading;

  return useMemo<EmblemaState>(() => {
    if (EMBLEMA_DEBUG) {
      const d = DEBUG_STATES[EMBLEMA_DEBUG];
      return {
        xp30: d.xp30,
        read30: d.read30,
        instruments: d.instruments,
        subXp: { ...emptySubXp(), ...Object.fromEntries(d.subs) },
        ...buildSubs(d.subs),
        loading: false,
      };
    }

    const read30 = readData ?? 0;
    const done = Math.min(instrumentData?.size ?? 0, DEEP_INSTRUMENT_IDS.length);

    if (!dailyData) {
      return {
        xp30: 0,
        read30,
        instruments: done,
        subXp: emptySubXp(),
        ...EMPTY_SUBS,
        loading,
      };
    }

    let xp30 = 0;
    const bySub = new Map<SubId, number>();
    for (const day of dailyData.values()) {
      xp30 += day.totalXp;
      for (const [sub, xp] of Object.entries(day.bySub)) {
        const id = sub as SubId;
        bySub.set(id, (bySub.get(id) ?? 0) + (xp ?? 0));
      }
    }

    const entries = [...bySub.entries()];
    return {
      xp30,
      read30,
      instruments: done,
      subXp: { ...emptySubXp(), ...Object.fromEntries(entries) },
      ...buildSubs(entries),
      loading,
    };
  }, [dailyData, readData, instrumentData, loading]);
}

/**
 * XP da janela → fração de preenchimento de cada anel, de dentro pra fora.
 * Anel N cobre a faixa entre o degrau anterior e o seu.
 */
export function ringFills(xp: number, ladder: readonly number[]): number[] {
  return ladder.map((top, i) => {
    const prev = i === 0 ? 0 : ladder[i - 1];
    return Math.max(0, Math.min(1, (xp - prev) / (top - prev)));
  });
}

export interface ArmFills {
  left: number;
  right: number;
  dotLeft: boolean;
  dotRight: boolean;
}

/**
 * Instrumentos concluídos → quanto de cada braço está desenhado.
 *
 * Alternando os lados, um terço por instrumento: o 1º abre o braço
 * esquerdo, o 2º o direito, e assim por diante. As duas bolinhas das pontas
 * só acendem no 5º e no 6º — são o único elemento que exige a coleção
 * inteira, e o único que nunca recua.
 */
export function armFills(instruments: number): ArmFills {
  const n = Math.max(0, Math.min(6, instruments));
  const left = Math.ceil(n / 2) / 3;
  const right = Math.floor(n / 2) / 3;
  return { left, right, dotLeft: left >= 1, dotRight: right >= 1 };
}

/** Materiais lidos → intensidade do halo, 0..1. */
export function glowLevel(read30: number): number {
  return Math.max(0, Math.min(1, read30 / GLOW_FULL_READS));
}
