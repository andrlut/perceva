// Cenas do molde genérico. Cada uma é um "arquétipo" montado a partir das
// props do roteiro (peças do elenco + frases de deixa) — nenhuma conhece a
// ideia que está contando. Regras de tela (valem pra cena nova também):
//  - nada pequeno: pessoa ≥ 150 px, peça ≥ 180 px, texto ≥ 38 px;
//  - nenhum número nem dado de pesquisa na tela (o lint barra no roteiro);
//  - a legenda mora em captionTop (1440): o palco vai de ~280 a ~1380.
import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { fadeUp, ramp } from '../components';
import { Brilho, Pensamento, Pessoa, Relogio, Semana, Sofa } from '../elenco/cast';
import { C, DimId, FONT, dimColor } from '../theme';
import { Scene, cue, speechEnd } from '../timeline';
import { Ion, Peca } from './Peca';
import type { Chip, MoldeLine, MoldeSpec, Mood, Panel } from './spec';

export type MS = Scene & Pick<MoldeLine, 'scene' | 'props'>;
type P = { s: MS };

export const SpecContext = createContext<MoldeSpec | null>(null);
const useSpec = () => {
  const spec = useContext(SpecContext);
  if (!spec) throw new Error('SpecContext vazio');
  return spec;
};
const useAccent = () => dimColor(useSpec().dimension);
/** Cor do ajudante: Ofício (teal), ou Vínculos quando a ideia já é de Ofício. */
const helperColor = (d: DimId) => dimColor(d === 'craft' ? 'bonds' : 'craft');

const SKINS = ['#F2C9A0', '#C68B5E', '#8D5A3B', '#E0AC7E', '#5C3A24', '#F5D5B8'];

const useSpr = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, config: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
    spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 120, mass: 1, ...config } });
};

/** Frame da deixa, ou `fallback` quando a cena não deu deixa. */
const at = (s: MS, phrase: string | undefined, fallback: number) => (phrase ? cue(s, phrase) : fallback);

const Kicker: React.FC<{ text?: string; top?: number }> = ({ text, top = 200 }) => {
  const frame = useCurrentFrame();
  const accent = useAccent();
  if (!text) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 80,
        right: 80,
        textAlign: 'center',
        fontFamily: FONT.body,
        fontWeight: 800,
        fontSize: 32,
        letterSpacing: 7,
        color: accent,
        ...fadeUp(frame, 0, 12, 16),
      }}
    >
      {text.toUpperCase()}
    </div>
  );
};

/** Peça que cai do alto quando a fala chega na deixa (e some na `out`, se houver). */
const Drop: React.FC<{ s: MS; p: string; cueAt?: string; out?: string; top: number; left: number; size: number; delay?: number }> = ({
  s,
  p,
  cueAt,
  out,
  top,
  left,
  size,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const accent = useAccent();
  const t = spr(at(s, cueAt, s.lead + delay), { damping: 11, stiffness: 140 });
  const gone = out ? spr(cue(s, out), { damping: 20, stiffness: 80 }) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        opacity: Math.min(1, t * 2) * (1 - gone),
        transform: `translateY(${(1 - t) * -120 - gone * 160}px) scale(${1 - 0.3 * gone})`,
      }}
    >
      <Peca name={p} t={frame} size={size} accent={accent} />
    </div>
  );
};

