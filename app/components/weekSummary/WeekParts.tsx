import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import type { DayState, WeekCmp, WeekSummary } from '@/lib/api/weekSummary';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { moodLevel } from '@/lib/mood';
import { tokens } from '@/theme';

/**
 * The cards of the "Resumo da semana" (/week). Every card is the same chassis
 * (surface + rim + uppercase title) and every list inside one is a set of
 * sibling rows with one anatomy, so the screen reads as one system. The
 * explanations live in the (i), not on the cards.
 */

// ─── Formatting ──────────────────────────────────────────────────────────────

export function useNum() {
  const { locale } = useT();
  const intl = locale === 'pt' ? 'pt-BR' : 'en-US';
  return (n: number, digits = 1) =>
    n.toLocaleString(intl, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** "+11 vs anterior · média: 4" — neutral ink: a week is read, not graded. */
export function CmpLine({
  cmp,
  avgWeeks,
  digits = 1,
}: {
  cmp: WeekCmp | { this: number | null; prev: number | null; avg4: number | null };
  avgWeeks: number;
  digits?: number;
}) {
  const { t } = useT();
  const num = useNum();
  const parts: string[] = [];
  if (cmp.prev === null || cmp.this === null) {
    if (cmp.prev === null && avgWeeks === 0) parts.push(t('weekSummary.firstWeek'));
  } else {
    const d = Math.round((cmp.this - cmp.prev) * 10) / 10;
    parts.push(
      d === 0
        ? t('weekSummary.samePrev')
        : t('weekSummary.vsPrev', { delta: d > 0 ? `+${num(d, digits)}` : `−${num(-d, digits)}` }),
    );
  }
  if (avgWeeks > 0 && cmp.avg4 !== null) {
    parts.push(t('weekSummary.avg', { value: num(cmp.avg4, digits) }));
  }
  if (parts.length === 0) return null;
  return (
    <Text style={styles.cmp} numberOfLines={1}>
      {parts.join(' · ')}
    </Text>
  );
}

// ─── Chassis ─────────────────────────────────────────────────────────────────

export function WeekCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

// ─── The reserved spot for the character's celebration ──────────────────────

/** Placeholder until the 3D character has a style: the video goes here. */
export function VideoSlot() {
  const { t } = useT();
  return (
    <View style={styles.video} accessibilityRole="image" accessibilityLabel={t('weekSummary.videoTitle')}>
      <Ionicons name="sparkles-outline" size={28} color={tokens.semantic.coin} />
      <Text style={styles.videoTitle}>{t('weekSummary.videoTitle')}</Text>
      <View style={styles.soonPill}>
        <Text style={styles.soonText}>{t('weekSummary.videoSoon')}</Text>
      </View>
    </View>
  );
}

// ─── KPIs ────────────────────────────────────────────────────────────────────

export function KpiRow({ s }: { s: WeekSummary }) {
  const { t } = useT();
  const num = useNum();
  const aw = s.week.avg_weeks;
  const tiles = [
    { key: 'p', label: t('weekSummary.kpiPractices'), value: num(s.practices.completions.this), cmp: s.practices.completions },
    { key: 'x', label: t('weekSummary.kpiXp'), value: `${num(s.dedication.xp.this)} XP`, cmp: s.dedication.xp },
    {
      key: 'c',
      label: t('weekSummary.kpiClosed'),
      value: t('weekSummary.kpiClosedValue', { n: s.days.closed.this }),
      cmp: s.days.closed,
    },
  ];
  return (
    <View style={styles.kpis}>
      {tiles.map((k) => (
        <View key={k.key} style={styles.kpi}>
          <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
            {k.value}
          </Text>
          <Text style={styles.kpiLabel} numberOfLines={1}>
            {k.label}
          </Text>
          <CmpLine cmp={k.cmp} avgWeeks={aw} />
        </View>
      ))}
    </View>
  );
}

// ─── Days (DaySeal states) ───────────────────────────────────────────────────

function DayMark({ state }: { state: DayState }) {
  switch (state) {
    case 'complete':
      return (
        <View style={[styles.mark, styles.markGold]}>
          <Ionicons name="checkmark" size={14} color={tokens.semantic.coinInk} />
        </View>
      );
    case 'cleared':
      return (
        <View style={[styles.mark, styles.markRing]}>
          <Ionicons name="checkmark" size={13} color={tokens.semantic.coin} />
        </View>
      );
    case 'settled':
      return (
        <View style={[styles.mark, styles.markMuted]}>
          <Ionicons name="moon" size={12} color={tokens.text.mid} />
        </View>
      );
    case 'open':
      return <View style={[styles.mark, styles.markOpen]} />;
    case 'future':
      return <View style={[styles.mark, styles.markFuture]} />;
    default:
      return (
        <View style={styles.mark}>
          <View style={styles.dot} />
        </View>
      );
  }
}

export function DaysStrip({ s }: { s: WeekSummary }) {
  const { locale } = useT();
  const intl = locale === 'pt' ? 'pt-BR' : 'en-US';
  return (
    <View style={styles.days}>
      {s.days.list.map((d) => {
        const date = keyToDate(d.date);
        return (
          <View key={d.date} style={styles.dayCol}>
            <Text style={styles.dayLetter}>
              {date.toLocaleDateString(intl, { weekday: 'narrow' }).toUpperCase()}
            </Text>
            <DayMark state={d.state} />
            <Text style={styles.dayNum}>{date.getDate()}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Areas ───────────────────────────────────────────────────────────────────

export function AreaRows({ s }: { s: WeekSummary }) {
  const { t } = useT();
  const meta = useMetaLookup();
  const rows = s.practices.by_dimension.filter(
    (d) => d.completions.this > 0 || (d.completions.prev ?? 0) > 0 || (d.completions.avg4 ?? 0) > 0,
  );
  const max = Math.max(1, ...rows.map((r) => r.completions.this));
  if (rows.length === 0) {
    return <Muted>{t('weekSummary.areasEmpty')}</Muted>;
  }
  return (
    <View style={styles.rows}>
      {rows.map((r) => {
        const dim = meta.dim(r.dimension_id);
        return (
          <View key={r.dimension_id} style={styles.areaRow}>
            <View style={styles.areaHead}>
              <View style={[styles.areaDot, { backgroundColor: dim.color }]} />
              <Text style={styles.rowLabel} numberOfLines={1}>
                {dim.label}
              </Text>
              <Text style={styles.rowValue}>{r.completions.this}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { backgroundColor: dim.color, width: `${(r.completions.this / max) * 100}%` },
                ]}
              />
            </View>
            <CmpLine cmp={r.completions} avgWeeks={s.week.avg_weeks} />
          </View>
        );
      })}
      {s.practices.coins_only > 0 && (
        <Muted>{t('weekSummary.coinsOnly', { count: s.practices.coins_only })}</Muted>
      )}
    </View>
  );
}

// ─── Mood ────────────────────────────────────────────────────────────────────

export function MoodBlock({ s }: { s: WeekSummary }) {
  const { t, locale } = useT();
  const num = useNum();
  const intl = locale === 'pt' ? 'pt-BR' : 'en-US';
  const m = s.mood;
  if (m.days_logged === 0) return <Muted>{t('weekSummary.moodEmpty')}</Muted>;
  const byDate = new Map(m.days.map((d) => [d.date, d.mood]));
  const dayName = (key: string) =>
    keyToDate(key).toLocaleDateString(intl, { weekday: 'long', day: 'numeric' });

  return (
    <View style={styles.rows}>
      <View style={styles.moodHead}>
        <Text style={styles.moodAvg}>{t('weekSummary.moodAvg', { value: num(m.avg.this ?? 0, 1) })}</Text>
        <Text style={styles.muted}>{t('weekSummary.moodDays', { n: m.days_logged })}</Text>
      </View>
      <CmpLine cmp={m.avg} avgWeeks={s.week.avg_weeks} />
      <View style={styles.days}>
        {s.days.list.map((d) => {
          const v = byDate.get(d.date);
          const lvl = v ? moodLevel(v) : null;
          return (
            <View key={d.date} style={styles.dayCol}>
              <View
                style={[
                  styles.moodDot,
                  lvl ? { backgroundColor: lvl.color, borderColor: lvl.color } : null,
                ]}
              >
                {lvl ? <Text style={[styles.moodDotText, { color: lvl.ink }]}>{v}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
      {m.best && m.worst && m.best.mood !== m.worst.mood && (
        <View style={styles.rows}>
          <View style={styles.lineRow}>
            <Text style={styles.rowLabel}>{t('weekSummary.moodBest')}</Text>
            <Text style={styles.rowSide}>
              {dayName(m.best.date)} · {t(`mood.levels.${moodLevel(m.best.mood).key}`)}
            </Text>
          </View>
          <View style={styles.lineRow}>
            <Text style={styles.rowLabel}>{t('weekSummary.moodWorst')}</Text>
            <Text style={styles.rowSide}>
              {dayName(m.worst.date)} · {t(`mood.levels.${moodLevel(m.worst.mood).key}`)}
            </Text>
          </View>
        </View>
      )}
      {m.top_tags.length > 0 && (
        <View style={styles.chips}>
          {m.top_tags.map((tag) => (
            <View key={tag.tag} style={styles.chip}>
              <Text style={styles.chipText}>
                {(locale === 'en' ? tag.label_en : tag.label_pt) ?? tag.tag} · {tag.days}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Coins ───────────────────────────────────────────────────────────────────

export function CoinsBlock({ s }: { s: WeekSummary }) {
  const { t } = useT();
  const num = useNum();
  const rows = [
    { key: 'e', label: t('weekSummary.coinsEarned'), value: `+${num(s.coins.earned.this, 0)}`, cmp: s.coins.earned },
    { key: 's', label: t('weekSummary.coinsSpent'), value: `−${num(s.coins.spent.this, 0)}`, cmp: s.coins.spent },
  ];
  return (
    <View style={styles.rows}>
      {rows.map((r) => (
        <View key={r.key} style={styles.coinRow}>
          <View style={styles.lineRow}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.coinValue}>{r.value}</Text>
          </View>
          <CmpLine cmp={r.cmp} avgWeeks={s.week.avg_weeks} digits={0} />
        </View>
      ))}
      {s.coins.balance !== null && (
        <View style={styles.lineRow}>
          <Text style={styles.rowLabel}>{t('weekSummary.coinsBalance')}</Text>
          <Text style={styles.rowSide}>{num(s.coins.balance, 0)}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Rewards — in DAYS, never celebrated (a reward can be a penalty) ─────────

export function RewardRows({ s }: { s: WeekSummary }) {
  const { t } = useT();
  if (s.rewards.length === 0) return <Muted>{t('weekSummary.rewardsEmpty')}</Muted>;
  return (
    <View style={styles.rows}>
      {s.rewards.map((r, i) => {
        const facts = [t('weekSummary.rewardTimes', { count: r.times, coins: r.coins })];
        if (r.days_without_before !== null) {
          facts.push(t('weekSummary.rewardBefore', { count: r.days_without_before }));
        }
        if (r.previous_best_gap_days !== null) {
          facts.push(t('weekSummary.rewardRecord', { count: r.previous_best_gap_days }));
        }
        return (
          <View key={r.reward_id}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.rewardRow}>
              <View style={styles.rewardIcon}>
                <AppIcon name={r.icon ?? 'gift-outline'} size={18} color={tokens.text.base} />
              </View>
              <View style={styles.rewardMain}>
                <Text style={styles.rowLabel} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text style={styles.cmp}>{facts.join(' · ')}</Text>
              </View>
              <View style={styles.rewardSide}>
                <Text style={styles.rewardDays}>
                  {t('weekSummary.daysWithout', { count: r.days_since_last })}
                </Text>
                <Text style={styles.cmp}>{t('weekSummary.daysWithoutToday')}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── A vida que eu quero ─────────────────────────────────────────────────────

export function LifeBlock({ life }: { life: NonNullable<WeekSummary['life']> }) {
  const { t } = useT();
  const meta = useMetaLookup();
  return (
    <View style={styles.rows}>
      <Text style={styles.lifeShare}>
        {t('weekSummary.lifeShare', { n: life.in_scenes, total: life.total })}
      </Text>
      {life.scenes.map((sc) => {
        const dim = meta.dim(sc.dimension_id);
        return (
          <View key={sc.n} style={styles.sceneRow}>
            <View style={[styles.sceneBar, { backgroundColor: dim.color }]} />
            <View style={styles.rewardMain}>
              <Text style={styles.sceneText}>{sc.text}</Text>
              <Text style={styles.cmp}>
                {dim.label} · {t('weekSummary.lifeScene', { count: sc.completions })}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  cardTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  muted: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },
  cmp: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11.5,
    lineHeight: 15,
    color: tokens.text.dim,
  },
  video: {
    aspectRatio: 16 / 9,
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: tokens.semantic.coinRim,
    backgroundColor: 'rgba(255, 200, 61, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[6],
  },
  videoTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    lineHeight: 19,
    color: tokens.text.base,
    textAlign: 'center',
  },
  soonPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(255, 200, 61, 0.16)',
  },
  soonText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.semantic.coin,
  },
  kpis: { flexDirection: 'row', gap: tokens.space[2] },
  kpi: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  kpiValue: { ...tokens.type.numMd, color: tokens.text.hi },
  kpiLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 5, width: 36 },
  dayLetter: { fontFamily: 'Manrope_700Bold', fontSize: 11, color: tokens.text.dim },
  dayNum: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: tokens.text.mid },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markGold: { backgroundColor: tokens.semantic.coin },
  markRing: { borderWidth: 2, borderColor: tokens.semantic.coin },
  markMuted: { backgroundColor: tokens.bg.surface2 },
  markOpen: { borderWidth: 1.5, borderColor: tokens.text.dim },
  markFuture: { borderWidth: 1, borderColor: tokens.border.strong, borderStyle: 'dashed' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: tokens.text.faint },
  rows: { gap: tokens.space[2] },
  areaRow: { gap: 4 },
  areaHead: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  areaDot: { width: 8, height: 8, borderRadius: 4 },
  rowLabel: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  rowValue: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15, color: tokens.text.hi },
  rowSide: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.text.mid },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.bg.surface2,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3 },
  moodHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  moodAvg: { fontFamily: 'Manrope_800ExtraBold', fontSize: 18, color: tokens.text.hi },
  moodDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodDotText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 12 },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
  },
  chipText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.text.base },
  coinRow: { gap: 2 },
  coinValue: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15, color: tokens.semantic.coin },
  divider: { height: 1, backgroundColor: tokens.border.divider, marginVertical: tokens.space[1] },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[3] },
  rewardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface2,
  },
  rewardMain: { flex: 1, minWidth: 0, gap: 2 },
  rewardSide: { alignItems: 'flex-end', gap: 1, maxWidth: '40%' },
  rewardDays: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15, color: tokens.text.hi, textAlign: 'right' },
  lifeShare: { fontFamily: 'Manrope_700Bold', fontSize: 14, lineHeight: 19, color: tokens.text.hi },
  sceneRow: { flexDirection: 'row', gap: tokens.space[3], alignItems: 'stretch' },
  sceneBar: { width: 3, borderRadius: 2 },
  sceneText: { fontFamily: 'Manrope_600SemiBold', fontSize: 13.5, lineHeight: 18, color: tokens.text.base },
});
