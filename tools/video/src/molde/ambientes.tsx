// Ambientes do molde: o lugar atrás da protagonista, em três camadas.
//
//   back  (depth 0.3)  parede, janela, céu, prédios — anda pouco com a câmera
//   mid   (depth 0.62) móveis, colegas, plateia, rua — o movimento ambiente
//   front (depth 1.35) folhas, quina de mesa, poste — desfocado, na beirada
//
// O desenho de back/mid é feito com o horizonte em y = 1000 ("coordenadas do
// cenário") e a cena só diz onde estão os pés da protagonista (`ground`): o
// ambiente se desloca pra que ela fique de pé no chão. O front é preso à tela
// (sempre nos cantos de baixo, acima da legenda). Regras de foco:
//  - o cenário é sempre mais escuro e menos saturado que a protagonista;
//  - ninguém do cenário entra na faixa `clear` (onde a protagonista está);
//  - um foco de luz (Spot) escurece o que está longe dela.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Relogio } from '../elenco/cast';
import {
  Arvore,
  Carro,
  Cortina,
  DeCostas,
  Estante,
  Figurante,
  Janela,
  Mural,
  Nuvem,
  Onibus,
  Pendente,
  Piso,
  Plateia,
  Poste,
  Posto,
  Predios,
  Projecao,
  Quadrinho,
  SET,
  SkyDefs,
} from '../elenco/cenario';
import { Caneca, Planta, Quadro } from '../elenco/objetos';
import { C } from '../theme';
import type { AmbienteKind, Gente, Hora } from './spec';

export type EnvGeo = {
  /** linha dos pés da protagonista (y no quadro) */
  ground: number;
  /** faixa x da protagonista (e do que ela segura): ninguém do cenário entra aqui */
  clear: [number, number];
  /** centro e raio do foco de luz na protagonista */
  spot: [number, number, number];
  /** a cena já desenha uma mesa (cena/mesa): o ambiente não põe outra */
  desk?: boolean;
  /** cantos do primeiro plano a esconder (a cena pôs uma peça ali embaixo) */
  frontOff?: ('left' | 'right')[];
};
export type AmbSpec = { tipo: AmbienteKind; gente?: Gente; hora?: Hora };

/** Quanto o horizonte (parede × chão) fica acima dos pés da protagonista. */
const DEPTH: Record<AmbienteKind, number> = { escritorio: 110, treinamento: 120, casa: 100, cidade: 240 };
const GENTE: Record<AmbienteKind, Gente> = { escritorio: 'pouca', treinamento: 'muita', casa: 'nenhuma', cidade: 'pouca' };
const HORA: Record<AmbienteKind, Hora> = { escritorio: 'dia', treinamento: 'dia', casa: 'manha', cidade: 'dia' };

export const horizonOf = (amb: AmbSpec, geo: EnvGeo) => geo.ground - DEPTH[amb.tipo];

type EnvP = { t: number; clear: [number, number]; gente: Gente; hora: Hora; accent: string; desk: boolean; noLeft: boolean; noRight: boolean };

/** x livre? (o intervalo [a,b] não encosta na faixa da protagonista) */
const free = (clear: [number, number], a: number, b: number) => b < clear[0] - 10 || a > clear[1] + 10;
const howMany = (g: Gente, pouca: number, muita: number) => (g === 'nenhuma' ? 0 : g === 'pouca' ? pouca : muita);

/** SVG do cenário em coordenadas do cenário (x -400..1480, y -600..2400). */
const ArtSvg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg style={{ position: 'absolute', left: -400, top: -600, overflow: 'visible' }} width={1880} height={3000} viewBox="-400 -600 1880 3000">
    {children}
  </svg>
);

/** Peça do elenco (svg próprio) num ponto do cenário: x = centro, y = base. */
const Prop: React.FC<{ x: number; y: number; w: number; h: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, w, h, children, style }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, ...style }}>{children}</div>
);

// ===================================================================== escritório
const EscritorioBack: React.FC<EnvP> = ({ t, hora }) => (
  <>
    <ArtSvg>
      <SkyDefs id={`esc-${hora}`} hora={hora} />
      <rect x={-400} y={-600} width={1880} height={1600} fill={`url(#esc-${hora}-wall)`} />
      <Estante x={-10} y={520} w={200} h={480} t={t} />
      <Janela id={`esc-${hora}`} x={260} y={320} w={580} h={420} t={t} hora={hora} />
      <Mural x={905} y={380} w={170} h={210} t={t} />
      <Piso id={`esc-${hora}`} y={1000} light={[260, 840]} />
      <Pendente x={150} y={250} floor={1000} t={t} />
      <Pendente x={930} y={270} floor={1000} t={t + 40} />
    </ArtSvg>
    <div style={{ position: 'absolute', left: 40, top: 310, opacity: 0.75 }}>
      <Relogio t={t} size={130} speed={0.4} accent={SET.frame} />
    </div>
    <Prop x={1000} y={1004} w={210} h={262}>
      <Planta t={t} size={262} accent={SET.frame} />
    </Prop>
  </>
);

