// Cenas do molde genérico. Cada uma é um "arquétipo" montado a partir das
// props do roteiro (peças do elenco + frases de deixa) — nenhuma conhece a
// ideia que está contando. Regras de tela (valem pra cena nova também):
//  - nada pequeno: pessoa ≥ 150 px, peça ≥ 180 px (≥ 120 px nos encaixes de
//    um ambiente cheio), texto ≥ 38 px;
//  - nenhum número nem dado de pesquisa na tela (o lint barra no roteiro);
//  - a legenda mora em captionTop (1440): o palco vai de ~280 a ~1380.
//
// Toda cena desenha dentro de <Stage>: é ele que põe o ambiente atrás
// (props.ambiente), move a câmera (props.camera) e desenha a sobrancelha.
// Sem essas props, o Stage não faz nada além da sobrancelha — a cena sai
// igual à de antes. Quem desenha a cena só declara a geometria (onde estão os
// pés da protagonista, a faixa que ela ocupa, o que a câmera pode focar).
import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Img, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { fadeUp, ramp } from '../components';
import { Brilho, Pensamento, Pessoa, Relogio, Semana, Sofa } from '../elenco/cast';
import { Caneca, Caneta, Planta } from '../elenco/objetos';
import { C, DimId, FONT, dimColor } from '../theme';
import { Scene, cue, speechEnd } from '../timeline';
import { Abajur, AmbSpec, Ambiente, AmbienteMini, EnvGeo, Spot, Vinheta } from './ambientes';
import { CameraRig, FocusMap, Layer, cameraAt, focusPoint } from './camera';
import { Ion, Peca } from './Peca';
import type { Bloco, Chip, Feel, MoldeLine, MoldeSpec, Mood, Obj, Panel } from './spec';

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

// ===================================================================== palco
/** A cena tem ambiente? (o roteiro pediu e a cena sabe onde a pessoa pisa) */
const ambOf = (s: MS): AmbSpec | null => {
  const pr = s.props ?? {};
  return pr.ambiente ? { tipo: pr.ambiente, gente: pr.gente, hora: pr.hora } : null;
};

/**
 * Palco de toda cena: ambiente (fundo, meio, foco de luz, primeiro plano),
 * câmera com parallax e a sobrancelha por cima de tudo.
 */
const Stage: React.FC<{ s: MS; geo?: EnvGeo; focus?: FocusMap; kicker?: string; children: React.ReactNode }> = ({ s, geo, focus = {}, kicker, children }) => {
  const frame = useCurrentFrame();
  const accent = useAccent();
  const pr = s.props ?? {};
  const amb = geo ? ambOf(s) : null;
  const map: FocusMap = { ...focus, pessoa: focus.pessoa ?? (geo ? [geo.spot[0], geo.spot[1]] : undefined) };
  const cueAt = pr.camera?.cue ? cue(s, pr.camera.cue) : null;
  const cam = cameraAt(frame, s.frames, pr.camera, cueAt, focusPoint(pr.camera?.focus, map));
  const kick = <Kicker text={kicker ?? pr.kicker} />;
  return (
    <CameraRig cam={cam}>
      <AbsoluteFill>
        {/* sem ambiente, a sobrancelha fica por baixo como sempre foi (o vídeo antigo sai idêntico) */}
        {amb ? null : kick}
        {amb && geo ? (
          <>
            <Layer depth={0.3}>
              <Ambiente amb={amb} geo={geo} part="back" t={frame} accent={accent} />
            </Layer>
            <Layer depth={0.62}>
              <Ambiente amb={amb} geo={geo} part="mid" t={frame} accent={accent} />
            </Layer>
            <Layer depth={0.92}>
              <Spot geo={geo} accent={accent} />
            </Layer>
          </>
        ) : null}
        <Layer depth={1} style={amb ? { filter: 'drop-shadow(0 16px 34px rgba(5,7,26,0.6))' } : undefined}>
          {children}
        </Layer>
        {amb && geo ? (
          <>
            <Layer depth={1.35}>
              <Ambiente amb={amb} geo={geo} part="front" t={frame} accent={accent} />
            </Layer>
            <Vinheta />
          </>
        ) : null}
        {amb ? kick : null}
      </AbsoluteFill>
    </CameraRig>
  );
};

