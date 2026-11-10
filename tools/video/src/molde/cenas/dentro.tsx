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
//    Na fase 3 (rodada 2) o corpo enche o palco: 940 px com os pés em 1500 (as pernas passam por trás
//    da legenda, numa faixa escura como a da vinheta aberta), callout no canto de cima do lado da
//    âncora, grãos/pontos 1,6× num fio denso (um por ramo) que já corre um pouco antes da palavra, e os
//    rótulos de seta acham vaga na coluna do lado com quebra (a vaga é achada no corpo parado).
//  - plano `lupa`: ela num lugar, com a peça e a ação; na deixa da lente ela desliza pro canto de
//    baixo à esquerda, o lugar escurece e a lente grande abre da âncora (a peça da mão ou a parte do
//    corpo, seguida a cada quadro). Com `fecha`, ela volta pro centro e o véu sai. `pessoa: "grande"`:
//    em vez de encolher pro canto ela cresce (480 px, cortada pela faixa da legenda), e com a âncora
//    embaixo do rosto o cone passa por trás da cabeça dela. Com ela grande o véu é leve (0,3, o lugar se
//    lê; uma vinheta só em volta da lente) e o corpo some num fade antes da faixa da legenda.
//  - boneco v5 (`boneco` no spec; sem a chave nada muda): no plano corpo a própria Pessoa vira vidro
//    (o estilo desenha, `vidro` no Ator) e o mapa, as rotas, as regiões e as âncoras são refeitos nas
//    juntas do corpo novo (mapa5, mais abaixo) — ela cresce (CORPO5) e as canelas somem na legenda. Na
//    lupa, a cabeça que esconde o cone é a do v5, e a pose parada leva o enquadramento da cena.
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
import { enquadraDe, v5, vistaDaCena } from '../../boneco/ativo';
import { fk } from '../../boneco/esqueleto';
import { corpoV5, poseV5 } from '../../boneco/naCaixa';
import { Reservatorio, reservaAt } from '../../elenco/reservatorio';
import { useIdentity } from '../../identidade/context';
import { CORPO, SKINS, type Pose } from '../../identidade/types';
import { C, dimColor } from '../../theme';
import { cue, speechEnd } from '../../timeline';
import { faceAt, hits, type EnvGeo, type Rect } from '../ambientes';
import { Lente, lenteRect } from '../lente';
import { pieceBox } from '../Peca';
import { Rotulo, Rotulos, achaVaga, discoRects, rotuloRect, useFontesDoRotulo, type Ocupa, type Vaga } from '../rotulo';
import { useCam } from '../camera';
import { Stage, at, bracoDe, useAccent, useSpec, type MS } from '../scenes';
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
/**
 * Plano corpo na régua da fase 3 (base do quadro aberta): o corpo ocupa o palco até a borda — pés
 * em 1500 (as pernas passam por trás da legenda, como o piso dos lugares), cabelo em ≈ 540, o rosto
 * inteiro entre a sobrancelha e o tronco. O callout da lente sobe pro canto de cima (ao lado da
 * cabeça, nunca no rosto) e os grãos/pontos crescem 1,6× (24 px num corpo de 660 não liam).
 */
const CORPO3 = { size: 940, pes: 1500 };
/** Callout da lente no plano corpo da fase 3: no canto de cima do lado da âncora, fora do rosto. */
const CALLOUT3 = { x: 925, y: 410, diam: 290 };
/** Grãos e pontos maiores na fase 3 (e o fio mais denso: um por ramo a cada `GAP3` quadros). */
const PARTICULA3 = 1.6;
const GAP3 = { ponto: 8, grao: 7 };
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
// boneco v5 (`boneco` no spec): o mapa de dentro no corpo NOVO. Sem a chave nada daqui roda e o plano
// sai idêntico ao publicado.
//
// O corpo antigo (CORPO, caixa 200×260) tinha o tronco largo e baixo, braços retos girados no ombro e
// perninhas; o v5 é alto e fino, com cotovelo e joelho. Esticar o desenho antigo pro tronco novo
// deixaria o coração uma gota de 2:1 — então o mapa é REFEITO nas juntas do v5, parte a parte:
//  - tronco: um quadro (u, vf) que segue a coluna — u de −1 a 1 na meia largura do tronco naquele
//    nível, vf de 0 (pélvis) a 1 (base do pescoço). Os órgãos são os MESMOS desenhos de antes
//    (CORACAO, ESTOMAGO, INTESTINO), postos no lugar com escala uniforme e o giro do tronco;
//  - braços e pernas: pontos ao longo do osso (ombro → cotovelo → punho, quadril → joelho →
//    tornozelo) com um desvio de lado em frações do raio do membro; um fuso no braço, no antebraço,
//    na coxa e na panturrilha;
//  - cabeça: o círculo antigo (centro 100,90, raio 50) vira o da cabeça v5 (centro, raio e giro).
// O vaso e a rota do fluxo são a mesma fileira de pontos (as partículas andam DENTRO do vaso) e se
// emendam no ombro e na bacia sem salto. As juntas são as do QUADRO (fk com o `t` da Pessoa) no
// encaixe que o corpoV5 dá: o mapa respira e balança junto com ela.

/**
 * Plano corpo com o v5: o corpo novo é mais fino e a cabeça menor, então a caixa cresce pra o tronco
 * (onde mora o mapa) ler grande — cabelo em ≈ 300, ombros em ≈ 680, pélvis em ≈ 1065, joelho em
 * ≈ 1410. As canelas e os pés passam por trás da faixa da legenda e somem nela (CORTE5).
 */
const CORPO5 = { size: 1240, pes: 1760 };
/** O que é medido em px no plano v5 (traço, brilho, velocidade, hélice): a régua da fase 3 (940/660). */
const KK5 = 1.45;
/**
 * Onde o corpo v5 some, na tela: acaba de sumir quando a faixa escura da legenda fecha (1425) — nada
 * do corpo nem do mapa aceso brilha através da legenda (a panturrilha acesa tirava o contraste dela).
 */
const CORTE5 = { de: 1370, ate: 1430 };

type Par5 = [Pt, Pt];
/** As juntas da protagonista no quadro, em unidades da caixa (as do corpoV5, com o `t`). */
type G5 = {
  cab: Pt;
  rCab: number;
  /** giro da cabeça (graus, o rotate do SVG) */
  angCab: number;
  queixo: Pt;
  peito: Pt;
  pelvis: Pt;
  ombro: Par5;
  cotovelo: Par5;
  punho: Par5;
  dedos: Par5;
  quadril: Par5;
  joelho: Par5;
  tornozelo: Par5;
  /** meia largura dos ombros (pivôs dos braços) */
  ombros: number;
};

/**
 * As juntas no quadro `t`. O corpoV5 responde em t = 0 (sem a respiração e o balanço do parado); o
 * encaixe da caixa (escala e onde o (0,0) do boneco cai) sai dele, e as juntas do quadro saem do fk
 * com a MESMA pose que a PessoaV5 desenha — assim o mapa não escorrega do corpo.
 */
const corpo5 = (pose: unknown, t: number): G5 => {
  const at = v5();
  if (!at) throw new Error('corpo5 sem o v5 ligado');
  const pessoa = at.protagonista;
  const prop = at.estilo.propDe(pessoa);
  const ref = corpoV5(pose, 'down');
  const j0 = fk(prop, poseV5(pessoa, { t: 0, pose, arms: 'down' }));
  const j = t ? fk(prop, poseV5(pessoa, { t, pose, arms: 'down' })) : j0;
  const sx = (j.espelho ? -1 : 1) * ref.escala;
  const o: Pt = [ref.pelvis[0] - sx * j0.pelvis[0], ref.pelvis[1] - ref.escala * j0.pelvis[1]];
  const c = (p: Pt): Pt => [o[0] + sx * p[0], o[1] + ref.escala * p[1]];
  const par = (ps: Par5): Par5 => [c(ps[0]), c(ps[1])];
  return {
    cab: c(j.cabeca),
    rCab: ref.raioCabeca,
    angCab: (j.espelho ? -1 : 1) * j.ang.cabeca,
    queixo: c(j.queixo),
    peito: c(j.peito),
    pelvis: c(j.pelvis),
    ombro: par(j.ombro),
    cotovelo: par(j.cotovelo),
    punho: par(j.punho),
    dedos: par(j.dedos),
    quadril: par(j.quadril),
    joelho: par(j.joelho),
    tornozelo: par(j.tornozelo),
    ombros: ref.ombros,
  };
};

/**
 * Meia largura do tronco v5 por nível (fração da meia largura dos ombros): quadril, cintura, peito,
 * ombro, pescoço. Medida no estilo "serie" (mulher e homem dão perto disto); o mapa mora em |u| ≤ 0,6,
 * então a aproximação não tira nada do corpo.
 */
