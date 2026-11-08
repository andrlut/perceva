// Layout da aba Práticas (a página Hoje), calculado do código do app — não
// medido no navegador. Cada número aqui é um StyleSheet do app (comentado com a
// origem), então a réplica e os retângulos dos alvos do tour saem da MESMA
// conta: o destaque e o dedo nunca chutam coordenada.
//
// Origem: app/app/(tabs)/index.tsx + TodayHeader, ScreenInfoButton,
// BucketTabsV2, TaskCard (SubStack, SubColoredPips), CompletedBucket
// (CompletedRow), RecantoCard, DayRedemptionsCard, FabStack, XPCoinFloat,
// BottomNavBar. Fora do quadro: QuestChipsStrip/WeekStrip (módulos desligados
// por padrão), NotificationOptInCard e PartnerCampaignCard (escondidos no 1º
// dia e durante o tour) e o MoodHubStrip (useIsFirstDay: não aparece no 1º dia).
import { Rect } from '../ui';
import { lineCount, naturalLine, textWidth } from '../text';
import { DEVICE, Device, navClearance, navLayout } from './chrome';
import { Lang, tr } from './i18n';
import { PracticeFx, PracticesFixture, practiceReward, heroDate } from './practicesFixture';
import type { SwipeMotion } from './types';
import TARGETS from './targets.json';

// ---------------------------------------------------------------- estado

/** Uma conclusão do dia (task_completion): a prática e o que ela rendeu. */
export type Completion = { cid: string; id: string; xp: number; coins: number };

export type PracticesState = {
  /** as práticas ainda abertas hoje (a lista Hoje), na ordem de Gerenciar */
  open: string[];
  /** as conclusões do dia (Feitas hoje), na ordem em que aconteceram */
  done: Completion[];
  /** o XP e as moedas do dia (TodayHeader) */
  xp: number;
  coins: number;
  /** a prática que acabou de ser concluída: o cartão apaga no lugar antes de a lista fechar o vão */
  leaving: string | null;
  /** a gaveta Feitas hoje aberta */
  bucketOpen: boolean;
  /** o +XP/+moedas que sobe da tela a cada conclusão (XPCoinFloat): `n` conta as conclusões */
  float: { n: number; xp: number; coins: number } | null;
  scroll: number;
  scrollMotion?: SwipeMotion | 'instant' | null;
};

export type PracticesView = {
  xp: number;
  coins: number;
  scroll: number;
  leaving: { id: string; t: number } | null;
  /** quadros desde que o float subiu (null = nenhum na tela) */
  float: { xp: number; coins: number; age: number } | null;
  /** a seta da gaveta: 0 fechada → 1 aberta (mola, como o chevron do CompletedBucket) */
  chevron: number;
};

export type PracticesCtx = { fx: PracticesFixture; lang: Lang; d: Device };

const PAD = 16; // tokens.space[4]: a borda da página (TodayHeader, BucketTabsV2, taskList)
const GAP = 8; // taskList gap (space[2])

// FabStack: um botão só, lg 56, 16 acima do offset
const FAB_LG = 56;
const FAB_BOTTOM_GAP = 16;
const FAB_CLEARANCE = FAB_BOTTOM_GAP + FAB_LG; // fabStackClearance(['lg'])

// ---------------------------------------------------------------- caixas

export type CardBox = {
  p: PracticeFx;
  /** coordenadas do CONTEÚDO da rolagem */
  rect: Rect;
  tile: Rect;
  body: Rect;
  titleLines: number;
  meta: Rect;
  check: Rect;
  xp: number;
  /** opacidade durante o REFLOW (o cartão que sai apaga, o que volta acende) */
  o?: number;
};
export type RowBox = { c: Completion; p: PracticeFx; rect: Rect; extra: Rect; undo: Rect; last: boolean };
export type Swap = { n: number; o: number };
export type BucketBox = {
  /** o cabeçalho (a linha "Feitas hoje · N"), que é o toque que abre */
  header: Rect;
  open: boolean;
  count: Swap;
  /** "+20 XP" à direita: só com alguma conclusão */
  total: { xp: number; o: number } | null;
  /** a seta: só com alguma conclusão */
  chevronO: number;
  rows: RowBox[];
  /** a altura do corpo aberto (recortada durante o REFLOW) e a opacidade dele */
  bodyH: number;
  bodyO: number;
};
export type HeadBox = {
  prev: Rect;
  headline: Rect;
  weekday: string;
  monthDay: string;
  next: Rect;
  info: Rect;
  stats: Rect;
  xp: Rect;
  coins: Rect;
  mood: Rect;
};
export type TabsBox = { row: Rect; items: { key: 'today' | 'all'; rect: Rect; label: string; count: Swap; active: boolean }[] };
export type FloatBox = { xpBadge: Rect; coinBadge: Rect; o: number; dy: number; scale: number; xp: number; coins: number };