/**
 * Peça que cai do alto quando a fala chega na deixa (e some na `out`, se houver).
 * Num ambiente, ela "pousa" (queda curta, cresce um pouco). `base` = `top` é a
 * linha onde a peça se apoia (mesa, chão), não o topo dela.
 */
const Drop: React.FC<{ s: MS; p: string; cueAt?: string; out?: string; top: number; left: number; size: number; delay?: number; fall?: number; base?: boolean }> = ({
  s,
  p,
  cueAt,
  out,
  top,
  left,
  size,
  delay = 0,
  fall = 120,
  base = false,
}) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const accent = useAccent();
  const t = spr(at(s, cueAt, s.lead + delay), { damping: 11, stiffness: 140 });
  const gone = out ? spr(cue(s, out), { damping: 20, stiffness: 80 }) : 0;
  const land = fall < 120;
  const piece = <Peca name={p} t={frame} size={size} accent={accent} />;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        opacity: Math.min(1, t * 2) * (1 - gone),
        transform: `translateY(${(1 - t) * -fall - gone * 160}px) scale(${(land ? 0.7 + 0.3 * t : 1) * (1 - 0.3 * gone)})`,
        transformOrigin: land ? '50% 100%' : undefined,
      }}
    >
      {base ? <div style={{ transform: 'translateY(-100%)', display: 'flex', alignItems: 'flex-end' }}>{piece}</div> : piece}
    </div>
  );
};