const LARG5: [number, number][] = [
  [-0.2, 0.8],
  [0, 0.86],
  [0.2, 0.8],
  [0.42, 0.7],
  [0.66, 0.83],
  [0.86, 0.88],
  [1, 0.42],
];
const largura5 = (vf: number) => {
  if (vf <= LARG5[0][0]) return LARG5[0][1];
  for (let i = 1; i < LARG5.length; i++) {
    const [b, wb] = LARG5[i];
    const [a, wa] = LARG5[i - 1];
    if (vf <= b) return wa + ((wb - wa) * (vf - a)) / (b - a);
  }
  return LARG5[LARG5.length - 1][1];
};

type Origem = NonNullable<SceneProps['origem']>;
type Vaso5 = { tipo: 'braco' | 'perna' | 'pescoco'; tronco: Pt[]; membro: Pt[] };
type Musc5 = { a: Pt; b: Pt; w: number; perna: boolean };
/** O mapa de dentro no corpo v5 (unidades da caixa), com as rotas, os alvos das setas e as caixas do corpo. */
type Mapa5 = {
  g: G5;
  /** giro do tronco (graus) e a escala dos órgãos (desenho antigo → corpo novo) */
  tilt: number;
  kO: number;
  /** raios dos membros */
  R: { braco: number; ante: number; coxa: number; canela: number };
  coracao: Pt;
  estomago: Pt;
  intestino: Pt;
  /** a região `tronco` (a elipse do meio) */
  meio: { c: Pt; rx: number; ry: number };
  vasos: Vaso5[];
  musc: Musc5[];
  origem: Record<Origem, Pt>;
  junta: Record<Origem, Pt>;
  ramos: Record<Regiao, Pt[][]>;
  alvo: Record<Regiao, { L: Pt; R: Pt }>;
  /** o anel: as pontas da seta e o ponto aceso em cima da cabeça */
  anel: { L: Pt; R: Pt; topo: Pt };
  /** o contorno do tronco (aproximado: a aura da pele e a caixa dos rótulos) */
  contorno: Pt[];
};

const mapa5 = (g: G5): Mapa5 => {
  const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const lerp = (a: Pt, b: Pt, f: number): Pt => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  const T = dist(g.pelvis, g.peito) || 1;
  const up: Pt = [(g.peito[0] - g.pelvis[0]) / T, (g.peito[1] - g.pelvis[1]) / T];
  const tilt = (Math.atan2(up[0], -up[1]) * 180) / Math.PI;
  /** um ponto do tronco: u na meia largura daquele nível (+ = direita da tela), vf da pélvis ao pescoço */
  const TT = (u: number, vf: number): Pt => {
    const w = u * g.ombros * largura5(vf);
    return [g.pelvis[0] + up[0] * vf * T - up[1] * w, g.pelvis[1] + up[1] * vf * T + up[0] * w];
  };
  /** um ponto no osso a→b: fração f, e `l` raios pro lado (+ = direita da tela com o osso pra baixo) */
  const seg = (a: Pt, b: Pt, f: number, l = 0, r = 0): Pt => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const n = Math.hypot(dx, dy) || 1e-6;
    return [a[0] + dx * f + (dy / n) * l * r, a[1] + dy * f - (dx / n) * l * r];
  };
  const rot = (graus: number, [x, y]: Pt): Pt => {
    const a = (graus * Math.PI) / 180;
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  };
  /** um ponto da cabeça em raios dela (o círculo antigo de raio 50 vira este) */
  const naCab = (lx: number, ly: number): Pt => {
    const d = rot(g.angCab, [lx * g.rCab, ly * g.rCab]);
    return [g.cab[0] + d[0], g.cab[1] + d[1]];
  };
  const lb = dist(g.ombro[1], g.cotovelo[1]);
  const lc = dist(g.quadril[1], g.joelho[1]);
  const R = { braco: 0.15 * lb, ante: 0.115 * lb, coxa: 0.19 * lc, canela: 0.12 * lc };
  // os órgãos antigos (≈ 20 un. de largura num tronco de 106) num tronco de ≈ 2 × 0,8 × ombros
  const kO = g.ombros / 40;
  const noOrgao = (c: Pt, lx: number, ly: number): Pt => {
    const d = rot(tilt, [lx * kO, ly * kO]);
    return [c[0] + d[0], c[1] + d[1]];
  };
  // o coração do lado esquerdo DELA (direita da tela), o estômago do outro, o intestino embaixo
  const coracao = TT(0.26, 0.68);
  const estomago = TT(-0.24, 0.46);
  const intestino = TT(0.02, 0.16);
  const apice = noOrgao(coracao, 0, 7);
  const topo = noOrgao(coracao, 0, -3);
  const boca = naCab(0, 0.56);
  const fora = (i: 0 | 1) => Math.sign(g.ombro[i][0] - g.peito[0]) || (i ? 1 : -1);
  const lados = [0, 1] as const;
  // o vaso do braço entra pela cava (abaixo da ponta do cabelo que cai no ombro) e desce pelo lado de
  // dentro; o da perna nasce na bacia
  const cava = (i: 0 | 1) => TT(fora(i) * 0.82, 0.85);
  const bacia = (i: 0 | 1) => TT(fora(i) * 0.3, 0.06);
  const bracoV = (i: 0 | 1): Pt[] => {
    const o = fora(i);
    const [S, E, W] = [g.ombro[i], g.cotovelo[i], g.punho[i]];
    return [cava(i), seg(S, E, 0.2, -o * 0.3, R.braco), seg(S, E, 0.62, -o * 0.32, R.braco), seg(E, W, 0.04, -o * 0.3, R.ante), seg(E, W, 0.5, -o * 0.3, R.ante), seg(E, W, 0.94, -o * 0.25, R.ante)];
  };
  const pernaV = (i: 0 | 1): Pt[] => {
    const o = fora(i);
    const [H, K, A] = [g.quadril[i], g.joelho[i], g.tornozelo[i]];
    return [bacia(i), seg(H, K, 0.1, -o * 0.3, R.coxa), seg(H, K, 0.55, -o * 0.32, R.coxa), seg(H, K, 0.97, -o * 0.25, R.coxa), seg(K, A, 0.5, -o * 0.3, R.canela), seg(K, A, 0.94, -o * 0.25, R.canela)];
  };
  const aorta: Pt[] = [apice, TT(0.08, 0.5), TT(0, 0.26)];
  const saiDoCoracao = (i: 0 | 1): Pt[] => [noOrgao(coracao, fora(i) * 4, -2), TT(0.26 + fora(i) * 0.3, 0.79), cava(i)];
  const vasos: Vaso5[] = [
    ...lados.map((i): Vaso5 => ({ tipo: 'braco', tronco: saiDoCoracao(i), membro: bracoV(i) })),
    ...lados.map((i): Vaso5 => ({ tipo: 'perna', tronco: i === 0 ? [...aorta, bacia(0)] : [aorta[2], bacia(1)], membro: pernaV(i) })),
    { tipo: 'pescoco', tronco: [topo, TT(0.12, 0.86), TT(0, 1), lerp(g.peito, g.queixo, 0.4)], membro: [] },
  ];
  const musc: Musc5[] = lados.flatMap((i) => {
    const o = fora(i);
    const fuso5 = (a: Pt, b: Pt, f0: number, f1: number, r: number, perna: boolean): Musc5 => ({ a: seg(a, b, f0, o * 0.1, r), b: seg(a, b, f1, o * 0.1, r), w: 0.55 * r, perna });
    return [
      fuso5(g.ombro[i], g.cotovelo[i], 0.16, 0.86, R.braco, false),
      fuso5(g.cotovelo[i], g.punho[i], 0.08, 0.6, R.ante, false),
      // sem a panturrilha: ela mora atrás da legenda (CORTE5), a coxa basta pra perna acender
      fuso5(g.quadril[i], g.joelho[i], 0.12, 0.8, R.coxa, true),
    ];
  });
  // as rotas: sobem pelo peito até a cava e descem o braço; descem até a bacia e entram na coxa
  const peloOmbro = (i: 0 | 1, resto: Pt[]): Pt[] => [TT(fora(i) * 0.35, 0.8), cava(i), ...resto];
  const pelaBacia = (i: 0 | 1, resto: Pt[]): Pt[] => [TT(fora(i) * 0.22, 0.2), bacia(i), ...resto];
  const noBraco = (i: 0 | 1, f: number) => seg(g.ombro[i], g.cotovelo[i], f, fora(i) * 0.1, R.braco);
  const noAnte = (i: 0 | 1, f: number) => seg(g.cotovelo[i], g.punho[i], f, fora(i) * 0.1, R.ante);
  const naCoxa = (i: 0 | 1, f: number) => seg(g.quadril[i], g.joelho[i], f, fora(i) * 0.08, R.coxa);
  const queixo = lerp(g.peito, g.queixo, 0.85);
  const ramos: Record<Regiao, Pt[][]> = {
    vasos: [
      ...lados.map((i) => [coracao, ...saiDoCoracao(i).slice(1), ...bracoV(i).slice(1)]),
      ...lados.map((i) => [coracao, ...aorta, ...pernaV(i)]),
    ],
    musculos: [...lados.map((i) => peloOmbro(i, [noBraco(i, 0.3), noBraco(i, 0.86), noAnte(i, 0.34)])), ...lados.map((i) => pelaBacia(i, [naCoxa(i, 0.12), naCoxa(i, 0.62)]))],
    braco: lados.map((i) => peloOmbro(i, [noBraco(i, 0.3), noBraco(i, 0.95), noAnte(i, 0.85)])),
    perna: lados.map((i) => pelaBacia(i, [naCoxa(i, 0.1), naCoxa(i, 0.9)])),
    cabeca: [[TT(0, 0.9), g.peito, queixo]],
    rosto: [[TT(0, 0.9), g.peito, queixo]],
    boca: [[g.peito, lerp(g.queixo, boca, 0.4)]],
    peito: [[coracao]],
    barriga: [[estomago]],
    tronco: [[TT(-0.38, 0.52), TT(0, 0.66), TT(0.38, 0.52), TT(0, 0.38)]],
    pele: [
      [TT(-0.5, 0.52), TT(-1.12, 0.54)],
      [TT(0.5, 0.52), TT(1.12, 0.54)],
    ],
  };
  const lr = (f: (i: 0 | 1) => Pt) => {
    const a = f(0);
    const b = f(1);
    return a[0] <= b[0] ? { L: a, R: b } : { L: b, R: a };
  };
  const alvo: Record<Regiao, { L: Pt; R: Pt }> = {
    vasos: lr((i) => seg(g.cotovelo[i], g.punho[i], 0.25, -fora(i) * 0.3, R.ante)),
    musculos: lr((i) => noBraco(i, 0.5)),
    braco: lr((i) => noBraco(i, 0.78)),
    perna: lr((i) => naCoxa(i, 0.45)),
    cabeca: { L: naCab(-1.08, 0), R: naCab(1.08, 0) },
    rosto: { L: naCab(-0.48, 0.38), R: naCab(0.48, 0.38) },
    boca: { L: naCab(-0.12, 0.56), R: naCab(0.12, 0.56) },
    peito: { L: coracao, R: coracao },
    barriga: { L: estomago, R: intestino },
    tronco: { L: TT(-0.16, 0.52), R: TT(0.16, 0.52) },
    pele: { L: TT(-1.04, 0.5), R: TT(1.04, 0.5) },
  };
  const niveis = [-0.15, 0, 0.2, 0.42, 0.66, 0.86, 0.97];
  const contorno = [...niveis.map((vf) => TT(-1.04, vf)), ...[...niveis].reverse().map((vf) => TT(1.04, vf))];
  return {
    g,
    tilt,
    kO,
    R,
    coracao,
    estomago,
    intestino,
    meio: { c: TT(0, 0.52), rx: 0.64 * g.ombros * largura5(0.52), ry: 0.27 * T },
    vasos,
    musc,
    origem: { tronco: TT(0.02, 0.56), barriga: TT(0, 0.3), boca },
    junta: { tronco: TT(0, 0.8), barriga: TT(0, 0.76), boca: TT(0, 0.97) },
    ramos,
    alvo,
    anel: { L: naCab(-1.06, 0), R: naCab(1.06, 0), topo: naCab(0, -1.04) },
    contorno,
  };
};

