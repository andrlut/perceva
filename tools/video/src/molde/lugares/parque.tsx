// Parque (fase 3): pista de corrida ao ar livre.
//
//   back   céu da hora (sol baixo e quente de manhã, sol alto de dia, lua de noite), nuvens,
//          prédios baixos ao longe, a fileira de árvores no horizonte, o gramado, a PISTA com 3
//          raias em perspectiva até a sebe (ela pisa na raia do meio), a trilha de terra e o piso
//          da quadrinha
//   mid    a sebe no fim da pista, a estação ao ar livre (barra fixa + caixote) à esquerda e a tabela
//          de basquete à direita (seguem `decor`: saem de baixo de peça, medidor e rótulo e do
//          `clear`); gente: quem corre sai de trás da sebe e vem pela trilha EM DIREÇÃO à câmera
//          (de frente, crescendo: lê "correndo", não "deslizando"); quem caminha vai de lado,
//          atrás da estação
//   front  folhagem desfocada (esquerda) e cerca baixa (direita)
//   anda   (rodada 2, `EnvP.anda`) ela corre e a câmera vai junto: o CHÃO passa — as marcas das raias
//          (os risquinhos transversais de cada linha) descem pra câmera, crescendo e acelerando com a
//          perspectiva, e esticam em riscos com a velocidade; grãos do piso viram riscos de velocidade
//          no chão. Nada no corpo dela (sem rastro): a velocidade é do chão.
//
// Geometria: o chão é uma perspectiva de verdade (y = 1000 + F/Z, x = 540 + F·X/Z, F = 2000), com
// os pés da protagonista em Z = 10 (y 1200 = 1000 + depth). A raia tem 1,22 m: 244 px nos pés dela.
// Não é a cidade: sem rua, ônibus nem poste. Figurante nunca no `clear` e nunca maior que 60% dela.
// Pra cena `faz` com `elenco`: o caixote fica em x ≈ 270 e o aro da cesta em x ≈ 918 (cenário).
//
// Contrato: `Lugar` em ../ambientes (helpers de lá). Nunca importado pelo ambientes.tsx.
import React from 'react';
import { Ator, poseAt } from '../../elenco/acao';
import { Arvore, Nuvem, Predios, SET, SkyDefs, noise } from '../../elenco/cenario';
import { C } from '../../theme';
import type { Hora } from '../spec';
import { ArtSvg, decor, free, hits, howMany, type Anda, type EnvP, type Lugar, type Rect } from '../ambientes';

const F = 2000;
const px = (X: number, Z: number): [number, number] => [540 + (F * X) / Z, 1000 + F / Z];
/** quadrilátero no chão entre X0..X1 e Z0 (longe)..Z1 (perto) */
const quad = (X0: number, X1: number, Z0: number, Z1: number) => {
  const p = [px(X0, Z0), px(X1, Z0), px(X1, Z1), px(X0, Z1)];
  return p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
};
const PISTA = { meia: 1.83, raia: 1.22, longe: 56, perto: 1.2 };

const GRAMA: Record<Hora, [string, string]> = { manha: ['#2A5560', '#163644'], dia: ['#24566A', '#153849'], noite: ['#14303F', '#0C1D2E'] };
const PISO_PISTA: Record<Hora, [string, string]> = { manha: ['#734A60', '#43283F'], dia: ['#664565', '#3E2742'], noite: ['#3A2A47', '#22182F'] };

// ------------------------------------------------------------------ back
/** Onde o sol/lua ficam (decor: com peça ou medidor em cima, mudam de lado ou saem). */
const ASTRO: Record<Hora, { x: number; y: number; r: number }> = {
  manha: { x: 270, y: 812, r: 46 },
  dia: { x: 850, y: 470, r: 40 },
  noite: { x: 830, y: 430, r: 40 },
};
/** Árvores do horizonte [x, tamanho]: o vão em 160..380 é por onde o sol da manhã aparece. */
const ARVORES: [number, number][] = [
  [-90, 360],
  [90, 300],
  [430, 230],
  [585, 250],
  [735, 225],
  [890, 300],
  [1050, 350],
  [1215, 300],
];

