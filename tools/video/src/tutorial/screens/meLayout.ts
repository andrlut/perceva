// Layout da aba Eu, calculado do código do app — não medido no navegador. Cada
// número é um StyleSheet do app (comentado com a origem), então a réplica e os
// retângulos dos alvos do tour saem da MESMA conta.
//
// Origem: app/app/(tabs)/character.tsx + HeroHeader, PillarSwitcher,
// DedicacaoPanel (XpHexChart, HexGrainToggle/HexPill, PeriodSelector, SubBar,
// DayStrip), AvaliacaoPanel e NortePanel (HexChart, HexSeriesLegend,
// PillarFirstStep), DimensionPillarCard (+ ScoreBar), PillarActions, HexRadar,
// ScreenInfoButton, BottomNavBar.
import { tokens } from '../ui';
import type { Rect } from '../ui';
import { naturalLine, textWidth, wrap } from '../text';
import { DEVICE, Device, navClearance, navLayout } from './chrome';
import { Lang, num, tr } from './i18n';
import type { SwipeMotion, TimedPatch } from './types';
import RAW from './me.fixtures.json';
import TARGETS from './targets.json';

// ---------------------------------------------------------------- catálogo fixo (theme/dimensions.ts)

export type PillarKey = 'percebida' | 'praticada' | 'desejada';
export const PILLARS: PillarKey[] = ['percebida', 'praticada', 'desejada'];
export type DimId = 'health' | 'body' | 'mind' | 'wealth' | 'bonds' | 'craft';
export const DIM_ORDER: DimId[] = ['health', 'body', 'mind', 'wealth', 'bonds', 'craft'];
export const SUBS_BY_DIM: Record<DimId, [string, string]> = {
  health: ['sleep', 'nutrition'],
  body: ['strength', 'dexterity'],
  mind: ['learn', 'contemplate'],
  wealth: ['money', 'career'],
  bonds: ['circle', 'romance'],
  craft: ['play', 'build'],
};
export const DIM_ICON: Record<DimId, string> = { health: 'heart', body: 'fitness', mind: 'sparkles', wealth: 'cash', bonds: 'people', craft: 'color-palette' };

// ---------------------------------------------------------------- fixture

export type MeFixture = {
  name: string;
  totalXp: number;
  dimXp: Record<DimId, number>;
  prevWindowXp: number;
  self: Record<string, number>;
  questionnaire: boolean;
  desired: boolean;
  emblem: { rings: number; tests: number; halo: number };
  /** 30 caracteres por sub-área: dígito = estrelas (10 XP cada), '.' = nada */
  days: Record<string, string>;
  lockedTabs?: string[];
};
export const ME_FIXTURES: Record<string, MeFixture> = Object.fromEntries(
  Object.entries(RAW as Record<string, unknown>).filter(([k]) => !k.startsWith('_')),
) as Record<string, MeFixture>;
export const meFixture = (name: string): MeFixture => {
  const fx = ME_FIXTURES[name];
  if (!fx) throw new Error(`fixture do Eu inexistente: ${name} (tem: ${Object.keys(ME_FIXTURES).join(', ')})`);
  return fx;
};
/** XP de cada dia (30) de uma sub-área. */
export const dayXp = (fx: MeFixture, sub: string) => [...(fx.days[sub] ?? '')].map((c) => (c === '.' ? 0 : Number(c) * 10));
export const windowXp = (fx: MeFixture, sub: string) => dayXp(fx, sub).reduce((a, b) => a + b, 0);

/** lib/xp.ts: faixas de 10 níveis; a faixa t custa 100·(t+1) por nível. */
const xpForLevel = (level: number) => {
  if (level <= 1) return 0;
  const n = level - 1;
  const t = Math.floor(n / 10);
  const r = n % 10;
  return 100 * (5 * t * (t + 1) + r * (t + 1));
};
export const levelForXp = (xp: number) => {
  if (xp <= 0) return 1;
  let t = 0;
  while (xpForLevel((t + 1) * 10 + 1) <= xp) t += 1;
  const rest = xp - xpForLevel(t * 10 + 1);
  return t * 10 + Math.min(Math.floor(rest / (100 * (t + 1))), 9) + 1;
};

/** lib/util/formatScore.ts */
export const formatScore = (v: number) => {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? r.toString() : r.toFixed(1);
};

