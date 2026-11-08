// Réplica da aba Aprender (Recanto, app/app/(tabs)/learning.tsx) como está no
// código hoje, desenhada em dp a partir de learningLayout.ts. Cores, textos e
// ícones vêm do próprio app (tokens.ts, locales, Ionicons); as capas e as
// miniaturas são as do catálogo (public/img). Nada aqui decide posição: a
// posição de tudo que o tour aponta sai do layout.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { Ion, Rect, at, clampLines, hGrad, textStyle, tokens, vGrad } from '../ui';
import { naturalLine } from '../text';
import { BottomNav, DEVICE, GestureBar, StatusBar } from './chrome';
import { Lang, num, tr } from './i18n';
import { learningFixture } from './learningFixture';
import {
  ART_H,
  CoverBox,
  LearningCtx,
  LearningLayout,
  LearningState,
  LearningView,
  RowBox,
  TRAIN_MIN,
  TileText,
  initialLearning,
  layoutLearning,
  scrollForLearning,
  tapLearning,
} from './learningLayout';
import { HISTORY_START, SCROLL_EASE, ScreenModule, Snap, lastChange, stateAt, swipeProgress } from './types';
import TARGETS from './targets.json';

const C = tokens;
const GOLD_INK = '#3D2A00';
const img = (name: string) => staticFile(`img/${name}.webp`);
const nl = naturalLine;

// ---------------------------------------------------------------- EntryTile (Explorar, Treinar, Continue lendo)

const TileTexts: React.FC<{ t: TileText }> = ({ t }) => (
  <>
    <div style={at({ x: t.x, y: t.titleY, w: t.w, h: nl(15, 800) }, textStyle(15, 800, nl(15, 800), C.text.hi, clampLines(1)))}>{t.title}</div>
    <div style={at({ x: t.x, y: t.subY, w: t.w, h: nl(12, 500) }, textStyle(12, 500, nl(12, 500), C.text.mid, clampLines(1)))}>{t.subtitle}</div>
    {t.bar ? (
      <div style={at(t.bar, { borderRadius: 999, overflow: 'hidden', background: C.border.divider })}>
        <div style={{ width: `${Math.max(0, Math.min(100, t.pct ?? 0))}%`, height: '100%', borderRadius: 999, background: hGrad(C.gradient.rewardBarFill, C.gradient.rewardBarFillLocations) }} />
      </div>
    ) : null}
  </>
);

const TileCard: React.FC<{ r: Rect; pressed: boolean }> = ({ r, pressed }) => (
  <div style={at(r, { borderRadius: C.radius.lg, background: C.bg.glass, border: `1px solid ${C.semantic.coinRim}`, opacity: pressed ? 0.85 : 1 })} />
);

const artY = (r: Rect) => r.y + (r.h - ART_H) / 2;

const Thumb: React.FC<{ x: number; y: number; border: string; src: string; z?: number }> = ({ x, y, border, src, z }) => (
  <div style={at({ x, y, w: 28, h: ART_H }, { borderRadius: C.radius.sm, border: `1.5px solid ${border}`, overflow: 'hidden', background: C.bg.deep, zIndex: z })}>
    <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
  </div>
);