const POSTOS = [130, 390, 690, 950];
const EscritorioMid: React.FC<EnvP> = ({ t, clear, gente }) => {
  const n = howMany(gente, 2, 4);
  const spots = POSTOS.filter((x) => free(clear, x - 150, x + 150)).slice(0, n);
  const walker = gente === 'muita';
  const wx = -200 + ((t * 2.2 + 300) % 1500);
  return (
    <>
      {spots.map((x, i) => (
        <Posto key={x} t={t} x={x} top={905} seed={i * 2 + 1} mug={i % 2 === 1} flip={x > 540} />
      ))}
      {walker ? <Figurante t={t} x={wx} y={1040} size={160} seed={4} arms="down" /> : null}
    </>
  );
};

const EscritorioFront: React.FC<EnvP> = ({ t, noLeft, noRight }) => (
  <>
    {noLeft ? null : (
      <Prop x={60} y={1520} w={340} h={430}>
        <Planta t={t} size={430} accent={SET.frame} />
      </Prop>
    )}
    {noRight ? null : (
      <>
        <svg style={{ position: 'absolute', left: 900, top: 1330 }} width={400} height={200} viewBox="0 0 400 200">
          <rect x={0} y={0} width={400} height={30} rx={12} fill={SET.furnTop} />
          <rect x={10} y={30} width={390} height={170} fill={SET.furn} />
        </svg>
        <Prop x={1000} y={1336} w={150} h={165}>
          <Caneca t={t} size={150} accent={SET.frame} />
        </Prop>
      </>
    )}
  </>
);

// ===================================================================== treinamento
const TreinamentoBack: React.FC<EnvP> = ({ t, accent }) => (
  <>
    <ArtSvg>
      <SkyDefs id="tre" hora="dia" />
      <rect x={-400} y={-600} width={1880} height={1600} fill="url(#tre-wall)" />
      <Projecao x={240} y={300} w={600} h={370} t={t} accent={accent} />
      <Quadrinho x={920} y={330} w={130} h={150} />
      <Piso id="tre" y={1000} light={[240, 840]} />
      {/* palco baixo de quem apresenta */}
      <rect x={-400} y={960} width={1880} height={40} fill={SET.furn} />
      <rect x={-400} y={958} width={1880} height={8} fill={SET.furnTop} />
    </ArtSvg>
    <Prop x={110} y={990} w={210} h={242} style={{ filter: 'saturate(0.5) brightness(0.75)' }}>
      <Quadro size={210} accent={accent} progress={1} />
    </Prop>
  </>
);

const TreinamentoMid: React.FC<EnvP> = ({ t, clear, gente }) => {
  const arms = Math.floor(t / 55) % 3 === 2 ? 'down' : 'out';
  const rowA = [60, 220, 380, 540, 700, 860, 1020].filter((x) => free(clear, x - 70, x + 70));
  const rowB = [140, 310, 770, 940].filter((x) => free(clear, x - 85, x + 85));
  const showB = gente === 'muita';
  const a = gente === 'nenhuma' ? [] : gente === 'pouca' ? rowA.filter((_, i) => i % 2 === 0) : rowA;
  const presenterFree = free(clear, 860, 1040);
  return (
    <>
      {presenterFree ? <Figurante t={t} x={950} y={975} size={200} seed={5} arms={arms} mood="feliz" dim="saturate(0.55) brightness(0.88)" flip accent={SET.frame} /> : null}
      <Plateia t={t} xs={a} y={1085} size={150} seed={1} />
      {showB ? <Plateia t={t} xs={rowB} y={1190} size={180} seed={4} /> : null}
    </>
  );
};

const TreinamentoFront: React.FC<EnvP> = ({ t, noLeft, noRight }) => (
  <>
    {noLeft ? null : <DeCostas t={t} x={40} y={1600} size={320} seed={2} dim="saturate(0.35) brightness(0.6) blur(4px)" sway={0.5} />}
    {noRight ? null : <DeCostas t={t} x={1050} y={1620} size={330} seed={3} dim="saturate(0.35) brightness(0.6) blur(4px)" sway={0.5} />}
  </>
);