export type PracticesLayout = {
  d: Device;
  contentTop: number;
  scroll: number;
  maxScroll: number;
  contentH: number;
  head: HeadBox;
  tabs: TabsBox;
  cards: CardBox[];
  clearDay: (Rect & { o?: number }) | null;
  bucket: BucketBox & { rect: Rect };
  recanto: Rect | null;
  redemptions: Rect;
  redemptionsAdd: Rect;
  fab: Rect;
  nav: ReturnType<typeof navLayout>;
  /** todos os alvos, em coordenadas da TELA */
  targets: Record<string, Rect>;
  hidden?: string[];
};

const byId = (fx: PracticesFixture, id: string) => {
  const p = fx.practices.find((x) => x.id === id);
  if (!p) throw new Error(`prática "${id}" não está na fixture`);
  return p;
};

// ---------------------------------------------------------------- TaskCard

/** TaskCard: borda 1 (a esquerda 3), paddingVertical 12, paddingLeft 16, paddingRight 14, gap 12 */
const cardBox = (p: PracticeFx, x: number, y: number, w: number, lang: Lang): CardBox => {
  const left = x + 3 + 16;
  const right = x + w - 1 - 14;
  const check0 = { w: 36, h: 36 };
  const bodyX = left + 36 + 12;
  const bodyW = right - check0.w - 12 - bodyX;
  const titleLines = lineCount(p.title[lang], 14, 700, bodyW, 2);
  // metaRow: SubStack 18 · pips 5 · "+20" 13/800 (o mais alto manda)
  const metaH = Math.max(18, naturalLine(13, 800));
  const bodyH = titleLines * 18 + 5 + metaH; // title 14/18 + gap 5
  const innerH = Math.max(36, bodyH);
  const h = 12 * 2 + innerH + 2;
  const cy = y + h / 2;
  const { xp } = practiceReward(p);
  const stars = p.subs.reduce((s, x0) => s + x0.stars, 0);
  const n = Math.min(3, p.subs.length);
  const stackW = 18 + (n - 1) * 12; // bolhas de 18 com marginLeft -6
  const pipsW = stars * 5 + (stars - 1) * 2;
  const metaW = stackW + 8 + pipsW + 8 + textWidth(`+${xp}`, 13, 800, 0.2);
  const bodyTop = cy - bodyH / 2;
  return {
    p,
    rect: { x, y, w, h, r: 14 },
    tile: { x: left, y: cy - 18, w: 36, h: 36, r: 10 },
    body: { x: bodyX, y: bodyTop, w: bodyW, h: bodyH },
    titleLines,
    meta: { x: bodyX - 4, y: bodyTop + titleLines * 18 + 5 - 3, w: metaW + 8, h: metaH + 6, r: 8 },
    check: { x: right - 36, y: cy - 18, w: 36, h: 36, r: 11 },
    xp,
  };
};

// ---------------------------------------------------------------- CompletedRow

/** row: minHeight 60, paddingLeft 12, paddingRight 8, paddingVertical 8, gap 8; botões 44 (o desfazer com marginLeft 4) */
const rowBox = (c: Completion, p: PracticeFx, x: number, y: number, w: number, last: boolean): RowBox => {
  const h = 60;
  const right = x + w - 8;
  const undo: Rect = { x: right - 44, y: y + (h - 44) / 2, w: 44, h: 44, r: 10 };
  const extra: Rect = { x: undo.x - 4 - 8 - 44, y: undo.y, w: 44, h: 44, r: 10 };
  return { c, p, rect: { x, y, w, h: h + (last ? 0 : 1) }, extra, undo, last };
};

// ---------------------------------------------------------------- tela

