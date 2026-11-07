// Passagens entre cenas do molde. Todas cabem no mesmo crossfade de FADE
// frames do timeline (a duração do vídeo não muda com a passagem escolhida).
//  - fade     a de sempre: a cena nova aparece por cima da antiga
//  - zoom     atravessa: a antiga cresce um pouco, a nova chega de longe
//  - desliza  a câmera continua andando: a antiga sai pro lado, a nova entra do outro
//  - corte    seco, no meio do crossfade (só quando o roteiro pede)
//  - hexa     (v4) atravessa pelo hexágono: a antiga cresce rumo ao centro e a nova
//             nasce de dentro de um hexágono que se abre, com aro dourado — a marca
//             como passagem (pesquisa: o hexágono como motivo de continuidade)
//  - chicote  (v4) whip pan: as duas cenas correm juntas pro lado, coladas, com
//             desfoque só na horizontal no pico do movimento
import React, { useId } from 'react';
import { AbsoluteFill, Easing } from 'remotion';
import { C } from '../theme';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import type { CameraSpec, Transicao } from './spec';

type TP = { kind: Transicao; dir: 1 | -1 };

// hexágono em pé (o radar do app), em px do quadro 1080×1920. Nasce ABAIXO da altura
// dos rostos (y 1100: peito, mesa, chão) — no centro do quadro ele abria em cima da
// bochecha da protagonista, como tapa-olho (revisão v4)
const HEX_C: [number, number] = [540, 1100];
const hexPts2 = (r: number) =>
  [-90, -30, 30, 90, 150, 210].map((a) => {
    const t = (a * Math.PI) / 180;
    return [HEX_C[0] + Math.cos(t) * r, HEX_C[1] + Math.sin(t) * r] as const;
  });
const hexClip = (r: number) => `polygon(${hexPts2(r).map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`;
const hexPath = (r: number) => hexPts2(r).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + 'Z';
// raio que acelera (abre como porta) e cobre os cantos (≈1414 px) por volta de p 0,88
const hexR = (p: number) => 60 + 1700 * Math.pow(p, 1.6);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
// fundo opaco DENTRO de cada cena que passa: sem ele, onde a cena é transparente a outra aparece (dupla exposição)
const FUNDO = `linear-gradient(180deg, ${C.base} 0%, ${C.deep} 100%)`;

