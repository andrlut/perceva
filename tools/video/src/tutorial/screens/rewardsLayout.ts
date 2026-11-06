// Layout da aba Recompensas, calculado do código do app — não medido no
// navegador. Cada número aqui é um StyleSheet do app (comentado com a origem),
// então a réplica e os retângulos dos alvos do tour saem da MESMA conta: o
// destaque e o dedo nunca chutam coordenada.
//
// Origem: app/app/(tabs)/rewards.tsx + VaultHero, TrackedRewardCard,
// RewardCard, AddCard, FabStack, BottomNavBar, ScreenInfoButton,
// BuyConfirmModal, BuyCelebrationModal.
import { CATEGORY_ORDER, Rect, RewardCategory } from '../ui';
import { lineCount, naturalLine, textWidth } from '../text';
import { DEVICE, Device, navClearance, navLayout } from './chrome';
import { Lang, num, tr, upper } from './i18n';
import { RewardFx, RewardsFixture } from './rewardsFixture';
import TARGETS from './targets.json';

// ---------------------------------------------------------------- estado

export type RewardsState = {
  balance: number;
  goal: string | null;
  filter: RewardCategory[];
  /** deslocamento da rolagem, em dp */
  scroll: number;
  confirm: { id: string; qty: number } | null;
  celebration: { id: string; qty: number; paid: number } | null;
  /** o cartão que acabou de ser mirado: apaga no lugar antes de virar a meta (ver TRACK_SETTLE) */
  leaving: string | null;
};

/**
 * Valores animados do quadro (o estado é o destino; a vista é o caminho até ele).
 * Modal: `body` é o cartão vazio (fundo quase opaco), `content` é o texto dele, `card`
 * a idade (a mola da entrada). Texto nunca atravessa texto: o conteúdo só aparece com o
 * corpo já opaco e sai antes do corpo, e o véu (`scrim`) é um só pros dois modais.
 */
export type ModalView = { body: number; content: number; card: number; closing: boolean };
export type RewardsView = {
  balance: number;
  scroll: number;
  /** 0..1 — o véu escuro atrás dos modais, comum aos dois (não pisca entre a confirmação e a comemoração) */
  scrim: number;
  confirm: ({ id: string; qty: number } & ModalView) | null;
  celebration: ({ id: string; qty: number; paid: number; icon: number } & ModalView) | null;
  /** o cartão mirado apagando no lugar: `t` 0..1 em LEAVE_FADE quadros */
  leaving: { id: string; t: number } | null;
};

export type RewardsCtx = { fx: RewardsFixture; lang: Lang; d: Device };

/** rewards.tsx: "Quase lá" = falta no máximo 30% do preço. */
export const ALMOST_RATIO = 0.3;
/** BuyConfirmModal: o servidor também trava em 50. */
export const MAX_QTY = 50;

// FabStack: diâmetros sm 38 / md 48 / lg 56, gap 8, 16 acima do offset
const FAB = { md: 48, lg: 56 };
const FAB_GAP = 8;
const FAB_BOTTOM_GAP = 16;
const FAB_CLEARANCE = FAB_BOTTOM_GAP + FAB.md + FAB.lg + FAB_GAP;

const PAD = 16; // styles.content padding (tokens.space[4])
const GRID_GAP = 12; // styles.grid gap (space[3])

// ---------------------------------------------------------------- caixas

export type CardBox = {
  reward: RewardFx;
  /** coordenadas do CONTEÚDO da rolagem */
  rect: Rect;
  affordable: boolean;
  deficit: number;
  pct: number;
  titleLines: number;
  footerH: number;
  cta: Rect;
};
export type SectionKey = 'available' | 'almost' | 'big';
export type SectionBox = { key: SectionKey; header: Rect; rect: Rect; cards: CardBox[] };
export type GoalBox = {
  rect: Rect;
  reward: RewardFx;
  titleLines: number;
  subLines: number;
  bodyH: number;
  affordable: boolean;
  deficit: number;
  pct: number;
  close: Rect;
  progress: Rect;
  cta: Rect | null;
};
export type ConfirmBox = {
  reward: RewardFx;
  qty: number;
  total: number;
  canBuy: boolean;
  rect: Rect;
  titleLines: number;
  headerH: number;
  qtyRow: Rect | null;
  minus: Rect | null;
  plus: Rect | null;
  totalRow: Rect;
  redeem: Rect;
  cancel: Rect;
  cancelHit: Rect;
};
export type CelebBox = {
  reward: RewardFx;
  qty: number;
  paid: number;
  title: string;
  titleLines: number;
  rect: Rect;
  enjoy: Rect;
  undo: Rect;
  undoHit: Rect;
};