export type LayoutOpts = {
  /** o XP e as moedas mostrados neste quadro (a conta animando) */
  xpShown?: number;
  coinsShown?: number;
  scrollShown?: number;
};

const BUCKET_HEADER_H = 48; // header minHeight 48

export const layoutPractices = (s: PracticesState, ctx: PracticesCtx, o: LayoutOpts = {}): PracticesLayout => {
  const { fx, lang } = ctx;
  const d = ctx.d ?? DEVICE;
  const W = d.w;
  const CW = W - PAD * 2;

  // ---- TodayHeader: paddingTop 8 · dateRow 40 · gap 10 · statsRow 32 · paddingBottom 8
  const { weekday, monthDay } = heroDate(fx.date, lang);
  const headlineW = textWidth(`${weekday} ${monthDay}`, 24, 800, -0.3);
  const prev: Rect = { x: PAD - 6, y: 8, w: 28, h: 40, r: 10 }; // arrowPrev marginLeft −6
  const headline: Rect = { x: prev.x + 28, y: 8 + (40 - 28) / 2, w: headlineW, h: 28, r: 8 };
  const next: Rect = { x: headline.x + headlineW, y: 8, w: 28, h: 40, r: 10 };
  // ScreenInfoButton: 40 × 40, marginRight −8, no fim da linha da data
  const info: Rect = { x: W - PAD + 8 - 40, y: 8, w: 40, h: 40, r: 20 };
  const statsY = 8 + 40 + 10;
  const numW = (n: number) => textWidth(String(Math.round(n)), 24, 800, -0.4);
  const xpR: Rect = { x: PAD, y: statsY, w: 22 + 6 + numW(o.xpShown ?? s.xp), h: 32, r: 8 };
  const coinsR: Rect = { x: xpR.x + xpR.w + 24, y: statsY, w: 22 + 6 + numW(o.coinsShown ?? s.coins), h: 32, r: 8 };
  const mood: Rect = { x: coinsR.x + coinsR.w + 24, y: statsY + 2, w: 28, h: 28, r: 14 };
  const stats: Rect = { x: PAD - 6, y: statsY - 2, w: mood.x + mood.w - PAD + 12, h: 36, r: 12 };
  const head: HeadBox = { prev, headline, weekday, monthDay, next, info, stats, xp: xpR, coins: coinsR, mood };
  let y = 8 + 40 + 10 + 32 + 8;

  // ---- BucketTabsV2: marginTop 12 · tab paddingVertical 11 + borda de baixo 2 (a do row, 1, fica sob ela)
  y += 12;
  const tabContentH = Math.max(naturalLine(12, 800), naturalLine(9, 800) + 2);
  const tabH = 11 * 2 + tabContentH + 2;
  const tabW = CW / 2;
  const tabs: TabsBox = {
    row: { x: PAD, y, w: CW, h: tabH, r: 0 },
    items: [
      { key: 'today', rect: { x: PAD, y, w: tabW, h: tabH, r: 8 }, label: tr(lang, 'home.views.today'), count: { n: s.open.length, o: 1 }, active: true },
      { key: 'all', rect: { x: PAD + tabW, y, w: tabW, h: tabH, r: 8 }, label: tr(lang, 'home.views.all'), count: { n: fx.practices.length, o: 1 }, active: false },
    ],
  };
  y += tabH;

  // ---- taskList: paddingTop 8, gap 8
  y += 8;
  const cards: CardBox[] = [];
  s.open.forEach((id, i) => {
    if (i > 0) y += GAP;
    const c = cardBox(byId(fx, id), PAD, y, CW, lang);
    cards.push(c);
    y += c.rect.h;
  });
  // "Fechar o dia": só com 2 ou mais abertas · marginTop 8 · minHeight 44
  let clearDay: Rect | null = null;
  if (s.open.length >= 2) {
    y += GAP + 8;
    clearDay = { x: PAD, y, w: CW, h: 44, r: 14 };
    y += 44;
  }
  // Feitas hoje (CompletedBucket, showWhenEmpty): wrap marginTop 8 · header 48 · corpo com as linhas
  if (cards.length || clearDay) y += GAP;
  y += 8;
  const header: Rect = { x: PAD, y, w: CW, h: BUCKET_HEADER_H, r: 14 };
  const open = s.bucketOpen && s.done.length > 0;
  const rows: RowBox[] = [];
  let by = y + BUCKET_HEADER_H;
  if (open) {
    s.done.forEach((c, i) => {
      const r = rowBox(c, byId(fx, c.id), PAD + 1, by, CW - 2, i === s.done.length - 1);
      rows.push(r);
      by += r.rect.h;
    });
    by += 1; // a borda de baixo do corpo
  }
  const bodyH = by - y - BUCKET_HEADER_H;
  const totalXp = s.done.reduce((a, c) => a + c.xp, 0);
  const bucket = {
    rect: { x: PAD, y, w: CW, h: BUCKET_HEADER_H + bodyH, r: 14 },
    header,
    open,
    count: { n: s.done.length, o: 1 },
    total: s.done.length ? { xp: totalXp, o: 1 } : null,
    chevronO: s.done.length ? 1 : 0,
    rows,
    bodyH,
    bodyO: open ? 1 : 0,
  };
  y = by;
  // RecantoCard (Aprender trancada): gap 8 + marginTop 8 · padding 12 · miniatura 56 × 70 · borda 1
  let recanto: Rect | null = null;
  if (fx.recanto) {
    y += GAP + 8;
    recanto = { x: PAD, y, w: CW, h: 12 * 2 + 70 + 2, r: 14 };
    y += recanto.h;
  }
  // DayRedemptionsCard (fora do taskList): marginTop 12 · padding 16 · cabeçalho 32 · gap 8 · vazio (4 + 16 + 4)
  y += 12;
  const redemptions: Rect = { x: PAD, y, w: CW, h: 16 * 2 + 32 + 8 + (4 + 16 + 4) + 2, r: 14 };
  const redemptionsAdd: Rect = { x: PAD + CW - 1 - 16 - 32, y: y + 1 + 16, w: 32, h: 32, r: 8 };
  y += redemptions.h;

  // paddingBottom = navClearance + max(tourBump, fabStackClearance(['lg']))
  const contentH = y + navClearance(d) + FAB_CLEARANCE;
  const viewportH = d.h - d.statusBar;
  const maxScroll = Math.max(0, contentH - viewportH);
  const scroll = Math.max(0, Math.min(maxScroll, o.scrollShown ?? s.scroll));
  const contentTop = d.statusBar - scroll;

  // ---- FabStack: right 16, bottom = navClearance + 16, o + dourado (lg)
  const fab: Rect = { x: W - 16 - FAB_LG, y: d.h - navClearance(d) - FAB_BOTTOM_GAP - FAB_LG, w: FAB_LG, h: FAB_LG, r: FAB_LG / 2 };
  const nav = navLayout(d);

  // ---- alvos em coordenadas da tela
  const sc = (r: Rect): Rect => ({ ...r, y: r.y + contentTop });
  const t: Record<string, Rect> = {
    screen: { x: 0, y: 0, w: W, h: d.h, r: 0 },
    header: sc({ x: PAD - 8, y: 4, w: CW + 16, h: 98 - 4, r: 16 }),
    date: sc(headline),
    'day.prev': sc(prev),
    'day.next': sc(next),
    info: sc(info),
    stats: sc(stats),
    'stats.xp': sc({ ...xpR, x: xpR.x - 6, y: xpR.y - 2, w: xpR.w + 12, h: xpR.h + 4 }),
    'stats.coins': sc({ ...coinsR, x: coinsR.x - 6, y: coinsR.y - 2, w: coinsR.w + 12, h: coinsR.h + 4 }),
    'stats.mood': sc(mood),
    tabs: sc(tabs.row),
    'tab.today': sc(tabs.items[0].rect),
    'tab.all': sc(tabs.items[1].rect),
    bucket: sc(header),
    redemptions: sc(redemptions),
    'redemptions.add': sc(redemptionsAdd),
    'fab.add': fab,
    nav: nav.bar,
    'nav.tasks': nav.tabs[0].rect,
  };
  if (recanto) t.recanto = sc(recanto);
  if (clearDay) t.clearDay = sc(clearDay);
  // a lista inclui o cartão que está apagando: ela só encolhe quando o vão fecha (animado, no REFLOW)
  if (cards.length) {
    const top = cards[0].rect;
    const bot = cards[cards.length - 1].rect;
    t.list = sc({ x: PAD, y: top.y, w: CW, h: bot.y + bot.h - top.y, r: 14 });
  }
  for (const c of cards.filter((x) => x.p.id !== s.leaving)) {
    t[`card:${c.p.id}`] = sc(c.rect);
    t[`card:${c.p.id}:check`] = sc(c.check);
    t[`card:${c.p.id}:meta`] = sc(c.meta);
  }
  // o 1º cartão: o que a lista mostra em cima (o que está saindo já não é alvo — o anel apaga com ele)
  const first = cards[0];
  if (first && first.p.id !== s.leaving) {
    t.card0 = sc(first.rect);
    t['card0.check'] = sc(first.check);
    t['card0.meta'] = sc(first.meta);
  }
  if (bucket.total) {
    const tw = textWidth(`+${bucket.total.xp}`, 13, 800, -0.3) + 2 + textWidth('XP', 9, 700);
    t['bucket.total'] = sc({ x: header.x + header.w - 1 - 12 - 16 - 8 - tw - 6, y: header.y + 10, w: tw + 12, h: 28, r: 8 });
  }
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    if (i === 0) {
      t.done0 = sc(r.rect);
      t['done0.extra'] = sc(r.extra);
      t['done0.undo'] = sc(r.undo);
    }
    if (seen.has(r.p.id)) return;
    seen.add(r.p.id);
    t[`done:${r.p.id}`] = sc(r.rect);
    t[`done:${r.p.id}:extra`] = sc(r.extra);
    t[`done:${r.p.id}:undo`] = sc(r.undo);
  });
  assertTargets(t);

  return { d, contentTop, scroll, maxScroll, contentH, head, tabs, cards, clearDay, bucket, recanto, redemptions, redemptionsAdd, fab, nav, targets: t };
};

