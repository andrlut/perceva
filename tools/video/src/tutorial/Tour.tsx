// Tutorial de tela: a réplica da tela dentro de um celular, com câmera,
// destaque e dedo guiados pelas deixas da voz. Mesma régua de tempo do molde
// (timings.json por fala, src/timeline.ts) e a mesma legenda queimada.
//
//   props.tourKey = "<tour>.<lang>" → public/tour/<tourKey>/spec.json (scripts/tour.mjs build)
//   props.mode = "replica" → só a tela, sem tour (folha de conferência contra o app)
import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, CalculateMetadataFunction, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Background, Rich } from '../components';
import { C } from '../theme';
import { FPS, Timing, buildTimeline, cue, plain, speechEnd } from '../timeline';
import { type Plan, beatFrame, buildPlan } from './engine';
import { Callout, CameraLayer, Finger, Spotlight, Stage } from './overlays';
import { BEZEL, PhoneBezel, SCREEN_RADIUS } from './screens/chrome';
import type { Lang } from './screens/i18n';
import { screenModule } from './screens';
import { HISTORY_START, stateAt } from './screens/types';
import type { TourScene, TourSpec } from './spec';

/** Teto do tutorial: passou disso o render falha (o roteiro pede 25–40 s). */
export const TOUR_MAX_SECONDS = 45;

export type TourProps = {
  tourKey: string;
  spec: TourSpec | null;
  scenes: TourScene[];
  /** "replica": só a tela (screen + fixture + lang + state) */
  mode?: 'tour' | 'replica';
  /** preenchido pelo calculateMetadata: o quadro de cada batida */
  marks?: TourMark[];
  /** preenchido pelo calculateMetadata: o audit do movimento (Plan.audit, engine.ts) */
  motion?: ReturnType<Plan['audit']>;
  screen?: string;
  fixture?: string;
  lang?: Lang;
  state?: Record<string, unknown>;
};

// Grade do quadro 9:16: cabeçalho em cima, palco no meio, legenda embaixo.
const HEADER_TOP = 46;
const STAGE_TOP = 176;
const STAGE_H = 1340;
const CAPTION_TOP = 1548;
const PHONE_MARGIN = 22;

export const calculateTourMetadata: CalculateMetadataFunction<TourProps> = async ({ props }) => {
  if (props.mode === 'replica') return { durationInFrames: 1, props };
  const dir = `tour/${props.tourKey}`;
  const spec: TourSpec = await (await fetch(staticFile(`${dir}/spec.json`))).json();
  const timings: Timing[] = await (await fetch(staticFile(`${dir}/${spec.silent ? 'timings.est.json' : 'timings.json'}`))).json();
  const { scenes, total } = buildTimeline(spec.lines, timings);
  if (total > TOUR_MAX_SECONDS * FPS) {
    throw new Error(`${props.tourKey}: ${(total / FPS).toFixed(1)} s passa do teto de ${TOUR_MAX_SECONDS} s — corte o roteiro`);
  }
  const ts = scenes as TourScene[];
  // as batidas em quadros: o scripts/tour.mjs tira um quadro de conferência em cada uma. O plano
  // é o mesmo do filme: dele sai, por gesto, se o toque tira a mão (lift) e de onde a mão parte
  const plan = buildPlan(spec, ts, screenModule(spec.screen), stageFor(spec.screen));
  const marks: TourMark[] = ts.flatMap((s) =>
    (s.beats ?? []).map((b) => {
      const frame = beatFrame(s, b);
      const act = b.do ? plan.actions.find((a) => a.T === frame && a.type === b.do) : undefined;
      return {
        frame,
        line: s.id,
        at: b.at,
        focus: b.focus,
        do: b.do,
        target: b.target ?? undefined,
        ...(act ? { lift: act.lifts, handFrom: act.travelStart } : {}),
      };
    }),
  );
  // o audit do movimento (engine.ts, plan.audit): mão fora do palco, mão parada perto de controle,
  // arrasto perto de controle, títulos sobrepostos — o scripts/tour.mjs mostra e o render barra
  return { durationInFrames: total, props: { ...props, spec, scenes: ts, marks, motion: plan.audit() } };
};