/** lib/saturation.ts + lib/dedicacao/scale.ts: régua 300 em 30 dias, MIN_RATIO 0.05, BAR_SPAN 3. */
export const CAP = 300;
const MIN_RATIO = 0.05;
export const BAR_SPAN = 3;
const ratio = (xp: number) => (xp <= 0 ? 0 : Math.max(MIN_RATIO, Math.min(1, xp / CAP)));
export const barSegments = (xp: number) => {
  if (xp <= 0) return { base: 0, over: 0, clipped: false };
  const span = CAP * BAR_SPAN;
  return { base: Math.min(xp, CAP) / span, over: xp > CAP ? (Math.min(xp, span) - CAP) / span : 0, clipped: xp > span };
};

// ---------------------------------------------------------------- estado

export type MeState = {
  pillar: PillarKey;
  /** cartões abertos da Praticada (o painel guarda isso em useState: remonta fechado) */
  expanded: DimId[];
  scroll: number;
  scrollMotion?: SwipeMotion | 'instant' | null;
};
/** Valores animados do quadro. O painel troca em sequência: o velho apaga, depois o novo acende
 *  (texto nunca atravessa texto); `live` = os alvos do painel existem (o que está entrando). */
export type MeView = { scroll: number; panel: PillarKey; panelO: number; live: boolean; expand: Record<DimId, number> };
export type MeCtx = { fx: MeFixture; lang: Lang; d: Device };

// ---------------------------------------------------------------- caixas

export type SubRow = { sub: string; label: string; value: string; reached: boolean; faint: boolean; rowH: number; bar: { kind: 'xp'; xp: number } | { kind: 'score'; fill: number; from?: number } };
export type Strip = { sub: string; label: string; count: string; values: number[] };
export type CardBox = {
  dim: DimId;
  rect: Rect;
  value: string;
  unit: string;
  faint: boolean;
  /** null = chevron-forward (abre a área); senão o cartão abre e fecha (Praticada) */
  open: boolean | null;
  /** 0..1 da abertura (LinearTransition 220 ms) */
  t: number;
  subs: SubRow[];
  /** o que aparece aberto: as tiras dos dias, o nível, o link */
  strips: Strip[];
  level: string;
  link: string;
  /** altura fechado e o acréscimo aberto */
  baseH: number;
  extraH: number;
};
export type Pill = { rect: Rect; icon: string; label: string };
export type LegendPill = { rect: Rect; label: string; shape: 'fill' | 'outline'; visible: boolean; color?: string };
export type HexBox = {
  /** a caixa do HexRadar (size × size) */
  rect: Rect;
  R: number;
  axes: { dim: DimId; ratio: number; active: boolean }[];
  secondary: number[] | null;
  secondaryColor: string | null;
  center: string;
  unit: string | null;
  fontSize: number;
  /** Praticada: a variação embaixo do hex */
  caption: { text: string; y: number; h: number } | null;
  badges: Record<DimId, Rect>;
};
export type FirstStep = { rect: Rect; icon: string; title: string[]; line: string[]; cta: string; btn: Rect; bodyX: number; bodyW: number; bodyY: number };
export type Period = { rect: Rect; chips: { key: string; label: string; rect: Rect; active: boolean }[]; prev: Rect; next: Rect; label: string; labelRect: Rect };
export type ActionRow = { key: string; icon: string; label: string; value?: string; rect: Rect };
export type PanelBox = {
  key: PillarKey;
  accent: string;
  firstStep: FirstStep | null;
  hex: HexBox;
  toggle: { y: number; rim: Pill | null; grain: Pill };
  legend: { y: number; pills: LegendPill[] } | null;
  period: Period | null;
  note: { rect: Rect; lines: string[] } | null;
  cards: CardBox[];
  actions: { rect: Rect; rows: ActionRow[] } | null;
  bottom: number;
};
export type MeLayout = {
  d: Device;
  contentTop: number;
  scroll: number;
  maxScroll: number;
  contentH: number;
  hero: { rect: Rect; row: Rect; emblem: Rect; textX: number; textY: number; level: string; name: string; disc: string };
  info: Rect;
  tabs: { key: PillarKey; rect: Rect }[];
  panel: PanelBox;
  panelO: number;
  nav: ReturnType<typeof navLayout>;
  targets: Record<string, Rect>;
  hidden?: string[];
};