/** As caixas do corpo v5 na tela (o que o rótulo não cobre): cabeça com o cabelo até os ombros, tronco, braços e pernas. */
const caixas5 = (m: Mapa5, tela: (p: Pt) => Pt): Rect[] => {
  const caixa = (ps: Pt[], pad = 0): Rect => {
    const t = ps.map(tela);
    return [Math.min(...t.map((p) => p[0])) - pad, Math.min(...t.map((p) => p[1])) - pad, Math.max(...t.map((p) => p[0])) + pad, Math.max(...t.map((p) => p[1])) + pad];
  };
  const { g, R } = m;
  const r = g.rCab;
  const k = tela([1, 0])[0] - tela([0, 0])[0];
  const ombroY = Math.max(g.ombro[0][1], g.ombro[1][1]);
  return [
    caixa([[g.cab[0] - 1.35 * r, g.cab[1] - 1.32 * r], [g.cab[0] + 1.35 * r, ombroY]]),
    caixa(m.contorno),
    ...([0, 1] as const).map((i) => caixa([g.ombro[i], g.cotovelo[i], g.punho[i], g.dedos[i]], 1.1 * R.braco * k)),
    caixa([g.quadril[0], g.quadril[1], [g.quadril[0][0], 260], [g.quadril[1][0], 260]], 1.4 * R.coxa * k),
  ];
};

const f2 = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
/** Caminho suave pelos pontos (Catmull-Rom → Bézier): o vaso dobra no ombro e no joelho sem quina. */
const suave = (ps: Pt[]) => {
  if (ps.length < 2) return '';
  let d = `M${f2(ps[0])}`;
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[i - 1] ?? ps[i];
    const p1 = ps[i];
    const p2 = ps[i + 1];
    const p3 = ps[i + 2] ?? p2;
    d += ` C${f2([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${f2([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${f2(p2)}`;
  }
  return d;
};
/**
 * O ventre do músculo no corpo v5: ponta ARREDONDADA (a largura não chega a zero) e barriga cheia —
 * o fuso de ponta fina, aceso em laranja com o miolo claro, lia "chama" ao lado de "energia" (revisor
 * da creatina r4). As fibras (2 traços finos ao longo do eixo) dizem "músculo".
 */
const ventreAB = (a: Pt, b: Pt, w: number) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.hypot(dx, dy) || 1e-6;
  const ux = dx / n;
  const uy = dy / n;
  const N = 14;
  const lado = (sgn: 1 | -1) =>
    Array.from({ length: N + 1 }, (_, i) => {
      const s = i / N;
      const meia = w * 1.15 * (0.42 + 0.58 * Math.sin(Math.PI * s) ** 0.7);
      return [a[0] + dx * s - uy * meia * sgn, a[1] + dy * s + ux * meia * sgn] as Pt;
    });
  const cima = lado(1);
  const baixo = lado(-1).reverse();
  // as pontas fecham em arco (meio círculo da largura que sobrou)
  const capB = `A${(w * 1.15 * 0.42).toFixed(2)} ${(w * 1.15 * 0.42).toFixed(2)} 0 0 1 ${f2(baixo[0])}`;
  const capA = `A${(w * 1.15 * 0.42).toFixed(2)} ${(w * 1.15 * 0.42).toFixed(2)} 0 0 1 ${f2(cima[0])}`;
  return `M${f2(cima[0])} ${cima.slice(1).map((q) => `L${f2(q)}`).join(' ')} ${capB} ${baixo.slice(1).map((q) => `L${f2(q)}`).join(' ')} ${capA}Z`;
};
const fibrasAB = (a: Pt, b: Pt, w: number) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.hypot(dx, dy) || 1e-6;
  const px = -dy / n;
  const py = dx / n;
  return [-0.38, 0.38].map((o) => {
    const p0: Pt = [a[0] + dx * 0.18 + px * w * o * 0.6, a[1] + dy * 0.18 + py * w * o * 0.6];
    const p1: Pt = [a[0] + dx * 0.82 + px * w * o * 0.6, a[1] + dy * 0.82 + py * w * o * 0.6];
    const m: Pt = [(a[0] + b[0]) / 2 + px * w * o * 1.1, (a[1] + b[1]) / 2 + py * w * o * 1.1];
    return `M${f2(p0)} Q${f2(m)} ${f2(p1)}`;
  });
};
/** Os desenhos antigos dos órgãos e o centro de cada um (é por ele que eles vão pro corpo novo). */
const O_CORACAO: Pt = [112, 175.5];
const O_ESTOMAGO: Pt = [94, 195.5];
const O_INTESTINO: Pt = [100.5, 213];
const noLugar = (m: Mapa5, c: Pt, o: Pt) => `translate(${f2(c)}) rotate(${m.tilt.toFixed(2)}) scale(${m.kO.toFixed(4)}) translate(${-o[0]} ${-o[1]})`;