/** Encaixe de peça: posição + tamanho; `base` = `top` é onde ela se apoia. */
type Slot = { top: number; left: number; size: number; base?: boolean };
const Drops: React.FC<{ s: MS; objects?: Obj[]; slots: Slot[]; fall?: number; stagger?: number }> = ({ s, objects = [], slots, fall, stagger = 8 }) => (
  <>
    {objects.slice(0, slots.length).map((o, i) => (
      <Drop key={i} s={s} p={o.p} cueAt={o.cue} out={o.out} {...slots[i]} delay={4 + i * stagger} fall={fall} />
    ))}
  </>
);

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
/** Num ambiente o 3º encaixe sobe (o canto de baixo é do primeiro plano). */
const SLOTS_AMB = [SLOTS[0], SLOTS[1], { top: 1040, left: 90 }, SLOTS[3]];
/** A pessoa no centro, com o humor da fala; as peças caem em volta nas deixas. */
export const Pessoa_: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const pr = s.props ?? {};
  const amb = !!pr.ambiente;
  const turnAt = at(s, pr.turn, 1e9);
  const turned = frame >= turnAt;
  const mood: Mood = turned ? (pr.to ?? 'feliz') : (pr.mood ?? 'ok');
  // virada pra pior (ex.: "e nada muda") não levanta os braços nem brilha
  const positive = (pr.to ?? 'feliz') === 'feliz';
  const me = spr(0, { damping: 16 });
  const slots = (amb ? SLOTS_AMB : SLOTS).map((sl, i) => ({ ...sl, size: i % 2 ? 250 : 280 }));
  const geo: EnvGeo = { ground: 1043, clear: [360, 720], spot: [540, 830, 380], frontOff: (pr.objects?.length ?? 0) >= 3 ? ['left'] : [] };
  return (
    <Stage s={s} geo={geo} focus={{ peca: [slots[0].left + 140, slots[0].top + 140] }}>
      <Clock s={s} mode={pr.clock} turnAt={turnAt} top={330} left={640} size={230} />
      <div style={{ position: 'absolute', top: 640, left: 380, opacity: me, transform: `scale(${0.85 + 0.15 * me})` }}>
        <Pessoa t={frame} size={320} mood={mood} arms={turned && positive ? 'up' : (pr.arms ?? 'down')} sweat={pr.sweat && !turned} accent={C.violet} />
      </div>
      {pr.glow || (pr.turn && positive) ? (
        <div style={{ position: 'absolute', top: 600, left: 340 }}>
          <Brilho t={frame} size={400} on={ramp(frame, at(s, pr.glow ?? pr.turn, 1e9), 10)} />
        </div>
      ) : null}
      <Drops s={s} objects={pr.objects} slots={slots} fall={amb ? 50 : 120} />
    </Stage>
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
  const geo: EnvGeo = { ground: 1140, clear: [480, 820], spot: [650, 950, 360] };
  return (
    <Stage s={s} geo={geo} focus={{ peca: [540, 500] }}>
      <div style={{ position: 'absolute', top: 320, left: 110, opacity: week, transform: `translateY(${(1 - week) * 30}px)` }}>
        <Semana width={860} fill={fill} accent={accent} />
      </div>
      <div style={{ position: 'absolute', top: 820, left: 150, opacity: week }}>
        <Relogio t={frame} size={230} speed={speed} accent={C.violet2} />
      </div>
      <div style={{ position: 'absolute', top: 760, left: 500 }}>
        <Pessoa t={frame * (1 + fill)} size={300} mood={pr.mood ?? 'cansado'} arms="down" sweat={frame >= b - 6} accent={C.violet} />
      </div>
    </Stage>
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
  const geo: EnvGeo = pr.helper ? { ground: 980, clear: [70, 960], spot: [500, 780, 480] } : { ground: 980, clear: [360, 720], spot: [530, 780, 380] };
  return (
    <Stage s={s} geo={geo} focus={{ pessoa: pr.helper ? [240, 790] : [530, 790], peca: pr.helper ? [900, 770] : [750, 860] }}>
      <Clock s={s} mode={pr.clock} turnAt={aTurn} top={300} left={190} size={200} />
      <div style={{ position: 'absolute', top: 600, left: pr.helper ? 90 : 380 }}>
        <Pessoa
          t={frame}
          size={300}
          mood={happy ? (pr.to ?? 'feliz') : (pr.mood ?? 'cansado')}
          // com `gives` ela já começa segurando a peça (braço estendido); sem, estende na entrega
          arms={happy ? 'up' : pr.gives || frame >= aGive ? 'out' : 'down'}
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
        // começa na mão dela (mão direita ≈ 200,170 da caixa → 382/672, 854) e vai pra mão do ajudante (≈ 912, 854)
        <div
          style={{
            position: 'absolute',
            top: pr.helper ? interpolate(pass, [0, 1], [733, 640]) : 733,
            left: pr.helper ? interpolate(pass, [0, 1], [327, 840]) : 617 + pass * 300,
            opacity: pr.helper ? 1 : 1 - pass,
            transform: pr.helper ? `rotate(${sweep}deg)` : `translateY(${-pass * 200}px) rotate(${pass * 40}deg)`,
            transformOrigin: '50% 10%',
          }}
        >
          <Peca name={pr.gives} t={frame} size={260} accent={accent} />
        </div>
      ) : null}
      <Drops
        s={s}
        objects={pr.objects}
        slots={[
          { top: 1060, left: 200, size: 240 },
          { top: 1060, left: 640, size: 240 },
        ]}
        stagger={0}
        fall={pr.ambiente ? 50 : 120}
      />
    </Stage>
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
    <Stage s={s} focus={{ pessoa: [540, 820] }}>
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
    </Stage>
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
      {panel.ambiente ? (
        // o lugar de cada caminho (a sala de aula × a mesa de casa), miniatura atrás da pessoa
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - 0.35 * lose }}>
          <AmbienteMini tipo={panel.ambiente} hora={panel.hora} t={frame} accent={accent} horizon={300} cx={225} scale={0.46} />
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: 140, left: 50 }}>
        <Pessoa t={frame} size={230} seed={seed} arms={win > 0.5 ? 'up' : 'down'} mood={mood} accent={seed ? C.violet2 : C.violet} skin={seed ? '#8D5A3B' : '#F2C9A0'} />
      </div>
      {panel.object ? (
        <div
          style={{
            position: 'absolute',
            top: 200,
            left: 250,
            opacity: arrive * (1 - leave),
            transform: `translate(${leave * 240}px, ${-leave * 120}px) rotate(${leave * 40}deg) scale(${0.6 + 0.4 * arrive})`,
            filter: panel.ambiente ? 'drop-shadow(0 10px 22px rgba(5,7,26,0.6))' : undefined,
          }}
        >
          <Peca name={panel.object} t={frame} size={190} accent={accent} />
        </div>
      ) : null}
      {/* rótulo de duas linhas + pílula cabem no painel (antes a pílula saía cortada embaixo) */}
      <div style={{ position: 'absolute', top: 455, left: 20, right: 20, textAlign: 'center' }}>
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
    <Stage s={s} focus={{ pessoa: pr.winner === 'right' ? [785, 650] : [295, 650], peca: pr.winner === 'right' ? [880, 600] : [390, 600] }}>
      {/* a protagonista fica no lado que ganha ("você"); o outro lado é outra pessoa */}
      <PanelBox s={s} x={70} from={s.lead - 4} win={winL} lose={winR} panel={pr.left!} seed={pr.winner === 'right' ? 3 : 0} pill={pr.pill} />
      <PanelBox s={s} x={560} from={s.lead + 4} win={winR} lose={winL} panel={pr.right!} seed={pr.winner === 'right' ? 0 : 3} pill={pr.pill} />
      {pr.chips?.length ? <Chips s={s} chips={pr.chips} top={1010} left={pr.winner === 'right' ? 560 : 70} width={450} /> : null}
    </Stage>
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
  const geo: EnvGeo = { ground: 712, clear: [340, 720], spot: [530, 510, 320] };
  return (
    <Stage s={s} geo={geo} focus={{ peca: [540, 1000] }}>
      <div style={{ position: 'absolute', top: 280, left: 360, opacity: me }}>
        <Pessoa t={frame} size={340} mood={frame >= last ? (pr.to ?? pr.mood ?? 'ok') : (pr.mood ?? 'ok')} arms={pr.arms ?? 'down'} accent={C.violet} />
      </div>
      <Chips s={s} chips={(pr.items ?? []).slice(0, 3)} top={790} left={90} width={900} size={64} />
    </Stage>
  );
};

