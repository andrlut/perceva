// Cozinha (fase 3, agente D): o lugar onde ela prepara e toma (o copo, o pote, a coqueteleira).
//
// O que diz "cozinha" de relance, sem a pessoa: a faixa de azulejo, a janela sobre a pia (com a
// persiana de rolo no alto, nunca as cortinas da casa), os armários altos com a coifa no meio, a
// bancada de fundo com forno, cuba de avental e torneira, a chaleira soltando vapor, a fruteira e a
// geladeira cortada na borda direita. Nada de estante nem quadro (são da casa).
//
//   back  parede quente + faixa de azulejo, armários altos, coifa, prateleira com 3 potes, relógio,
//         janela com persiana, pendente (aceso à noite), piso de ladrilho em xadrez
//   mid   bancada de fundo (forno, cooktop, cuba, torneira), chaleira com vapor, fruteira, geladeira;
//         gente pouca = quem cozinha atrás de uma ilha (Ator em laço `mexer`), muita = + alguém com
//         uma caneca
//   front quina de bancada com um pote de colheres (esquerda) e vaso de ervas (direita)
//   Balcao o balcão de pedra clara com armário embaixo: a mesa da `cena` (setting mesa)
//
// Regras de ambiente (MOLDE.md): o enfeite (relógio, potes, chaleira, fruteira) sai de baixo do que a
// cena desenha (`decor`/`hits`); a arquitetura (armário, janela, bancada, geladeira) fica. Quem cozinha
// e a ilha andam juntos ou saem juntos, nunca na faixa `clear`. O lugar não repete a peça da fala
// (`show`: relogio, pote, planta). Tudo mais escuro e menos saturado que ela.
//
// Contrato: `Lugar` em ../ambientes. Este arquivo nunca é importado pelo ambientes.tsx (o scenes.tsx
// registra via ./index.ts).
import React from 'react';
import { Relogio } from '../../elenco/cast';
import { Janela, SET, SkyDefs } from '../../elenco/cenario';
import { Ator, cicloDe, maoNaTela, poseAt } from '../../elenco/acao';
import { C } from '../../theme';
import { ArtSvg, decor, faceAt, free, hits, inside, type EnvP, type Lugar, type Rect } from '../ambientes';

/** Paleta da cozinha: família navy do cenário, puxada pro quente (a casa é violeta, o banheiro é frio). */
const K = {
  tile: '#2A2968',
  grout: 'rgba(165,170,235,0.11)',
  cab: '#2C3273',
  cabIn: '#323979',
  cabTrim: '#363E80',
  handle: '#4A5294',
  slab: '#3A3F82',
  slabEdge: '#30357A',
  body: SET.furn,
  steel: '#3C4488',
  fridge: '#333D7F',
  orange: '#A2643A',
  orangeHi: '#C4864F',
  blind: '#383276',
} as const;
const SHADE = 'rgba(5,7,26,0.24)';

/** Onde mora cada coisa (coordenadas do cenário: horizonte, a linha parede × chão, em y = 1000). */
const COZ = {
  /** tampo da bancada de fundo (o armário vai até o chão) */
  bancada: 868,
  /** a faixa de azulejo começa aqui (embaixo dos armários altos) */
  azulejo: 600,
  armarios: [
    [-150, 108],
    [292, 472],
  ] as [number, number][],
  armY: [338, 600] as [number, number],
  coifa: [108, 292] as [number, number],
  forno: [116, 284] as [number, number],
  chaleira: { x: 200, base: 862 },
  prateleira: { x0: 294, x1: 470, y: 726 },
  potes: [300, 636, 466, 726] as Rect,
  /** o relógio: entre o armário e a janela; sem lugar ali, acima de um dos armários */
  relogio: [[490, 360, 596, 466], [328, 196, 434, 302], [-24, 196, 82, 302]] as Rect[],
  janela: { x: 650, y: 380, w: 250, h: 310 },
  pia: 774,
  fruteira: [852, 790, 944, 868] as Rect,
  geladeira: 952,
  /** o pendente fica sobre o armário da direita (e em cima dela, na cena mesa) */
  pendente: { x: 382, y: 250 },
};
const CHALEIRA: Rect = [146, 760, 262, 864];