/** O desenho de uma região no corpo v5, numa cor (como `Orgaos`; `k` = px por unidade, pros traços). */
const Orgaos5: React.FC<{ r: Regiao; m: Mapa5; cor: string; k: number }> = ({ r, m, cor, k }) => {
  const linha = { stroke: cor, strokeWidth: 8 / k, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const vasos = (arms: boolean, trunk: boolean, legs: boolean) => (
    <g {...linha}>
      {m.vasos.map((v, i) => (
        <React.Fragment key={i}>
          {trunk ? <path d={suave(v.tronco)} /> : null}
          {v.membro.length > 1 && (v.tipo === 'braco' ? arms : legs) ? <path d={suave(v.membro)} /> : null}
        </React.Fragment>
      ))}
    </g>
  );
  const musc = (arms: boolean, legs: boolean) => (
    <g fill={cor}>
      {m.musc
        .filter((f) => (f.perna ? legs : arms))
        .map((f, i) => (
          <React.Fragment key={i}>
            <path d={ventreAB(f.a, f.b, f.w)} />
            {fibrasAB(f.a, f.b, f.w).map((d, k2) => (
              <path key={k2} d={d} fill="none" stroke="#3A1606" strokeOpacity={0.32} strokeWidth={2.2 / k} strokeLinecap="round" />
            ))}
          </React.Fragment>
        ))}
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
      return <path d={CORACAO} fill={cor} transform={noLugar(m, m.coracao, O_CORACAO)} />;
    case 'barriga':
      return (
        <>
          <path d={ESTOMAGO} fill={cor} transform={noLugar(m, m.estomago, O_ESTOMAGO)} />
          <path d={INTESTINO} stroke={cor} strokeWidth={12 / (k * m.kO)} fill="none" strokeLinecap="round" transform={noLugar(m, m.intestino, O_INTESTINO)} />
        </>
      );
    case 'tronco':
      return <ellipse cx={m.meio.c[0]} cy={m.meio.c[1]} rx={m.meio.rx} ry={m.meio.ry} fill={cor} transform={`rotate(${m.tilt.toFixed(2)} ${f2(m.meio.c)})`} />;
    default:
      return null;
  }
};

/**
 * A pele acesa no corpo v5: o contorno do vidro é do estilo, então a cor vem como uma aura ATRÁS do
 * corpo (tronco, braços e pernas engordados e borrados) — o vidro cobre o meio e a cor sobra na borda.
 */
const Aura5: React.FC<{ m: Mapa5; cor: string; k: number; filtro: string }> = ({ m, cor, k, filtro }) => {
  const { g, R } = m;
  const pad = 16 / k;
  const membro = (ps: Pt[], r: number, key: string) => <polyline key={key} points={ps.map(f2).join(' ')} fill="none" stroke={cor} strokeWidth={2 * (r + pad)} strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <g filter={filtro}>
      <polygon points={m.contorno.map(f2).join(' ')} fill={cor} stroke={cor} strokeWidth={2 * pad} strokeLinejoin="round" />
      {([0, 1] as const).flatMap((i) => [membro([g.ombro[i], g.cotovelo[i], g.punho[i]], R.braco, `b${i}`), membro([g.quadril[i], g.joelho[i], g.tornozelo[i]], R.coxa, `p${i}`)])}
    </g>
  );
};

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
  // fase 3: o corpo maior (pés em 1500); sem ela, a medida de antes. Boneco v5: a caixa do CORPO5
  const f3 = (spec.fase ?? 0) >= 3;
  const com5 = !!v5();
  const SIZE = com5 ? CORPO5.size : f3 ? CORPO3.size : CORPO_SIZE;
  const PES = com5 ? CORPO5.pes : f3 ? CORPO3.pes : CORPO_PES;
  const box: Box = { left: CORPO_X - SIZE / 2, top: PES - SIZE * 1.26, size: SIZE };
  const k = SIZE / 200;
  /** Quanto o que é medido na tela (brilhos, traços) cresce junto com o corpo. */
  const kk = com5 ? KK5 : SIZE / CORPO_SIZE;
  const v = vida(frame, who.seed, mood, since);
  const tela = (w: W) => toTela(w, v, box);
  /** O corpo sem a respiração: onde os rótulos ACHAM a vaga (a vaga não pode pular de um quadro pro outro). */
  const fixa = (w: W) => toTela(w, { sx: 1, sy: 1, lift: 0 }, box);
  const pose: Pose = { braco: ANG };
  // boneco v5: o mapa nas juntas do quadro (m5) e no corpo parado (m50, onde os rótulos acham a vaga)
  const m5 = com5 ? mapa5(corpo5(pose, frame)) : null;
  const m50 = com5 ? mapa5(corpo5(pose, 0)) : null;
  const tela5 = (p: Pt): Pt => [box.left + p[0] * k, box.top + p[1] * k];
  /** fase 3 ou v5: o callout no canto de cima, a faixa da legenda, a fila de rótulos do corpo grande */
  const grandeCorpo = f3 || com5;

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
  const ancoraLente = m5 ? tela5(m5.alvo[lenteSobre].R) : tela(ALVO[lenteSobre].R);
  const centro: Pt = grande ? [540, 760] : grandeCorpo ? [ancoraLente[0] < 540 ? 1080 - CALLOUT3.x : CALLOUT3.x, CALLOUT3.y] : [ancoraLente[0] < 540 ? 204 : 876, 600];
  const diam = grande ? 760 : grandeCorpo ? CALLOUT3.diam : 364;
  const reserva = pr.reserva;
  const reservaCues = reserva ? [...reserva.nivel.map((n) => n.cue), ...(reserva.gasta ?? []).map((g) => g.cue), ...(reserva.pinga ?? []).map((g) => g.cue), reserva.rotulo?.cue].filter((c): c is string => !!c) : [];
  const reservaCue = reservaCues.length ? reservaCues.reduce((a, b) => (cue(s, b) < cue(s, a) ? b : a)) : undefined;
  const apagaCue = lente ? (grande ? lente.cue : lente.cresce) : reservaCue;
  const apagaAt = lente && grande && !lente.cue ? -1e9 : at(s, apagaCue, 1e9);
  const apaga = ramp(frame, apagaAt, 14);
  const corpoO = 1 - 0.7 * apaga;

  // ------------------------------------------------ fluxos
  const origem = pr.origem ?? 'tronco';
  const O = m5 ? tela5(m5.origem[origem]) : tela(ORIGEM[origem]);
  const divide = pr.divide && fluxos.length >= 2 ? at(s, pr.divide, 1e9) : null;
  const D = m5 ? tela5(m5.junta[origem]) : tela(JUNTA[origem]);
  // fase 3: o fio já corre um pouco antes da palavra (quando ela chega, os grãos já estão no caminho)
  const inicioDe = (i: number) => {
    const a = at(s, fluxos[i].cue, s.lead + 10);
    return f3 && fluxos[i].cue ? Math.max(s.lead + 8, a - 18) : a;
  };
  const fioAt = divide !== null ? Math.min(...fluxos.map((_, i) => inicioDe(i))) : 0;
  const tronco = trilho([O, D]);
  const fim = s.frames;
  const pathsEl: React.ReactNode[] = [];
  const partsEl: React.ReactNode[] = [];
  // fase 3: o caminho mais grosso (o corpo cresceu) e as partículas no mesmo tempo de viagem
  const traco = 7 * kk;
  const velDe = (forma: 'ponto' | 'grao') => VEL[forma] * kk;
  fluxos.forEach((fx, j) => {
    const cor = corDe(fx.cor ?? 'ouro', C.gold);
    const forma = fx.particula ?? (fx.cor === 'ouro' || !fx.cor ? 'grao' : 'ponto');
    const vel = velDe(forma);
    const gap = f3 ? GAP3[forma] : GAP[forma];
    const ramos = m5 ? m5.ramos[fx.para].map((r) => r.map(tela5)) : RAMOS[fx.para].map((r) => r.map(tela));
    const t0 = divide !== null ? fioAt : inicioDe(j);
    const rotas = ramos.map((r) => trilho(divide !== null ? [O, D, ...r] : [O, ...r]));
    const nr = rotas.length;
    // quando a região acende, o caminho cede: o órgão aceso passa a contar a história
    const acesa = Math.max(luz[fx.para]?.k ?? 0, anel?.parte === fx.para ? anelK : 0);
    const trilhoO = 0.3 * (1 - 0.65 * acesa);
    // o caminho acende atrás das partículas (30% da cor); com divide, o fio comum é desenhado à parte
    ramos.forEach((r, b) => {
      if (divide !== null) {
        const ramo = trilho([D, ...r]);
        const rev = clamp01(((frame - divide) * vel) / ramo.len) * ramo.len;
        if (rev > 0) pathsEl.push(<path key={`p${j}-${b}`} d={pathOf(ramo.pts)} stroke={cor} strokeOpacity={trilhoO} strokeWidth={traco} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${rev.toFixed(1)} ${ramo.len + 10}`} />);
      } else {
        const rota = rotas[b];
        const first = f3 ? t0 + (b * gap) / nr + (j * gap) / Math.max(1, fluxos.length) : t0 + b * gap + (j * gap) / Math.max(1, fluxos.length);
        const rev = clamp01(((frame - first) * vel) / rota.len) * rota.len;
        if (rev > 0) pathsEl.push(<path key={`p${j}-${b}`} d={pathOf(rota.pts)} stroke={cor} strokeOpacity={trilhoO} strokeWidth={traco} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${rev.toFixed(1)} ${rota.len + 10}`} />);
      }
    });
    // as partículas: uma a cada `gap` quadros, ramo a ramo. Fase 3: o fio fica denso — uma por RAMO a
    // cada `gap` (escalonadas), e antes do `divide` uma só por vez no fio comum (a hélice não embola)
    const phase = (j * gap) / Math.max(1, fluxos.length);
    const maxLife = Math.max(...rotas.map((r) => r.len)) / vel + 2;
    const iLast = Math.floor((Math.min(frame, fim) - t0 - phase) / gap);
    const iFirst = Math.max(0, Math.floor((frame - t0 - phase - maxLife - gap) / gap));
    for (let i = iFirst; i <= iLast; i++) {
      for (let b = 0; b < (f3 ? nr : 1); b++) {
        const born = f3 ? t0 + phase + i * gap + (b * gap) / nr : t0 + phase + i * gap;
        const d = (frame - born) * vel;
        if (d < 0 || born > fim) continue;
        const rota = rotas[f3 ? b : i % nr];
        // com divide: quem chegou na junta antes da deixa some ali (o fio ainda não se abriu)
        const morreNaJunta = divide !== null && born + tronco.len / vel < divide;
        // fase 3: antes de abrir, um por vez no fio comum (o ramo da vez); depois, um por ramo
        if (f3 && morreNaJunta && b !== i % nr) continue;
        const limite = morreNaJunta ? tronco.len : rota.len;
        if (d > limite) continue;
        const { p, ang } = noTrilho(rota, d);
        let q: Pt = p;
        let sc = Math.min(1, d / (16 * kk) + 0.25);
        let o = clamp01(d / (18 * kk)) * clamp01((limite - d) / (26 * kk));
        if (divide !== null && d < tronco.len) {
          // as cores giram juntas em volta do fio: hélice que afina nas pontas
          const ph = (2 * Math.PI * d) / (104 * kk) + (j * 2 * Math.PI) / fluxos.length;
          const amp = 22 * kk * Math.sin((Math.PI * d) / tronco.len);
          const nx = -Math.sin(ang);
          const ny = Math.cos(ang);
          q = [p[0] + nx * amp * Math.sin(ph), p[1] + ny * amp * Math.sin(ph)];
          const z = Math.cos(ph);
          sc *= 1 + 0.2 * z;
          o *= 0.72 + 0.28 * z;
        }
        partsEl.push(<Particula key={`q${j}-${i}-${b}`} p={q} ang={ang} forma={forma} cor={cor} o={o} sc={sc * (f3 ? PARTICULA3 : 1)} />);
      }
    }
  });
  // o fio comum (com divide) e o "abre" na junta
  const fioRev = divide !== null ? clamp01(((frame - fioAt) * velDe('ponto')) / tronco.len) * tronco.len : 0;
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
  const alvos: Partial<Record<Regiao, Pt>> = {};
  for (const r of Object.keys(ALVO) as Regiao[]) {
    const lado = lados[r] ?? (r === 'tronco' || r === 'peito' || r === 'barriga' ? 'R' : 'L');
    if (m5 && m50) {
      pontos[r] = tela5(m5.alvo[r][lado]);
      alvos[r] = tela5(m50.alvo[r][lado]);
      continue;
    }
    const w = ALVO[r][lado];
    pontos[r] = tela(w);
    alvos[r] = fixa(w);
  }
  // o anel: a seta vai até ele, não até o cabelo
  if (anel && m5 && m50) {
    const lado = lados[anel.parte] === 'R' ? 'R' : 'L';
    pontos[anel.parte] = tela5(m5.anel[lado]);
    alvos[anel.parte] = tela5(m50.anel[lado]);
  } else if (anel) {
    const w: W = ['T', lados[anel.parte] === 'R' ? 153 : 47, 90];
    pontos[anel.parte] = tela(w);
    alvos[anel.parte] = fixa(w);
  }
  // o tanque que cresce do músculo
  const tanqueW = 600;
  const tanqueH = tanqueW * 1.35;
  const tanqueC: Pt = [540, 820];
  const tanqueAt = at(s, reservaCue, 1e9);
  const tanqueK = reserva ? spring({ frame: frame - tanqueAt, fps, config: MOLA.entra }) : 0;
  const tanqueDe = m5 ? tela5(m5.alvo.musculos.R) : tela(ALVO.musculos.R);
  const res = reserva ? reservaAt(s, reserva, frame) : null;
  const rotulos: RotuloSpec[] = [
    ...(pr.rotulos ?? []),
    ...rotulosRegiao,
    // o nome do estoque fica embaixo do tanque (em cima dele cairia no aro)
    ...(reserva?.rotulo ? [{ text: reserva.rotulo.text, cue: reserva.rotulo.cue, x: 540, y: Math.round(tanqueC[1] + tanqueH / 2 + 16) }] : []),
  ];
  // o que o rótulo não pode cobrir: o rosto, o tronco e as pernas (sempre); a lente pequena enquanto
  // está aberta (crescida ela é o fundo, e o rótulo vai por cima); o tanque depois que ele chega
  // fase 3: a cabeça medida no desenho (rosto + cabelo), e os braços abertos também (o rótulo não
  // cobre o músculo que acende); antes, o retângulo largo do rosto de sempre
  const caixaDe = (ws: W[]): Rect => {
    const ps = ws.map(fixa);
    return [Math.min(...ps.map((p) => p[0])), Math.min(...ps.map((p) => p[1])), Math.max(...ps.map((p) => p[0])), Math.max(...ps.map((p) => p[1]))];
  };
  const rosto = f3 ? caixaDe([['T', 42, 24], ['T', 158, 152]]) : faceAt(CORPO_X, CORPO_PES, CORPO_SIZE);
  const bracos: Rect[] = f3
    ? (['L', 'R'] as const).map((f) => {
        const x0 = f === 'L' ? 47.5 : 131.5;
        return caixaDe([[f, x0, 150.5], [f, x0 + 21, 150.5], [f, x0, 220.5], [f, x0 + 21, 220.5]]);
      })
    : [];
  // v5: a cabeça (com o cabelo até os ombros), o tronco, os braços e as pernas medidos no corpo novo
  const busy: Rect[] = m50 ? caixas5(m50, tela5) : [rosto, [box.left + 47 * k, box.top + 147 * k, box.left + 153 * k, box.top + 222 * k], [box.left + 64 * k, box.top + 222 * k, box.left + 136 * k, PES + 6], ...bracos];
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
  // v5: a cabeça na tela (o halo, o brilho e o foco da câmera) e o raio dela em px
  const cab5 = m5 ? tela5(m5.g.cab) : null;
  const rCab5 = m5 ? m5.g.rCab * k : 0;
  const corpo = (
    <div style={{ position: 'absolute', inset: 0, opacity: corpoO }}>
      {/* a cabeça acesa: um halo atrás dela (o rosto fica intacto) */}
      {rCabeca > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: cab5
              ? `radial-gradient(circle ${Math.round(1.9 * rCab5)}px at ${cab5[0].toFixed(0)}px ${cab5[1].toFixed(0)}px, ${luz.cabeca!.cor}${Math.round(0x66 * rCabeca).toString(16).padStart(2, '0')} 0%, ${luz.cabeca!.cor}00 100%)`
              : `radial-gradient(circle ${Math.round(300 * kk)}px at ${tela(['T', 100, 92])[0].toFixed(0)}px ${tela(['T', 100, 92])[1].toFixed(0)}px, ${luz.cabeca!.cor}${Math.round(0x66 * rCabeca).toString(16).padStart(2, '0')} 0%, ${luz.cabeca!.cor}00 100%)`,
          }}
        />
      ) : null}
      {/* v5: a pele acesa é uma aura ATRÁS do corpo (o contorno do vidro é do estilo) */}
      {m5 && rPele ? (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <defs>
            <filter id={`${uid}a`} filterUnits="userSpaceOnUse" x={-60} y={-60} width={320} height={380}>
              <feGaussianBlur stdDeviation={14 / k} />
            </filter>
          </defs>
          <g transform={svgBox} opacity={0.7 * rPele.k * vidro}>
            <Aura5 m={m5} cor={rPele.cor} k={k} filtro={`url(#${uid}a)`} />
          </g>
        </svg>
      ) : null}
      {/* v5: a própria Pessoa vira vidro (tronco, braços e pernas; cabeça, mãos e pés vivos) */}
      <Ator t={frame} x={CORPO_X} y={PES} size={SIZE} pose={pose} arms="down" mood={mood} since={since} seed={who.seed} skin={who.skin} accent={C.violet} halo={false} {...(m5 ? { vidro } : {})} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <defs>
          <filter id={`${uid}g`} filterUnits="userSpaceOnUse" x={-60} y={-60} width={320} height={380}>
            <feGaussianBlur stdDeviation={m5 ? 12 / k : 2.6} />
          </filter>
          <linearGradient id={`${uid}v`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor={VIDRO_TOPO} />
            <stop offset="1" stopColor={VIDRO} />
          </linearGradient>
        </defs>
        <g transform={svgBox}>
          {/* o vidro: contorno (a união das partes engordada) e o corpo por cima — sem linha nas emendas */}
          {m5 ? null : (
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
          )}
          {/* o mapa de dentro em meio-tom, e o que acendeu por cima, com brilho macio */}
          <g opacity={0.3 * vidro}>{MAPA.map((r) => (m5 ? <Orgaos5 key={r} r={r} m={m5} cor={MEIO} k={k} /> : <Orgaos key={r} r={r} v={v} cor={MEIO} />))}</g>
          {(Object.keys(luz) as Regiao[]).map((r) =>
            luz[r] && luz[r]!.k > 0 ? (
              <g key={r}>
                <g filter={`url(#${uid}g)`} opacity={0.6 * luz[r]!.k}>
                  {m5 ? <Orgaos5 r={r} m={m5} cor={luz[r]!.cor} k={k} /> : <Orgaos r={r} v={v} cor={luz[r]!.cor} />}
                </g>
                <g opacity={0.85 * luz[r]!.k}>{m5 ? <Orgaos5 r={r} m={m5} cor={luz[r]!.cor} k={k} /> : <Orgaos r={r} v={v} cor={luz[r]!.cor} />}</g>
              </g>
            ) : null,
          )}
        </g>
        {/* o ponto quente da origem */}
        {origemK > 0 ? (
          <g opacity={origemK * (0.82 + 0.18 * Math.sin(frame / 7))}>
            <circle cx={O[0]} cy={O[1]} r={56 * kk} fill={origemCor} opacity={0.14} />
            <circle cx={O[0]} cy={O[1]} r={30 * kk} fill={origemCor} opacity={0.22} />
            <circle cx={O[0]} cy={O[1]} r={12 * kk} fill={origemCor} opacity={0.55} />
          </g>
        ) : null}
        {/* os caminhos que acenderam, o fio comum e as partículas */}
        <g>{pathsEl}</g>
        {fioRev > 0 ? (
          <line x1={O[0]} y1={O[1]} x2={O[0] + (D[0] - O[0]) * (fioRev / tronco.len)} y2={O[1] + (D[1] - O[1]) * (fioRev / tronco.len)} stroke={C.hi} strokeOpacity={0.42} strokeWidth={5 * kk} strokeLinecap="round" />
        ) : null}
        {pop > 0 && pop < 1 ? <circle cx={D[0]} cy={D[1]} r={(12 + 46 * pop) * kk} fill="none" stroke={C.hi} strokeWidth={5 * kk * (1 - pop)} opacity={0.85 * (1 - pop)} /> : null}
        <g>{partsEl}</g>
        {/* o anel em volta da cabeça: fecha de r 90 a 52 e deixa um ponto aceso e firme (v5: de 1,8 a
            1,04 raio da cabeça nova, os traços na mesma medida em px) */}
        {anel && anelK > 0 && m5 ? (
          <g transform={svgBox}>
            <circle cx={m5.g.cab[0]} cy={m5.g.cab[1]} r={m5.g.rCab * (1.8 - 0.76 * anelK)} fill="none" stroke={corRegiao(anel)} strokeWidth={14 / k} opacity={clamp01((frame - anelAt) / 5) * (0.95 - 0.25 * anelK)} />
            <circle cx={m5.g.cab[0]} cy={m5.g.cab[1]} r={m5.g.rCab * (1.8 - 0.76 * anelK)} fill="none" stroke={corRegiao(anel)} strokeWidth={30 / k} opacity={0.18 * anelK} filter={`url(#${uid}g)`} />
            {anelK > 0.9 ? (
              <g opacity={clamp01((frame - anelAt - 10) / 6)}>
                <circle cx={m5.anel.topo[0]} cy={m5.anel.topo[1]} r={30 / k} fill={corRegiao(anel)} opacity={0.3} />
                <circle cx={m5.anel.topo[0]} cy={m5.anel.topo[1]} r={18 / k} fill={corRegiao(anel)} />
                <circle cx={m5.anel.topo[0] - 5 / k} cy={m5.anel.topo[1] - 5 / k} r={6 / k} fill="#FFFFFF" opacity={0.7} />
              </g>
            ) : null}
          </g>
        ) : anel && anelK > 0 ? (
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
  );
  return (
    <Stage
      s={sObj}
      focus={{ pessoa: m5 ? tela5([m5.g.cab[0], m5.g.cab[1] + 0.16 * m5.g.rCab]) : tela(['T', 100, 100]), peca: reserva ? tanqueC : lente ? centro : O }}
      // os rótulos são da tela (fora da câmera, por cima de tudo): um push não corta a palavra
      tela={
        rotulos.length ? (
          grandeCorpo ? (
            <RotulosCorpo s={s} rotulos={rotulos} pontos={pontos} alvos={alvos} busy={busy} ocupa={ocupa} accent={accent} />
          ) : (
            <Rotulos s={s} rotulos={rotulos} pontos={pontos} busy={busy} ocupa={ocupa} accent={accent} />
          )
        ) : undefined
      }
    >
      {positive ? <Sfx at={turnAt} name="chime" /> : null}
      {/* um foco violeta atrás do corpo: o "por dentro" sem cenário (v5: atrás do meio do tronco, onde está o mapa) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: m5
            ? `radial-gradient(circle ${Math.round(560 * kk)}px at 540px ${Math.round(O[1])}px, rgba(123,92,255,${(0.16 * vidro).toFixed(3)}) 0%, rgba(123,92,255,0) 100%)`
            : `radial-gradient(circle ${f3 ? Math.round(560 * kk) : 560}px at 540px ${f3 ? Math.round(tela(['T', 100, 155])[1]) : 880}px, rgba(123,92,255,${(0.16 * vidro).toFixed(3)}) 0%, rgba(123,92,255,0) 100%)`,
        }}
      />
      {/* v5: as canelas e os pés somem dentro da faixa da legenda (a caixa grande passa da tela) */}
      {m5 ? (
        <CorteDaLegenda de={CORTE5.de} ate={CORTE5.ate}>
          {corpo}
        </CorteDaLegenda>
      ) : (
        corpo
      )}
      {/* fase 3: as pernas passam por trás da legenda — a mesma faixa escura da vinheta aberta dos lugares
          (o corpo some nela como o piso some), e a legenda não briga com o contorno do vidro */}
      {grandeCorpo ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,14,38,0) 1300px, rgba(10,14,38,0.76) 1425px, rgba(10,14,38,0.76) 1590px, rgba(10,14,38,0) 1720px)',
          }}
        />
      ) : null}
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
        cab5 ? (
          // v5: o brilho na medida da cabeça nova (2,4× o raio dela, como o da fase 3 na cabeça antiga)
          <div style={{ position: 'absolute', top: cab5[1] - 0.78 * 2.4 * rCab5, left: cab5[0] - 1.2 * rCab5 }}>
            <Brilho t={frame} size={2.4 * rCab5} on={ramp(frame, turnAt, 10)} />
          </div>
        ) : (
          <div style={{ position: 'absolute', top: f3 ? tela(['T', 100, 92])[1] - 312 * kk : 360, left: 540 - 200 * kk }}>
            <Brilho t={frame} size={400 * kk} on={ramp(frame, turnAt, 10)} />
          </div>
        )
      ) : null}
    </Stage>
  );
};