export type RewardsLayout = {
  d: Device;
  /** y na tela da origem do conteúdo da rolagem (barra de status − rolagem) */
  contentTop: number;
  scroll: number;
  maxScroll: number;
  contentH: number;
  hero: { rect: Rect; row: Rect; status: string; statusH: number; label: string; labelW: number };
  info: Rect;
  goal: GoalBox | null;
  trackCta: Rect | null;
  chips: { rect: Rect; items: { cat: RewardCategory; rect: Rect }[] };
  sections: SectionBox[];
  add: Rect;
  fabs: { calendar: Rect; manage: Rect };
  nav: ReturnType<typeof navLayout>;
  confirm: ConfirmBox | null;
  celebration: CelebBox | null;
  /** todos os alvos, em coordenadas da TELA */
  targets: Record<string, Rect>;
};

const byId = (fx: RewardsFixture, id: string) => {
  const r = fx.rewards.find((x) => x.id === id);
  if (!r) throw new Error(`recompensa "${id}" não está na fixture`);
  return r;
};

// ---------------------------------------------------------------- RewardCard

const CARD_MIN_H = 188; // styles.root minHeight
const CARD_PAD = 14; // styles.content padding
const cardCtaH = () => 6 * 2 + naturalLine(10, 800) + 2; // paddingVertical 6, texto 10/800, borda 1
const cardFooterH = () => Math.max(naturalLine(16, 800), 14, cardCtaH());

const cardBox = (reward: RewardFx, rect0: { x: number; y: number; w: number }, coins: number, lang: Lang): CardBox => {
  const affordable = coins >= reward.cost;
  const deficit = Math.max(0, reward.cost - coins);
  const pct = Math.max(0, Math.min(100, Math.round((coins / reward.cost) * 100)));
  const innerW = rect0.w - 2 - CARD_PAD * 2;
  const titleLines = lineCount(reward.title[lang], 15, 800, innerW, 2);
  const descH = reward.description ? 15 : 0; // description 11/15, numberOfLines 1
  // progressBlock: marginTop 10 + trilho 4 + rótulo (marginTop 4, 10/700)
  const progressH = affordable ? 0 : 10 + 4 + 4 + naturalLine(10, 700);
  // topRow 42 + marginBottom 8; título 15/18 + marginBottom 2
  const top = 42 + 8 + titleLines * 18 + 2 + descH + progressH;
  const footerH = cardFooterH();
  const contentH = CARD_PAD + top + 12 + footerH + CARD_PAD;
  const h = Math.max(CARD_MIN_H, contentH + 2);
  const label = upper(lang, tr(lang, affordable ? 'rewards.vault.cta.buy' : 'rewards.vault.cta.track'));
  const textW = textWidth(label, 10, 800, 0.7);
  // ctaBuy: paddingHorizontal 12 · ctaTrack: 10 + ícone 9 + marginRight 4
  const ctaW = (affordable ? 12 * 2 + textW : 10 * 2 + 9 + 4 + textW) + 2;
  const ctaH = cardCtaH();
  const rect: Rect = { x: rect0.x, y: rect0.y, w: rect0.w, h, r: 16 };
  const footerTop = rect.y + h - 1 - CARD_PAD - footerH;
  const cta: Rect = { x: rect.x + rect.w - 1 - CARD_PAD - ctaW, y: footerTop + (footerH - ctaH) / 2, w: ctaW, h: ctaH, r: ctaH / 2 };
  return { reward, rect, affordable, deficit, pct, titleLines, footerH, cta };
};

