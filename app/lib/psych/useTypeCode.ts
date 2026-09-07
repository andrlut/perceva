import { useMemo } from 'react';

import { useLastPsychSession, useSessionScores } from '@/lib/api/psych';
import { useT } from '@/lib/i18n';
import {
  AXIS_ORDER,
  axisFromFacetId,
  codeFromAxisMeans,
  getTypeContent,
  type AxisSlug,
  type TypeCode,
  type TypesLocale,
} from '@/lib/psych/types-content';

type TypeContent = ReturnType<typeof getTypeContent>;

export type TypeCodeState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'ready'; code: TypeCode; content: TypeContent };

/**
 * O tipo do usuário, derivado da última sessão completa de Tipos — irmão
 * exato de `useDiscBlend`, e pelo mesmo motivo: o código era recalculado
 * inline no card e na tela de resultado, então bastava uma das duas mudar
 * para as leituras discordarem.
 *
 * Nunca persistido: é função pura das quatro médias de eixo, e refazer o
 * teste invalida `psychKeys`, então todo consumidor se atualiza sozinho.
 * O estado 'loading' é carga útil — sem ele quem já fez o teste vê o
 * fallback de 'none' piscar a cada montagem fria.
 */
export function useTypeCode(): TypeCodeState {
  const { locale } = useT();
  const tyLocale: TypesLocale = locale === 'en' ? 'en' : 'pt';
  const lastSession = useLastPsychSession('tipos');
  const scoresQ = useSessionScores(lastSession.data?.id);

  return useMemo<TypeCodeState>(() => {
    if (lastSession.isLoading) return { status: 'loading' };
    if (!lastSession.data) return { status: 'none' };
    if (scoresQ.isLoading) return { status: 'loading' };

    const means = {} as Record<AxisSlug, number>;
    for (const s of scoresQ.data ?? []) {
      const a = axisFromFacetId(s.facet_id);
      if (a) means[a] = Number(s.score_decimal);
    }
    // Uma sessão completa pontua os quatro eixos; sem todos, é melhor não
    // ter tipo do que inventar um código a partir de um conjunto parcial.
    if (!AXIS_ORDER.every((a) => means[a] !== undefined)) return { status: 'none' };

    const code = codeFromAxisMeans(means);
    return { status: 'ready', code, content: getTypeContent(code, tyLocale) };
  }, [
    lastSession.isLoading,
    lastSession.data,
    scoresQ.isLoading,
    scoresQ.data,
    tyLocale,
  ]);
}