// ===================================================================== partes
/** Piso de ladrilho grande em perspectiva, em xadrez (a casa é tábua; o banheiro, pastilha). */
export const Ladrilho: React.FC<{ id: string; y: number; step: number; spread: number; rows: number[]; checker?: boolean; grout?: string }> = ({
  id,
  y,
  step,
  spread,
  rows,
  checker = true,
  grout = 'rgba(5,7,26,0.2)',
}) => {
  const vx = 540;
  const X = (k: number, dy: number) => vx + k * (step + ((spread - step) * dy) / 600);
  const K0 = Math.ceil(1100 / step) + 2;
  const ks = Array.from({ length: K0 * 2 + 1 }, (_, i) => i - K0);
  const quads: React.ReactNode[] = [];
  if (checker)
    for (let r = 0; r < rows.length - 1; r++)
      for (const k of ks) {
        if ((k + r) % 2 === 0) continue;
        const a = rows[r];
        const b = rows[r + 1];
        quads.push(<path key={`${r}:${k}`} d={`M${X(k, a)} ${y + a} L${X(k + 1, a)} ${y + a} L${X(k + 1, b)} ${y + b} L${X(k, b)} ${y + b}Z`} fill="rgba(5,7,26,0.16)" />);
      }
  return (
    <g>
      <rect x={-500} y={y} width={2100} height={1600} fill={`url(#${id}-floor)`} />
      {quads}
      {rows.slice(1).map((r) => (
        <rect key={r} x={-500} y={y + r - 1} width={2100} height={3} fill={grout} />
      ))}
      {ks.map((k) => (
        <path key={k} d={`M${X(k, 0)} ${y} L${X(k, 1600)} ${y + 1600}`} stroke={grout} strokeWidth={3} />
      ))}
      <rect x={-500} y={y - 6} width={2100} height={12} fill={SET.base} />
    </g>
  );
};

/** Bloco de armário alto: portas com painel rebaixado e puxador perto da base. */
const ArmarioAlto: React.FC<{ x0: number; x1: number; y0: number; y1: number }> = ({ x0, x1, y0, y1 }) => {
  const n = Math.max(1, Math.round((x1 - x0) / 120));
  const dw = (x1 - x0) / n;
  return (
    <g>
      <rect x={x0 - 6} y={y0 - 14} width={x1 - x0 + 12} height={16} rx={5} fill={K.cabTrim} />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={8} fill={K.cab} />
      {Array.from({ length: n }, (_, i) => {
        const dx = x0 + i * dw;
        const hx = i % 2 === 0 ? dx + dw - 26 : dx + 18;
        return (
          <g key={i}>
            <rect x={dx + 10} y={y0 + 12} width={dw - 20} height={y1 - y0 - 24} rx={6} fill={K.cabIn} />
            <rect x={dx + 18} y={y0 + 20} width={dw - 36} height={6} rx={3} fill="rgba(255,255,255,0.04)" />
            <rect x={hx} y={y1 - 70} width={8} height={44} rx={4} fill={K.handle} />
            {i ? <rect x={dx - 2} y={y0} width={4} height={y1 - y0} fill="rgba(5,7,26,0.35)" /> : null}
          </g>
        );
      })}
      <rect x={x0 + (x1 - x0) * 0.62} y={y0} width={(x1 - x0) * 0.38} height={y1 - y0} rx={8} fill={SHADE} />
      {/* a sombra do armário no azulejo */}
      <rect x={x0} y={y1} width={x1 - x0} height={16} fill="rgba(5,7,26,0.28)" />
    </g>
  );
};

/** A coifa sobre o cooktop: chaminé até o teto e saia; à noite, a lâmpada de baixo acesa. */
const Coifa: React.FC<{ x0: number; x1: number; night: boolean }> = ({ x0, x1, night }) => {
  const cx = (x0 + x1) / 2;
  return (
    <g>
      <rect x={cx - 34} y={-600} width={68} height={1078} fill={K.steel} />
      <rect x={cx} y={-600} width={34} height={1078} fill={SHADE} />
      <path d={`M${cx - 52} 470 L${cx + 52} 470 L${x1 + 4} 540 L${x0 - 4} 540Z`} fill={K.steel} />
      <path d={`M${cx} 470 L${cx + 52} 470 L${x1 + 4} 540 L${cx} 540Z`} fill={SHADE} />
      <rect x={x0 - 8} y={538} width={x1 - x0 + 16} height={18} rx={5} fill="#434C90" />
      <rect x={x0 - 8} y={538} width={x1 - x0 + 16} height={4} rx={2} fill="rgba(255,255,255,0.08)" />
      {night ? (
        <>
          <path d={`M${x0 + 20} 556 L${x0 - 20} ${COZ.bancada} L${x1 + 20} ${COZ.bancada} L${x1 - 20} 556Z`} fill={C.gold2} opacity={0.06} />
          <rect x={cx - 34} y={554} width={68} height={6} rx={3} fill={C.gold2} opacity={0.75} />
        </>
      ) : null}
    </g>
  );
};