// ===================================================================== casa
const CasaBack: React.FC<EnvP> = ({ t, hora }) => (
  <ArtSvg>
    <SkyDefs id={`cas-${hora}`} hora={hora} />
    <rect x={-400} y={-600} width={1880} height={1600} fill={`url(#cas-${hora}-warm)`} />
    <Quadrinho x={110} y={380} w={210} h={160} />
    <Janela id={`cas-${hora}`} x={590} y={330} w={340} h={420} t={t} hora={hora} panes={2} />
    <Cortina x={530} y={300} w={90} h={500} t={t} />
    <Cortina x={900} y={300} w={90} h={500} t={t} flip />
    <Estante x={40} y={690} w={330} h={310} t={t} />
    <Piso id={`cas-${hora}`} y={1000} light={[590, 930]} warm={hora === 'manha'} />
    <ellipse cx={540} cy={1120} rx={560} ry={70} fill="#2A2768" opacity={0.55} />
  </ArtSvg>
);

/** Abajur de mesa com cone de luz quente (cena/mesa em casa também usa). */
export const Abajur: React.FC<{ t: number; size: number }> = ({ t, size }) => {
  const flick = 0.85 + 0.15 * Math.sin(t / 23);
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`abj-${Math.round(size)}`} cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor={C.gold2} stopOpacity={0.45 * flick} />
          <stop offset="1" stopColor={C.gold2} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d="M128 92 L40 218 H230 Z" fill={`url(#abj-${Math.round(size)})`} />
      <ellipse cx={70} cy={214} rx={50} ry={6} fill="rgba(0,0,0,0.25)" />
      <rect x={30} y={200} width={80} height={14} rx={7} fill={SET.frame} />
      <rect x={64} y={110} width={12} height={96} rx={6} fill={SET.frame} transform="rotate(-14 70 200)" />
      <rect x={70} y={60} width={12} height={80} rx={6} fill={SET.frame} transform="rotate(38 76 120)" />
      <path d="M96 52 l64 30 q8 4 2 12 l-20 22 q-6 6 -12 0 l-48 -48 q-4 -10 14 -16z" fill={C.goldDeep} opacity={0.85} />
      <ellipse cx={142} cy={104} rx={18} ry={8} fill={C.gold2} opacity={0.9 * flick} transform="rotate(42 142 104)" />
    </svg>
  );
};

const CasaMid: React.FC<EnvP> = ({ t, clear, gente, desk }) => {
  // mesinha com abajur, caneca e planta, do lado livre; luminária de chão do outro
  const right = free(clear, 740, 1060);
  const left = free(clear, 20, 340);
  const deskX = right ? 900 : left ? 180 : null;
  const people = howMany(gente, 1, 2);
  const spots = [760, 320].filter((x) => free(clear, x - 90, x + 90)).slice(0, people);
  return (
    <>
      {spots.map((x, i) => (
        <Figurante key={x} t={t} x={x} y={1030} size={180} seed={i ? 2 : 5} arms="down" />
      ))}
      {!desk && deskX !== null ? (
        <>
          <svg style={{ position: 'absolute', left: deskX - 160, top: 930 }} width={320} height={110} viewBox="0 0 320 110">
            <rect x={0} y={0} width={320} height={18} rx={8} fill={SET.furnTop} />
            <rect x={12} y={18} width={296} height={50} rx={6} fill={SET.furn} />
            <rect x={160} y={18} width={148} height={50} rx={6} fill="rgba(5,7,26,0.22)" />
            <rect x={20} y={68} width={14} height={40} rx={5} fill={SET.furnDark} />
            <rect x={286} y={68} width={14} height={40} rx={5} fill={SET.furnDark} />
          </svg>
          <Prop x={deskX - 80} y={934} w={160} h={176}>
            <Abajur t={t} size={160} />
          </Prop>
          <Prop x={deskX + 60} y={934} w={110} h={121}>
            <Caneca t={t} size={110} accent={C.surface3} />
          </Prop>
          <Prop x={deskX + 130} y={934} w={96} h={120}>
            <Planta t={t} size={120} accent={SET.frame} />
          </Prop>
        </>
      ) : null}
    </>
  );
};