const ParqueBack: React.FC<EnvP> = (p) => {
  const { t, hora } = p;
  const id = `par-${hora}`;
  const a = ASTRO[hora];
  const R = a.r * 5;
  const astro = decor(p, [a.x - R * 0.6, a.y - R * 0.6, a.x + R * 0.6, a.y + R * 0.6], [0, hora === 'manha' ? 560 : -600]);
  const ax = astro === null ? null : a.x + astro;
  const [g0, g1] = GRAMA[hora];
  const [t0, t1] = PISO_PISTA[hora];
  const { meia, raia, longe, perto } = PISTA;
  const linha = (X: number, w: number) => quad(X - w / 2, X + w / 2, longe, perto);
  return (
    <ArtSvg>
      <SkyDefs id={id} hora={hora} />
      <defs>
        <linearGradient id={`${id}-grama`} x1="0" y1="1000" x2="0" y2="1700" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={g0} />
          <stop offset="1" stopColor={g1} />
        </linearGradient>
        <linearGradient id={`${id}-pista`} x1="0" y1="1030" x2="0" y2="1750" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={t0} />
          <stop offset="1" stopColor={t1} />
        </linearGradient>
        <linearGradient id={`${id}-bruma`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hora === 'manha' ? C.gold2 : C.hi} stopOpacity={0} />
          <stop offset="1" stopColor={hora === 'manha' ? C.gold2 : C.hi} stopOpacity={hora === 'noite' ? 0 : hora === 'manha' ? 0.16 : 0.07} />
        </linearGradient>
      </defs>
      {/* céu */}
      <rect x={-400} y={-600} width={1880} height={1620} fill={`url(#${id}-sky)`} />
      {ax === null ? null : hora === 'noite' ? (
        <>
          <circle cx={ax} cy={a.y} r={a.r} fill={C.text} opacity={0.85} />
          <circle cx={ax + a.r * 0.4} cy={a.y - a.r * 0.25} r={a.r * 0.85} fill="#171E52" />
        </>
      ) : (
        <>
          <circle cx={ax} cy={a.y} r={R} fill={`url(#${id}-sun)`} opacity={hora === 'manha' ? 1 : 0.7} />
          <circle cx={ax} cy={a.y} r={a.r} fill={C.gold2} opacity={0.92} />
        </>
      )}
      {hora === 'noite'
        ? [0.06, 0.18, 0.33, 0.47, 0.61, 0.79, 0.92].map((k, i) => (
            <circle key={i} cx={-300 + 1700 * k} cy={330 + 260 * noise(i + 3)} r={2.5} fill={C.hi} opacity={0.25 + 0.4 * noise(i + Math.floor(t / 24))} />
          ))
        : null}
      {[0, 1, 2, 3].map((i) => {
        const span = 2200;
        const x = -500 + (((i * span) / 4 + t * (0.35 + i * 0.1)) % span);
        return <Nuvem key={i} x={x} y={300 + i * 75} w={250 - i * 28} opacity={hora === 'noite' ? 0.05 : 0.13} />;
      })}
      {/* prédios baixos ao longe, atrás das árvores (a cidade fica longe: nada de rua) */}
      <Predios x={-420} base={1004} w={1920} t={t} tone={3} seed={7} tall={0.62} />
      <rect x={-400} y={700} width={1880} height={310} fill={`url(#${id}-bruma)`} />
      {/* gramado (com as faixas do corte de grama fugindo pro mesmo ponto da pista) */}
      <rect x={-400} y={1000} width={1880} height={1600} fill={`url(#${id}-grama)`} />
      {ARVORES.map(([x, s], i) => (
        <Arvore key={i} x={x} base={1008} size={s} t={t} seed={i * 1.7} />
      ))}
      {[
        [2.7, 4.3],
        [6.1, 7.9],
        [-4.3, -2.7],
        [-7.9, -6.1],
      ].map(([a0, a1], i) => (
        <polygon key={i} points={quad(a0, a1, 60, perto)} fill={C.hi} opacity={0.035} />
      ))}
      {/* a pista: piso cor de terra, guias claras nas bordas e as 2 linhas das raias */}
      <polygon points={quad(-meia - 0.2, meia + 0.2, longe, perto)} fill="rgba(5,7,26,0.25)" />
      <polygon points={quad(-meia, meia, longe, perto)} fill={`url(#${id}-pista)`} />
      <polygon points={linha(-meia - 0.05, 0.08)} fill={C.hi} opacity={0.3} />
      <polygon points={linha(meia + 0.05, 0.08)} fill={C.hi} opacity={0.3} />
      {[-raia / 2, raia / 2].map((X) => (
        <polygon key={X} points={linha(X, 0.055)} fill={C.hi} opacity={0.26} />
      ))}
      {p.anda ? <PistaAnda anda={p.anda} /> : null}
      {/* a raia do meio um pouco mais clara: é onde ela pisa */}
      <polygon points={quad(-raia / 2 + 0.05, raia / 2 - 0.05, longe, perto)} fill={C.hi} opacity={0.025} />
      {/* trilha de terra: sai de trás da sebe e vem pra câmera, pela direita da pista */}
      <path d={trilha(0.92)} fill="#46508A" opacity={0.6} />
      {/* piso da quadrinha, sob a tabela */}
      <polygon points="836,1043 1300,1043 1340,1074 812,1074" fill="#2B3672" opacity={0.75} />
      <polygon points="905,1043 931,1043 925,1074 897,1074" fill={C.hi} opacity={0.12} />
      {hora === 'noite' ? <rect x={-400} y={640} width={1880} height={1960} fill="#070A22" opacity={0.3} /> : null}
    </ArtSvg>
  );
};

