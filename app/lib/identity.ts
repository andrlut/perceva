import { useMemo } from 'react';

import { useCharacter } from '@/lib/api/character';
import { useLastPsychSession, useSessionScores } from '@/lib/api/psych';
import type { IdentityTitle, ProfileIdentity } from '@/lib/db/types';
import { useDiscBlend } from '@/lib/psych/useDiscBlend';
import { useTypeCode } from '@/lib/psych/useTypeCode';
import {
  bucketForTraitScore,
  getTraitNarrative,
  traitFromFacetId,
  type BigFiveTrait,
} from '@/lib/psych/big-five-content';
import {
  getStyleContent,
  scaleFromFacetId,
  styleFromScales,
  type EcrScale,
} from '@/lib/psych/ecr-r-content';
import {
  getMetaContent,
  metaFromFacetId,
  type SchwartzMeta,
} from '@/lib/psych/schwartz-content';
import {
  getStrengthContent,
  strengthFromFacetId,
  type StrengthSlug,
} from '@/lib/psych/strengths-content';
import {
  BIG_FIVE_TITLES,
  ECR_STYLE_TITLES,
  SCHWARTZ_META_TITLES,
  STRENGTH_TITLES,
} from '@/lib/psych/title-copy';
import { useT } from '@/lib/i18n';
import type { PercevaPaletteName } from '@/components/PercevaGlyph';

/**
 * A personalização do Emblema — o que o usuário escolhe, e o que ele ainda
 * precisa fazer para poder escolher.
 *
 * Regra que organiza tudo aqui: **o catálogo é do app, o resultado é do
 * usuário.** Os 28 nomes de título já estão escritos nos bundles de
 * `app/lib/psych/`, mas ninguém escolhe entre 28 — cada instrumento
 * contribui com UM título, o resultado vigente. Refazer o teste troca o
 * candidato; o título deixa de ser coleção e passa a ser retrato.
 */

export type TitleSource =
  | 'disc'
  | 'tipos'
  | 'strengths'
  | 'schwartz_pvq'
  | 'ecr_r'
  | 'big_five_120';

/** Os seis, na ordem em que aparecem na folha. */
export const TITLE_SOURCES: TitleSource[] = [
  'disc',
  'tipos',
  'strengths',
  'schwartz_pvq',
  'ecr_r',
  'big_five_120',
];

export interface TitleOption {
  source: TitleSource;
  /** Código do resultado: o blend do DISC, o código de quatro letras dos Tipos. */
  key: string;
  /** O nome como aparece sob o display_name. */
  label: string;
  /** Uma frase do resultado, mostrada na pré-visualização. */
  phrase: string;
}


/**
 * O maior score de uma sessão, resolvido por um extrator de faceta.
 *
 * Os quatro instrumentos abaixo compartilham a mesma forma — última sessão
 * completa, linhas de `psych_score`, pega o topo — e escrever isso quatro
 * vezes seria quatro lugares para divergir.
 */
function useTopFacet<T>(
  instrumentId: string,
  pick: (facetId: string) => T | null,
): { top: T | null; raw: number; loading: boolean } {
  const last = useLastPsychSession(instrumentId);
  const scores = useSessionScores(last.data?.id);
  return useMemo(() => {
    const loading = last.isLoading || (!!last.data && scores.isLoading);
    let top: T | null = null;
    let raw = 0;
    for (const s of scores.data ?? []) {
      const k = pick(s.facet_id);
      if (k === null) continue;
      const v = Number(s.score_decimal);
      if (top === null || v > raw) {
        top = k;
        raw = v;
      }
    }
    return { top, raw, loading };
  }, [last.isLoading, last.data, scores.isLoading, scores.data, pick]);
}

/**
 * Os títulos que o usuário PODE usar agora — um por instrumento concluído.
 * Lista vazia significa que nenhum dos dois foi feito, e a folha diz isso
 * em vez de mostrar um seletor vazio.
 */