// ===================================================================== cena
/** O que pode pousar na mesa / no chão num ambiente (o resto é símbolo e flutua). */
const ON_DESK = new Set(['caneca', 'copo', 'celular', 'livro', 'caderno', 'agenda', 'monitor', 'computador', 'papelada', 'envelope', 'planta', 'louca', 'relogio', 'lampada']);
const ON_FLOOR = new Set(['planta', 'cesto', 'vassoura', 'sacola', 'papelada', 'quadro', 'louca']);

/**
 * Peças da `cena`. Sem ambiente: os 2 encaixes de sempre, no alto. Com
 * ambiente: até 6 — o que é objeto de verdade POUSA (pontas da mesa ou chão,
 * dos lados), o que é símbolo (ícone, coração, moeda…) flutua no alto e a
 * meia altura. Os que sobram vão pro encaixe livre que restar.
 */
const cenaPlaced = (setting: string, amb: boolean, objects: Obj[]): { o: Obj; slot: Slot }[] => {
  const float: Slot[] = [
    { top: 420, left: 200, size: 240 },
    { top: 420, left: 640, size: 240 },
  ];
  if (!amb) return objects.slice(0, 2).map((o, i) => ({ o, slot: float[i] }));
  float.push({ top: 640, left: 60, size: 180 }, { top: 620, left: 840, size: 180 });
  const mesa = setting === 'mesa';
  const ground: Slot[] = mesa
    ? [
        { top: 1010, left: 150, size: 130, base: true },
        { top: 1010, left: 808, size: 125, base: true },
      ]
    : [
        { top: 1180, left: 30, size: 165, base: true },
        { top: 1180, left: 880, size: 165, base: true },
      ];
  const fits = mesa ? ON_DESK : ON_FLOOR;
  const out: { o: Obj; slot: Slot }[] = [];
  const rest: Obj[] = [];
  for (const o of objects.slice(0, 6)) {
    const pool = fits.has(o.p) && ground.length ? ground : float.length ? float : null;
    if (pool) out.push({ o, slot: pool.shift()! });
    else rest.push(o);
  }
  for (const o of rest) {
    const slot = ground.shift() ?? float.shift();
    if (slot) out.push({ o, slot });
  }
  return out;
};

/** O que a mesa ganha num ambiente (quando a cena tem poucas peças): abajur em casa, caneca em todo lugar. */
const DeskDressing: React.FC<{ tipo: string; t: number }> = ({ tipo, t }) => (
  <>
    {tipo === 'casa' ? (
      <div style={{ position: 'absolute', left: 150, top: 1010 - 143 }}>
        <Abajur t={t} size={130} />
      </div>
    ) : tipo === 'escritorio' ? (
      <div style={{ position: 'absolute', left: 170, top: 1010 - 130 }}>
        <Planta t={t} size={130} accent={C.surface3} />
      </div>
    ) : null}
    <div style={{ position: 'absolute', left: 815, top: 1010 - 127 }}>
      <Caneca t={t} size={115} accent={tipo === 'casa' ? C.gold : C.violet2} />
    </div>
  </>
);

