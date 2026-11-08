// Layout da aba Aprender (Recanto), calculado do código do app — não medido no
// navegador. Cada número é um StyleSheet do app (comentado com a origem), então
// a réplica e os retângulos dos alvos do tour saem da MESMA conta.
//
// Origem: app/app/(tabs)/learning.tsx + EntryTile, ReelsEntryCard,
// TrainEntryTile, ContinueLendoCard, LearningFilterRow, CarouselRow, CoverCard,
// IdeasCountBadge, FabStack, ScreenInfoButton, BottomNavBar.
//
// A réplica só desenha o que o tour mostra: a lista vertical (cabeçalho, as três
// entradas, filtros e fileiras) sem a busca aberta, sem os estados de carregando
// e vazio. Tudo o que a tela tem de tocável leva pra outra tela (material,
// Explorar, Treino, Minhas ideias, o informativo), então o tour só aponta.
import type { Rect } from '../ui';
import { tokens } from '../ui';
import { lineCount, naturalLine, textWidth } from '../text';
import { DEVICE, Device, navClearance, navLayout } from './chrome';
import { Lang, tr, upper } from './i18n';
import { DimId, LearningFixture, MaterialFx, materialBySlug } from './learningFixture';
import type { SwipeMotion, TimedPatch } from './types';
import TARGETS from './targets.json';

// ---------------------------------------------------------------- estado

export type LearningState = {
  /** deslocamento da rolagem vertical, em dp */
  scroll: number;
  scrollMotion?: SwipeMotion | 'instant' | null;
};
export type LearningView = { scroll: number };
export type LearningCtx = { fx: LearningFixture; lang: Lang; d: Device };

// ---------------------------------------------------------------- constantes do app

const PAD = 16; // tokens.space[4]: o gutter de todas as linhas
export const DIM_ICON: Record<DimId, string> = { health: 'heart', body: 'fitness', mind: 'sparkles', wealth: 'cash', bonds: 'people', craft: 'color-palette' };
const DIM_ORDER: DimId[] = ['health', 'body', 'mind', 'wealth', 'bonds', 'craft'];
export const SUB_ICON: Record<string, string> = {
  sleep: 'moon', nutrition: 'restaurant', strength: 'barbell', dexterity: 'flash', learn: 'book', contemplate: 'leaf',
  money: 'wallet', career: 'briefcase', circle: 'people', romance: 'heart', play: 'game-controller', build: 'construct',
};
/** lib/learningCategory.ts → CATEGORY_META */
export const CATEGORY_META = {
  research: { color: tokens.brand.violet2, glyph: 'flask' },
  book: { color: tokens.semantic.coin, glyph: 'book' },
  foundation: { color: tokens.dimension.bonds, glyph: 'compass' },
} as const;
const CATEGORY_ORDER = ['research', 'book', 'foundation'] as const;

/** EntryTile: ENTRY_TILE_ART_HEIGHT */
export const ART_H = 42;
/** CoverCard: COVER_WIDTH 156, 2:3 */
export const COVER_W = 156;
export const COVER_H = Math.round(COVER_W * 1.5);
const COVER_GAP = 12; // CarouselRow GAP
/** FabStack lg */
export const FAB_D = 56;
/** TRAIN_MIN_FAVORITES (lib/ideaTraining) */
export const TRAIN_MIN = 5;

// ---------------------------------------------------------------- caixas

export type TileText = { title: string; subtitle: string; x: number; titleY: number; subY: number; w: number; bar?: Rect; pct?: number };
export type ChipBox = { key: string; rect: Rect; icon: string; iconColor: string; label: string; count?: number; accent: string; lit: boolean };
export type MetaItem =
  | { kind: 'icon'; x: number; y: number; name: string; size: number; color: string }
  | { kind: 'text'; x: number; y: number; w: number; h: number; text: string; color: string }
  | { kind: 'pill'; rect: Rect; icon: string; iconColor: string; text: string; color: string; textX: number };
export type CoverBox = {
  m: MaterialFx;
  /** o Pressable inteiro (capa + resumo + linha de baixo) */
  rect: Rect;
  cover: Rect;
  inProgress: boolean;
  pct: number;
  summary: Rect;
  meta: MetaItem[];
  ideasPill: Rect | null;
};
export type RowBox = {
  key: string;
  title: string;
  icon: string;
  accent: string;
  count: number;
  header: Rect;
  groupLabel?: { text: string; rect: Rect };
  covers: CoverBox[];
  rect: Rect;
};

