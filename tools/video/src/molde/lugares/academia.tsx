// Academia (fase 3): sala de musculação.
//
//   back   parede com a janela alta (céu da hora + a cidade lá fora: a Luz cai dela de manhã e de
//          dia), luminárias tubulares no teto, o espelho largo (painéis, brilho na diagonal, o reflexo
//          das luminárias e do chão — sem gente refletida), o relógio de parede sem números, a
//          gaiola de agachamento (barra com anilhas, uma anilha encostada) à esquerda e o rack de
//          halteres (as cabeças sextavadas vistas de frente, em dois andares) à direita; piso de
//          borracha em placas
//   mid    o banco reto à direita; gente treinando ao fundo: `pouca` = 1 levantando halteres (à
//          esquerda, na frente do espelho), `muita` = + 1 saltando (à direita, atrás do banco).
//          Tudo fora do `clear` e de baixo do que a cena desenha (anda pra beirada ou sai).
//   front  anilha desfocada (esquerda) e garrafa d'água sem marca (direita)
//
// A esteira foi cortada desta leva (quem corre aqui corre no lugar, no piso).
//
// Rodada 2 (`EnvP.anda`): ela corre no lugar e a câmera vai junto — as juntas das placas do piso
// descem pra câmera (as mesmas 6 linhas de sempre em u = 0..5, andando em u; parado, o piso de
// sempre) e grãos de borracha esticam em riscos de velocidade no chão.
//
// Contrato: `Lugar` em ../ambientes (helpers de lá). Nunca importado pelo ambientes.tsx.
import React from 'react';
import { Ator, cicloDe, poseAt } from '../../elenco/acao';
import { Relogio } from '../../elenco/cast';
import { Janela, SET, SkyDefs } from '../../elenco/cenario';
import { C, dimColor } from '../../theme';
import { ArtSvg, decor, free, hits, howMany, inside, type Anda, type EnvP, type Lugar, type Rect } from '../ambientes';

/** Pose em laço de uma ação que tem fim (saltar/levantar): faz uma rep e descansa `pausa` quadros. */
const lacoDe = (acao: 'saltar' | 'levantar', f: number, pausa: number) => {
  const n = cicloDe(acao);
  const per = n + pausa;
  const k = ((f % per) + per) % per;
  return k < n ? poseAt(acao, k) : poseAt('pronta', 0);
};

// ------------------------------------------------------------------ back
const ACA = {
  janela: { x: 250, y: 300, w: 560, h: 150 },
  espelho: { x0: -60, x1: 1140, y0: 520, y1: 968 },
  relogio: [925, 300, 1041, 416] as Rect,
  rack: [596, 800, 1084, 1004] as Rect,
  gaiola: [14, 596, 348, 1004] as Rect,
};

const hexPts = (cx: number, cy: number, r: number) =>
  [0, 60, 120, 180, 240, 300].map((a) => `${(cx + Math.cos(((a + 30) * Math.PI) / 180) * r).toFixed(1)},${(cy + Math.sin(((a + 30) * Math.PI) / 180) * r).toFixed(1)}`).join(' ');

/** Rack de halteres: dois andares de cabeças sextavadas vistas de frente (o eixo aponta pra câmera). */
const Rack: React.FC<{ dx: number }> = ({ dx }) => {
  const [x0, y0, x1] = ACA.rack;
  const cores = [dimColor('body'), dimColor('bonds'), C.gold, dimColor('health'), dimColor('craft'), C.violet2];
  const tier = (y: number, rs: number[], seed: number) => {
    const gap = (x1 - x0 - 44 - rs.reduce((a, r) => a + 2 * r, 0)) / (rs.length - 1);
    let x = x0 + 22;
    return rs.map((r, i) => {
      const cx = x + r;
      x += 2 * r + gap;
      const cy = y - r * 0.9;
      return (
        <g key={i}>
          <polygon points={hexPts(cx, cy, r)} fill="#2B3266" />
          <polygon points={hexPts(cx, cy, r * 0.64)} fill="#20265A" />
          <circle cx={cx} cy={cy} r={r * 0.3} fill={cores[(i + seed) % cores.length]} opacity={0.5} />
          <path d={`M${cx + r * 0.1} ${cy - r} L${cx + r * 0.87} ${cy - r * 0.5} L${cx + r * 0.87} ${cy + r * 0.5} L${cx + r * 0.1} ${cy + r}z`} fill="rgba(5,7,26,0.25)" />
          <path d={`M${cx - r * 0.87} ${cy - r * 0.5} L${cx} ${cy - r} L${cx + r * 0.1} ${cy - r * 0.86} L${cx - r * 0.7} ${cy - r * 0.38}z`} fill="rgba(255,255,255,0.08)" />
        </g>
      );
    });
  };
  return (
    <g transform={`translate(${dx} 0)`}>
      {/* a estrutura: dois pés e as duas prateleiras */}
      <rect x={x0} y={y0 + 30} width={20} height={1004 - y0 - 30} rx={6} fill={SET.frame} />
      <rect x={x1 - 20} y={y0 + 30} width={20} height={1004 - y0 - 30} rx={6} fill={SET.frameShade} />
      {tier(896, [27, 28, 29, 30, 31, 32], 0)}
      <rect x={x0 - 8} y={894} width={x1 - x0 + 16} height={14} rx={5} fill={SET.furnTop} />
      {tier(986, [34, 35, 36, 37, 38], 3)}
      <rect x={x0 - 8} y={982} width={x1 - x0 + 16} height={16} rx={5} fill={SET.furnTop} />
      <rect x={x0 - 8} y={994} width={x1 - x0 + 16} height={4} rx={2} fill="rgba(5,7,26,0.3)" />
    </g>
  );
};

