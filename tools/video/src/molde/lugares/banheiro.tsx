// Banheiro (fase 3, agente D): a câmera é o espelho. Ela aparece de frente, atrás da pia, e o que se
// vê atrás dela é o reflexo do cômodo; a moldura do espelho, presa à tela, diz "me olhando no
// espelho" de relance.
//
//   back  azulejo metrô claro-frio até o alto, box com cortina à esquerda (o chuveiro na fresta),
//         janelinha alta fosca, prateleira de vidro com frascos sem rótulo, toalha no gancho, luz
//         quente de cima, piso de pastilha e tapetinho
//   mid   sem mesa (cena que não é a mesa): uma pia de coluna ao lado, fora da faixa dela
//   front a moldura do espelho (retângulo arredondado de 26 px, x 24..1056, y 250..1400: nunca sobre a
//         sobrancelha nem sobre a legenda), a parede fora dele, dois reflexos diagonais sutis e o
//         embaçado respirando nos 4 cantos (sai de cima de peça)
//   Balcao a pia da cena mesa: tampo com cuba oval, torneira pingando uma gota a cada 40 q, copo de
//         escovas e gabinete
//
// Gente: só nenhuma (é o espelho dela). Não se confunde com a cozinha: cor fria, sem armário alto nem
// janela grande. Contrato: `Lugar` em ../ambientes; nunca importado pelo ambientes.tsx.
import React from 'react';
import { SET, SkyDefs } from '../../elenco/cenario';
import { C } from '../../theme';
import type { Hora } from '../spec';
import { v5 } from '../../boneco/ativo';
import { ArtSvg, decor, free, hits, inside, type EnvP, type Lugar, type Rect } from '../ambientes';
import { Ladrilho } from './cozinha';

/** Paleta fria (o banheiro é o cômodo azul; a cozinha puxa pro quente). */
const B = {
  tile: '#2B3A76',
  tileHi: 'rgba(255,255,255,0.05)',
  grout: 'rgba(9,13,40,0.42)',
  paint: '#1D2558',
  curtain: '#2F5574',
  curtainDark: '#244560',
  steel: '#55609F',
  porcelain: '#46548F',
  vanity: '#26305F',
  slab: '#3C4A8A',
  slabEdge: '#323F7E',
  towel: '#544676',
  towelDark: '#46396A',
} as const;
const SHADE = 'rgba(5,7,26,0.24)';

/** Onde mora cada coisa (coordenadas do cenário: horizonte em y = 1000). */
const BAN = {
  /** o azulejo sobe até aqui (acima, parede pintada) */
  azulejo: 250,
  box: { x0: -170, x1: 336, rod: 300, fresta: 200 },
  janela: { x: 650, y: 300, w: 170, h: 126 },
  prateleira: { x0: 606, x1: 862, y: 612 },
  frascos: [612, 500, 856, 612] as Rect,
  /** a toalha termina acima da torneira da pia de coluna */
  toalha: [902, 452, 1012, 712] as Rect,
};

// ===================================================================== partes
/** Janelinha alta de vidro fosco: só luz, sem vista. A hora muda o tom do vidro. */
const VIDRO: Record<Hora, [string, string]> = {
  manha: ['#8C7AA4', '#5E5A92'],
  dia: ['#6F84C2', '#4D5FA0'],
  noite: ['#1E2558', '#161C4A'],
};
const Janelinha: React.FC<{ id: string; x: number; y: number; w: number; h: number; hora: Hora; t: number }> = ({ id, x, y, w, h, hora, t }) => {
  const [a, b] = VIDRO[hora];
  const glow = hora === 'noite' ? 0 : 0.5 + 0.12 * Math.sin(t / 47);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fosco`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={12} fill={SET.frame} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill={`url(#${id}-fosco)`} />
      {/* textura do fosco: estrias verticais, e o sol como mancha sem forma */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={x + 8 + i * ((w - 16) / 9)} y={y + 4} width={6} height={h - 8} rx={3} fill="rgba(255,255,255,0.06)" />
      ))}
      {glow ? <ellipse cx={x + w * (hora === 'manha' ? 0.7 : 0.4)} cy={y + h * 0.35} rx={w * 0.32} ry={h * 0.3} fill={hora === 'manha' ? C.gold2 : C.hi} opacity={0.22 * glow} /> : null}
      <rect x={x + w / 2 - 6} y={y} width={12} height={h} fill={SET.frame} />
      <rect x={x - 22} y={y + h + 10} width={w + 44} height={16} rx={6} fill={SET.furnTop} />
    </g>
  );
};

