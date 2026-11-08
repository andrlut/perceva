// Réplica da aba Eu (app/app/(tabs)/character.tsx) como está no código hoje,
// desenhada em dp a partir de meLayout.ts. Cores, textos e ícones vêm do
// próprio app (tokens.ts, locales, Ionicons). Nada aqui decide posição: a
// posição de tudo que o tour aponta sai do layout.
import React, { useId } from 'react';
import { Emblema } from '../../Emblema';
import { Glyph } from '../../Glyph';
import { Ion, Rect, at, textStyle, tokens, vGrad } from '../ui';
import { naturalLine } from '../text';
import { BottomNav, DEVICE, GestureBar, StatusBar } from './chrome';
import { Lang, tr, upper } from './i18n';
import {
  ACCENT,
  BAR_SPAN,
  CardBox,
  DIM_ICON,
  DIM_ORDER,
  DimId,
  FirstStep,
  HexBox,
  MeCtx,
  MeLayout,
  MeState,
  MeView,
  PanelBox,
  PillarKey,
  SUBS_BY_DIM,
  barSegments,
  initialMe,
  layoutMe,
  meFixture,
  scrollForMe,
  tapMe,
  windowXp,
} from './meLayout';
import { HISTORY_START, SCROLL_EASE, ScreenModule, Snap, lastChange, stateAt, swipeProgress } from './types';
import TARGETS from './targets.json';

const C = tokens;
const n = naturalLine;
const dimColor = (d: DimId) => (C.dimension as Record<string, string>)[d];
const dimBg = (d: DimId) => (C.dimensionBg as Record<string, string>)[d];
const SURFACE = 'rgba(255,255,255,0.025)'; // DimensionPillarCard / PillarActions no tema escuro

// PillarSwitcher: halo e borda do ativo
const PILLAR_STYLE: Record<PillarKey, { icon: string; halo: string; border: string }> = {
  percebida: { icon: 'eye-outline', halo: 'rgba(155, 130, 255, 0.18)', border: 'rgba(155, 130, 255, 0.35)' },
  praticada: { icon: 'pulse', halo: 'rgba(111, 232, 170, 0.18)', border: 'rgba(61, 214, 140, 0.35)' },
  desejada: { icon: 'compass-outline', halo: 'rgba(255, 200, 61, 0.18)', border: 'rgba(255, 200, 61, 0.35)' },
};

// ---------------------------------------------------------------- HeroHeader