const Entries: React.FC<{ L: LearningLayout; ctx: LearningCtx; p: string | null }> = ({ L, ctx, p }) => {
  const { fx } = ctx;
  const ex = L.explore;
  const tn = L.train;
  const unlocked = fx.favorites >= TRAIN_MIN;
  return (
    <>
      <TileCard r={ex} pressed={p === 'explore'} />
      {fx.exploreThumbs.slice(0, 3).map((th, i) => (
        <Thumb key={th.img} x={ex.x + 1 + 12 + i * 16} y={artY(ex)} border={C.dimension[th.dim]} src={img(th.img)} z={3 - i} />
      ))}
      <TileTexts t={L.exploreText} />
      <TileCard r={tn} pressed={p === 'train'} />
      <div style={at({ x: tn.x + 1 + 12, y: artY(tn), w: 36, h: ART_H }, { borderRadius: C.radius.sm, background: 'rgba(255, 200, 61, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
        <Ion name="school-outline" size={20} color={C.semantic.coin} />
        {unlocked && fx.trainDue > 0 ? <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 999, background: C.semantic.coin }} /> : null}
      </div>
      <TileTexts t={L.trainText} />
      {L.cont && L.contText && L.contMat ? (
        <>
          <TileCard r={L.cont} pressed={p === 'continue'} />
          <Thumb x={L.cont.x + 1 + 12} y={artY(L.cont)} border={C.dimension[L.contMat.dim]} src={img(L.contMat.cover)} />
          <TileTexts t={L.contText} />
        </>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- filtros (LearningFilterRow)

const Chips: React.FC<{ L: LearningLayout }> = ({ L }) => (
  <>
    {L.chips.items.map((c) => (
      <div
        key={c.key}
        style={at(c.rect, {
          borderRadius: 999,
          border: `1px solid ${c.lit ? c.accent : C.border.base}`,
          background: c.lit ? `${c.accent}2E` : C.bg.glassStrong,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          paddingLeft: 12,
          paddingRight: 12,
        })}
      >
        <Ion name={c.icon} size={13} color={c.lit ? c.accent : c.iconColor} />
        <span style={textStyle(12, 700, nl(12, 700), c.lit ? c.accent : C.text.mid)}>{c.label}</span>
        {c.count != null ? <span style={textStyle(11, 800, nl(11, 800), c.lit ? c.accent : C.text.dim)}>{c.count}</span> : null}
      </div>
    ))}
    {L.chips.dividers.map((r, i) => (
      <div key={i} style={at(r, { background: C.border.strong })} />
    ))}
  </>
);

// ---------------------------------------------------------------- fileiras (CarouselRow + CoverCard)

const Cover: React.FC<{ c: CoverBox; lang: Lang; pressed: boolean }> = ({ c, lang, pressed }) => {
  const { m, cover } = c;
  return (
    <div style={{ opacity: pressed ? 0.85 : 1 }}>
      <div
        style={at(cover, {
          borderRadius: C.radius.md,
          overflow: 'hidden',
          border: `1px solid ${c.inProgress ? 'rgba(255, 200, 61, 0.45)' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: c.inProgress ? '0 10px 22px rgba(255,200,61,0.18)' : '0 8px 10px rgba(0,0,0,0.35)',
          background: C.bg.deep,
        })}
      >
        <Img src={img(m.cover)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* MaterialCover: escurece o TOPO, onde fica o título */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10, 14, 38, 0.55) 0%, rgba(10, 14, 38, 0) 55%)' }} />
        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            top: 12,
            ...textStyle(15, 800, 18, '#FFFFFF', { letterSpacing: 0.1, textShadow: '0 1px 4px rgba(0, 0, 0, 0.65)' }),
            ...clampLines(4),
          }}
        >
          {m.title[lang]}
        </div>
        {m.read ? (
          <div style={{ position: 'absolute', right: 8, bottom: 8, width: 22, height: 22, borderRadius: 999, background: C.semantic.xp, border: '1.5px solid #FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ion name="checkmark" size={12} color="#FFFFFF" />
          </div>
        ) : null}
        {c.inProgress ? (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'rgba(0,0,0,0.35)' }}>
            <div style={{ width: `${c.pct}%`, height: '100%', background: hGrad(C.gradient.rewardBarFill, C.gradient.rewardBarFillLocations) }} />
          </div>
        ) : null}
      </div>
      <div style={at(c.summary, textStyle(11.5, 500, 16, C.text.mid, { fontStyle: 'italic', ...clampLines(2) }))}>{m.summary[lang]}</div>
      {c.meta.map((it, i) => {
        if (it.kind === 'icon') return <Ion key={i} name={it.name} size={it.size} color={it.color} style={{ position: 'absolute', left: it.x, top: it.y }} />;
        if (it.kind === 'text')
          return (
            <div key={i} style={at({ x: it.x, y: it.y, w: it.w + 2, h: it.h }, textStyle(10, 600, it.h, it.color))}>
              {it.text}
            </div>
          );
        const isIdeas = it.icon === 'albums-outline';
        return (
          <div key={i} style={at(it.rect, { borderRadius: 999, background: isIdeas ? 'rgba(255, 255, 255, 0.05)' : undefined })}>
            <Ion name={it.icon} size={10} color={it.iconColor} style={{ position: 'absolute', left: it.textX - it.rect.x - 13, top: (it.rect.h - 10) / 2 }} />
            <div style={{ position: 'absolute', left: it.textX - it.rect.x, top: (it.rect.h - nl(10, 600)) / 2, ...textStyle(10, 600, nl(10, 600), it.color) }}>{it.text}</div>
          </div>
        );
      })}
    </div>
  );
};

const Row: React.FC<{ r: RowBox; lang: Lang; p: string | null; first: boolean }> = ({ r, lang, p, first }) => {
  const h = r.header;
  return (
    <>
      {r.groupLabel ? (
        <div style={at(r.groupLabel.rect, textStyle(11, 700, nl(11, 700), C.text.dim, { letterSpacing: 1.4 }))}>{r.groupLabel.text}</div>
      ) : null}
      <div style={at(h, { display: 'flex', alignItems: 'center', gap: 8 })}>
        <div style={{ width: 22, height: 22, borderRadius: 999, background: `${r.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ion name={r.icon} size={14} color={r.accent} />
        </div>
        <span style={textStyle(16, 800, nl(16, 800), C.text.hi, { letterSpacing: 0.2 })}>{r.title}</span>
        <span style={{ ...textStyle(11, 700, nl(11, 700), C.text.dim), background: C.bg.glass, padding: '2px 7px', borderRadius: 999 }}>{num(lang, r.count)}</span>
      </div>
      {r.covers.map((c, i) => (
        <Cover key={c.m.slug} c={c} lang={lang} pressed={p === `${first ? 'cover' : 'dimcover'}${i}`} />
      ))}
    </>
  );
};

// ---------------------------------------------------------------- tela

export const LearningScreen: React.FC<{ s: LearningState; v: LearningView; L: LearningLayout; ctx: LearningCtx; pressed: string | null }> = ({ L, ctx, pressed: p }) => {
  const { lang } = ctx;
  const d = L.d;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: d.w, height: d.h, overflow: 'hidden', background: C.bg.deep }}>
      <StatusBar d={d} />
      {/* ScreenBackground withGoldHalo: screenAmbient + o halo dourado no topo, com a FlatList dentro */}
      <div
        style={at(
          { x: 0, y: d.statusBar, w: d.w, h: d.h - d.statusBar },
          { overflow: 'hidden', background: vGrad(C.gradient.screenAmbient, C.gradient.screenAmbientLocations) },
        )}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,200,61,0.10) 0%, rgba(255,200,61,0) 40%)' }} />
        {/* filhos em coordenadas da TELA (o layout já desconta a rolagem) */}
        <div style={{ position: 'absolute', left: 0, top: -d.statusBar, width: d.w, height: d.h }}>
          <div style={at(L.title, textStyle(28, 800, L.title.h, C.text.hi))}>{tr(lang, 'learning.title')}</div>
          <div style={at(L.search, { display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: p === 'search' ? 0.6 : 1 })}>
            <Ion name="search-outline" size={23} color={C.text.mid} />
          </div>
          <div style={at(L.info, { display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: p === 'info' ? 0.6 : 1 })}>
            <Ion name="information-circle-outline" size={24} color={C.text.mid} />
          </div>
          <Entries L={L} ctx={ctx} p={p} />
          <Chips L={L} />
          {L.rows.map((r, i) => (
            <Row key={r.key} r={r} lang={lang} p={p} first={i === 0 && r.key === 'new'} />
          ))}
        </div>
      </div>
      {/* a lâmpada de Minhas ideias (FabStack, gold, lg) e o número das ideias esperando revisão */}
      <div
        style={at(L.fab, {
          borderRadius: 999,
          border: '1px solid rgba(255,224,138,0.6)',
          overflow: 'hidden',
          background: vGrad(C.gradient.coinBtn, C.gradient.coinBtnLocations),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(p === 'fab.ideas' ? { opacity: 0.85, transform: 'scale(0.96)' } : {}),
        })}
      >
        <Ion name="bulb-outline" size={24} color={GOLD_INK} />
      </div>
      {L.badge ? (
        <div
          style={at(L.badge, {
            borderRadius: 10,
            border: `2px solid ${C.bg.deep}`,
            background: C.brand.violetDeep,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...textStyle(10, 800, 12, '#FFFFFF'),
          })}
        >
          {ctx.fx.pendingReviews > 99 ? '99+' : ctx.fx.pendingReviews}
        </div>
      ) : null}
      <BottomNav d={d} lang={lang} active="learning" locked={ctx.fx.lockedTabs} />
      <GestureBar d={d} />
    </div>
  );
};

// ---------------------------------------------------------------- animação + módulo

/** rolagem sem dedo (um `scroll` sem `swipe`), na curva SCROLL_EASE; a do arrasto é `swipeProgress` */
const SCROLL_FRAMES = 22;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export const viewLearning = (h: Snap<LearningState>[], f: number): LearningView => {
  const scr = lastChange(h, f, (s) => s.scroll);
  if (scr.at === HISTORY_START) return { scroll: scr.to };
  const m = stateAt(h, scr.at).scrollMotion;
  if (m === 'instant') return { scroll: scr.to };
  const e = m ? swipeProgress(f - scr.at, m) : SCROLL_EASE(clamp01((f - scr.at) / SCROLL_FRAMES));
  return { scroll: scr.from + (scr.to - scr.from) * e };
};

export const LEARNING_SCREEN: ScreenModule<LearningState, LearningView, LearningLayout, LearningCtx> = {
  id: 'learning',
  device: DEVICE,
  makeCtx: ({ fixture, lang }) => ({ fx: learningFixture(fixture), lang, d: DEVICE }),
  initial: (_ctx, patch) => initialLearning(patch),
  tap: tapLearning,
  scrollFor: scrollForLearning,
  controls: TARGETS.learning.controls,
  view: viewLearning,
  layout: (s, v, ctx) => layoutLearning(s, ctx, { scrollShown: v.scroll }),
  Render: LearningScreen,
};