// ---------------------------------------------------------------- rótulos do corpo grande (fase 3)

/** As mesmas bordas do palco do rotulo.tsx (margem, abaixo da sobrancelha, acima da legenda). */
const PALCO = { margem: 28, topo: 290, fundo: 1360 };
/** Larguras que o rótulo de seta tenta na coluna do lado, da que quebra menos pra que quebra mais. */
const COLUNAS = [300, 250, 210, 190, 170];

/**
 * Vaga na coluna do lado do alvo, perto da altura dele. Com o corpo grande a coluna é estreita: o
 * rótulo quebra em duas linhas (e encolhe até 44) antes de ir pro outro lado — e nunca pro centro,
 * onde a seta cruzaria o rosto. Sem vaga dos dois lados: null (a fila de sempre decide).
 */
const vagaDoLado = (text: string, alvo: Pt, busy: Rect[]): Vaga | null => {
  const livre = (r: Rect) => r[0] >= PALCO.margem - 0.5 && r[2] <= 1080 - PALCO.margem + 0.5 && r[1] >= PALCO.topo && r[3] <= PALCO.fundo && !hits(busy, r);
  const pref: ('L' | 'R')[] = alvo[0] < 540 ? ['L', 'R'] : ['R', 'L'];
  for (const lado of pref) {
    const x = lado === 'L' ? PALCO.margem : 1080 - PALCO.margem;
    const align = lado === 'L' ? 'left' : 'right';
    for (let d = 0; d <= 760; d += 28) {
      for (const dy of d ? [d, -d] : [0]) {
        for (const max of COLUNAS) {
          const r0 = rotuloRect(text, x, 0, undefined, align, max);
          const y = Math.round(alvo[1] - (r0[3] - r0[1]) / 2 + dy);
          const r = rotuloRect(text, x, y, undefined, align, max);
          if (livre(r)) return { x, y, align, max, rect: r };
        }
      }
    }
  }
  return null;
};

