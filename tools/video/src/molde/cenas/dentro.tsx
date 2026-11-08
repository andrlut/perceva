// Cena `dentro` (fase 3): o que acontece DENTRO do corpo, mostrado em vez de dito.
//
//  - plano `corpo`: ela grande, de frente, e em 10 q a roupa vira vidro (tronco, braços, pernas; a
//    cabeça e o pescoço ficam intactos e piscando). Por dentro, um mapa em meio-tom (coração, estômago
//    e intestino, vasos, fusos dos músculos). Fluxos de partículas nascem na `origem` e andam por
//    rotas fixas até a região, acendendo o caminho atrás. Com `divide`, antes da deixa as cores giram
//    juntas num fio só; na deixa o fio se abre num caminho por fluxo. As `regioes` acendem (85% da cor,
//    brilho macio, sem raio) ou fecham um `anel` em volta da cabeça, cada uma com o rótulo e a seta.
//    `lente` abre sobre uma região (callout ao lado do corpo, nunca em cima do rosto; `cresce` enche
//    a tela) e `reserva` faz o tanque crescer do músculo até encher o palco — nos dois, o corpo apaga
//    pra 30% e os rótulos das regiões saem.
//  - plano `lupa`: ela num lugar, com a peça e a ação; na deixa da lente ela desliza pro canto de
//    baixo à esquerda, o lugar escurece e a lente grande abre da âncora (a peça da mão ou a parte do
//    corpo, seguida a cada quadro). Com `fecha`, ela volta pro centro e o véu sai.
//
// Contrato: design.json → synth.blocks "dentro", com os cortes do PLANO-FINAL (efeitos só `acende` e
// `anel`, sem lapso) e as correções da crítica (músculo não pulsa; rótulo não cai no rosto nem na
// lente). Régua do parceiro: nada de raio, chama, bateria, rastro ou número.
//
// Ciclo de import: este arquivo importa do ../scenes e o scenes.tsx importa este. Só use o que vem
// de ../scenes DENTRO do componente (nunca no topo do módulo).
import React, { useId } from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MOLA, ramp } from '../../components';
import { Brilho } from '../../elenco/cast';
import { Ator, maoNaTela, pontoNaTela, poseDe } from '../../elenco/acao';
import { Reservatorio, reservaAt } from '../../elenco/reservatorio';
import { useIdentity } from '../../identidade/context';
import { CORPO, SKINS, type Pose } from '../../identidade/types';
import { C, dimColor } from '../../theme';
import { cue, speechEnd } from '../../timeline';
import { faceAt, type EnvGeo, type Rect } from '../ambientes';
import { Lente, lenteRect } from '../lente';
import { pieceBox } from '../Peca';
import { Rotulos, discoRects, type Ocupa } from '../rotulo';
import { Stage, at, useAccent, useSpec, type MS } from '../scenes';
import { Sfx } from '../sfx';
import type { CorFluxo, Mood, Regiao, RegiaoFx, RotuloSpec, SceneProps } from '../spec';

type Box = { left: number; top: number; size: number };
type Pt = [number, number];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const corDe = (c: CorFluxo | undefined, fallback: string) => (!c ? fallback : c === 'ouro' ? C.gold : dimColor(c));

// =====================================================================================================
// o corpo (unidades da caixa 200×260 da identidade)

/** Plano corpo: pés em 1200, centro x 540, caixa de 858 px de altura (size 660). */
const CORPO_SIZE = 660;
const CORPO_X = 540;
const CORPO_PES = 1200;
/** Braços [esq, dir] no plano corpo: abertos o bastante pra o vaso e o fuso lerem fora do tronco. */
const ANG: [number, number] = [16, -16];
/** Contorno do vidro, em px. */
const BORDA = 8;
/** O vidro: rgba(14,18,48,0.86) sobre a roupa violeta, já composto (opaco: o contorno fica limpo). */
const VIDRO = '#1C1C4D';
const VIDRO_TOPO = '#262761';
/** O mapa de dentro antes de acender. */
const MEIO = C.mid;

/**
 * A respiração e o sobe-desce do tronco do Hexa Limpo (`lifeOf` em identidade/options/hexa.tsx), pra
 * o vidro andar junto com a roupa que ele cobre. As pernas não respiram (como no Hexa).
 */
type Vida = { sx: number; sy: number; lift: number };
const vida = (t: number, seed: number, mood: Mood, since: number): Vida => {
  const breath = Math.sin((t + seed * 13) / 17);
  const hop = mood === 'feliz' && since < 16 ? -7 * Math.sin((Math.PI * since) / 16) : 0;
  const slump = mood === 'cansado' ? 2.2 * clamp01(since / 10) : 0;
  const land = mood === 'feliz' && since >= 14 && since < 22 ? Math.sin((Math.PI * (since - 14)) / 8) : 0;
  return { sx: 1 - 0.006 * breath + 0.05 * land, sy: 1 + 0.014 * breath - 0.06 * land, lift: hop + slump + Math.sin((t + seed * 11) / 14) * 1.4 };
};
const vidaT = (v: Vida) => `translate(100 244) scale(${v.sx.toFixed(5)} ${v.sy.toFixed(5)}) translate(-100 -244) translate(0 ${v.lift.toFixed(3)})`;

/** Em que pedaço do corpo um ponto mora: T = tronco (respira), L/R = braço (gira no ombro), S = pernas (paradas). */
type Fr = 'T' | 'L' | 'R' | 'S';
type W = [Fr, number, number];