export type LearningLayout = {
  d: Device;
  scroll: number;
  maxScroll: number;
  contentH: number;
  title: Rect;
  search: Rect;
  info: Rect;
  explore: Rect;
  exploreText: TileText;
  train: Rect;
  trainText: TileText;
  cont: Rect | null;
  contText: TileText | null;
  contMat: MaterialFx | null;
  chips: { rect: Rect; items: ChipBox[]; dividers: Rect[] };
  rows: RowBox[];
  fab: Rect;
  badge: Rect | null;
  nav: ReturnType<typeof navLayout>;
  /** todos os alvos, em coordenadas da TELA */
  targets: Record<string, Rect>;
};

const n = naturalLine;

/** EntryTile: card padding 8/12, borda 1, art à esquerda (gap 12), título 15/800 + subtítulo 12/500 (+1) e a barra (5 + 3). */
const tileBox = (x: number, y: number, w: number, artW: number, title: string, subtitle: string, pct?: number): { rect: Rect; text: TileText } => {
  const textH = n(15, 800) + 1 + n(12, 500) + (pct != null ? 5 + 3 : 0);
  const innerH = Math.max(ART_H, textH);
  const h = 2 + 16 + innerH;
  const tx = x + 1 + 12 + artW + 12;
  const ty = y + 1 + 8 + (innerH - textH) / 2;
  const tw = w - 2 - 24 - artW - 12;
  const text: TileText = { title, subtitle, x: tx, w: tw, titleY: ty, subY: ty + n(15, 800) + 1 };
  if (pct != null) {
    text.bar = { x: tx, y: text.subY + n(12, 500) + 5, w: tw, h: 3, r: 2 };
    text.pct = pct;
  }
  return { rect: { x, y, w, h, r: tokens.radius.lg }, text };
};

/** LearningFilterRow › Chip: altura 32, padding 12, borda 1, ícone 13, gap 5, rótulo 12/700, contagem 11/800; aceso e "limpável" ganha um X 13. */
const chipW = (label: string, count: number | undefined, lit: boolean, clearable: boolean) =>
  2 + 24 + 13 + 5 + textWidth(label, 12, 700) + (count != null ? 5 + textWidth(String(count), 11, 800) : 0) + (lit && clearable ? 5 + 13 : 0);

const coverBox = (m: MaterialFx, x: number, y: number, lang: Lang): CoverBox => {
  const cover: Rect = { x, y, w: COVER_W, h: COVER_H, r: tokens.radius.md };
  const hasIdeas = m.ideas > 0;
  const total = Math.max(1, m.ideas);
  const collected = Math.min(m.collected, total);
  const inProgress = hasIdeas && !m.read && collected > 0 && collected < total;
  const summaryLines = lineCount(m.summary[lang], 11.5, 500, COVER_W, 2);
  const summary: Rect = { x, y: y + COVER_H + 8, w: COVER_W, h: summaryLines * 16 };
  // a linha de baixo: flexDirection row, flexWrap, gap 5 (vale entre linhas também), alignItems center
  const metaTop = summary.y + summary.h + 4;
  const textH = n(10, 600);
  const pillH = 2 + textH;
  const subLabel = tr(lang, `subs.${m.sub}.label`);
  const ideaLabel = `${tr(lang, 'learning.ideas.countShort', { count: total })} · ${collected}/${total}`;
  type Raw = { w: number; h: number; make: (x: number, y: number) => MetaItem };
  const dimColor = tokens.dimension[m.dim];
  const cat = CATEGORY_META[m.category];
  const subW = 10 + 3 + textWidth(subLabel, 10, 600);
  const ideaW = 12 + 10 + 3 + textWidth(ideaLabel, 10, 600);
  let ideasPill: Rect | null = null;
  const raws: Raw[] = [
    { w: 11, h: 11, make: (ix, iy) => ({ kind: 'icon', x: ix, y: iy, name: cat.glyph, size: 11, color: cat.color }) },
    {
      w: subW,
      h: Math.max(10, textH),
      make: (ix, iy) => ({ kind: 'pill', rect: { x: ix, y: iy, w: subW, h: Math.max(10, textH) }, icon: SUB_ICON[m.sub], iconColor: dimColor, text: subLabel, color: dimColor, textX: ix + 13 }),
    },
    { w: textWidth('·', 10, 600), h: textH, make: (ix, iy) => ({ kind: 'text', x: ix, y: iy, w: textWidth('·', 10, 600), h: textH, text: '·', color: tokens.text.dim }) },
    {
      w: ideaW,
      h: pillH,
      make: (ix, iy) => {
        ideasPill = { x: ix, y: iy, w: ideaW, h: pillH, r: pillH / 2 };
        const lit = collected > 0;
        return { kind: 'pill', rect: ideasPill, icon: 'albums-outline', iconColor: lit ? tokens.semantic.coinLight : tokens.text.dim, text: ideaLabel, color: lit ? tokens.semantic.coinLight : tokens.text.dim, textX: ix + 6 + 13 };
      },
    },
  ];
  if (m.hasVideo) raws.push({ w: 11, h: 11, make: (ix, iy) => ({ kind: 'icon', x: ix, y: iy, name: 'videocam-outline', size: 11, color: tokens.text.dim }) });
  // quebra em linhas como o flexWrap
  const lines: Raw[][] = [[]];
  let lw = 0;
  for (const r of raws) {
    const cur = lines[lines.length - 1];
    const next = cur.length ? lw + 5 + r.w : r.w;
    if (cur.length && next > COVER_W) {
      lines.push([r]);
      lw = r.w;
    } else {
      cur.push(r);
      lw = next;
    }
  }
  const meta: MetaItem[] = [];
  let ly = metaTop;
  for (const line of lines) {
    const lh = Math.max(...line.map((r) => r.h));
    let lx = x;
    for (const r of line) {
      meta.push(r.make(lx, ly + (lh - r.h) / 2));
      lx += r.w + 5;
    }
    ly += lh + 5;
  }
  const bottom = ly - 5;
  return { m, rect: { x, y, w: COVER_W, h: bottom - y, r: tokens.radius.md }, cover, inProgress, pct: (collected / total) * 100, summary, meta, ideasPill };
};