/** Prateleira com três potes de vidro sem rótulo (grão, massa, café), tampa apagada. */
const Potes: React.FC<{ x0: number; x1: number; y: number }> = ({ x0, x1, y }) => {
  const jars = [
    { x: x0 + 34, w: 40, h: 74, fill: '#6A5C88', k: 0.62 },
    { x: x0 + 88, w: 46, h: 54, fill: '#7A5A62', k: 0.5 },
    { x: x0 + 142, w: 36, h: 88, fill: '#5E5A84', k: 0.72 },
  ];
  return (
    <g>
      {jars.map((j, i) => (
        <g key={i}>
          <rect x={j.x - j.w / 2} y={y - j.h} width={j.w} height={j.h} rx={9} fill="rgba(150,160,225,0.14)" />
          <rect x={j.x - j.w / 2 + 4} y={y - j.h * j.k} width={j.w - 8} height={j.h * j.k - 4} rx={6} fill={j.fill} opacity={0.75} />
          <rect x={j.x - j.w / 2 - 3} y={y - j.h - 10} width={j.w + 6} height={14} rx={5} fill={K.handle} />
          <rect x={j.x - j.w / 2 + 6} y={y - j.h + 10} width={6} height={j.h - 22} rx={3} fill="rgba(255,255,255,0.12)" />
        </g>
      ))}
    </g>
  );
};

/** Persiana de rolo enrolada no alto da janela (a casa tem cortinas; a cozinha, persiana). */
const Persiana: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <g>
    <rect x={x - 6} y={y - 4} width={w + 12} height={58} rx={6} fill={K.blind} />
    <rect x={x - 6} y={y + 14} width={w + 12} height={4} fill="rgba(5,7,26,0.25)" />
    <rect x={x - 6} y={y + 32} width={w + 12} height={4} fill="rgba(5,7,26,0.25)" />
    <rect x={x - 10} y={y + 50} width={w + 20} height={10} rx={5} fill={K.handle} />
    <rect x={x + w / 2 - 3} y={y + 60} width={6} height={30} rx={3} fill={K.handle} />
  </g>
);

/** Pendente sobre a bancada: apagado de dia, aceso e quente de noite. */
const PendenteCoz: React.FC<{ x: number; y: number; t: number; on: boolean; id: string }> = ({ x, y, t, on, id }) => {
  const sw = Math.sin(t / 70) * 1.2;
  const flick = 0.92 + 0.08 * Math.sin(t / 19);
  return (
    <g transform={`rotate(${sw} ${x} -600)`}>
      {on ? (
        <>
          <path d={`M${x - 30} ${y + 40} L${x - 230} ${COZ.bancada} L${x + 230} ${COZ.bancada} L${x + 30} ${y + 40}Z`} fill={C.gold2} opacity={0.07 * flick} />
          <circle cx={x} cy={y + 44} r={150} fill={`url(#${id}-lamp)`} opacity={0.55 * flick} />
        </>
      ) : null}
      <rect x={x - 2} y={-600} width={4} height={y + 600} fill={SET.frame} />
      <path d={`M${x - 54} ${y + 42} q0 -56 54 -56 q54 0 54 56z`} fill={K.cabTrim} />
      <path d={`M${x} ${y - 14} q54 0 54 56 h-54z`} fill={SHADE} />
      <ellipse cx={x} cy={y + 44} rx={28} ry={9} fill={on ? C.gold2 : '#454E90'} opacity={on ? 0.95 : 1} />
    </g>
  );
};

/** Chaleira no cooktop, com vapor saindo do bico (x = centro, base = onde ela apoia). */
const Chaleira: React.FC<{ x: number; base: number; t: number }> = ({ x, base, t }) => (
  <g transform={`translate(${x} ${base})`}>
    <ellipse cx={0} cy={0} rx={52} ry={6} fill="rgba(0,0,0,0.3)" />
    {/* bico pra direita */}
    <path d="M30 -30 q24 -6 34 -34 l8 4 q-8 34 -38 46z" fill="#424A8E" />
    <path d="M-50 0 q-6 -64 50 -68 q56 4 50 68z" fill="#47508F" />
    <path d="M0 -68 q56 4 50 68 h-50z" fill={SHADE} />
    <rect x={-50} y={-14} width={100} height={8} rx={4} fill="rgba(5,7,26,0.18)" />
    <rect x={-10} y={-80} width={20} height={14} rx={6} fill={K.handle} />
    {/* alça */}
    <path d="M-34 -58 q34 -46 68 0" stroke="#3A4280" strokeWidth={9} fill="none" strokeLinecap="round" />
    <ellipse cx={-22} cy={-44} rx={9} ry={14} fill="rgba(255,255,255,0.1)" />
    {/* vapor */}
    {[0, 1, 2].map((i) => {
      const k = ((t + i * 18) % 54) / 54;
      return (
        <path
          key={i}
          d={`M${68 + i * 6} ${-72 - k * 70} q-9 -10 0 -20 q9 -10 0 -20`}
          stroke={C.hi}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={Math.sin(k * Math.PI) * 0.32}
          transform={`translate(${Math.sin(t / 15 + i) * 4} 0)`}
        />
      );
    })}
  </g>
);

