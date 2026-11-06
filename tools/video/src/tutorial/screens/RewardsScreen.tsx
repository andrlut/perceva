// Réplica da aba Recompensas (app/app/(tabs)/rewards.tsx) como está no código
// hoje, desenhada em dp a partir de rewardsLayout.ts. Cores, textos e ícones
// vêm do próprio app (tokens.ts, locales, Ionicons). Nada aqui decide posição:
// a posição de tudo que o tour aponta sai do layout.
import React, { useId } from 'react';
import { spring } from 'remotion';
import { CATEGORY_META, Coin, Ion, Rect, TopoGlyph, at, clampLines, hGrad, textStyle, tokens, vGrad } from '../ui';
import { naturalLine } from '../text';
import { BottomNav, DEVICE, GestureBar, StatusBar } from './chrome';
import { Lang, num, tr, upper } from './i18n';
import { rewardsFixture } from './rewardsFixture';
import {
  CardBox,
  CelebBox,
  ConfirmBox,
  GoalBox,
  LEAVE_FADE,
  RewardsCtx,
  RewardsLayout,
  RewardsState,
  RewardsView,
  initialRewards,
  layoutRewards,
  scrollForRewards,
  tapRewards,
} from './rewardsLayout';
import { HISTORY_START, ScreenModule, Snap, lastChange, modalPhase, nextValue, stateAt } from './types';

const C = tokens;
const GOLD_INK = '#3D2A00';

// ---------------------------------------------------------------- herói (VaultHero)

