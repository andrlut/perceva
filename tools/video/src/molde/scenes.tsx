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
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { MOLA, Mascara, ramp, sai } from '../components';
import { fontsReady } from '../fonts';
import { Glyph } from '../Glyph';
import { Brilho, Pensamento, Pessoa, Relogio, Semana, Sofa } from '../elenco/cast';
import { Encosto, SET } from '../elenco/cenario';
import { Caneca, Caneta, Planta } from '../elenco/objetos';
import { C, DimId, FONT, dimColor } from '../theme';
import { Scene, cue, speechEnd, wordFrames } from '../timeline';
import { Abajur, AmbSpec, Ambiente, AmbienteMini, EnvGeo, Luz, Rect, Spot, Vinheta } from './ambientes';
import { CameraRig, FocusMap, Layer, cameraAt, focusPoint } from './camera';
import { Sfx, type SfxName } from './sfx';
import { useIdentity } from '../identidade/context';
import { Ion, Peca, pieceBox } from './Peca';
import type { Bloco, Chip, Feel, MoldeLine, MoldeSpec, Mood, Obj, Panel } from './spec';

export type MS = Scene & Pick<MoldeLine, 'scene' | 'props'>;
type P = { s: MS };

export const SpecContext = createContext<MoldeSpec | null>(null);
const useSpec = () => {
  const spec = useContext(SpecContext);
  if (!spec) throw new Error('SpecContext vazio');
  return spec;
};
/**
 * Cor das peças, da sobrancelha e do mundo da cena: a cor da ÁREA da ideia. A fase 1 do requinte
 * (2026-11-07) trocou tudo por violeta e deixou o dourado só no destaque; o André viu o vídeo e
 * achou monótono — voltou na 1.1. Não repetir sem mostrar a ele antes.
 */
const useAccent = () => dimColor(useSpec().dimension);
/** Cor do ajudante: Ofício (teal), ou Vínculos quando a ideia já é de Ofício. */
const helperColor = (d: DimId) => dimColor(d === 'craft' ? 'bonds' : 'craft');

const SKINS = ['#F2C9A0', '#C68B5E', '#8D5A3B', '#E0AC7E', '#5C3A24', '#F5D5B8'];

const useSpr = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, config: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
    spring({ frame: frame - at, fps, config: { ...MOLA.entra, ...config } });
};

/**
 * Largura de um texto na fonte do vídeo, medida no canvas. O quadro só sai
 * depois das fontes carregadas (delayRender), então a medida é sempre a da
 * fonte de verdade — em toda aba do render, não só na primeira.
 */
let measureCtx: CanvasRenderingContext2D | null = null;
const useTextWidth = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('fontes pra medir texto'));
  useEffect(() => {
    fontsReady.then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return (text: string, font: string) => {
    if (!ready || typeof document === 'undefined') return Infinity;
    measureCtx ??= document.createElement('canvas').getContext('2d');
    if (!measureCtx) return Infinity;
    measureCtx.font = font;
    return measureCtx.measureText(text).width;
  };
};

/** Frame da deixa, ou `fallback` quando a cena não deu deixa. */
const at = (s: MS, phrase: string | undefined, fallback: number) => (phrase ? cue(s, phrase) : fallback);

/** Sobrancelha. Fase 2: SOBE de trás da própria linha (texto por máscara), não aparece por fade. */
const Kicker: React.FC<{ text?: string; top?: number }> = ({ text, top = 200 }) => {
  const spr = useSpr();
  const accent = useAccent();
  if (!text) return null;
  return (
    <div style={{ position: 'absolute', top, left: 80, right: 80, display: 'flex', justifyContent: 'center' }}>
      <Mascara p={spr(1, MOLA.pousa)}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 32, letterSpacing: 7, color: accent, whiteSpace: 'nowrap' }}>{text.toUpperCase()}</div>
      </Mascara>
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
      {cueAt != null ? <Sfx at={cueAt - (pr.camera?.move === 'push' ? 2 : 8)} name={pr.camera?.move === 'push' ? 'punch' : 'whoosh'} gain={pr.camera?.move === 'push' ? 1 : 0.7} /> : null}
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
            {/* fase 2: luz com origem — o facho da janela cai na sala, por baixo da pessoa e das peças
                (por cima, lavava a ficha que pousava na frente da janela) */}
            <Layer depth={0.92}>
              <Luz amb={amb} geo={geo} t={frame} />
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
const Drop: React.FC<{ s: MS; p: string; cueAt?: string; out?: string; stay?: boolean; top: number; left: number; size: number; delay?: number; fall?: number; base?: boolean; chip?: boolean }> = ({
  s,
  p,
  cueAt,
  out,
  stay = false,
  top,
  left,
  size,
  delay = 0,
  fall = 120,
  base = false,
  chip = false,
}) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const accent = useAccent();
  // `stay`: já estava em cena (com corte seco da fala anterior) — sem queda, sem sumir no corte
  const dropAt = at(s, cueAt, s.lead + delay);
  const t = stay ? 1 : spr(dropAt, MOLA.peso);
  // v4: amassa no impacto (a mola passa do alvo): achata e alarga mantendo o volume, depois assenta
  const sq = Math.max(0, t - 1) * 2.2;
  const gone = out ? sai(frame, cue(s, out), 8) : 0;
  const land = fall < 120;
  // desenho que flutua por cima de móvel (estante, mesa): vai numa ficha redonda, como o ícone do app,
  // pra não sumir no colorido do cenário
  const piece =
    chip && !p.startsWith('ion:') ? (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: `linear-gradient(150deg, ${C.surface3} 0%, ${C.surface2} 100%)`,
          boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Peca name={p} t={frame} size={size * 0.72} accent={accent} />
      </div>
    ) : (
      <Peca name={p} t={frame} size={size} accent={accent} />
    );
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        opacity: Math.min(1, t * 2) * (1 - gone),
        transform: `translateY(${(1 - t) * -fall - gone * 160}px) scale(${(land ? 0.7 + 0.3 * t : 1) * (1 - 0.3 * gone)}) scale(${1 + 0.45 * sq}, ${1 - 0.55 * sq})`,
        transformOrigin: land ? '50% 100%' : '50% 100%',
      }}
    >
      {stay ? null : <Sfx at={dropAt + 5} name={`pop${[...p].reduce((h, c) => h + c.charCodeAt(0), 0) % 5}` as SfxName} />}
      {base ? <div style={{ transform: 'translateY(-100%)', display: 'flex', alignItems: 'flex-end' }}>{piece}</div> : piece}
    </div>
  );
};

/** Encaixe de peça: posição + tamanho; `base` = `top` é onde ela se apoia; `chip` = desenho vai numa ficha. */
type Slot = { top: number; left: number; size: number; base?: boolean; chip?: boolean };

/** Onde a peça `p` fica na tela, num encaixe (pra o cenário não pôr ninguém embaixo dela). */
const slotRect = (p: string, sl: Slot): Rect => {
  const [w, h] = sl.chip && !p.startsWith('ion:') ? [sl.size, sl.size] : pieceBox(p, sl.size);
  return sl.base ? [sl.left, sl.top - h, sl.left + w, sl.top] : [sl.left, sl.top, sl.left + w, sl.top + h];
};
/** O que as peças da cena ocupam: `objects` nos `slots`, na ordem. */
const busyOf = (objects: Obj[] | undefined, slots: Slot[]): Rect[] => (objects ?? []).slice(0, slots.length).map((o, i) => slotRect(o.p, slots[i]));