// ---------------------------------------------------------------- medidas (StyleSheets do app)

const PAD = 16; // styles.body paddingHorizontal (space[4])
const HEX = 360; // max(240, min(screenWidth − 16, 360))
// HexRadar: BADGE 32, LABEL_GAP 17, HIT_SLOP 8 → PADDING 41
const BADGE = 32;
const LABEL_GAP = 17;
const HEX_PAD = BADGE / 2 + LABEL_GAP + 8;
const n = naturalLine;

export const ACCENT: Record<PillarKey, string> = { percebida: tokens.brand.violet2, praticada: tokens.semantic.xp2, desejada: tokens.semantic.coin };

/** DimensionPillarCard: linha da sub-área (12/600 × 12/700, ou 13/800 quando passou da régua) */
const subRowH = (reached: boolean) => Math.max(n(12, 600), reached ? n(13, 800) : n(12, 700));
const SUB_BLOCK = (reached: boolean) => subRowH(reached) + 3 + 14; // gap 3 · barRow 14
// SubStrips: rótulo 11/600 × contagem 11/700, gap 4, DayStrip 16
const STRIP_H = Math.max(n(11, 600), n(11, 700)) + 4 + 16;
// footerRow: marginTop 2 · nível 11/600 × link 11/700 + ícone 12
const FOOT_H = 2 + Math.max(n(11, 600), n(11, 700), 12);

const cardBox = (
  dim: DimId,
  x: number,
  y: number,
  w: number,
  o: { value: string; unit: string; faint: boolean; open: boolean | null; t: number; subs: SubRow[]; strips: Strip[]; level: string; link: string },
): CardBox => {
  // card: paddingVertical 12 · borda 1 · gap 8 · top 28 (iconHalo)
  const baseH = 1 + 12 + 28 + o.subs.reduce((a, s) => a + 8 + SUB_BLOCK(s.reached), 0) + 12 + 1;
  // aberto: gap 8 + expandWrap (marginTop 2, gap 8: divisória 1, uma tira por sub-área, rodapé)
  const extraH = o.open === null ? 0 : 8 + 2 + 1 + o.strips.reduce((a) => a + 8 + STRIP_H, 0) + 8 + FOOT_H;
  const h = baseH + extraH * o.t;
  return { dim, rect: { x, y, w, h, r: 14 }, ...o, baseH, extraH };
};

const pill = (x: number, y: number, icon: string, label: string): Pill => ({
  // HexPill: paddingHorizontal 10 · ícone 13 · gap 5 · texto 12/800 · borda 1 · altura 28
  rect: { x, y, w: 1 + 10 + 13 + 5 + textWidth(label, 12, 800) + 10 + 1, h: 28, r: 14 },
  icon,
  label,
});

const firstStep = (y: number, icon: string, title: string, line: string, cta: string): FirstStep => {
  // PillarFirstStep: padding 14 · borda 1.5 · ícone 44 · gap 12 · botão (12 + texto 12/800 + 4 + seta 14 + 12, paddingVertical 9)
  const W = DEVICE.w - PAD * 2;
  const inner = W - 3 - 28;
  const btnW = 12 + textWidth(cta, 12, 800) + 4 + 14 + 12;
  const btnH = 9 * 2 + Math.max(n(12, 800), 14);
  const bodyW = inner - 44 - 12 - 12 - btnW;
  const t = wrap(title, 15, 800, bodyW);
  const l = wrap(line, 12.5, 500, bodyW);
  const bodyH = t.length * n(15, 800) + 2 + l.length * 17;
  const h = 3 + 28 + Math.max(44, bodyH, btnH);
  const ix = PAD + 1.5 + 14;
  const cy = y + h / 2;
  return {
    rect: { x: PAD, y, w: W, h, r: 18 },
    icon,
    title: t,
    line: l,
    cta,
    btn: { x: ix + inner - btnW, y: cy - btnH / 2, w: btnW, h: btnH, r: btnH / 2 },
    bodyX: ix + 44 + 12,
    bodyW,
    bodyY: cy - bodyH / 2,
  };
};