// ---------------------------------------------------------------- modais

const confirmBox = (reward: RewardFx, qty: number, coins: number, d: Device, lang: Lang): ConfirmBox => {
  const cardW = Math.min(d.w - 40, 360); // scrim padding 20 · cardWrap maxWidth 360
  const innerW = cardW - 2 - 40;
  const colW = innerW - 60 - 12;
  const titleLines = lineCount(reward.title[lang], 18, 800, colW, 2);
  const headerH = Math.max(60, naturalLine(10, 800) + 4 + titleLines * 22);
  const oneShot = !!reward.oneShot;
  const q = oneShot ? 1 : qty;
  const qtyH = 12 * 2 + Math.max(naturalLine(13, 700), 36, naturalLine(22, 800)) + 2;
  const totalH = Math.max(naturalLine(13, 700), 16, naturalLine(20, 800));
  const total = reward.cost * q;
  const canBuy = total <= coins;
  const defH = naturalLine(11, 700);
  const primaryH = 12 * 2 + naturalLine(13, 800) + 2;
  const ghostH = 8 * 2 + naturalLine(13, 700);
  const contentH =
    20 + headerH + 16 + (oneShot ? 0 : qtyH + 16) + totalH + (canBuy ? 0 : 16 + defH - 12) + 16 + (8 + primaryH + 8 + ghostH) + 20;
  const h = contentH + 2;
  const x = (d.w - cardW) / 2;
  const y = (d.h - h) / 2;
  const ix = x + 1 + 20;
  let cy = y + 1 + 20 + headerH + 16;
  let qtyRow: Rect | null = null;
  let minus: Rect | null = null;
  let plus: Rect | null = null;
  if (!oneShot) {
    qtyRow = { x: ix, y: cy, w: innerW, h: qtyH, r: 14 };
    const valueW = Math.max(36, textWidth(String(q), 22, 800));
    const right = ix + innerW - 1 - 12;
    const by = cy + (qtyH - 36) / 2;
    plus = { x: right - 36, y: by, w: 36, h: 36, r: 18 };
    minus = { x: right - 36 - 12 - valueW - 12 - 36, y: by, w: 36, h: 36, r: 18 };
    cy += qtyH + 16;
  }
  const totalRow: Rect = { x: ix, y: cy, w: innerW, h: totalH, r: 8 };
  cy += totalH + (canBuy ? 0 : 16 + defH - 12) + 16 + 8;
  const redeem: Rect = { x: ix, y: cy, w: innerW, h: primaryH, r: primaryH / 2 };
  cy += primaryH + 8;
  const cancelHit: Rect = { x: ix, y: cy, w: innerW, h: ghostH, r: 12 };
  const cw = textWidth(tr(lang, 'rewards.buyConfirm.cancel'), 13, 700) + 32;
  const cancel: Rect = { x: ix + (innerW - cw) / 2, y: cy, w: cw, h: ghostH, r: ghostH / 2 };
  return { reward, qty: q, total, canBuy, rect: { x, y, w: cardW, h, r: 22 }, titleLines, headerH, qtyRow, minus, plus, totalRow, redeem, cancel, cancelHit };
};