// ---------------------------------------------------------------- a lista que se reorganiza (REFLOW)

const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpR = (a: Rect, b: Rect, t: number): Rect => ({ x: lerpN(a.x, b.x, t), y: lerpN(a.y, b.y, t), w: lerpN(a.w, b.w, t), h: lerpN(a.h, b.h, t), r: lerpN(a.r ?? 0, b.r ?? 0, t) });
const swap = (a: number, b: number, out: number, inn: number, t: number): Swap => (a === b ? { n: b, o: 1 } : t < 0.5 ? { n: a, o: out } : { n: b, o: inn });

/**
 * A lista entre dois layouts (A = antes, B = depois, `t` 0..1 já com a curva): o que existe nos dois
 * desliza; o que só existe num deles apaga ou acende NO LUGAR, em sequência — o que sai na primeira
 * metade, o que entra na segunda —, pra que dois textos nunca se leiam no mesmo lugar (a contagem
 * "Hoje 4" → "Hoje 3", "Feitas hoje 0" → "1"). A gaveta aberta cresce da altura do cabeçalho até a
 * dela (recortada), empurrando o Recanto, como o LinearTransition do CompletedBucket. `gone`: o
 * cartão que já tinha apagado (o concluído) não volta.
 */
export const blendPractices = (A: PracticesLayout, B: PracticesLayout, t: number, gone: string | null): PracticesLayout => {
  if (t >= 1) return B;
  const out = Math.max(0, 1 - 2 * t);
  const inn = Math.max(0, 2 * t - 1);
  const scroll = lerpN(A.scroll, B.scroll, t);
  const contentTop = B.d.statusBar - scroll;

  const cards: CardBox[] = B.cards.map((cb) => {
    const ca = A.cards.find((x) => x.p.id === cb.p.id);
    if (!ca) return { ...cb, o: inn };
    const k = (ra: Rect, rb: Rect) => lerpR(ra, rb, t);
    return { ...cb, rect: k(ca.rect, cb.rect), tile: k(ca.tile, cb.tile), body: k(ca.body, cb.body), meta: k(ca.meta, cb.meta), check: k(ca.check, cb.check) };
  });
  for (const ca of A.cards) if (ca.p.id !== gone && !B.cards.some((c) => c.p.id === ca.p.id)) cards.push({ ...ca, o: out });

  let clearDay = B.clearDay;
  if (A.clearDay && B.clearDay) clearDay = lerpR(A.clearDay, B.clearDay, t);
  else if (A.clearDay) clearDay = { ...A.clearDay, o: out };
  else if (B.clearDay) clearDay = { ...B.clearDay, o: inn };

  const ba = A.bucket;
  const bb = B.bucket;
  const opening = !ba.open && bb.open;
  const closing = ba.open && !bb.open;
  const totalChanged = (ba.total?.xp ?? null) !== (bb.total?.xp ?? null);
  const bucket = {
    ...bb,
    header: lerpR(ba.header, bb.header, t),
    rect: lerpR(ba.rect, bb.rect, t),
    count: swap(ba.count.n, bb.count.n, out, inn, t),
    total: totalChanged ? (t < 0.5 ? (ba.total ? { ...ba.total, o: out } : null) : bb.total ? { ...bb.total, o: inn } : null) : bb.total,
    chevronO: ba.chevronO === bb.chevronO ? bb.chevronO : t < 0.5 ? ba.chevronO * out : bb.chevronO * inn,
    // abrindo: as linhas de B aparecem na altura que a gaveta já abriu; fechando: as de A somem recortadas
    open: bb.open || closing,
    rows: closing ? ba.rows.map((r) => ({ ...r })) : bb.rows,
    bodyH: lerpN(ba.bodyH, bb.bodyH, t),
    bodyO: opening ? Math.min(1, t * 2) : closing ? out : bb.bodyO,
  };
  if (bucket.open && !opening && !closing) {
    // a gaveta já aberta muda de linhas (o +1, o desfazer): desliza junto
    bucket.rows = bb.rows.map((rb) => {
      const ra = ba.rows.find((x) => x.c.cid === rb.c.cid);
      return ra ? { ...rb, rect: lerpR(ra.rect, rb.rect, t), extra: lerpR(ra.extra, rb.extra, t), undo: lerpR(ra.undo, rb.undo, t) } : rb;
    });
  }
  if (closing) {
    const dy = bucket.header.y - ba.header.y;
    bucket.rows = ba.rows.map((r) => ({ ...r, rect: { ...r.rect, y: r.rect.y + dy }, extra: { ...r.extra, y: r.extra.y + dy }, undo: { ...r.undo, y: r.undo.y + dy } }));
  }

  const tabs: TabsBox = {
    ...B.tabs,
    items: B.tabs.items.map((it, i) => ({ ...it, count: swap(A.tabs.items[i].count.n, it.count.n, out, inn, t) })),
  };

  // os alvos: os dos dois interpolam (na tela = no conteúdo + rolagem, ambos interpolados); os de um só
  // ficam no lugar deles enquanto aparecem
  const targets: Record<string, Rect> = {};
  const shift = (r: Rect, from: PracticesLayout): Rect => ({ ...r, y: r.y - from.contentTop + contentTop });
  for (const [k, rb] of Object.entries(B.targets)) {
    const ra = A.targets[k];
    if (ra) targets[k] = lerpR(ra, rb, t);
    else if (t >= 0.5) targets[k] = shift(rb, B);
  }
  if (t < 0.5) for (const [k, ra] of Object.entries(A.targets)) if (!B.targets[k]) targets[k] = shift(ra, A);

  return {
    ...B,
    scroll,
    contentTop,
    contentH: lerpN(A.contentH, B.contentH, t),
    tabs,
    cards,
    clearDay,
    bucket,
    recanto: A.recanto && B.recanto ? lerpR(A.recanto, B.recanto, t) : B.recanto,
    redemptions: lerpR(A.redemptions, B.redemptions, t),
    redemptionsAdd: lerpR(A.redemptionsAdd, B.redemptionsAdd, t),
    targets,
  };
};