/**
 * A gaiola de agachamento (o desenho que mais diz "academia"): dois montantes furados, a barra no
 * suporte com as anilhas de lado nas pontas e uma anilha encostada no pé.
 */
const Gaiola: React.FC<{ dx: number }> = ({ dx }) => {
  const metal = '#3A438A';
  const top = 606;
  const barY = 792;
  const anilha = (x: number, h: number, w: number, c: string) => (
    <g>
      <rect x={x - w / 2} y={barY - h / 2} width={w} height={h} rx={w / 2} fill="#2A3068" />
      <rect x={x - w / 2} y={barY - h / 2} width={w} height={h} rx={w / 2} fill="none" stroke={c} strokeWidth={3} opacity={0.4} />
      <rect x={x} y={barY - h / 2} width={w / 2} height={h} rx={w / 4} fill="rgba(5,7,26,0.28)" />
    </g>
  );
  return (
    <g transform={`translate(${dx} 0)`}>
      {[72, 290].map((x) => (
        <g key={x}>
          <rect x={x - 10} y={top} width={20} height={1004 - top} rx={4} fill={metal} />
          <rect x={x} y={top} width={10} height={1004 - top} rx={3} fill="rgba(5,7,26,0.3)" />
          {Array.from({ length: 11 }, (_, i) => (
            <circle key={i} cx={x - 2} cy={top + 40 + i * 30} r={3} fill="rgba(5,7,26,0.45)" />
          ))}
          <rect x={x - 22} y={996} width={44} height={10} rx={4} fill={SET.furnDark} />
          {/* suporte da barra */}
          <path d={`M${x - 12} ${barY + 6} h24 v10 h-24z`} fill={SET.furnTop} />
        </g>
      ))}
      <rect x={52} y={top} width={258} height={16} rx={6} fill={metal} />
      <rect x={52} y={top + 9} width={258} height={7} rx={3} fill="rgba(5,7,26,0.3)" />
      {/* barra com anilhas */}
      <rect x={14} y={barY - 5} width={334} height={10} rx={5} fill="#7880B6" />
      <rect x={14} y={barY} width={334} height={5} rx={2.5} fill="rgba(5,7,26,0.25)" />
      {anilha(36, 150, 22, dimColor('body'))}
      {anilha(56, 116, 16, dimColor('bonds'))}
      {anilha(326, 150, 22, dimColor('body'))}
      {anilha(306, 116, 16, dimColor('bonds'))}
      {/* anilha encostada no pé (de frente) */}
      <circle cx={196} cy={938} r={64} fill="#283069" />
      <circle cx={196} cy={938} r={54} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
      <circle cx={196} cy={938} r={22} fill="#1E2454" />
      <circle cx={196} cy={938} r={8} fill="#0D1131" />
      <path d="M196 874 a64 64 0 0 1 0 128 a50 64 0 0 0 0 -128z" fill="rgba(5,7,26,0.25)" />
    </g>
  );
};