/** Relógio que corre, fica calmo, ou desacelera na virada. */
const Clock: React.FC<{ s: MS; mode?: 'rapido' | 'calmo' | 'acalma'; turnAt: number; top: number; left: number; size?: number }> = ({
  s,
  mode,
  turnAt,
  top,
  left,
  size = 220,
}) => {
  const frame = useCurrentFrame();
  const accent = useAccent();
  if (!mode) return null;
  const speed =
    mode === 'rapido'
      ? 6
      : mode === 'calmo'
        ? 0.6
        : interpolate(frame, [turnAt - 4, turnAt + 18], [6, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const calm = mode === 'calmo' || (mode === 'acalma' && frame >= turnAt);
  return (
    <div style={{ position: 'absolute', top, left, opacity: ramp(frame, Math.max(0, s.lead - 6), 10) }}>
      <Relogio t={frame} size={size} speed={speed} accent={calm ? accent : C.violet2} />
    </div>
  );
};

// ===================================================================== pessoa
const SLOTS = [
  { top: 700, left: 110 },
  { top: 980, left: 730 },
  { top: 1130, left: 90 },
  { top: 640, left: 760 },
];
/** A pessoa no centro, com o humor da fala; as peças caem em volta nas deixas. */
export const Pessoa_: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const pr = s.props ?? {};
  const turnAt = at(s, pr.turn, 1e9);
  const turned = frame >= turnAt;
  const mood: Mood = turned ? (pr.to ?? 'feliz') : (pr.mood ?? 'ok');
  // virada pra pior (ex.: "e nada muda") não levanta os braços nem brilha
  const positive = (pr.to ?? 'feliz') === 'feliz';
  const me = spr(0, { damping: 16 });
  return (
    <AbsoluteFill>
      <Kicker text={pr.kicker} />
      <Clock s={s} mode={pr.clock} turnAt={turnAt} top={330} left={640} size={230} />
      <div style={{ position: 'absolute', top: 640, left: 380, opacity: me, transform: `scale(${0.85 + 0.15 * me})` }}>
        <Pessoa t={frame} size={320} mood={mood} arms={turned && positive ? 'up' : (pr.arms ?? 'down')} sweat={pr.sweat && !turned} accent={C.violet} />
      </div>
      {pr.glow || (pr.turn && positive) ? (
        <div style={{ position: 'absolute', top: 600, left: 340 }}>
          <Brilho t={frame} size={400} on={ramp(frame, at(s, pr.glow ?? pr.turn, 1e9), 10)} />
        </div>
      ) : null}
      {(pr.objects ?? []).slice(0, 4).map((o, i) => (
        <Drop key={i} s={s} p={o.p} cueAt={o.cue} out={o.out} {...SLOTS[i]} size={i % 2 ? 250 : 280} delay={4 + i * 8} />
      ))}
    </AbsoluteFill>
  );
};

// ===================================================================== semana
/** A semana enchendo e o relógio disparando — pressa, rotina, acúmulo. */
export const Semana_: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const accent = useAccent();
  const pr = s.props ?? {};
  const a = at(s, pr.from, s.lead);
  const b = at(s, pr.until, speechEnd(s) - 10);
  const fill = ramp(frame, a, Math.max(10, b - a + 10));
  const speed = interpolate(frame, [a, b + 10], [1.5, 9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const week = spr(s.lead - 4, { damping: 16 });
  return (
    <AbsoluteFill>
      <Kicker text={pr.kicker} />
      <div style={{ position: 'absolute', top: 320, left: 110, opacity: week, transform: `translateY(${(1 - week) * 30}px)` }}>
        <Semana width={860} fill={fill} accent={accent} />
      </div>
      <div style={{ position: 'absolute', top: 820, left: 150, opacity: week }}>
        <Relogio t={frame} size={230} speed={speed} accent={C.violet2} />
      </div>
      <div style={{ position: 'absolute', top: 760, left: 500 }}>
        <Pessoa t={frame * (1 + fill)} size={300} mood={pr.mood ?? 'cansado'} arms="down" sweat={frame >= b - 6} accent={C.violet} />
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== virada
/**
 * A mudança: a pessoa passa a peça adiante (pro ajudante, ou ela some), o
 * relógio acalma e o humor vira na deixa `turn`.
 */
export const Virada: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const spec = useSpec();
  const accent = useAccent();
  const pr = s.props ?? {};
  const aGive = at(s, pr.from, s.lead + 6);
  const aTurn = at(s, pr.turn, speechEnd(s) - 20);
  const pass = spr(aGive + 6, { damping: 18, stiffness: 80 });
  const helper = pr.helper ? spr(aGive, { damping: 14 }) : 0;
  const happy = frame >= aTurn;
  const sweep = pr.helper && frame >= aGive + 18 ? Math.sin(frame / 4) * 14 : 0;
  const hc = helperColor(spec.dimension);
  return (
    <AbsoluteFill>
      <Kicker text={pr.kicker} />
      <Clock s={s} mode={pr.clock} turnAt={aTurn} top={300} left={190} size={200} />
      <div style={{ position: 'absolute', top: 600, left: pr.helper ? 90 : 380 }}>
        <Pessoa
          t={frame}
          size={300}
          mood={happy ? (pr.to ?? 'feliz') : (pr.mood ?? 'cansado')}
          arms={happy ? 'up' : frame >= aGive ? 'out' : 'down'}
          accent={C.violet}
        />
      </div>
      <div style={{ position: 'absolute', top: 560, left: pr.helper ? 50 : 340 }}>
        <Brilho t={frame} size={380} on={ramp(frame, aTurn, 10)} />
      </div>
      {pr.helper ? (
        <div style={{ position: 'absolute', top: 600, left: 620, opacity: helper, transform: `translateX(${(1 - helper) * 200}px)` }}>
          <Pessoa t={frame} size={300} seed={4} arms={pass > 0.5 ? 'out' : 'down'} mood="ok" accent={hc} skin="#8D5A3B" cap={accent} />
        </div>
      ) : null}
      {pr.gives ? (
        <div
          style={{
            position: 'absolute',
            top: 640,
            left: pr.helper ? interpolate(pass, [0, 1], [330, 840]) : 640 + pass * 300,
            opacity: pr.helper ? 1 : 1 - pass,
            transform: pr.helper ? `rotate(${sweep}deg)` : `translateY(${-pass * 200}px) rotate(${pass * 40}deg)`,
            transformOrigin: '50% 10%',
          }}
        >
          <Peca name={pr.gives} t={frame} size={260} accent={accent} />
        </div>
      ) : null}
      {(pr.objects ?? []).slice(0, 2).map((o, i) => (
        <Drop key={i} s={s} p={o.p} cueAt={o.cue} out={o.out} top={1060} left={i ? 640 : 200} size={240} />
      ))}
    </AbsoluteFill>
  );
};

// ===================================================================== multidao
const LIT = { poucos: [2, 8, 11, 17, 5], metade: [0, 2, 5, 7, 8, 11, 13, 14, 17, 19], muitos: [0, 1, 2, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 18, 19] };
/** "Pouca gente / metade / quase todo mundo": vinte pessoas grandes, sem número. */
export const Multidao: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const accent = useAccent();
  const pr = s.props ?? {};
  const on = LIT[pr.lit ?? 'poucos'];
  const lit = Math.round(on.length * ramp(frame, at(s, pr.at, s.lead + 10), 22));
  return (
    <AbsoluteFill>
      <Kicker text={pr.kicker} />
      <div style={{ position: 'absolute', top: 330, left: 70, width: 940, display: 'flex', flexWrap: 'wrap', rowGap: 18 }}>
        {Array.from({ length: 20 }, (_, i) => {
          const isOn = on.slice(0, lit).includes(i);
          const t = spr(i * 1.2, { damping: 13 });
          return (
            <div key={i} style={{ width: 188, display: 'flex', justifyContent: 'center', opacity: t, transform: `translateY(${(1 - t) * 30}px) scale(${isOn ? 1.06 : 1})` }}>
              <Pessoa t={frame} size={150} seed={i} skin={SKINS[(i * 7) % SKINS.length]} accent={isOn ? accent : C.surface3} mood={isOn ? 'feliz' : 'ok'} arms={isOn ? 'up' : 'none'} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== comparar
const Pill: React.FC<{ p?: string; text: string; from: number }> = ({ p, text, from }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        padding: p ? '4px 22px 4px 8px' : '8px 22px',
        borderRadius: 999,
        background: C.base,
        border: `2px solid ${C.borderStrong}`,
        fontFamily: FONT.body,
        fontWeight: 800,
        fontSize: 30,
        color: C.gold2,
        opacity: ramp(frame, from, 12),
      }}
    >
      {p ? <Peca name={p} t={8} size={50} /> : null}
      {text}
    </div>
  );
};

const PanelBox: React.FC<{ s: MS; x: number; from: number; win: number; lose: number; panel: Panel; seed: number; pill?: { p?: string; text: string } }> = ({
  s,
  x,
  from,
  win,
  lose,
  panel,
  seed,
  pill,
}) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const accent = useAccent();
  const t = spr(from, { damping: 15 });
  const arrive = spr(at(s, panel.arrives, from + 8), { damping: 12 });
  const leave = panel.leaves ? spr(cue(s, panel.leaves) + 6, { damping: 20, stiffness: 70 }) : 0;
  const mood: Mood = win > 0.5 ? 'feliz' : (panel.mood ?? 'ok');
  return (
    <div
      style={{
        position: 'absolute',
        top: 330,
        left: x,
        width: 450,
        height: 640,
        borderRadius: 34,
        background: `linear-gradient(160deg, ${C.surface2} 0%, ${C.base} 100%)`,
        border: `3px solid ${win > 0 ? `${accent}${Math.round((0.25 + 0.75 * win) * 255).toString(16).padStart(2, '0')}` : C.borderStrong}`,
        boxShadow: `0 0 ${80 * win}px ${accent}55`,
        overflow: 'hidden',
        opacity: t * (1 - 0.2 * lose),
        transform: `translateY(${(1 - t) * 40}px) scale(${1 + 0.03 * win})`,
      }}
    >
      <div style={{ position: 'absolute', top: 150, left: 50 }}>
        <Pessoa t={frame} size={230} seed={seed} arms={win > 0.5 ? 'up' : 'down'} mood={mood} accent={seed ? C.violet2 : C.violet} skin={seed ? '#8D5A3B' : '#F2C9A0'} />
      </div>
      {panel.object ? (
        <div
          style={{
            position: 'absolute',
            top: 210,
            left: 250,
            opacity: arrive * (1 - leave),
            transform: `translate(${leave * 240}px, ${-leave * 120}px) rotate(${leave * 40}deg) scale(${0.6 + 0.4 * arrive})`,
          }}
        >
          <Peca name={panel.object} t={frame} size={190} accent={accent} />
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: 470, left: 20, right: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 44, lineHeight: 1.1, color: C.hi }}>{panel.label}</div>
        {pill ? <Pill p={pill.p} text={pill.text} from={from + 12} /> : null}
      </div>
    </div>
  );
};

const Chips: React.FC<{ s: MS; chips: Chip[]; top: number; left: number; width: number; size?: number }> = ({ s, chips, top, left, width, size = 38 }) => {
  const spr = useSpr();
  const accent = useAccent();
  return (
    <div style={{ position: 'absolute', top, left, width, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {chips.map((c) => {
        const t = spr(cue(s, c.cue), { damping: 14, stiffness: 150 });
        return (
          <div
            key={c.text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '18px 28px',
              borderRadius: 24,
              background: C.surface,
              border: `2px solid ${accent}55`,
              opacity: t,
              transform: `translateX(${(1 - t) * -30}px)`,
            }}
          >
            <Ion name={c.icon} size={size * 1.25} color={accent} />
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: size, lineHeight: 1.15, color: C.hi }}>{c.text}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Lado a lado: dois caminhos, um ganha destaque na deixa `win` (o outro só apaga um pouco). */
export const Comparar: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const pr = s.props ?? {};
  const w = ramp(frame, at(s, pr.win, 1e9), 16);
  const winL = pr.winner === 'left' ? w : 0;
  const winR = pr.winner === 'right' ? w : 0;
  return (
    <AbsoluteFill>
      <Kicker text={pr.kicker} />
      {/* a protagonista fica no lado que ganha ("você"); o outro lado é outra pessoa */}
      <PanelBox s={s} x={70} from={s.lead - 4} win={winL} lose={winR} panel={pr.left!} seed={pr.winner === 'right' ? 3 : 0} pill={pr.pill} />
      <PanelBox s={s} x={560} from={s.lead + 4} win={winR} lose={winL} panel={pr.right!} seed={pr.winner === 'right' ? 0 : 3} pill={pr.pill} />
      {pr.chips?.length ? <Chips s={s} chips={pr.chips} top={1010} left={pr.winner === 'right' ? 560 : 70} width={450} /> : null}
    </AbsoluteFill>
  );
};

// ===================================================================== lista
/** Uma pessoa e até 3 itens grandes que entram nas deixas (passos, sinais, opções). */
export const Lista: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const pr = s.props ?? {};
  const me = spr(0, { damping: 16 });
  const last = pr.items?.length ? cue(s, pr.items[pr.items.length - 1].cue) : 1e9;
  return (
    <AbsoluteFill>
      <Kicker text={pr.kicker} />
      <div style={{ position: 'absolute', top: 280, left: 360, opacity: me }}>
        <Pessoa t={frame} size={340} mood={frame >= last ? (pr.to ?? pr.mood ?? 'ok') : (pr.mood ?? 'ok')} arms={pr.arms ?? 'down'} accent={C.violet} />
      </div>
      <Chips s={s} chips={(pr.items ?? []).slice(0, 3)} top={790} left={90} width={900} size={64} />
    </AbsoluteFill>
  );
};

// ===================================================================== cena
/** A ideia aplicada: a pessoa num lugar (sofá, mesa, cama, chão) com uma peça na mão. */
export const Cena: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const spec = useSpec();
  const accent = useAccent();
  const pr = s.props ?? {};
  const setting = pr.setting ?? 'chao';
  const enter = spr(s.lead - 4, { damping: 16 });
  const helper = pr.helper ? spr(at(s, pr.from, s.lead + 10), { damping: 14 }) : 0;
  const walk = Math.sin(frame / 18);
  const mood = pr.mood ?? 'feliz';
  // a ação acontece ao longo da fala (caderno sendo escrito, tela acendendo)
  const work = ramp(frame, at(s, pr.glow, s.lead), Math.max(20, speechEnd(s) - at(s, pr.glow, s.lead)));
  const held = pr.holding ? (
    setting === 'sofa' ? (
      <div style={{ position: 'absolute', top: 160, left: 55, transform: 'rotate(-6deg)' }}>
        <Peca name={pr.holding} t={frame} size={150} accent={accent} progress={work} />
      </div>
    ) : (
      <div style={{ position: 'absolute', top: 150, left: 222, transform: 'rotate(8deg)' }}>
        <Peca name={pr.holding} t={frame} size={150} accent={accent} progress={work} />
      </div>
    )
  ) : null;
  const person = (
    <div style={{ position: 'relative' }}>
      <Pessoa t={frame} size={260} mood={mood} arms={pr.arms ?? (setting === 'sofa' ? 'none' : 'out')} accent={C.violet} />
      {held}
    </div>
  );
  return (
    <AbsoluteFill>
      <Kicker text={pr.kicker} />
      <div style={{ position: 'absolute', top: 1180, left: 60, right: 60, height: 6, borderRadius: 3, background: C.surface2 }} />
      {pr.helper ? (
        <div style={{ position: 'absolute', top: 880, left: 770 + walk * 50, opacity: helper, transform: `translateY(${(1 - helper) * 40}px)` }}>
          <Pessoa t={frame} size={230} seed={4} arms="out" mood="ok" accent={helperColor(spec.dimension)} skin="#8D5A3B" cap={accent} />
          {pr.gives ? (
            <div style={{ position: 'absolute', top: 40, left: 170, transform: `rotate(${Math.sin(frame / 4) * 16}deg)`, transformOrigin: '50% 10%' }}>
              <Peca name={pr.gives} t={frame} size={240} accent={accent} />
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: enter, transform: `translateY(${(1 - enter) * 30}px)` }}>
        {setting === 'sofa' ? (
          <div style={{ position: 'absolute', top: 820, left: 90 }}>
            <Sofa width={640} seatTop={-150}>
              <div style={{ position: 'relative', left: 170 }}>{person}</div>
            </Sofa>
          </div>
        ) : setting === 'mesa' ? (
          <>
            <div style={{ position: 'absolute', top: 740, left: 270 }}>
              <Pessoa t={frame} size={300} mood={mood} arms="out" accent={C.violet} />
            </div>
            <div style={{ position: 'absolute', top: 1010, left: 160, width: 760, height: 40, borderRadius: 16, background: C.surface3 }} />
            <div style={{ position: 'absolute', top: 1050, left: 220, width: 26, height: 130, borderRadius: 8, background: C.surface2 }} />
            <div style={{ position: 'absolute', top: 1050, left: 834, width: 26, height: 130, borderRadius: 8, background: C.surface2 }} />
            {pr.holding ? (
              <div style={{ position: 'absolute', top: 1010, left: 600, transform: 'translateY(-100%)' }}>
                <Peca name={pr.holding} t={frame} size={240} accent={accent} progress={work} />
              </div>
            ) : null}
          </>
        ) : setting === 'cama' ? (
          <>
            <div style={{ position: 'absolute', top: 870, left: 120 }}>
              <Peca name="cama" t={frame} size={560} accent={accent} />
            </div>
            <div style={{ position: 'absolute', top: 740, left: 700 }}>{person}</div>
          </>
        ) : (
          <div style={{ position: 'absolute', top: 1180 - 338, left: 300, transform: 'scale(1.35)', transformOrigin: '50% 100%' }}>{person}</div>
        )}
      </div>
      {(pr.objects ?? []).slice(0, 2).map((o, i) => (
        <Drop key={i} s={s} p={o.p} cueAt={o.cue} out={o.out} top={420} left={i ? 640 : 200} size={240} />
      ))}
      <div style={{ position: 'absolute', top: 700, left: setting === 'cama' ? 620 : 120 }}>
        <Brilho t={frame} size={420} on={ramp(frame, at(s, pr.glow, 1e9), 10)} />
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== pensa
/** A pessoa pensando: o balão abre na deixa com a peça dentro. */
export const Pensa: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const accent = useAccent();
  const pr = s.props ?? {};
  const a = at(s, pr.at, s.lead + 4);
  const turnAt = at(s, pr.turn, 1e9);
  const pop = ramp(frame, a + 14, 10);
  return (
    <AbsoluteFill>
      <Kicker text={pr.kicker} />
      <div style={{ position: 'absolute', top: 820, left: 140 }}>
        <Pessoa t={frame} size={320} mood={frame >= turnAt ? (pr.to ?? 'feliz') : (pr.mood ?? 'ok')} arms={pr.arms ?? 'none'} accent={C.violet} />
      </div>
      <div style={{ position: 'absolute', top: 330, left: 300 }}>
        <Pensamento t={Math.max(0, frame - a)} size={680} />
      </div>
      {pr.thought ? (
        <div style={{ position: 'absolute', top: 455, left: 560, opacity: pop, transform: `scale(${0.6 + 0.4 * pop})` }}>
          <Peca name={pr.thought} t={frame} size={220} accent={accent} />
        </div>
      ) : null}
      {(pr.objects ?? []).slice(0, 2).map((o, i) => (
        <Drop key={i} s={s} p={o.p} cueAt={o.cue} out={o.out} top={1000} left={i ? 760 : 560} size={220} />
      ))}
    </AbsoluteFill>
  );
};

// ===================================================================== verso
const IdeaCard: React.FC<{ width: number; flip: number; absorbed: boolean }> = ({ width, flip, absorbed }) => {
  const spec = useSpec();
  const accent = useAccent();
  const height = width * 1.25;
  const face: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 36,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    border: `3px solid ${absorbed ? C.gold : `${accent}AA`}`,
    boxShadow: absorbed ? `0 0 70px ${C.gold}66` : '0 30px 90px rgba(0,0,0,0.5)',
  };
  const len = spec.claim.length;
  const claimSize = width * (len > 120 ? 0.066 : len > 95 ? 0.072 : 0.078);
  return (
    <div style={{ width, height, perspective: 2200 }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateY(${flip * 180}deg)` }}>
        <div style={{ ...face, background: `linear-gradient(160deg, ${C.surface2} 0%, ${C.base} 100%)` }}>
          {spec.image ? <Img src={staticFile(spec.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,14,38,0.94) 0%, rgba(10,14,38,0.55) 30%, rgba(10,14,38,0) 55%)' }} />
          <div style={{ position: 'absolute', left: width * 0.07, right: width * 0.07, top: width * 0.07 }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: width * 0.078, lineHeight: 1.1, color: C.hi }}>{spec.title}</div>
          </div>
        </div>
        <div
          style={{
            ...face,
            transform: 'rotateY(180deg)',
            background: `linear-gradient(160deg, ${C.surface2} 0%, ${C.base} 100%)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: width * 0.09,
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: accent }} />
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: claimSize, lineHeight: 1.18, color: C.hi }}>{spec.claim}</div>
        </div>
      </div>
    </div>
  );
};

const VERSO = {
  pt: { kicker: 'O que fazer com isso', done: 'IDEIA ABSORVIDA' },
  en: { kicker: 'What to do with it', done: 'IDEA ABSORBED' },
};

/** O card vira e a voz lê o verso, palavra por palavra. Sempre a última cena. */
export const Verso: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spec = useSpec();
  const flip = interpolate(frame, [s.lead - 14, s.lead + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const absorbed = frame > speechEnd(s) + 6;
  const L = VERSO[spec.lang];
  return (
    <AbsoluteFill>
      <Kicker text={s.props?.kicker ?? L.kicker} />
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <IdeaCard width={720} flip={flip} absorbed={absorbed} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1250,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: 5,
          color: C.gold,
          opacity: absorbed ? ramp(frame, speechEnd(s) + 6, 12) : 0,
        }}
      >
        {L.done}
      </div>
    </AbsoluteFill>
  );
};

export const MOLDE_SCENES: Record<MoldeLine['scene'], React.FC<P>> = {
  pessoa: Pessoa_,
  semana: Semana_,
  virada: Virada,
  multidao: Multidao,
  comparar: Comparar,
  lista: Lista,
  cena: Cena,
  pensa: Pensa,
  verso: Verso,
};
