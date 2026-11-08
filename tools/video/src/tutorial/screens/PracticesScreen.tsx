// Réplica da aba Práticas, página Hoje (app/app/(tabs)/index.tsx) como está no
// código hoje, desenhada em dp a partir de practicesLayout.ts. Cores, textos e
// ícones vêm do próprio app (tokens.ts, locales, Ionicons). Nada aqui decide
// posição: a posição de tudo que o tour aponta sai do layout.
import React, { useId } from 'react';
import { Easing, spring } from 'remotion';
import { Coin, Ion, Rect, TopoGlyph, at, clampLines, textStyle, tokens, vGrad } from '../ui';
import { naturalLine, textWidth } from '../text';
import { BottomNav, DEVICE, GestureBar, StatusBar } from './chrome';
import { Lang, tr, upper } from './i18n';
import { DIM_ICON, SUB_META, dimBg, dimColor, practicesFixture, primaryDim } from './practicesFixture';
import {
  BucketBox,
  CardBox,
  FloatBox,
  LEAVE_FADE,
  PracticesCtx,
  PracticesLayout,
  PracticesState,
  PracticesView,
  REFLOW,
  RowBox,
  blendPractices,
  initialPractices,
  layoutPractices,
  scrollForPractices,
  tapPractices,
} from './practicesLayout';
import { HISTORY_START, SCROLL_EASE, ScreenModule, Snap, lastChange, stateAt, swipeProgress } from './types';
import TARGETS from './targets.json';

const C = tokens;
const GOLD_INK = '#3D2A00';

// ---------------------------------------------------------------- fundo (TodayAmbient)