const Hexa: React.FC<{ entering: boolean; p: number; children: React.ReactNode }> = ({ entering, p, children }) => {
  if (!entering) {
    const e = Easing.in(Easing.cubic)(p);
    // a antiga fica até o hexágono quase cobrir os cantos; o título dela é coberto pelo
    // hexágono (topo a ~900 px do centro) antes de qualquer título novo aparecer fora dele
    const fade = 1 - clamp01((p - 0.72) / 0.2);
    // a faixa do título (topo) da antiga apaga antes de o hexágono chegar lá em cima: perto do
    // vértice de cima o hexágono é estreito e as pontas do título velho escapavam ao lado do novo
    const top = clamp01((p - 0.35) / 0.25);
    const mask = `linear-gradient(180deg, rgba(0,0,0,${(1 - top).toFixed(3)}) 0px, rgba(0,0,0,${(1 - top).toFixed(3)}) 330px, #000 460px)`;
    return (
      <AbsoluteFill
        style={{
          opacity: fade,
          transform: `scale(${1 + 0.35 * e})`,
          transformOrigin: `${HEX_C[0]}px ${HEX_C[1]}px`,
          filter: `blur(${(4 * e).toFixed(2)}px)`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  const r = hexR(p);
  return (
    <AbsoluteFill>
      {/* o recorte num invólucro SEM escala (antes a cena vazava do aro); só o miolo assenta */}
      <AbsoluteFill style={{ clipPath: hexClip(r), background: FUNDO }}>
        <AbsoluteFill style={{ transform: `scale(${1.1 - 0.1 * p})`, transformOrigin: `${HEX_C[0]}px ${HEX_C[1]}px` }}>{children}</AbsoluteFill>
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* o aro dourado some antes do hexágono passar das bordas (não fica risco nos cantos) */}
        <path d={hexPath(r)} fill="none" stroke={C.gold} strokeWidth={12 - 7 * p} strokeLinejoin="round" opacity={Math.pow(Math.max(0, 1 - p / 0.75), 1.3)} />
      </svg>
    </AbsoluteFill>
  );
};

// curva do chicote e a velocidade dela (o desfoque segue a velocidade, não um seno fixo)
const WHIP = Easing.bezier(0.6, 0, 0.35, 1);
const whipV = (p: number) => (WHIP(Math.min(1, p + 0.02)) - WHIP(Math.max(0, p - 0.02))) / 0.04;
const WHIP_VMAX = Math.max(...Array.from({ length: 51 }, (_, i) => whipV(i / 50)));

const Chicote: React.FC<{ entering: boolean; p: number; dir: 1 | -1; children: React.ReactNode }> = ({ entering, p, dir, children }) => {
  const id = 'ch' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const e = WHIP(p);
  // as duas cenas coladas: a nova vem exatamente atrás da borda da antiga
  const x = entering ? dir * 1080 * (1 - e) : -dir * 1080 * e;
  // desfoque já no 1º quadro (piso de 18 px) e no pico com a velocidade
  const blur = 18 + 62 * (whipV(p) / WHIP_VMAX);
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id} x="0%" y="0%" width="100%" height="100%">
          <feGaussianBlur stdDeviation={`${blur.toFixed(1)} 0`} edgeMode="duplicate" />
        </filter>
      </svg>
      {/* cada cena recortada no PRÓPRIO quadro de 1080 px (o cenário desenhado além da borda não vaza) e opaca */}
      <AbsoluteFill style={{ transform: `translateX(${x.toFixed(1)}px)`, overflow: 'hidden', background: FUNDO, filter: `url(#${id})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const Passagem: React.FC<TransitionPresentationComponentProps<TP>> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const entering = presentationDirection === 'entering';
  if (passedProps.kind === 'hexa') return <Hexa entering={entering} p={presentationProgress}>{children}</Hexa>;
  if (passedProps.kind === 'chicote') return <Chicote entering={entering} p={presentationProgress} dir={passedProps.dir}>{children}</Chicote>;
  const e = Easing.inOut(Easing.cubic)(presentationProgress);
  const p = presentationProgress;
  let style: React.CSSProperties = {};
  // nunca abaixo de scale 1: a borda do quadro não pode aparecer no meio da passagem.
  // v4.1: a antiga SAI enquanto a nova entra (mergulho curto): no crossfade cheio, títulos,
  // rostos e rótulos das duas cenas ficavam sobrepostos por ~8 quadros (revisão v4)
  switch (passedProps.kind) {
    case 'zoom':
      style = entering
        ? { opacity: clamp01((p - 0.3) / 0.6), transform: `scale(${1 + 0.08 * (1 - e)})` }
        : { opacity: 1 - clamp01((p - 0.1) / 0.5), transform: `scale(${1 + 0.08 * e})` };
      break;
    case 'desliza':
      // o zoom de 16% cobre os 80 px de deslize (sobra ~86 px de cada lado)
      style = entering
        ? { opacity: clamp01((p - 0.2) / 0.55), transform: `translateX(${passedProps.dir * 80 * (1 - e)}px) scale(${1 + 0.16 * (1 - e)})` }
        : { opacity: 1 - clamp01((p - 0.15) / 0.5), transform: `translateX(${-passedProps.dir * 80 * e}px) scale(${1 + 0.16 * e})` };
      break;
    case 'corte':
      style = entering ? { opacity: presentationProgress >= 0.5 ? 1 : 0 } : {};
      break;
    default:
      // fade = mergulho: a antiga apaga na 1ª metade, a nova acende na 2ª
      style = entering ? { opacity: clamp01((p - 0.42) / 0.58) } : { opacity: 1 - clamp01(p / 0.58) };
  }
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/**
 * A passagem PRA esta cena: a que o roteiro pediu (`transicao`), senão uma que
 * acompanha a câmera (pan → desliza no mesmo sentido; push/pull/drift → zoom),
 * senão o fade de sempre.
 */
/** A passagem que vale pra esta cena (a pedida, a que acompanha a câmera, ou fade). */
export const passagemKind = (transicao: Transicao | undefined, cam: CameraSpec | undefined): Transicao =>
  transicao ?? (cam && cam.move !== 'still' ? (cam.move.startsWith('pan') ? 'desliza' : 'zoom') : 'fade');

export const passagem = (transicao: Transicao | undefined, cam: CameraSpec | undefined): TransitionPresentation<TP> => {
  const kind = passagemKind(transicao, cam);
  const dir: 1 | -1 = cam?.move === 'pan-left' ? -1 : 1;
  return { component: Passagem, props: { kind, dir } };
};