// ------------------------------------------------------------------ o chão que anda
/** Metros que a pista anda por quadro-de-corrida (≈ 7 m/s: o passo dela é de tiro). */
const VEL = 0.23;
/** A cada quantos metros cada linha tem a sua marca transversal, e até onde (longe) elas vão. */
const MARCA = { cada: 2.4, perto: 1.25, longe: 46 };
const smooth = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};
/**
 * As raias descendo pra câmera: um risquinho transversal em cada linha a cada 2,4 m (parado, é a
 * marca de sempre da pista; correndo, desce e estica em risco — o borrão da velocidade) e grãos do
 * piso que só aparecem correndo, como riscos de velocidade no chão. Some com a distância.
 */
const PistaAnda: React.FC<{ anda: Anda }> = ({ anda }) => {
  const { meia, raia } = PISTA;
  const zs = anda.d * VEL;
  const v = Math.max(0, Math.min(1, anda.v));
  const span = MARCA.longe - MARCA.perto;
  const K = Math.ceil(span / MARCA.cada);
  const KP = K * MARCA.cada;
  const linhas = [-meia - 0.05, -raia / 2, raia / 2, meia + 0.05];
  const zDe = (off: number) => MARCA.perto + ((((off - zs) % KP) + KP) % KP);
  // some com a distância e também bem perto da câmera (lá embaixo ele seria um borrão do tamanho da tela)
  const longe = (z: number) => (1 - smooth((z - 20) / 24)) * smooth((z - 2.2) / 1.8);
  const marcas: React.ReactNode[] = [];
  for (let k = 0; k < K; k++) {
    const z = zDe(k * MARCA.cada);
    const len = 0.09 + 0.6 * v;
    const o = (0.3 - 0.13 * v) * longe(z);
    if (o < 0.01) continue;
    // as guias das bordas levam a marca mais apagada: quem lê o movimento são as duas linhas da raia dela
    for (const X of linhas) marcas.push(<polygon key={`${k}:${X}`} points={quad(X - 0.14, X + 0.14, z + len, z)} fill={C.hi} opacity={Math.abs(X) > 1 ? o * 0.6 : o} />);
  }
  const graos: React.ReactNode[] = [];
  if (v > 0.02) {
    for (let i = 0; i < 28; i++) {
      const X = -1.72 + 3.44 * noise(i * 3 + 1);
      const z = zDe(noise(i * 7 + 2) * KP);
      const len = 0.05 + 1.1 * v;
      const o = 0.2 * v * longe(z);
      if (o < 0.01) continue;
      graos.push(<polygon key={`g${i}`} points={quad(X - 0.022, X + 0.022, z + len, z)} fill={i % 3 ? C.hi : '#1A1030'} opacity={i % 3 ? o : o * 1.6} />);
    }
  }
  return (
    <>
      {graos}
      {marcas}
    </>
  );
};