const hexBox = (y: number, o: Omit<HexBox, 'rect' | 'R' | 'badges' | 'caption'> & { caption: string | null }): HexBox => {
  const rect: Rect = { x: (DEVICE.w - HEX) / 2, y, w: HEX, h: HEX, r: 18 };
  const R = HEX / 2 - HEX_PAD;
  const cx = rect.x + HEX / 2;
  const cy = rect.y + HEX / 2;
  const badges = {} as Record<DimId, Rect>;
  DIM_ORDER.forEach((dim, j) => {
    const a = (j / 6) * Math.PI * 2 - Math.PI / 2;
    const bx = cx + Math.cos(a) * (R + LABEL_GAP);
    const by = cy + Math.sin(a) * (R + LABEL_GAP);
    badges[dim] = { x: bx - BADGE / 2, y: by - BADGE / 2, w: BADGE, h: BADGE, r: BADGE / 2 };
  });
  // XpHexChart: wrap gap 8 · legenda 12/700
  const caption = o.caption ? { text: o.caption, y: y + HEX + 8, h: n(12, 700) } : null;
  return { ...o, rect, R, badges, caption };
};

const legend = (y: number, pills: Omit<LegendPill, 'rect'>[]): { y: number; pills: LegendPill[] } => {
  // HexSeriesLegend: centrada, gap 6 · pílula paddingHorizontal 10 + amostra 14 + gap 5 + 11/700 (ls 0.3) + borda
  const ws = pills.map((p) => 1 + 10 + 14 + 5 + textWidth(p.label, 11, 700, 0.3) + 10 + 1);
  const total = ws.reduce((a, b) => a + b, 0) + 6 * (ws.length - 1);
  let x = (DEVICE.w - total) / 2;
  return {
    y,
    pills: pills.map((p, i) => {
      const r = { ...p, rect: { x, y, w: ws[i], h: 28, r: 14 } };
      x += ws[i] + 6;
      return r;
    }),
  };
};

const actionsCard = (y: number, rows: Omit<ActionRow, 'rect'>[]) => {
  // PillarActions: linha minHeight 52 (paddingVertical 12 + halo 28), divisória 1 entre linhas
  const W = DEVICE.w - PAD * 2;
  let cy = y;
  const out = rows.map((r, i) => {
    if (i > 0) cy += 1;
    const row = { ...r, rect: { x: PAD, y: cy, w: W, h: 52, r: 14 } };
    cy += 52;
    return row;
  });
  return { rect: { x: PAD, y, w: W, h: cy - y, r: 14 }, rows: out };
};

// ---------------------------------------------------------------- os três painéis

const dimLabel = (lang: Lang, dim: DimId) => tr(lang, `dimensions.${dim}.label`);
const subLabel = (lang: Lang, sub: string) => tr(lang, `subs.${sub}.label`);