const CasaFront: React.FC<EnvP> = ({ t, noLeft, noRight }) => (
  <>
    {noLeft ? null : (
      <Prop x={50} y={1530} w={350} h={440}>
        <Planta t={t} size={440} accent={SET.frame} />
      </Prop>
    )}
    {noRight ? null : (
      <svg style={{ position: 'absolute', left: 880, top: 1250 }} width={260} height={260} viewBox="0 0 260 260">
        <rect x={30} y={0} width={240} height={120} rx={50} fill="#3A3580" />
        <rect x={130} y={0} width={140} height={120} rx={50} fill="rgba(5,7,26,0.3)" />
        <rect x={0} y={80} width={260} height={180} rx={40} fill="#34307A" />
      </svg>
    )}
  </>
);

// ===================================================================== cidade
const CidadeBack: React.FC<EnvP> = ({ t, hora }) => (
  <ArtSvg>
    <SkyDefs id={`cid-${hora}`} hora={hora} />
    <rect x={-400} y={-600} width={1880} height={1620} fill={`url(#cid-${hora}-sky)`} />
    {hora === 'noite' ? (
      <circle cx={820} cy={330} r={46} fill={C.text} opacity={0.85} />
    ) : (
      <>
        <circle cx={hora === 'manha' ? 260 : 820} cy={hora === 'manha' ? 760 : 320} r={220} fill={`url(#cid-${hora}-sun)`} />
        <circle cx={hora === 'manha' ? 260 : 820} cy={hora === 'manha' ? 760 : 320} r={44} fill={C.gold2} opacity={0.9} />
      </>
    )}
    {[0, 1, 2, 3].map((i) => {
      const span = 2200;
      const x = -500 + ((i * span) / 4 + t * (0.4 + i * 0.12)) % span;
      return <Nuvem key={i} x={x} y={260 + i * 70} w={260 - i * 30} opacity={hora === 'noite' ? 0.05 : 0.13} />;
    })}
    <Predios x={-420} base={990} w={1920} t={t} tone={1} seed={5} tall={1.6} />
    <Predios x={-380} base={990} w={1880} t={t} tone={2} seed={11} tall={1.05} />
    {/* calçada do fundo, rua, calçada da frente */}
    <rect x={-400} y={975} width={1880} height={25} fill={SET.walk} />
    <rect x={-400} y={1000} width={1880} height={140} fill={SET.asphalt} />
    {Array.from({ length: 14 }, (_, i) => (
      <rect key={i} x={-400 + i * 140} y={1066} width={70} height={8} rx={4} fill={C.faint} opacity={0.45} />
    ))}
    <rect x={-400} y={1140} width={1880} height={1300} fill={SET.walk} />
    <rect x={-400} y={1136} width={1880} height={12} fill={SET.curb} />
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x={-400 + i * 170} y={1148} width={6} height={1300} fill="rgba(5,7,26,0.18)" />
    ))}
  </ArtSvg>
);

const CidadeMid: React.FC<EnvP> = ({ t, gente, accent }) => {
  const n = howMany(gente, 2, 4);
  const walkers = [0, 1, 2, 3].slice(0, n);
  const bus = -800 + ((t * 7 + 600) % 2600);
  const car = 1500 - ((t * 9 + 300) % 2400);
  return (
    <>
      <ArtSvg>
        <SkyDefs id="cidm" hora="dia" />
        <Arvore x={120} base={985} size={320} t={t} seed={1} />
        <Arvore x={990} base={985} size={300} t={t} seed={2} />
        <Poste id="cidm" x={700} base={985} h={400} />
      </ArtSvg>
      {walkers.map((i) => {
        const dir = i % 2 ? -1 : 1;
        const span = 1700;
        const raw = (t * (1.3 + i * 0.25) + i * 430) % span;
        const x = dir > 0 ? -250 + raw : 1450 - raw;
        return <Figurante key={i} t={t * 1.6} x={x} y={990} size={130} seed={i + 1} arms="down" />;
      })}
      <ArtSvg>
        <g transform={`translate(${car} 0) scale(-1 1)`}>
          <Carro x={0} base={1058} w={250} t={t} accent={C.violet2} />
        </g>
        <Onibus x={bus} base={1128} w={470} t={t} accent={accent} />
      </ArtSvg>
    </>
  );
};

const CidadeFront: React.FC<EnvP> = ({ noLeft, noRight }) => (
  <svg style={{ position: 'absolute', left: 0, top: 0 }} width={1080} height={1920} viewBox="0 0 1080 1920">
    {noRight ? null : <rect x={1010} y={200} width={34} height={1400} rx={17} fill={SET.frame} />}
    {noRight ? null : <rect x={1027} y={200} width={17} height={1400} rx={8} fill="rgba(5,7,26,0.3)" />}
    {(noLeft ? [] : [
      [-20, 1330, 120],
      [90, 1380, 110],
      [200, 1420, 90],
    ]).map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill={i === 1 ? SET.leaf : SET.leafDark} opacity={0.9} />
    ))}
  </svg>
);