// ------------------------------------------------------------------ trilha e gente
/** A trilha da direita (curva de Bézier): sai de trás da sebe, vai pra direita e desce pra câmera. */
const T0: [number, number] = [762, 1030];
const T1: [number, number] = [915, 1038];
const T2: [number, number] = [1250, 1300];
const bez = (u: number): [number, number] => {
  const v = 1 - u;
  return [v * v * T0[0] + 2 * u * v * T1[0] + u * u * T2[0], v * v * T0[1] + 2 * u * v * T1[1] + u * u * T2[1]];
};
/** O desenho da trilha: a faixa alarga com a perspectiva (24 px no fundo, 120 px perto). */
function trilha(fim: number) {
  const n = 18;
  const up: string[] = [];
  const dn: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * fim + 0.04;
    const [x, y] = bez(u);
    const w = 12 + 58 * u * u;
    up.push(`${x.toFixed(1)},${(y - w * 0.32).toFixed(1)}`);
    dn.unshift(`${x.toFixed(1)},${(y + w * 0.32).toFixed(1)}`);
  }
  return `M${up.join(' L')} L${dn.join(' L')} Z`;
}
/** Quem corre pela trilha: tamanho cresce de 96 a 176 px (≤ 60% da protagonista de 300–400). */
const corredorEm = (u: number) => {
  const [x, y] = bez(u);
  return { x, y, size: 96 + 80 * u };
};
/** A caixa que a trilha toda ocupa (com a pessoa de pé): se algo da cena cai aqui, ninguém corre. */
const TRILHA_BOX: Rect = [735, 905, 1330, 1300];
/** Até aqui (x) quem corre ainda está atrás da sebe (é desenhado antes dela). */
const SEBE_FIM = 852;

/** Quem caminha: sai de trás da sebe pela esquerda e vai de lado, atrás da estação. */
const W0: [number, number] = [300, 1030];
const W1: [number, number] = [-280, 1068];
const CAMINHA_BOX: Rect = [-300, 880, 330, 1075];

// ------------------------------------------------------------------ peças do meio
/** A sebe no fim da pista (esconde quem chega pela trilha). */
const SEBE: [number, number, number, number][] = [
  // [cx, rx, ry, tom 0/1]
  [292, 62, 74, 0],
  [372, 70, 92, 1],
  [458, 64, 82, 0],
  [540, 74, 96, 1],
  [624, 66, 84, 0],
  [706, 72, 98, 1],
  [778, 66, 112, 0],
];
const SEBE_BASE = 1040;
const Sebe: React.FC<{ t: number; noite: boolean }> = ({ t, noite }) => {
  const tone = noite ? ['#123B3E', '#174A49'] : ['#1A5552', '#22665F'];
  return (
    <ArtSvg>
      <rect x={250} y={SEBE_BASE - 60} width={580} height={62} rx={20} fill={tone[0]} />
      {SEBE.map(([cx, rx, ry, k], i) => {
        const sw = Math.sin(t / 40 + i) * 1.2;
        return (
          <g key={i} transform={`rotate(${sw} ${cx} ${SEBE_BASE})`}>
            <ellipse cx={cx} cy={SEBE_BASE - ry} rx={rx} ry={ry} fill={tone[k]} />
            <path d={`M${cx} ${SEBE_BASE - 2 * ry} a${rx} ${ry} 0 0 1 0 ${2 * ry} a${rx * 0.72} ${ry} 0 0 0 0 ${-2 * ry}z`} fill="rgba(5,7,26,0.22)" />
            <ellipse cx={cx - rx * 0.35} cy={SEBE_BASE - ry * 1.55} rx={rx * 0.32} ry={ry * 0.18} fill="rgba(255,255,255,0.06)" />
          </g>
        );
      })}
      <rect x={250} y={SEBE_BASE - 6} width={580} height={10} rx={5} fill="rgba(5,7,26,0.3)" />
    </ArtSvg>
  );
};

