// Peças da fase 3: o que a pessoa usa FAZENDO (treino, suplemento, constância).
//
// Mesmas regras do cast.tsx/objetos.tsx: chapado, sem contorno, volume = sombra num lado só (luz de
// cima-esquerda) + um brilho pequeno, paleta de src/theme.ts, `accent` = cor da área, animação por
// `t` ou `progress`. NENHUM texto, número ou marca (pote e coqueteleira sem rótulo, calendário sem
// algarismo, halter sem o peso escrito).
//
// Caixas (BOX no Peca.tsx, em frações de `size`): peso [1, 0.5] · pote [0.8, 1] ·
// calendario [1, 1.05] · coqueteleira [0.55, 1].
import React from 'react';
import { C } from '../theme';

const SHADE = 'rgba(10,14,38,0.28)';
const SHINE = 'rgba(255,255,255,0.22)';
const GROUND = 'rgba(0,0,0,0.25)';
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (k: number) => 1 - (1 - clamp01(k)) ** 3;
const easeInOut = (k: number) => {
  const x = clamp01(k);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

/** Mistura duas cores #RRGGBB (k = quanto de `b`). */
const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('')}`;
};

// ------------------------------------------------------------------ halter
/**
 * Halter de cabeça sextavada, de lado: a pegada no meio (metal, com o recartilhado) e as duas
 * cabeças vistas pela face reta — três facetas (a de cima pega a luz, a de baixo fica na sombra),
 * a ponta chanfrada e o aro na cor da área entre a cabeça e a pegada. Lê halter de academia, não
 * osso (nada de bola na ponta) nem brinquedo (cabeça escura, só o aro colorido).
 */
export const Peso: React.FC<{ size: number; accent?: string }> = ({ size, accent = C.gold }) => {
  const head = (x0: number, x1: number, outer: 'l' | 'r') => {
    // cabeça: 3 facetas do prisma sextavado (topo 22 un., face 40, base 22), cantos de fora chanfrados
    const ch = 7;
    const pts = (p: number[][]) => p.map(([x, y]) => `${x},${y}`).join(' ');
    const L = outer === 'l';
    const top = L ? [[x0 + ch, 8], [x1, 8], [x1, 30], [x0, 30], [x0, 8 + ch]] : [[x0, 8], [x1 - ch, 8], [x1, 8 + ch], [x1, 30], [x0, 30]];
    const bot = L ? [[x0, 70], [x1, 70], [x1, 92], [x0 + ch, 92], [x0, 92 - ch]] : [[x0, 70], [x1, 70], [x1, 92 - ch], [x1 - ch, 92], [x0, 92]];
    // a sombra fica à direita da cabeça (a luz vem de cima-esquerda), seguindo o chanfro
    const sx = x0 + (x1 - x0) * 0.6;
    const shade = L ? [[sx, 8], [x1, 8], [x1, 92], [sx, 92]] : [[sx, 8], [x1 - ch, 8], [x1, 8 + ch], [x1, 92 - ch], [x1 - ch, 92], [sx, 92]];
    return (
      <g>
        <polygon points={pts(top)} fill="#5A62A6" />
        <rect x={x0} y={30} width={x1 - x0} height={40} fill="#434A8C" />
        <polygon points={pts(bot)} fill="#2F3570" />
        <polygon points={pts(shade)} fill={SHADE} opacity={0.6} />
        <rect x={x0 + (L ? ch + 2 : 4)} y={14} width={(x1 - x0) * 0.4} height={6} rx={3} fill={SHINE} />
      </g>
    );
  };
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 200 100" style={{ overflow: 'visible' }}>
      <ellipse cx={100} cy={97} rx={86} ry={5} fill={GROUND} />
      {/* pegada de metal com recartilhado */}
      <rect x={52} y={41} width={96} height={18} rx={9} fill={C.mid} />
      <rect x={52} y={50} width={96} height={9} rx={4.5} fill={SHADE} />
      {[64, 76, 88, 100, 112, 124, 136].map((x) => (
        <rect key={x} x={x - 1.5} y={43} width={3} height={14} rx={1.5} fill="rgba(10,14,38,0.18)" />
      ))}
      <rect x={58} y={43} width={84} height={4} rx={2} fill="rgba(255,255,255,0.35)" />
      {head(10, 52, 'l')}
      {head(148, 190, 'r')}
      {/* aro na cor da área (o colar de dentro de cada cabeça) */}
      {[52, 140].map((x) => (
        <g key={x}>
          <rect x={x} y={30} width={8} height={40} rx={3} fill={accent} />
          <rect x={x + 4} y={30} width={4} height={40} rx={2} fill={SHADE} />
        </g>
      ))}
    </svg>
  );
};

// ------------------------------------------------------------------ pote
/**
 * Pote de suplemento: branco, liso (nenhum rótulo nem palavra), tampa de rosca CLARA com o aro na cor
 * da área. `progress`: a tampa sobe, tomba e pousa de pé encostada no pé do pote, com a boca pra câmera
 * (0 → 0,3) — o oco, o aro e a lateral frisada é o que diz "tampa" (de frente e chapada ela lia
 * moeda/prato); a colher dosadora, na cor da área, sai do pó com o montinho e fica com o cabo pra fora
 * da boca (0,2 → 0,7). Sem progress, fechado. Só os pilotos da fase 3 usam o pote (fora do diff 0).
 */
const TAMPA = { lado: '#DCDFF7', topo: '#F2F3FF', oco: '#9EA5D6', fundo: '#CDD1EE' };
export const Pote: React.FC<{ size: number; accent?: string; progress?: number }> = ({ size, accent = C.gold, progress = 0 }) => {
  const p = clamp01(progress);
  const m = easeInOut(p / 0.3);
  const scoop = easeOut((p - 0.2) / 0.5);
  const open = p > 0.02;
  // a tampa fechada sai num arco e tomba pra direita; perto do fim troca pela tampa de pé (a boca
  // pra câmera), que assenta com uma molinha de 3°
  const troca = clamp01((m - 0.8) / 0.12);
  const voa = { x: 72 * m, y: 98 * m - 46 * Math.sin(Math.PI * Math.min(1, m * 1.1)), rot: 80 * m, k: 1 - 0.42 * m };
  const assenta = Math.sin(Math.PI * clamp01((m - 0.86) / 0.14)) * 3;
  // a colher: a concha sobe de dentro do pó (y 92) até pousar no alto da boca (y 30), cabo pra fora
  const cy = 92 - 62 * scoop;
  // a tampa de pé: centro da boca em (0, 0) no desenho dela; a lateral aparece à direita (o fundo
  // fechado fica atrás, encostado no pote) — frisos ao longo do aro
  // fundo `d` fundo: a tampa é funda (1/3 do diâmetro) — moeda é fina, é a espessura que separa as duas
  const R = { rx: 30, ry: 36, d: 20 };
  const friso = [-0.72, -0.36, 0, 0.36, 0.72].map((k) => {
    const y = k * R.ry;
    const x = R.rx * Math.sqrt(1 - k * k);
    return { x, y };
  });
  return (
    <svg width={size * 0.8} height={size} viewBox="0 0 160 200" style={{ overflow: 'visible' }}>
      <ellipse cx={80} cy={195} rx={62} ry={6} fill={GROUND} />
      {open ? (
        <>
          {/* boca aberta: o pó lá dentro */}
          <ellipse cx={80} cy={62} rx={56} ry={11} fill="#C9CDEB" />
          <ellipse cx={80} cy={64} rx={50} ry={8} fill="#E6E8FA" />
          {/* colher dosadora na cor da área: concha cheia (montinho branco) e o cabo inclinado pra
              fora da boca, à direita — a mão sabe onde pegar */}
          <g opacity={scoop > 0 ? 1 : 0} transform={`rotate(-8 70 ${cy + 12})`}>
            <rect x={82} y={cy + 3} width={60} height={11} rx={5.5} fill={accent} transform={`rotate(-38 86 ${cy + 8})`} />
            <rect x={82} y={cy + 8.5} width={60} height={5.5} rx={2.75} fill={SHADE} transform={`rotate(-38 86 ${cy + 8})`} />
            <path d={`M46 ${cy} h44 v14 a14 14 0 0 1 -14 14 h-16 a14 14 0 0 1 -14 -14z`} fill={accent} />
            <path d={`M70 ${cy} h20 v14 a14 14 0 0 1 -14 14 h-6z`} fill={SHADE} />
            <path d={`M44 ${cy + 1} q24 -24 48 0z`} fill={C.hi} />
            <path d={`M68 ${cy - 10} q14 4 24 11 h-24z`} fill="rgba(10,14,38,0.1)" />
          </g>
        </>
      ) : null}
      {/* corpo branco: cilindro com a borda de cima e um friso na base (liso, sem rótulo) */}
      <path d="M22 62 H138 V174 a18 18 0 0 1 -18 18 H40 a18 18 0 0 1 -18 -18 Z" fill={C.hi} />
      <path d="M86 62 H138 V174 a18 18 0 0 1 -18 18 H86 Z" fill={SHADE} opacity={0.42} />
      <rect x={22} y={166} width={116} height={7} fill="rgba(10,14,38,0.08)" />
      <rect x={34} y={78} width={10} height={84} rx={5} fill="rgba(255,255,255,0.7)" />
      <ellipse cx={80} cy={62} rx={58} ry={11} fill="none" stroke="#DADDF6" strokeWidth={5} />
      {/* tampa fechada (e voando): lateral clara com frisos, o aro da cor da área embaixo, a face de cima */}
      {troca < 1 ? (
        <g opacity={1 - troca} transform={`translate(${voa.x} ${voa.y}) rotate(${voa.rot} 80 56) translate(80 56) scale(${voa.k}) translate(-80 -56)`}>
          <ellipse cx={80} cy={64} rx={66} ry={11} fill={accent} />
          <rect x={14} y={54} width={132} height={10} fill={accent} />
          <ellipse cx={80} cy={56} rx={66} ry={11} fill={TAMPA.lado} />
          <rect x={14} y={44} width={132} height={12} fill={TAMPA.lado} />
          <path d="M80 44 H146 V64 A66 11 0 0 1 80 75 Z" fill={SHADE} opacity={0.55} />
          {[-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((k) => (
            <rect key={k} x={80 + k * 66 - 2} y={47} width={4} height={14 + 11 * Math.sqrt(1 - k * k) * 0.7} rx={2} fill="rgba(10,14,38,0.14)" />
          ))}
          <ellipse cx={80} cy={44} rx={66} ry={11} fill={TAMPA.topo} />
          <ellipse cx={58} cy={41} rx={22} ry={4} fill="rgba(255,255,255,0.6)" />
        </g>
      ) : null}
      {/* tampa de pé encostada no pé do pote, a boca pra câmera: lateral frisada atrás, aro da área,
          o oco (com o fundo mais claro deslocado: profundidade) e a vedação */}
      {troca > 0 ? (
        <g opacity={troca} transform={`translate(146 154) rotate(${-12 + assenta} 0 ${R.ry})`}>
          <ellipse cx={R.d} cy={0} rx={R.rx} ry={R.ry} fill={TAMPA.lado} />
          <rect x={0} y={-R.ry} width={R.d} height={2 * R.ry} fill={TAMPA.lado} />
          <path d={`M${R.d} ${-R.ry} A${R.rx} ${R.ry} 0 0 1 ${R.d} ${R.ry} H0 V${-R.ry}Z`} fill={SHADE} opacity={0.5} />
          {friso.map(({ x, y }, i) => (
            <rect key={i} x={x - 1} y={y - 1.8} width={R.d + 2} height={3.6} rx={1.8} fill="rgba(10,14,38,0.2)" />
          ))}
          <ellipse cx={0} cy={0} rx={R.rx} ry={R.ry} fill={accent} />
          <ellipse cx={0} cy={0} rx={R.rx - 5} ry={R.ry - 5} fill={TAMPA.oco} />
          {/* o fundo de dentro, deslocado pra trás (direita): a parede de dentro aparece à esquerda */}
          <ellipse cx={8} cy={3} rx={R.rx - 13} ry={R.ry - 13} fill={TAMPA.fundo} />
          <ellipse cx={8} cy={3} rx={R.rx - 18} ry={R.ry - 18} fill="none" stroke="rgba(10,14,38,0.13)" strokeWidth={2.5} />
          {/* côncavo: a luz de cima-esquerda deixa a borda de dentro do alto na sombra (moeda é convexa) */}
          <path d={`M${-R.rx + 6} 4 A${R.rx - 6} ${R.ry - 6} 0 0 1 ${R.rx - 10} ${-R.ry + 12}`} stroke="rgba(10,14,38,0.22)" strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d={`M${-R.rx + 4} -6 A${R.rx - 4} ${R.ry - 4} 0 0 1 -6 ${-R.ry + 4}`} stroke="rgba(255,255,255,0.45)" strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      ) : null}
    </svg>
  );
};

// ------------------------------------------------------------------ calendário
/**
 * Calendário de mesa sem algarismo: argolas no alto, faixa na cor da área e a grade 7 × 4 de casas.
 * `progress` 0..1 = 5 semanas: as casas se marcam uma a uma com um ponto da cor da área (cada ponto
 * nasce e assenta, com um anel que some — a casa nova "pousa"); a grade enche em 4 semanas e, na
 * 5ª, rola uma linha pra cima (a semana nova entra por baixo). Dá pra ler "dias passando" sem contar.
 */
export const Calendario: React.FC<{ size: number; accent?: string; progress?: number }> = ({ size, accent = C.gold, progress = 0 }) => {
  const DAYS = 35;
  const d = clamp01(progress) * DAYS;
  const scroll = easeInOut((d - 28) / 7); // 0..1 linha
  const G = { x: 21, y: 76, w: 158, h: 118, cols: 7, rows: 4, gap: 4 };
  const cw = (G.w - G.gap * (G.cols - 1)) / G.cols;
  const rh = (G.h - G.gap * (G.rows - 1)) / G.rows;
  const clip = 'cal-grade';
  const cells: React.ReactNode[] = [];
  for (let w = 0; w < 5; w++)
    for (let c = 0; c < 7; c++) {
      const i = w * 7 + c;
      const x = G.x + c * (cw + G.gap);
      const y = G.y + (w - scroll) * (rh + G.gap);
      if (y > G.y + G.h + 2 || y + rh < G.y - 2) continue;
      const pop = easeOut((d - i) / 0.45);
      const fresh = d - i > 0 && d - i < 1.4 ? 1 - (d - i) / 1.4 : 0;
      cells.push(
        <g key={i}>
          <rect x={x} y={y} width={cw} height={rh} rx={5} fill={pop > 0 ? mix('#D3D6F3', accent, 0.22) : '#D3D6F3'} />
          {pop > 0 ? (
            <>
              <circle cx={x + cw / 2} cy={y + rh / 2} r={7.5 * pop} fill={accent} />
              <circle cx={x + cw / 2 - 2} cy={y + rh / 2 - 2.5} r={2.2 * pop} fill="rgba(255,255,255,0.45)" />
            </>
          ) : null}
          {fresh > 0 ? <circle cx={x + cw / 2} cy={y + rh / 2} r={9 + 7 * (1 - fresh)} fill="none" stroke={accent} strokeWidth={2.5} opacity={fresh} /> : null}
        </g>,
      );
    }
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 200 210" style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={clip}>
          <rect x={G.x - 4} y={G.y - 3} width={G.w + 8} height={G.h + 6} />
        </clipPath>
      </defs>
      <ellipse cx={100} cy={206} rx={86} ry={5} fill={GROUND} />
      {/* cartão */}
      <rect x={10} y={20} width={180} height={182} rx={16} fill={C.hi} />
      {/* faixa do mês (sem nome) */}
      <path d="M10 36 a16 16 0 0 1 16 -16 H174 a16 16 0 0 1 16 16 V62 H10 Z" fill={accent} />
      <rect x={30} y={36} width={58} height={9} rx={4.5} fill="rgba(255,255,255,0.35)" />
      <g clipPath={`url(#${clip})`}>{cells}</g>
      {/* sombra do lado direito + brilho */}
      <path d="M118 20 H174 a16 16 0 0 1 16 16 V186 a16 16 0 0 1 -16 16 H118 Z" fill={SHADE} opacity={0.35} />
      {/* argolas */}
      {[56, 144].map((x) => (
        <g key={x}>
          <circle cx={x} cy={30} r={6} fill="rgba(10,14,38,0.35)" />
          <rect x={x - 4} y={8} width={8} height={24} rx={4} fill={C.mid} />
          <rect x={x} y={8} width={4} height={24} rx={2} fill={SHADE} />
        </g>
      ))}
    </svg>
  );
};