/** Fruteira com laranjas (x = centro, base = tampo). */
const Fruteira: React.FC<{ x: number; base: number }> = ({ x, base }) => (
  <g transform={`translate(${x} ${base})`}>
    <ellipse cx={0} cy={0} rx={46} ry={5} fill="rgba(0,0,0,0.3)" />
    {[
      [-22, -34, 17],
      [20, -32, 16],
      [-2, -40, 18],
      [-10, -58, 15],
      [12, -56, 14],
    ].map(([cx, cy, r], i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r={r} fill={K.orange} />
        <circle cx={cx + r * 0.35} cy={cy + r * 0.2} r={r * 0.75} fill="rgba(5,7,26,0.16)" />
        <circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.25} fill={K.orangeHi} opacity={0.7} />
      </g>
    ))}
    <ellipse cx={6} cy={-74} rx={6} ry={13} fill={SET.leafDark} transform="rotate(38 6 -74)" />
    <path d="M-48 -26 q48 38 96 0 l-6 22 q-42 14 -84 0z" fill="#3E4688" />
    <path d="M0 -10 q24 -2 48 -16 l-6 22 q-20 6 -42 6z" fill={SHADE} />
  </g>
);

/** Geladeira (cortada pela borda direita): duas portas, puxadores, ímãs sem texto. */
const Geladeira: React.FC<{ x0: number }> = ({ x0 }) => (
  <g>
    <ellipse cx={x0 + 160} cy={1004} rx={190} ry={8} fill="rgba(0,0,0,0.3)" />
    <rect x={x0} y={330} width={340} height={674} rx={16} fill={K.fridge} />
    <rect x={x0} y={330} width={10} height={674} rx={5} fill="rgba(255,255,255,0.06)" />
    <rect x={x0} y={516} width={340} height={8} fill="rgba(5,7,26,0.35)" />
    <rect x={x0 + 20} y={418} width={10} height={84} rx={5} fill={K.handle} />
    <rect x={x0 + 20} y={548} width={10} height={170} rx={5} fill={K.handle} />
    <rect x={x0 + 60} y={612} width={30} height={22} rx={6} fill={C.violet2} opacity={0.35} transform={`rotate(-6 ${x0 + 75} 623)`} />
    <rect x={x0 + 96} y={650} width={22} height={22} rx={11} fill={C.gold} opacity={0.3} />
    <rect x={x0 + 70} y={688} width={44} height={56} rx={4} fill={C.hi} opacity={0.1} transform={`rotate(4 ${x0 + 92} 716)`} />
    <rect x={x0} y={972} width={340} height={32} rx={8} fill="rgba(5,7,26,0.3)" />
  </g>
);