/** Barra fixa + caixote (a estação ao ar livre), à esquerda. `dx` = deslocamento do decor. */
const ESTACAO: Rect = [8, 780, 334, 1102];
const Estacao: React.FC<{ dx: number }> = ({ dx }) => {
  const metal = '#3E478C';
  const metalLuz = '#545EA6';
  const base = 1094;
  const top = 796;
  return (
    <ArtSvg>
      <g transform={`translate(${dx} 0)`}>
        <ellipse cx={128} cy={base + 4} rx={150} ry={10} fill="rgba(0,0,0,0.28)" />
        {/* barra fixa: dois postes e a barra */}
        {[34, 210].map((x) => (
          <g key={x}>
            <rect x={x - 9} y={top} width={18} height={base - top} rx={8} fill={metal} />
            <rect x={x} y={top} width={9} height={base - top} rx={4} fill="rgba(5,7,26,0.3)" />
            <rect x={x - 15} y={base - 10} width={30} height={12} rx={4} fill={SET.furnDark} />
          </g>
        ))}
        <rect x={22} y={top + 6} width={200} height={14} rx={7} fill={metalLuz} />
        <rect x={22} y={top + 13} width={200} height={7} rx={3.5} fill="rgba(5,7,26,0.25)" />
        {/* barra baixa (pra apoio) entre os postes */}
        <rect x={34} y={top + 150} width={176} height={10} rx={5} fill={metal} />
        {/* caixote: frente, tampo em perspectiva e o lado na sombra */}
        <polygon points="226,1036 312,1036 326,1024 240,1024" fill="#5D5089" />
        <rect x={226} y={1036} width={86} height={62} rx={4} fill="#4A3F72" />
        <polygon points="312,1036 326,1024 326,1086 312,1098" fill="#33295A" />
        <rect x={252} y={1056} width={34} height={9} rx={4.5} fill="rgba(5,7,26,0.3)" />
      </g>
    </ArtSvg>
  );
};

/** Tabela de basquete à direita: poste, braço, tabela com o quadrado, aro e rede. */
const TABELA: Rect = [836, 636, 1052, 1062];
const AROX = 918;
const Tabela: React.FC<{ t: number; dx: number; noite: boolean }> = ({ t, dx, noite }) => {
  const sw = Math.sin(t / 26) * 2;
  return (
    <ArtSvg>
      <g transform={`translate(${dx} 0)`} opacity={noite ? 0.8 : 1}>
        <ellipse cx={1030} cy={1058} rx={46} ry={7} fill="rgba(0,0,0,0.28)" />
        <rect x={1021} y={702} width={20} height={356} rx={8} fill="#3E478C" />
        <rect x={1031} y={702} width={10} height={356} rx={5} fill="rgba(5,7,26,0.3)" />
        <rect x={980} y={706} width={50} height={14} rx={6} fill="#3E478C" />
        {/* tabela */}
        <rect x={846} y={648} width={146} height={104} rx={8} fill="#56619F" />
        <rect x={920} y={648} width={72} height={104} rx={8} fill="rgba(5,7,26,0.18)" />
        <rect x={892} y={696} width={54} height={42} rx={3} fill="none" stroke={C.hi} strokeWidth={4} opacity={0.4} />
        {/* aro e rede */}
        <rect x={AROX - 4} y={748} width={8} height={18} fill="#3E478C" />
        <g transform={`rotate(${sw} ${AROX} 770)`}>
          {[-22, -11, 0, 11, 22].map((k) => (
            <path key={k} d={`M${AROX + k} 772 L${AROX + k * 0.6} 812`} stroke={C.hi} strokeWidth={2.5} opacity={0.3} />
          ))}
          <path d={`M${AROX - 26} 790 h52 M${AROX - 20} 806 h40`} stroke={C.hi} strokeWidth={2} opacity={0.22} />
        </g>
        <ellipse cx={AROX} cy={770} rx={30} ry={7} fill="none" stroke="#B9703F" strokeWidth={6} opacity={0.85} />
      </g>
    </ArtSvg>
  );
};