/**
 * A fila dos rótulos no corpo grande: igual à do Stage (fora do `busy`, do que a cena `ocupa` no
 * trecho e dos rótulos que dividem a tela), mas o de seta procura a coluna do lado com quebra.
 */
const RotulosCorpo: React.FC<{
  s: MS;
  rotulos: RotuloSpec[];
  /** a ponta da seta (respira com o corpo) */
  pontos: Partial<Record<Regiao, Pt>>;
  /** o mesmo ponto parado: é por ele que a vaga é achada */
  alvos: Partial<Record<Regiao, Pt>>;
  busy: Rect[];
  ocupa: Ocupa[];
  accent: string;
}> = ({
  s,
  rotulos,
  pontos,
  alvos,
  busy,
  ocupa,
  accent,
}) => {
  useFontesDoRotulo();
  const placed: { rect: Rect; win: [number, number] }[] = [];
  return (
    <>
      {rotulos.map((r, i) => {
        const win: [number, number] = [cue(s, r.cue), r.out ? cue(s, r.out) + 8 : Infinity];
        const seta = Array.isArray(r.seta) ? r.seta : r.seta ? pontos[r.seta] : undefined;
        const alvo = Array.isArray(r.seta) ? r.seta : r.seta ? alvos[r.seta] : undefined;
        // os que dividem a tela com este, com a mesma folga de 16 px da fila do Stage
        const outros = placed.filter((p) => p.win[0] < win[1] && win[0] < p.win[1]).map((p) => [p.rect[0] - 16, p.rect[1] - 16, p.rect[2] + 16, p.rect[3] + 16] as Rect);
        const agora = ocupa.filter((o) => (o.de ?? -Infinity) < win[1] && win[0] < (o.ate ?? Infinity)).map((o) => o.rect);
        const bz = [...busy, ...agora, ...outros];
        let v: Vaga;
        if (r.x !== undefined || r.y !== undefined) {
          const x = r.x ?? 540;
          const y = r.y ?? 480;
          v = { x, y, align: 'center', max: r.max ?? 620, rect: rotuloRect(r.text, x, y) };
        } else v = (alvo ? vagaDoLado(r.text, alvo, bz) : null) ?? achaVaga(r.text, bz, { alvo });
        placed.push({ rect: v.rect, win });
        return <Rotulo key={i} s={s} text={r.text} cue={r.cue} out={r.out} x={v.x} y={v.y} align={v.align} max={v.max} tom={r.tom} seta={seta} accent={accent} />;
      })}
    </>
  );
};