const practicedPanel = (top: number, ctx: MeCtx, expand: Record<DimId, number>, open: DimId[]): PanelBox => {
  const { fx, lang } = ctx;
  const W = DEVICE.w - PAD * 2;
  const subXp = (sub: string) => windowXp(fx, sub);
  const dimWin = (dim: DimId) => SUBS_BY_DIM[dim].reduce((a, s) => a + subXp(s), 0);
  const total = DIM_ORDER.reduce((a, d) => a + dimWin(d), 0);
  const prev = fx.prevWindowXp;
  const pct = Math.round(((total - prev) / prev) * 100);
  let y = top;
  const hex = hexBox(y, {
    axes: DIM_ORDER.map((dim) => ({ dim, ratio: total > 0 ? (ratio(subXp(SUBS_BY_DIM[dim][0])) + ratio(subXp(SUBS_BY_DIM[dim][1]))) / 2 : 0, active: dimWin(dim) > 0 })),
    secondary: null,
    secondaryColor: null,
    // formatCenterXp: até 10 mil, toLocaleString
    center: num(lang, total),
    unit: 'XP',
    fontSize: 24,
    caption: `${total >= prev ? '▲ +' : '▼ '}${pct}%`,
  });
  y += HEX + 8 + n(12, 700) + 12;
  // HexGrainToggle: marginTop −8, rim à esquerda (rowSplit), 6/12 à direita
  y -= 8;
  const rim = pill(PAD, y, 'contract-outline', tr(lang, 'dedicacao.rimLabel', { xp: num(lang, CAP) }));
  const g0 = pill(0, y, 'git-network-outline', '6');
  const grain = { ...g0, rect: { ...g0.rect, x: PAD + W - g0.rect.w } };
  const toggle = { y, rim, grain };
  y += 28 + 12;
  // PeriodSelector: chips flex 1 gap 6 (paddingVertical 8, 12/700, borda 1) · gap 8 · navRow marginTop 2, setas 28
  const chipH = 8 * 2 + n(12, 700) + 2;
  const chipW = (W - 6 * 4) / 5;
  const keys = ['days30', 'week', 'month', 'quarter', 'all'];
  const chips = keys.map((k, i) => ({ key: k, label: tr(lang, `dedicacaoWindow.${k}`), rect: { x: PAD + i * (chipW + 6), y, w: chipW, h: chipH, r: chipH / 2 }, active: k === 'days30' }));
  const navY = y + chipH + 8 + 2;
  // o rótulo é capitalize (cada palavra), minWidth 140
  const label = capitalize(tr(lang, 'dedicacaoWindow.last30Days'));
  const lw = Math.max(140, textWidth(label, 12, 700, 0.4));
  const navW = 28 + 12 + lw + 12 + 28;
  const nx = (DEVICE.w - navW) / 2;
  const period: Period = {
    rect: { x: PAD, y, w: W, h: chipH + 8 + 2 + 28, r: 14 },
    chips,
    prev: { x: nx, y: navY, w: 28, h: 28, r: 14 },
    next: { x: nx + navW - 28, y: navY, w: 28, h: 28, r: 14 },
    label,
    labelRect: { x: nx + 28 + 12, y: navY, w: lw, h: 28 },
  };
  y += period.rect.h + 12;
  // saturationNote: 11.5/16 centrado, paddingHorizontal 8
  const lines = wrap(tr(lang, 'dedicacao.saturation30', { xp: CAP }), 11.5, 500, W - 16);
  const note = { rect: { x: PAD, y, w: W, h: lines.length * 16, r: 8 }, lines };
  y += note.rect.h + 12;
  // lista: as mais treinadas primeiro (empate: a ordem do hex)
  const order = [...DIM_ORDER].sort((a, b) => dimWin(b) - dimWin(a) || DIM_ORDER.indexOf(a) - DIM_ORDER.indexOf(b));
  const cards: CardBox[] = [];
  for (const dim of order) {
    const subs = [...SUBS_BY_DIM[dim]].sort((a, b) => subXp(b) - subXp(a) || SUBS_BY_DIM[dim].indexOf(a) - SUBS_BY_DIM[dim].indexOf(b));
    const rows: SubRow[] = subs.map((sub) => {
      const xp = subXp(sub);
      const reached = xp >= CAP && xp > 0;
      return { sub, label: subLabel(lang, sub), value: num(lang, xp), reached, faint: xp === 0, rowH: subRowH(reached), bar: { kind: 'xp', xp } };
    });
    const strips: Strip[] = subs.map((sub) => {
      const v = dayXp(fx, sub);
      return { sub, label: subLabel(lang, sub), count: tr(lang, 'dedicacao.activeDays', { n: v.filter((x) => x > 0).length, total: v.length }), values: v };
    });
    const xpAll = fx.dimXp[dim];
    const c = cardBox(dim, PAD, y, W, {
      value: num(lang, dimWin(dim)),
      unit: ' XP',
      faint: dimWin(dim) === 0,
      open: open.includes(dim),
      t: expand[dim] ?? 0,
      subs: rows,
      strips,
      level: tr(lang, 'dedicacao.levelTotal', { level: levelForXp(xpAll), xp: num(lang, xpAll) }),
      link: tr(lang, 'dedicacao.dimHistory', { dim: dimLabel(lang, dim) }),
    });
    cards.push(c);
    y += c.rect.h + 8;
  }
  y += -8 + 12;
  const actions = actionsCard(y, [{ key: 'history', icon: 'calendar-outline', label: tr(lang, 'dedicacao.fullHistory') }]);
  y += actions.rect.h;
  return { key: 'praticada', accent: ACCENT.praticada, firstStep: null, hex, toggle, legend: null, period, note, cards, actions, bottom: y };
};