const Drops: React.FC<{ s: MS; objects?: Obj[]; slots: Slot[]; fall?: number; stagger?: number }> = ({ s, objects = [], slots, fall, stagger = 8 }) => (
  <>
    {objects.slice(0, slots.length).map((o, i) => (
      <Drop key={i} s={s} p={o.p} cueAt={o.cue} out={o.out} stay={o.stay} {...slots[i]} delay={4 + i * stagger} fall={fall} />
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
  // a identidade que acende o hexágono no feliz já diz "feliz": sem estrelinhas por cima
  const idHalo = !!useIdentity().halo;
  const me = spr(0);
  const slots = (amb ? SLOTS_AMB : SLOTS).map((sl, i) => ({ ...sl, size: i % 2 ? 250 : 280 }));
  // o cenário tira colega, móvel e primeiro plano de baixo das peças (e do relógio)
  const busy: Rect[] = [...busyOf(pr.objects, slots), ...(pr.clock ? [[640, 330, 870, 560] as Rect] : [])];
  const geo: EnvGeo = { ground: 1043, clear: [360, 720], spot: [540, 830, 380], frontOff: (pr.objects?.length ?? 0) >= 3 ? ['left'] : [], busy, show: pr.objects?.map((o) => o.p) };
  return (
    <Stage s={s} geo={geo} focus={{ peca: [slots[0].left + 140, slots[0].top + 140] }}>
      <Clock s={s} mode={pr.clock} turnAt={turnAt} top={330} left={640} size={230} />
      {pr.turn && positive ? <Sfx at={turnAt} name="chime" /> : null}
      <div style={{ position: 'absolute', top: 640, left: 380, opacity: me, transform: `scale(${0.85 + 0.15 * me})` }}>
        <Pessoa t={frame} size={320} mood={mood} since={turned ? frame - turnAt : frame} arms={turned && positive ? 'up' : (pr.arms ?? 'down')} sweat={pr.sweat && !turned} accent={C.violet} />
      </div>
      {(pr.glow && !(idHalo && mood === 'feliz')) || (pr.turn && positive && !idHalo) ? (
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
  const week = spr(s.lead - 4);
  // a semana e o relógio ficam por cima do cenário
  const geo: EnvGeo = { ground: 1140, clear: [480, 820], spot: [650, 950, 360], busy: [[110, 320, 970, 682], [150, 820, 380, 1050]] };
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
  const helper = pr.helper ? spr(aGive) : 0;
  const happy = frame >= aTurn;
  const sweep = pr.helper && frame >= aGive + 18 ? Math.sin(frame / 4) * 14 : 0;
  const hc = helperColor(spec.dimension);
  const vSlots: Slot[] = [
    { top: 1060, left: 200, size: 240 },
    { top: 1060, left: 640, size: 240 },
  ];
  // a peça entregue atravessa do colo dela até o ajudante (ou sobe e some): a faixa toda fica livre
  const busy: Rect[] = [...busyOf(pr.objects, vSlots), ...(pr.gives ? [[320, 440, 1100, 1000] as Rect] : []), ...(pr.clock ? [[190, 300, 390, 500] as Rect] : [])];
  const show = [pr.gives, ...(pr.objects ?? []).map((o) => o.p)];
  const geo: EnvGeo = pr.helper ? { ground: 980, clear: [70, 960], spot: [500, 780, 480], busy, show } : { ground: 980, clear: [360, 720], spot: [530, 780, 380], busy, show };
  return (
    <Stage s={s} geo={geo} focus={{ pessoa: pr.helper ? [240, 790] : [530, 790], peca: pr.helper ? [900, 770] : [750, 860] }}>
      <Clock s={s} mode={pr.clock} turnAt={aTurn} top={300} left={190} size={200} />
      {(pr.to ?? 'feliz') === 'feliz' ? <Sfx at={aTurn} name="chime" /> : null}
      <div style={{ position: 'absolute', top: 600, left: pr.helper ? 90 : 380 }}>
        <Pessoa
          t={frame}
          size={300}
          mood={happy ? (pr.to ?? 'feliz') : (pr.mood ?? 'cansado')}
          since={happy ? frame - aTurn : frame}
          // com `gives` ela já começa segurando a peça (braço estendido); sem, estende na entrega
          arms={happy ? 'up' : pr.gives || frame >= aGive ? 'out' : 'down'}
          accent={C.violet}
        />
      </div>
      {useIdentity().halo ? null : (
        <div style={{ position: 'absolute', top: 560, left: pr.helper ? 50 : 340 }}>
          <Brilho t={frame} size={380} on={ramp(frame, aTurn, 10)} />
        </div>
      )}
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
      <Drops s={s} objects={pr.objects} slots={vSlots} stagger={0} fall={pr.ambiente ? 50 : 120} />
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
          const t = spr(i * 1.2, MOLA.pousa);
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

/**
 * Geometria do painel. `curto` = o de sempre (deixa lugar pros `chips` embaixo);
 * `alto` = sem chips, o painel desce pela faixa vazia e tudo cresce (miniatura,
 * pessoa, peça, rótulo). A peça pousa no chão, ao lado dos pés da pessoa.
 */
const PANEL = {
  curto: { top: 330, h: 640, w: 450, xs: [70, 560], horizon: 300, scale: 0.46, person: { top: 140, left: 50, size: 230 }, object: { top: 200, left: 250, size: 190 }, label: 455 },
  alto: { top: 280, h: 920, w: 460, xs: [60, 560], horizon: 470, scale: 0.62, person: { top: 240, left: 12, size: 316 }, object: { base: 638, left: 236, size: 196 }, label: 735 },
} as const;
type PanelGeo = (typeof PANEL)[keyof typeof PANEL];

const PanelBox: React.FC<{
  s: MS;
  g: PanelGeo;
  x: number;
  from: number;
  win: number;
  lose: number;
  /** quadros desde que este painel virou o vencedor (o humor dele vira aí) */
  winSince?: number;
  panel: Panel;
  seed: number;
  labelSize: number;
  pill?: { p?: string; text: string };
}> = ({ s, g, x, from, win, lose, winSince, panel, seed, labelSize, pill }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const accent = useAccent();
  const t = spr(from);
  const arrive = spr(at(s, panel.arrives, from + 8), MOLA.pousa);
  const leave = panel.leaves ? sai(frame, cue(s, panel.leaves) + 6, 10) : 0;
  const mood: Mood = win > 0.5 ? 'feliz' : (panel.mood ?? 'ok');
  const ob = g.object;
  const [ow, oh] = panel.object ? pieceBox(panel.object, ob.size) : [0, 0];
  // painel alto: a peça pousa no chão (base); o curto segue com o topo fixo de sempre
  const oTop = 'base' in ob ? ob.base - oh : ob.top;
  const ps = g.person;
  return (
    <div
      style={{
        position: 'absolute',
        top: g.top,
        left: x,
        width: g.w,
        height: g.h,
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
        // o lugar de cada caminho (a sala de aula × a mesa de casa), miniatura atrás da pessoa;
        // nada da miniatura fica embaixo da peça do painel, e ela não repete a peça
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - 0.35 * lose }}>
          <AmbienteMini
            tipo={panel.ambiente}
            hora={panel.hora}
            t={frame}
            accent={accent}
            horizon={g.horizon}
            cx={g.w / 2}
            scale={g.scale}
            w={g.w}
            h={g.h}
            clear={[ps.left + ps.size * 0.26, ps.left + ps.size * 0.74]}
            busy={panel.object ? [[ob.left - 10, oTop - 10, ob.left + ow + 10, oTop + oh + 10]] : []}
            show={[panel.object]}
          />
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: ps.top, left: ps.left }}>
        <Pessoa t={frame} size={ps.size} seed={seed} arms={win > 0.5 ? 'up' : 'down'} mood={mood} since={win > 0.5 && winSince != null ? winSince : frame} accent={seed ? C.violet2 : C.violet} skin={seed ? '#8D5A3B' : '#F2C9A0'} />
      </div>
      {panel.object ? (
        <div
          style={{
            position: 'absolute',
            top: oTop,
            left: ob.left,
            opacity: arrive * (1 - leave),
            transform: `translate(${leave * 240}px, ${-leave * 120}px) rotate(${leave * 40}deg) scale(${0.6 + 0.4 * arrive})`,
            transformOrigin: 'base' in ob ? '50% 100%' : undefined,
            filter: panel.ambiente ? 'drop-shadow(0 10px 22px rgba(5,7,26,0.6))' : undefined,
          }}
        >
          <Peca name={panel.object} t={frame} size={ob.size} accent={accent} />
        </div>
      ) : null}
      {/* rótulo de duas linhas + pílula cabem no painel; `balance` reparte as duas linhas (nada de palavra órfã) */}
      <div style={{ position: 'absolute', top: g.label, left: 20, right: 20, textAlign: 'center' }}>
        {/* fase 2: o rótulo sobe de trás da linha quando o painel assenta */}
        <Mascara p={spr(from + 8, MOLA.pousa)}>
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: labelSize, lineHeight: 1.1, color: C.hi, textWrap: 'balance' }}>{panel.label}</div>
        </Mascara>
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
        const t = spr(cue(s, c.cue), MOLA.pousa);
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
  const width = useTextWidth();
  const pr = s.props ?? {};
  const w = ramp(frame, at(s, pr.win, 1e9), 16);
  const winSfx = <Sfx at={at(s, pr.win, 1e9) + 8} name="chime" />;
  const winL = pr.winner === 'left' ? w : 0;
  const winR = pr.winner === 'right' ? w : 0;
  // sem chips, a faixa de baixo fica vazia: o painel alto ocupa ela
  const g: PanelGeo = pr.chips?.length ? PANEL.curto : PANEL.alto;
  // os dois rótulos no mesmo corpo; no painel alto ele cresce até onde os DOIS cabem numa linha
  // (sem caber nem a 44, quebra em duas linhas equilibradas)
  const oneLine = (size: number) => [pr.left?.label ?? '', pr.right?.label ?? ''].every((l) => width(l, `600 ${size}px ${FONT.display}`) <= g.w - 40 - 8);
  const labelSize = g === PANEL.curto ? 44 : ([54, 50, 46].find(oneLine) ?? 44);
  const right = pr.winner === 'right';
  const at_ = (k: number): [number, number] => [g.xs[right ? 1 : 0] + g.w * k, g.top + g.h * 0.45];
  const focus: FocusMap = g === PANEL.curto ? { pessoa: right ? [785, 650] : [295, 650], peca: right ? [880, 600] : [390, 600] } : { pessoa: at_(0.36), peca: at_(0.74) };
  return (
    <Stage s={s} focus={focus}>
      {winSfx}
      {/* a protagonista fica no lado que ganha ("você"); o outro lado é outra pessoa */}
      <PanelBox s={s} g={g} x={g.xs[0]} from={s.lead - 4} win={winL} lose={winR} winSince={frame - at(s, pr.win, 1e9) - 8} panel={pr.left!} seed={pr.winner === 'right' ? 3 : 0} labelSize={labelSize} pill={pr.pill} />
      <PanelBox s={s} g={g} x={g.xs[1]} from={s.lead + 4} win={winR} lose={winL} winSince={frame - at(s, pr.win, 1e9) - 8} panel={pr.right!} seed={pr.winner === 'right' ? 0 : 3} labelSize={labelSize} pill={pr.pill} />
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
  const me = spr(0);
  const last = pr.items?.length ? cue(s, pr.items[pr.items.length - 1].cue) : 1e9;
  const n = Math.min(3, pr.items?.length ?? 0);
  const geo: EnvGeo = { ground: 712, clear: [340, 720], spot: [530, 510, 320], busy: n ? [[90, 790, 990, 790 + n * 132]] : [] };
  return (
    <Stage s={s} geo={geo} focus={{ peca: [540, 1000] }}>
      {pr.to === 'feliz' && pr.mood !== 'feliz' ? <Sfx at={last} name="chime" /> : null}
      <div style={{ position: 'absolute', top: 280, left: 360, opacity: me }}>
        <Pessoa t={frame} size={340} mood={frame >= last ? (pr.to ?? pr.mood ?? 'ok') : (pr.mood ?? 'ok')} since={frame >= last ? frame - last : frame} arms={pr.arms ?? 'down'} accent={C.violet} />
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
  // os dois de baixo ficam por cima de estante e móvel: desenho que cair ali vai numa ficha
  float.push({ top: 640, left: 60, size: 180, chip: true }, { top: 620, left: 840, size: 180, chip: true });
  const mesa = setting === 'mesa';
  // na mesa (plano aberto do lugar) as pontas têm peça de ≥ 120 px de verdade, não só de caixa
  const ground: Slot[] = mesa
    ? [
        { top: 1010, left: 118, size: 178, base: true },
        { top: 1010, left: 812, size: 160, base: true },
      ]
    : [
        { top: 1180, left: 30, size: 165, base: true },
        { top: 1180, left: 880, size: 165, base: true },
      ];
  const fits = mesa ? ON_DESK : ON_FLOOR;
  const out: { o: Obj; slot: Slot }[] = [];
  const up: Obj[] = [];
  for (const o of objects.slice(0, 6)) {
    if (fits.has(o.p) && ground.length) out.push({ o, slot: ground.shift()! });
    else up.push(o);
  }
  // no alto: desenho primeiro nos encaixes grandes, ficha (ion:) nos de baixo — a ficha já
  // separa do fundo sozinha; o que não couber volta pro chão
  const drawn = up.filter((o) => !o.p.startsWith('ion:'));
  const chips = up.filter((o) => o.p.startsWith('ion:'));
  for (const o of [...drawn, ...chips]) {
    const slot = float.shift() ?? ground.shift();
    if (slot) out.push({ o, slot });
  }
  // a ordem de entrada continua a do roteiro
  return out.sort((a, b) => objects.indexOf(a.o) - objects.indexOf(b.o));
};

/**
 * O que a mesa ganha num ambiente (quando a cena tem poucas peças): abajur em
 * casa, planta no escritório, caneca em todo lugar. Na sala de aula a caneca
 * vai pra ponta esquerda: a direita é onde quem apresenta estende a mão.
 */
const deskDressing = (tipo: string): { kind: 'abajur' | 'planta' | 'caneca'; left: number; top: number; rect: Rect }[] => [
  ...(tipo === 'casa'
    ? [{ kind: 'abajur' as const, left: 150, top: 1010 - 143, rect: [150, 867, 280, 1010] as Rect }]
    : tipo === 'escritorio'
      ? [{ kind: 'planta' as const, left: 170, top: 1010 - 130, rect: [170, 880, 274, 1010] as Rect }]
      : []),
  tipo === 'treinamento'
    ? { kind: 'caneca' as const, left: 170, top: 1010 - 127, rect: [170, 883, 268, 1010] as Rect }
    : { kind: 'caneca' as const, left: 815, top: 1010 - 127, rect: [815, 883, 913, 1010] as Rect },
];
const DeskDressing: React.FC<{ tipo: string; t: number }> = ({ tipo, t }) => (
  <>
    {deskDressing(tipo).map((d) => (
      <div key={d.kind} style={{ position: 'absolute', left: d.left, top: d.top }}>
        {d.kind === 'abajur' ? (
          <Abajur t={t} size={130} />
        ) : d.kind === 'planta' ? (
          <Planta t={t} size={130} accent={C.surface3} />
        ) : (
          <Caneca t={t} size={115} accent={tipo === 'casa' ? C.gold : C.violet2} />
        )}
      </div>
    ))}
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
  const enter = spr(s.lead - 4);
  const helper = pr.helper ? spr(at(s, pr.from, s.lead + 10)) : 0;
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
  // a mesa ganha abajur/caneca só se nenhuma peça do roteiro já pousou nela
  const dress = amb && !placed.some((x) => x.slot.base);
  // o que a cena desenha por cima do cenário: as peças, a da mão, o enfeite da mesa e o ajudante
  const heldRect: Rect | null = !pr.holding
    ? null
    : setting === 'mesa'
      ? ((([w, h]) => [565, 1010 - h, 565 + w, 1010])(pieceBox(pr.holding, 240)) as Rect)
      : setting === 'sofa'
        ? [300, 1000, 480, 1140]
        : setting === 'cama'
          ? [560, 900, 720, 1080]
          : [570, 940, 740, 1135];
  const busy: Rect[] = [
    ...placed.map(({ o, slot }) => slotRect(o.p, slot)),
    // a ponta da mesa (ou o canto do chão) onde uma peça pousou é dela inteira, não só a caixa
    // da peça: o que o lugar tem ali atrás (a planta do canto, o vaso da estante, o móvel) sai
    ...(amb ? placed.filter((x) => x.slot.base).map(({ slot }) => [slot.left, slot.top - slot.size, slot.left + slot.size, slot.top] as Rect) : []),
    ...(heldRect ? [heldRect] : []),
    ...(dress && setting === 'mesa' ? deskDressing(pr.ambiente!).map((d) => d.rect) : []),
    ...(pr.helper ? ([[740, 860, 1080, 1180]] as Rect[]) : []),
  ];
  // a caneca do enfeite da mesa conta como peça da cena: o cenário não põe outra
  const show = [pr.holding, pr.gives, ...(pr.objects ?? []).map((o) => o.p), ...(dress && setting === 'mesa' ? ['caneca'] : [])];
  const geo: EnvGeo = { ...g.geo, ...(pr.helper ? { clear: [g.geo.clear[0], 1080] as [number, number] } : {}), frontOff, busy, show };
  // num lugar, a mesa é mais larga: as peças das pontas (maiores) pousam no tampo
  const D = amb ? { x: 100, w: 880 } : { x: 160, w: 760 };
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
              {/* atrás da mesa o hexágono de corpo inteiro vira "casinha": em volta da cabeça */}
              <Pessoa t={frame} size={300} mood={mood} arms="out" accent={C.violet} halo="cabeca" />
            </div>
            {/* frente da mesa: esconde pernas e pés (que ficariam soltos acima da linha do chão) */}
            <div style={{ position: 'absolute', top: 1040, left: 232, width: 616, height: 90, borderRadius: '0 0 14px 14px', background: C.surface2 }} />
            <div style={{ position: 'absolute', top: 1040, left: 540, width: 308, height: 90, borderRadius: '0 0 14px 0', background: 'rgba(5,7,26,0.2)' }} />
            <div style={{ position: 'absolute', top: 1010, left: D.x, width: D.w, height: 40, borderRadius: 16, background: C.surface3 }} />
            <div style={{ position: 'absolute', top: 1050, left: D.x + 60, width: 26, height: 130, borderRadius: 8, background: C.surface2 }} />
            <div style={{ position: 'absolute', top: 1050, left: D.x + D.w - 86, width: 26, height: 130, borderRadius: 8, background: C.surface2 }} />
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
        <Drop key={i} s={s} p={o.p} cueAt={o.cue} out={o.out} {...slot} delay={4 + i * (amb ? 6 : 0)} fall={amb ? 50 : 120} chip={slot.chip} />
      ))}
      {useIdentity().halo && mood === 'feliz' ? null : (
        <div style={{ position: 'absolute', top: 700, left: setting === 'cama' ? 350 : 120 }}>
          <Brilho t={frame} size={420} on={ramp(frame, at(s, pr.glow, 1e9), 10)} />
        </div>
      )}
    </Stage>
  );
};

// ===================================================================== pensa
/**
 * Na sala de aula (`ambiente: treinamento`) quem pensa é da plateia: ela senta
 * na fileira do meio, virada pra câmera, com o encosto da cadeira na frente e
 * a turma de costas dos lados. O balão abre pra cima e pra esquerda, por cima
 * da lista do slide — o gráfico e quem apresenta (à direita) continuam à vista.
 */
const PLATEIA = { x: 560, y: 1125, size: 270, ground: 1030, bubble: 2.3, tail: [505, 795] as [number, number], edge: 20 };
/** Centro da nuvem (onde vai a peça) pro balão de escala `k`: a cauda fica parada sobre a cabeça dela. */
const plateiaCloud = (k: number): [number, number] => [PLATEIA.tail[0] - 116 * k, PLATEIA.tail[1] - 103 * k];
/**
 * Escala do balão (viewBox 250×200 → 250k px): a maior até `bubble` em que a
 * nuvem da esquerda (x = cauda − 206 k, depois de espelhar) fica ≥ `edge` px
 * dentro do quadro em TODO quadro da câmera da cena — inclusive no ponto mais
 * perto de um pull ou de um push. A cauda não sai de cima da cabeça dela: o
 * balão encolhe pra dentro, não anda.
 */
const plateiaBubble = (s: MS, focus: FocusMap) => {
  const cam = s.props?.camera;
  if (!cam || cam.move === 'still') return PLATEIA.bubble;
  const cueAt = cam.cue ? cue(s, cam.cue) : null;
  const f = focusPoint(cam.focus, focus);
  let left = PLATEIA.edge;
  for (let fr = 0; fr <= s.frames; fr++) {
    const c = cameraAt(fr, s.frames, cam, cueAt, f);
    // camada de profundidade 1: x' = ox + (x − ox)·scale + c.x, e x' ≥ edge
    left = Math.max(left, c.ox + (PLATEIA.edge - c.ox - c.x) / c.scale);
  }
  return Math.min(PLATEIA.bubble, (PLATEIA.tail[0] - left) / 206);
};
const PensaPlateia: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const accent = useAccent();
  const pr = s.props ?? {};
  const a = at(s, pr.at, s.lead + 4);
  const turnAt = at(s, pr.turn, 1e9);
  const pop = ramp(frame, a + 14, 10);
  const { x, y, size } = PLATEIA;
  // com focus "peca" a câmera mira a nuvem, que depende da escala: duas passadas bastam
  const k = plateiaBubble(s, { pessoa: [x, 930], peca: plateiaCloud(plateiaBubble(s, { pessoa: [x, 930], peca: plateiaCloud(PLATEIA.bubble) })) });
  // balão espelhado (viewBox 250×200): a bolinha de baixo, (220,186) depois de espelhar, fica sobre a cabeça dela
  const bx = PLATEIA.tail[0] - 220 * k;
  const by = PLATEIA.tail[1] - 186 * k;
  const cloud: Rect = [bx + 14 * k, by + 6 * k, bx + 194 * k, by + 160 * k];
  const pc = plateiaCloud(k);
  const thoughtSize = Math.round(81 * k);
  const [tw, th] = pr.thought ? pieceBox(pr.thought, thoughtSize) : [0, 0];
  const slots: Slot[] = [
    { top: 1010, left: 60, size: 200 },
    { top: 1010, left: 820, size: 200 },
  ];
  const geo: EnvGeo = {
    ground: PLATEIA.ground,
    clear: [x - size * 0.3, x + size * 0.3],
    spot: [x, 930, 330],
    seat: { x, y, size },
    busy: [cloud, [bx + 150 * k, by + 150 * k, PLATEIA.tail[0] + 30, PLATEIA.tail[1] + 20], ...busyOf(pr.objects, slots)],
    show: [pr.thought, ...(pr.objects ?? []).map((o) => o.p)],
  };
  return (
    <Stage s={s} geo={geo} focus={{ pessoa: [x, 930], peca: pc }}>
      <div style={{ position: 'absolute', top: y - size * 1.26, left: x - size / 2 }}>
        <Pessoa t={frame} size={size} mood={frame >= turnAt ? (pr.to ?? 'feliz') : (pr.mood ?? 'ok')} arms={pr.arms ?? 'none'} accent={C.violet} />
      </div>
      {/* o encosto da cadeira dela, igual ao da turma: esconde da cintura pra baixo (um pouco
          mais baixo que o dos vizinhos — ela é quem a gente olha) */}
      <Encosto x={x} y={y + size * 0.08} size={size} tone={SET.frameShade} />
      <div style={{ position: 'absolute', top: by, left: bx, transform: 'scaleX(-1)' }}>
        <Pensamento t={Math.max(0, frame - a)} size={250 * k} />
      </div>
      {pr.thought ? (
        <div style={{ position: 'absolute', top: pc[1] - th / 2, left: pc[0] - tw / 2, opacity: pop, transform: `scale(${0.6 + 0.4 * pop})` }}>
          <Peca name={pr.thought} t={frame} size={thoughtSize} accent={accent} />
        </div>
      ) : null}
      <Drops s={s} objects={pr.objects} slots={slots} stagger={0} fall={50} />
    </Stage>
  );
};

/** A pessoa pensando: o balão abre na deixa com a peça dentro. */
export const Pensa: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const accent = useAccent();
  const pr = s.props ?? {};
  const a = at(s, pr.at, s.lead + 4);
  const turnAt = at(s, pr.turn, 1e9);
  const pop = ramp(frame, a + 14, 10);
  const pSlots: Slot[] = [
    { top: 1000, left: 560, size: 220 },
    { top: 1000, left: 760, size: 220 },
  ];
  // o balão (nuvem + bolinhas), a peça dele e as que caem: nada do cenário embaixo
  const geo: EnvGeo = {
    ground: 1225,
    clear: [120, 480],
    spot: [300, 1000, 360],
    busy: [[452, 346, 942, 765], [370, 760, 470, 850], ...busyOf(pr.objects, pSlots)],
    show: [pr.thought, ...(pr.objects ?? []).map((o) => o.p)],
  };
  if (pr.ambiente === 'treinamento') return <PensaPlateia s={s} />;
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
      <Drops s={s} objects={pr.objects} slots={pSlots} stagger={0} fall={pr.ambiente ? 50 : 120} />
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
// três degraus que se separam sem som, no celular: drena = cinza-azulado frio, apagado, ícone
// desbotado (mais escuro que a folha não: mais FRIO e sem cor); neutro = um meio-tom violeta
// claro, com ícone claro; energiza = o dourado. A diferença é de luz, não só de matiz.
// `text`: o nome da tarefa (fase 2) — no que drena ele não desbota como o ícone: palavra tem que ler
const FEEL: Record<Feel, { bg: string; edge: string; icon: string; text: string }> = {
  drena: { bg: '#1C2542', edge: '#2F3B5E', icon: '#56658C', text: '#C9CCF0' },
  neutro: { bg: '#4D55A3', edge: '#6C74C4', icon: '#E4E6FF', text: C.hi },
  energiza: { bg: C.gold, edge: C.gold2, icon: C.deep, text: C.deep },
};
const MAPA = { y: 300, w: 540, h: 1040, pad: 120 };
/** Com nome nos blocos (fase 2) a folha alarga e a pessoa encosta na borda. */
const MAPA_NOMES = { w: 640, xLeft: 400, xRight: 40, personLeft: 20, personRight: 760 };

const BlocoBox: React.FC<{ s: MS; b: Bloco; i: number; y: number; h: number; x: number; w: number; k: number; labelSize?: number }> = ({ s, b, i, y, h, x, w, k, labelSize = 42 }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const dropAt = at(s, b.cue, s.lead + 6 + i * 9);
  const d = spr(dropAt, MOLA.pousa);
  const to = b.then?.feel ?? b.feel;
  const kk = b.then ? k : 0;
  const bg = interpolateColors(kk, [0, 1], [FEEL[b.feel].bg, FEEL[to].bg]);
  const edge = interpolateColors(kk, [0, 1], [FEEL[b.feel].edge, FEEL[to].edge]);
  const iconC = interpolateColors(kk, [0, 1], [FEEL[b.feel].icon, FEEL[to].icon]);
  const textC = interpolateColors(kk, [0, 1], [FEEL[b.feel].text, FEEL[to].text]);
  const boost = (b.feel === 'energiza' ? 1 - kk : 0) + (to === 'energiza' ? kk : 0);
  const drain = (b.feel === 'drena' ? 1 - kk : 0) + (to === 'drena' ? kk : 0);
  // com nome, o ícone tem tamanho fixo: se crescesse com o bloco, empurraria o nome pra faísca
  const iconSize = b.label ? 52 : Math.max(44, Math.min(72, h * 0.5));
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
        transform: `translateX(${(1 - d) * 110}px) scale(${pulse * (0.94 + 0.06 * Math.min(1, d))})`,
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
      {/* o ícone do que drena desbota (o que é a tarefa ainda lê, mas sem vida) */}
      <div style={{ position: 'relative', width: iconSize, height: iconSize, opacity: 1 - 0.25 * drain }}>
        <div style={{ position: 'absolute', inset: 0, opacity: icon2 ? 1 - kk : 1 }}>
          <Ion name={b.icon} size={iconSize} color={iconC} />
        </div>
        {icon2 ? (
          <div style={{ position: 'absolute', inset: 0, opacity: kk }}>
            <Ion name={icon2} size={iconSize} color={iconC} />
          </div>
        ) : null}
      </div>
      {/* fase 2: o nome da tarefa, escrito pela máscara logo depois que o bloco pousa */}
      {b.label ? (
        <Mascara p={ramp(frame, dropAt + 4, 12)} modo="escreve" style={{ marginLeft: 18 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: labelSize, lineHeight: 1.1, color: textC, whiteSpace: 'nowrap' }}>{b.label}</div>
        </Mascara>
      ) : null}
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
  const width = useTextWidth();
  const named = blocks.some((b) => b.label);
  const W = named ? MAPA_NOMES.w : MAPA.w;
  const cardX = named ? (left ? MAPA_NOMES.xLeft : MAPA_NOMES.xRight) : left ? 470 : 70;
  const turnAt = at(s, pr.turn, 1e9);
  const k = ramp(frame, turnAt, 28);
  const turned = frame >= turnAt;
  const card = spr(s.lead - 8);
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
  const bw = W - 92 - 34;
  const personX = named ? (left ? MAPA_NOMES.personLeft : MAPA_NOMES.personRight) : left ? 60 : 720;
  // o nome mais largo cabe no bloco (ícone + faísca à direita), no mesmo corpo em todos
  // padding + ícone fixo (52) + respiro + faísca à direita (26 + 0,6 × 52 + folga)
  const room = bw - 30 - 52 - 18 - 76;
  const labelSize = [46, 44, 42, 40].find((f) => blocks.every((b) => width(b.label ?? '', `600 ${f}px ${FONT.display}`) <= room)) ?? 38;
  // a folha é o assunto: nenhum móvel, figurante ou canto do primeiro plano passa por ela
  // (o cenário só sobra do lado da pessoa)
  const geo: EnvGeo = { ground: 1140, clear: left ? [40, 400] : [680, 1040], spot: [personX + 150, 950, 330], busy: [[cardX - 20, MAPA.y - 20, cardX + W + 20, MAPA.y + MAPA.h + 20]] };
  const penIn = ramp(frame, turnAt - 10, 12);
  // brilho só nos blocos que PASSAM a energizar na virada (no máximo dois)
  const newBoost = laid.filter((l) => l.b.then && (l.b.then.feel ?? l.b.feel) === 'energiza' && (l.b.then.feel !== undefined || (l.b.then.size ?? 0) > (l.b.size ?? 1))).slice(0, 2);
  return (
    <Stage s={s} geo={geo} focus={{ pessoa: [personX + 150, 950], mapa: [cardX + W / 2, MAPA.y + MAPA.h / 2] }}>
      {/* a folha do dia */}
      <div
        style={{
          position: 'absolute',
          left: cardX,
          top: MAPA.y,
          width: W,
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
          <BlocoBox s={s} b={b} i={i} y={by} h={h} x={bx} w={bw} k={k} labelSize={labelSize} />
        </React.Fragment>
      ))}
      {newBoost.map((l, i) => (
        <div key={i} style={{ position: 'absolute', left: bx + bw - 190, top: l.y + l.h / 2 - 150 }}>
          <Brilho t={frame + i * 13} size={300} on={ramp(frame, turnAt + 12, 12)} />
        </div>
      ))}
      {/* a pessoa ao lado, que pega a caneta pra redesenhar o dia */}
      <div style={{ position: 'absolute', top: 760, left: personX, transform: left ? undefined : 'scaleX(-1)' }}>
        <Pessoa t={frame} size={300} mood={turned ? (pr.to ?? 'feliz') : (pr.mood ?? 'cansado')} since={turned ? frame - turnAt : frame} arms={frame >= turnAt - 10 ? 'out' : 'down'} accent={C.violet} />
        <div style={{ position: 'absolute', left: 262, top: 176, opacity: penIn, transform: `rotate(${-30 + Math.sin(frame / 5) * 6 * k}deg) scale(${0.7 + 0.3 * penIn})`, transformOrigin: '50% 90%' }}>
          <Caneta size={150} accent={C.gold} progress={0} />
        </div>
      </div>
      {useIdentity().halo ? null : (
        <div style={{ position: 'absolute', top: 700, left: personX - 50 }}>
          <Brilho t={frame} size={400} on={ramp(frame, at(s, pr.glow ?? pr.turn, 1e9) + 4, 10)} />
        </div>
      )}
      {pr.turn && (pr.to ?? 'feliz') === 'feliz' ? <Sfx at={turnAt + 8} name="chime" /> : null}
    </Stage>
  );
};

// ===================================================================== caderno
/**
 * O caderno (fase 2, "demonstrar a ideia"): a página onde o exemplo se ESCREVE. Plano fechado, sem
 * pessoa — a caneta é a mão dela. Três colunas: o NOME da tarefa (máscara que abre com a caneta na
 * ponta da tinta), o TEMPO (uma barra; nunca hora nem número) e a ENERGIA (uma pilha: fraca e fria
 * no que tira, carregando e dourada no que dá). Usa os mesmos `blocks` do mapa — o caderno e o mapa
 * contam o mesmo dia. Luz com origem: a janela da manhã cai na página em dois painéis.
 *
 * Deixas: `cue` de cada bloco (quando o nome começa a ser escrito; sem deixa, um depois do outro),
 * `from` (a coluna do tempo) e `at` (a coluna da energia).
 */
const CADERNO = { x: 50, y: 330, w: 980, h: 1010, head: 160, row: 150, nameX: 60, timeX: 490, unit: 76, energyX: 740, energyW: 210 };
const CADERNO_HEADS = { pt: ['Tarefa', 'Tempo', 'Energia'], en: ['Task', 'Time', 'Energy'] };
/** a faixa da semana no alto da página (deixa `semana`): a página é um dos dias anotados */
const CADERNO_DIAS = { pt: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] };
/** A marca de energia: seta + palavra (o neutro é só um traço — "nem tira nem dá"). */
const ENERGIA: Record<Feel, { icon: string; pt?: string; en?: string }> = {
  drena: { icon: 'arrow-down', pt: 'tira', en: 'drains' },
  neutro: { icon: 'remove' },
  energiza: { icon: 'arrow-up', pt: 'dá', en: 'fuels' },
};
/**
 * Tetos do ritmo da caneta: um nome em até ESCRITA quadros, uma barra em até BARRA, uma a cada até
 * PASSO. Quando a voz chega na coluna seguinte antes, a caneta acelera (até o piso) pra coluna
 * entrar NA deixa — a deixa da fala manda, a caneta se ajusta (revisão do piloto, 07/11).
 */