/** Um ponto do corpo (no pedaço `f`) na tela. */
const toTela = ([f, x0, y0]: W, v: Vida, box: Box): Pt => {
  let x = x0;
  let y = y0;
  if (f === 'L' || f === 'R') {
    const i = f === 'L' ? 0 : 1;
    const [px, py] = CORPO.ombro[i];
    const a = (ANG[i] * Math.PI) / 180;
    const dx = x - px;
    const dy = y - py;
    x = px + dx * Math.cos(a) - dy * Math.sin(a);
    y = py + dx * Math.sin(a) + dy * Math.cos(a);
  }
  if (f !== 'S') {
    y += v.lift;
    x = 100 + (x - 100) * v.sx;
    y = 244 + (y - 244) * v.sy;
  }
  const k = box.size / 200;
  return [box.left + x * k, box.top + y * k];
};

/** Polígono com cantos arredondados (o tronco do Hexa: CORPO.tronco com os raios do desenho). */
const roundPoly = (pts: Pt[], r: number[]) => {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ra = Math.min(r[i], da / 2);
    const rb = Math.min(r[i], db / 2);
    const p1 = [p[0] + ((a[0] - p[0]) * ra) / da, p[1] + ((a[1] - p[1]) * ra) / da];
    const p2 = [p[0] + ((b[0] - p[0]) * rb) / db, p[1] + ((b[1] - p[1]) * rb) / db];
    d += `${i ? 'L' : 'M'}${p1[0].toFixed(2)} ${p1[1].toFixed(2)} Q${p[0]} ${p[1]} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;
  }
  return d + 'Z';
};
const TORSO_D = roundPoly(CORPO.tronco, [8, 8, 16, 8, 8, 16]);

/** As partes que viram vidro, com uma tinta só (o vidro desenha duas vezes: contorno e corpo). */
const Partes: React.FC<{ v: Vida; fill: string; stroke?: string; sw?: number }> = ({ v, fill, stroke, sw }) => {
  const paint = { fill, stroke, strokeWidth: sw, strokeLinejoin: 'round' as const };
  return (
    <>
      <rect x={71.5} y={209.5} width={26} height={36} rx={9.5} {...paint} />
      <rect x={102.5} y={209.5} width={26} height={36} rx={9.5} {...paint} />
      <rect x={65.5} y={237.5} width={34} height={15} rx={7} {...paint} />
      <rect x={100.5} y={237.5} width={34} height={15} rx={7} {...paint} />
      <g transform={vidaT(v)}>
        <g transform={`rotate(${ANG[0]} 58 158)`}>
          <rect x={47.5} y={150.5} width={21} height={70} rx={10.5} {...paint} />
        </g>
        <path d={TORSO_D} {...paint} />
        <g transform={`rotate(${ANG[1]} 142 158)`}>
          <rect x={131.5} y={150.5} width={21} height={70} rx={10.5} {...paint} />
        </g>
      </g>
    </>
  );
};

// ---------------------------------------------------------------- o mapa de dentro

const VASOS = {
  T: ['M112 178 Q90 160 64 161', 'M112 178 Q126 162 136 163', 'M112 182 Q104 198 100 206 Q93 212 86 220', 'M100 206 Q107 212 114 220', 'M112 172 Q104 160 100 150'],
  L: 'M58 164 Q61 186 58 208',
  R: 'M142 164 Q139 186 142 208',
  S: ['M85 220 L85 247', 'M115 220 L115 247'],
};
const fuso = (x: number, y0: number, y1: number, w: number) => `M${x} ${y0} Q${x + w} ${(y0 + y1) / 2} ${x} ${y1} Q${x - w} ${(y0 + y1) / 2} ${x} ${y0}Z`;
const MUSC = { L: fuso(58, 164, 196, 7), R: fuso(142, 164, 196, 7), S: [fuso(84.5, 214, 240, 7), fuso(115.5, 214, 240, 7)] };
const CORACAO = 'M112 184 C103 178 100.5 173 103.5 169.3 C106 166.5 110.4 167.2 112 170.4 C113.6 167.2 118 166.5 120.5 169.3 C123.5 173 121 178 112 184Z';
const ESTOMAGO = 'M83 193 Q84 186 92 187 Q101 188 104 194 Q106 200 99 203 Q90 205 86 200 Q82 197 83 193Z';
const INTESTINO = 'M86 208.5 Q93 204.5 100 208.5 T114 208.5 Q118.5 212 113.5 215 Q106.5 218.5 100 214.5 T86.5 215.5 Q83 219 90 220.5 Q100 222 112 220';

/** O desenho de uma região, numa cor (sem região = nada; cabeça, rosto, boca e pele moram fora do mapa). */
const Orgaos: React.FC<{ r: Regiao; v: Vida; cor: string }> = ({ r, v, cor }) => {
  const T = (el: React.ReactNode) => <g transform={vidaT(v)}>{el}</g>;
  const A = (i: 0 | 1, el: React.ReactNode) => T(<g transform={`rotate(${ANG[i]} ${CORPO.ombro[i][0]} 158)`}>{el}</g>);
  const linha = { stroke: cor, strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round' as const };
  const vasos = (arms: boolean, trunk: boolean, legs: boolean) => (
    <g {...linha}>
      {trunk ? T(VASOS.T.map((d) => <path key={d} d={d} />)) : null}
      {arms ? A(0, <path d={VASOS.L} />) : null}
      {arms ? A(1, <path d={VASOS.R} />) : null}
      {legs ? VASOS.S.map((d) => <path key={d} d={d} />) : null}
    </g>
  );
  const musc = (arms: boolean, legs: boolean) => (
    <g fill={cor}>
      {arms ? A(0, <path d={MUSC.L} />) : null}
      {arms ? A(1, <path d={MUSC.R} />) : null}
      {legs ? MUSC.S.map((d) => <path key={d} d={d} />) : null}
    </g>
  );
  switch (r) {
    case 'vasos':
      return vasos(true, true, true);
    case 'musculos':
      return musc(true, true);
    case 'braco':
      return (
        <>
          {musc(true, false)}
          {vasos(true, false, false)}
        </>
      );
    case 'perna':
      return (
        <>
          {musc(false, true)}
          {vasos(false, false, true)}
        </>
      );
    case 'peito':
      return T(<path d={CORACAO} fill={cor} />);
    case 'barriga':
      return T(
        <>
          <path d={ESTOMAGO} fill={cor} />
          <path d={INTESTINO} stroke={cor} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </>,
      );
    case 'tronco':
      return T(<ellipse cx={100} cy={188} rx={30} ry={24} fill={cor} />);
    default:
      return null;
  }
};
/** O que o mapa mostra em meio-tom desde o começo. */
const MAPA: Regiao[] = ['vasos', 'musculos', 'peito', 'barriga'];

// ---------------------------------------------------------------- rotas dos fluxos

const ORIGEM: Record<NonNullable<SceneProps['origem']>, W> = { tronco: ['T', 100, 186], barriga: ['T', 100, 206], boca: ['T', 100, 121] };
/** Onde o fio único se abre (com `divide`): o meio do peito; da boca, a base do pescoço. */
const JUNTA: Record<NonNullable<SceneProps['origem']>, W> = { tronco: ['T', 100, 166], barriga: ['T', 100, 170], boca: ['T', 100, 156] };
/** Os caminhos de cada região, a partir do ponto de saída (a origem ou a junta). Vários = um por ramo. */
const RAMOS: Record<Regiao, W[][]> = {
  vasos: [
    [['T', 112, 178], ['T', 88, 163], ['T', 66, 161], ['L', 58, 170], ['L', 58, 207]],
    [['T', 112, 178], ['T', 128, 163], ['R', 142, 166], ['R', 142, 207]],
    [['T', 112, 182], ['T', 104, 200], ['T', 90, 214], ['S', 85, 224], ['S', 85, 247]],
    [['T', 112, 182], ['T', 106, 202], ['T', 112, 214], ['S', 115, 224], ['S', 115, 247]],
  ],
  musculos: [
    [['T', 84, 166], ['L', 58, 166], ['L', 58, 181]],
    [['T', 116, 166], ['R', 142, 166], ['R', 142, 181]],
    [['T', 92, 212], ['S', 84.5, 220], ['S', 84.5, 228]],
    [['T', 108, 212], ['S', 115.5, 220], ['S', 115.5, 228]],
  ],
  braco: [
    [['T', 84, 166], ['L', 58, 166], ['L', 58, 205]],
    [['T', 116, 166], ['R', 142, 166], ['R', 142, 205]],
  ],
  perna: [
    [['T', 92, 212], ['S', 85, 224], ['S', 85, 246]],
    [['T', 108, 212], ['S', 115, 224], ['S', 115, 246]],
  ],
  cabeca: [[['T', 100, 154], ['T', 100, 144], ['T', 100, 134]]],
  rosto: [[['T', 100, 154], ['T', 100, 144], ['T', 100, 134]]],
  boca: [[['T', 100, 152], ['T', 100, 128]]],
  peito: [[['T', 112, 176]]],
  barriga: [[['T', 94, 198]]],
  tronco: [[['T', 86, 182], ['T', 100, 172], ['T', 114, 182], ['T', 100, 192]]],
  pele: [
    [['T', 74, 186], ['T', 52, 192]],
    [['T', 126, 186], ['T', 148, 192]],
  ],
};

/** Onde a seta de cada região aponta, do lado esquerdo e do direito (o rótulo fica do lado da seta). */
const ALVO: Record<Regiao, { L: W; R: W }> = {
  vasos: { L: ['L', 58, 196], R: ['R', 142, 196] },
  musculos: { L: ['L', 58, 180], R: ['R', 142, 180] },
  braco: { L: ['L', 58, 190], R: ['R', 142, 190] },
  perna: { L: ['S', 85, 234], R: ['S', 115, 234] },
  cabeca: { L: ['T', 46, 90], R: ['T', 154, 90] },
  rosto: { L: ['T', 74, 106], R: ['T', 124, 106] },
  boca: { L: ['T', 94, 119], R: ['T', 106, 119] },
  peito: { L: ['T', 110, 176], R: ['T', 114, 176] },
  barriga: { L: ['T', 90, 198], R: ['T', 104, 210] },
  tronco: { L: ['T', 92, 188], R: ['T', 108, 188] },
  pele: { L: ['T', 48, 190], R: ['T', 152, 190] },
};

type Trilho = { pts: Pt[]; cum: number[]; len: number };
const trilho = (pts: Pt[]): Trilho => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
};
/** Ponto a `d` px do começo do trilho, e a direção (rad). */
const noTrilho = (tr: Trilho, d: number): { p: Pt; ang: number } => {
  const dd = Math.max(0, Math.min(tr.len, d));
  let i = 1;
  while (i < tr.pts.length - 1 && tr.cum[i] < dd) i++;
  const a = tr.pts[i - 1];
  const b = tr.pts[i] ?? a;
  const seg = Math.max(1e-6, tr.cum[i] - tr.cum[i - 1]);
  const k = (dd - tr.cum[i - 1]) / seg;
  return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
};
const pathOf = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

/** Velocidade das partículas (px por quadro) e o intervalo entre duas no mesmo ramo. */
const VEL = { ponto: 7, grao: 5.5 };
const GAP = { ponto: 6, grao: 9 };

const Particula: React.FC<{ p: Pt; ang: number; forma: 'ponto' | 'grao'; cor: string; o: number; sc: number }> = ({ p, ang, forma, cor, o, sc }) =>
  forma === 'grao' ? (
    <g transform={`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${((ang * 180) / Math.PI).toFixed(1)}) scale(${sc.toFixed(3)})`} opacity={o}>
      <rect x={-12} y={-9} width={24} height={18} rx={9} fill={cor} opacity={0.22} />
      <rect x={-9} y={-6} width={18} height={12} rx={6} fill={cor} />
      <rect x={-9} y={0} width={18} height={6} rx={3} fill="rgba(10,14,38,0.22)" />
      <rect x={-5} y={-4} width={7} height={2.6} rx={1.3} fill="#FFFFFF" opacity={0.55} />
    </g>
  ) : (
    <g transform={`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) scale(${sc.toFixed(3)})`} opacity={o}>
      <circle r={16} fill={cor} opacity={0.2} />
      <circle r={9} fill={cor} />
      <circle cx={-3} cy={-3} r={2.8} fill="#FFFFFF" opacity={0.6} />
    </g>
  );

// =====================================================================================================

export const Dentro: React.FC<{ s: MS }> = ({ s }) => {
  const pr = s.props ?? {};
  return pr.plano === 'lupa' ? <Lupa s={s} /> : <Corpo s={s} />;
};

/** Humor da cena (com a virada `turn`/`to`) e quantos quadros desde que ele começou. */
const useHumor = (s: MS) => {
  const frame = useCurrentFrame();
  const pr = s.props ?? {};
  const turnAt = at(s, pr.turn, 1e9);
  const turned = frame >= turnAt;
  const mood: Mood = turned ? (pr.to ?? 'feliz') : (pr.mood ?? 'ok');
  return { mood, since: pr.turn && turned ? frame - turnAt : frame, turnAt, positive: !!pr.turn && (pr.to ?? 'feliz') === 'feliz' };
};

// ===================================================================== plano corpo
const Corpo: React.FC<{ s: MS }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = useAccent();
  const spec = useSpec();
  const uid = 'dn' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const idHalo = !!useIdentity().halo;
  const pr = s.props ?? {};
  const { mood, since, turnAt, positive } = useHumor(s);
  const who = { seed: spec.protagonista?.seed ?? 0, skin: spec.protagonista?.skin };
  const pele = who.skin ?? SKINS[0];
  const box: Box = { left: CORPO_X - CORPO_SIZE / 2, top: CORPO_PES - CORPO_SIZE * 1.26, size: CORPO_SIZE };
  const k = CORPO_SIZE / 200;
  const v = vida(frame, who.seed, mood, since);
  const tela = (w: W) => toTela(w, v, box);
  const pose: Pose = { braco: ANG };

  // a roupa vira vidro em 10 q, logo que a cena entra
  const vidro = ramp(frame, Math.max(2, s.lead - 2), 10);

  // ------------------------------------------------ regiões: quanto cada uma acendeu, e em que cor
  const fluxos = (pr.fluxos ?? []).slice(0, 3);
  const regioes = (pr.regioes ?? []).slice(0, 3);
  const corRegiao = (rg: RegiaoFx) => corDe(rg.cor ?? fluxos.find((f) => f.para === rg.parte)?.cor, accent);
  const luz: Partial<Record<Regiao, { k: number; cor: string }>> = {};
  for (const rg of regioes) {
    if (rg.efeito === 'anel') continue;
    const kk = ramp(frame, at(s, rg.cue, 1e9), 12);
    if (kk > (luz[rg.parte]?.k ?? 0)) luz[rg.parte] = { k: kk, cor: corRegiao(rg) };
  }
  const anel = regioes.find((rg) => rg.efeito === 'anel');
  const anelAt = anel ? at(s, anel.cue, 1e9) : 1e9;
  const anelK = anel ? clamp01(spring({ frame: frame - anelAt, fps, config: MOLA.pousa })) : 0;

  // ------------------------------------------------ lente, reserva: o corpo apaga e os rótulos das regiões saem
  const lente = pr.lente;
  const grande = lente?.tamanho === 'grande';
  const lenteSobre: Regiao = lente && lente.sobre !== 'peca' ? lente.sobre : 'braco';
  const ancoraLente = tela(ALVO[lenteSobre].R);
  const centro: Pt = grande ? [540, 760] : [ancoraLente[0] < 540 ? 204 : 876, 600];
  const diam = grande ? 760 : 364;
  const reserva = pr.reserva;
  const reservaCues = reserva ? [...reserva.nivel.map((n) => n.cue), ...(reserva.gasta ?? []).map((g) => g.cue), ...(reserva.pinga ?? []).map((g) => g.cue), reserva.rotulo?.cue].filter((c): c is string => !!c) : [];
  const reservaCue = reservaCues.length ? reservaCues.reduce((a, b) => (cue(s, b) < cue(s, a) ? b : a)) : undefined;
  const apagaCue = lente ? (grande ? lente.cue : lente.cresce) : reservaCue;
  const apagaAt = lente && grande && !lente.cue ? -1e9 : at(s, apagaCue, 1e9);
  const apaga = ramp(frame, apagaAt, 14);
  const corpoO = 1 - 0.7 * apaga;

  // ------------------------------------------------ fluxos
  const origem = pr.origem ?? 'tronco';
  const O = tela(ORIGEM[origem]);
  const divide = pr.divide && fluxos.length >= 2 ? at(s, pr.divide, 1e9) : null;
  const D = tela(JUNTA[origem]);
  const inicioDe = (i: number) => at(s, fluxos[i].cue, s.lead + 10);
  const fioAt = divide !== null ? Math.min(...fluxos.map((_, i) => inicioDe(i))) : 0;
  const tronco = trilho([O, D]);
  const fim = s.frames;
  const pathsEl: React.ReactNode[] = [];
  const partsEl: React.ReactNode[] = [];
  fluxos.forEach((fx, j) => {
    const cor = corDe(fx.cor ?? 'ouro', C.gold);
    const forma = fx.particula ?? (fx.cor === 'ouro' || !fx.cor ? 'grao' : 'ponto');
    const vel = VEL[forma];
    const gap = GAP[forma];
    const ramos = RAMOS[fx.para].map((r) => r.map(tela));
    const t0 = divide !== null ? fioAt : inicioDe(j);
    const rotas = ramos.map((r) => trilho(divide !== null ? [O, D, ...r] : [O, ...r]));
    // quando a região acende, o caminho cede: o órgão aceso passa a contar a história
    const acesa = Math.max(luz[fx.para]?.k ?? 0, anel?.parte === fx.para ? anelK : 0);
    const trilhoO = 0.3 * (1 - 0.65 * acesa);
    // o caminho acende atrás das partículas (30% da cor); com divide, o fio comum é desenhado à parte
    ramos.forEach((r, b) => {
      if (divide !== null) {
        const ramo = trilho([D, ...r]);
        const rev = clamp01(((frame - divide) * vel) / ramo.len) * ramo.len;
        if (rev > 0) pathsEl.push(<path key={`p${j}-${b}`} d={pathOf(ramo.pts)} stroke={cor} strokeOpacity={trilhoO} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${rev.toFixed(1)} ${ramo.len + 10}`} />);
      } else {
        const rota = rotas[b];
        const first = t0 + b * gap + (j * gap) / Math.max(1, fluxos.length);
        const rev = clamp01(((frame - first) * vel) / rota.len) * rota.len;
        if (rev > 0) pathsEl.push(<path key={`p${j}-${b}`} d={pathOf(rota.pts)} stroke={cor} strokeOpacity={trilhoO} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${rev.toFixed(1)} ${rota.len + 10}`} />);
      }
    });
    // as partículas: uma a cada `gap` quadros, ramo a ramo
    const phase = (j * gap) / Math.max(1, fluxos.length);
    const maxLife = Math.max(...rotas.map((r) => r.len)) / vel + 2;
    const iLast = Math.floor((Math.min(frame, fim) - t0 - phase) / gap);
    const iFirst = Math.max(0, Math.floor((frame - t0 - phase - maxLife) / gap));
    for (let i = iFirst; i <= iLast; i++) {
      const born = t0 + phase + i * gap;
      const d = (frame - born) * vel;
      if (d < 0) continue;
      const rota = rotas[i % rotas.length];
      // com divide: quem chegou na junta antes da deixa some ali (o fio ainda não se abriu)
      const morreNaJunta = divide !== null && born + tronco.len / vel < divide;
      const limite = morreNaJunta ? tronco.len : rota.len;
      if (d > limite) continue;
      const { p, ang } = noTrilho(rota, d);
      let q: Pt = p;
      let sc = Math.min(1, d / 16 + 0.25);
      let o = clamp01(d / 18) * clamp01((limite - d) / 26);
      if (divide !== null && d < tronco.len) {
        // as cores giram juntas em volta do fio: hélice que afina nas pontas
        const ph = (2 * Math.PI * d) / 104 + (j * 2 * Math.PI) / fluxos.length;
        const amp = 22 * Math.sin((Math.PI * d) / tronco.len);
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        q = [p[0] + nx * amp * Math.sin(ph), p[1] + ny * amp * Math.sin(ph)];
        const z = Math.cos(ph);
        sc *= 1 + 0.2 * z;
        o *= 0.72 + 0.28 * z;
      }
      partsEl.push(<Particula key={`q${j}-${i}`} p={q} ang={ang} forma={forma} cor={cor} o={o} sc={sc} />);
    }
  });
  // o fio comum (com divide) e o "abre" na junta
  const fioRev = divide !== null ? clamp01(((frame - fioAt) * VEL.ponto) / tronco.len) * tronco.len : 0;
  const pop = divide !== null ? clamp01((frame - divide) / 14) : 0;
  // o ponto quente da origem (não na boca: ali as partículas só entram)
  const origemCor = fluxos.length && fluxos.every((f) => (f.cor ?? 'ouro') === (fluxos[0].cor ?? 'ouro')) ? corDe(fluxos[0].cor ?? 'ouro', C.gold) : C.hi;
  const origemK = fluxos.length && origem !== 'boca' ? ramp(frame, (divide !== null ? fioAt : Math.min(...fluxos.map((_, i) => inicioDe(i)))) - 6, 12) : 0;

  // ------------------------------------------------ rótulos: os do roteiro + os das regiões, numa fila só
  const lados: Record<string, 'L' | 'R'> = {};
  const rotulosRegiao: RotuloSpec[] = regioes
    .filter((rg) => rg.rotulo)
    .map((rg, i) => {
      lados[rg.parte] = i % 2 ? 'R' : 'L';
      return { text: rg.rotulo!, cue: rg.cue, seta: rg.parte, out: apagaCue };
    });
  const pontos: Partial<Record<Regiao, Pt>> = {};
  for (const r of Object.keys(ALVO) as Regiao[]) pontos[r] = tela(ALVO[r][lados[r] ?? (r === 'tronco' || r === 'peito' || r === 'barriga' ? 'R' : 'L')]);
  // o anel: a seta vai até ele, não até o cabelo
  if (anel) pontos[anel.parte] = tela(['T', lados[anel.parte] === 'R' ? 153 : 47, 90]);
  // o tanque que cresce do músculo
  const tanqueW = 600;
  const tanqueH = tanqueW * 1.35;
  const tanqueC: Pt = [540, 820];
  const tanqueAt = at(s, reservaCue, 1e9);
  const tanqueK = reserva ? spring({ frame: frame - tanqueAt, fps, config: MOLA.entra }) : 0;
  const tanqueDe = tela(ALVO.musculos.R);
  const res = reserva ? reservaAt(s, reserva, frame) : null;
  const rotulos: RotuloSpec[] = [
    ...(pr.rotulos ?? []),
    ...rotulosRegiao,
    // o nome do estoque fica embaixo do tanque (em cima dele cairia no aro)
    ...(reserva?.rotulo ? [{ text: reserva.rotulo.text, cue: reserva.rotulo.cue, x: 540, y: Math.round(tanqueC[1] + tanqueH / 2 + 16) }] : []),
  ];
  // o que o rótulo não pode cobrir: o rosto, o tronco e as pernas (sempre); a lente pequena enquanto
  // está aberta (crescida ela é o fundo, e o rótulo vai por cima); o tanque depois que ele chega
  const rosto = faceAt(CORPO_X, CORPO_PES, CORPO_SIZE);
  const busy: Rect[] = [rosto, [box.left + 47 * k, box.top + 147 * k, box.left + 153 * k, box.top + 222 * k], [box.left + 64 * k, box.top + 222 * k, box.left + 136 * k, CORPO_PES + 6]];
  const lenteAt = lente?.cue ? cue(s, lente.cue) : -Infinity;
  const ocupa: Ocupa[] = [
    ...(lente && !grande ? discoRects(centro, diam).map((rect) => ({ rect, de: lenteAt, ate: lente.cresce ? cue(s, lente.cresce) : Infinity })) : []),
    ...(reserva ? [{ rect: [tanqueC[0] - tanqueW / 2, tanqueC[1] - tanqueH / 2, tanqueC[0] + tanqueW / 2, tanqueC[1] + tanqueH / 2] as Rect, de: tanqueAt + 10 }] : []),
  ];
  // o Stage não desenha os rótulos desta cena: a fila daqui sabe QUANDO a lente e o tanque estão na tela
  const sObj: MS = { ...s, props: { ...pr, rotulos: undefined } };

  const rCabeca = luz.cabeca?.k ?? 0;
  const rPele = luz.pele;
  const contorno = rPele ? rPele.cor : C.violet2;
  const svgBox = `translate(${box.left} ${box.top}) scale(${k})`;
  return (
    <Stage s={sObj} focus={{ pessoa: tela(['T', 100, 100]), peca: reserva ? tanqueC : lente ? centro : O }}>
      {positive ? <Sfx at={turnAt} name="chime" /> : null}
      {/* um foco violeta atrás do corpo: o "por dentro" sem cenário */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle 560px at 540px 880px, rgba(123,92,255,${(0.16 * vidro).toFixed(3)}) 0%, rgba(123,92,255,0) 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, opacity: corpoO }}>
        {/* a cabeça acesa: um halo atrás dela (o rosto fica intacto) */}
        {rCabeca > 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle 300px at ${tela(['T', 100, 92])[0].toFixed(0)}px ${tela(['T', 100, 92])[1].toFixed(0)}px, ${luz.cabeca!.cor}${Math.round(0x66 * rCabeca).toString(16).padStart(2, '0')} 0%, ${luz.cabeca!.cor}00 100%)`,
            }}
          />
        ) : null}
        <Ator t={frame} x={CORPO_X} y={CORPO_PES} size={CORPO_SIZE} pose={pose} arms="down" mood={mood} since={since} seed={who.seed} skin={who.skin} accent={C.violet} halo={false} />
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <defs>
            <filter id={`${uid}g`} filterUnits="userSpaceOnUse" x={-60} y={-60} width={320} height={380}>
              <feGaussianBlur stdDeviation={2.6} />
            </filter>
            <linearGradient id={`${uid}v`} x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" stopColor={VIDRO_TOPO} />
              <stop offset="1" stopColor={VIDRO} />
            </linearGradient>
          </defs>
          <g transform={svgBox}>
            {/* o vidro: contorno (a união das partes engordada) e o corpo por cima — sem linha nas emendas */}
            <g opacity={vidro}>
              {rPele ? (
                <g filter={`url(#${uid}g)`} opacity={0.7 * rPele.k}>
                  <Partes v={v} fill={contorno} stroke={contorno} sw={(2 * BORDA + 6) / k} />
                </g>
              ) : null}
              <Partes v={v} fill={contorno} stroke={contorno} sw={(2 * BORDA) / k} />
              <Partes v={v} fill={`url(#${uid}v)`} />
              {/* reflexo do vidro: um risco vertical do lado da luz */}
              <g transform={vidaT(v)} fill="#FFFFFF">
                <rect x={60} y={166} width={6} height={44} rx={3} opacity={0.08} />
                <g transform={`rotate(${ANG[0]} 58 158)`}>
                  <rect x={51} y={160} width={4} height={40} rx={2} opacity={0.07} />
                </g>
              </g>
              <rect x={75} y={222} width={4} height={18} rx={2} fill="#FFFFFF" opacity={0.06} />
            </g>
            {/* o mapa de dentro em meio-tom, e o que acendeu por cima, com brilho macio */}
            <g opacity={0.3 * vidro}>
              {MAPA.map((r) => (
                <Orgaos key={r} r={r} v={v} cor={MEIO} />
              ))}
            </g>
            {(Object.keys(luz) as Regiao[]).map((r) =>
              luz[r] && luz[r]!.k > 0 ? (
                <g key={r}>
                  <g filter={`url(#${uid}g)`} opacity={0.6 * luz[r]!.k}>
                    <Orgaos r={r} v={v} cor={luz[r]!.cor} />
                  </g>
                  <g opacity={0.85 * luz[r]!.k}>
                    <Orgaos r={r} v={v} cor={luz[r]!.cor} />
                  </g>
                </g>
              ) : null,
            )}
          </g>
          {/* o ponto quente da origem */}
          {origemK > 0 ? (
            <g opacity={origemK * (0.82 + 0.18 * Math.sin(frame / 7))}>
              <circle cx={O[0]} cy={O[1]} r={56} fill={origemCor} opacity={0.14} />
              <circle cx={O[0]} cy={O[1]} r={30} fill={origemCor} opacity={0.22} />
              <circle cx={O[0]} cy={O[1]} r={12} fill={origemCor} opacity={0.55} />
            </g>
          ) : null}
          {/* os caminhos que acenderam, o fio comum e as partículas */}
          <g>{pathsEl}</g>
          {fioRev > 0 ? (
            <line x1={O[0]} y1={O[1]} x2={O[0] + (D[0] - O[0]) * (fioRev / tronco.len)} y2={O[1] + (D[1] - O[1]) * (fioRev / tronco.len)} stroke={C.hi} strokeOpacity={0.42} strokeWidth={5} strokeLinecap="round" />
          ) : null}
          {pop > 0 && pop < 1 ? <circle cx={D[0]} cy={D[1]} r={12 + 46 * pop} fill="none" stroke={C.hi} strokeWidth={5 * (1 - pop)} opacity={0.85 * (1 - pop)} /> : null}
          <g>{partsEl}</g>
          {/* o anel em volta da cabeça: fecha de r 90 a 52 e deixa um ponto aceso e firme */}
          {anel && anelK > 0 ? (
            <g transform={svgBox}>
              <g transform={vidaT(v)}>
                <circle cx={100} cy={90} r={90 - 38 * anelK} fill="none" stroke={corRegiao(anel)} strokeWidth={3.2} opacity={clamp01((frame - anelAt) / 5) * (0.95 - 0.25 * anelK)} />
                <circle cx={100} cy={90} r={90 - 38 * anelK} fill="none" stroke={corRegiao(anel)} strokeWidth={7} opacity={0.18 * anelK} filter={`url(#${uid}g)`} />
                {anelK > 0.9 ? (
                  <g opacity={clamp01((frame - anelAt - 10) / 6)}>
                    <circle cx={100} cy={38} r={7} fill={corRegiao(anel)} opacity={0.3} />
                    <circle cx={100} cy={38} r={4.2} fill={corRegiao(anel)} />
                    <circle cx={98.8} cy={36.8} r={1.3} fill="#FFFFFF" opacity={0.7} />
                  </g>
                ) : null}
              </g>
            </g>
          ) : null}
        </svg>
      </div>
      {/* o tanque cresce do músculo até encher o palco, com um fundo escuro atrás (o rosto não aparece pelo vidro) */}
      {res && tanqueK > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle 640px at ${tanqueC[0]}px ${tanqueC[1]}px, rgba(10,14,38,${(0.96 * clamp01(tanqueK)).toFixed(3)}) 0%, rgba(10,14,38,${(0.9 * clamp01(tanqueK)).toFixed(3)}) 62%, rgba(10,14,38,0) 100%)`,
          }}
        />
      ) : null}
      {res && tanqueK > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            left: tanqueC[0] - tanqueW / 2,
            top: tanqueC[1] - tanqueH / 2,
            width: tanqueW,
            height: tanqueH,
            transform: `translate(${((tanqueDe[0] - tanqueC[0]) * (1 - tanqueK)).toFixed(1)}px, ${((tanqueDe[1] - tanqueC[1]) * (1 - tanqueK)).toFixed(1)}px) scale(${(0.08 + 0.92 * tanqueK).toFixed(4)})`,
            transformOrigin: '50% 50%',
            opacity: clamp01(tanqueK * 4),
          }}
        >
          <Reservatorio t={frame} size={tanqueW} nivel={res.nivel} jato={res.jato} pinga={res.pinga} assenta={res.assenta} conteudo={reserva?.conteudo} />
        </div>
      ) : null}
      {lente ? <Lente s={s} spec={lente} ancora={ancoraLente} centro={centro} diametro={diam} accent={accent} pele={pele} /> : null}
      {idHalo && mood === 'feliz' ? null : positive ? (
        <div style={{ position: 'absolute', top: 360, left: 340 }}>
          <Brilho t={frame} size={400} on={ramp(frame, turnAt, 10)} />
        </div>
      ) : null}
      {rotulos.length ? <Rotulos s={s} rotulos={rotulos} pontos={pontos} busy={busy} ocupa={ocupa} accent={accent} /> : null}
    </Stage>
  );
};

// ===================================================================== plano lupa
/** Onde ela fica: no meio do lugar antes da lente; no canto de baixo à esquerda com a lente aberta. */
const LUPA = { meio: { x: 540, pes: 1340, size: 360 }, canto: { x: 230, pes: 1370, size: 330 }, centro: [610, 720] as Pt, diam: 760 };

const pontosDe = (box: Box, pose?: Pose): Partial<Record<Regiao, Pt>> => {
  const P = (r: keyof typeof CORPO.pontos) => pontoNaTela(r, box, pose);
  return {
    cabeca: P('cabeca'),
    rosto: P('rosto'),
    boca: P('boca'),
    peito: P('peito'),
    tronco: P('tronco'),
    barriga: P('barriga'),
    braco: P('braco'),
    perna: P('perna'),
    vasos: P('peito'),
    musculos: P('braco'),
    pele: P('rosto'),
  };
};

const Lupa: React.FC<{ s: MS }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = useAccent();
  const spec = useSpec();
  const idHalo = !!useIdentity().halo;
  const pr = s.props ?? {};
  const { mood, since, turnAt, positive } = useHumor(s);
  const who = { seed: spec.protagonista?.seed ?? 0, skin: spec.protagonista?.skin };
  const pele = who.skin ?? SKINS[0];
  const lente = pr.lente;
  // a lente abre na deixa (sem deixa, a cena já começa assim); com `fecha`, tudo volta
  const abre = lente ? (lente.cue ? spring({ frame: frame - cue(s, lente.cue), fps, config: MOLA.entra }) : 1) : 0;
  const volta = lente?.fecha ? clamp01(spring({ frame: frame - cue(s, lente.fecha), fps, config: MOLA.entra })) : 0;
  const k = abre * (1 - volta);
  const { meio, canto } = LUPA;
  const x = meio.x + (canto.x - meio.x) * k;
  const pes = meio.pes + (canto.pes - meio.pes) * k;
  const size = meio.size + (canto.size - meio.size) * k;
  const pd = poseDe(s, pr.acoes, frame);
  const cx = x + pd.x;
  const box: Box = { left: cx - size / 2, top: pes - size * 1.26, size };
  const pontos = pontosDe(box, pd.pose);
  const mao = pd.peca ?? pr.holding;
  const work = ramp(frame, s.lead, Math.max(20, speechEnd(s) - s.lead));
  // a âncora: a peça da mão (o centro dela) ou a parte do corpo, seguida a cada quadro
  const ancora: Pt = (() => {
    if (lente && lente.sobre !== 'peca') return pontos[lente.sobre] ?? [cx, pes - size];
    if (!mao) return pontos.braco ?? [cx, pes - size];
    const h = maoNaTela(pd.pose, 'out', 1, box);
    const [w, hh] = pieceBox(mao, size * 0.5);
    return [h.x + 0.2 * w, h.y - 0.25 * hh];
  })();
  const lr = lenteRect(LUPA.centro, LUPA.diam);
  // as duas posições dela (o primeiro plano sai das duas; o rótulo, de onde ela está naquele trecho)
  const corpoEm = (p: typeof meio): Rect => [p.x - 0.4 * p.size, p.pes - 1.22 * p.size, p.x + 0.62 * p.size, p.pes];
  const ela: Rect[] = lente ? (lente.cue ? [corpoEm(meio), corpoEm(canto)] : [corpoEm(canto)]) : [corpoEm(meio)];
  const comLente = !!lente;
  const abreAt = lente?.cue ? cue(s, lente.cue) : -Infinity;
  const fechaAt = lente?.fecha ? cue(s, lente.fecha) : Infinity;
  const ocupa: Ocupa[] = !lente
    ? [{ rect: corpoEm(meio) }]
    : [
        ...(lente.cue ? [{ rect: corpoEm(meio), ate: abreAt + 17 }] : []),
        { rect: corpoEm(canto), de: abreAt, ate: fechaAt + 17 },
        ...(lente.fecha ? [{ rect: corpoEm(meio), de: fechaAt }] : []),
        ...discoRects(LUPA.centro, LUPA.diam).map((rect) => ({ rect, de: abreAt, ate: fechaAt + 8 })),
      ];
  const sObj: MS = { ...s, props: { ...pr, rotulos: undefined } };
  const geo: EnvGeo = {
    ground: meio.pes,
    clear: comLente ? (lente!.cue ? [60, 740] : [60, 420]) : [350, 740],
    spot: [cx, pes - size * 0.66, 380 - 80 * k],
    busy: [...(comLente ? [lr] : []), ...ela],
    // com a lente o lugar fica escuro: o primeiro plano (que o véu não pega) sai dos dois cantos
    frontOff: comLente ? ['left', 'right'] : [],
    show: [mao],
  };
  const veu = 0.55 * clamp01(k);
  return (
    <Stage s={sObj} geo={geo} focus={{ pessoa: pontos.rosto, peca: comLente ? LUPA.centro : ancora }}>
      {positive ? <Sfx at={turnAt} name="chime" /> : null}
      {/* o lugar escurece (véu navy) quando a lente abre: o assunto passa a ser o que está dentro dela */}
      {veu > 0.001 ? <div style={{ position: 'absolute', inset: 0, background: `rgba(10,14,38,${veu.toFixed(3)})` }} /> : null}
      <Ator
        t={frame}
        x={cx}
        y={pes}
        size={size}
        pose={pd.pose}
        mood={mood}
        since={since}
        seed={who.seed}
        skin={who.skin}
        accent={C.violet}
        mao={mao ? { p: mao, progress: work } : undefined}
        maos={pd.maos}
      />
      {positive && !(idHalo && mood === 'feliz') ? (
        <div style={{ position: 'absolute', top: pes - size * 1.3, left: cx - size * 0.6 }}>
          <Brilho t={frame} size={size * 1.2} on={ramp(frame, turnAt, 10)} />
        </div>
      ) : null}
      {lente ? <Lente s={s} spec={lente} ancora={ancora} centro={LUPA.centro} diametro={LUPA.diam} accent={accent} pele={pele} /> : null}
      {pr.rotulos?.length ? <Rotulos s={s} rotulos={pr.rotulos} pontos={pontos} ocupa={ocupa} accent={accent} /> : null}
    </Stage>
  );
};