const STATIC = new Set(TARGETS.practices.static);
const assertTargets = (t: Record<string, Rect>) => {
  for (const k of Object.keys(t)) {
    if (STATIC.has(k) || /^(card|done):[\w-]+(:(check|meta|extra|undo))?$/.test(k)) continue;
    throw new Error(`alvo "${k}" não está em screens/targets.json — registre lá (o lint do roteiro lê aquela lista)`);
  }
};

// ---------------------------------------------------------------- comportamento (o que o app faz no toque)

/** `lift`: ver TimedPatch em screens/types.ts (o toque põe outra coisa debaixo do dedo). */
export type TimedPatch = { delay?: number; patch: Partial<PracticesState>; lift?: boolean };

/**
 * Concluir no check: no app a conclusão é otimista (a prática sai da lista na hora, o XP e as
 * moedas do dia sobem e o XPCoinFloat sobe da tela). Aqui o cartão apaga no lugar em LEAVE_FADE
 * quadros e só então a lista fecha o vão, ANIMADA em REFLOW quadros (o de baixo sobe pro lugar
 * dele, Fechar o dia e Feitas hoje sobem junto): fechado debaixo do dedo, o cartão de baixo caía
 * onde a onda ainda estava e parecia ser ele o tocado. A mão sai em T+8 (lift).
 */