const celebBox = (reward: RewardFx, qty: number, paid: number, d: Device, lang: Lang): CelebBox => {
  const cardW = Math.min(d.w - 40, 360);
  const innerW = cardW - 2 - 40;
  const title =
    qty > 1
      ? tr(lang, 'rewards.celebration.titleN', { qty, title: reward.title[lang] })
      : tr(lang, 'rewards.celebration.title', { title: reward.title[lang] });
  const titleLines = lineCount(title, 22, 800, innerW - 16, 2);
  const eyebrowH = naturalLine(10, 800);
  const costH = Math.max(16, naturalLine(18, 800));
  const primaryH = 12 * 2 + Math.max(14, naturalLine(12, 800)) + 2;
  const ghostH = 8 * 2 + naturalLine(13, 700);
  const contentH = 20 + eyebrowH + 12 + (96 + 16) + 12 + titleLines * 26 + 12 + costH + 12 + (12 + primaryH + 8 + ghostH) + 20;
  const h = contentH + 2;
  const x = (d.w - cardW) / 2;
  const y = (d.h - h) / 2;
  const ix = x + 1 + 20;
  const ay = y + 1 + 20 + eyebrowH + 12 + 112 + 12 + titleLines * 26 + 12 + costH + 12 + 12;
  const enjoy: Rect = { x: ix, y: ay, w: innerW, h: primaryH, r: primaryH / 2 };
  const undoHit: Rect = { x: ix, y: ay + primaryH + 8, w: innerW, h: ghostH, r: 12 };
  const uw = textWidth(tr(lang, 'rewards.celebration.undo'), 13, 700) + 32;
  const undo: Rect = { x: ix + (innerW - uw) / 2, y: undoHit.y, w: uw, h: ghostH, r: ghostH / 2 };
  return { reward, qty, paid, title, titleLines, rect: { x, y, w: cardW, h, r: 22 }, enjoy, undo, undoHit };
};

// ---------------------------------------------------------------- tela

export type LayoutOpts = {
  /** saldo mostrado neste quadro (conta animando) — o balde das seções usa o estado */
  balanceShown?: number;
  scrollShown?: number;
  /** recompensa do modal quando ele está fechado (o tour mira antes de abrir) */
  confirmHint?: { id: string; qty: number } | null;
  celebrationHint?: { id: string; qty: number; paid: number } | null;
  /** o modal está saindo: ainda é desenhado, mas os alvos dele já não existem */
  confirmClosing?: boolean;
  celebrationClosing?: boolean;
};

/** Folga (dp) de cada lado do destaque da quantidade/total: o valor do total encosta na
 *  borda da linha. 8 + o respiro de 6 do Spotlight = 14, dentro dos 20 de padding do cartão. */
const TOTAL_PAD = 8;