// ===================================================================== montagem

const ENVS: Record<AmbienteKind, { back: React.FC<EnvP>; mid: React.FC<EnvP>; front: React.FC<EnvP> }> = {
  escritorio: { back: EscritorioBack, mid: EscritorioMid, front: EscritorioFront },
  treinamento: { back: TreinamentoBack, mid: TreinamentoMid, front: TreinamentoFront },
  casa: { back: CasaBack, mid: CasaMid, front: CasaFront },
  cidade: { back: CidadeBack, mid: CidadeMid, front: CidadeFront },
};

const FILTER = { back: 'blur(1.2px)', mid: 'blur(0.4px)', front: 'blur(5px) brightness(0.62) saturate(0.75)' } as const;

/** Uma camada do ambiente. back/mid descem pro horizonte da cena; front fica preso à tela. */
export const Ambiente: React.FC<{ amb: AmbSpec; geo: EnvGeo; part: 'back' | 'mid' | 'front'; t: number; accent: string }> = ({ amb, geo, part, t, accent }) => {
  const env = ENVS[amb.tipo];
  const Part = env[part];
  const p: EnvP = { t, clear: geo.clear, gente: amb.gente ?? GENTE[amb.tipo], hora: amb.hora ?? HORA[amb.tipo], accent, desk: !!geo.desk, noLeft: !!geo.frontOff?.includes('left'), noRight: !!geo.frontOff?.includes('right') };
  const shift = part === 'front' ? 0 : horizonOf(amb, geo) - 1000;
  return (
    <AbsoluteFill style={{ filter: FILTER[part] }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: shift ? `translateY(${shift}px)` : undefined }}>
        <Part {...p} />
      </div>
    </AbsoluteFill>
  );
};

/** Foco de luz na protagonista: um halo da cor da cena atrás dela e o resto um pouco mais escuro. */
export const Spot: React.FC<{ geo: EnvGeo; accent: string }> = ({ geo, accent }) => {
  const [x, y, r] = geo.spot;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle ${r * 0.75}px at ${x}px ${y}px, ${accent}3A 0%, ${accent}00 100%), radial-gradient(circle ${r * 1.6}px at ${x}px ${y}px, rgba(8,11,32,0) 0%, rgba(8,11,32,0) 45%, rgba(8,11,32,0.42) 100%)`,
      }}
    />
  );
};

/** Moldura fixa: topo escuro (sobrancelha legível) e base que funde no fundo (legenda legível). */
export const Vinheta: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'linear-gradient(180deg, rgba(10,14,38,0.97) 0px, rgba(10,14,38,0.8) 170px, rgba(10,14,38,0) 380px, rgba(10,14,38,0) 1270px, rgba(10,14,38,0.82) 1410px, #0A0E26 1480px), linear-gradient(90deg, rgba(10,14,38,0.35) 0px, rgba(10,14,38,0) 140px, rgba(10,14,38,0) 940px, rgba(10,14,38,0.35) 1080px)',
    }}
  />
);

/**
 * Miniatura do ambiente pra dentro de um painel do `comparar` (só back + mid,
 * escalados). `horizon` = y do horizonte dentro do painel; `cx` = x do painel
 * onde cai o centro do cenário. Gente só na sala de aula (é o que diz "aula").
 */
export const AmbienteMini: React.FC<{ tipo: AmbienteKind; hora?: Hora; t: number; accent: string; horizon: number; cx: number; scale: number }> = ({
  tipo,
  hora,
  t,
  accent,
  horizon,
  cx,
  scale,
}) => {
  const amb: AmbSpec = { tipo, hora, gente: tipo === 'treinamento' ? 'pouca' : 'nenhuma' };
  // a protagonista do painel fica à esquerda; o cenário só esvazia o centro
  const geo: EnvGeo = { ground: 1000 + DEPTH[tipo], clear: [300, 560], spot: [540, 860, 360] };
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: cx - 540 * scale, top: horizon - 1000 * scale, width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <Ambiente amb={amb} geo={geo} part="back" t={t} accent={accent} />
        <Ambiente amb={amb} geo={geo} part="mid" t={t} accent={accent} />
      </div>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(14,18,48,0.15) 0%, rgba(14,18,48,0) 30%, rgba(14,18,48,0.55) 62%, rgba(14,18,48,0.96) 76%)' }} />
    </AbsoluteFill>
  );
};