/**
 * Uma batida em quadros. `lift`: o toque põe outra coisa debaixo do dedo e a mão e a onda somem
 * em T+8 (TIME.LEAVE, engine.ts). `handFrom`: o quadro em que a mão começa a viajar pro gesto.
 */
export type TourMark = { frame: number; line: string; at: string; focus?: string | null; do?: string; target?: string; lift?: boolean; handFrom?: number };

const stageFor = (screen: string): Stage => {
  const d = screenModule(screen).device;
  const s0 = (STAGE_H - PHONE_MARGIN * 2) / (d.h + BEZEL * 2);
  return { x: 0, y: STAGE_TOP, w: 1080, h: STAGE_H, d, s0 };
};

// ---------------------------------------------------------------- legenda (mesma lógica de src/Captions.tsx, centrada)

const MAX = 58;
const chunk = (caption: string): string[] => {
  const out: string[] = [];
  for (const sentence of caption.split(/(?<=[.!?:])\s+/)) {
    if (plain(sentence).length <= MAX) {
      out.push(sentence);
      continue;
    }
    for (const part of sentence.split(/(?<=,)\s+/)) {
      if (plain(part).length <= MAX) {
        out.push(part);
        continue;
      }
      let mid = -1;
      for (let i = 0; i < part.length; i++) {
        if (part[i] !== ' ') continue;
        const inside = (part.slice(0, i).match(/\*/g) ?? []).length % 2 === 1;
        if (!inside && (mid < 0 || Math.abs(i - part.length / 2) < Math.abs(mid - part.length / 2))) mid = i;
      }
      out.push(part.slice(0, mid), part.slice(mid + 1));
    }
  }
  const merged: string[] = [];
  for (const c of out) {
    const prev = merged[merged.length - 1];
    if (prev !== undefined && plain(prev).length < 16 && plain(prev + ' ' + c).length <= MAX) merged[merged.length - 1] = `${prev} ${c}`;
    else merged.push(c);
  }
  return merged;
};

const TourCaptions: React.FC<{ scenes: TourScene[] }> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const scene = [...scenes].reverse().find((s) => frame >= s.start + s.lead - 2);
  if (!scene) return null;
  const local = frame - scene.start;
  const chunks = chunk(scene.caption);
  const starts = chunks.map((c, i) => (i === 0 ? scene.lead : cue(scene, plain(c).split(' ').slice(0, 2).join(' '))));
  let current = 0;
  for (let i = 0; i < chunks.length; i++) if (local >= starts[i] - 2) current = i;
  if (local > speechEnd(scene) + 14) return null;
  const t = interpolate(local - (starts[current] - 2), [0, 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', top: CAPTION_TOP, left: 64, right: 64, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          fontFamily: 'Manrope',
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.22,
          color: C.hi,
          textAlign: 'center',
          textShadow: '0 2px 18px rgba(5,7,26,0.95), 0 0 2px rgba(5,7,26,1)',
          opacity: t,
          transform: `translateY(${(1 - t) * 8}px)`,
        }}
      >
        <Rich text={chunks[current]} accent={C.gold2} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- cabeçalho

/** O título troca em sequência (engine.titleAt): o velho sobe e apaga, e só depois o novo sobe e
 *  acende — em nenhum quadro os dois aparecem juntos (sobrepostos, "Mirar" e "Gerenciar" viravam
 *  uma mancha por ~5 quadros a cada troca de fala). */