export function useTitleOptions(): { options: TitleOption[]; loading: boolean } {
  const { locale } = useT();
  const lang = locale === 'en' ? 'en' : 'pt';

  const blend = useDiscBlend();
  const type = useTypeCode();
  const strength = useTopFacet('strengths', strengthFromFacetId);
  const meta = useTopFacet('schwartz_pvq', metaFromFacetId);
  const bigFive = useBigFiveSignature();
  const ecr = useEcrStyle();

  return useMemo(() => {
    const options: TitleOption[] = [];

    if (blend.status === 'ready') {
      options.push({
        source: 'disc',
        key: blend.code,
        label: blend.content.name,
        phrase: blend.content.headline,
      });
    }
    if (type.status === 'ready') {
      options.push({
        source: 'tipos',
        key: type.code,
        label: type.content.name,
        phrase: type.content.headline,
      });
    }
    if (strength.top) {
      const slug = strength.top as StrengthSlug;
      options.push({
        source: 'strengths',
        key: slug,
        label: STRENGTH_TITLES[slug][lang],
        phrase: getStrengthContent(slug, lang).signature,
      });
    }
    if (meta.top) {
      const m = meta.top as SchwartzMeta;
      options.push({
        source: 'schwartz_pvq',
        key: m,
        label: SCHWARTZ_META_TITLES[m][lang],
        phrase: getMetaContent(m, lang).oneLiner,
      });
    }
    if (ecr.value) {
      options.push({
        source: 'ecr_r',
        key: ecr.value.style,
        label: ECR_STYLE_TITLES[ecr.value.style][lang],
        phrase: ecr.value.headline,
      });
    }
    if (bigFive.value) {
      const copy = BIG_FIVE_TITLES[bigFive.value.trait][bigFive.value.bucket];
      if (copy) {
        options.push({
          source: 'big_five_120',
          key: `${bigFive.value.trait}:${bigFive.value.bucket}`,
          label: copy[lang],
          phrase: bigFive.value.headline,
        });
      }
    }

    return {
      options,
      // Todos os SEIS entram no loading. Deixar dois de fora fazia o
      // consumidor achar que a lista estava completa cedo demais.
      loading:
        blend.status === 'loading' ||
        type.status === 'loading' ||
        strength.loading ||
        meta.loading ||
        ecr.loading ||
        bigFive.loading,
    };
  }, [blend, type, strength, meta, ecr, bigFive, lang]);
}

/**
 * O estilo de apego: sai das DUAS escalas juntas, não de um topo — o
 * quadrante é a combinação de ansiedade e evitação.
 */
function useEcrStyle() {
  const { locale } = useT();
  const lang = locale === 'en' ? 'en' : 'pt';
  const last = useLastPsychSession('ecr_r');
  const scores = useSessionScores(last.data?.id);
  const loading = last.isLoading || (!!last.data && scores.isLoading);

  const value = useMemo(() => {
    const map = new Map<EcrScale, number>();
    for (const s of scores.data ?? []) {
      const sc = scaleFromFacetId(s.facet_id);
      if (sc) map.set(sc, Number(s.score_decimal));
    }
    const anxiety = map.get('anxiety');
    const avoidance = map.get('avoidance');
    if (anxiety === undefined || avoidance === undefined) return null;
    const style = styleFromScales(anxiety, avoidance);
    return { style, headline: getStyleContent(style, lang).headline };
  }, [scores.data, lang]);

  return { value, loading };
}

/**
 * A assinatura do Big Five: o traço mais DISTANTE do meio, e não o de
 * maior nota.
 *
 * A mesma regra que o card de resultado já usa, e pelo mesmo motivo — por
 * nota, neuroticismo alto viraria a assinatura de identidade de alguém, e
 * o enquadramento não-hierárquico é decisão travada. Quem cai no meio em
 * tudo não ganha título: meio-termo não é assinatura.
 */
function useBigFiveSignature() {
  const { locale } = useT();
  const lang = locale === 'en' ? 'en' : 'pt';
  const last = useLastPsychSession('big_five_120');
  const scores = useSessionScores(last.data?.id);
  const loading = last.isLoading || (!!last.data && scores.isLoading);

  const value = useMemo(() => {
    let best: { trait: BigFiveTrait; raw: number; dist: number } | null = null;
    for (const s of scores.data ?? []) {
      const trait = traitFromFacetId(s.facet_id);
      if (!trait) continue;
      const raw = Number(s.score_decimal);
      const dist = Math.abs((raw - 24) / 96 - 0.5);
      if (!best || dist > best.dist) best = { trait, raw, dist };
    }
    if (!best) return null;
    const bucket = bucketForTraitScore(best.raw);
    if (bucket === 'mid') return null;
    return {
      trait: best.trait,
      bucket,
      headline: getTraitNarrative(best.trait, bucket, lang).headline,
    };
  }, [scores.data, lang]);

  return { value, loading };
}

/**
 * O título em vigor: o escolhido, se ainda for válido, senão o do DISC.
 *
 * A validação contra as opções atuais é o que faz o retake funcionar sem
 * migration de dado: se a pessoa refez o DISC e virou outro blend, a
 * escolha antiga simplesmente deixa de casar e o Emblema volta ao vigente,
 * em vez de exibir para sempre um resultado que ela não tem mais.
 */