const scorePanel = (top: number, ctx: MeCtx, key: 'percebida' | 'desejada'): PanelBox => {
  const { fx, lang } = ctx;
  const W = DEVICE.w - PAD * 2;
  const self = (sub: string) => fx.self[sub] ?? 0;
  let y = top;
  let fs: FirstStep | null = null;
  if (key === 'percebida' && !fx.questionnaire) {
    fs = firstStep(y, 'clipboard-outline', tr(lang, 'avaliacao.questCardTitle'), tr(lang, 'avaliacao.questCardLine'), tr(lang, 'avaliacao.questCardCta'));
  }
  if (key === 'desejada' && !fx.desired) {
    fs = firstStep(y, 'flag-outline', tr(lang, 'norte.emptyTitle'), tr(lang, 'norte.emptyBody'), tr(lang, 'norte.emptyCta'));
  }
  if (fs) y += fs.rect.h + 12;
  const dimScore = (dim: DimId) => self(SUBS_BY_DIM[dim][0]) + self(SUBS_BY_DIM[dim][1]);
  const mean = Math.round((DIM_ORDER.reduce((a, d) => a + dimScore(d), 0) / 6) * 10) / 10;
  // HexChart: Percebida = a autoavaliação cheia (sem questionário, a única série); Desejada sem
  // norte = forma vazia, o contorno de hoje por cima (text.mid) e "—" no centro
  const hex = hexBox(y, {
    axes: DIM_ORDER.map((dim) => ({ dim, ratio: key === 'percebida' ? dimScore(dim) / 10 : 0, active: key === 'percebida' && dimScore(dim) > 0 })),
    secondary: key === 'desejada' ? DIM_ORDER.map((d) => dimScore(d) / 10) : null,
    secondaryColor: key === 'desejada' ? tokens.text.mid : null,
    center: key === 'percebida' ? mean.toFixed(1) : '—',
    unit: null,
    fontSize: 28,
    caption: null,
  });
  y += HEX + 12 - 8;
  const accent = ACCENT[key];
  const g0 = pill(0, y, 'git-network-outline', '6');
  const toggle = { y, rim: null, grain: { ...g0, rect: { ...g0.rect, x: PAD + W - g0.rect.w } } };
  y += 28 + 12 + 8; // legenda: marginTop 8
  const lg =
    key === 'percebida'
      ? legend(y, [{ label: tr(lang, 'hex.seriesSelf'), shape: 'fill', visible: true }])
      : legend(y, [
          { label: tr(lang, 'hex.seriesDesired'), shape: 'fill', visible: fx.desired },
          { label: tr(lang, 'hex.seriesToday'), shape: 'outline', visible: true, color: tokens.text.mid },
        ]);
  y += 28 + 12;
  const cards: CardBox[] = [];
  for (const dim of DIM_ORDER) {
    const [a, b] = SUBS_BY_DIM[dim];
    const rows: SubRow[] = [a, b].map((sub) => ({
      sub,
      label: subLabel(lang, sub),
      value: formatScore(self(sub)),
      reached: false,
      faint: key === 'desejada' || self(sub) === 0,
      rowH: subRowH(false),
      bar: key === 'percebida' ? { kind: 'score', fill: self(sub) / 5 } : { kind: 'score', fill: self(sub) / 5, from: self(sub) / 5 },
    }));
    const c = cardBox(dim, PAD, y, W, {
      value: key === 'percebida' ? formatScore(dimScore(dim)) : '—',
      unit: key === 'percebida' ? '/10' : '',
      faint: key === 'desejada' || dimScore(dim) === 0,
      open: null,
      t: 0,
      subs: rows,
      strips: [],
      level: '',
      link: '',
    });
    cards.push(c);
    y += c.rect.h + 8;
  }
  y += -8;
  let actions: PanelBox['actions'] = null;
  if (key === 'percebida') {
    y += 12;
    const has = Object.values(fx.self).some((v) => v > 0);
    actions = actionsCard(y, [
      { key: 'self', icon: 'create-outline', label: tr(lang, has ? 'avaliacao.actions.self' : 'avaliacao.actions.selfFirst'), value: has ? undefined : tr(lang, 'avaliacao.actions.selfTime') },
    ]);
    y += actions.rect.h;
  }
  return { key, accent, firstStep: fs, hex, toggle, legend: lg, period: null, note: null, cards, actions, bottom: y };
};

const capitalize = (s: string) => s.replace(/(^|\s)(\S)/g, (_, a: string, b: string) => a + b.toLocaleUpperCase());