// ---------------------------------------------------------------- tela

export const layoutLearning = (s: LearningState, ctx: LearningCtx, o: { scrollShown?: number } = {}): LearningLayout => {
  const { fx, lang } = ctx;
  const d = ctx.d ?? DEVICE;
  const W = d.w;
  const CW = W - PAD * 2;
  const scroll = o.scrollShown ?? s.scroll;
  const top0 = d.statusBar - scroll; // a FlatList começa logo abaixo da barra de status (SafeAreaView edges top)
  let y = top0;

  // ---- cabeçalho: paddingTop 16 · linha (título 28/800 flex 1, lupa 40, (i) 40 com marginRight −8) · paddingBottom 8
  y += 16;
  const rowH = Math.max(n(28, 800), 40);
  const info: Rect = { x: W - PAD + 8 - 40, y: y + (rowH - 40) / 2, w: 40, h: 40, r: 20 };
  const search: Rect = { x: info.x - 40, y: info.y, w: 40, h: 40, r: 20 };
  const title: Rect = { x: PAD, y: y + (rowH - n(28, 800)) / 2, w: search.x - PAD, h: n(28, 800) };
  y += rowH + 8;

  // ---- entradas: paddingTop 12 · Explorar (flex 1.35) + Treinar (flex 1), gap 8
  y += 12;
  const exploreW = ((CW - 8) * 1.35) / 2.35;
  const unlocked = fx.favorites >= TRAIN_MIN;
  const ex = tileBox(PAD, y, exploreW, 28 + 16 * Math.max(0, Math.min(3, fx.exploreThumbs.length) - 1), tr(lang, 'learning.reels.entry'),
    fx.catalog.exploreNew > 0 ? tr(lang, 'learning.reels.entrySubtitle', { count: fx.catalog.exploreNew }) : tr(lang, 'learning.reels.entryCaughtUp'));
  const trainSub = !unlocked
    ? tr(lang, 'learning.ideas.train.unlockCount', { count: fx.favorites, min: TRAIN_MIN })
    : fx.trainDue > 0
      ? tr(lang, 'learning.ideas.train.tileDue', { count: fx.trainDue })
      : tr(lang, 'learning.ideas.train.caughtUpShort');
  const tn = tileBox(PAD + exploreW + 8, y, CW - 8 - exploreW, 36, tr(lang, 'learning.ideas.train.tile'), trainSub);
  y += Math.max(ex.rect.h, tn.rect.h);

  // ---- Continue lendo: marginTop 8, largura toda, com a barra
  let cont: Rect | null = null;
  let contText: TileText | null = null;
  let contMat: MaterialFx | null = null;
  if (fx.continue) {
    contMat = materialBySlug(fx, fx.continue);
    y += 8;
    const pct = Math.round((Math.min(contMat.collected, contMat.ideas) / Math.max(1, contMat.ideas)) * 100);
    const c = tileBox(PAD, y, CW, 28, tr(lang, 'learning.continueReading'), contMat.title[lang], pct);
    cont = c.rect;
    contText = c.text;
    y += c.rect.h;
  }

  // ---- filtros: paddingTop 12 · fileira de chips (altura 32, gap 6, divisória 1×18 com marginHorizontal 2)
  y += 12;
  const chipY = y;
  const items: ChipBox[] = [];
  const dividers: Rect[] = [];
  let cx = PAD;
  const push = (c: Omit<ChipBox, 'rect'>, clearable: boolean) => {
    const w = chipW(c.label, c.count, c.lit, clearable);
    items.push({ ...c, rect: { x: cx, y: chipY, w, h: 32, r: 16 } });
    cx += w + 6;
  };
  const divider = () => {
    dividers.push({ x: cx + 2, y: chipY + 7, w: 1, h: 18 });
    cx += 5 + 6;
  };
  const { total, read } = fx.catalog;
  const READ = [
    { key: 'unread', icon: 'bookmark-outline', count: total - read },
    { key: 'read', icon: 'checkmark-done-outline', count: read },
    { key: 'all', icon: 'layers-outline', count: total },
  ];
  for (const r of READ)
    push({ key: r.key, icon: r.icon, iconColor: tokens.text.mid, label: tr(lang, `learning.readFilter.${r.key}`), count: r.count, accent: tokens.brand.violet2, lit: r.key === 'unread' }, false);
  const cats = CATEGORY_ORDER.filter((c) => fx.materials.some((m) => m.category === c));
  if (cats.length) {
    divider();
    for (const c of cats) push({ key: c, icon: CATEGORY_META[c].glyph, iconColor: CATEGORY_META[c].color, label: tr(lang, `learning.category.${c}`), accent: CATEGORY_META[c].color, lit: false }, true);
  }
  const dims = DIM_ORDER.filter((dm) => fx.materials.some((m) => m.dim === dm));
  if (dims.length) {
    divider();
    for (const dm of dims) push({ key: dm, icon: DIM_ICON[dm], iconColor: tokens.dimension[dm], label: tr(lang, `dimensions.${dm}.label`), accent: tokens.dimension[dm], lit: false }, true);
  }
  const chipsRect: Rect = { x: 0, y: chipY, w: W, h: 32 };
  y += 32;
  y += 12; // headerGap

  // ---- fileiras (CarouselRow): cabeçalho (ícone 22, título 16/800, contagem) · marginBottom 10 · capas · marginBottom 20
  const rows: RowBox[] = [];
  const rowDefs: { key: string; title: string; icon: string; accent: string; mats: MaterialFx[]; groupLabel?: string }[] = [];
  const nov = fx.novidades.map((sl) => materialBySlug(fx, sl));
  if (nov.length) rowDefs.push({ key: 'new', title: tr(lang, 'learning.section.new'), icon: 'sparkles', accent: tokens.semantic.coinLight, mats: nov });
  let first = true;
  for (const dm of DIM_ORDER) {
    const mats = fx.materials.filter((m) => m.dim === dm);
    if (!mats.length) continue;
    rowDefs.push({ key: dm, title: tr(lang, `dimensions.${dm}.label`), icon: DIM_ICON[dm], accent: tokens.dimension[dm], mats, groupLabel: first ? upper(lang, tr(lang, 'learning.section.byDim')) : undefined });
    first = false;
  }
  const headH = Math.max(22, n(16, 800), 4 + n(11, 700));
  for (const rd of rowDefs) {
    let groupLabel: RowBox['groupLabel'];
    if (rd.groupLabel) {
      // sectionGroup marginTop 8 · rótulo 11/700 (marginTop 8, marginBottom 12)
      y += 8 + 8;
      groupLabel = { text: rd.groupLabel, rect: { x: PAD, y, w: CW, h: n(11, 700) } };
      y += n(11, 700) + 12;
    }
    const rowTop = y;
    const header: Rect = { x: PAD, y, w: CW, h: headH };
    y += headH + 10;
    const covers = rd.mats.map((m, i) => coverBox(m, PAD + i * (COVER_W + COVER_GAP), y, lang));
    const cardH = Math.max(...covers.map((c) => c.rect.h));
    y += cardH;
    rows.push({ key: rd.key, title: rd.title, icon: rd.icon, accent: rd.accent, count: rd.mats.length, header, groupLabel, covers, rect: { x: PAD, y: rowTop, w: CW, h: y - rowTop } });
    y += 20;
  }

  // paddingBottom: a barra de abas + a lâmpada (fabStackClearance(['lg']) = 16 + 56)
  const contentH = y - top0 + navClearance(d) + 16 + FAB_D;
  const viewH = d.h - d.statusBar;
  const maxScroll = Math.max(0, contentH - viewH);

  // ---- a lâmpada (FabStack: right 16, bottom = useBottomNavClearance + 16) e o número dela
  const fab: Rect = { x: W - 16 - FAB_D, y: d.h - navClearance(d) - 16 - FAB_D, w: FAB_D, h: FAB_D, r: FAB_D / 2 };
  const badgeW = Math.max(20, 10 + 4 + textWidth(String(fx.pendingReviews > 99 ? '99+' : fx.pendingReviews), 10, 800));
  const badge: Rect | null = fx.pendingReviews > 0 ? { x: fab.x + fab.w + 2 - badgeW, y: fab.y - 2, w: badgeW, h: 20, r: 10 } : null;
  const nav = navLayout(d);

  // ---- alvos (na tela; o que sai pela direita é cortado na borda)
  const clip = (r: Rect): Rect => {
    const x0 = Math.max(0, r.x);
    const x1 = Math.min(W, r.x + r.w);
    return { ...r, x: x0, w: Math.max(0, x1 - x0) };
  };
  const t: Record<string, Rect> = {
    screen: { x: 0, y: 0, w: W, h: d.h },
    header: { x: 0, y: top0, w: W, h: 16 + rowH + 8 },
    title,
    search,
    info,
    explore: ex.rect,
    train: tn.rect,
    filters: chipsRect,
    'fab.ideas': fab,
    nav: nav.bar,
    'nav.learning': nav.tabs[3].rect,
  };
  if (cont) t.continue = cont;
  for (const c of items) if (c.rect.x < W) t[`chip.${c.key}`] = clip(c.rect);
  const newRow = rows.find((r) => r.key === 'new');
  if (newRow) {
    t['row.new'] = newRow.rect;
    newRow.covers.forEach((c, i) => {
      if (c.rect.x < W) t[`cover${i}`] = clip(c.rect);
    });
    const ip = newRow.covers[0]?.ideasPill;
    if (ip) t['cover0.ideas'] = { x: ip.x - 4, y: ip.y - 3, w: ip.w + 8, h: ip.h + 6, r: (ip.h + 6) / 2 };
  }
  const dimRow = rows.find((r) => r.key !== 'new');
  if (dimRow) {
    t['row.dim'] = dimRow.rect;
    dimRow.covers.forEach((c, i) => {
      if (c.rect.x < W) t[`dimcover${i}`] = clip(c.rect);
    });
  }
  assertTargets(t);
  return {
    d, scroll, maxScroll, contentH, title, search, info,
    explore: ex.rect, exploreText: ex.text, train: tn.rect, trainText: tn.text,
    cont, contText, contMat, chips: { rect: chipsRect, items, dividers }, rows, fab, badge, nav, targets: t,
  };
};