const Hero: React.FC<{ L: MeLayout; ctx: MeCtx; pressed: string | null }> = ({ L, ctx, pressed }) => {
  const id = `hh${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { fx } = ctx;
  const h = L.hero;
  const lit = DIM_ORDER.flatMap((d) => SUBS_BY_DIM[d]).map((sub) => (windowXp(fx, sub) > 0 ? 1 : 0));
  return (
    <>
      {/* halo ambiente: SVG 520 centrado, top −170 */}
      <svg width={520} height={520} viewBox="0 0 520 520" style={at({ x: L.d.w / 2 - 260, y: -170, w: 520, h: 520 })}>
        <defs>
          <radialGradient id={id} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#9B82FF" stopOpacity={0.14} />
            <stop offset="0.55" stopColor="#9B82FF" stopOpacity={0.05} />
            <stop offset="1" stopColor="#9B82FF" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx="260" cy="260" r="260" fill={`url(#${id})`} />
      </svg>
      {/* marca-d'água: o glifo 190, right −10, 6% */}
      <Glyph size={190} cx={L.d.w + 10 - 95} cy={h.rect.h / 2} opacity={0.06} glow={0} />
      <div style={{ opacity: pressed === 'profile' ? 0.6 : 1 }}>
        <Emblema size={82} cx={h.emblem.x + 46} cy={h.emblem.y + 46} rings={fx.emblem.rings} tests={fx.emblem.tests} halo={fx.emblem.halo} lit={lit} center={0} />
        <div style={{ position: 'absolute', left: h.textX, top: h.textY, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={textStyle(10, 800, n(10, 800), C.brand.violet2, { letterSpacing: 1.4 })}>{h.level}</div>
          <div style={textStyle(28, 800, 29, C.text.hi, { letterSpacing: -0.3, marginTop: 2 })}>{h.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, height: Math.max(11, n(11, 700)) }}>
            <Ion name="sparkles-outline" size={11} color={C.semantic.coinLight} />
            <span style={textStyle(11, 700, n(11, 700), C.semantic.coinLight, { letterSpacing: 0.3 })}>{h.disc}</span>
            <Ion name="chevron-forward" size={11} color={C.semantic.coinLight} />
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------- PillarSwitcher

const Tabs: React.FC<{ L: MeLayout; active: PillarKey; lang: Lang; pressed: string | null }> = ({ L, active, lang, pressed }) => (
  <>
    {L.tabs.map(({ key, rect }) => {
      const on = key === active;
      const st = PILLAR_STYLE[key];
      const color = on ? ACCENT[key] : C.text.dim;
      return (
        <div
          key={key}
          style={at(rect, {
            borderRadius: 14,
            border: `1px solid ${on ? st.border : C.border.base}`,
            background: on ? st.halo : 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            opacity: pressed === `pillar.${key}` ? 0.85 : 1,
          })}
        >
          <Ion name={st.icon} size={22} color={color} />
          <span style={textStyle(10, 800, n(10, 800), color, { letterSpacing: 1.2 })}>{upper(lang, tr(lang, `pillar.top.${key}.label`))}</span>
        </div>
      );
    })}
  </>
);

// ---------------------------------------------------------------- HexRadar (+ XpHexChart / HexChart)

const RING_STEPS = [0.34, 0.67, 1];
const angle = (j: number) => (j / 6) * Math.PI * 2 - Math.PI / 2;

const Hex: React.FC<{ hx: HexBox; idKey: string }> = ({ hx, idKey }) => {
  const gid = `hexg${idKey}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const S = hx.rect.w;
  const c = S / 2;
  const pt = (j: number, r: number) => [c + Math.cos(angle(j)) * r, c + Math.sin(angle(j)) * r];
  const ring = (r: number) => DIM_ORDER.map((_, j) => pt(j, r).join(',')).join(' ');
  const hasShape = hx.axes.some((a) => a.active && a.ratio > 0);
  const shape = hx.axes.map((a, j) => pt(j, Math.max(0, Math.min(1, a.ratio)) * hx.R));
  const sec = hx.secondary && hx.secondary.some((r) => r > 0) ? hx.secondary.map((r, j) => pt(j, Math.max(0, Math.min(1, r)) * hx.R)) : null;
  const unitH = hx.unit ? 1 + n(10, 700) : 0;
  const valH = hx.fontSize * 1.1;
  return (
    <div style={at(hx.rect)}>
      {/* o número do centro fica EMBAIXO do desenho, como no app */}
      <div style={{ position: 'absolute', left: 0, top: c - (valH + unitH) / 2, width: S, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={textStyle(hx.fontSize, 800, valH, C.text.hi, { letterSpacing: -0.5 })}>{hx.center}</div>
        {hx.unit ? <div style={textStyle(10, 700, n(10, 700), C.text.dim, { letterSpacing: 1.4, marginTop: 1 })}>{hx.unit}</div> : null}
      </div>
      <svg width={S} height={S} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.text.hi} stopOpacity={0.15} />
            <stop offset="1" stopColor={C.text.hi} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        {RING_STEPS.map((k) => (
          <polygon key={k} points={ring(hx.R * k)} fill="none" stroke={k === 1 ? C.border.strong : C.border.divider} strokeWidth={1} />
        ))}
        {DIM_ORDER.map((_, j) => {
          const [x, y] = pt(j, hx.R);
          return <line key={j} x1={c} y1={c} x2={x} y2={y} stroke={C.border.divider} strokeWidth={1} />;
        })}
        {hasShape ? <polygon points={shape.map((p) => p.join(',')).join(' ')} fill={`url(#${gid})`} stroke={C.text.mid} strokeWidth={1.75} strokeLinejoin="round" /> : null}
        {sec ? (
          <>
            <polygon points={sec.map((p) => p.join(',')).join(' ')} fill="none" stroke={hx.secondaryColor ?? C.text.mid} strokeWidth={1.5} strokeOpacity={0.9} strokeLinejoin="round" />
            {sec.map(([x, y], j) => (
              <circle key={j} cx={x} cy={y} r={3} fill={hx.secondaryColor ?? C.text.mid} />
            ))}
          </>
        ) : null}
        {hasShape
          ? hx.axes.map((a, j) => (a.active ? <circle key={j} cx={shape[j][0]} cy={shape[j][1]} r={4} fill={dimColor(a.dim)} stroke={C.bg.deep} strokeWidth={1} /> : null))
          : null}
      </svg>
      {hx.axes.map((a) => {
        const b = hx.badges[a.dim];
        return (
          <div
            key={a.dim}
            style={at(
              { ...b, x: b.x - hx.rect.x, y: b.y - hx.rect.y },
              {
                borderRadius: 16,
                background: dimBg(a.dim),
                border: `1px solid ${a.active ? `${dimColor(a.dim)}66` : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
            )}
          >
            <Ion name={DIM_ICON[a.dim]} size={15} color={a.active ? dimColor(a.dim) : C.text.faint} />
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- HexPill / legenda / período / nota

const PillView: React.FC<{ r: Rect; icon: string; label: string; accent: string }> = ({ r, icon, label, accent }) => (
  <div style={at(r, { borderRadius: 14, border: `1px solid ${accent}4D`, background: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 })}>
    <Ion name={icon} size={13} color={accent} />
    <span style={textStyle(12, 800, n(12, 800), accent)}>{label}</span>
  </div>
);

const Legend: React.FC<{ p: PanelBox }> = ({ p }) =>
  p.legend ? (
    <>
      {p.legend.pills.map((e) => {
        const sw =
          e.shape === 'fill'
            ? { background: e.visible ? C.bg.surface3 : 'transparent', borderColor: e.visible ? C.text.mid : C.text.faint }
            : { background: 'transparent', borderColor: e.visible ? (e.color ?? C.text.mid) : C.text.faint };
        return (
          <div
            key={e.label}
            style={at(e.rect, {
              borderRadius: 14,
              border: `1px solid ${e.visible ? `${p.accent}4D` : C.border.base}`,
              background: e.visible ? `${p.accent}14` : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            })}
          >
            <div style={{ width: 14, height: 10, borderRadius: 3, border: `1px solid ${sw.borderColor}`, background: sw.background, boxSizing: 'border-box' }} />
            <span style={textStyle(11, 700, n(11, 700), e.visible ? p.accent : C.text.faint, { letterSpacing: 0.3 })}>{e.label}</span>
          </div>
        );
      })}
    </>
  ) : null;

const PeriodView: React.FC<{ p: PanelBox }> = ({ p }) => {
  const pr = p.period;
  if (!pr) return null;
  return (
    <>
      {pr.chips.map((c) => (
        <div
          key={c.key}
          style={at(c.rect, {
            borderRadius: c.rect.h / 2,
            border: `1px solid ${c.active ? 'rgba(61, 214, 140, 0.35)' : C.border.base}`,
            background: c.active ? 'rgba(111, 232, 170, 0.18)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <span style={textStyle(12, 700, n(12, 700), c.active ? p.accent : C.text.dim, { letterSpacing: 0.3 })}>{c.label}</span>
        </div>
      ))}
      <div style={at(pr.prev, { display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
        <Ion name="chevron-back" size={16} color={C.text.mid} />
      </div>
      <div style={at(pr.labelRect, { display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
        <span style={textStyle(12, 700, n(12, 700), C.text.base, { letterSpacing: 0.4 })}>{pr.label}</span>
      </div>
      <div style={at(pr.next, { display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.25 })}>
        <Ion name="chevron-forward" size={16} color={C.text.mid} />
      </div>
    </>
  );
};

// ---------------------------------------------------------------- barras

const pctS = (r: number) => `${Math.max(0, Math.min(100, r * 100))}%`;

/** components/dedicacao/SubBar.tsx: o traço marca a régua (1/3), o aceso é o que passou dela. */
const XpBar: React.FC<{ xp: number; color: string }> = ({ xp, color }) => {
  const { base, over, clipped } = barSegments(xp);
  const tick = 1 / BAR_SPAN;
  return (
    <div style={{ position: 'relative', height: 14 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 3, height: 8, borderRadius: 4, background: `${color}1A` }} />
      {base > 0 ? (
        <div style={{ position: 'absolute', left: 0, top: 3, height: 8, minWidth: 4, width: pctS(base), borderRadius: over > 0 ? '4px 0 0 4px' : 4, background: `${color}73` }} />
      ) : null}
      {over > 0 ? <div style={{ position: 'absolute', left: pctS(tick), top: 3, height: 8, minWidth: 4, width: pctS(over), borderRadius: '0 4px 4px 0', background: color }} /> : null}
      {clipped ? <div style={{ position: 'absolute', right: 6, top: 3, width: 2, height: 8, background: C.bg.deep }} /> : null}
      <div style={{ position: 'absolute', left: pctS(tick), top: 0, width: 2, height: 14, marginLeft: -1, borderRadius: 1, background: C.text.hi, opacity: 0.6 }} />
    </div>
  );
};

/** DimensionPillarCard › ScoreBar: `from` = o trecho de base (hoje), o aceso é o que falta subir. */
const ScoreBar: React.FC<{ fill: number; from?: number; color: string }> = ({ fill, from, color }) => {
  const end = Math.max(0, Math.min(1, fill));
  const base = from === undefined ? 0 : Math.max(0, Math.min(1, from));
  const lit = end > base ? end - base : 0;
  return (
    <div style={{ position: 'relative', height: 14 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 3, height: 8, borderRadius: 4, background: `${color}1A` }} />
      {base > 0 ? <div style={{ position: 'absolute', left: 0, top: 3, height: 8, minWidth: 4, width: pctS(base), borderRadius: lit > 0 ? '4px 0 0 4px' : 4, background: `${color}73` }} /> : null}
      {lit > 0 ? <div style={{ position: 'absolute', left: pctS(base), top: 3, height: 8, minWidth: 4, width: pctS(lit), borderRadius: base > 0 ? '0 4px 4px 0' : 4, background: color }} /> : null}
    </div>
  );
};

// ---------------------------------------------------------------- DimensionPillarCard

const Card: React.FC<{ c: CardBox; lang: Lang; pressed: boolean }> = ({ c, lang, pressed }) => {
  const color = dimColor(c.dim);
  const innerW = c.rect.w - 2 - 24;
  const max = Math.max(0, ...c.strips.flatMap((s) => s.values));
  const chevron = c.open === null ? 'chevron-forward' : c.open ? 'chevron-up' : 'chevron-down';
  return (
    <div style={at(c.rect, { borderRadius: 14, background: SURFACE, border: '1px solid transparent', overflow: 'hidden', opacity: pressed ? 0.85 : 1 })}>
      <div style={{ position: 'absolute', left: 12, top: 12, width: innerW, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 10, background: dimBg(c.dim), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ion name={DIM_ICON[c.dim]} size={16} color={color} />
          </div>
          <span style={textStyle(15, 800, n(15, 800), C.text.hi, { flex: 1, minWidth: 0 })}>{tr(lang, `dimensions.${c.dim}.label`)}</span>
          <span style={textStyle(18, 800, n(18, 800), c.faint ? C.text.faint : C.text.hi, { letterSpacing: -0.2 })}>
            {c.value}
            {c.unit ? <span style={textStyle(11, 700, n(11, 700), C.text.dim, { letterSpacing: 0 })}>{c.unit}</span> : null}
          </span>
          <Ion name={chevron} size={14} color={C.text.dim} />
        </div>
        {c.subs.map((s) => (
          <div key={s.sub} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ height: s.rowH, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={textStyle(12, 600, n(12, 600), C.text.mid, { flex: 1, minWidth: 0 })}>{s.label}</span>
              <span
                style={
                  s.reached
                    ? textStyle(13, 800, n(13, 800), s.faint ? C.text.faint : color)
                    : textStyle(12, 700, n(12, 700), s.faint ? C.text.faint : C.text.mid)
                }
              >
                {s.value}
              </span>
            </div>
            {s.bar.kind === 'xp' ? <XpBar xp={s.bar.xp} color={color} /> : <ScoreBar fill={s.bar.fill} from={s.bar.from} color={color} />}
          </div>
        ))}
        {c.open !== null && c.t > 0 ? (
          // aberto: as tiras dos dias, o nível, o link (entram com a abertura)
          <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 8, opacity: c.t }}>
            <div style={{ height: 1, background: C.border.divider }} />
            {c.strips.map((st) => (
              <div key={st.sub} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ height: Math.max(n(11, 600), n(11, 700)), display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={textStyle(11, 600, n(11, 600), C.text.dim, { flex: 1, minWidth: 0 })}>{st.label}</span>
                  <span style={textStyle(11, 700, n(11, 700), C.text.mid)}>{st.count}</span>
                </div>
                <div style={{ display: 'flex', gap: 2, height: 16 }}>
                  {st.values.map((v, i) => (
                    <div key={i} style={{ flex: 1, height: 16, borderRadius: 3, background: color, opacity: v > 0 && max > 0 ? 0.4 + 0.6 * Math.min(1, v / max) : 0.12 }} />
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 2, height: Math.max(n(11, 600), n(11, 700), 12), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={textStyle(11, 600, n(11, 600), C.text.dim)}>{c.level}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={textStyle(11, 700, n(11, 700), color, { letterSpacing: 0.3 })}>{c.link}</span>
                <Ion name="arrow-forward" size={12} color={color} />
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- PillarFirstStep / PillarActions

const FirstStepView: React.FC<{ f: FirstStep; pressed: boolean }> = ({ f, pressed }) => (
  <>
    <div style={at(f.rect, { borderRadius: 18, background: C.bg.surface, border: `1.5px solid ${C.semantic.coinRim}`, opacity: pressed ? 0.9 : 1 })} />
    <div
      style={at(
        { x: f.rect.x + 1.5 + 14, y: f.rect.y + f.rect.h / 2 - 22, w: 44, h: 44 },
        { borderRadius: 12, background: 'rgba(255, 200, 61, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
      )}
    >
      <Ion name={f.icon} size={22} color={C.semantic.coinLight} />
    </div>
    <div style={{ position: 'absolute', left: f.bodyX, top: f.bodyY, width: f.bodyW, display: 'flex', flexDirection: 'column' }}>
      {f.title.map((l) => (
        <div key={l} style={textStyle(15, 800, n(15, 800), C.text.hi)}>
          {l}
        </div>
      ))}
      <div style={{ height: 2 }} />
      {f.line.map((l) => (
        <div key={l} style={textStyle(12.5, 500, 17, C.text.mid)}>
          {l}
        </div>
      ))}
    </div>
    <div style={at(f.btn, { borderRadius: f.btn.h / 2, background: C.semantic.coin, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 })}>
      <span style={textStyle(12, 800, n(12, 800), C.semantic.coinInk)}>{f.cta}</span>
      <Ion name="arrow-forward" size={14} color={C.semantic.coinInk} />
    </div>
  </>
);

const Actions: React.FC<{ p: PanelBox; pressed: string | null }> = ({ p, pressed }) =>
  p.actions ? (
    <div style={at(p.actions.rect, { borderRadius: 14, background: SURFACE, overflow: 'hidden' })}>
      {p.actions.rows.map((r, i) => (
        <React.Fragment key={r.key}>
          {i > 0 ? <div style={{ position: 'absolute', left: 12, right: 12, top: r.rect.y - p.actions!.rect.y - 1, height: 1, background: C.border.divider }} /> : null}
          <div
            style={at(
              { ...r.rect, x: 0, y: r.rect.y - p.actions!.rect.y },
              { display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', opacity: pressed === `action.${r.key}` ? 0.6 : 1 },
            )}
          >
            <div style={{ width: 28, height: 28, borderRadius: 10, background: `${p.accent}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ion name={r.icon} size={16} color={p.accent} />
            </div>
            <span style={textStyle(14, 700, n(14, 700), C.text.hi, { flex: 1, minWidth: 0 })}>{r.label}</span>
            {r.value ? <span style={textStyle(12, 600, n(12, 600), C.text.dim)}>{r.value}</span> : null}
            <Ion name="chevron-forward" size={14} color={C.text.dim} />
          </div>
        </React.Fragment>
      ))}
    </div>
  ) : null;

// ---------------------------------------------------------------- o painel do retrato

const Panel: React.FC<{ p: PanelBox; lang: Lang; pressed: string | null; o: number }> = ({ p, lang, pressed, o }) => {
  const cardPressed = (c: CardBox, i: number) => pressed === `dim.${c.dim}` || pressed === `card${i}`;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      {p.firstStep ? <FirstStepView f={p.firstStep} pressed={pressed === 'firstStep' || pressed === 'firstStep.cta'} /> : null}
      <Hex hx={p.hex} idKey={p.key} />
      {p.hex.caption ? (
        <div style={{ position: 'absolute', left: 0, width: DEVICE.w, top: p.hex.caption.y, textAlign: 'center', ...textStyle(12, 700, p.hex.caption.h, p.accent, { letterSpacing: 0.3 }) }}>
          {p.hex.caption.text}
        </div>
      ) : null}
      {p.toggle.rim ? <PillView r={p.toggle.rim.rect} icon={p.toggle.rim.icon} label={p.toggle.rim.label} accent={p.accent} /> : null}
      <PillView r={p.toggle.grain.rect} icon={p.toggle.grain.icon} label={p.toggle.grain.label} accent={p.accent} />
      <Legend p={p} />
      <PeriodView p={p} />
      {p.note ? (
        <div style={at(p.note.rect, { padding: '0 8px' })}>
          {p.note.lines.map((l, i) => (
            <div key={i} style={{ textAlign: 'center', ...textStyle(11.5, 500, 16, C.text.mid) }}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
      {p.cards.map((c, i) => (
        <Card key={c.dim} c={c} lang={lang} pressed={cardPressed(c, i)} />
      ))}
      <Actions p={p} pressed={pressed} />
    </div>
  );
};

// ---------------------------------------------------------------- a tela inteira

export const MeScreen: React.FC<{ s: MeState; v: MeView; L: MeLayout; ctx: MeCtx; pressed: string | null }> = ({ s, L, ctx, pressed }) => {
  const { lang } = ctx;
  const d = L.d;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: d.w, height: d.h, overflow: 'hidden', background: C.bg.deep }}>
      <StatusBar d={d} />
      <div
        style={at(
          { x: 0, y: d.statusBar, w: d.w, h: d.h - d.statusBar },
          { overflow: 'hidden', background: vGrad(C.gradient.screenAmbient, C.gradient.screenAmbientLocations) },
        )}
      >
        <div style={{ position: 'absolute', left: 0, top: -L.scroll, width: d.w, height: L.contentH }}>
          <Hero L={L} ctx={ctx} pressed={pressed} />
          <div style={at(L.info, { display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pressed === 'info' ? 0.6 : 1 })}>
            <Ion name="information-circle-outline" size={24} color={C.text.mid} />
          </div>
          <Tabs L={L} active={s.pillar} lang={lang} pressed={pressed} />
          <Panel p={L.panel} lang={lang} pressed={pressed} o={L.panelO} />
        </div>
      </div>
      <BottomNav d={d} lang={lang} active="character" locked={ctx.fx.lockedTabs} />
      <GestureBar d={d} />
    </div>
  );
};

// ---------------------------------------------------------------- animação + módulo

/** A troca de retrato: o painel velho apaga nisto, e só então o novo acende (nunca dois textos
 *  juntos; no app a troca é imediata — o conteúdo da ScrollView é trocado). */
const PANEL_OUT = 5;
const PANEL_IN = 7;
/** DimensionPillarCard: LinearTransition.duration(220) ≈ 7 quadros, linear */
const EXPAND = 7;
const SCROLL_FRAMES = 22;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

const scrollShownAt = (h: Snap<MeState>[], f: number) => {
  const scr = lastChange(h, f, (s) => s.scroll);
  if (scr.at === HISTORY_START) return scr.to;
  const m = stateAt(h, scr.at).scrollMotion;
  if (m === 'instant') return scr.to;
  const e = m ? swipeProgress(f - scr.at, m) : SCROLL_EASE(clamp01((f - scr.at) / SCROLL_FRAMES));
  return scr.from + (scr.to - scr.from) * e;
};

const expandAt = (h: Snap<MeState>[], f: number): Record<DimId, number> => {
  const pc = lastChange(h, f, (s) => s.pillar);
  return Object.fromEntries(
    DIM_ORDER.map((dim) => {
      const ch = lastChange(h, f, (s) => s.expanded.includes(dim));
      // a troca de retrato remonta o painel: fechado na hora, sem animar
      if (ch.at === HISTORY_START || ch.at === pc.at) return [dim, ch.to ? 1 : 0];
      const t = clamp01((f - ch.at) / EXPAND);
      return [dim, ch.to ? t : 1 - t];
    }),
  ) as Record<DimId, number>;
};

export const viewMe = (h: Snap<MeState>[], f: number): MeView => {
  const pc = lastChange(h, f, (s) => s.pillar);
  const age = f - pc.at;
  let panel = pc.to;
  let panelO = 1;
  let live = true;
  if (pc.at !== HISTORY_START && age < PANEL_OUT + PANEL_IN) {
    if (age < PANEL_OUT) {
      panel = pc.from;
      panelO = 1 - age / PANEL_OUT;
      live = false;
    } else panelO = (age - PANEL_OUT) / PANEL_IN;
  }
  return { scroll: scrollShownAt(h, f), panel, panelO, live, expand: expandAt(h, f) };
};

export const ME_SCREEN: ScreenModule<MeState, MeView, MeLayout, MeCtx> = {
  id: 'me',
  device: DEVICE,
  makeCtx: ({ fixture, lang }) => ({ fx: meFixture(fixture), lang, d: DEVICE }),
  initial: (ctx, patch) => initialMe(ctx.fx, patch),
  tap: tapMe,
  scrollFor: scrollForMe,
  controls: TARGETS.me.controls,
  view: viewMe,
  layout: (s, v, ctx, h, f) => {
    if (!v.live) {
      // o painel que sai é desenhado como estava antes do toque (aberto, se estava aberto)
      const pc = lastChange(h, f, (x) => x.pillar);
      const before = stateAt(h, pc.at - 1);
      return layoutMe({ ...before, scroll: s.scroll }, ctx, { scrollShown: v.scroll, panel: before.pillar, panelO: v.panelO, live: false, expand: expandAt(h, pc.at - 1) });
    }
    return layoutMe(s, ctx, { scrollShown: v.scroll, panel: v.panel, panelO: v.panelO, live: true, expand: v.expand });
  },
  Render: MeScreen,
};