// ---------------------------------------------------------------- tela

export type MeOpts = { scrollShown?: number; panel?: PillarKey; panelO?: number; live?: boolean; expand?: Partial<Record<DimId, number>> };

// HeroHeader: paddingTop 18 · paddingBottom 22 · paddingHorizontal 20 · emblema 92 · gap 16
const HERO_H = 18 + 92 + 22;
// PillarSwitcher: paddingVertical 12 · ícone 22 · gap 4 · rótulo 10/800 · borda 1
const TAB_H = 12 * 2 + 22 + 4 + n(10, 800) + 2;

export const layoutMe = (s: MeState, ctx: MeCtx, o: MeOpts = {}): MeLayout => {
  const { fx, lang } = ctx;
  const d = ctx.d ?? DEVICE;
  const W = d.w;
  const CW = W - PAD * 2;
  const panelKey = o.panel ?? s.pillar;
  const live = o.live ?? true;
  const expand = { ...Object.fromEntries(DIM_ORDER.map((k) => [k, s.expanded.includes(k) ? 1 : 0])), ...(o.expand ?? {}) } as Record<DimId, number>;

  // ---- HeroHeader
  const row: Rect = { x: 20, y: 18, w: W - 40, h: 92, r: 18 };
  const emblem: Rect = { x: 20, y: 18, w: 92, h: 92, r: 46 };
  const textX = 20 + 92 + 16;
  // textCol (gap 2): LV 10/800 · nome 28/29 (marginTop 2) · "Descobrir meu perfil" (marginTop 4, 11/700)
  const colH = n(10, 800) + 2 + 2 + 29 + 2 + 4 + Math.max(11, n(11, 700));
  const hero = {
    rect: { x: 0, y: 0, w: W, h: HERO_H, r: 0 },
    row,
    emblem,
    textX,
    textY: 18 + (92 - colH) / 2,
    level: `LV ${levelForXp(fx.totalXp)}`,
    name: fx.name,
    disc: tr(lang, 'hero.discCta'),
  };
  // ScreenInfoButton absoluto: top 6, right 8, caixa 40
  const info: Rect = { x: W - 8 - 40, y: 6, w: 40, h: 40, r: 20 };

  // ---- corpo: paddingTop 12, gap 16
  let y = HERO_H + 12;
  const tabW = (CW - 8 * 2) / 3;
  const tabs = PILLARS.map((key, i) => ({ key, rect: { x: PAD + i * (tabW + 8), y, w: tabW, h: TAB_H, r: 14 } as Rect }));
  y += TAB_H + 16;
  const panel = panelKey === 'praticada' ? practicedPanel(y, ctx, expand, s.expanded) : scorePanel(y, ctx, panelKey);

  // paddingBottom = useBottomNavClearance
  const contentH = panel.bottom + navClearance(d);
  const viewportH = d.h - d.statusBar;
  const maxScroll = Math.max(0, contentH - viewportH);
  const scroll = Math.max(0, Math.min(maxScroll, o.scrollShown ?? s.scroll));
  const contentTop = d.statusBar - scroll;
  const nav = navLayout(d);

  // ---- alvos em coordenadas da tela
  const sc = (r: Rect): Rect => ({ ...r, y: r.y + contentTop });
  const t: Record<string, Rect> = {
    screen: { x: 0, y: 0, w: W, h: d.h, r: 0 },
    info: sc(info),
    profile: sc(row),
    pillars: sc({ x: PAD, y: tabs[0].rect.y, w: CW, h: TAB_H, r: 14 }),
    nav: nav.bar,
    'nav.hero': nav.tabs[2].rect,
  };
  for (const tb of tabs) t[`pillar.${tb.key}`] = sc(tb.rect);
  // o painel que está saindo já não responde: os alvos dele somem no toque que troca de retrato
  if (live) {
    const p = panel;
    const hx = p.hex;
    t.hex = sc(hx.caption ? { ...hx.rect, h: hx.caption.y + hx.caption.h - hx.rect.y } : hx.rect);
    for (const dim of DIM_ORDER) t[`hex.axis.${dim}`] = sc(hx.badges[dim]);
    t.grain = sc(p.toggle.grain.rect);
    if (p.toggle.rim) t.rim = sc(p.toggle.rim.rect);
    if (p.period) {
      t.period = sc(p.period.rect);
      const c0 = p.period.chips[0].rect;
      const c4 = p.period.chips[4].rect;
      t['period.chips'] = sc({ x: c0.x, y: c0.y, w: c4.x + c4.w - c0.x, h: c0.h, r: c0.h / 2 });
      t['period.prev'] = sc(p.period.prev);
      t['period.next'] = sc(p.period.next);
    }
    if (p.note) t.note = sc(p.note.rect);
    if (p.legend) {
      const a = p.legend.pills[0].rect;
      const b = p.legend.pills[p.legend.pills.length - 1].rect;
      t.legend = sc({ x: a.x, y: a.y, w: b.x + b.w - a.x, h: 28, r: 14 });
    }
    if (p.firstStep) {
      t.firstStep = sc(p.firstStep.rect);
      t['firstStep.cta'] = sc(p.firstStep.btn);
    }
    p.cards.forEach((c, i) => {
      t[`dim.${c.dim}`] = sc(c.rect);
      if (i < 2) t[`card${i}`] = sc(c.rect);
    });
    if (p.actions) {
      t.actions = sc(p.actions.rect);
      for (const r of p.actions.rows) t[`action.${r.key}`] = sc(r.rect);
    }
  }
  assertTargets(t);
  return { d, contentTop, scroll, maxScroll, contentH, hero, info, tabs, panel, panelO: o.panelO ?? 1, nav, targets: t };
};