// ------------------------------------------------------------------ coqueteleira
/**
 * Coqueteleira sem marca: copo de plástico fosco (dá pra ver a bebida e a bolinha de misturar),
 * tampa de rosca, bico e alça na cor da área. `progress` = a mexida: a bebida balança (a superfície
 * inclina e volta) e a bolinha quica; sem progress, parada. Os risquinhos de medida não têm número.
 */
export const Coqueteleira: React.FC<{ t: number; size: number; accent?: string; progress?: number }> = ({ t, size, accent = C.gold, progress }) => {
  const shaking = progress !== undefined;
  const ph = (progress ?? 0) * Math.PI * 2;
  const tilt = shaking ? Math.sin(ph) * 11 : 0;
  const ball = shaking ? Math.abs(Math.sin(ph)) * 26 : 0;
  const drink = mix(accent, '#CDD5F7', 0.62);
  const surf = 104; // nível da bebida
  const clip = 'coq-copo';
  // corpo levemente cônico: 14..96 em cima (y 74), 19..91 embaixo (y 192)
  const body = 'M14 74 H96 L91 182 a10 10 0 0 1 -10 10 H29 a10 10 0 0 1 -10 -10 Z';
  return (
    <svg width={size * 0.55} height={size} viewBox="0 0 110 200" style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={clip}>
          <path d={body} />
        </clipPath>
      </defs>
      <ellipse cx={55} cy={196} rx={46} ry={5} fill={GROUND} />
      {/* fundo do copo (fosco) */}
      <path d={body} fill="rgba(255,255,255,0.2)" />
      <g clipPath={`url(#${clip})`}>
        {/* a bebida: a superfície inclina com a mexida */}
        <g transform={`rotate(${tilt} 55 ${surf})`}>
          <rect x={-30} y={surf} width={170} height={140} fill={drink} />
          <rect x={-30} y={surf - 5} width={170} height={8} rx={4} fill="rgba(255,255,255,0.4)" />
        </g>
        <rect x={56} y={60} width={50} height={140} fill={SHADE} opacity={0.75} />
        {/* bolinha de misturar (mola de arame) */}
        <g transform={`translate(${44 + Math.sin(ph * 2) * 6} ${164 - ball})`}>
          <circle r={13} fill="rgba(255,255,255,0.32)" />
          <path d="M-10 -4 q10 -10 20 0 M-12 3 q12 -9 24 0 M-9 9 q9 -6 18 0" stroke="rgba(10,14,38,0.25)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
        {/* bolhas subindo enquanto mexe */}
        {shaking
          ? [0, 1, 2].map((i) => {
              const k = ((t + i * 9) % 27) / 27;
              return <circle key={i} cx={30 + i * 18} cy={186 - k * 70} r={2.5 + (i % 2)} fill="rgba(255,255,255,0.5)" opacity={Math.sin(k * Math.PI)} />;
            })
          : null}
      </g>
      {/* risquinhos de medida (sem número) e o brilho do plástico */}
      {[124, 146, 168].map((y) => (
        <rect key={y} x={22} y={y} width={14} height={3} rx={1.5} fill="rgba(255,255,255,0.5)" />
      ))}
      <rect x={24} y={82} width={7} height={34} rx={3.5} fill={SHINE} />
      {/* tampa de rosca, domo, bico e alça na cor da área */}
      <path d="M36 14 a12 12 0 0 1 24 0" stroke={accent} strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M48 14 a12 12 0 0 1 12 0" stroke={SHADE} strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M20 54 Q20 26 55 24 Q90 26 90 54 Z" fill={accent} />
      <path d="M55 24 Q90 26 90 54 H55 Z" fill={SHADE} />
      <rect x={64} y={18} width={20} height={14} rx={5} fill={accent} transform="rotate(-12 74 25)" />
      <rect x={74} y={18} width={10} height={14} rx={4} fill={SHADE} transform="rotate(-12 74 25)" />
      <rect x={9} y={50} width={92} height={26} rx={8} fill={accent} />
      {[22, 36, 50, 64, 78].map((x) => (
        <rect key={x} x={x} y={54} width={4} height={18} rx={2} fill="rgba(10,14,38,0.16)" />
      ))}
      <rect x={55} y={50} width={46} height={26} rx={8} fill={SHADE} />
      <ellipse cx={36} cy={36} rx={9} ry={4} fill={SHINE} transform="rotate(-24 36 36)" />
    </svg>
  );
};