const ESCRITA = 13;
const BARRA = 9;
const PASSO = 13;
const clampN = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
/** A marca de energia em pílula: as três com o mesmo peso de leitura (o "tira" não pode sumir). */
const ENERGIA_PILULA: Record<Feel, { bg: string; edge: string; ink: string; w: number }> = {
  drena: { bg: '#2F3B5E', edge: '#46557F', ink: '#E4E6FF', w: 190 },
  neutro: { bg: 'transparent', edge: 'transparent', ink: '#C9CCF5', w: 110 },
  energiza: { bg: C.gold, edge: C.gold2, ink: C.deep, w: 190 },
};
const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

export const Caderno: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const spec = useSpec();
  const width = useTextWidth();
  const accent = useAccent();
  const pr = s.props ?? {};
  const G = CADERNO;
  const blocks = (pr.blocks ?? []).slice(0, 6);
  const heads = pr.heads ?? CADERNO_HEADS[spec.lang];
  const page = spr(s.lead - 10);
  const weekAt = pr.semana ? cue(s, pr.semana) : null;
  const n = Math.max(1, blocks.length);
  // as deixas das colunas mandam; a caneta cabe no intervalo entre elas
  const timeCue = pr.from ? cue(s, pr.from) : NaN;
  const energyCue = pr.at ? cue(s, pr.at) : NaN;
  const first = blocks[0]?.cue ? cue(s, blocks[0].cue) : s.lead + 4;
  const escrita = Number.isFinite(timeCue) ? clampN((timeCue - 4 - first) / n - 3, 7, ESCRITA) : ESCRITA;
  // cada nome começa na sua deixa ou logo depois do anterior — nunca antes de o anterior terminar
  // (deixas coladas punham as chaves da caneta fora de ordem e ela pulava de linha)
  const starts: number[] = [];
  for (const [i, b] of blocks.entries()) {
    if (!i) starts.push(first);
    else starts.push(Math.max(b.cue ? cue(s, b.cue) : 0, starts[i - 1] + escrita + 3));
  }
  const named = starts[starts.length - 1] + escrita;
  const timeAt = Number.isFinite(timeCue) ? Math.max(timeCue, named + 2) : named + 6;
  const passo = Number.isFinite(energyCue) ? clampN((energyCue - 2 - timeAt) / n, 6, PASSO) : PASSO;
  const barra = Math.min(BARRA, passo - 2);
  const barAt = (i: number) => timeAt + i * passo;
  const energyAt = Number.isFinite(energyCue) ? Math.max(energyCue, timeAt + 6) : barAt(n - 1) + barra + 6;
  // o nome mais largo cabe na coluna, no mesmo corpo em todos
  const colW = G.timeX - G.nameX - 40;
  // os nomes são escritos à mão: Fraunces itálico (fase 2); a medida usa a mesma face
  const font = (f: number) => `italic 600 ${f}px ${FONT.display}`;
  const size = [56, 52, 48, 44].find((f) => blocks.every((b) => width(b.label ?? '', font(f)) <= colW)) ?? 40;
  const rowsTop = G.y + G.head + 46;
  const rowY = (i: number) => rowsTop + i * G.row;
  const base = (i: number) => rowY(i) + G.row / 2 + size * 0.32;
  const nameW = (i: number) => Math.min(colW, width(blocks[i].label ?? '', font(size)));
  const barW = (b: Bloco) => (b.size ?? 1) * G.unit;
  // a caneta: entra, escreve cada nome na ponta da tinta, desce pro próximo, risca as barras e sai
  const keys: [number, number, number][] = [[starts[0] - 14, G.x + G.w + 120, G.y + G.h + 160]];
  blocks.forEach((b, i) => {
    keys.push([starts[i], G.x + G.nameX, base(i)], [starts[i] + escrita, G.x + G.nameX + nameW(i), base(i)]);
  });
  blocks.forEach((b, i) => {
    const mid = rowY(i) + G.row / 2 + 14;
    keys.push([barAt(i), G.x + G.timeX, mid], [barAt(i) + barra, G.x + G.timeX + barW(b), mid]);
  });
  // sai pela direita, na altura da página — nunca por baixo, que é onde mora a legenda
  keys.push([barAt(blocks.length - 1) + barra + 16, G.x + G.w + 260, rowY(Math.min(2, blocks.length - 1))]);
  let pen: [number, number] = [keys[0][1], keys[0][2]];
  for (let j = 0; j < keys.length - 1; j++) {
    const [ta, xa, ya] = keys[j];
    const [tb, xb, yb] = keys[j + 1];
    if (tb < ta) continue;
    if (frame >= ta) {
      const f = tb > ta ? (frame - ta) / (tb - ta) : 1;
      // escrevendo (mesma linha) a ponta anda reto com a tinta; entre linhas, a mão vai e assenta
      const e = ya === yb ? Math.max(0, Math.min(1, f)) : smooth(f);
      pen = [xa + (xb - xa) * e, ya + (yb - ya) * e];
    }
  }
  const penOn = ramp(frame, starts[0] - 14, 8) * (1 - sai(frame, barAt(blocks.length - 1) + barra + 4, 12));
  const PEN = 170;
  // luz da janela (manhã, do alto à direita) em dois painéis sobre a página, respirando com uma nuvem
  const luz = 0.85 + 0.15 * Math.sin(frame / 37);
  return (
    <Stage s={s} focus={{ pessoa: [540, 820], peca: [G.x + G.w / 2, rowsTop + (blocks.length * G.row) / 2] }}>
      <div style={{ position: 'absolute', left: G.x, top: G.y, width: G.w, height: G.h, opacity: page, transform: `translateY(${(1 - page) * 50}px)` }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 36,
            overflow: 'hidden',
            background: `linear-gradient(170deg, ${C.surface} 0%, ${C.base} 100%)`,
            border: `3px solid ${C.borderStrong}`,
            boxShadow: '0 34px 90px rgba(0,0,0,0.5)',
          }}
        >
          {/* pautas */}
          {blocks.map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: 40, right: 40, top: rowY(i) - G.y + G.row, height: 2, background: C.surface3 }} />
          ))}
          <div style={{ position: 'absolute', left: 40, right: 40, top: rowsTop - G.y - 2, height: 3, background: C.surface3 }} />
          {/* luz com origem: a janela cai na página (dois painéis, a sombra do batente no meio) */}
          {[0, 1].map((k) => (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: 540 + k * 210,
                top: -60,
                width: 190,
                height: 620,
                borderRadius: 24,
                background: `linear-gradient(200deg, ${C.gold2}2E 0%, ${C.gold2}10 60%, ${C.gold2}00 100%)`,
                transform: 'skewX(-22deg)',
                filter: 'blur(14px)',
                opacity: luz,
                mixBlendMode: 'screen',
              }}
            />
          ))}
        </div>
        {/* espiral do caderno */}
        {Array.from({ length: 11 }, (_, i) => (
          <React.Fragment key={i}>
            <div style={{ position: 'absolute', left: 64 + i * 82, top: 22, width: 18, height: 18, borderRadius: 9, background: C.deep }} />
            <div style={{ position: 'absolute', left: 66 + i * 82, top: -26, width: 14, height: 58, borderRadius: 7, border: `5px solid ${accent}`, borderBottomColor: 'transparent' }} />
          </React.Fragment>
        ))}
      </div>
      {/* a semana: os cinco dias sobem um atrás do outro na deixa; o de hoje fica aceso */}
      {weekAt != null
        ? CADERNO_DIAS[spec.lang].map((d, i) => {
            const on = spr(weekAt + i * 4, MOLA.pousa);
            const today = i === 0;
            return (
              <div
                key={d}
                style={{
                  position: 'absolute',
                  left: G.x + G.nameX + i * 136,
                  top: G.y + 58,
                  width: 124,
                  height: 62,
                  borderRadius: 31,
                  background: today ? accent : `${accent}1F`,
                  border: `2px solid ${today ? accent : `${accent}66`}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: Math.min(1, on * 2) * page,
                  transform: `translateY(${(1 - Math.min(1, on)) * 24}px)`,
                }}
              >
                <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 38, lineHeight: 1, letterSpacing: 2, color: today ? C.deep : accent }}>{d.toUpperCase()}</div>
              </div>
            );
          })
        : null}
      {/* títulos das colunas: cada um sobe quando a coluna começa */}
      {[
        [G.nameX, starts[0] - 6, 0],
        [G.timeX, timeAt - 6, 0],
        [G.energyX, energyAt - 6, G.energyW],
      ].map(([x, from, w], i) => (
        <div key={i} style={{ position: 'absolute', left: G.x + x, width: w || undefined, top: G.y + G.head - 22, opacity: page, display: 'flex', justifyContent: w ? 'center' : 'flex-start' }}>
          <Mascara p={spr(from, MOLA.pousa)}>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 38, letterSpacing: 4, color: '#B9BEE8', whiteSpace: 'nowrap' }}>{heads[i].toUpperCase()}</div>
          </Mascara>
        </div>
      ))}
      {blocks.map((b, i) => {
        const pop = spr(energyAt + i * 6, MOLA.pousa);
        const grow = easeOut(frame, barAt(i), barra);
        return (
          <React.Fragment key={i}>
            {/* o nome: a máscara abre na velocidade da caneta */}
            <div style={{ position: 'absolute', left: G.x + G.nameX, top: rowY(i), height: G.row, display: 'flex', alignItems: 'center' }}>
              <Mascara p={(frame - starts[i]) / escrita} modo="escreve" ponta={8}>
                <div style={{ fontFamily: FONT.display, fontStyle: 'italic', fontWeight: 600, fontSize: size, lineHeight: 1.1, color: C.hi, whiteSpace: 'nowrap' }}>{b.label}</div>
              </Mascara>
            </div>
            {/* o tempo: uma barra (quanto do dia), riscada pela caneta */}
            <div
              style={{
                position: 'absolute',
                left: G.x + G.timeX,
                top: rowY(i) + G.row / 2 - 15,
                width: barW(b) * grow,
                height: 30,
                borderRadius: 15,
                background: C.violet2,
                opacity: grow > 0 ? 1 : 0,
              }}
            />
            {/* a energia: seta + palavra, nas cores do mapa (tira = fria e apagada, dá = dourada) */}
            <div
              style={{
                position: 'absolute',
                left: G.x + G.energyX + (G.energyW - ENERGIA_PILULA[b.feel].w) / 2,
                top: rowY(i) + G.row / 2 - 40,
                width: ENERGIA_PILULA[b.feel].w,
                height: 80,
                borderRadius: 40,
                background: ENERGIA_PILULA[b.feel].bg,
                border: `3px solid ${ENERGIA_PILULA[b.feel].edge}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: Math.min(1, pop * 2),
                transform: `scale(${0.6 + 0.4 * pop})`,
                boxShadow: b.feel === 'energiza' ? `0 0 ${30 * Math.min(1, pop)}px ${C.gold}66` : 'none',
              }}
            >
              <Ion name={ENERGIA[b.feel].icon} size={44} color={ENERGIA_PILULA[b.feel].ink} />
              {ENERGIA[b.feel][spec.lang] ? (
                <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 42, lineHeight: 1, color: ENERGIA_PILULA[b.feel].ink, paddingRight: 6 }}>{ENERGIA[b.feel][spec.lang]}</div>
              ) : null}
              <Sfx at={energyAt + i * 6 + 3} name={`pop${i % 5}` as SfxName} gain={0.8} />
            </div>
          </React.Fragment>
        );
      })}
      {/* a caneta, com a ponta (≈ 11% × 95% da caixa) onde a tinta está */}
      <div
        style={{
          position: 'absolute',
          left: pen[0] - PEN * 0.11,
          top: pen[1] - PEN * 0.95,
          opacity: penOn,
          filter: 'drop-shadow(10px 18px 14px rgba(5,7,26,0.55))',
        }}
      >
        <Caneta size={PEN} accent={accent} progress={0} />
      </div>
    </Stage>
  );
};