export const layoutRewards = (s: RewardsState, ctx: RewardsCtx, o: LayoutOpts = {}): RewardsLayout => {
  const { fx, lang } = ctx;
  const d = ctx.d ?? DEVICE;
  const W = d.w;
  const CW = W - PAD * 2;
  const coins = s.balance;
  const shown = o.balanceShown ?? s.balance;

  const goalReward = s.goal ? byId(fx, s.goal) : null;

  // ---- VaultHero: heroWrap paddingTop 20 · linha 72 · gap 8 · status (13/18, 2 linhas) · paddingBottom 16
  let status = tr(lang, 'rewards.vault.heroStatusIdle');
  if (goalReward) status = coins >= goalReward.cost ? tr(lang, 'rewards.vault.heroStatusReady', { title: goalReward.title[lang] }) : '';
  // Texto vazio no Android ainda ocupa uma linha (o status some, o espaço fica).
  const statusH = 18 * (status ? lineCount(status, 13, 600, 280, 2) : 1);
  const heroH = 20 + 72 + 8 + statusH + 16;
  const label = num(lang, shown);
  const labelW = textWidth(label, 48, 800, -1.2);
  const rowW = 72 + 12 + labelW;
  const hero = {
    rect: { x: PAD, y: PAD, w: CW, h: heroH, r: 18 },
    row: { x: PAD + (CW - rowW) / 2, y: PAD + 20, w: rowW, h: 72, r: 18 },
    status,
    statusH,
    label,
    labelW,
  };
  // ScreenInfoButton absoluto: top 6, right 8, caixa 40
  const info: Rect = { x: W - 8 - 40, y: 6, w: 40, h: 40, r: 20 };
  let y = PAD + heroH;

  // ---- TrackedRewardCard (meta) ou o convite "Mirar uma recompensa"
  let goal: GoalBox | null = null;
  let trackCta: Rect | null = null;
  if (goalReward) {
    const innerW = CW - 2 - 32;
    const colW = innerW - 60 - 14;
    const titleLines = lineCount(goalReward.title[lang], 17, 800, colW, 2);
    const subLines = goalReward.description ? lineCount(goalReward.description[lang], 12, 500, colW, 2) : 0;
    const colH = titleLines * 21 + (subLines ? 2 + subLines * naturalLine(12, 500) : 0);
    const bodyH = Math.max(60, colH);
    const labelsH = Math.max(13, naturalLine(12, 800), naturalLine(11, 700));
    const progressH = 8 + 8 + labelsH;
    const affordable = coins >= goalReward.cost;
    const deficit = Math.max(0, goalReward.cost - coins);
    const pct = Math.min(100, Math.round((coins / goalReward.cost) * 100));
    const ctaH = 7 * 2 + naturalLine(11, 800) + 2;
    const h = 2 + 32 + 24 + 14 + bodyH + 14 + progressH + (affordable ? 14 + ctaH : 0);
    const rect: Rect = { x: PAD, y, w: CW, h, r: 18 };
    const ix = rect.x + 1 + 16;
    const progressY = rect.y + 1 + 16 + 24 + 14 + bodyH + 14;
    const ctaW = 14 * 2 + textWidth(upper(lang, tr(lang, 'rewards.vault.cta.buy')), 11, 800, 0.7) + 2;
    goal = {
      rect,
      reward: goalReward,
      titleLines,
      subLines,
      bodyH,
      affordable,
      deficit,
      pct,
      close: { x: rect.x + rect.w - 1 - 16 - 24, y: rect.y + 1 + 16, w: 24, h: 24, r: 12 },
      progress: { x: ix, y: progressY, w: innerW, h: progressH, r: 8 },
      cta: affordable ? { x: ix, y: progressY + progressH + 14, w: ctaW, h: ctaH, r: ctaH / 2 } : null,
    };
    y += h + 16; // trackedWrap marginBottom
  } else {
    // trackCta: paddingVertical 12 · ícone 38 · título bodyLg 16/23 + sub 12/16 (marginTop 2)
    const h = 12 * 2 + Math.max(38, 23 + 2 + 16) + 2;
    trackCta = { x: PAD, y, w: CW, h, r: 18 };
    y += h + 16;
  }

  // ---- chips: flex 1, gap 8, paddingVertical 10, ícone 14, texto 11/800
  const chipH = 10 * 2 + Math.max(14, naturalLine(11, 800)) + 2;
  const chipW = (CW - 8 * 2) / 3;
  const chips = {
    rect: { x: PAD, y, w: CW, h: chipH, r: 12 },
    items: CATEGORY_ORDER.map((cat, i) => ({ cat, rect: { x: PAD + i * (chipW + 8), y, w: chipW, h: chipH, r: 12 } as Rect })),
  };
  y += chipH + 20;

  // ---- seções: filtro de categoria, meta fora da grade, baldes pelo saldo
  const visible = fx.rewards.filter((r) => (!s.filter.length || s.filter.includes(r.category)) && r.id !== s.goal);
  const buckets: Record<SectionKey, RewardFx[]> = { available: [], almost: [], big: [] };
  for (const r of visible) {
    const deficit = r.cost - coins;
    if (deficit <= 0) buckets.available.push(r);
    else if (deficit / r.cost <= ALMOST_RATIO) buckets.almost.push(r);
    else buckets.big.push(r);
  }
  buckets.almost.sort((a, b) => a.cost - coins - (b.cost - coins));
  buckets.big.sort((a, b) => b.cost - a.cost);

  const sections: SectionBox[] = [];
  for (const key of ['available', 'almost', 'big'] as SectionKey[]) {
    const list = buckets[key];
    if (!list.length) continue;
    const top = y;
    const header: Rect = { x: PAD, y, w: CW, h: 21, r: 6 }; // h3 17/21
    y += 21 + 12;
    const wide = key === 'big';
    const cards: CardBox[] = [];
    // grade: largura 48% + flexGrow 1 → dois por linha; um sozinho na linha estica
    for (let i = 0; i < list.length; ) {
      const pair = wide ? [list[i]] : list.slice(i, i + 2);
      const w = pair.length === 2 ? (CW - GRID_GAP) / 2 : CW;
      const row = pair.map((r, j) => cardBox(r, { x: PAD + j * (w + GRID_GAP), y, w }, coins, lang));
      cards.push(...row);
      y += Math.max(...row.map((c) => c.rect.h)) + GRID_GAP;
      i += pair.length;
    }
    y -= GRID_GAP;
    sections.push({ key, header, rect: { x: PAD, y: top, w: CW, h: y - top, r: 18 }, cards });
    y += 20; // section marginBottom
  }

  // ---- AddCard (addCardWrap marginTop 8): paddingVertical 12 · ícone 36 · rótulo 14/800 + sub 12/500
  y += 8;
  const addH = 12 * 2 + Math.max(36, naturalLine(14, 800) + 2 + naturalLine(12, 500)) + 2;
  const add: Rect = { x: PAD, y, w: CW, h: addH, r: 18 };
  y += addH;

  // paddingBottom = navClearance + max(tourBump, FAB clearance)
  const contentH = y + navClearance(d) + FAB_CLEARANCE;
  const viewportH = d.h - d.statusBar;
  const maxScroll = Math.max(0, contentH - viewportH);
  const scroll = Math.max(0, Math.min(maxScroll, o.scrollShown ?? s.scroll));
  const contentTop = d.statusBar - scroll;

  // ---- FabStack: right 16, bottom = navClearance + 16, coluna centrada na de 56
  const manage: Rect = { x: W - 16 - FAB.lg, y: d.h - navClearance(d) - FAB_BOTTOM_GAP - FAB.lg, w: FAB.lg, h: FAB.lg, r: FAB.lg / 2 };
  const calendar: Rect = { x: W - 16 - FAB.lg + (FAB.lg - FAB.md) / 2, y: manage.y - FAB_GAP - FAB.md, w: FAB.md, h: FAB.md, r: FAB.md / 2 };
  const nav = navLayout(d);

  // ---- modais (geometria existe mesmo fechado: o tour mira antes de abrir)
  const cf = s.confirm ?? o.confirmHint ?? null;
  const confirm = cf ? confirmBox(byId(fx, cf.id), cf.qty, coins, d, lang) : null;
  const cb = s.celebration ?? o.celebrationHint ?? null;
  const celebration = cb ? celebBox(byId(fx, cb.id), cb.qty, cb.paid, d, lang) : null;

  // ---- alvos em coordenadas da tela
  const sc = (r: Rect): Rect => ({ ...r, y: r.y + contentTop });
  const t: Record<string, Rect> = {
    screen: { x: 0, y: 0, w: W, h: d.h, r: 0 },
    balance: sc(hero.rect),
    'balance.value': sc({ ...hero.row, x: hero.row.x - 8, y: hero.row.y - 4, w: hero.row.w + 16, h: hero.row.h + 8 }),
    info: sc(info),
    chips: sc(chips.rect),
    add: sc(add),
    'fab.manage': manage,
    'fab.calendar': calendar,
    fabs: { x: calendar.x - 4, y: calendar.y, w: FAB.lg, h: manage.y + manage.h - calendar.y, r: FAB.lg / 2 },
    nav: nav.bar,
    'nav.rewards': nav.tabs[1].rect,
  };
  for (const c of chips.items) t[`chip.${c.cat}`] = sc(c.rect);
  if (goal) {
    t.goal = sc(goal.rect);
    t['goal.close'] = sc(goal.close);
    t['goal.progress'] = sc(goal.progress);
    if (goal.cta) t['goal.cta'] = sc(goal.cta);
  }
  if (trackCta) t.trackCta = sc(trackCta);
  for (const sec of sections) {
    t[`section.${sec.key}`] = sc(sec.rect);
    for (const c of sec.cards) {
      // o cartão mirado ainda ocupa o lugar (apagando), mas já não é alvo: o anel apaga com ele
      if (c.reward.id === s.leaving) continue;
      t[`card:${c.reward.id}`] = sc(c.rect);
      t[`card:${c.reward.id}:cta`] = sc(c.cta);
    }
  }
  const first = sections[0]?.cards[0];
  if (first && first.reward.id !== s.leaving) {
    t.card0 = sc(first.rect);
    t['card0.cta'] = sc(first.cta);
  }
  // Um modal aberto cobre a loja inteira (o véu é dele): os alvos da loja somem no toque que o
  // abre — o anel que estava num deles apaga junto, em vez de cercar o botão que o modal tapou —
  // e voltam no toque que o fecha. É a regra do fechamento (logo abaixo), ao contrário.
  if (s.confirm || s.celebration) for (const k of Object.keys(t)) if (k !== 'screen') delete t[k];
  // Alvos de um modal que está FECHANDO somem já no toque que o fecha: o anel apaga junto
  // com o conteúdo do cartão, em vez de ficar sobre a loja depois que o modal saiu.
  if (confirm && !o.confirmClosing) {
    t.confirm = confirm.rect;
    // a linha do total não tem respiro (o valor encosta na borda direita): o destaque ganha
    // TOTAL_PAD de cada lado pra o anel não raspar no número
    const tr0 = confirm.totalRow;
    t['confirm.total'] = { x: tr0.x - TOTAL_PAD, y: tr0.y - 2, w: tr0.w + TOTAL_PAD * 2, h: tr0.h + 4, r: 10 };
    t['confirm.redeem'] = confirm.redeem;
    t['confirm.cancel'] = confirm.cancel;
    if (confirm.qtyRow) {
      t['confirm.qty'] = confirm.qtyRow;
      // quantidade + total num destaque só: o + muda o total ali dentro
      const q = confirm.qtyRow;
      t['confirm.amount'] = { x: q.x - TOTAL_PAD, y: q.y - 2, w: q.w + TOTAL_PAD * 2, h: tr0.y + tr0.h + 4 - q.y, r: 16 };
    }
    if (confirm.minus) t['confirm.minus'] = confirm.minus;
    if (confirm.plus) t['confirm.plus'] = confirm.plus;
  }
  if (celebration && !o.celebrationClosing) {
    t.celebration = celebration.rect;
    t['celebration.enjoy'] = celebration.enjoy;
    t['celebration.undo'] = celebration.undo;
  }
  assertTargets(t);

  return { d, contentTop, scroll, maxScroll, contentH, hero, info, goal, trackCta, chips, sections, add, fabs: { calendar, manage }, nav, confirm, celebration, targets: t };
};