// ===================================================================== fundo
const Back: React.FC<EnvP> = (p) => {
  const { t, hora, show } = p;
  const id = `coz-${hora}`;
  const night = hora === 'noite';
  const w = COZ.janela;
  // o relógio anda pela parede (entre o armário e a janela, ou acima de um armário) ou sai
  const clock = show.includes('relogio') ? null : (COZ.relogio.find((r) => decor(p, r) !== null) ?? null);
  // os potes da prateleira saem quando a fala mostra o pote (o lugar não repete a peça) ou há peça em cima
  const jars = !show.includes('pote') && decor(p, COZ.potes) !== null;
  return (
    <>
      <ArtSvg>
        <SkyDefs id={id} hora={hora} />
        <defs>
          <pattern id={`${id}-azul`} patternUnits="userSpaceOnUse" x={0} y={COZ.bancada} width={62} height={62}>
            <rect width={62} height={62} fill={K.tile} />
            <rect width={62} height={3} fill={K.grout} />
            <rect width={3} height={62} fill={K.grout} />
            <rect x={3} y={3} width={59} height={5} fill="rgba(255,255,255,0.03)" />
          </pattern>
        </defs>
        <rect x={-400} y={-600} width={1880} height={1600} fill={`url(#${id}-warm)`} />
        {/* faixa de azulejo entre os armários altos e a bancada */}
        <rect x={-400} y={COZ.azulejo} width={1880} height={COZ.bancada - COZ.azulejo + 4} fill={`url(#${id}-azul)`} />
        <rect x={-400} y={COZ.azulejo - 3} width={1880} height={6} fill="rgba(165,170,235,0.08)" />
        {COZ.armarios.map(([x0, x1]) => (
          <ArmarioAlto key={x0} x0={x0} x1={x1} y0={COZ.armY[0]} y1={COZ.armY[1]} />
        ))}
        <Coifa x0={COZ.coifa[0]} x1={COZ.coifa[1]} night={night} />
        {jars ? (
          <>
            <Potes x0={COZ.prateleira.x0} x1={COZ.prateleira.x1} y={COZ.prateleira.y} />
          </>
        ) : null}
        <rect x={COZ.prateleira.x0} y={COZ.prateleira.y} width={COZ.prateleira.x1 - COZ.prateleira.x0} height={12} rx={4} fill={SET.furnTop} />
        <rect x={COZ.prateleira.x0 + 16} y={COZ.prateleira.y + 12} width={10} height={22} rx={3} fill={SET.frameShade} />
        <rect x={COZ.prateleira.x1 - 26} y={COZ.prateleira.y + 12} width={10} height={22} rx={3} fill={SET.frameShade} />
        <Janela id={id} x={w.x} y={w.y} w={w.w} h={w.h} t={t} hora={hora} panes={2} />
        <Persiana x={w.x} y={w.y} w={w.w} />
        <PendenteCoz x={COZ.pendente.x} y={COZ.pendente.y} t={t} on={night} id={id} />
        <Ladrilho id={id} y={1000} step={150} spread={300} rows={[0, 34, 78, 136, 212, 312, 444, 620, 860, 1180]} />
        {night ? <ellipse cx={COZ.pendente.x} cy={1060} rx={300} ry={40} fill={C.gold2} opacity={0.05} /> : null}
      </ArtSvg>
      {clock === null ? null : (
        <div style={{ position: 'absolute', left: clock[0], top: clock[1], opacity: 0.72 }}>
          <Relogio t={t} size={clock[2] - clock[0]} speed={0.4} accent={SET.frame} />
        </div>
      )}
    </>
  );
};

// ===================================================================== meio
/** Quem cozinha: atrás de uma ilha com panela, mexendo em laço. x = centro dela; a ilha, a panela e o rosto andam juntos. */
const ILHA = { feet: 1052, size: 176, w: 300 };
/** Mão direita média do ciclo do `mexer` (a panela fica parada embaixo dela, mesmo com a mão girando). */
const maoMedia = (x: number) => {
  const s = ILHA.size;
  const box = { left: x - s / 2, top: ILHA.feet - s * 1.26, size: s };
  const n = Math.max(1, cicloDe('mexer'));
  let hx = 0;
  let hy = 0;
  for (let f = 0; f < n; f++) {
    const h = maoNaTela(poseAt('mexer', f), 'down', 1, box);
    hx += h.x / n;
    hy += h.y / n;
  }
  return { x: hx, y: hy };
};
const ilhaGeo = (x: number) => {
  const m = maoMedia(x);
  const top = Math.min(ILHA.feet - 40, Math.max(ILHA.feet - ILHA.size * 0.75, m.y + 14));
  const x0 = Math.min(x - ILHA.w / 2, m.x - 70);
  const x1 = Math.max(x + ILHA.w / 2, m.x + 70);
  return { m, top, x0, x1 };
};
const ilhaPartes = (x: number): Rect[] => {
  const g = ilhaGeo(x);
  return [faceAt(x, ILHA.feet, ILHA.size), [x - 0.42 * ILHA.size, ILHA.feet - ILHA.size * 0.8, x + 0.42 * ILHA.size, g.top], [g.x0, g.top - 70, g.x1, ILHA.feet + 8]];
};
const Ilha: React.FC<{ t: number; x: number; seed: number }> = ({ t, x, seed }) => {
  const g = ilhaGeo(x);
  const s = ILHA.size;
  const box = { left: x - s / 2, top: ILHA.feet - s * 1.26, size: s };
  const hand = maoNaTela(poseAt('mexer', t), 'down', 1, box);
  const px = g.m.x;
  const pTop = g.top - 40;
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, filter: 'saturate(0.55)' }}>
        <Ator t={t} x={x} y={ILHA.feet} size={s} laco="mexer" fase={seed * 7} seed={seed} figurante />
      </div>
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1080} height={1920} viewBox="0 0 1080 1920">
        {/* a panela, a colher na mão e o vapor */}
        <line x1={hand.x} y1={hand.y} x2={px - 6} y2={pTop + 18} stroke="#7A6458" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
        <rect x={px - 46} y={pTop} width={92} height={40} rx={10} fill="#3E4689" />
        <rect x={px} y={pTop} width={46} height={40} rx={10} fill={SHADE} />
        <rect x={px - 52} y={pTop - 4} width={104} height={10} rx={5} fill="#4A5294" />
        <rect x={px - 70} y={pTop + 6} width={20} height={7} rx={3} fill="#3A4280" />
        <rect x={px + 50} y={pTop + 6} width={20} height={7} rx={3} fill="#3A4280" />
        {[0, 1].map((i) => {
          const k = ((t + i * 22) % 44) / 44;
          return <path key={i} d={`M${px - 14 + i * 26} ${pTop - 8 - k * 44} q-7 -8 0 -16 q7 -8 0 -16`} stroke={C.hi} strokeWidth={4} strokeLinecap="round" fill="none" opacity={Math.sin(k * Math.PI) * 0.26} />;
        })}
        {/* a ilha (esconde dela da cintura pra baixo) */}
        <rect x={g.x0} y={g.top} width={g.x1 - g.x0} height={16} rx={6} fill={K.slab} />
        <rect x={g.x0 + 8} y={g.top + 16} width={g.x1 - g.x0 - 16} height={ILHA.feet + 8 - g.top - 16} rx={6} fill={K.body} />
        <rect x={(g.x0 + g.x1) / 2} y={g.top + 16} width={(g.x1 - g.x0) / 2 - 8} height={ILHA.feet + 8 - g.top - 16} rx={6} fill="rgba(5,7,26,0.22)" />
        <rect x={g.x0 + 8} y={g.top + 16} width={g.x1 - g.x0 - 16} height={6} fill="rgba(5,7,26,0.3)" />
      </svg>
    </>
  );
};

