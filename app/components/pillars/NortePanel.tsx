import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { HexChart } from '@/components/HexChart';
import { HexGrainToggle, useHexGrain } from '@/components/HexGrainToggle';
import { HexSeriesLegend } from '@/components/HexSeriesLegend';
import {
  DimensionPillarCard,
  ScoreBar,
  type PillarCardSub,
} from '@/components/pillars/DimensionPillarCard';
import { NorthFolded, NorthPhrase, NorthReview } from '@/components/pillars/NorteParts';
import { PillarActions } from '@/components/pillars/PillarActions';
import { PillarFirstStep } from '@/components/pillars/PillarFirstStep';
import { pickSubScoresDecimal } from '@/lib/api/character';
import {
  fromVision,
  reviewDue,
  useConfirmDimensionNote,
  useDimensionNotes,
} from '@/lib/api/dimensionNotes';
import { useLifeVision } from '@/lib/api/lifeVision';
import type { CharacterSubScore, DimensionId, SubId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { useModuleEnabled } from '@/lib/modules';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

// Neutral gray for the "today" ghost outline. Deliberately not gold (that's
// the desired fill's accent) and not cyan (that means "questionnaire" on the
// Avaliação hex) — the current-vs-desired distinction rides on fill-vs-outline,
// not hue, so the ghost stays chromatically quiet.
const GHOST_COLOR = tokens.text.mid;
const GOLD = tokens.semantic.coin;

interface Props {
  subScores: CharacterSubScore[];
}

/**
 * Desejada · Norte — what the person wants to be able to choose, area by
 * area, with the 0..5 target under it as a ruler (frente 5, caminho B).
 *
 * The hex plots the DESIRED per-sub scores (filled) over today's self scores
 * (a neutral ghost outline), as before. Under it, the areas the person said
 * matter come first, each card led by its phrase ("Quero poder escolher…",
 * and how it is today when written) over its "today → target" bars. The
 * other areas fold to one line. A card asks "Ainda é isso?" once its phrase
 * is six months old. A tap on any card opens the editor on that area.
 *
 * With "A vida que eu quero" on, a scene of the same area suggests the
 * phrase, and a phrase taken from it carries the seal "da vida que eu
 * quero". The Norte itself stays core and free.
 */
export function NortePanel({ subScores }: Props) {
  const router = useRouter();
  const { t } = useT();
  const metaLookup = useMetaLookup();
  const { width: screenWidth } = useWindowDimensions();
  const chartSize = Math.max(240, Math.min((screenWidth || 360) - 16, 360));
  const [hexMode, toggleHexMode] = useHexGrain();
  // A legenda do Norte era inerte — uma View copiada dos outros painéis.
  // Agora ela liga/desliga o contorno "hoje", que é o que ela sempre
  // descreveu sem controlar.
  const [showToday, setShowToday] = useState(true);

  const notesQ = useDimensionNotes();
  const confirm = useConfirmDimensionNote();
  const vidaOn = useModuleEnabled('vida');
  const vision = useLifeVision(vidaOn);

  const current = useMemo(
    () => pickSubScoresDecimal(subScores, 'self'),
    [subScores],
  );
  const desired = useMemo(
    () => pickSubScoresDecimal(subScores, 'desired'),
    [subScores],
  );
  const hasDesired = desired.size > 0;

  // Effective desired per sub: an absent target means "no goal beyond today",
  // so it falls back to the current score — never a fake negative gap.
  const desiredEff = useMemo(() => {
    const m = new Map<SubId, number>();
    for (const dim of DIMENSION_ORDER) {
      for (const sub of SUBS_BY_DIM[dim]) {
        const cur = current.get(sub) ?? 0;
        m.set(sub, desired.get(sub) ?? cur);
      }
    }
    return m;
  }, [current, desired]);

  // The vision's scenes by area — only with the module on (the query is
  // disabled otherwise and data stays undefined).
  const scenesByDim = useMemo(() => {
    const m = new Map<DimensionId, string[]>();
    if (!vidaOn) return m;
    for (const s of vision.data?.scenes ?? []) {
      m.set(s.dim, [...(m.get(s.dim) ?? []), s.text]);
    }
    return m;
  }, [vidaOn, vision.data]);

  // Until the notes load (or if they fail), every area reads as before —
  // full card, bars and all — so nothing ever disappears on a slow network.
  const ready = notesQ.isSuccess;
  const notes = notesQ.data;
  const matters = (dim: DimensionId) => !!notes?.get(dim)?.matters;
  const mattering = ready ? DIMENSION_ORDER.filter(matters) : [];
  const folded = ready ? DIMENSION_ORDER.filter((d) => !matters(d)) : [];
  const anyMatters = mattering.length > 0;

  const openEditor = (dim?: DimensionId) =>
    router.push({ pathname: '/norte-form', params: dim ? { dim } : {} });
  const openTargets = () =>
    router.push({ pathname: '/self-assessment', params: { mode: 'desired' } });

  /** The two sub rows of an area: "today → target" over the bar whose lit
   *  stretch is the climb still ahead (or today alone, faded, without any
   *  target). A target today already reached lights its number. */
  const subRows = (dim: DimensionId): PillarCardSub[] => {
    const color = DIMENSION_META[dim].color;
    return SUBS_BY_DIM[dim].map((subId) => {
      const cur = current.get(subId) ?? 0;
      if (!hasDesired) {
        return {
          subId,
          value: formatScore(cur),
          faint: true,
          bar: <ScoreBar fill={cur / 5} from={cur / 5} color={color} />,
        };
      }
      const des = desiredEff.get(subId) ?? cur;
      return {
        subId,
        value: `${formatScore(cur)} → ${formatScore(des)}`,
        reached: desired.has(subId) && des > 0 && cur >= des,
        bar: <ScoreBar fill={des / 5} from={cur / 5} color={color} />,
        a11yLabel: t('norte.subA11y', {
          sub: metaLookup.sub(subId).label,
          now: formatScore(cur),
          target: formatScore(des),
        }),
      };
    });
  };

  const areaValue = (dim: DimensionId) => {
    if (!hasDesired) return { value: '—', unit: undefined, faint: true };
    const [a, b] = SUBS_BY_DIM[dim];
    return {
      value: formatScore((desiredEff.get(a) ?? 0) + (desiredEff.get(b) ?? 0)),
      unit: '/10',
      faint: false,
    };
  };

  /** "Força 2 → 4 · Mobilidade 3 → 4,5" — a folded area's one line. */
  const foldedLine = (dim: DimensionId) =>
    SUBS_BY_DIM[dim]
      .map((subId) => {
        const cur = current.get(subId) ?? 0;
        const label = metaLookup.sub(subId).label;
        if (!hasDesired) return `${label} ${formatScore(cur)}`;
        return `${label} ${formatScore(cur)} → ${formatScore(desiredEff.get(subId) ?? cur)}`;
      })
      .join(' · ');

  const reachedNames = (dim: DimensionId) =>
    SUBS_BY_DIM[dim]
      .filter((subId) => {
        const des = desired.get(subId);
        return des != null && des > 0 && (current.get(subId) ?? 0) >= des;
      })
      .map((subId) => metaLookup.sub(subId).label);

  return (
    <View style={styles.wrap}>
      {/* Until an area is chosen, choosing is the first thing here — the
          same first-step card Percebida shows before the questionnaire. */}
      {ready && !anyMatters && (
        <PillarFirstStep
          icon="compass-outline"
          title={t('norte.firstTitle')}
          line={t('norte.firstBody')}
          cta={t('norte.firstCta')}
          onPress={() => openEditor()}
        />
      )}

      <View style={styles.hexWrap}>
        <HexChart
          scores={hasDesired ? desiredEff : new Map()}
          secondaryScores={showToday ? current : undefined}
          secondaryColor={GHOST_COLOR}
          variant={hexMode}
          centerValue={hasDesired ? undefined : '—'}
          size={chartSize}
          idSuffix="norte"
          onDimPress={(dim) => router.push({ pathname: '/dimension/[id]', params: { id: dim } })}
        />
      </View>

      <HexGrainToggle
        mode={hexMode}
        accent={GOLD}
        onToggle={toggleHexMode}
      />

      <HexSeriesLegend
        accent={GOLD}
        entries={[
          {
            key: 'desired',
            label: t('hex.seriesDesired'),
            shape: 'fill',
            // Sem meta definida a série não existe no gráfico: a entrada fica
            // apagada e sem toque, lendo como "ainda não definido".
            visible: hasDesired,
          },
          {
            key: 'today',
            label: t('hex.seriesToday'),
            shape: 'outline',
            color: GHOST_COLOR,
            visible: showToday,
            onToggle: hasDesired ? () => setShowToday((v) => !v) : undefined,
          },
        ]}
      />

      <View style={styles.list}>
        {/* Not loaded yet: the full cards, fixed axis order, like before. */}
        {!ready &&
          DIMENSION_ORDER.map((dim) => (
            <DimensionPillarCard
              key={dim}
              dimId={dim}
              {...areaValue(dim)}
              onPress={() => openEditor(dim)}
              subs={subRows(dim)}
            />
          ))}

        {/* The areas that matter: phrase first, the ruler under it. */}
        {mattering.map((dim) => {
          const note = notes?.get(dim);
          const scenes = scenesByDim.get(dim) ?? [];
          const due = reviewDue(note);
          return (
            <DimensionPillarCard
              key={dim}
              dimId={dim}
              {...areaValue(dim)}
              rim={tokens.semantic.coinRim}
              onPress={() => openEditor(dim)}
              lead={
                <View style={styles.lead}>
                  <NorthPhrase
                    want={note?.want ?? null}
                    today={note?.today}
                    seal={fromVision(note?.want, scenes)}
                    suggestion={scenes[0] ?? null}
                  />
                  {due && (
                    <NorthReview
                      reached={reachedNames(dim)}
                      onKeep={() => confirm.mutate(dim)}
                      onChange={() => openEditor(dim)}
                    />
                  )}
                </View>
              }
              subs={subRows(dim)}
            />
          );
        })}

        {/* The rest, folded to one line each. */}
        {folded.map((dim) => (
          <DimensionPillarCard
            key={dim}
            dimId={dim}
            {...areaValue(dim)}
            onPress={() => openEditor(dim)}
            lead={<NorthFolded line={foldedLine(dim)} />}
            subs={[]}
          />
        ))}
      </View>

      <PillarActions
        accent={GOLD}
        actions={[
          ...(anyMatters
            ? [
                {
                  key: 'want',
                  icon: 'create-outline' as const,
                  label: t('norte.editWant'),
                  onPress: () => openEditor(),
                },
              ]
            : []),
          {
            key: 'north',
            icon: 'flag-outline',
            label: hasDesired ? t('norte.cta') : t('norte.ctaFirst'),
            onPress: openTargets,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: tokens.space[3],
  },
  hexWrap: {
    alignItems: 'center',
  },
  list: { gap: tokens.space[2] },
  lead: { gap: tokens.space[2] },
});