export const LEAVE_FADE = 6;
/** A lista se reorganiza nisto (quadros), em ease-in-out. */
export const REFLOW = 12;

const complete = (s: PracticesState, ctx: PracticesCtx, id: string, leave: boolean): TimedPatch[] => {
  const p = byId(ctx.fx, id);
  const r = practiceReward(p);
  const n = (s.float?.n ?? 0) + 1;
  const c: Completion = { cid: `${id}#${n}`, id, xp: r.xp, coins: r.coins };
  const gain = { xp: s.xp + r.xp, coins: s.coins + r.coins, float: { n, xp: r.xp, coins: r.coins } };
  if (!leave) return [{ patch: { ...gain, done: [...s.done, c] } }];
  return [
    { patch: { ...gain, leaving: id }, lift: true },
    { delay: LEAVE_FADE, patch: { leaving: null, open: s.open.filter((x) => x !== id), done: [...s.done, c] } },
  ];
};

export const tapPractices = (target: string, s: PracticesState, ctx: PracticesCtx): TimedPatch[] | null => {
  const L = layoutPractices(s, ctx);
  const check = target === 'card0.check' ? L.cards[0]?.p.id : /^card:([\w-]+):check$/.exec(target)?.[1];
  if (check) return s.open.includes(check) ? complete(s, ctx, check, true) : null;
  // a gaveta: toque no título abre e fecha (vazia, o botão está desabilitado)
  if (target === 'bucket') return s.done.length ? [{ patch: { bucketOpen: !s.bucketOpen } }] : null;
  const alias = /^done0\.(extra|undo)$/.exec(target);
  const byKey = /^done:([\w-]+):(extra|undo)$/.exec(target);
  if ((alias || byKey) && L.bucket.open) {
    const r = alias ? L.bucket.rows[0] : L.bucket.rows.find((x) => x.p.id === byKey![1]);
    const what = alias ? alias[1] : byKey![2];
    if (!r) return null;
    // +1: registra de novo com as mesmas estrelas e moedas (a prática não volta pra lista)
    if (what === 'extra') return complete(s, ctx, r.p.id, false);
    // desfazer: devolve o XP e as moedas; sem outra conclusão no dia, a prática volta pra lista
    // (no lugar dela, a ordem de Gerenciar) e a gaveta vazia fecha
    const done = s.done.filter((x) => x.cid !== r.c.cid);
    const back = done.some((x) => x.id === r.p.id) ? s.open : ctx.fx.practices.map((p) => p.id).filter((id) => s.open.includes(id) || id === r.p.id);
    return [{ patch: { done, open: back, xp: Math.max(0, s.xp - r.c.xp), coins: Math.max(0, s.coins - r.c.coins), bucketOpen: done.length > 0 && s.bucketOpen }, lift: true }];
  }
  return null;
};

/** Rolagem que põe o alvo a ~22% do topo da tela (ou o máximo possível). */
export const scrollForPractices = (target: string, s: PracticesState, ctx: PracticesCtx): number => {
  const L = layoutPractices({ ...s, scroll: 0 }, ctx);
  const r = L.targets[target];
  if (!r) throw new Error(`scroll: alvo "${target}" não existe agora`);
  return Math.max(0, Math.min(L.maxScroll, r.y - ctx.d.statusBar - ctx.d.h * 0.22));
};

export const initialPractices = (fx: PracticesFixture, patch: Partial<PracticesState> = {}): PracticesState => ({
  open: fx.practices.map((p) => p.id),
  done: [],
  xp: fx.xp,
  coins: fx.coins,
  leaving: null,
  bucketOpen: false,
  float: null,
  scroll: 0,
  scrollMotion: null,
  ...patch,
});