const Espelho: React.FC<{ id: string; t: number }> = ({ id, t }) => {
  const { x0, x1, y0, y1 } = ACA.espelho;
  const clip = `${id}-esp`;
  const drift = Math.sin(t / 90) * 14;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
        </clipPath>
        <linearGradient id={`${id}-vidro`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#424A84" />
          <stop offset="0.7" stopColor="#323A70" />
          <stop offset="1" stopColor="#252B5C" />
        </linearGradient>
      </defs>
      <rect x={x0 - 12} y={y0 - 12} width={x1 - x0 + 24} height={y1 - y0 + 24} rx={8} fill={SET.frame} />
      <g clipPath={`url(#${clip})`}>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${id}-vidro)`} />
        {/* o reflexo da sala atrás da câmera: as luminárias, a linha do chão e o chão mais escuro */}
        {[90, 470, 850].map((x) => (
          <rect key={x} x={x} y={y0 + 34} width={200} height={10} rx={5} fill={C.hi} opacity={0.18} />
        ))}
        <rect x={x0} y={y1 - 96} width={x1 - x0} height={96} fill="#1A2152" opacity={0.75} />
        <rect x={x0} y={y1 - 98} width={x1 - x0} height={5} fill="rgba(255,255,255,0.06)" />
        {/* brilho do vidro na diagonal */}
        {[
          [80, 120],
          [250, 46],
          [690, 150],
          [880, 54],
        ].map(([x, w], i) => (
          <path key={i} d={`M${x + drift} ${y1} L${x + w + drift} ${y1} L${x + w + 240 + drift} ${y0} L${x + 240 + drift} ${y0}z`} fill="rgba(255,255,255,0.06)" />
        ))}
      </g>
      {/* emendas dos painéis */}
      {[240, 540, 840].map((x) => (
        <rect key={x} x={x - 3} y={y0} width={6} height={y1 - y0} fill="rgba(5,7,26,0.35)" />
      ))}
    </g>
  );
};

/** As juntas do piso (y abaixo do horizonte) em u = -1..6; u = 0..5 são as 6 de sempre. */
const JUNTAS = [18, 42, 96, 168, 262, 388, 556, 790];
/** y da junta em u (log-linear entre os nós: perto da câmera elas andam mais rápido, como perspectiva). */
const juntaY = (u: number) => {
  const i = Math.max(0, Math.min(JUNTAS.length - 2, Math.floor(u + 1)));
  const k = u + 1 - i;
  return Math.exp(Math.log(JUNTAS[i]) + (Math.log(JUNTAS[i + 1]) - Math.log(JUNTAS[i])) * k);
};
/** Juntas por quadro-de-corrida (≈ 5,6 px/quadro nos pés dela, mais perto da câmera mais rápido). */
const VEL_JUNTA = 0.06;
const sm01 = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};
/** x de uma linha de fuga do piso (a k-ésima, como as do Borracha) na altura y (abaixo do horizonte). */
const fugaX = (k: number, r: number) => 540 + k * (150 + (230 * r) / 900);

/** Piso de borracha: placas em perspectiva (mesma fuga do Piso), juntas escuras e um respingo de flocos. */
const Borracha: React.FC<{ id: string; anda?: Anda }> = ({ id, anda }) => {
  const vx = 540;
  const rows = [42, 96, 168, 262, 388, 556];
  // o chão que anda: as juntas descem em u (a que nasce no horizonte entra apagada, a que sai embaixo some)
  const fi = anda ? (((anda.d * VEL_JUNTA) % 1) + 1) % 1 : 0;
  const v = anda ? Math.max(0, Math.min(1, anda.v)) : 0;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-borracha`} x1="0" y1="1000" x2="0" y2="2300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#20265C" />
          <stop offset="1" stopColor="#1A2050" />
        </linearGradient>
      </defs>
      <rect x={-500} y={1000} width={2100} height={1600} fill={`url(#${id}-borracha)`} />
      {anda
        ? [-1, 0, 1, 2, 3, 4, 5].map((k) => {
            const u = k + fi;
            const r = juntaY(u);
            const o = 0.24 * sm01(u + 1) * (1 - sm01((u - 5.4) / 0.6));
            // a junta estica no sentido do movimento (o borrão da velocidade), mais perto mais; e a borda
            // de cima dela pega a luz das luminárias (o piso é escuro: sem isso a junta que anda não se vê)
            const h = 3 + v * 0.05 * (juntaY(u + 0.25) - r);
            return (
              <g key={k}>
                <rect x={-500} y={1000 + r} width={2100} height={h} fill={`rgba(5,7,26,${(o * (1 + 0.6 * v)).toFixed(3)})`} />
                {v > 0.02 ? <rect x={-500} y={1000 + r - 2} width={2100} height={2} fill={C.hi} opacity={0.07 * v * (o / 0.24)} /> : null}
              </g>
            );
          })
        : rows.map((r) => <rect key={r} x={-500} y={1000 + r} width={2100} height={3} fill="rgba(5,7,26,0.24)" />)}
      {anda && v > 0.02
        ? Array.from({ length: 40 }, (_, i) => {
            // grãos da borracha: só aparecem correndo, como riscos curtos descendo pra câmera
            const lane = -5.5 + 11 * ((Math.sin(i * 91.7 + 3.1) * 43758.5453) % 1 + 1) % 1;
            const u = (((((i * 0.618) % 1) * 6.4 + anda.d * VEL_JUNTA) % 6.4) + 6.4) % 6.4 - 1;
            const r0 = juntaY(u);
            const r1 = juntaY(u + 0.12 + 0.5 * v);
            const o = 0.34 * v * sm01(u + 1) * (1 - sm01((u - 5) / 0.8));
            const x0 = fugaX(lane, r0);
            const x1 = fugaX(lane, r1);
            const w = 1.6 + r0 / 110;
            return <path key={`g${i}`} d={`M${(x0 - w).toFixed(1)} ${1000 + r0} L${(x0 + w).toFixed(1)} ${1000 + r0} L${(x1 + w * 1.6).toFixed(1)} ${(1000 + r1).toFixed(1)} L${(x1 - w * 1.6).toFixed(1)} ${(1000 + r1).toFixed(1)}Z`} fill={i % 3 ? C.hi : '#0B0F30'} opacity={i % 3 ? o : o * 1.4} />;
          })
        : null}
      {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((k) => (
        <path key={k} d={`M${vx + 150 * k} 1000 L${vx + 380 * k} 1900`} stroke="rgba(5,7,26,0.22)" strokeWidth={3} />
      ))}
      {/* rodapé */}
      <rect x={-500} y={994} width={2100} height={12} fill={SET.base} />
    </g>
  );
};