const STATIC = new Set(TARGETS.rewards.static);
const assertTargets = (t: Record<string, Rect>) => {
  for (const k of Object.keys(t)) {
    if (STATIC.has(k) || /^card:[\w-]+(:cta)?$/.test(k)) continue;
    throw new Error(`alvo "${k}" não está em screens/targets.json — registre lá (o lint do roteiro lê aquela lista)`);
  }
};

// ---------------------------------------------------------------- comportamento (o que o app faz no toque)

/** `lift`: ver TimedPatch em screens/types.ts (o toque põe outra coisa debaixo do dedo). */
export type TimedPatch = { delay?: number; patch: Partial<RewardsState>; lift?: boolean };

/** Quadros entre fechar a confirmação e abrir a comemoração (a mutação responde). Igual à
 *  saída do texto da confirmação (MODAL.CONTENT_OUT em RewardsScreen, 4): o corpo vazio da
 *  comemoração (maior, cobre o outro) sobe enquanto o corpo vazio da confirmação desce, sob o
 *  mesmo véu — nenhum texto atravessa outro e a loja não aparece entre os dois. */
export const CELEBRATION_DELAY = 4;

/**
 * Mirar: o cartão apaga no lugar em LEAVE_FADE quadros e só TRACK_SETTLE quadros depois do
 * toque (EFFECT + isto) ele vira a meta no topo e a grade fecha o vão. No app a troca é imediata
 * (useSetTrackedReward é otimista), mas fechar o vão debaixo do dedo punha o cartão de baixo
 * (a Viagem) exatamente onde a onda e a mão ainda estavam: parecia que o dedo tinha tocado nele.
 * A mão e a onda somem em T+8 (TIME.LEAVE, engine.ts) e o cartão em T+11; o vão fecha em T+22,
 * depois que a mão do gesto seguinte (que entra por baixo, pela direita) já passou por cima de
 * onde o cartão de baixo vai cair — fechando antes, ela atravessava o MIRAR da Viagem.
 */