/** A ideia aplicada: a pessoa num lugar (sofá, mesa, cama, chão) com uma peça na mão. */
export const Cena: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const spec = useSpec();
  const accent = useAccent();
  const pr = s.props ?? {};
  const amb = !!pr.ambiente;
  const setting = pr.setting ?? 'chao';
  const enter = spr(s.lead - 4, { damping: 16 });
  const helper = pr.helper ? spr(at(s, pr.from, s.lead + 10), { damping: 14 }) : 0;
  const walk = Math.sin(frame / 18);
  const mood = pr.mood ?? 'feliz';
  // a ação acontece ao longo da fala (caderno sendo escrito, tela acendendo)
  const work = ramp(frame, at(s, pr.glow, s.lead), Math.max(20, speechEnd(s) - at(s, pr.glow, s.lead)));
  const held = pr.holding ? (
    setting === 'sofa' ? (
      // no colo, no meio do corpo: o topo fica abaixo do queixo (y ≈ 140 da caixa); o livro assenta
      // na linha do assento (y ≈ 206) e peça mais alta (celular, copo) afunda atrás da frente do sofá
      <div style={{ position: 'absolute', top: 182, left: 0, width: 260, display: 'flex', justifyContent: 'center' }}>
        <div style={{ transform: 'rotate(-6deg)', transformOrigin: '50% 100%', display: 'flex' }}>
          <Peca name={pr.holding} t={frame} size={125} accent={accent} progress={work} />
        </div>
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
  // geometria pro ambiente e pra câmera, por lugar
  const G: Record<string, { geo: EnvGeo; pessoa: [number, number]; peca: [number, number] }> = {
    mesa: { geo: { ground: 1180, clear: [250, 820], spot: [460, 900, 420], desk: true }, pessoa: [420, 880], peca: [685, 900] },
    sofa: { geo: { ground: 1140, clear: [80, 740], spot: [400, 900, 420] }, pessoa: [390, 900], peca: [390, 955] },
    cama: { geo: { ground: 1150, clear: [120, 980], spot: [560, 900, 450] }, pessoa: [560, 880], peca: [727, 985] },
    chao: { geo: { ground: 1180, clear: [230, 640], spot: [430, 960, 400] }, pessoa: [430, 950], peca: [560, 880] },
  };
  const g = G[setting];
  const placed = cenaPlaced(setting, amb, pr.objects ?? []);
  // peça no chão de um canto: o primeiro plano daquele canto sai
  const frontOff = setting === 'mesa' ? [] : placed.filter((x) => x.slot.base).map((x) => (x.slot.left < 540 ? 'left' : 'right') as 'left' | 'right');
  const geo: EnvGeo = { ...g.geo, ...(pr.helper ? { clear: [g.geo.clear[0], 1080] as [number, number] } : {}), frontOff };
  // a mesa ganha abajur/caneca só se nenhuma peça do roteiro já pousou nela
  const dress = amb && !placed.some((x) => x.slot.base);
  return (
    <Stage s={s} geo={geo} focus={{ pessoa: g.pessoa, peca: g.peca }}>
      {amb ? null : <div style={{ position: 'absolute', top: 1180, left: 60, right: 60, height: 6, borderRadius: 3, background: C.surface2 }} />}
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
            {/* sentada: o quadril (y ≈ 206 da caixa) na linha do assento — pernas atrás da frente do sofá */}
            <Sofa width={640} seatTop={-89}>
              <div style={{ position: 'relative', left: 170 }}>{person}</div>
            </Sofa>
          </div>
        ) : setting === 'mesa' ? (
          <>
            <div style={{ position: 'absolute', top: 740, left: 270 }}>
              <Pessoa t={frame} size={300} mood={mood} arms="out" accent={C.violet} />
            </div>
            {/* frente da mesa: esconde pernas e pés (que ficariam soltos acima da linha do chão) */}
            <div style={{ position: 'absolute', top: 1040, left: 232, width: 616, height: 90, borderRadius: '0 0 14px 14px', background: C.surface2 }} />
            <div style={{ position: 'absolute', top: 1040, left: 540, width: 308, height: 90, borderRadius: '0 0 14px 0', background: 'rgba(5,7,26,0.2)' }} />
            <div style={{ position: 'absolute', top: 1010, left: 160, width: 760, height: 40, borderRadius: 16, background: C.surface3 }} />
            <div style={{ position: 'absolute', top: 1050, left: 220, width: 26, height: 130, borderRadius: 8, background: C.surface2 }} />
            <div style={{ position: 'absolute', top: 1050, left: 834, width: 26, height: 130, borderRadius: 8, background: C.surface2 }} />
            {dress ? <DeskDressing tipo={pr.ambiente!} t={frame} /> : null}
            {pr.holding ? (
              // encostada na mão estendida (a mão termina em ~x 577): a peça lê "na mão", não solta no tampo
              <div style={{ position: 'absolute', top: 1010, left: 565, transform: 'translateY(-100%)' }}>
                <Peca name={pr.holding} t={frame} size={240} accent={accent} progress={work} />
              </div>
            ) : null}
          </>
        ) : setting === 'cama' ? (
          <>
            <div style={{ position: 'absolute', top: 870, left: 120 }}>
              <Peca name="cama" t={frame} size={560} accent={accent} />
            </div>
            {/* sentada na beira da cama, no pé: quadril na linha da coberta (y ≈ 1031) e a
                frente do colchão redesenhada por cima esconde as pernas — como no sofá */}
            <div style={{ position: 'absolute', top: 763, left: 430 }}>{person}</div>
            <div style={{ position: 'absolute', top: 870, left: 120, clipPath: 'inset(161px 0 0 0)' }}>
              <Peca name="cama" t={frame} size={560} accent={accent} />
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', top: 1180 - 338, left: 300, transform: 'scale(1.35)', transformOrigin: '50% 100%' }}>{person}</div>
        )}
      </div>
      {placed.map(({ o, slot }, i) => (
        <Drop key={i} s={s} p={o.p} cueAt={o.cue} out={o.out} {...slot} delay={4 + i * (amb ? 6 : 0)} fall={amb ? 50 : 120} />
      ))}
      <div style={{ position: 'absolute', top: 700, left: setting === 'cama' ? 350 : 120 }}>
        <Brilho t={frame} size={420} on={ramp(frame, at(s, pr.glow, 1e9), 10)} />
      </div>
    </Stage>
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
  const geo: EnvGeo = { ground: 1225, clear: [120, 480], spot: [300, 1000, 360] };
  return (
    <Stage s={s} geo={geo} focus={{ pessoa: [300, 1010], peca: [670, 565] }}>
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
      <Drops
        s={s}
        objects={pr.objects}
        slots={[
          { top: 1000, left: 560, size: 220 },
          { top: 1000, left: 760, size: 220 },
        ]}
        stagger={0}
        fall={pr.ambiente ? 50 : 120}
      />
    </Stage>
  );
};