const Mid: React.FC<EnvP> = (p) => {
  const { t, hora, busy, show, gente, clear, view } = p;
  const night = hora === 'noite';
  const top = COZ.bancada;
  // portas da bancada (fora do forno e da cuba)
  const doors: number[] = [];
  for (let x = -400; x < COZ.geladeira; x += 150) doors.push(x);
  // gente: quem cozinha atrás da ilha, do lado livre; com muita, alguém de pé com uma caneca do outro lado
  const ok = (x: number) => {
    const parts = ilhaPartes(x);
    const [a, , b] = parts[2];
    return free(clear, a, b) && !parts.some((r) => hits(busy, r)) && inside(view, [parts[0][0] - 20, parts[0][1], parts[0][2] + 20, parts[0][3]]);
  };
  const cook = gente === 'nenhuma' ? null : ([170, 900, 70, 990].find(ok) ?? null);
  const other = gente === 'muita' ? ([900, 190, 980, 100].find((x) => (cook === null || Math.abs(x - cook) > 360) && free(clear, x - 90, x + 90) && !hits(busy, faceAt(x, 1040, 180)) && inside(view, faceAt(x, 1040, 180))) ?? null) : null;
  // chaleira e fruteira saem de baixo de peça E de trás da cabeça de quem está na cozinha (fruta no
  // cocuruto lia chapéu)
  const heads: Rect[] = [...(cook === null ? [] : [ilhaPartes(cook)[0]]), ...(other === null ? [] : [faceAt(other, 1040, 180)])].map(([a, b, c, d]) => [a - 24, b - 24, c + 24, d + 24]);
  const blocked = [...busy, ...heads];
  const kettle = !hits(blocked, [CHALEIRA[0] - 10, CHALEIRA[1] - 80, CHALEIRA[2] + 10, CHALEIRA[3]]);
  const fruit = !hits(blocked, COZ.fruteira);
  return (
    <>
      <ArtSvg>
        {/* a bancada de fundo encostada na parede */}
        <rect x={-400} y={top} width={COZ.geladeira + 400} height={24} rx={6} fill={K.slab} />
        <rect x={-400} y={top} width={COZ.geladeira + 400} height={4} fill="rgba(255,255,255,0.07)" />
        <rect x={-400} y={top + 16} width={COZ.geladeira + 400} height={8} fill={K.slabEdge} />
        <rect x={-400} y={top + 24} width={COZ.geladeira + 400} height={1004 - top - 24} fill={K.body} />
        <rect x={-400} y={top + 24} width={COZ.geladeira + 400} height={8} fill="rgba(5,7,26,0.3)" />
        {doors.map((x, i) => {
          const inOven = x + 150 > COZ.forno[0] && x < COZ.forno[1];
          const inSink = x + 150 > COZ.pia - 76 && x < COZ.pia + 76;
          return (
            <g key={i}>
              <rect x={x - 2} y={top + 24} width={4} height={1004 - top - 38} fill="rgba(5,7,26,0.32)" />
              {inOven || inSink ? null : <rect x={x + 55} y={top + 40} width={40} height={8} rx={4} fill={K.handle} />}
            </g>
          );
        })}
        <rect x={-400} y={990} width={COZ.geladeira + 400} height={14} fill="rgba(5,7,26,0.38)" />
        {/* forno embaixo do cooktop */}
        <rect x={COZ.forno[0]} y={top + 30} width={COZ.forno[1] - COZ.forno[0]} height={92} rx={8} fill="#30387A" />
        <rect x={COZ.forno[0] + 18} y={top + 58} width={COZ.forno[1] - COZ.forno[0] - 36} height={50} rx={7} fill="#141838" />
        <rect x={COZ.forno[0] + 30} y={top + 64} width={40} height={6} rx={3} fill="rgba(255,255,255,0.06)" />
        <rect x={COZ.forno[0] + 24} y={top + 38} width={COZ.forno[1] - COZ.forno[0] - 48} height={8} rx={4} fill={K.handle} />
        {/* cooktop de vidro no tampo */}
        <rect x={COZ.forno[0] + 2} y={top - 7} width={COZ.forno[1] - COZ.forno[0] - 4} height={9} rx={3} fill="#1A1F4A" />
        {/* cuba de avental e torneira (embaixo da janela) */}
        <rect x={COZ.pia - 72} y={top + 26} width={144} height={58} rx={9} fill="#3A4386" />
        <rect x={COZ.pia} y={top + 26} width={72} height={58} rx={9} fill={SHADE} />
        <rect x={COZ.pia - 72} y={top + 26} width={144} height={6} fill="rgba(255,255,255,0.06)" />
        <rect x={COZ.pia + 12} y={top - 14} width={14} height={16} rx={3} fill={K.steel} />
        <path d={`M${COZ.pia + 19} ${top - 10} V${top - 62} q0 -28 -28 -28 q-26 0 -28 26`} stroke={K.steel} strokeWidth={11} strokeLinecap="round" fill="none" />
        <path d={`M${COZ.pia + 16} ${top - 14} V${top - 60} q0 -24 -24 -24`} stroke="rgba(255,255,255,0.1)" strokeWidth={3} strokeLinecap="round" fill="none" />
        {/* à noite o pendente faz uma poça quente no tampo */}
        {night ? <ellipse cx={COZ.pendente.x} cy={top + 2} rx={220} ry={14} fill={C.gold2} opacity={0.12} /> : null}
        {kettle ? <Chaleira x={COZ.chaleira.x} base={COZ.chaleira.base} t={t} /> : null}
        {fruit ? <Fruteira x={(COZ.fruteira[0] + COZ.fruteira[2]) / 2} base={top} /> : null}
        <Geladeira x0={COZ.geladeira} />
      </ArtSvg>
      {cook === null ? null : <Ilha t={t} x={cook} seed={3} />}
      {other === null ? null : (
        <div style={{ position: 'absolute', left: 0, top: 0, filter: 'saturate(0.55)' }}>
          <Ator t={t} x={other} y={1040} size={180} seed={5} figurante mao={show.includes('caneca') ? undefined : { p: 'caneca' }} />
        </div>
      )}
    </>
  );
};