/** 0→1 com ease-out cúbico entre `from` e `from + dur` (a barra que a caneta risca). */
const easeOut = (frame: number, from: number, dur: number) => {
  const t = Math.max(0, Math.min(1, (frame - from) / dur));
  return 1 - Math.pow(1 - t, 3);
};

// ===================================================================== verso
const IdeaCard: React.FC<{ width: number; flip: number; absorbed: boolean; words?: number[] }> = ({ width, flip, absorbed, words }) => {
  const spec = useSpec();
  const accent = useAccent();
  const frame = useCurrentFrame();
  // identidades Hexa: a frente do card é o Elenco, não a imagem gerada da ideia
  // (revisão de marca: a imagem 4:5 é gente semi-realista, o que o André descartou)
  const elencoFront = !!useIdentity().frenteElenco;
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
  // de lado no meio do giro o card "respira": encolhe 4% e a sombra chega mais perto
  const mid = Math.sin(Math.PI * Math.min(1, Math.max(0, flip)));
  const len = spec.claim.length;
  const claimSize = width * (len > 120 ? 0.066 : len > 95 ? 0.072 : 0.078);
  return (
    <div style={{ width, height, perspective: 2200, transform: `scale(${1 - 0.04 * mid})` }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateY(${flip * 180}deg)` }}>
        <div style={{ ...face, background: `linear-gradient(160deg, ${C.surface2} 0%, ${C.base} 100%)` }}>
          {elencoFront ? (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: -width * 0.02, display: 'flex', justifyContent: 'center' }}>
              <Pessoa t={frame} size={width * 0.6} mood="feliz" arms="up" since={40} accent={C.violet} />
            </div>
          ) : spec.image ? (
            <Img src={staticFile(spec.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
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
          {/* fase 2: o verso ACENDE com a voz — cada palavra sai de 30% e chega dourada no quadro em
              que a voz a diz (deixa medida na voz), depois assenta no branco */}
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: claimSize, lineHeight: 1.18, color: C.hi }}>
            {words
              ? spec.claim.split(/(\s+)/).map((tok, j, all) => {
                  // espaço antes da última palavra vira inseparável: "faz bem." nunca deixa "bem." sozinho
                  if (!tok.trim()) return j === all.length - 2 ? '\u00A0' : tok;
                  const wAt = words[Math.floor(j / 2)] ?? 0;
                  const age = frame - wAt;
                  return (
                    <span
                      key={j}
                      style={{
                        opacity: interpolate(age, [-2, 3], [0.3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                        color: interpolateColors(Math.max(0, age), [0, 5, 22], [C.gold2, C.gold2, C.hi]),
                      }}
                    >
                      {tok}
                    </span>
                  );
                })
              : spec.claim.replace(/\s+(\S+)$/, '\u00A0$1')}
          </div>
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
  const spr = useSpr();
  const spec = useSpec();
  const { fps } = useVideoConfig();
  // fase 1: o giro é mola (MOLA.vira: passa ~3° e assenta), não mais linear em 22 q parando seco
  const flip = spring({ frame: frame - (s.lead - 12), fps, config: MOLA.vira });
  const absorbed = frame > speechEnd(s) + 6;
  const L = VERSO[spec.lang];
  // o quadro em que a voz chega a cada palavra do verso (o card acende junto)
  // com `say` (ex.: número lido por extenso) a voz pode ter outra contagem de palavras: cada palavra
  // do card pega o tempo da palavra da voz na mesma posição proporcional
  const voz = wordFrames(s).map((w) => w.at);
  const nCard = spec.claim.split(/\s+/).filter(Boolean).length;
  const words = voz.length === nCard ? voz : Array.from({ length: nCard }, (_, j) => voz[Math.round((j * (voz.length - 1)) / Math.max(1, nCard - 1))] ?? 0);
  // fecho com a marca (fase 2): depois do selo, o glyph se desenha e o nome sobe ao lado
  const sela = speechEnd(s) + 26;
  const marca = spr(sela + 8, MOLA.pousa);
  return (
    <Stage s={s} kicker={s.props?.kicker ?? L.kicker} focus={{ pessoa: [540, 750] }}>
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <IdeaCard width={720} flip={flip} absorbed={absorbed} words={words} />
      </div>
      <div style={{ opacity: ramp(frame, sela, 10) }}>
        <Glyph size={176} cx={368} cy={1446} rings={ramp(frame, sela, 22)} path={ramp(frame, sela + 8, 20)} glow={1} />
      </div>
      <div style={{ position: 'absolute', left: 470, top: 1394 }}>
        <Mascara p={marca}>
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 82, lineHeight: 1.1, color: C.hi }}>Perceva</div>
        </Mascara>
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
  caderno: Caderno,
  verso: Verso,
};