// ===================================================================== mapa
/**
 * O mapa do dia: uma folha do dia (manhã em cima, noite embaixo) onde os
 * blocos de tarefa caem nas deixas, cada um com a cor de como ele pesa —
 * drena (frio, apagado), neutro, energiza (dourado, brilha). Nunca hora nem
 * número: o ícone diz o que é, a cor diz como pesa, o comprimento diz quanto
 * do dia ocupa. Na deixa `turn`, os blocos com `then` viram (cor, tamanho,
 * ícone) e o dia se redistribui; a pessoa pega a caneta e o humor vira.
 */
const FEEL: Record<Feel, { bg: string; edge: string; icon: string }> = {
  drena: { bg: '#1D2452', edge: '#34407C', icon: '#7C86BE' },
  neutro: { bg: C.surface2, edge: C.surface3, icon: C.violet2 },
  energiza: { bg: C.gold, edge: C.gold2, icon: C.deep },
};
const MAPA = { y: 300, w: 540, h: 1040, pad: 120 };

const BlocoBox: React.FC<{ s: MS; b: Bloco; i: number; y: number; h: number; x: number; w: number; k: number }> = ({ s, b, i, y, h, x, w, k }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const d = spr(at(s, b.cue, s.lead + 6 + i * 9), { damping: 13, stiffness: 140 });
  const to = b.then?.feel ?? b.feel;
  const kk = b.then ? k : 0;
  const bg = interpolateColors(kk, [0, 1], [FEEL[b.feel].bg, FEEL[to].bg]);
  const edge = interpolateColors(kk, [0, 1], [FEEL[b.feel].edge, FEEL[to].edge]);
  const iconC = interpolateColors(kk, [0, 1], [FEEL[b.feel].icon, FEEL[to].icon]);
  const boost = (b.feel === 'energiza' ? 1 - kk : 0) + (to === 'energiza' ? kk : 0);
  const drain = (b.feel === 'drena' ? 1 - kk : 0) + (to === 'drena' ? kk : 0);
  const iconSize = Math.max(44, Math.min(72, h * 0.5));
  const icon2 = b.then?.icon;
  // o que drena "pesa" (afunda um tiquinho); o que energiza pulsa
  const sag = drain * Math.sin(frame / 20 + i) * 2;
  const pulse = 1 + boost * 0.012 * Math.sin(frame / 9 + i);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + sag,
        width: w,
        height: h,
        borderRadius: Math.min(26, h / 3),
        background: bg,
        border: `3px solid ${edge}`,
        boxShadow: boost > 0.05 ? `0 0 ${46 * boost}px ${C.gold}88` : '0 10px 24px rgba(0,0,0,0.3)',
        opacity: Math.min(1, d * 2) * (0.78 + 0.22 * (1 - drain)),
        transform: `translateY(${(1 - d) * -170}px) scale(${pulse})`,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 30,
        overflow: 'hidden',
      }}
    >
      {/* brilho que atravessa o bloco quando ele passa a energizar */}
      {to === 'energiza' && b.then ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 90,
            left: interpolate(k, [0, 1], [-120, w + 40]),
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)',
            transform: 'skewX(-18deg)',
          }}
        />
      ) : null}
      <div style={{ position: 'relative', width: iconSize, height: iconSize }}>
        <div style={{ position: 'absolute', inset: 0, opacity: icon2 ? 1 - kk : 1 }}>
          <Ion name={b.icon} size={iconSize} color={iconC} />
        </div>
        {icon2 ? (
          <div style={{ position: 'absolute', inset: 0, opacity: kk }}>
            <Ion name={icon2} size={iconSize} color={iconC} />
          </div>
        ) : null}
      </div>
      {/* o que energiza ganha uma faísca à direita; o que drena fica só frio e apagado */}
      <div style={{ position: 'absolute', right: 26, top: '50%', marginTop: -iconSize * 0.3, opacity: boost }}>
        <Ion name="sparkles" size={iconSize * 0.6} color={C.deep} />
      </div>
    </div>
  );
};