// ===================================================================== primeiro plano
/** Quina de bancada (esquerda) com um pote de colheres de pau, e vaso de ervas (direita). */
const Front: React.FC<EnvP> = ({ t, noLeft, noRight, show }) => {
  const sway = (i: number) => Math.sin(t / 32 + i) * 3;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1080} height={1920} viewBox="0 0 1080 1920">
      {noLeft ? null : (
        <g>
          {/* colheres de pau no pote */}
          {[
            [92, -18],
            [118, 4],
            [140, 20],
          ].map(([x, a], i) => (
            <g key={i} transform={`rotate(${a} ${x} 1300)`}>
              <rect x={x - 6} y={1150} width={12} height={160} rx={6} fill="#6E5A5C" />
              <ellipse cx={x} cy={1150} rx={16} ry={26} fill="#7A6264" />
            </g>
          ))}
          <rect x={64} y={1236} width={110} height={98} rx={22} fill="#3E4688" />
          <rect x={119} y={1236} width={55} height={98} rx={22} fill={SHADE} />
          <rect x={-60} y={1324} width={380} height={34} rx={12} fill={K.slab} />
          <rect x={-50} y={1356} width={370} height={240} fill={K.body} />
          <rect x={160} y={1356} width={160} height={240} fill={SHADE} />
        </g>
      )}
      {noRight || show.includes('planta') ? null : (
        <g>
          {/* manjericão: folhas que balançam num vaso de barro apagado */}
          {[
            [940, 1240, -30],
            [990, 1210, 10],
            [1040, 1236, 40],
            [960, 1282, -60],
            [1030, 1286, 64],
            [1000, 1170, -6],
            [960, 1196, -36],
          ].map(([x, y, a], i) => (
            <ellipse key={i} cx={x} cy={y} rx={30} ry={52} fill={i % 3 === 1 ? SET.leaf : SET.leafDark} transform={`rotate(${a + sway(i)} ${x} ${y + 40})`} />
          ))}
          <path d="M916 1316 h176 l-18 200 h-140z" fill="#6A4652" />
          <rect x={906} y={1304} width={196} height={34} rx={10} fill="#7A5060" />
          <path d="M1004 1316 h88 l-18 200 h-70z" fill={SHADE} />
        </g>
      )}
    </svg>
  );
};