/** Box com cortina (franzida à esquerda, uma fresta mostra o chuveiro), barra e argolas, piso do box. */
const Box: React.FC<{ t: number }> = ({ t }) => {
  const { x0, x1, rod, fresta } = BAN.box;
  const sw = Math.sin(t / 50) * 6;
  const folds = Math.ceil((fresta - x0) / 34);
  const hem = 972;
  // borda de baixo ondulada (o pano franzido)
  const wave = Array.from({ length: folds + 1 }, (_, i) => `${x0 + i * 34} ${hem + (i % 2 ? 10 : 0)}`).join(' L');
  return (
    <g>
      {/* dentro do box: azulejo mais escuro e o chuveiro de parede */}
      <rect x={x0} y={rod} width={x1 - x0} height={1004 - rod} fill="rgba(5,7,26,0.28)" />
      <rect x={292} y={rod + 50} width={10} height={150} rx={5} fill={B.steel} />
      <path d={`M297 ${rod + 200} q0 26 -30 30`} stroke={B.steel} strokeWidth={10} fill="none" strokeLinecap="round" />
      <ellipse cx={262} cy={rod + 236} rx={34} ry={11} fill={B.steel} />
      <ellipse cx={262} cy={rod + 240} rx={26} ry={6} fill="rgba(5,7,26,0.35)" />
      <rect x={x0 - 10} y={966} width={x1 - x0 + 20} height={38} rx={8} fill="#3A4888" />
      <rect x={x0 - 10} y={966} width={x1 - x0 + 20} height={6} rx={3} fill="rgba(255,255,255,0.07)" />
      {/* cortina */}
      <path d={`M${x0} ${rod + 6} L${fresta} ${rod + 6} Q${fresta + 14 + sw} ${(rod + hem) / 2} ${fresta + 4} ${hem} L${wave} Z`} fill={B.curtain} />
      {Array.from({ length: folds }, (_, i) => (
        <rect key={i} x={x0 + i * 34 + 6} y={rod + 8} width={14} height={hem - rod - 6} rx={7} fill={i % 2 ? B.curtainDark : 'rgba(255,255,255,0.04)'} />
      ))}
      <rect x={fresta - 26} y={rod + 8} width={30} height={hem - rod - 8} rx={12} fill="rgba(5,7,26,0.2)" />
      {/* barra e argolas */}
      <rect x={x0 - 20} y={rod - 8} width={x1 - x0 + 30} height={12} rx={6} fill={B.steel} />
      {Array.from({ length: folds + 1 }, (_, i) => (
        <circle key={i} cx={x0 + i * 34} cy={rod + 4} r={8} fill="none" stroke={B.steel} strokeWidth={4} />
      ))}
    </g>
  );
};