export const Mapa: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const accent = useAccent();
  const pr = s.props ?? {};
  const blocks = (pr.blocks ?? []).slice(0, 6);
  const left = (pr.side ?? 'left') === 'left';
  const cardX = left ? 470 : 70;
  const turnAt = at(s, pr.turn, 1e9);
  const k = ramp(frame, turnAt, 28);
  const turned = frame >= turnAt;
  const card = spr(s.lead - 8, { damping: 16 });
  // o dia em blocos: comprimento ∝ size, unidade fixa nas duas batidas (o dia não encolhe)
  const top0 = MAPA.y + MAPA.pad;
  const avail = MAPA.h - MAPA.pad * 2;
  const gap = 16;
  const sz = (b: Bloco, t: number) => interpolate(t, [0, 1], [b.size ?? 1, b.then?.size ?? b.size ?? 1]);
  const sumA = blocks.reduce((a, b) => a + sz(b, 0), 0);
  const sumB = blocks.reduce((a, b) => a + sz(b, 1), 0);
  const unit = Math.min(150, (avail - gap * Math.max(0, blocks.length - 1)) / Math.max(1, sumA, sumB));
  const used = blocks.reduce((a, b) => a + sz(b, k) * unit, 0) + gap * Math.max(0, blocks.length - 1);
  let y = top0 + (avail - used) / 2;
  const laid = blocks.map((b) => {
    const h = sz(b, k) * unit;
    const out = { b, y, h };
    y += h + gap;
    return out;
  });
  const bx = cardX + 92;
  const bw = MAPA.w - 92 - 34;
  const personX = left ? 60 : 720;
  const geo: EnvGeo = { ground: 1140, clear: left ? [40, 400] : [680, 1040], spot: [personX + 150, 950, 330] };
  const penIn = ramp(frame, turnAt - 10, 12);
  // brilho só nos blocos que PASSAM a energizar na virada (no máximo dois)
  const newBoost = laid.filter((l) => l.b.then && (l.b.then.feel ?? l.b.feel) === 'energiza' && (l.b.then.feel !== undefined || (l.b.then.size ?? 0) > (l.b.size ?? 1))).slice(0, 2);
  return (
    <Stage s={s} geo={geo} focus={{ pessoa: [personX + 150, 950], mapa: [cardX + MAPA.w / 2, MAPA.y + MAPA.h / 2] }}>
      {/* a folha do dia */}
      <div
        style={{
          position: 'absolute',
          left: cardX,
          top: MAPA.y,
          width: MAPA.w,
          height: MAPA.h,
          borderRadius: 40,
          background: `linear-gradient(170deg, ${C.surface} 0%, ${C.base} 100%)`,
          border: `3px solid ${turned ? `${C.gold}88` : C.borderStrong}`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          opacity: card,
          transform: `translateY(${(1 - card) * 40}px)`,
        }}
      >
        <div style={{ position: 'absolute', left: 34, top: 34 }}>
          <Ion name="sunny" size={60} color={C.gold} />
        </div>
        <div style={{ position: 'absolute', left: 116, right: 40, top: 60, height: 8, borderRadius: 4, background: C.surface3 }} />
        <div style={{ position: 'absolute', left: 34, bottom: 30 }}>
          <Ion name="moon" size={56} color={C.violet2} />
        </div>
        <div style={{ position: 'absolute', left: 116, right: 40, bottom: 56, height: 8, borderRadius: 4, background: C.surface3 }} />
        {/* trilho do tempo, sem horas */}
        <div style={{ position: 'absolute', left: 60, top: MAPA.pad - 6, bottom: MAPA.pad - 6, width: 6, borderRadius: 3, background: C.surface3 }} />
      </div>
      {laid.map(({ b, y: by, h }, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              position: 'absolute',
              left: cardX + 52,
              top: by + h / 2 - 11,
              width: 22,
              height: 22,
              borderRadius: 11,
              background: interpolateColors(b.then ? k : 0, [0, 1], [FEEL[b.feel].edge, FEEL[b.then?.feel ?? b.feel].edge]),
              opacity: card,
            }}
          />
          <BlocoBox s={s} b={b} i={i} y={by} h={h} x={bx} w={bw} k={k} />
        </React.Fragment>
      ))}
      {newBoost.map((l, i) => (
        <div key={i} style={{ position: 'absolute', left: bx + bw - 190, top: l.y + l.h / 2 - 150 }}>
          <Brilho t={frame + i * 13} size={300} on={ramp(frame, turnAt + 12, 12)} />
        </div>
      ))}
      {/* a pessoa ao lado, que pega a caneta pra redesenhar o dia */}
      <div style={{ position: 'absolute', top: 760, left: personX, transform: left ? undefined : 'scaleX(-1)' }}>
        <Pessoa t={frame} size={300} mood={turned ? (pr.to ?? 'feliz') : (pr.mood ?? 'cansado')} arms={frame >= turnAt - 10 ? 'out' : 'down'} accent={C.violet} />
        <div style={{ position: 'absolute', left: 262, top: 176, opacity: penIn, transform: `rotate(${-30 + Math.sin(frame / 5) * 6 * k}deg) scale(${0.7 + 0.3 * penIn})`, transformOrigin: '50% 90%' }}>
          <Caneta size={150} accent={C.gold} progress={0} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 700, left: personX - 50 }}>
        <Brilho t={frame} size={400} on={ramp(frame, at(s, pr.glow ?? pr.turn, 1e9) + 4, 10)} />
      </div>
    </Stage>
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
    <Stage s={s} kicker={s.props?.kicker ?? L.kicker} focus={{ pessoa: [540, 750] }}>
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
        {s.props?.done ?? L.done}
      </div>
    </Stage>
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
  mapa: Mapa,
  verso: Verso,
};