const STATIC = new Set(TARGETS.learning.static);
const assertTargets = (t: Record<string, Rect>) => {
  for (const k of Object.keys(t)) {
    if (STATIC.has(k)) continue;
    throw new Error(`alvo "${k}" não está em screens/targets.json › learning — registre lá (o lint do roteiro lê aquela lista)`);
  }
};

// ---------------------------------------------------------------- comportamento

/** Tudo o que se toca nesta aba abre outra tela (material, Explorar, Treino, Minhas ideias, o
 *  informativo): a réplica não tem a tela seguinte, então nenhum toque é replicado — o tour aponta. */
export const tapLearning = (_target: string, _s: LearningState, _ctx: LearningCtx): TimedPatch<LearningState>[] | null => null;

/** Rolagem que põe o alvo a ~22% do topo da tela (ou o máximo possível). */
export const scrollForLearning = (target: string, s: LearningState, ctx: LearningCtx): number => {
  const L = layoutLearning({ ...s, scroll: 0 }, ctx);
  const r = L.targets[target];
  if (!r) throw new Error(`scroll: alvo "${target}" não existe agora`);
  return Math.max(0, Math.min(L.maxScroll, r.y - ctx.d.statusBar - ctx.d.h * 0.22));
};

export const initialLearning = (patch: Partial<LearningState> = {}): LearningState => ({ scroll: 0, scrollMotion: null, ...patch });