// ===================================================================== plano lupa
/**
 * Onde ela fica: no meio do lugar antes da lente; no canto de baixo à esquerda com a lente aberta.
 * `grande` (fase 3, `pessoa: "grande"`): em vez de encolher pro canto, ela CRESCE e chega perto da
 * câmera — 480 px, cortada pela faixa da legenda na altura do quadril (a base do quadro da fase 3),
 * o rosto inteiro embaixo da lente e a barriga ainda acima da legenda (a âncora tem que aparecer).
 */
const LUPA = { meio: { x: 540, pes: 1340, size: 360 }, canto: { x: 230, pes: 1370, size: 330 }, grande: { x: 215, pes: 1500, size: 480 }, centro: [610, 720] as Pt, diam: 760 };
/** Boneco v5, pessoa grande: quantos quadros antes da lente ela começa a ir pro canto (a mola assenta em ≈ 15). */
const ANTES5 = 18;

/**
 * Boneco v5: o ponto do braço que segura a peça é o DELTOIDE — o ombro da peça um quinto pra dentro do
 * braço, empurrado pra borda de fora. O meio do caminho ombro → mão (bracoDe) e até o meio do braço de
 * cima caem no meio do peito quando o braço da frente cruza o corpo de 3/4 (o cone lia "no peito").
 */
const deltoide5 = (c5: ReturnType<typeof corpoV5>, box: Box): Pt => {
  const [S, E] = [c5.ombro[1], c5.cotovelo[1]];
  const fora = Math.sign(S[0] - c5.peito[0]) || 1;
  const r = 0.15 * Math.hypot(E[0] - S[0], E[1] - S[1]);
  const kb = box.size / 200;
  return [box.left + (S[0] + 0.2 * (E[0] - S[0]) + fora * 0.5 * r) * kb, box.top + (S[1] + 0.2 * (E[1] - S[1])) * kb];
};

/**
 * O véu da lupa com a pessoa grande (acabamento da fase 3): o de 0,55 deixava o banheiro, a cozinha e
 * o parque quase pretos (o lugar só se lia pela silhueta). Aqui o lugar escurece só 0,3 e uma vinheta
 * redonda em volta da lente (0,4 colada no aro, some 260 px pra fora) mantém o círculo como o foco.
 * Os dois passam 80 px da borda: a câmera na mão não mostra a beira do véu.
 */
const VEU_GRANDE = { lugar: 0.3, aro: 0.4, some: 260, sobra: 80 };
const VeuGrande: React.FC<{ k: number }> = ({ k }) => {
  const { sobra: o, some } = VEU_GRANDE;
  const r = LUPA.diam / 2;
  const box: React.CSSProperties = { position: 'absolute', left: -o, top: -o, width: 1080 + 2 * o, height: 1920 + 2 * o };
  return (
    <>
      <div style={{ ...box, background: `rgba(10,14,38,${(VEU_GRANDE.lugar * k).toFixed(3)})` }} />
      <div
        style={{
          ...box,
          background: `radial-gradient(circle ${r + some}px at ${LUPA.centro[0] + o}px ${LUPA.centro[1] + o}px, rgba(10,14,38,${(VEU_GRANDE.aro * k).toFixed(3)}) ${r}px, rgba(10,14,38,0) ${r + some}px)`,
        }}
      />
    </>
  );
};

/**
 * A pessoa grande da lupa some num fade antes da faixa da legenda (acabamento da fase 3): o quadril e
 * as pernas passavam por baixo da legenda. O corte é da TELA (1380 → 1440, onde a vinheta aberta
 * fecha) e o Ator mora na camada da câmera: a linha volta pela câmera do quadro (o inverso do Layer
 * de profundidade 1; o giro da mão, ±0,2°, fica de fora). A máscara passa 200 px da borda pra não
 * cortar o cabelo que sai do quadro quando a câmera anda. `de`/`ate` trocam a faixa (o plano corpo do
 * boneco v5 usa o mesmo corte, mais embaixo: CORTE5).
 */