// ===================================================================== balcão (a mesa da cena)
/** Armário de balcão: portas com puxador, rodapé recuado. Coordenadas locais (0..w, 0..h). */
const Armario: React.FC<{ w: number; h: number; fill: string; inset?: string }> = ({ w, h, fill, inset = 'rgba(255,255,255,0.03)' }) => {
  const n = Math.max(2, Math.round(w / 200));
  const dw = w / n;
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} rx={8} fill={fill} />
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <rect x={i * dw + 10} y={10} width={dw - 20} height={h - 34} rx={8} fill={inset} />
          {i ? <rect x={i * dw - 2} y={6} width={4} height={h - 26} fill="rgba(5,7,26,0.32)" /> : null}
          <rect x={i * dw + dw / 2 - 26} y={22} width={52} height={9} rx={4.5} fill={K.handle} />
        </g>
      ))}
      <rect x={w / 2} y={0} width={w / 2} height={h} rx={8} fill="rgba(5,7,26,0.2)" />
      <rect x={6} y={h - 16} width={w - 12} height={16} rx={4} fill="rgba(5,7,26,0.42)" />
    </g>
  );
};

/** Altura do armário embaixo do tampo (do tampo ao chão da cena mesa: 1010 → 1180). */
const ALTURA = 170;

/**
 * O balcão da cozinha: tampo de pedra clara e quente, com borda, e o armário até o chão. O `tampo`
 * desenha a pedra E o armário da largura toda (esconde as pernas dela e o chão de trás); a `frente`
 * desenha só o armário da largura que recebe (fica embaixo do tampo na cena mesa).
 */
const Balcao: NonNullable<Lugar['Balcao']> = ({ part, x, w, top }) => {
  if (part === 'frente')
    return (
      <svg style={{ position: 'absolute', left: x, top, overflow: 'visible' }} width={w} height={ALTURA - 30} viewBox={`0 0 ${w} ${ALTURA - 30}`}>
        <Armario w={w} h={ALTURA - 30} fill={C.surface2} />
      </svg>
    );
  return (
    <svg style={{ position: 'absolute', left: x, top, overflow: 'visible' }} width={w} height={ALTURA} viewBox={`0 0 ${w} ${ALTURA}`}>
      <g transform="translate(20 36)">
        <Armario w={w - 40} h={ALTURA - 36} fill={C.surface2} />
      </g>
      {/* sombra do tampo no armário */}
      <rect x={20} y={36} width={w - 40} height={12} fill="rgba(5,7,26,0.38)" />
      {/* a pedra: face de cima clara, veios suaves, borda mais escura */}
      <rect x={0} y={0} width={w} height={40} rx={14} fill="#423F86" />
      <rect x={0} y={22} width={w} height={18} rx={9} fill="#35347A" />
      <rect x={10} y={4} width={w - 20} height={4} rx={2} fill="rgba(255,255,255,0.12)" />
      {[0.18, 0.47, 0.71].map((k, i) => (
        <path key={i} d={`M${w * k} 9 q${w * 0.04} 6 ${w * 0.09} 2 t${w * 0.08} 4`} stroke="rgba(255,255,255,0.08)" strokeWidth={2} fill="none" />
      ))}
      <rect x={w / 2} y={0} width={w / 2} height={40} rx={14} fill="rgba(5,7,26,0.12)" />
    </svg>
  );
};

export const cozinha: Lugar = {
  back: Back,
  mid: Mid,
  front: Front,
  depth: 100,
  gente: 'nenhuma',
  hora: 'manha',
  frontZones: { left: [-60, 1140, 330, 1600], right: [880, 1110, 1120, 1520] },
  // a janela sobre a pia (vidro, sem o caixilho): o facho cai pra baixo e pra esquerda, até o chão
  janela: { x0: 660, x1: 890, y0: 440, y1: 680, dx: -320, dy: 470 },
  Balcao,
};