const AcademiaBack: React.FC<EnvP> = (p) => {
  const { t, hora, show } = p;
  const id = `aca-${hora}`;
  const j = ACA.janela;
  const clock = show.includes('relogio') ? null : decor(p, ACA.relogio, [0, -880]);
  const rack = decor(p, ACA.rack, [0, 40]);
  const gaiola = decor(p, ACA.gaiola, [0, -30]);
  const noite = hora === 'noite';
  return (
    <>
      <ArtSvg>
        <SkyDefs id={id} hora={hora} />
        <rect x={-400} y={-600} width={1880} height={1610} fill={`url(#${id}-wall)`} />
        {/* teto: as luminárias tubulares (acesas, mais fortes à noite) */}
        <rect x={-400} y={-600} width={1880} height={700} fill="rgba(5,7,26,0.25)" />
        {[100, 460, 820].map((x) => (
          <g key={x}>
            <rect x={x - 30} y={70} width={220} height={150} fill={C.hi} opacity={noite ? 0.05 : 0.03} />
            <rect x={x} y={86} width={160} height={16} rx={8} fill={SET.furnTop} />
            <rect x={x + 8} y={98} width={144} height={8} rx={4} fill={C.hi} opacity={noite ? 0.75 : 0.55} />
          </g>
        ))}
        <Janela id={id} x={j.x} y={j.y} w={j.w} h={j.h} t={t} hora={hora} panes={4} />
        <Espelho id={id} t={t} />
        {gaiola === null ? null : <Gaiola dx={gaiola} />}
        {rack === null ? null : <Rack dx={rack} />}
        <Borracha id={id} anda={p.anda} />
      </ArtSvg>
      {clock === null ? null : (
        <div style={{ position: 'absolute', left: ACA.relogio[0] + clock, top: ACA.relogio[1], opacity: 0.75 }}>
          <Relogio t={t} size={116} speed={0.4} accent={SET.frame} />
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ mid
/** Banco reto (estofado, pés de metal). `x` = centro, `base` = linha do chão. */
const BANCO = { x: 900, base: 1150, w: 250 };
const bancoRect = (x: number): Rect => [x - BANCO.w / 2 - 6, BANCO.base - 68, x + BANCO.w / 2 + 6, BANCO.base + 6];
const Banco: React.FC<{ x: number }> = ({ x }) => {
  const { base, w } = BANCO;
  const l = x - w / 2;
  return (
    <ArtSvg>
      <ellipse cx={x} cy={base + 2} rx={w * 0.55} ry={9} fill="rgba(0,0,0,0.3)" />
      {[l + 26, l + w - 40].map((lx) => (
        <g key={lx}>
          <rect x={lx} y={base - 40} width={14} height={40} rx={4} fill="#3E478C" />
          <rect x={lx - 10} y={base - 8} width={34} height={8} rx={4} fill={SET.furnDark} />
        </g>
      ))}
      <rect x={l + 30} y={base - 44} width={w - 60} height={10} rx={5} fill="#3E478C" />
      {/* estofado */}
      <rect x={l} y={base - 68} width={w} height={28} rx={13} fill="#433878" />
      <rect x={x} y={base - 68} width={w / 2} height={28} rx={13} fill="rgba(5,7,26,0.25)" />
      <rect x={l + 14} y={base - 61} width={w * 0.4} height={6} rx={3} fill="rgba(255,255,255,0.1)" />
    </ArtSvg>
  );
};

/** Quem treina ao fundo: [x de sempre, x da beirada], pés, tamanho. */
const LEVANTA = { xs: [168, 104], y: 1062, size: 170 };
const SALTA = { xs: [968, 1000], y: 1050, size: 160 };

const AcademiaMid: React.FC<EnvP> = ({ t, clear, gente, busy, view }) => {
  // o corpo inteiro de quem treina (com os halteres acima da cabeça ou o salto): fora do clear,
  // fora do que a cena desenha e com a cabeça no quadro; senão vai pra beirada ou sai
  const spot = (o: { xs: number[]; y: number; size: number }, alto: number) =>
    o.xs.find((x) => {
      const r: Rect = [x - o.size * 0.55, o.y - o.size * (1.26 + alto), x + o.size * 0.55, o.y + 6];
      return free(clear, r[0], r[2]) && !hits(busy, r) && inside(view, [x - o.size * 0.3, r[1], x + o.size * 0.3, o.y]);
    }) ?? null;
  const n = howMany(gente, 1, 2);
  const lx = n >= 1 ? spot(LEVANTA, 0.35) : null;
  const sx = n >= 2 ? spot(SALTA, 0.3) : null;
  const banco = free(clear, BANCO.x - BANCO.w / 2, BANCO.x + BANCO.w / 2) && !hits(busy, bancoRect(BANCO.x));
  return (
    <>
      {lx === null ? null : <Ator t={t} x={lx} y={LEVANTA.y} size={LEVANTA.size} pose={lacoDe('levantar', t + 9, 14)} seed={3} maos="peso" figurante />}
      {sx === null ? null : <Ator t={t} x={sx} y={SALTA.y} size={SALTA.size} pose={lacoDe('saltar', t + 21, 26)} seed={1} figurante />}
      {banco ? <Banco x={BANCO.x} /> : null}
    </>
  );
};

// ------------------------------------------------------------------ front
const AcademiaFront: React.FC<EnvP> = ({ noLeft, noRight }) => (
  <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1080} height={1920} viewBox="0 0 1080 1920">
      {noLeft ? null : (
        <g>
          {/* anilha grande encostada no canto */}
          <circle cx={40} cy={1430} r={200} fill="#2C3270" />
          <circle cx={40} cy={1430} r={168} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} />
          <circle cx={40} cy={1430} r={72} fill="#1E2454" />
          <circle cx={40} cy={1430} r={72} fill="none" stroke={dimColor('body')} strokeWidth={9} opacity={0.4} />
          <circle cx={40} cy={1430} r={26} fill="#0D1131" />
          <path d="M40 1230 a200 200 0 0 1 0 400 a160 200 0 0 0 0 -400z" fill="rgba(5,7,26,0.28)" />
        </g>
      )}
      {noRight ? null : (
        <g>
          {/* garrafa d'água sem marca: tampa de bico, corpo com a cinta de pegada */}
          <rect x={968} y={1236} width={46} height={30} rx={10} fill={SET.frame} />
          <rect x={980} y={1218} width={22} height={24} rx={8} fill={SET.furnTop} />
          <path d="M936 1300 q0 -36 40 -40 h30 q40 4 40 40 V1540 H936 Z" fill="#4A5AA6" />
          <rect x={936} y={1360} width={110} height={70} fill="#3A4790" />
          <path d="M991 1260 h15 q40 4 40 40 V1540 H991 Z" fill="rgba(5,7,26,0.28)" />
          <rect x={950} y={1300} width={14} height={200} rx={7} fill="rgba(255,255,255,0.14)" />
        </g>
      )}
  </svg>
);

export const academia: Lugar = {
  back: AcademiaBack,
  mid: AcademiaMid,
  front: AcademiaFront,
  depth: 170,
  gente: 'pouca',
  hora: 'dia',
  frontZones: { left: [-160, 1230, 240, 1630], right: [930, 1215, 1050, 1545] },
  janela: { x0: 262, x1: 798, y0: 312, y1: 440, dx: -300, dy: 660 },
};