const Ambient: React.FC<{ d: typeof DEVICE }> = ({ d }) => {
  const id = `today${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* halo 480 × 480 em top −164 / right −198 */}
      <svg width={480} height={480} viewBox="0 0 480 480" style={at({ x: d.w + 198 - 480, y: d.statusBar - 164, w: 480, h: 480 })}>
        <defs>
          <radialGradient id={id} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#9B82FF" stopOpacity={0.22} />
            <stop offset="0.4" stopColor="#9B82FF" stopOpacity={0.1} />
            <stop offset="0.7" stopColor="#9B82FF" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx="240" cy="240" r="240" fill={`url(#${id})`} />
      </svg>
      {/* o glifo do Perceva, 240, em top −44 / right −78, 10% */}
      <div style={{ position: 'absolute', left: d.w + 78 - 240, top: d.statusBar - 44, width: 240, height: 240, opacity: 0.1 }}>
        <TopoGlyph size={240} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- MoodFace (o rosto tracejado: humor não registrado)

const GhostFace: React.FC<{ r: Rect }> = ({ r }) => (
  <svg width={r.w} height={r.h} viewBox="0 0 48 48" style={at(r)}>
    <circle cx={24} cy={24} r={21} fill="rgba(255,255,255,0.03)" stroke={C.text.dim} strokeWidth={2} strokeDasharray="4 4" />
    <circle cx={17} cy={19.5} r={2.5} fill={C.text.dim} />
    <circle cx={31} cy={19.5} r={2.5} fill={C.text.dim} />
    <path d="M16.5 28.5 Q24 34.5 31.5 28.5" stroke={C.text.dim} strokeWidth={2.6} strokeLinecap="round" fill="none" />
  </svg>
);

// ---------------------------------------------------------------- TodayHeader

const Header: React.FC<{ L: PracticesLayout; v: PracticesView; pressed: string | null }> = ({ L, v, pressed }) => {
  const h = L.head;
  const xp = Math.round(v.xp);
  const coins = Math.round(v.coins);
  const num = (n: number, color: string, glow: string): React.CSSProperties =>
    textStyle(24, 800, 28, n > 0 ? color : C.text.dim, { letterSpacing: -0.4, textShadow: n > 0 ? `0 0 12px ${glow}` : undefined });
  return (
    <>
      <div style={at({ ...h.prev, y: h.prev.y + 9, h: 22 }, { opacity: pressed === 'day.prev' ? 0.5 : 1 })}>
        <Ion name="chevron-back" size={22} color={C.text.hi} />
      </div>
      <div style={at(h.headline, textStyle(24, 800, 28, C.text.hi, { letterSpacing: -0.3 }))}>
        {h.weekday} <span style={{ color: C.brand.violet2, textShadow: '0 0 12px rgba(155,130,255,0.35)' }}>{h.monthDay}</span>
      </div>
      <div style={at({ ...h.next, x: h.next.x + 3, y: h.next.y + 9, w: 22, h: 22 })}>
        <Ion name="chevron-forward" size={22} color={C.text.faint} />
      </div>
      <div style={at(h.info, { display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pressed === 'info' ? 0.6 : 1 })}>
        <Ion name="information-circle-outline" size={24} color={C.text.mid} />
      </div>
      <div style={at(h.xp, { display: 'flex', alignItems: 'center', gap: 6 })}>
        <Ion name="flash" size={22} color={xp > 0 ? C.semantic.xp : C.text.dim} />
        <span style={num(xp, C.semantic.xp, C.semantic.xpGlow)}>{xp}</span>
      </div>
      <div style={at(h.coins, { display: 'flex', alignItems: 'center', gap: 6 })}>
        <Coin size={22} />
        <span style={num(coins, C.semantic.coinLight, C.semantic.coinGlow)}>{coins}</span>
      </div>
      <GhostFace r={h.mood} />
    </>
  );
};

// ---------------------------------------------------------------- BucketTabsV2 (Hoje | Todas)

const Tabs: React.FC<{ L: PracticesLayout }> = ({ L }) => {
  const { row, items } = L.tabs;
  return (
    <>
      <div style={at({ x: row.x, y: row.y + row.h - 1, w: row.w, h: 1 }, { background: C.border.base })} />
      {items.map((it) => {
        const label = textWidth(it.label, 12, 800, 0.2);
        const chipH = naturalLine(9, 800) + 2;
        const chipW = Math.max(22, 14 + textWidth(String(it.count.n), 9, 800, 0.3));
        const cx = it.rect.x + (it.rect.w - (label + 6 + chipW)) / 2;
        const midY = it.rect.y + (it.rect.h - 2) / 2;
        return (
          <React.Fragment key={it.key}>
            {it.active ? <div style={at({ x: it.rect.x, y: it.rect.y + it.rect.h - 2, w: it.rect.w, h: 2 }, { background: C.brand.violet2 })} /> : null}
            <div style={at({ x: cx, y: midY - naturalLine(12, 800) / 2, w: label + 2, h: naturalLine(12, 800) }, textStyle(12, 800, naturalLine(12, 800), it.active ? C.text.hi : C.text.faint, { letterSpacing: 0.2 }))}>
              {it.label}
            </div>
            <div
              style={at(
                { x: cx + label + 6, y: midY - chipH / 2, w: chipW, h: chipH },
                { borderRadius: 999, background: it.active ? C.brand.violetGlow : C.bg.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' },
              )}
            >
              <span style={textStyle(9, 800, naturalLine(9, 800), it.active ? C.brand.violet2 : C.text.faint, { letterSpacing: 0.3, opacity: it.count.o })}>{it.count.n}</span>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- TaskCard

const Pips: React.FC<{ subs: { sub: keyof typeof SUB_META; stars: number }[] }> = ({ subs }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {subs.flatMap((s) =>
      Array.from({ length: s.stars }, (_, i) => (
        <div key={`${s.sub}${i}`} style={{ width: 5, height: 5, borderRadius: 1.25, background: dimColor(SUB_META[s.sub].dimensionId) }} />
      )),
    )}
  </div>
);

const Card: React.FC<{ c: CardBox; lang: Lang; pressed: string | null; opacity?: number }> = ({ c, lang, pressed, opacity: o0 = 1 }) => {
  const dim = primaryDim(c.p);
  const accent = dimColor(dim);
  const opacity = o0 * (c.o ?? 1);
  if (opacity <= 0.001) return null;
  // filhos absolutos contam da borda de dentro (esquerda 3, topo 1)
  const loc = (r: Rect): Rect => ({ ...r, x: r.x - c.rect.x - 3, y: r.y - c.rect.y - 1 });
  const checkPressed = pressed === `card:${c.p.id}:check`;
  return (
    <div
      style={at(c.rect, {
        borderRadius: 14,
        border: `1px solid ${C.border.base}`,
        borderTopColor: 'rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${accent}`,
        background: vGrad(C.gradient.taskCard, C.gradient.taskCardLocations),
        opacity,
      })}
    >
      <div style={at(loc(c.tile), { borderRadius: 10, background: dimBg(dim), display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
        <Ion name={SUB_META[c.p.subs[0].sub].iconName} size={18} color={accent} />
      </div>
      <div style={at(loc(c.body), { display: 'flex', flexDirection: 'column', gap: 5, opacity: pressed === `card:${c.p.id}` ? 0.85 : 1 })}>
        <div style={textStyle(14, 700, 18, C.text.hi, clampLines(2))}>{c.p.title[lang]}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: c.body.h - c.titleLines * 18 - 5 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {c.p.subs.slice(0, 3).map((s, i) => {
              const d = SUB_META[s.sub].dimensionId;
              return (
                <div
                  key={s.sub}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    marginLeft: i ? -6 : 0,
                    background: dimBg(d),
                    border: `1.5px solid ${dimColor(d)}55`,
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ion name={SUB_META[s.sub].iconName} size={10} color={dimColor(d)} />
                </div>
              );
            })}
          </div>
          <Pips subs={c.p.subs} />
          <span style={textStyle(13, 800, naturalLine(13, 800), C.semantic.xp, { letterSpacing: 0.2 })}>+{c.xp}</span>
        </div>
      </div>
      <div
        style={at(loc(c.check), {
          borderRadius: 11,
          border: '1px solid rgba(155,130,255,0.55)',
          overflow: 'hidden',
          background: vGrad(C.gradient.taskCheckBtn, C.gradient.taskCheckBtnLocations),
          boxShadow: '0 4px 12px rgba(123,92,255,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(checkPressed ? { opacity: 0.85, transform: 'scale(0.88)' } : {}),
        })}
      >
        <Ion name="checkmark" size={20} color="#fff" />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- "Fechar o dia"

const ClearDay: React.FC<{ r: Rect & { o?: number }; lang: Lang; pressed: boolean }> = ({ r, lang, pressed }) =>
  (r.o ?? 1) > 0.001 ? (
    <div
      style={at(r, {
        borderRadius: 14,
        border: '1px solid rgba(155, 130, 255, 0.45)',
        background: 'rgba(123, 92, 255, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: (r.o ?? 1) * (pressed ? 0.55 : 1),
      })}
    >
      <Ion name="checkmark-done-outline" size={16} color={C.brand.violet2} />
      <span style={textStyle(13, 800, naturalLine(13, 800), C.brand.violet2, { letterSpacing: 0.2 })}>{tr(lang, 'home.clearDay.cta')}</span>
    </div>
  ) : null;

// ---------------------------------------------------------------- Feitas hoje (CompletedBucket)

const Row: React.FC<{ r: RowBox; lang: Lang; pressed: string | null; origin: Rect }> = ({ r, lang, pressed, origin }) => {
  const dim = primaryDim(r.p);
  const color = dimColor(dim);
  const loc = (x: Rect): Rect => ({ ...x, x: x.x - origin.x, y: x.y - origin.y });
  const time = new Date(2026, 0, 1, 9, 41).toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const sep = <span style={textStyle(10, 500, naturalLine(10, 500), C.text.dim)}>·</span>;
  const extraP = pressed === `done:${r.p.id}:extra` || pressed === 'done0.extra';
  const undoP = pressed === `done:${r.p.id}:undo` || pressed === 'done0.undo';
  const rr = loc(r.rect);
  return (
    <>
      <div style={at(rr, { borderBottom: r.last ? undefined : `1px solid ${C.border.divider}` })} />
      <div style={at({ x: rr.x + 12, y: rr.y + 14, w: 32, h: 32 }, { borderRadius: 10, background: dimBg(dim), border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
        <Ion name={DIM_ICON[dim]} size={16} color={color} />
      </div>
      <div style={{ position: 'absolute', left: rr.x + 12 + 32 + 8, top: rr.y, height: 60, width: loc(r.extra).x - 8 - (rr.x + 52), display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
        <div style={textStyle(13, 700, naturalLine(13, 700), C.text.hi, clampLines(1))}>{r.p.title[lang]}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={textStyle(12, 800, naturalLine(12, 800), C.semantic.xp)}>+{r.c.xp} XP</span>
          {sep}
          <Pips subs={r.p.subs} />
          {sep}
          <span style={textStyle(11, 700, naturalLine(11, 700), C.semantic.coin)}>{r.c.coins}</span>
          {sep}
          <span style={textStyle(10, 500, naturalLine(10, 500), C.text.mid)}>{time}</span>
        </div>
      </div>
      <div
        style={at(loc(r.extra), {
          borderRadius: 10,
          background: extraP ? 'rgba(61, 214, 140, 0.26)' : 'rgba(61, 214, 140, 0.14)',
          border: '1px solid rgba(61, 214, 140, 0.38)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          ...(extraP ? { opacity: 0.75, transform: 'scale(0.92)' } : {}),
        })}
      >
        <Ion name="add" size={15} color={C.semantic.xp} />
        <span style={textStyle(13, 800, naturalLine(13, 800), C.semantic.xp)}>1</span>
      </div>
      <div
        style={at(loc(r.undo), {
          borderRadius: 10,
          background: undoP ? 'rgba(255, 92, 122, 0.16)' : C.bg.surface2,
          border: `1px solid ${undoP ? 'rgba(255, 92, 122, 0.45)' : C.border.strong}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(undoP ? { transform: 'scale(0.92)' } : {}),
        })}
      >
        <Ion name="arrow-undo" size={18} color={C.text.mid} />
      </div>
    </>
  );
};

const Bucket: React.FC<{ b: BucketBox; lang: Lang; v: PracticesView; pressed: string | null }> = ({ b, lang, v, pressed }) => {
  const h = b.header;
  const countW = 14 + 2 + textWidth(String(b.count.n), 10, 800);
  const chipH = naturalLine(10, 800) + 2 + 2;
  const showBody = b.open && b.bodyH > 0.5;
  return (
    <>
      <div
        style={at(h, {
          borderRadius: showBody ? '14px 14px 0 0' : 14,
          background: C.bg.surface,
          border: `1px solid ${C.border.base}`,
          borderBottomColor: showBody ? 'transparent' : C.border.base,
          opacity: pressed === 'bucket' ? 0.85 : 1,
        })}
      >
        <div style={{ position: 'absolute', left: 12, top: 0, height: h.h - 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={textStyle(12, 800, naturalLine(12, 800), C.text.mid)}>{tr(lang, 'home.completedBucket.today')}</span>
          <div
            style={{
              width: countW,
              height: chipH,
              borderRadius: 999,
              background: C.bg.surface2,
              border: `1px solid ${C.border.base}`,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={textStyle(10, 800, naturalLine(10, 800), b.count.n ? C.semantic.xp : C.text.dim, { opacity: b.count.o })}>{b.count.n}</span>
          </div>
        </div>
        {b.total && b.total.o > 0.001 ? (
          <div style={{ position: 'absolute', right: 12 + 16 + 8, top: 0, height: h.h - 2, display: 'flex', alignItems: 'baseline', gap: 2, paddingTop: (h.h - 2 - 18) / 2, boxSizing: 'border-box', opacity: b.total.o }}>
            <span style={textStyle(13, 800, 18, C.semantic.xp, { letterSpacing: -0.3, textShadow: `0 0 8px ${C.semantic.xpGlow}` })}>+{b.total.xp}</span>
            <span style={textStyle(9, 700, 18, C.semantic.xp, { opacity: 0.75 })}>XP</span>
          </div>
        ) : null}
        {b.chevronO > 0.001 ? (
          <div style={{ position: 'absolute', right: 12, top: (h.h - 2 - 16) / 2, width: 16, height: 16, opacity: b.chevronO, transform: `rotate(${v.chevron * 180}deg)` }}>
            <Ion name="chevron-down" size={16} color={C.text.dim} />
          </div>
        ) : null}
      </div>
      {showBody ? (
        <div
          style={at(
            { x: h.x, y: h.y + h.h, w: h.w, h: b.bodyH },
            { background: C.bg.surface, border: `1px solid ${C.border.base}`, borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden' },
          )}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: b.bodyO }}>
            {b.rows.map((r) => (
              <Row key={r.c.cid} r={r} lang={lang} pressed={pressed} origin={{ x: h.x + 1, y: h.y + h.h, w: 0, h: 0 }} />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- RecantoCard + DayRedemptionsCard

const Recanto: React.FC<{ r: Rect; ctx: PracticesCtx }> = ({ r, ctx }) => {
  const rc = ctx.fx.recanto!;
  const color = dimColor(rc.dimension);
  const { lang } = ctx;
  return (
    <div style={at(r, { borderRadius: 14, border: `1px solid ${color}55`, background: C.bg.surface, display: 'flex', alignItems: 'center', gap: 12, padding: 12 })}>
      <div style={{ width: 56, height: 70, borderRadius: 12, background: dimBg(rc.dimension), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ion name="bulb-outline" size={22} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Ion name="bulb" size={12} color={C.semantic.coin} />
          <span style={textStyle(11, 800, naturalLine(11, 800), C.text.mid, { letterSpacing: 0.6 })}>{upper(lang, tr(lang, 'home.recantoCard.eyebrow'))}</span>
        </div>
        <div style={textStyle(15, 700, 20, C.text.hi, clampLines(2))}>{rc.title[lang]}</div>
        <div style={textStyle(12, 800, naturalLine(12, 800), color, { marginTop: 2 })}>{tr(lang, 'home.recantoCard.cta')}</div>
      </div>
      <Ion name="chevron-forward" size={16} color={C.text.dim} />
    </div>
  );
};

const Redemptions: React.FC<{ L: PracticesLayout; lang: Lang }> = ({ L, lang }) => {
  const r = L.redemptions;
  const a = L.redemptionsAdd;
  return (
    <div style={at(r, { borderRadius: 14, border: `1px solid ${C.semantic.coinRim}`, background: C.bg.surface })}>
      <div style={{ position: 'absolute', left: 16, right: 16, top: 16, height: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ion name="gift-outline" size={16} color={C.semantic.coinLight} />
        <span style={{ flex: 1, ...textStyle(13, 800, naturalLine(13, 800), C.semantic.coinLight, { letterSpacing: 0.6 }) }}>{upper(lang, tr(lang, 'home.redemptions.title'))}</span>
      </div>
      <div style={at({ ...a, x: a.x - r.x - 1, y: a.y - r.y - 1 }, { borderRadius: 8, background: 'rgba(255, 200, 61, 0.14)', border: `1px solid ${C.semantic.coinRim}`, display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
        <Ion name="add" size={18} color={C.semantic.coinLight} />
      </div>
      <div style={{ position: 'absolute', left: 16, top: 16 + 32 + 8 + 4, ...textStyle(12, 600, 16, C.text.dim) }}>{tr(lang, 'home.redemptions.empty')}</div>
    </div>
  );
};

// ---------------------------------------------------------------- o + dourado (FabStack) e o XPCoinFloat

const Fab: React.FC<{ r: Rect; pressed: boolean }> = ({ r, pressed }) => (
  <div
    style={at(r, {
      borderRadius: 999,
      border: '1px solid rgba(255,224,138,0.6)',
      overflow: 'hidden',
      background: vGrad(C.gradient.coinBtn, C.gradient.coinBtnLocations),
      boxShadow: '0 4px 12px rgba(255,200,61,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...(pressed ? { opacity: 0.85, transform: 'scale(0.96)' } : {}),
    })}
  >
    <Ion name="add" size={28} color={GOLD_INK} />
  </div>
);

const Float: React.FC<{ f: FloatBox }> = ({ f }) => {
  const badge = (r: Rect, bg: string, border: string, shadow: string, child: React.ReactNode) => (
    <div
      style={at(r, {
        borderRadius: 999,
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: shadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      })}
    >
      {child}
    </div>
  );
  const cx = (f.xpBadge.x + f.coinBadge.x + f.coinBadge.w) / 2;
  const cy = f.xpBadge.y + f.xpBadge.h / 2;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: f.o, transform: `translateY(${f.dy}px)`, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${f.scale})` }}>
        {f.xp > 0
          ? badge(
              f.xpBadge,
              'rgba(61, 214, 140, 0.18)',
              'rgba(61, 214, 140, 0.45)',
              '0px 4px 14px rgba(61, 214, 140, 0.45)',
              <>
                <Ion name="flash" size={16} color={C.semantic.xp} />
                <span style={textStyle(17, 700, 21, C.semantic.xp)}>+{f.xp} XP</span>
              </>,
            )
          : null}
        {badge(
          f.coinBadge,
          'rgba(255, 200, 61, 0.20)',
          'rgba(255, 200, 61, 0.5)',
          '0px 3px 10px rgba(255, 200, 61, 0.3)',
          <>
            <Coin size={14} />
            <span style={textStyle(17, 700, 21, C.semantic.coin)}>+{f.coins}</span>
          </>,
        )}
      </div>
    </div>
  );
};

/** XPCoinFloat: opacidade 0→1 em 140 ms, segura 780 ms, apaga em 350 ms; sobe 90 em 1300 ms; mola 0,4 → 1,15 → 1. */
const FLOAT = { IN: 4.2, HOLD_TO: 27.6, OUT: 10.5, RISE: 39 } as const;
const FLOAT_FRAMES = FLOAT.HOLD_TO + FLOAT.OUT;
const RISE_EASE = Easing.inOut(Easing.quad);

const floatBox = (d: typeof DEVICE, xp: number, coins: number, age: number): FloatBox => {
  // container: absolute, top 40% da SafeAreaView (abaixo da barra de status), linha centrada, gap 12
  const top = d.statusBar + (d.h - d.statusBar) * 0.4;
  const h = 8 * 2 + 21 + 2;
  const xpW = 16 * 2 + 16 + 6 + textWidth(`+${xp} XP`, 17, 700) + 2;
  const coinW = 16 * 2 + 14 + 6 + textWidth(`+${coins}`, 17, 700) + 2;
  const total = (xp > 0 ? xpW + 12 : 0) + coinW;
  const x0 = (d.w - total) / 2;
  const o = age < FLOAT.IN ? age / FLOAT.IN : age < FLOAT.HOLD_TO ? 1 : Math.max(0, 1 - (age - FLOAT.HOLD_TO) / FLOAT.OUT);
  const dy = -90 * RISE_EASE(Math.min(1, age / FLOAT.RISE));
  const scale = spring({ frame: age, fps: 30, from: 0.4, to: 1, config: { damping: 12, stiffness: 180 } });
  return {
    xpBadge: { x: x0, y: top, w: xpW, h },
    coinBadge: { x: x0 + (xp > 0 ? xpW + 12 : 0), y: top, w: coinW, h },
    o,
    dy,
    scale,
    xp,
    coins,
  };
};

// ---------------------------------------------------------------- a tela inteira

export const PracticesScreen: React.FC<{ s: PracticesState; v: PracticesView; L: PracticesLayout; ctx: PracticesCtx; pressed: string | null }> = ({
  v,
  L,
  ctx,
  pressed,
}) => {
  const { lang } = ctx;
  const d = L.d;
  const first = L.cards[0];
  const rows = L.bucket.rows;
  // apelidos do roteiro → o alvo de verdade (card0.check é o check da 1ª prática da lista)
  const p =
    pressed === 'card0.check' && first
      ? `card:${first.p.id}:check`
      : pressed === 'card0' && first
        ? `card:${first.p.id}`
        : pressed?.startsWith('done0.') && rows[0]
          ? `done:${rows[0].p.id}:${pressed.slice(6)}`
          : pressed;
  const sc = { position: 'absolute', left: 0, top: -L.scroll, width: d.w, height: L.contentH } as const;
  const float = v.float ? floatBox(d, v.float.xp, v.float.coins, v.float.age) : null;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: d.w, height: d.h, overflow: 'hidden', background: C.bg.deep }}>
      <Ambient d={d} />
      <div style={at({ x: 0, y: d.statusBar, w: d.w, h: d.h - d.statusBar }, { overflow: 'hidden' })}>
        <div style={sc}>
          <Header L={L} v={v} pressed={p} />
          <Tabs L={L} />
          {L.cards.map((c) => (
            <Card key={c.p.id} c={c} lang={lang} pressed={p} opacity={v.leaving?.id === c.p.id ? 1 - ease(v.leaving.t) : 1} />
          ))}
          {L.clearDay ? <ClearDay r={L.clearDay} lang={lang} pressed={p === 'clearDay'} /> : null}
          <Bucket b={L.bucket} lang={lang} v={v} pressed={p} />
          {L.recanto ? <Recanto r={L.recanto} ctx={ctx} /> : null}
          <Redemptions L={L} lang={lang} />
        </div>
      </div>
      <StatusBar d={d} />
      <Fab r={L.fab} pressed={p === 'fab.add'} />
      {float && float.o > 0.001 ? <Float f={float} /> : null}
      <BottomNav d={d} lang={lang} active="index" locked={ctx.fx.lockedTabs} />
      <GestureBar d={d} />
    </div>
  );
};

// ---------------------------------------------------------------- animação + módulo

const STATS_FRAMES = 20;
/** rolagem sem dedo (um `scroll` sem `swipe`), na curva SCROLL_EASE; a do arrasto é `swipeProgress` */
const SCROLL_FRAMES = 22;

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const scrollShownAt = (h: Snap<PracticesState>[], f: number) => {
  const scr = lastChange(h, f, (s) => s.scroll);
  if (scr.at === HISTORY_START) return scr.to;
  const m = stateAt(h, scr.at).scrollMotion;
  if (m === 'instant') return scr.to;
  const e = m ? swipeProgress(f - scr.at, m) : SCROLL_EASE(clamp01((f - scr.at) / SCROLL_FRAMES));
  return scr.from + (scr.to - scr.from) * e;
};

export const viewPractices = (h: Snap<PracticesState>[], f: number): PracticesView => {
  const count = (pick: (s: PracticesState) => number) => {
    const c = lastChange(h, f, pick);
    return c.at === HISTORY_START ? c.to : c.from + (c.to - c.from) * ease((f - c.at) / STATS_FRAMES);
  };
  const fl = lastChange(h, f, (s) => s.float?.n ?? 0);
  const fs = stateAt(h, f).float;
  const age = f - fl.at;
  const lv = lastChange(h, f, (s) => s.leaving);
  const op = lastChange(h, f, (s) => s.bucketOpen && s.done.length > 0);
  const chev = op.at === HISTORY_START ? (op.to ? 1 : 0) : spring({ frame: f - op.at, fps: 30, from: op.from ? 1 : 0, to: op.to ? 1 : 0, config: { damping: 18, stiffness: 220 } });
  return {
    xp: count((s) => s.xp),
    coins: count((s) => s.coins),
    scroll: scrollShownAt(h, f),
    leaving: lv.to ? { id: lv.to, t: clamp01((f - lv.at) / LEAVE_FADE) } : null,
    float: fs && fl.at !== HISTORY_START && age < FLOAT_FRAMES ? { xp: fs.xp, coins: fs.coins, age } : null,
    chevron: chev,
  };
};

export const PRACTICES_SCREEN: ScreenModule<PracticesState, PracticesView, PracticesLayout, PracticesCtx> = {
  id: 'practices',
  device: DEVICE,
  makeCtx: ({ fixture, lang }) => ({ fx: practicesFixture(fixture), lang, d: DEVICE }),
  initial: (ctx, patch) => initialPractices(ctx.fx, patch),
  tap: tapPractices,
  scrollFor: scrollForPractices,
  controls: TARGETS.practices.controls,
  view: viewPractices,
  layout: (s, v, ctx, h, f) => {
    const opts = { xpShown: v.xp, coinsShown: v.coins, scrollShown: v.scroll };
    const L = layoutPractices(s, ctx, opts);
    // a lista mudou (uma conclusão, o desfazer, a gaveta): reorganiza ANIMADA em REFLOW quadros
    const rf = lastChange(h, f, (x) => [x.open, x.done.map((c) => c.cid), x.bucketOpen && x.done.length > 0]);
    if (rf.at === HISTORY_START || f - rf.at >= REFLOW) return L;
    const before = stateAt(h, rf.at - 1);
    const A = layoutPractices(before, ctx, opts);
    return blendPractices(A, L, easeInOutCubic((f - rf.at) / REFLOW), before.leaving);
  },
  Render: PracticesScreen,
};