const CORTE = { de: 1380, ate: 1440, sobra: 200 };
const CorteDaLegenda: React.FC<{ children: React.ReactNode; de?: number; ate?: number }> = ({ children, de = CORTE.de, ate = CORTE.ate }) => {
  const c = useCam();
  const o = CORTE.sobra;
  const y = (sy: number) => c.oy + (sy - c.oy - c.y - (c.hy ?? 0)) / c.scale + o;
  const g = `linear-gradient(180deg, #000 ${y(de).toFixed(1)}px, rgba(0,0,0,0) ${y(ate).toFixed(1)}px)`;
  return (
    <div style={{ position: 'absolute', left: -o, top: -o, width: 1080 + 2 * o, height: 1920 + 2 * o, WebkitMaskImage: g, maskImage: g }}>
      <div style={{ position: 'absolute', left: o, top: o, width: 1080, height: 1920 }}>{children}</div>
    </div>
  );
};

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
  const { meio } = LUPA;
  const grande = pr.pessoa === 'grande';
  const canto = grande ? LUPA.grande : LUPA.canto;
  // boneco v5 com a pessoa grande: ela vai pro canto ANTES da lente (ANTES5 quadros) — a lente abrindo
  // com ela ainda no meio nascia em cima da cabeça dela ("um tanque no lugar da cabeça")
  const primeiroEla = !!v5() && grande && !!lente?.cue;
  const elaAt = lente?.cue ? cue(s, lente.cue) - (primeiroEla ? ANTES5 : 0) : -Infinity;
  const kEla = primeiroEla ? spring({ frame: frame - elaAt, fps, config: MOLA.entra }) * (1 - volta) : k;
  const x = meio.x + (canto.x - meio.x) * kEla;
  const pes = meio.pes + (canto.pes - meio.pes) * kEla;
  const size = meio.size + (canto.size - meio.size) * kEla;
  const pd0 = poseDe(s, pr.acoes, frame);
  // boneco v5 sem ações: a pose vazia não carrega o enquadramento, e os pontos do corpo (pontoNaTela,
  // maoNaTela, corpoV5) sairiam do corpo inteiro enquanto a Pessoa desenha o busto da cena (o anel da
  // lente caía na testa). A pose parada com o enquadramento da cena desenha igual e acerta os pontos.
  const pd = !pd0.pose && v5() ? { ...pd0, pose: { mistura: 0, v5: { vista: vistaDaCena([]), enquadra: enquadraDe(s.scene, s.props), itens: [] } } } : pd0;
  const cx = x + pd.x;
  const box: Box = { left: cx - size / 2, top: pes - size * 1.26, size };
  const mao = pd.peca ?? pr.holding;
  // com a peça na mão o braço fica estendido: braço/vasos/músculos no braço de cima (o ponto `braco`
  // de CORPO é do braço pendurado e cairia na cintura)
  const c5 = v5() ? corpoV5(pd.pose, mao || pd.maos ? 'out' : 'down') : null;
  const pontos = (() => {
    const p = pontosDe(box, pd.pose);
    if (!mao) return p;
    const br = c5 ? deltoide5(c5, box) : bracoDe(box, 'out', pd.pose);
    return { ...p, braco: br, vasos: br, musculos: br };
  })();
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
  // grande: com a âncora embaixo do rosto (barriga, peito, mão), o cone passa por TRÁS da cabeça dela
  // boneco v5: a cabeça é a do corpo novo (menor e mais alta, no busto ou de corpo inteiro). A máscara do
  // cone leva o cabelo (sobe 1,45 raio, desce 1,15 — o queixo, não o ombro); "a âncora está na cabeça"
  // é medido no crânio só: bebendo, o ombro fica colado no queixo e a elipse com cabelo engolia a âncora
  // (sem máscara, o cone cortava o rosto dela)
  const cab5 = c5;
  const cabeca: [number, number, number, number] = (() => {
    if (!cab5) return [box.left + 0.5 * size, box.top + 0.46 * size, 0.31 * size, 0.35 * size];
    const kb = size / 200;
    const r = cab5.raioCabeca * kb;
    return [box.left + cab5.cabeca[0] * kb, box.top + cab5.cabeca[1] * kb - 0.15 * r, 1.3 * r, 1.3 * r];
  })();
  const naCabeca = cab5
    ? Math.hypot(ancora[0] - (box.left + (cab5.cabeca[0] * size) / 200), ancora[1] - (box.top + (cab5.cabeca[1] * size) / 200)) < (cab5.raioCabeca * size) / 200
    : ((ancora[0] - cabeca[0]) / cabeca[2]) ** 2 + ((ancora[1] - cabeca[1]) / cabeca[3]) ** 2 < 1;
  const atras = grande && !naCabeca ? [cabeca] : undefined;
  // v5 com a pessoa grande: a lente nasce no ombro e o caminho até o lugar dela cruza a cabeça — pequena
  // ali, ela lia "um tanque no lugar da cabeça". Ela só aparece (fade de 3 quadros) quando já abriu
  // 60% e o disco (o mesmo centro e raio que a Lente calcula) deixou o ROSTO de fora: grande e indo pro
  // canto de cima, ela passa por trás da cabeça (a cópia da cabeça vem por cima). Sem achar, aparece
  // quando a mola assenta (12 quadros).
  const lenteVis = (() => {
    if (!primeiroEla || !lente?.cue || !cab5) return 1;
    const openAt = cue(s, lente.cue);
    const kb = size / 200;
    const H: Pt = [box.left + cab5.cabeca[0] * kb, box.top + cab5.cabeca[1] * kb];
    const rosto = cab5.raioCabeca * kb;
    let f0 = openAt + 12;
    for (let f = openAt; f < openAt + 12; f++) {
      const kl = spring({ frame: f - openAt, fps, config: MOLA.entra });
      const C: Pt = [ancora[0] + (LUPA.centro[0] - ancora[0]) * kl, ancora[1] + (LUPA.centro[1] - ancora[1]) * kl];
      if (kl >= 0.6 && Math.hypot(C[0] - H[0], C[1] - H[1]) >= (LUPA.diam * kl) / 2 + 0.6 * rosto) {
        f0 = f;
        break;
      }
    }
    return clamp01((frame - f0 + 1) / 3);
  })();
  // as duas posições dela (o primeiro plano sai das duas; o rótulo, de onde ela está naquele trecho)
  const corpoEm = (p: typeof meio): Rect => [p.x - 0.4 * p.size, p.pes - 1.22 * p.size, p.x + 0.62 * p.size, p.pes];
  const ela: Rect[] = lente ? (lente.cue ? [corpoEm(meio), corpoEm(canto)] : [corpoEm(canto)]) : [corpoEm(meio)];
  const comLente = !!lente;
  const abreAt = lente?.cue ? cue(s, lente.cue) : -Infinity;
  const fechaAt = lente?.fecha ? cue(s, lente.fecha) : Infinity;
  const ocupa: Ocupa[] = !lente
    ? [{ rect: corpoEm(meio) }]
    : [
        ...(lente.cue ? [{ rect: corpoEm(meio), ate: elaAt + 17 }] : []),
        { rect: corpoEm(canto), de: elaAt, ate: fechaAt + 17 },
        ...(lente.fecha ? [{ rect: corpoEm(meio), de: fechaAt }] : []),
        ...discoRects(LUPA.centro, LUPA.diam).map((rect) => ({ rect, de: abreAt, ate: fechaAt + 8 })),
      ];
  const sObj: MS = { ...s, props: { ...pr, rotulos: undefined } };
  const geo: EnvGeo = {
    ground: meio.pes,
    clear: comLente ? (lente!.cue ? [grande ? 0 : 60, 740] : grande ? [0, 520] : [60, 420]) : [350, 740],
    spot: [cx, pes - size * 0.66, 380 + (grande ? 40 : -80) * kEla],
    busy: [...(comLente ? [lr] : []), ...ela],
    // com a lente o lugar fica escuro: o primeiro plano (que o véu não pega) sai dos dois cantos
    frontOff: comLente ? ['left', 'right'] : [],
    show: [mao],
  };
  const veu = 0.55 * clamp01(k);
  const ator = (
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
  );
  return (
    <Stage
      s={sObj}
      geo={geo}
      focus={{ pessoa: pontos.rosto, peca: comLente ? LUPA.centro : ancora }}
      tela={pr.rotulos?.length ? <Rotulos s={s} rotulos={pr.rotulos} pontos={pontos} ocupa={ocupa} accent={accent} /> : undefined}
    >
      {positive ? <Sfx at={turnAt} name="chime" /> : null}
      {/* o lugar escurece (véu navy) quando a lente abre: o assunto passa a ser o que está dentro dela */}
      {/* com a pessoa grande: véu mais leve (o lugar se lê) e a vinheta só em volta da lente */}
      {veu > 0.001 ? grande ? <VeuGrande k={clamp01(k)} /> : <div style={{ position: 'absolute', inset: 0, background: `rgba(10,14,38,${veu.toFixed(3)})` }} /> : null}
      {grande ? <CorteDaLegenda>{ator}</CorteDaLegenda> : ator}
      {positive && !(idHalo && mood === 'feliz') ? (
        <div style={{ position: 'absolute', top: pes - size * 1.3, left: cx - size * 0.6 }}>
          <Brilho t={frame} size={size * 1.2} on={ramp(frame, turnAt, 10)} />
        </div>
      ) : null}
      {lente ? (
        primeiroEla ? (
          lenteVis > 0 ? (
            <div style={{ position: 'absolute', inset: 0, opacity: lenteVis }}>
              <Lente s={s} spec={lente} ancora={ancora} centro={LUPA.centro} diametro={LUPA.diam} accent={accent} pele={pele} atras={atras} />
            </div>
          ) : null
        ) : (
          <Lente s={s} spec={lente} ancora={ancora} centro={LUPA.centro} diametro={LUPA.diam} accent={accent} pele={pele} atras={atras} />
        )
      ) : null}
      {/* v5 com a pessoa grande: a cabeça dela vem por CIMA da lente (uma cópia dela recortada na elipse
          da cabeça) — a lente nasce no ombro e passa por trás da cabeça até o lugar dela, nunca no rosto.
          Com a âncora NA cabeça (lente no rosto) não: a cópia cobriria o anel da âncora */}
      {primeiroEla && !naCabeca && abre > 0.002 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            WebkitMaskImage: `radial-gradient(ellipse ${cabeca[2].toFixed(1)}px ${cabeca[3].toFixed(1)}px at ${cabeca[0].toFixed(1)}px ${cabeca[1].toFixed(1)}px, #000 97%, rgba(0,0,0,0) 100%)`,
            maskImage: `radial-gradient(ellipse ${cabeca[2].toFixed(1)}px ${cabeca[3].toFixed(1)}px at ${cabeca[0].toFixed(1)}px ${cabeca[1].toFixed(1)}px, #000 97%, rgba(0,0,0,0) 100%)`,
          }}
        >
          {ator}
        </div>
      ) : null}
    </Stage>
  );
};