// ------------------------------------------------------------------ mid
const ParqueMid: React.FC<EnvP> = (p) => {
  const { t, clear, gente, busy, hora } = p;
  const noite = hora === 'noite';
  const estacao = free(clear, ESTACAO[0], ESTACAO[2]) ? decor(p, ESTACAO, [0, -60]) : null;
  const tabela = free(clear, TABELA[0], TABELA[2]) ? decor(p, TABELA, [0, 30]) : null;
  // quem corre: a trilha inteira tem que estar livre (do clear e do que a cena desenha)
  const nRun = howMany(gente, 1, 2);
  const trilhaOk = free(clear, T0[0] - 30, T0[0] + 30) && !hits(busy, TRILHA_BOX);
  const PER = 150;
  const DUR = 112;
  const runners = trilhaOk
    ? [0, 1].slice(0, nRun).flatMap((i) => {
        const f = t + 30 + i * 75;
        const k = (((f % PER) + PER) % PER) / DUR;
        if (k > 1) return [];
        const u = k ** 1.25;
        return [{ i, ...corredorEm(u), f, seed: i ? 4 : 2 }];
      })
    : [];
  // quem caminha (só com muita gente): de lado, atrás da estação
  const walk = gente === 'muita' && free(clear, -300, W0[0] + 30) && !hits(busy, CAMINHA_BOX);
  const WPER = 260;
  const wk = (((t + 70) % WPER) + WPER) % WPER / 230;
  const walker =
    walk && wk <= 1
      ? { x: W0[0] + (W1[0] - W0[0]) * wk, y: W0[1] + (W1[1] - W0[1]) * wk, size: 104 + 24 * wk }
      : null;
  const person = (r: { x: number; y: number; size: number; f: number; seed: number }) => (
    <Ator key={`r${r.seed}`} t={t} x={r.x} y={r.y} size={r.size} pose={poseAt('correr', r.f, { dir: 1 })} seed={r.seed} figurante />
  );
  const behind = runners.filter((r) => r.x < SEBE_FIM);
  const front = runners.filter((r) => r.x >= SEBE_FIM);
  const walkerEl = walker ? (
    <Ator t={t} x={walker.x} y={walker.y} size={walker.size} pose={poseAt('andar', t + 11, { dir: -1 })} seed={5} figurante />
  ) : null;
  return (
    <>
      {behind.map(person)}
      {walker && walker.x > 240 ? walkerEl : null}
      <Sebe t={t} noite={noite} />
      {walker && walker.x <= 240 ? walkerEl : null}
      {estacao === null ? null : <Estacao dx={estacao} />}
      {tabela === null ? null : <Tabela t={t} dx={tabela} noite={noite} />}
      {front.map(person)}
    </>
  );
};

// ------------------------------------------------------------------ front
const ParqueFront: React.FC<EnvP> = ({ t, noLeft, noRight }) => (
  <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1080} height={1920} viewBox="0 0 1080 1920">
    {noLeft
      ? null
      : (
          [
            [-30, 1350, 150, 70, -20],
            [70, 1300, 130, 56, 25],
            [170, 1395, 120, 50, -35],
            [10, 1460, 170, 72, 10],
            [230, 1470, 110, 44, 40],
          ] as [number, number, number, number, number][]
        ).map(([x, y, rx, ry, a], i) => (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx={rx}
            ry={ry}
            fill={i % 2 ? SET.leaf : SET.leafDark}
            opacity={0.92}
            transform={`rotate(${a + Math.sin(t / 30 + i) * 2.5} ${x} ${y})`}
          />
        ))}
    {noRight ? null : (
      <g>
        {[900, 990, 1080, 1170].map((x) => (
          <g key={x}>
            <rect x={x} y={1320} width={30} height={220} rx={8} fill={SET.furnTop} />
            <rect x={x + 15} y={1320} width={15} height={220} rx={6} fill="rgba(5,7,26,0.3)" />
            <path d={`M${x} 1326 l15 -18 l15 18z`} fill={SET.furnTop} />
          </g>
        ))}
        <rect x={880} y={1360} width={340} height={22} rx={8} fill={SET.frame} />
        <rect x={880} y={1430} width={340} height={22} rx={8} fill={SET.frame} />
        <rect x={880} y={1372} width={340} height={10} rx={5} fill="rgba(5,7,26,0.25)" />
      </g>
    )}
  </svg>
);

export const parque: Lugar = {
  back: ParqueBack,
  mid: ParqueMid,
  front: ParqueFront,
  depth: 200,
  gente: 'pouca',
  hora: 'dia',
  frontZones: { left: [-200, 1230, 360, 1545], right: [880, 1300, 1220, 1545] },
};

/** Pra cena `faz` (elenco): onde ficam o caixote e o aro da cesta no cenário. */
export const PARQUE_POSTOS = { caixote: { x: 269, topo: 1030 }, cesta: { x: AROX, y: 770 } } as const;