const Header: React.FC<{ kicker: string; title: { cur: string; prev: string; prevO: number; curO: number } }> = ({ kicker, title }) => {
  const line = (text: string, o: number, dy: number) => (
    <div
      style={{
        position: 'absolute',
        top: HEADER_TOP + 42,
        left: 60,
        right: 60,
        textAlign: 'center',
        fontFamily: 'Manrope',
        fontWeight: 800,
        fontSize: 56,
        lineHeight: '66px',
        letterSpacing: -0.5,
        color: C.hi,
        opacity: o,
        transform: `translateY(${dy}px)`,
      }}
    >
      {text}
    </div>
  );
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: HEADER_TOP,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Manrope',
          fontWeight: 800,
          fontSize: 27,
          letterSpacing: 7,
          color: C.gold,
        }}
      >
        {kicker.toUpperCase()}
      </div>
      {title.prev && title.prevO > 0.001 ? line(title.prev, title.prevO, -10 * (1 - title.prevO)) : null}
      {title.cur && title.curO > 0.001 ? line(title.cur, title.curO, (1 - title.curO) * 12) : null}
    </>
  );
};

// ---------------------------------------------------------------- composição

export const Tour: React.FC<TourProps> = (props) => {
  if (props.mode === 'replica') return <Replica {...props} />;
  return <TourFilm {...props} />;
};

const TourFilm: React.FC<TourProps> = ({ tourKey, spec, scenes }) => {
  const frame = useCurrentFrame();
  const stage = useMemo(() => (spec ? stageFor(spec.screen) : null), [spec]);
  const plan = useMemo(() => (spec && stage ? buildPlan(spec, scenes, screenModule(spec.screen), stage) : null), [spec, scenes, stage]);
  if (!spec || !stage || !plan) return null;
  const mod = screenModule(spec.screen);
  const { s, v, L } = plan.viewAt(frame);
  const cam = plan.camAt(frame);
  const spot = plan.spotAt(frame);
  const finger = plan.fingerAt(frame);
  const callout = plan.calloutAt(frame);
  const Screen = mod.Render;
  const d = mod.device;
  return (
    <AbsoluteFill style={{ backgroundColor: C.deep }}>
      <Background />
      <Header kicker={spec.kicker} title={plan.titleAt(frame)} />
      <CameraLayer st={stage} cam={cam}>
        <PhoneBezel d={d} />
        <div style={{ position: 'absolute', left: 0, top: 0, width: d.w, height: d.h, borderRadius: SCREEN_RADIUS, overflow: 'hidden' }}>
          <Screen s={s} v={v} L={L} ctx={plan.ctx} pressed={plan.pressedAt(frame)} />
        </div>
        <Spotlight layers={spot.layers} dim={spot.dim} k={cam.k} d={d} />
      </CameraLayer>
      {callout ? <Callout target={callout.rect} text={callout.text} t={callout.t} bounds={{ top: STAGE_TOP, bottom: STAGE_TOP + STAGE_H }} /> : null}
      {finger ? <Finger {...finger} /> : null}
      <TourCaptions scenes={scenes} />
      {spec.silent
        ? null
        : scenes.map((sc) => (
            <Sequence key={sc.id} from={sc.start + sc.lead} durationInFrames={sc.speech + 30} name={`voz:${sc.id}`}>
              <Audio src={staticFile(`tour/${tourKey}/${sc.id}.mp3`)} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};

/** Só a tela, do tamanho do quadro — pra comparar com o print do app. */
const Replica: React.FC<TourProps> = ({ screen = 'rewards', fixture = 'inicio', lang = 'pt', state = {} }) => {
  const mod = screenModule(screen);
  const ctx = mod.makeCtx({ fixture, lang });
  const s = mod.initial(ctx, state);
  const h = [{ frame: HISTORY_START, state: s }];
  const v = mod.view(h, 0);
  const L = mod.layout(stateAt(h, 0), v, ctx, h, 0);
  const d = mod.device;
  const k = Math.min(1080 / d.w, 1920 / d.h);
  const Screen = mod.Render;
  return (
    <AbsoluteFill style={{ backgroundColor: '#05071A' }}>
      <div
        style={{
          position: 'absolute',
          left: (1080 - d.w * k) / 2,
          top: (1920 - d.h * k) / 2,
          width: d.w,
          height: d.h,
          transformOrigin: '0 0',
          transform: `scale(${k})`,
        }}
      >
        <Screen s={s} v={v} L={L} ctx={ctx} pressed={null} />
      </div>
    </AbsoluteFill>
  );
};