const Hero: React.FC<{ L: RewardsLayout }> = ({ L }) => {
  const id = `halo${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { rect, row, status, statusH, label } = L.hero;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return (
    <>
      {/* halo violeta: SVG 480×320 centrado no herói (clipa no próprio viewport, como no app) */}
      <svg width={480} height={320} viewBox="0 0 480 320" style={at({ x: cx - 240, y: cy - 160, w: 480, h: 320 })}>
        <defs>
          <radialGradient id={id} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#9B82FF" stopOpacity={0.32} />
            <stop offset="0.5" stopColor="#9B82FF" stopOpacity={0.14} />
            <stop offset="1" stopColor="#9B82FF" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx="240" cy="160" r="240" fill={`url(#${id})`} />
      </svg>
      <div style={at(row, { display: 'flex', alignItems: 'center', gap: 12 })}>
        <Coin size={72} />
        <div style={textStyle(48, 800, 52, C.semantic.coin, { letterSpacing: -1.2, textShadow: '0 0 12px rgba(255, 200, 61, 0.35)' })}>{label}</div>
      </div>
      {status ? (
        <div
          style={at(
            { x: rect.x + (rect.w - 280) / 2, y: row.y + 72 + 8, w: 280, h: statusH },
            textStyle(13, 600, 18, C.text.mid, { textAlign: 'center', ...clampLines(2) }),
          )}
        >
          {status}
        </div>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- meta (TrackedRewardCard)

const GoalCard: React.FC<{ g: GoalBox; lang: Lang; coins: number; pressed: string | null }> = ({ g, lang, coins, pressed }) => {
  const cat = CATEGORY_META[g.reward.category];
  const deficit = Math.max(0, g.reward.cost - coins);
  const pct = Math.min(100, Math.round((coins / g.reward.cost) * 100));
  const labelsH = g.progress.h - 16;
  return (
    <div
      style={at(g.rect, {
        borderRadius: 18,
        border: '1px solid rgba(255, 200, 61, 0.35)',
        overflow: 'hidden',
        background: vGrad(['rgba(36,42,88,0.85)', 'rgba(20,24,60,0.95)']),
        opacity: pressed === 'goal' ? 0.95 : 1,
      })}
    >
      <div style={{ position: 'absolute', right: -30, top: -10, width: 180, height: 180, opacity: 0.07 }}>
        <TopoGlyph size={180} />
      </div>
      <div style={{ position: 'absolute', left: 16, top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ height: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ion name="bookmark" size={12} color={C.semantic.coinLight} />
            <span style={textStyle(10, 800, naturalLine(10, 800), C.semantic.coinLight, { letterSpacing: 1.4 })}>
              {upper(lang, tr(lang, 'rewards.vault.tracked.eyebrow'))}
            </span>
          </div>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed === 'goal.close' ? 0.6 : 1,
            }}
          >
            <Ion name="close" size={11} color={C.text.mid} />
          </div>
        </div>
        <div style={{ height: g.bodyH, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              border: `1px solid ${cat.color}50`,
              background: `${cat.color}26`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <Ion name={g.reward.icon} size={28} color={cat.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={textStyle(17, 800, 21, C.text.hi, clampLines(2))}>{g.reward.title[lang]}</div>
            {g.reward.description ? (
              <div style={textStyle(12, 500, naturalLine(12, 500), C.text.mid, clampLines(2))}>{g.reward.description[lang]}</div>
            ) : null}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.04)',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: hGrad(['#FFE3A6', '#FFC83D', '#C8881C'], [0, 0.6, 1]) }} />
          </div>
          <div style={{ height: labelsH, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Coin size={13} />
              <span style={textStyle(12, 800, naturalLine(12, 800), C.semantic.coinLight)}>
                {num(lang, coins)}
                <span style={{ color: C.text.dim, fontWeight: 700 }}>
                  {' / '}
                  {num(lang, g.reward.cost)}
                </span>
              </span>
            </div>
            <span style={textStyle(11, 700, naturalLine(11, 700), C.text.mid)}>
              {tr(lang, 'rewards.vault.tracked.remaining', { deficit: num(lang, deficit), pct })}
            </span>
          </div>
        </div>
      </div>
      {g.cta ? <BuyPill r={{ ...g.cta, x: g.cta.x - g.rect.x - 1, y: g.cta.y - g.rect.y - 1 }} size={11} lang={lang} pressed={pressed === 'goal.cta'} /> : null}
    </div>
  );
};

/** O "RESGATAR" dourado (gradiente coinBtn, borda coinRim). */
const BuyPill: React.FC<{ r: Rect; size: number; lang: Lang; pressed: boolean; label?: string }> = ({ r, size, lang, pressed, label }) => (
  <div
    style={at(r, {
      borderRadius: 999,
      border: `1px solid ${C.semantic.coinRim}`,
      overflow: 'hidden',
      background: vGrad(C.gradient.coinBtn, C.gradient.coinBtnLocations),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: pressed ? 0.85 : 1,
    })}
  >
    <span style={textStyle(size, 800, naturalLine(size, 800), GOLD_INK, { letterSpacing: 0.7 })}>
      {label ?? upper(lang, tr(lang, 'rewards.vault.cta.buy'))}
    </span>
  </div>
);

// ---------------------------------------------------------------- convite "Mirar uma recompensa" (sem meta)

const TrackCta: React.FC<{ r: Rect; lang: Lang }> = ({ r, lang }) => (
  <div
    style={at(r, {
      borderRadius: 18,
      border: `1px dashed ${C.border.base}`,
      background: C.bg.surface,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 16px',
    })}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 14,
        background: 'rgba(155, 130, 255, 0.14)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Ion name="bookmark" size={18} color={C.brand.violet2} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={textStyle(16, 700, 23, C.text.hi)}>{tr(lang, 'rewards.vault.trackCtaTitle')}</div>
      <div style={textStyle(12, 600, 16, C.text.mid, { marginTop: 2, ...clampLines(1) })}>{tr(lang, 'rewards.vault.trackCtaSub')}</div>
    </div>
    <Ion name="chevron-forward" size={18} color={C.text.mid} />
  </div>
);

// ---------------------------------------------------------------- chips de categoria

const Chips: React.FC<{ L: RewardsLayout; filter: string[]; lang: Lang }> = ({ L, filter, lang }) => {
  const active = filter.length > 0;
  return (
    <>
      {L.chips.items.map(({ cat, rect }) => {
        const m = CATEGORY_META[cat];
        const variant = !active ? 'rest' : filter.includes(cat) ? 'selected' : 'ghosted';
        const icon = variant === 'ghosted' ? C.text.faint : m.color;
        const text = variant === 'selected' ? m.color : variant === 'ghosted' ? C.text.faint : C.text.mid;
        return (
          <div
            key={cat}
            style={at(rect, {
              borderRadius: 12,
              border: `1px solid ${variant === 'selected' ? `${m.color}70` : C.border.base}`,
              borderTopColor: variant === 'selected' ? `${m.color}80` : C.border.base,
              background: variant === 'selected' ? `${m.color}1A` : variant === 'ghosted' ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
              opacity: variant === 'ghosted' ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            })}
          >
            <Ion name={m.icon} size={14} color={icon} />
            <span style={textStyle(11, 800, naturalLine(11, 800), text, { letterSpacing: 0.4 })}>{tr(lang, `rewards.categories.${cat}`)}</span>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- cartão da loja (RewardCard)

const SECTION_COLOR = { available: '#FFC83D', almost: '#FF9F43', big: '#9B82FF' } as const;

const Card: React.FC<{ c: CardBox; lang: Lang; ctaPressed: boolean; opacity?: number }> = ({ c, lang, ctaPressed, opacity = 1 }) => {
  const cat = CATEGORY_META[c.reward.category];
  const accent = c.affordable ? C.semantic.coin : cat.color;
  const local = (r: Rect): Rect => ({ ...r, x: r.x - c.rect.x - 1, y: r.y - c.rect.y - 1 });
  if (opacity <= 0.001) return null;
  return (
    <div
      style={at(c.rect, {
        borderRadius: 16,
        border: `1px solid ${c.affordable ? C.semantic.coinRim : C.border.base}`,
        overflow: 'hidden',
        background: c.affordable ? vGrad(['rgba(50,38,18,0.7)', 'rgba(20,24,60,0.9)']) : vGrad(['rgba(36,42,88,0.65)', 'rgba(20,24,60,0.85)']),
        opacity,
      })}
    >
      {c.affordable ? (
        <>
          <div style={{ position: 'absolute', inset: 0, background: vGrad([`${cat.color}1F`, 'transparent'], [0, 0.45]) }} />
          <div style={{ position: 'absolute', right: -25, bottom: -32, width: 120, height: 120, opacity: 0.1 }}>
            <TopoGlyph size={120} />
          </div>
        </>
      ) : null}
      <div style={{ position: 'absolute', left: 14, top: 14, right: 14 }}>
        <div style={{ height: 42, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              border: `1px solid ${cat.color}50`,
              background: `${cat.color}26`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            <Ion name={c.reward.icon} size={20} color={cat.color} />
          </div>
          <Ion name={cat.icon} size={16} color={cat.color} style={{ opacity: 0.75, marginRight: 2 }} />
        </div>
        <div style={textStyle(15, 800, 18, C.text.hi, { marginBottom: 2, ...clampLines(2) })}>{c.reward.title[lang]}</div>
        {c.reward.description ? <div style={textStyle(11, 500, 15, C.text.mid, clampLines(1))}>{c.reward.description[lang]}</div> : null}
        {!c.affordable ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
              <div style={{ width: `${c.pct}%`, height: '100%', borderRadius: 999, background: hGrad([cat.color, accent]) }} />
            </div>
            <div style={textStyle(10, 700, naturalLine(10, 700), C.text.dim, { letterSpacing: 0.3, marginTop: 4 })}>
              {tr(lang, 'rewards.vault.remaining', { deficit: num(lang, c.deficit) })}
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ position: 'absolute', left: 14, bottom: 14, height: c.footerH, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Coin size={14} />
        <span style={textStyle(16, 800, naturalLine(16, 800), c.affordable ? C.semantic.coinLight : C.text.dim)}>{num(lang, c.reward.cost)}</span>
      </div>
      {c.affordable ? (
        <BuyPill r={local(c.cta)} size={10} lang={lang} pressed={ctaPressed} />
      ) : (
        <div
          style={at(local(c.cta), {
            borderRadius: 999,
            border: '1px solid rgba(155,130,255,0.35)',
            background: 'rgba(155,130,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: ctaPressed ? 0.85 : 1,
          })}
        >
          <Ion name="bookmark" size={9} color="#C2A1FF" style={{ marginRight: 4 }} />
          <span style={textStyle(10, 800, naturalLine(10, 800), '#C2A1FF', { letterSpacing: 0.7 })}>{upper(lang, tr(lang, 'rewards.vault.cta.track'))}</span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- "+ Nova recompensa" (AddCard)

const AddCard: React.FC<{ r: Rect; lang: Lang; pressed: boolean }> = ({ r, lang, pressed }) => {
  const tint = C.brand.violet2;
  return (
    <div
      style={at(r, {
        borderRadius: 18,
        border: `1px dashed ${tint}55`,
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        opacity: pressed ? 0.7 : 1,
        transform: pressed ? 'scale(0.98)' : undefined,
      })}
    >
      <div
        style={{ width: 36, height: 36, borderRadius: 14, background: `${tint}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <Ion name="add" size={20} color={tint} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={textStyle(14, 800, naturalLine(14, 800), tint, { letterSpacing: 0.3, ...clampLines(1) })}>{tr(lang, 'rewards.vault.addReward')}</div>
        <div style={textStyle(12, 500, naturalLine(12, 500), C.text.dim, { marginTop: 2, ...clampLines(1) })}>{tr(lang, 'rewards.vault.addRewardSub')}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- botões flutuantes (FabStack)

const Fabs: React.FC<{ L: RewardsLayout; pressed: string | null }> = ({ L, pressed }) => {
  const press = (on: boolean): React.CSSProperties => (on ? { opacity: 0.85, transform: 'scale(0.96)' } : {});
  return (
    <>
      <div
        style={at(L.fabs.calendar, {
          borderRadius: 999,
          background: C.bg.glassStrong,
          border: `1px solid ${C.border.base}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...press(pressed === 'fab.calendar'),
        })}
      >
        <Ion name="calendar-outline" size={22} color={C.text.mid} />
      </div>
      <div
        style={at(L.fabs.manage, {
          borderRadius: 999,
          border: '1px solid rgba(255,224,138,0.6)',
          overflow: 'hidden',
          background: vGrad(C.gradient.coinBtn, C.gradient.coinBtnLocations),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...press(pressed === 'fab.manage'),
        })}
      >
        <Ion name="options-outline" size={24} color={GOLD_INK} />
      </div>
    </>
  );
};

// ---------------------------------------------------------------- modais

/** O véu do Modal (rgba(0,0,0,0.65)); um só pros dois modais, desenhado embaixo dos cartões. */
const Scrim: React.FC<{ fade: number }> = ({ fade }) =>
  fade > 0.001 ? <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', opacity: fade }} /> : null;

/** Corpo do cartão do modal: opacidade do corpo + mola de 20 dp pra cima (damping 18, stiffness 180). */
const cardMotion = (age: number, body: number): React.CSSProperties => {
  const rise = spring({ frame: age, fps: 30, config: { damping: 18, stiffness: 180 } });
  return { opacity: body, transform: `translateY(${(1 - rise) * 20}px)` };
};

/** O texto do cartão por cima do corpo: entra depois e sai antes dele (ver MODAL). */
const Content: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) => (
  <div style={{ position: 'absolute', inset: 0, opacity: o }}>{children}</div>
);

type ModalAnim = { body: number; content: number; age: number };

const ConfirmModal: React.FC<{ b: ConfirmBox; lang: Lang; coins: number; m: ModalAnim; pressed: string | null }> = ({ b, lang, coins, m, pressed }) => {
  const cat = CATEGORY_META[b.reward.category];
  const deficit = Math.max(0, b.total - coins);
  const loc = (r: Rect): Rect => ({ ...r, x: r.x - b.rect.x - 1, y: r.y - b.rect.y - 1 });
  const step = (r: Rect | null, icon: string, disabled: boolean, key: string) =>
    r ? (
      <div
        style={at(loc(r), {
          borderRadius: 18,
          border: `1px solid ${C.border.strong}`,
          background: 'rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed === key ? 0.7 : 1,
        })}
      >
        <Ion name={icon} size={18} color={disabled ? C.text.faint : C.text.hi} />
      </div>
    ) : null;
  return (
    <div
      style={at(b.rect, {
        borderRadius: 22,
        border: '1px solid rgba(255, 200, 61, 0.45)',
        overflow: 'hidden',
        background: vGrad(C.gradient.confirmCardWarm),
        ...cardMotion(m.age, m.body),
      })}
    >
      <div style={{ position: 'absolute', inset: 0, background: vGrad([`${cat.color}20`, 'transparent'], [0, 0.45]) }} />
      <Content o={m.content}>
        <div style={{ position: 'absolute', left: 20, top: 20, right: 20, height: b.headerH, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              border: `1px solid ${cat.color}60`,
              background: `${cat.color}26`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <Ion name={b.reward.icon} size={28} color={cat.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={textStyle(10, 800, naturalLine(10, 800), cat.color, { letterSpacing: 1.4, marginBottom: 4 })}>
              {upper(lang, tr(lang, `rewards.categories.${b.reward.category}`))}
            </div>
            <div style={textStyle(18, 800, 22, C.text.hi, clampLines(2))}>{b.reward.title[lang]}</div>
          </div>
        </div>
        {b.qtyRow ? (
          <div
            style={at(loc(b.qtyRow), {
              borderRadius: 14,
              border: `1px solid ${C.border.base}`,
              background: 'rgba(255,255,255,0.03)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
            })}
          >
            <span style={textStyle(13, 700, naturalLine(13, 700), C.text.mid, { letterSpacing: 0.3 })}>{tr(lang, 'rewards.buyConfirm.qtyLabel')}</span>
          </div>
        ) : null}
        {step(b.minus, 'remove', b.qty <= 1, 'confirm.minus')}
        {b.minus && b.plus ? (
          <div
            style={at(
              loc({ x: b.minus.x + 48, y: b.minus.y, w: b.plus.x - 12 - (b.minus.x + 48), h: 36 }),
              textStyle(22, 800, 36, C.text.hi, { textAlign: 'center' }),
            )}
          >
            {b.qty}
          </div>
        ) : null}
        {step(b.plus, 'add', b.qty >= 50, 'confirm.plus')}
        <div style={at(loc(b.totalRow), { display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
          <span style={textStyle(13, 700, naturalLine(13, 700), C.text.mid, { letterSpacing: 0.3 })}>{tr(lang, 'rewards.buyConfirm.total')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Coin size={16} />
            <span style={textStyle(20, 800, naturalLine(20, 800), b.canBuy ? C.semantic.coinLight : C.semantic.danger)}>{num(lang, b.total)}</span>
          </div>
        </div>
        {!b.canBuy ? (
          <div
            style={at(
              { ...loc(b.totalRow), y: loc(b.totalRow).y + b.totalRow.h + 4, h: naturalLine(11, 700) },
              textStyle(11, 700, naturalLine(11, 700), C.semantic.danger, { textAlign: 'right' }),
            )}
          >
            {tr(lang, 'rewards.buyConfirm.deficit', { deficit: num(lang, deficit) })}
          </div>
        ) : null}
        <div
          style={at(loc(b.redeem), {
            borderRadius: 999,
            border: `1px solid ${b.canBuy ? C.semantic.coinRim : C.border.base}`,
            overflow: 'hidden',
            background: b.canBuy ? vGrad(C.gradient.coinBtn, [0, 0.5, 1]) : 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed === 'confirm.redeem' ? 0.85 : 1,
          })}
        >
          <span style={textStyle(13, 800, naturalLine(13, 800), b.canBuy ? GOLD_INK : C.text.faint, { letterSpacing: 0.7 })}>
            {upper(lang, tr(lang, 'rewards.buyConfirm.confirm'))}
          </span>
        </div>
        <div
          style={at(loc(b.cancelHit), {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed === 'confirm.cancel' ? 0.6 : 1,
          })}
        >
          <span style={textStyle(13, 700, naturalLine(13, 700), C.text.mid)}>{tr(lang, 'rewards.buyConfirm.cancel')}</span>
        </div>
      </Content>
    </div>
  );
};

const CelebrationModal: React.FC<{ b: CelebBox; lang: Lang; m: ModalAnim; icon: number; pressed: string | null }> = ({ b, lang, m, icon, pressed }) => {
  const cat = CATEGORY_META[b.reward.category];
  const loc = (r: Rect): Rect => ({ ...r, x: r.x - b.rect.x - 1, y: r.y - b.rect.y - 1 });
  const eyebrowH = naturalLine(10, 800);
  const costH = Math.max(16, naturalLine(18, 800));
  const innerW = b.rect.w - 2 - 40;
  return (
    <div
      style={at(b.rect, {
        borderRadius: 22,
        border: `1px solid ${C.semantic.coinRim}`,
        overflow: 'hidden',
        background: vGrad(C.gradient.celebrationCard),
        ...cardMotion(m.age, m.body),
      })}
    >
      <div style={{ position: 'absolute', inset: 0, background: vGrad([`${cat.color}26`, 'transparent'], [0, 0.4]) }} />
      <div style={{ position: 'absolute', right: -40, bottom: -30, width: 180, height: 180, opacity: 0.08 }}>
        <TopoGlyph size={180} />
      </div>
      <Content o={m.content}>
        <div style={{ position: 'absolute', left: 20, top: 20, width: innerW, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={textStyle(10, 800, eyebrowH, C.semantic.coinLight, { letterSpacing: 1.6 })}>{tr(lang, 'rewards.celebration.eyebrow')}</div>
          <div
            style={{
              width: 96,
              height: 96,
              margin: '8px 0',
              borderRadius: 24,
              border: `1px solid ${cat.color}90`,
              background: `${cat.color}26`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              transform: `scale(${icon})`,
            }}
          >
            <Ion name={b.reward.icon} size={48} color={cat.color} />
          </div>
          <div style={{ width: innerW - 16, ...textStyle(22, 800, 26, C.text.hi, { textAlign: 'center', ...clampLines(2) }) }}>{b.title}</div>
          <div style={{ height: costH, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Coin size={16} />
            <span style={textStyle(18, 800, naturalLine(18, 800), C.semantic.coinLight)}>−{num(lang, b.paid)}</span>
          </div>
        </div>
        <div
          style={at(loc(b.enjoy), {
            borderRadius: 999,
            border: `1px solid ${C.semantic.coinRim}`,
            overflow: 'hidden',
            background: vGrad(C.gradient.coinBtn, [0, 0.5, 1]),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: pressed === 'celebration.enjoy' ? 0.85 : 1,
          })}
        >
          <Ion name="sparkles" size={14} color={GOLD_INK} />
          <span style={textStyle(12, 800, naturalLine(12, 800), GOLD_INK, { letterSpacing: 0.7 })}>{upper(lang, tr(lang, 'rewards.celebration.enjoy'))}</span>
        </div>
        <div
          style={at(loc(b.undoHit), {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed === 'celebration.undo' ? 0.6 : 1,
          })}
        >
          <span style={textStyle(13, 700, naturalLine(13, 700), C.text.mid)}>{tr(lang, 'rewards.celebration.undo')}</span>
        </div>
      </Content>
    </div>
  );
};

// ---------------------------------------------------------------- a tela inteira

export const RewardsScreen: React.FC<{ s: RewardsState; v: RewardsView; L: RewardsLayout; ctx: RewardsCtx; pressed: string | null }> = ({
  s,
  v,
  L,
  ctx,
  pressed,
}) => {
  const { lang } = ctx;
  const d = L.d;
  const first = L.sections[0]?.cards[0];
  const p = pressed === 'card0.cta' && first ? `card:${first.reward.id}:cta` : pressed;
  const sc = { position: 'absolute', left: 0, top: -L.scroll, width: d.w, height: L.contentH } as const;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: d.w, height: d.h, overflow: 'hidden', background: C.bg.deep }}>
      <StatusBar d={d} />
      {/* ScreenBackground (gradiente screenAmbient) com a ScrollView dentro */}
      <div
        style={at(
          { x: 0, y: d.statusBar, w: d.w, h: d.h - d.statusBar },
          { overflow: 'hidden', background: vGrad(C.gradient.screenAmbient, C.gradient.screenAmbientLocations) },
        )}
      >
        <div style={sc}>
          <Hero L={L} />
          <div style={at(L.info, { display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: p === 'info' ? 0.6 : 1 })}>
            <Ion name="information-circle-outline" size={24} color={C.text.mid} />
          </div>
          {L.goal ? <GoalCard g={L.goal} lang={lang} coins={v.balance} pressed={p} /> : null}
          {L.trackCta ? <TrackCta r={L.trackCta} lang={lang} /> : null}
          <Chips L={L} filter={s.filter} lang={lang} />
          {L.sections.map((sec) => (
            <React.Fragment key={sec.key}>
              <div style={at(sec.header, { display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
                <span style={textStyle(17, 700, 21, SECTION_COLOR[sec.key])}>{tr(lang, `rewards.vault.sections.${sec.key}`)}</span>
                <span style={textStyle(12, 600, 16, C.text.mid, { letterSpacing: 0.5 })}>
                  {upper(lang, tr(lang, 'rewards.vault.itemsCount', { count: sec.cards.length }))}
                </span>
              </div>
              {sec.cards.map((c) => (
                <Card
                  key={c.reward.id}
                  c={c}
                  lang={lang}
                  ctaPressed={p === `card:${c.reward.id}:cta`}
                  // o mirado apaga no lugar; o vão só fecha quando ele vira a meta
                  opacity={v.leaving?.id === c.reward.id ? 1 - ease(v.leaving.t) : 1}
                />
              ))}
            </React.Fragment>
          ))}
          <AddCard r={L.add} lang={lang} pressed={p === 'add'} />
        </div>
      </div>
      <Fabs L={L} pressed={p} />
      <BottomNav d={d} lang={lang} active="rewards" locked={ctx.fx.lockedTabs} />
      <GestureBar d={d} />
      <Scrim fade={v.scrim} />
      {v.confirm && L.confirm ? (
        <ConfirmModal b={L.confirm} lang={lang} coins={v.balance} m={{ body: v.confirm.body, content: v.confirm.content, age: v.confirm.card }} pressed={p} />
      ) : null}
      {v.celebration && L.celebration ? (
        <CelebrationModal
          b={L.celebration}
          lang={lang}
          m={{ body: v.celebration.body, content: v.celebration.content, age: v.celebration.card }}
          icon={v.celebration.icon}
          pressed={p}
        />
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- animação + módulo

/**
 * Tempos do modal, em quadros. O Modal do RN abre e fecha em fade (~270 ms); aqui o fade
 * é dividido em corpo e texto pra que, em nenhum quadro, um texto apareça através de
 * outro: o corpo vazio (fundo 95–98% opaco) entra primeiro e o texto entra por cima dele;
 * na saída o texto sai primeiro e o corpo vazio depois. O véu é um só pros dois modais e
 * fica de pé enquanto um cartão estiver na tela — da confirmação pra comemoração ele não
 * pisca, e a loja só volta a aparecer quando o último cartão já saiu.
 */
const MODAL = {
  /** o corpo vazio aparece nisto */
  BODY_IN: 4,
  /** o texto começa a entrar aqui (o corpo já está quase opaco) */
  CONTENT_AT: 3,
  CONTENT_IN: 5,
  /** saída: o texto sai nisto… */
  CONTENT_OUT: 4,
  /** …e o corpo vazio, logo depois */
  BODY_OUT: 4,
  /** o véu sobe/desce nisto */
  SCRIM: 8,
} as const;
const CLOSE_FRAMES = MODAL.CONTENT_OUT + MODAL.BODY_OUT;
const BALANCE_FRAMES = 20;
const SCROLL_FRAMES = 22;

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeIn = (t: number) => Math.pow(clamp01(t), 3);
const easeIO = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

type Phase = NonNullable<ReturnType<typeof modalPhase>>;
// o corpo vazio sai devagar no começo (ease-in) e o que entra sobe rápido (ease-out):
// da confirmação pra comemoração os dois somados ficam opacos e a loja não aparece no meio
const modalAnim = (p: Phase) =>
  p.closing
    ? { body: 1 - easeIn((p.since - MODAL.CONTENT_OUT) / MODAL.BODY_OUT), content: 1 - clamp01(p.since / MODAL.CONTENT_OUT), card: p.age, closing: true }
    : { body: ease(p.age / MODAL.BODY_IN), content: clamp01((p.age - MODAL.CONTENT_AT) / MODAL.CONTENT_IN), card: p.age, closing: false };

/** Algum cartão de modal na tela (aberto ou saindo) no quadro g. */
const anyCard = (h: Snap<RewardsState>[], g: number) =>
  !!(modalPhase(h, g, (s) => s.confirm, CLOSE_FRAMES) || modalPhase(h, g, (s) => s.celebration, CLOSE_FRAMES));

/** O véu: sobe quando o primeiro cartão aparece e desce só depois que o último saiu. */
const scrimAt = (h: Snap<RewardsState>[], f: number) => {
  const on = anyCard(h, f);
  let n = 0; // quadros desde que o véu mudou de sentido (o valor só depende dos últimos MODAL.SCRIM)
  while (n < MODAL.SCRIM && anyCard(h, f - n - 1) === on) n++;
  return on ? n / MODAL.SCRIM : 1 - n / MODAL.SCRIM;
};

export const viewRewards = (h: Snap<RewardsState>[], f: number): RewardsView => {
  const bal = lastChange(h, f, (s) => s.balance);
  const scr = lastChange(h, f, (s) => s.scroll);
  const cf = modalPhase(h, f, (s) => s.confirm, CLOSE_FRAMES);
  const cb = modalPhase(h, f, (s) => s.celebration, CLOSE_FRAMES);
  const lv = lastChange(h, f, (s) => s.leaving);
  const iconScale = (age: number) =>
    spring({ frame: age - 2.4, fps: 30, from: 0.4, to: 1, config: { damping: 9, stiffness: 200 } });
  return {
    balance: bal.at === HISTORY_START ? bal.to : bal.from + (bal.to - bal.from) * ease((f - bal.at) / BALANCE_FRAMES),
    scroll: scr.at === HISTORY_START ? scr.to : scr.from + (scr.to - scr.from) * easeIO((f - scr.at) / SCROLL_FRAMES),
    scrim: scrimAt(h, f),
    // `card` leva a idade do modal (quadros desde que abriu); a mola sai dela no render
    confirm: cf ? { ...cf.c, ...modalAnim(cf) } : null,
    celebration: cb ? { ...cb.c, ...modalAnim(cb), icon: cb.closing ? 1 : iconScale(cb.age - MODAL.CONTENT_AT) } : null,
    leaving: lv.to ? { id: lv.to, t: clamp01((f - lv.at) / LEAVE_FADE) } : null,
  };
};

export const REWARDS_SCREEN: ScreenModule<RewardsState, RewardsView, RewardsLayout, RewardsCtx> = {
  id: 'rewards',
  device: DEVICE,
  makeCtx: ({ fixture, lang }) => ({ fx: rewardsFixture(fixture), lang, d: DEVICE }),
  initial: (ctx, patch) => initialRewards(ctx.fx, patch),
  tap: tapRewards,
  scrollFor: scrollForRewards,
  view: viewRewards,
  layout: (s, v, ctx, h, f) =>
    layoutRewards(s, ctx, {
      balanceShown: v.balance,
      scrollShown: v.scroll,
      confirmHint: v.confirm ? { id: v.confirm.id, qty: v.confirm.qty } : nextValue(h, f, (x) => x.confirm),
      celebrationHint: v.celebration ? { id: v.celebration.id, qty: v.celebration.qty, paid: v.celebration.paid } : nextValue(h, f, (x) => x.celebration),
      confirmClosing: !!v.confirm?.closing,
      celebrationClosing: !!v.celebration?.closing,
    }),
  Render: RewardsScreen,
};

/** Estado avulso (folha de conferência da réplica, sem tour). */
export const staticRewards = (fixture: string, lang: Lang, patch: Partial<RewardsState> = {}) => {
  const ctx = REWARDS_SCREEN.makeCtx({ fixture, lang });
  const s = REWARDS_SCREEN.initial(ctx, patch);
  const h: Snap<RewardsState>[] = [{ frame: HISTORY_START, state: s }];
  const v = REWARDS_SCREEN.view(h, 0);
  const L = REWARDS_SCREEN.layout(stateAt(h, 0), v, ctx, h, 0);
  return { ctx, s, v, L };
};