export function useActiveTitle(): TitleOption | null {
  const character = useCharacter();
  const { options, loading } = useTitleOptions();
  const stored = character.data?.profile.identity?.title;

  return useMemo(() => {
    // Enquanto carrega não se resolve nada. Sem esta guarda a lista chega
    // pela metade — as seis cadeias respondem em ordem indeterminada — e o
    // fallback escolhia o primeiro que tivesse chegado, então a capa
    // mostrava o arquétipo de OUTRO instrumento e trocava sozinha um
    // instante depois. Trocar a identidade da pessoa na tela é pior do que
    // não mostrar nada por um segundo.
    if (loading || options.length === 0) return null;
    // Escolheu "sem título" de propósito.
    if (stored === null) return null;
    const fallback = options.find((o) => o.source === 'disc') ?? options[0];
    if (stored === undefined) return fallback;
    return (
      options.find((o) => o.source === stored.source && o.key === stored.key) ??
      // Refez o instrumento e o resultado mudou: vale o vigente da MESMA
      // fonte, que é o que o título passou a ser.
      options.find((o) => o.source === stored.source) ??
      // A fonte inteira sumiu (sessão apagada). Voltar ao padrão é melhor
      // do que deixar a pessoa sem título por um dado que ela não controla.
      fallback
    );
  }, [options, stored, loading]);
}

export function sameTitle(
  a: IdentityTitle | null | undefined,
  b: TitleOption | null,
): boolean {
  if (!a || !b) return false;
  return a.source === b.source && a.key === b.key;
}

// ── Paletas ────────────────────────────────────────────────────────────────

export interface PaletteOption {
  name: PercevaPaletteName;
  /** null = livre desde sempre. */
  unlock: 'rings' | 'reading' | 'instruments' | null;
}

/**
 * As quatro paletas que o glifo já tem. Duas livres, duas conquistadas.
 *
 * É o único desbloqueio do plano, e é cosmético puro: nada aqui muda o que
 * o Emblema MEDE, só como ele é pintado. Sem moeda no caminho — no Perceva
 * moeda significa Vault e, para este usuário, penalidade.
 */
export const PALETTE_OPTIONS: PaletteOption[] = [
  { name: 'primary', unlock: null },
  { name: 'midnight', unlock: null },
  { name: 'arcane', unlock: 'rings' },
  { name: 'tide', unlock: 'reading' },
  { name: 'gilded', unlock: 'instruments' },
];

export const DEFAULT_PALETTE: PercevaPaletteName = 'primary';

const PALETTE_NAMES = new Set<string>(PALETTE_OPTIONS.map((o) => o.name));

/**
 * Valida um nome de paleta vindo do banco.
 *
 * `identity.palette` é string livre num jsonb que o próprio cliente
 * escreve, então o valor chega SEM garantia: uma versão futura que grave
 * um nome novo, uma escrita manual pelo Studio ou um PostgREST cru bastam
 * para trazer algo que a tabela de paletas não conhece. Sem esta guarda o
 * primeiro `p.accent` estoura em render — e o Emblema mora no HeroHeader,
 * que é a primeira tela depois do tour. O último crash de produção deste
 * app veio exatamente de uma exceção no caminho de boot.
 */
export function resolvePalette(name: string | undefined): PercevaPaletteName {
  return name && PALETTE_NAMES.has(name)
    ? (name as PercevaPaletteName)
    : DEFAULT_PALETTE;
}

/**
 * Quais paletas já foram conquistadas — uma por canal.
 *
 * `arcane` vem do esforço, `tide` da leitura, `gilded` do autoconhecimento.
 * Três canais, três tintas: é o que faz cada frente do Emblema valer uma
 * mudança visível, em vez de existirem quatro cores soltas.
 *
 * As duas de janela móvel saem da marca MÁXIMA já atingida, não do valor
 * de agora: o esforço e a leitura recuam, mas o que foi conquistado não
 * pode ser tirado. Sem `identity.best`, a paleta sumiria numa semana fraca
 * — e tirar cosmético por queda de desempenho é a cobrança que este
 * produto não faz.
 */
export function unlockedPalettes(
  identity: ProfileIdentity | undefined,
  xp30: number,
  read30: number,
  instruments: number,
  ringTop: number,
  readTop: number,
  instrumentTotal: number,
): Set<PercevaPaletteName> {
  const bestXp = Math.max(identity?.best?.xp30 ?? 0, xp30);
  const bestRead = Math.max(identity?.best?.read30 ?? 0, read30);
  const set = new Set<PercevaPaletteName>(['primary', 'midnight']);
  if (bestXp >= ringTop) set.add('arcane');
  if (bestRead >= readTop) set.add('tide');
  if (instruments >= instrumentTotal) set.add('gilded');
  return set;
}