/** Prateleira de vidro com frascos sem rótulo (bomba, pote, frasco alto, copinho). */
const Frascos: React.FC<{ x0: number; x1: number; y: number; on: boolean }> = ({ x0, x1, y, on }) => (
  <g>
    {on ? (
      <>
        {/* frasco com bomba */}
        <rect x={x0 + 24} y={y - 82} width={42} height={82} rx={12} fill="#4D6596" />
        <rect x={x0 + 45} y={y - 82} width={21} height={82} rx={10} fill={SHADE} />
        <rect x={x0 + 40} y={y - 104} width={10} height={24} rx={3} fill={B.steel} />
        <rect x={x0 + 40} y={y - 108} width={26} height={8} rx={4} fill={B.steel} />
        {/* pote baixo */}
        <rect x={x0 + 84} y={y - 42} width={52} height={42} rx={12} fill="#6A5A8E" />
        <rect x={x0 + 80} y={y - 52} width={60} height={14} rx={6} fill="#7B6CA0" />
        <rect x={x0 + 110} y={y - 42} width={26} height={42} rx={10} fill={SHADE} />
        {/* frasco alto */}
        <rect x={x0 + 154} y={y - 108} width={32} height={108} rx={10} fill="#3F7486" />
        <rect x={x0 + 160} y={y - 126} width={20} height={20} rx={5} fill="#2F5B6A" />
        <rect x={x0 + 170} y={y - 108} width={16} height={108} rx={8} fill={SHADE} />
        {/* copinho de vidro */}
        <path d={`M${x0 + 202} ${y - 46} h38 l-4 46 h-30z`} fill="rgba(170,185,240,0.2)" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={x0 + 26 + i * 54} y={y - 70 + (i % 2) * 24} width={6} height={30} rx={3} fill="rgba(255,255,255,0.1)" />
        ))}
      </>
    ) : null}
    <rect x={x0} y={y} width={x1 - x0} height={9} rx={4} fill="rgba(170,185,240,0.24)" />
    <rect x={x0 + 18} y={y + 8} width={8} height={18} rx={3} fill={B.steel} />
    <rect x={x1 - 26} y={y + 8} width={8} height={18} rx={3} fill={B.steel} />
  </g>
);

/** Toalha pendurada no gancho, dobrada por cima, com uma faixa na barra. `r` = onde ela ocupa. */
const Toalha: React.FC<{ r: Rect; t: number }> = ({ r, t }) => {
  const [x0, y0, x1, y1] = r;
  const cx = (x0 + x1) / 2;
  const sw = Math.sin(t / 60) * 1.2;
  return (
    <g transform={`rotate(${sw} ${cx} ${y0})`}>
      <circle cx={cx} cy={y0 + 6} r={9} fill={B.steel} />
      <path d={`M${x0 + 4} ${y0 + 30} q${(x1 - x0) / 2 - 4} -26 ${x1 - x0 - 8} 0 L${x1} ${y1} q-${(x1 - x0) / 2} 12 -${x1 - x0} 0Z`} fill={B.towel} />
      <path d={`M${cx} ${y0 + 18} q${(x1 - x0) / 2 - 4} 0 ${(x1 - x0) / 2 - 4} 12 L${x1} ${y1} q-${(x1 - x0) / 4} 6 -${(x1 - x0) / 2} 6Z`} fill={SHADE} />
      <rect x={x0 + 2} y={y0 + 34} width={x1 - x0 - 4} height={44} rx={10} fill={B.towelDark} />
      <rect x={x0} y={y1 - 70} width={x1 - x0} height={14} fill="rgba(255,255,255,0.08)" />
      <rect x={x0} y={y1 - 50} width={x1 - x0} height={6} fill="rgba(255,255,255,0.06)" />
    </g>
  );
};