export const LEAVE_FADE = 8;
export const TRACK_SETTLE = 19;

export const tapRewards = (target: string, s: RewardsState, ctx: RewardsCtx): TimedPatch[] | null => {
  const L = layoutRewards(s, ctx);
  // um modal aberto cobre a loja (o Modal do RN engole o toque): só os alvos dele respondem
  if (s.confirm) {
    const c = L.confirm!;
    if (target === 'confirm.plus') return [{ patch: { confirm: { ...s.confirm, qty: Math.min(MAX_QTY, s.confirm.qty + 1) } } }];
    if (target === 'confirm.minus') return [{ patch: { confirm: { ...s.confirm, qty: Math.max(1, s.confirm.qty - 1) } } }];
    if (target === 'confirm.cancel') return [{ patch: { confirm: null } }];
    if (target === 'confirm.redeem') {
      if (!c.canBuy) return null; // botão desabilitado
      // otimista: o saldo cai na hora (useRedeemRewardN.onMutate); a comemoração abre quando a
      // mutação volta — com o Aproveita! bem debaixo do dedo (lift)
      return [
        { patch: { confirm: null, balance: s.balance - c.total }, lift: true },
        { delay: CELEBRATION_DELAY, patch: { celebration: { id: s.confirm.id, qty: c.qty, paid: c.total } } },
      ];
    }
    return null;
  }
  if (s.celebration) {
    if (target === 'celebration.enjoy') return [{ patch: { celebration: null } }];
    // Desfazer: devolve exatamente o que foi pago (undo_reward_redemption)
    if (target === 'celebration.undo') return [{ patch: { celebration: null, balance: s.balance + s.celebration.paid } }];
    return null;
  }
  const card = (id: string): TimedPatch[] => {
    const r = byId(ctx.fx, id);
    // RewardCard: COMPRAR (Resgatar) quando o saldo paga — a confirmação abre por cima do dedo —;
    // senão MIRAR — o cartão sai e o de baixo ocupa o lugar dele
    if (s.balance >= r.cost) return [{ patch: { confirm: { id, qty: 1 } }, lift: true }];
    return [
      { patch: { leaving: id }, lift: true },
      { delay: TRACK_SETTLE, patch: { goal: id, leaving: null } },
    ];
  };
  if (target === 'card0.cta') {
    const id = L.sections[0]?.cards[0]?.reward.id;
    return id ? card(id) : null;
  }
  const m = /^card:([\w-]+):cta$/.exec(target);
  if (m) return card(m[1]);
  if (target === 'goal.cta' && s.goal) return [{ patch: { confirm: { id: s.goal, qty: 1 } }, lift: true }];
  if (target === 'goal.close') return [{ patch: { goal: null } }];
  const chip = /^chip\.(\w+)$/.exec(target);
  if (chip) {
    const cat = chip[1] as RewardCategory;
    const filter = s.filter.includes(cat) ? s.filter.filter((c) => c !== cat) : [...s.filter, cat];
    return [{ patch: { filter } }];
  }
  return null;
};

/** Rolagem que põe o alvo a ~22% do topo da tela (ou o máximo possível). */
export const scrollForRewards = (target: string, s: RewardsState, ctx: RewardsCtx): number => {
  const L = layoutRewards({ ...s, scroll: 0 }, ctx);
  const r = L.targets[target];
  if (!r) throw new Error(`scroll: alvo "${target}" não existe agora`);
  return Math.max(0, Math.min(L.maxScroll, r.y - ctx.d.statusBar - ctx.d.h * 0.22));
};

export const initialRewards = (fx: RewardsFixture, patch: Partial<RewardsState> = {}): RewardsState => ({
  balance: fx.balance,
  goal: fx.goal,
  filter: [],
  scroll: 0,
  confirm: null,
  celebration: null,
  leaving: null,
  ...patch,
});