const KNOWN = new Set<string>(TARGETS.me.static);
const assertTargets = (t: Record<string, Rect>) => {
  for (const k of Object.keys(t)) if (!KNOWN.has(k)) throw new Error(`alvo "${k}" do layout do Eu não está em targets.json (me.static)`);
};

// ---------------------------------------------------------------- toque

export const tapMe = (target: string, s: MeState, ctx: MeCtx): TimedPatch<MeState>[] | null => {
  const pm = /^pillar\.(\w+)$/.exec(target);
  if (pm) {
    const key = pm[1] as PillarKey;
    if (key === s.pillar) return null; // já está nele: o app não muda nada
    // o painel remonta (useState): a Praticada volta com os cartões fechados. A rolagem fica onde
    // está, como a ScrollView — só volta pro fim se o painel novo for mais curto.
    // `lift`: o painel inteiro troca debaixo da mão (o cartão do topo entra logo abaixo da aba
    // tocada); a mão sai junto com o painel velho, em vez de voltar por cima do que entrou.
    const after: MeState = { ...s, pillar: key, expanded: [] };
    const max = layoutMe({ ...after, scroll: 0 }, ctx).maxScroll;
    return [{ patch: { pillar: key, expanded: [], ...(s.scroll > max ? { scroll: max, scrollMotion: 'instant' as const } : {}) }, lift: true }];
  }
  if (s.pillar !== 'praticada') return null; // nos outros retratos o cartão abre a área (outra tela)
  const L = layoutMe(s, ctx);
  let dim: DimId | null = null;
  const cm = /^card(\d)$/.exec(target);
  if (cm) dim = L.panel.cards[Number(cm[1])]?.dim ?? null;
  const dm = /^dim\.(\w+)$/.exec(target);
  if (dm) dim = dm[1] as DimId;
  if (!dim) return null;
  const open = s.expanded.includes(dim);
  return [{ patch: { expanded: open ? s.expanded.filter((x) => x !== dim) : [...s.expanded, dim] } }];
};

/** Rolagem que põe o alvo a ~40% do topo da tela (ou o máximo possível): perto do meio, pra o
 *  arrasto 1:1 caber no palco. */
export const scrollForMe = (target: string, s: MeState, ctx: MeCtx): number => {
  const L = layoutMe({ ...s, scroll: 0 }, ctx);
  const r = L.targets[target];
  if (!r) throw new Error(`scroll: alvo "${target}" não existe agora`);
  return Math.max(0, Math.min(L.maxScroll, r.y - ctx.d.statusBar - ctx.d.h * 0.4));
};

export const initialMe = (_fx: MeFixture, patch: Partial<MeState> = {}): MeState => ({
  pillar: 'praticada',
  expanded: [],
  scroll: 0,
  scrollMotion: null,
  ...patch,
});