// ===================================================================== fundo
const Back: React.FC<EnvP> = (p) => {
  const { t, hora, show } = p;
  const id = `ban-${hora}`;
  const w = BAN.janela;
  // enfeite segue a regra do meio: com peça em cima, anda pela parede ou sai
  const towel = decor(p, BAN.toalha, [0, 60, -140]);
  const bottles = !show.includes('planta') && decor(p, BAN.frascos) !== null;
  return (
    <ArtSvg>
      <SkyDefs id={id} hora={hora} />
      <defs>
        {/* azulejo metrô (96 × 44, fiadas desencontradas) com rejunte escuro */}
        <pattern id={`${id}-metro`} patternUnits="userSpaceOnUse" x={0} y={1000} width={96} height={88}>
          <rect width={96} height={88} fill={B.tile} />
          <rect width={96} height={3} fill={B.grout} />
          <rect y={44} width={96} height={3} fill={B.grout} />
          <rect width={3} height={44} fill={B.grout} />
          <rect x={48} y={44} width={3} height={44} fill={B.grout} />
          <rect x={4} y={4} width={88} height={5} rx={2} fill={B.tileHi} />
          <rect x={4} y={48} width={40} height={5} rx={2} fill={B.tileHi} />
          <rect x={52} y={48} width={40} height={5} rx={2} fill={B.tileHi} />
        </pattern>
        <radialGradient id={`${id}-teto`} cx="0.5" cy="0" r="0.7">
          <stop offset="0" stopColor={C.gold2} stopOpacity={hora === 'noite' ? 0.16 : 0.1} />
          <stop offset="1" stopColor={C.gold2} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-400} y={-600} width={1880} height={1600} fill={B.paint} />
      <rect x={-400} y={BAN.azulejo} width={1880} height={1000 - BAN.azulejo} fill={`url(#${id}-metro)`} />
      <rect x={-400} y={BAN.azulejo - 10} width={1880} height={12} rx={4} fill="#34437F" />
      {/* luz quente de cima (o plafon fora do quadro) */}
      <rect x={-400} y={-600} width={1880} height={1600} fill={`url(#${id}-teto)`} />
      <Janelinha id={id} x={w.x} y={w.y} w={w.w} h={w.h} hora={hora} t={t} />
      <Frascos x0={BAN.prateleira.x0} x1={BAN.prateleira.x1} y={BAN.prateleira.y} on={bottles} />
      {towel === null ? null : (
        <>
          <rect x={BAN.toalha[0] + towel - 8} y={BAN.toalha[1] - 4} width={BAN.toalha[2] - BAN.toalha[0] + 16} height={10} rx={5} fill={B.steel} />
          <Toalha r={[BAN.toalha[0] + towel, BAN.toalha[1], BAN.toalha[2] + towel, BAN.toalha[3]]} t={t} />
        </>
      )}
      <Box t={t} />
      <Ladrilho id={id} y={1000} step={84} spread={170} rows={[0, 20, 44, 72, 106, 146, 194, 252, 322, 408, 514, 646, 810, 1010]} checker={false} grout="rgba(5,7,26,0.26)" />
      {/* tapetinho na frente do box */}
      <rect x={-40} y={1030} width={300} height={42} rx={20} fill="#34507A" opacity={0.85} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={-20 + i * 96} y={1040} width={60} height={22} rx={11} fill="rgba(255,255,255,0.05)" />
      ))}
    </ArtSvg>
  );
};

// ===================================================================== meio
/** A pia de coluna (só quando a cena não tem mesa): do lado livre, fora do que a cena desenha. */
const PIA = { top: 790, base: 1006 };
const piaRect = (x: number): Rect => [x - 112, PIA.top - 70, x + 112, PIA.base];
const Mid: React.FC<EnvP> = ({ desk, clear, busy, view }) => {
  if (desk) return null;
  const x = [900, 180, 960].find((c) => free(clear, c - 112, c + 112) && !hits(busy, piaRect(c)) && inside(view, [c - 112, PIA.top, c + 112, PIA.top + 60])) ?? null;
  if (x === null) return null;
  return (
    <ArtSvg>
      <ellipse cx={x} cy={PIA.base} rx={70} ry={7} fill="rgba(0,0,0,0.3)" />
      {/* coluna */}
      <path d={`M${x - 30} ${PIA.top + 40} h60 l-12 ${PIA.base - PIA.top - 40} h-36z`} fill={B.porcelain} />
      <path d={`M${x} ${PIA.top + 40} h30 l-12 ${PIA.base - PIA.top - 40} h-18z`} fill={SHADE} />
      {/* cuba */}
      <path d={`M${x - 112} ${PIA.top} h224 q0 52 -70 58 h-84 q-70 -6 -70 -58z`} fill={B.porcelain} />
      <path d={`M${x} ${PIA.top} h112 q0 52 -70 58 h-42z`} fill={SHADE} />
      <rect x={x - 116} y={PIA.top - 10} width={232} height={16} rx={8} fill="#52609A" />
      {/* torneira */}
      <rect x={x - 6} y={PIA.top - 54} width={12} height={46} rx={5} fill={B.steel} />
      <path d={`M${x} ${PIA.top - 50} q0 -14 -22 -14`} stroke={B.steel} strokeWidth={10} fill="none" strokeLinecap="round" />
    </ArtSvg>
  );
};

// ===================================================================== primeiro plano (preso à tela)
/** O espelho: x 24..1056, y 250..1400, cantos de 26 px. */
const ESP = { x0: 24, y0: 250, x1: 1056, y1: 1400, r: 26 };
const roundRect = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${x0 + r} ${y0} H${x1 - r} A${r} ${r} 0 0 1 ${x1} ${y0 + r} V${y1 - r} A${r} ${r} 0 0 1 ${x1 - r} ${y1} H${x0 + r} A${r} ${r} 0 0 1 ${x0} ${y1 - r} V${y0 + r} A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`;

const Front: React.FC<EnvP> = ({ t, noLeft, noRight, busy, view }) => {
  // o front é preso à tela, mas o `busy` chega em coordenadas do cenário: volta pro quadro
  const dy = -view[1];
  const busyQ: Rect[] = busy.map(([a, b, c, d]) => [a, b + dy, c, d + dy]);
  const breath = 0.78 + 0.22 * Math.sin(t / 53) * Math.sin(t / 29 + 0.7);
  const R = 230;
  const corners = [
    { x: ESP.x0, y: ESP.y0, side: 'left' as const },
    { x: ESP.x1, y: ESP.y0, side: 'right' as const },
    { x: ESP.x0, y: ESP.y1, side: 'left' as const },
    { x: ESP.x1, y: ESP.y1, side: 'right' as const },
  ].filter((k) => !(k.side === 'left' ? noLeft : noRight) && !hits(busyQ, [k.x - R * 0.6, k.y - R * 0.6, k.x + R * 0.6, k.y + R * 0.6]));
  // dois reflexos diagonais no canto de cima à esquerda (longe do rosto); saem de cima de peça
  const bands = [
    { a: 300, w: 64 },
    { a: 404, w: 26 },
  ].filter((b) => !hits(busyQ, [ESP.x0, ESP.y0, b.a + b.w, ESP.y0 + b.a + b.w - ESP.x0]));
  const inner = roundRect(ESP.x0, ESP.y0, ESP.x1, ESP.y1, ESP.r);
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <clipPath id="ban-espelho">
          <path d={inner} />
        </clipPath>
        <radialGradient id="ban-embacado">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.3} />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0.11} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* o vidro: embaçado nos cantos e os dois reflexos */}
      <g clipPath="url(#ban-espelho)">
        {corners.map((k, i) => (
          <circle key={i} cx={k.x} cy={k.y} r={R} fill="url(#ban-embacado)" opacity={breath} />
        ))}
        {bands.map((b, i) => (
          <path key={i} d={`M${b.a} ${ESP.y0} L${b.a + b.w} ${ESP.y0} L${ESP.x0} ${ESP.y0 + b.a + b.w - ESP.x0} L${ESP.x0} ${ESP.y0 + b.a - ESP.x0}Z`} fill="#FFFFFF" opacity={0.15} />
        ))}
      </g>
      {/* a parede onde o espelho está pendurado (fora dele) */}
      <path d={`M-160 -160 H1240 V2080 H-160 Z ${inner}`} fillRule="evenodd" fill="#1B2357" />
      {/* a moldura: aro claro com a quina de dentro escura */}
      <path d={inner} fill="none" stroke="#5D69AE" strokeWidth={24} />
      <path d={roundRect(ESP.x0 - 6, ESP.y0 - 6, ESP.x1 + 6, ESP.y1 + 6, ESP.r + 6)} fill="none" stroke="#8C98DA" strokeWidth={4} />
      <path d={roundRect(ESP.x0 + 11, ESP.y0 + 11, ESP.x1 - 11, ESP.y1 - 11, ESP.r - 10)} fill="none" stroke="rgba(5,7,26,0.5)" strokeWidth={5} />
    </svg>
  );
};

// ===================================================================== balcão (a pia da cena mesa)
/** Altura do gabinete embaixo do tampo (do tampo ao chão da cena mesa: 1010 → 1180). */
const ALTURA = 170;
/** Onde fica a cuba no tampo (fração da largura): na frente dela, que fica em ~x 420 com o tampo em 100..980. */
const CUBA = 0.36;

/** Gabinete: duas portas e duas gavetas com puxador redondo. Coordenadas locais (0..w, 0..h). */
const Gabinete: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const n = Math.max(2, Math.round(w / 210));
  const dw = w / n;
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} rx={8} fill={B.vanity} />
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <rect x={i * dw + 10} y={10} width={dw - 20} height={h - 34} rx={8} fill="rgba(255,255,255,0.035)" />
          {i ? <rect x={i * dw - 2} y={6} width={4} height={h - 26} fill="rgba(5,7,26,0.32)" /> : null}
          <circle cx={i * dw + dw / 2} cy={30} r={7} fill={B.steel} />
        </g>
      ))}
      <rect x={w / 2} y={0} width={w / 2} height={h} rx={8} fill="rgba(5,7,26,0.2)" />
      <rect x={6} y={h - 16} width={w - 12} height={16} rx={4} fill="rgba(5,7,26,0.42)" />
    </g>
  );
};

/**
 * A pia da cena mesa (vista do espelho): tampo frio, cuba oval de apoio na frente dela, torneira que
 * pinga (uma gota a cada 40 q), copo de escovas e o gabinete até o chão. O `tampo` desenha tudo isso
 * na largura toda (esconde as pernas dela); a `frente` só o gabinete da largura que recebe.
 */
const Balcao: NonNullable<Lugar['Balcao']> = ({ t, accent, part, x, w, top }) => {
  if (part === 'frente')
    return (
      <svg style={{ position: 'absolute', left: x, top, overflow: 'visible' }} width={w} height={ALTURA - 30} viewBox={`0 0 ${w} ${ALTURA - 30}`}>
        <Gabinete w={w} h={ALTURA - 30} />
      </svg>
    );
  const cx = w * CUBA;
  // a gota: cresce na boca da torneira (12 q), cai (8 q) e faz um anel na água. A torneira fica de
  // perfil na borda esquerda da cuba, baixa: na frente do rosto ela lia bebedouro
  const f = t % 40;
  const grow = Math.min(1, f / 12);
  const fall = f < 12 ? 0 : Math.min(1, (f - 12) / 8);
  const tipX = cx - 30;
  const mouth = -60;
  const water = -38;
  const dropY = mouth + 5 + fall * fall * (water - mouth - 5);
  const ring = f >= 20 ? (f - 20) / 18 : -1;
  const cup = cx + 124;
  return (
    <svg style={{ position: 'absolute', left: x, top, overflow: 'visible' }} width={w} height={ALTURA} viewBox={`0 0 ${w} ${ALTURA}`}>
      <g transform="translate(20 36)">
        <Gabinete w={w - 40} h={ALTURA - 36} />
      </g>
      <rect x={20} y={36} width={w - 40} height={12} fill="rgba(5,7,26,0.38)" />
      {/* tampo */}
      <rect x={0} y={0} width={w} height={40} rx={14} fill={B.slab} />
      <rect x={0} y={22} width={w} height={18} rx={9} fill={B.slabEdge} />
      <rect x={10} y={4} width={w - 20} height={4} rx={2} fill="rgba(255,255,255,0.13)" />
      <rect x={w / 2} y={0} width={w / 2} height={40} rx={14} fill="rgba(5,7,26,0.1)" />
      {/* torneira de perfil: haste na borda esquerda, alavanca no alto, bica curva sobre a cuba */}
      <rect x={cx - 104} y={-8} width={34} height={10} rx={4} fill={B.steel} />
      <path d={`M${cx - 87} -4 V-58 q0 -14 14 -14 h${tipX - (cx - 73) - 8} q8 0 8 8 v4`} stroke={B.steel} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${cx - 90} -10 V-56 q0 -10 10 -12`} stroke="rgba(255,255,255,0.22)" strokeWidth={3} strokeLinecap="round" fill="none" />
      <rect x={cx - 112} y={-86} width={30} height={8} rx={4} fill={B.steel} transform={`rotate(-18 ${cx - 87} -76)`} />
      {/* a gota */}
      {f < 20 ? <ellipse cx={tipX} cy={dropY} rx={3.6 * grow} ry={5 * grow} fill="#A9BCEB" opacity={0.9} /> : null}
      {/* cuba oval de apoio, de louça clara */}
      <path d={`M${cx - 92} -40 h184 q-2 36 -50 40 h-84 q-48 -4 -50 -40z`} fill="#8C96CE" />
      <path d={`M${cx} -40 h92 q-2 36 -50 40 h-42z`} fill={SHADE} />
      <path d={`M${cx - 80} -32 q4 22 30 28`} stroke="rgba(255,255,255,0.2)" strokeWidth={5} strokeLinecap="round" fill="none" />
      <ellipse cx={cx} cy={-40} rx={92} ry={9} fill="#A2ABDF" />
      <ellipse cx={cx} cy={-39} rx={78} ry={5.5} fill="#3B4783" />
      {ring >= 0 ? <ellipse cx={tipX} cy={-39} rx={6 + 26 * ring} ry={1.2 + 2.6 * ring} fill="none" stroke="#A9BCEB" strokeWidth={2} opacity={0.7 * (1 - ring)} /> : null}
      {/* copo de escovas ao lado da cuba — fora no boneco v5: o copo d'água da mão descansava em cima
          dele e as escovas atravessavam o copo ("bebendo do porta-escovas", revisor do colágeno) */}
      {v5() ? null : <>
      <rect x={cup - 4} y={-100} width={7} height={68} rx={3.5} fill={accent} opacity={0.75} transform={`rotate(-10 ${cup} -40)`} />
      <rect x={cup + 6} y={-94} width={7} height={62} rx={3.5} fill={C.violet2} opacity={0.75} transform={`rotate(9 ${cup + 9} -40)`} />
      <path d={`M${cup - 20} -48 h46 l-5 48 h-36z`} fill="rgba(170,185,240,0.32)" />
      <path d={`M${cup + 3} -48 h23 l-5 48 h-18z`} fill="rgba(5,7,26,0.18)" />
      </>}
    </svg>
  );
};

export const banheiro: Lugar = {
  back: Back,
  mid: Mid,
  front: Front,
  depth: 100,
  gente: 'nenhuma',
  hora: 'manha',
  // a moldura é o primeiro plano: as zonas ficam só nas bordas, pra peça nenhuma desligar o espelho
  frontZones: { left: [-40, 250, 40, 1400], right: [1040, 250, 1120, 1400] },
  // a janelinha fosca: facho curto, pra baixo e pra esquerda
  janela: { x0: 656, x1: 814, y0: 306, y1: 420, dx: -190, dy: 340, fria: true },
  Balcao,
};
