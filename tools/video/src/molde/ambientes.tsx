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
//  - nada do cenário fica EMBAIXO do que a cena desenha (`busy`: peças, balão,
//    a folha do dia): o colega e o posto dele (mesa, monitor) andam juntos pra
//    beirada ou saem juntos, móvel do meio e canto do primeiro plano saem dali,
//    e o enfeite do fundo (relógio, quadro, mural, planta, o vaso da estante)
//    se afasta pela mesma parede ou sai;
//  - o cenário não repete a peça da fala (`show`): se a cena mostra o
//    quadro, a sala de aula fica sem o cavalete dela;
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
  estanteVaso,
  postoPartes,
} from '../elenco/cenario';
import { Caneca, Planta, Quadro } from '../elenco/objetos';
import { C } from '../theme';
import type { AmbienteKind, Gente, Hora } from './spec';
import { filtroCamada, useVisual } from './visual';

/** Retângulo [x0, y0, x1, y1]. */
export type Rect = [number, number, number, number];

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
  /** o que a cena desenha por cima do cenário (peças, balão, a folha do dia), em coordenadas do quadro */
  busy?: Rect[];
  /** peças que a cena mostra (nomes do elenco): o cenário não repete a dele */
  show?: (string | undefined)[];
  /** treinamento: a protagonista senta na plateia (x = centro, y = linha dos pés da fileira, size = o tamanho dela) */
  seat?: { x: number; y: number; size: number };
  /** o pedaço do quadro que aparece (a miniatura do comparar mostra só o painel) */
  view?: Rect;
  /**
   * fase 3 (rodada 2): o chão que anda — ela corre no lugar (ou vindo pra câmera) e a câmera vai junto.
   * `v` = quanto a corrida vale agora (0..1), `d` = quadros-de-corrida acumulados (src/elenco/acao.tsx →
   * corridaDe). Cada lugar converte `d` na própria velocidade (o parque: as raias descem; a academia:
   * as juntas do piso). Sem `anda`, o chão parado de sempre.
   */
  anda?: Anda;
};
export type Anda = { v: number; d: number };
export type AmbSpec = { tipo: AmbienteKind; gente?: Gente; hora?: Hora };

/** Os 4 lugares que moram neste arquivo; os da fase 3 vêm do registro (`registerLugares`). */
type Antigo = 'escritorio' | 'treinamento' | 'casa' | 'cidade';
/** Quanto o horizonte (parede × chão) fica acima dos pés da protagonista. */
const DEPTH: Record<Antigo, number> = { escritorio: 110, treinamento: 120, casa: 100, cidade: 240 };
const GENTE: Record<Antigo, Gente> = { escritorio: 'pouca', treinamento: 'muita', casa: 'nenhuma', cidade: 'pouca' };
const HORA: Record<Antigo, Hora> = { escritorio: 'dia', treinamento: 'dia', casa: 'manha', cidade: 'dia' };
const antigo = (t: AmbienteKind): t is Antigo => t in DEPTH;

// ===================================================================== registro (fase 3)
/**
 * Um lugar da fase 3 (src/molde/lugares/<lugar>.tsx). Mesmo contrato dos 4 de cima: back/mid em
 * coordenadas do cenário (horizonte em y = 1000), front preso à tela. Os lugares importam DAQUI
 * (EnvP, free, hits, decor, ArtSvg…) e este arquivo NUNCA importa um lugar: quem junta os dois é o
 * scenes.tsx (`registerLugares(LUGARES)` no topo do módulo). Sem ciclo de import.
 */
export type Lugar = {
  back: React.FC<EnvP>;
  mid: React.FC<EnvP>;
  front: React.FC<EnvP>;
  /** quanto o horizonte fica acima dos pés da protagonista */
  depth: number;
  /** gente e hora quando o roteiro não diz */
  gente: Gente;
  hora: Hora;
  /** onde cada canto do primeiro plano desenha (coordenadas do quadro): com peça ali, o canto sai */
  frontZones: { left: Rect; right: Rect };
  /**
   * a janela (coordenadas do cenário): de onde vem a Luz; dx/dy = pra onde o facho cai até o chão;
   * `fria` = o facho é claro e frio em qualquer hora (o banheiro), sem o dourado da manhã
   */
  janela?: { x0: number; x1: number; y0: number; y1: number; dx: number; dy: number; fria?: boolean };
  /** o móvel que vira a mesa da `cena` com setting mesa (o balcão da cozinha, a pia do banheiro) */
  Balcao?: React.FC<{ t: number; accent: string; part: 'tampo' | 'frente'; x: number; w: number; top: number }>;
};
const REGISTRO: Partial<Record<AmbienteKind, Lugar>> = {};
/** Junta os lugares da fase 3 aos 4 de sempre (chamado uma vez, no topo do scenes.tsx). */
export function registerLugares(m: Partial<Record<AmbienteKind, Lugar>>) {
  Object.assign(REGISTRO, m);
}
/** O lugar registrado (fase 3), ou undefined pros 4 de sempre. */
export const lugarOf = (t: AmbienteKind): Lugar | undefined => (antigo(t) ? undefined : REGISTRO[t]);
const lugar = (t: AmbienteKind): Lugar => {
  const l = REGISTRO[t];
  if (!l) throw new Error(`ambiente "${t}" sem lugar registrado (src/molde/lugares/index.ts → LUGARES)`);
  return l;
};
const depthOf = (t: AmbienteKind) => (antigo(t) ? DEPTH[t] : lugar(t).depth);
const genteOf = (t: AmbienteKind) => (antigo(t) ? GENTE[t] : lugar(t).gente);
const horaOf = (t: AmbienteKind) => (antigo(t) ? HORA[t] : lugar(t).hora);

export const horizonOf = (amb: AmbSpec, geo: EnvGeo) => geo.ground - depthOf(amb.tipo);
/** Quanto o cenário desce (ou sobe) pra que a protagonista pise no chão dele. */
const shiftOf = (amb: AmbSpec, geo: EnvGeo) => horizonOf(amb, geo) - 1000;

export type EnvP = {
  t: number;
  clear: [number, number];
  gente: Gente;
  hora: Hora;
  accent: string;
  desk: boolean;
  noLeft: boolean;
  noRight: boolean;
  /** `busy`, `seat` e `view` já em coordenadas do cenário */
  busy: Rect[];
  show: string[];
  seat?: { x: number; y: number; size: number };
  view: Rect;
  /** fase 3: o chão que anda (EnvGeo.anda); undefined = parado */
  anda?: Anda;
};

/** x livre? (o intervalo [a,b] não encosta na faixa da protagonista) */
export const free = (clear: [number, number], a: number, b: number) => b < clear[0] - 10 || a > clear[1] + 10;
export const howMany = (g: Gente, pouca: number, muita: number) => (g === 'nenhuma' ? 0 : g === 'pouca' ? pouca : muita);
/** `r` encosta em algum retângulo de `busy`? */
export const hits = (busy: Rect[], r: Rect) => busy.some(([a, b, c, d]) => r[0] < c && r[2] > a && r[1] < d && r[3] > b);
/** `r` cabe inteiro no que aparece? */
export const inside = (view: Rect, r: Rect) => r[0] >= view[0] && r[2] <= view[2] && r[1] >= view[1] && r[3] <= view[3];
/** Rosto (cabeça + cabelo) de uma pessoa da caixa 200×260 com o topo em `top`. */
export const faceRect = (x: number, top: number, size: number): Rect => [x - 0.34 * size, top + 0.12 * size, x + 0.34 * size, top + 0.8 * size];
/** Rosto de um figurante de pé (`y` = linha dos pés, como em Figurante/DeCostas). */
export const faceAt = (x: number, y: number, size: number) => faceRect(x, y - size * 1.26, size);

/**
 * Enfeite do fundo (relógio, quadro, mural, planta, vaso da estante) com a
 * mesma regra do meio: fica onde está se nada da cena cai em cima dele (com
 * 10 px de folga); senão tenta os outros lugares da mesma parede (`dxs`, sem
 * sair do quadro) e, sem lugar livre, sai. Quadro meio coberto atrás de peça
 * é ruído. Devolve o deslocamento em x, ou null (sai).
 */
export const decor = (p: Pick<EnvP, 'busy' | 'view'>, r: Rect, dxs: number[] = [0]): number | null => {
  for (const dx of dxs) {
    const inFrame = dx === 0 || (r[0] + dx >= p.view[0] + 10 && r[2] + dx <= p.view[2] - 10);
    if (inFrame && !hits(p.busy, [r[0] + dx - 10, r[1] - 10, r[2] + dx + 10, r[3] + 10])) return dx;
  }
  return null;
};

/** SVG do cenário em coordenadas do cenário (x -400..1480, y -600..2400). */
export const ArtSvg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg style={{ position: 'absolute', left: -400, top: -600, overflow: 'visible', ...style }} width={1880} height={3000} viewBox="-400 -600 1880 3000">
    {children}
  </svg>
);

/** Peça do elenco (svg próprio) num ponto do cenário: x = centro, y = base. */
export const Prop: React.FC<{ x: number; y: number; w: number; h: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, w, h, children, style }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, ...style }}>{children}</div>
);

// ===================================================================== escritório
/** Onde mora cada coisa do fundo do escritório (coordenadas do cenário). */
const ESC = {
  estante: { x: -10, y: 520, w: 200, h: 480 },
  relogio: [40, 310, 170, 440] as Rect,
  mural: [905, 380, 1075, 590] as Rect,
  /** a planta de chão no canto direito, atrás da ponta da mesa */
  planta: [895, 742, 1105, 1004] as Rect,
};
const EscritorioBack: React.FC<EnvP> = (p) => {
  const { t, hora, show } = p;
  const e = ESC.estante;
  // relógio, mural e planta seguem a regra do meio: com peça em cima, andam pela parede ou saem
  const clock = show.includes('relogio') ? null : decor(p, ESC.relogio, [0, 60, -30]);
  const mural = decor(p, ESC.mural, [0, -40]);
  const plant = show.includes('planta') ? null : decor(p, ESC.planta);
  return (
    <>
      <ArtSvg>
        <SkyDefs id={`esc-${hora}`} hora={hora} />
        <rect x={-400} y={-600} width={1880} height={1600} fill={`url(#esc-${hora}-wall)`} />
        <Estante x={e.x} y={e.y} w={e.w} h={e.h} t={t} vase={decor(p, estanteVaso(e.x, e.y, e.h)) !== null} />
        <Janela id={`esc-${hora}`} x={260} y={320} w={580} h={420} t={t} hora={hora} />
        {mural === null ? null : <Mural x={ESC.mural[0] + mural} y={ESC.mural[1]} w={170} h={210} t={t} />}
        <Piso id={`esc-${hora}`} y={1000} light={[260, 840]} />
        <Pendente x={150} y={250} floor={1000} t={t} />
        <Pendente x={930} y={270} floor={1000} t={t + 40} />
      </ArtSvg>
      {clock === null ? null : (
        <div style={{ position: 'absolute', left: ESC.relogio[0] + clock, top: ESC.relogio[1], opacity: 0.75 }}>
          <Relogio t={t} size={130} speed={0.4} accent={SET.frame} />
        </div>
      )}
      {plant === null ? null : (
        <Prop x={1000} y={1004} w={210} h={262}>
          <Planta t={t} size={262} accent={SET.frame} />
        </Prop>
      )}
    </>
  );
};

/**
 * Postos dos colegas. Os da beirada são o mais longe que o colega vai com a
 * cabeça inteira no quadro (≥ 20 px da borda) e só entram quando uma peça da
 * cena cai em cima de um dos de sempre.
 */
const POSTOS = [130, 390, 690, 950];
const POSTOS_BEIRA = [80, 1000];
const POSTO = { top: 905, size: 170 };
const EscritorioMid: React.FC<EnvP> = ({ t, clear, gente, busy, view }) => {
  // o posto inteiro: rosto, corpo, monitor e mesa (o monitor fica do lado de fora: à direita
  // na metade esquerda, à esquerda na direita)
  const parts = (x: number) => postoPartes(x, POSTO.top, POSTO.size, x > 540);
  const clean = (x: number) => !parts(x).some((r) => hits(busy, r));
  const headIn = (x: number) => {
    const [a, , b] = parts(x)[0];
    return a >= view[0] + 20 && b <= view[2] - 20;
  };
  // quantos colegas: os postos de sempre que a protagonista deixa livres
  const room = POSTOS.filter((x) => free(clear, x - 150, x + 150)).slice(0, howMany(gente, 2, 4));
  // colega e posto andam JUNTOS: com qualquer pedaço do posto embaixo de peça, os dois vão pra
  // beirada do mesmo lado; se lá a cabeça cortaria na borda ou ainda sobraria mesa/monitor
  // embaixo de peça, os dois saem — nunca fica posto espremido entre a borda e a peça
  const spots = room
    .map((x) => (clean(x) ? x : (POSTOS_BEIRA.find((b) => (b < 540) === (x < 540) && free(clear, b - 150, b + 150) && clean(b) && headIn(b)) ?? null)))
    .filter((x, i, all): x is number => x !== null && all.indexOf(x) === i);
  const walker = gente === 'muita';
  const wx = -200 + ((t * 2.2 + 300) % 1500);
  return (
    <>
      {spots.map((x, i) => (
        <Posto key={x} t={t} x={x} top={POSTO.top} size={POSTO.size} seed={i * 2 + 1} mug={i % 2 === 1} flip={x > 540} />
      ))}
      {walker ? <Figurante t={t} x={wx} y={1040} size={160} seed={4} arms="down" /> : null}
    </>
  );
};

const EscritorioFront: React.FC<EnvP> = ({ t, noLeft, noRight, show }) => (
  <>
    {noLeft || show.includes('planta') ? null : (
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
        {show.includes('caneca') ? null : (
          <Prop x={1000} y={1336} w={150} h={165}>
            <Caneca t={t} size={150} accent={SET.frame} />
          </Prop>
        )}
      </>
    )}
  </>
);

// ===================================================================== treinamento
/** A tela de projeção: baixa o bastante pra quem apresenta, de pé no palco, alcançar o slide com a vareta. */
const TELA = { x: 200, y: 450, w: 600, h: 370 };
/** Palco baixo: tampo e frente. */
const PALCO = { top: 940 };

const TRE_QUADRINHO: Rect = [900, 300, 1030, 450];
const TRE_CAVALETE: Rect = [0, PALCO.top + 30 - 230, 200, PALCO.top + 30];
const TreinamentoBack: React.FC<EnvP> = (p) => {
  const { t, accent, show } = p;
  const pic = decor(p, TRE_QUADRINHO, [0, -60]);
  // o cavalete da sala sai quando a cena mostra o quadro (o balão, a mão): o lugar não repete a
  // peça — e sai também quando uma peça cai em cima dele
  const easel = show.includes('quadro') ? null : decor(p, TRE_CAVALETE);
  return (
    <>
      <ArtSvg>
        <SkyDefs id="tre" hora="dia" />
        <rect x={-400} y={-600} width={1880} height={1600} fill="url(#tre-wall)" />
        <Projecao x={TELA.x} y={TELA.y} w={TELA.w} h={TELA.h} t={t} accent={accent} />
        {pic === null ? null : <Quadrinho x={TRE_QUADRINHO[0] + pic} y={TRE_QUADRINHO[1]} w={130} h={150} />}
        <Piso id="tre" y={1000} light={[TELA.x, TELA.x + TELA.w]} />
        {/* palco baixo de quem apresenta */}
        <rect x={-400} y={PALCO.top} width={1880} height={1000 - PALCO.top} fill={SET.furn} />
        <rect x={-400} y={PALCO.top - 2} width={1880} height={8} fill={SET.furnTop} />
      </ArtSvg>
      {easel === null ? null : (
        <Prop x={100} y={PALCO.top + 30} w={200} h={230} style={{ filter: 'saturate(0.5) brightness(0.75)' }}>
          <Quadro size={200} accent={accent} progress={1} />
        </Prop>
      )}
    </>
  );
};

/**
 * Quem apresenta: de pé no palco, à direita da tela, com o braço estendido e
 * uma vareta que encosta no gráfico do slide (a ponta passeia devagar). Se a
 * cena pôs peça no rosto ou na mão dele, ou a protagonista ocupa o lugar, a
 * sala fica sem ele (a tela, a turma e o cavalete já dizem "aula").
 */
const PRES = { x: 930, size: 230, feet: PALCO.top + 15 };
const Apresentador: React.FC<EnvP> = ({ t, clear, busy, view, accent }) => {
  const { x, size: s } = PRES;
  const top = PRES.feet - s * 1.26;
  // a mão (virada pra esquerda) fica em ≈ (x − s/2, pés − 0,41 s)
  const hx = x - s * 0.5;
  const hy = PRES.feet - s * 0.41;
  const hand: Rect = [hx - 0.04 * s, hy - 0.06 * s, hx + 0.08 * s, hy + 0.06 * s];
  const fits = free(clear, x - s * 0.3, x + s * 0.3) && !hits(busy, faceRect(x, top, s)) && !hits(busy, hand) && inside(view, [x - s / 2, top, x + s / 2, PRES.feet]);
  if (!fits) return null;
  const tx = TELA.x + TELA.w * 0.86 + Math.sin(t / 37) * 14;
  const ty = TELA.y + TELA.h * 0.64 + Math.sin(t / 23) * 16;
  const dim = 'saturate(0.55) brightness(0.88)';
  return (
    <>
      <ArtSvg style={{ filter: dim }}>
        <line x1={hx} y1={hy} x2={tx} y2={ty} stroke={C.mid} strokeWidth={7} strokeLinecap="round" />
        <circle cx={tx} cy={ty} r={8} fill={accent} />
      </ArtSvg>
      <Figurante t={t} x={x} y={PRES.feet} size={s} seed={5} arms="out" mood="feliz" dim={dim} flip accent={SET.frame} />
    </>
  );
};

const ROW_A = { xs: [60, 220, 380, 540, 700, 860, 1020], y: 1085, size: 150 };
const ROW_B = { xs: [140, 310, 770, 940], y: 1190, size: 180 };

const TreinamentoMid: React.FC<EnvP> = (p) => {
  const { t, clear, gente, busy, seat } = p;
  // fileira = cadeiras na faixa livre, sem cabeça embaixo de peça da cena
  const row = (xs: number[], y: number, size: number) =>
    xs.filter((x) => free(clear, x - size * 0.4, x + size * 0.4) && !hits(busy, faceAt(x, y, size)) && x > p.view[0] - 60 && x < p.view[2] + 60);
  const a = gente === 'nenhuma' ? [] : row(gente === 'pouca' ? ROW_A.xs.filter((_, i) => i % 2 === 0) : ROW_A.xs, ROW_A.y, ROW_A.size);
  // sentada na plateia: a fileira dela se arruma em volta (vizinhos dos dois lados, mesma linha)
  const mine = seat
    ? (() => {
        const size = Math.round(seat.size * 0.86);
        const step = seat.size * 0.74;
        const ks = gente === 'nenhuma' ? [] : gente === 'pouca' ? [-1, 1] : [-3, -2, -1, 1, 2, 3];
        return { xs: row(ks.map((k) => seat.x + k * step), seat.y, size), size };
      })()
    : null;
  const b = !seat && gente === 'muita' ? row(ROW_B.xs, ROW_B.y, ROW_B.size) : [];
  return (
    <>
      <Apresentador {...p} />
      <Plateia t={t} xs={a} y={ROW_A.y} size={ROW_A.size} seed={1} />
      {mine ? <Plateia t={t} xs={mine.xs} y={seat!.y} size={mine.size} seed={4} /> : null}
      {b.length ? <Plateia t={t} xs={b} y={ROW_B.y} size={ROW_B.size} seed={4} /> : null}
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
/** O quadro da parede da casa e a estante embaixo dele (coordenadas do cenário). */
const CASA = { quadro: [110, 380, 320, 540] as Rect, estante: { x: 40, y: 690, w: 330, h: 310 } };
const CasaBack: React.FC<EnvP> = (p) => {
  const { t, hora } = p;
  const e = CASA.estante;
  // o quadro segue a regra do meio: com peça em cima, anda pela parede (até a cortina) ou sai
  const pic = decor(p, CASA.quadro, [0, -90, 170]);
  return (
    <ArtSvg>
      <SkyDefs id={`cas-${hora}`} hora={hora} />
      <rect x={-400} y={-600} width={1880} height={1600} fill={`url(#cas-${hora}-warm)`} />
      {pic === null ? null : <Quadrinho x={CASA.quadro[0] + pic} y={CASA.quadro[1]} w={210} h={160} />}
      <Janela id={`cas-${hora}`} x={590} y={330} w={340} h={420} t={t} hora={hora} panes={2} />
      <Cortina x={530} y={300} w={90} h={500} t={t} />
      <Cortina x={900} y={300} w={90} h={500} t={t} flip />
      <Estante x={e.x} y={e.y} w={e.w} h={e.h} t={t} vase={decor(p, estanteVaso(e.x, e.y, e.h)) !== null} />
      <Piso id={`cas-${hora}`} y={1000} light={[590, 930]} warm={hora === 'manha'} />
      <ellipse cx={540} cy={1120} rx={560} ry={70} fill="#2A2768" opacity={0.55} />
    </ArtSvg>
  );
};

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

/** O que a mesinha da casa desenha (tampo, abajur, caneca e planta), centrada em x. */
const mesinhaRect = (x: number): Rect => [x - 140, 934 - 176, x + 180, 1040];
const CasaMid: React.FC<EnvP> = ({ t, clear, gente, desk, busy, show }) => {
  // mesinha com abajur, caneca e planta, do lado livre (e fora do que a cena desenha)
  const right = free(clear, 740, 1060) && !hits(busy, mesinhaRect(900));
  const left = free(clear, 20, 340) && !hits(busy, mesinhaRect(180));
  const deskX = right ? 900 : left ? 180 : null;
  const people = howMany(gente, 1, 2);
  const spots = [760, 320].filter((x) => free(clear, x - 90, x + 90) && !hits(busy, faceAt(x, 1030, 180))).slice(0, people);
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
          {show.includes('caneca') ? null : (
            <Prop x={deskX + 60} y={934} w={110} h={121}>
              <Caneca t={t} size={110} accent={C.surface3} />
            </Prop>
          )}
          {show.includes('planta') ? null : (
            <Prop x={deskX + 130} y={934} w={96} h={120}>
              <Planta t={t} size={120} accent={SET.frame} />
            </Prop>
          )}
        </>
      ) : null}
    </>
  );
};

const CasaFront: React.FC<EnvP> = ({ t, noLeft, noRight, show }) => (
  <>
    {noLeft || show.includes('planta') ? null : (
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

const CidadeMid: React.FC<EnvP> = ({ t, gente, accent, hora }) => {
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
        {/* poste aceso só de noite: aceso de dia lia "noite" (revisão dos quadros da Paker) */}
        <Poste id="cidm" x={700} base={985} h={400} on={hora === 'noite' ? 1 : 0} />
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

const ENVS: Record<Antigo, { back: React.FC<EnvP>; mid: React.FC<EnvP>; front: React.FC<EnvP> }> = {
  escritorio: { back: EscritorioBack, mid: EscritorioMid, front: EscritorioFront },
  treinamento: { back: TreinamentoBack, mid: TreinamentoMid, front: TreinamentoFront },
  casa: { back: CasaBack, mid: CasaMid, front: CasaFront },
  cidade: { back: CidadeBack, mid: CidadeMid, front: CidadeFront },
};

/**
 * Onde cada canto do primeiro plano desenha (coordenadas do quadro): se a cena
 * pôs alguma coisa ali (`busy`), o canto sai sozinho — o primeiro plano nunca
 * passa por cima de peça, balão ou folha.
 */
const FRONT_ZONES: Record<Antigo, { left: Rect; right: Rect }> = {
  escritorio: { left: [-110, 1090, 230, 1520], right: [900, 1150, 1300, 1530] },
  treinamento: { left: [-120, 1197, 200, 1613], right: [885, 1204, 1215, 1633] },
  casa: { left: [-125, 1090, 225, 1530], right: [880, 1250, 1140, 1510] },
  cidade: { left: [-140, 1210, 290, 1530], right: [1005, 200, 1050, 1600] },
};

const envOf = (t: AmbienteKind) => (antigo(t) ? ENVS[t] : lugar(t));
const zonesOf = (t: AmbienteKind) => (antigo(t) ? FRONT_ZONES[t] : lugar(t).frontZones);

/** O filtro de cada camada (o Ambiente aplica; um lugar não precisa repetir). */
export const FILTER = { back: 'blur(1.2px)', mid: 'blur(0.4px)', front: 'blur(5px) brightness(0.62) saturate(0.75)' } as const;
const FULL: Rect = [0, 0, 1080, 1920];

/** Uma camada do ambiente. back/mid descem pro horizonte da cena; front fica preso à tela. */
export const Ambiente: React.FC<{ amb: AmbSpec; geo: EnvGeo; part: 'back' | 'mid' | 'front'; t: number; accent: string }> = ({ amb, geo, part, t, accent }) => {
  const env = envOf(amb.tipo);
  const Part = env[part];
  const shift = shiftOf(amb, geo);
  const busy = geo.busy ?? [];
  const toScene = (r: Rect): Rect => [r[0], r[1] - shift, r[2], r[3] - shift];
  const off = (side: 'left' | 'right') => !!geo.frontOff?.includes(side) || hits(busy, zonesOf(amb.tipo)[side]);
  const p: EnvP = {
    t,
    clear: geo.clear,
    gente: amb.gente ?? genteOf(amb.tipo),
    hora: amb.hora ?? horaOf(amb.tipo),
    accent,
    desk: !!geo.desk,
    noLeft: off('left'),
    noRight: off('right'),
    busy: busy.map(toScene),
    show: (geo.show ?? []).filter((x): x is string => !!x),
    seat: geo.seat ? { ...geo.seat, y: geo.seat.y - shift } : undefined,
    view: toScene(geo.view ?? FULL),
    ...(geo.anda ? { anda: geo.anda } : {}),
  };
  const s = part === 'front' ? 0 : shift;
  const visual = useVisual();
  return (
    <AbsoluteFill style={{ filter: filtroCamada(part, visual, FILTER[part]) }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: s ? `translateY(${s}px)` : undefined }}>
        <Part {...p} />
      </div>
    </AbsoluteFill>
  );
};

/**
 * Luz com origem (requinte, fase 2): o facho da janela da casa atravessando a sala, do vidro pro
 * chão, na diagonal (o sol da manhã vem do alto à direita), com poeira boiando dentro. Fica por
 * baixo da pessoa e das peças (peça sempre por cima da luz) e respira com uma nuvem. Só na casa de
 * manhã ou de dia; à noite a janela não acende nada. As coordenadas são as da janela de CasaBack.
 */
export const Luz: React.FC<{ amb: AmbSpec; geo: EnvGeo; t: number }> = ({ amb, geo, t }) => {
  const hora = amb.hora ?? horaOf(amb.tipo);
  // fase 3: um lugar registrado com `janela` também acende (a casa mantém os números de sempre)
  const jan = amb.tipo === 'casa' ? null : lugarOf(amb.tipo)?.janela;
  if ((amb.tipo !== 'casa' && !jan) || hora === 'noite') return null;
  const s = shiftOf(amb, geo);
  // janela (590..930, 330..750) projetada pra baixo e pra esquerda até o chão
  const [dx, dy] = jan ? [jan.dx, jan.dy] : [-330, 520];
  const win = jan ? { x0: jan.x0, x1: jan.x1, y0: jan.y0, y1: jan.y1 } : { x0: 600, x1: 920, y0: 350, y1: 740 };
  // luz SEM origem à vista não vale: se a cena cobre três quartos da janela (a folha do mapa), sem
  // facho. Uma ficha pequena na frente do vidro não apaga a janela.
  const area = (win.x1 - win.x0) * (win.y1 - win.y0);
  const covered = (geo.busy ?? []).reduce((acc, [a, b, c, d]) => {
    const w = Math.min(c, win.x1) - Math.max(a, win.x0);
    const h = Math.min(d, win.y1 + s) - Math.max(b, win.y0 + s);
    return acc + (w > 0 && h > 0 ? w * h : 0);
  }, 0);
  if (covered > area * 0.75) return null;
  // e nem atravessando o assunto da cena: se o caminho do facho (da janela ao chão) cai em cima do
  // que a cena desenha (a folha do mapa, de qualquer lado), sem facho
  const box = [win.x0 + dx, win.y0 + s, win.x1, win.y1 + dy + s];
  const boxArea = (box[2] - box[0]) * (box[3] - box[1]);
  const onPath = (geo.busy ?? []).reduce((acc, [a, b, c, d]) => {
    const w = Math.min(c, box[2]) - Math.max(a, box[0]);
    const h = Math.min(d, box[3]) - Math.max(b, box[1]);
    return acc + (w > 0 && h > 0 ? w * h : 0);
  }, 0);
  if (onPath > boxArea * 0.3) return null;
  const warm = hora === 'manha' && !jan?.fria;
  const tint = warm ? C.gold2 : C.hi;
  const breathe = 0.82 + 0.18 * Math.sin(t / 41) * Math.sin(t / 17 + 1);
  const motes = Array.from({ length: 16 }, (_, i) => {
    const u = ((i * 0.618) % 1) * 0.9 + 0.05;
    const v = ((i * 0.381 + 0.13) % 1) * 0.85 + 0.08;
    const drift = (t * (0.18 + (i % 5) * 0.05) + i * 37) % 120;
    const x = win.x0 + (win.x1 - win.x0) * u + dx * v + Math.sin(t / (23 + i) + i) * 14;
    const y = win.y0 + (win.y1 - win.y0) * u * 0.4 + dy * v - drift * 0.4 + s;
    return { x, y, r: 2 + (i % 3), o: 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t / (11 + (i % 7)) + i)) };
  });
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: breathe }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id="luz-facho" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={tint} stopOpacity={warm ? 0.36 : 0.24} />
            <stop offset="0.55" stopColor={tint} stopOpacity={warm ? 0.15 : 0.1} />
            <stop offset="1" stopColor={tint} stopOpacity={0} />
          </linearGradient>
          <filter id="luz-borra" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={18} />
          </filter>
        </defs>
        <path
          d={`M${win.x0} ${win.y0 + s} L${win.x1} ${win.y0 + s} L${win.x1} ${win.y1 + s} L${win.x1 + dx} ${win.y1 + dy + s} L${win.x0 + dx} ${win.y1 + dy + s} L${win.x0 + dx} ${win.y0 + dy + s} Z`}
          fill="url(#luz-facho)"
          filter="url(#luz-borra)"
        />
        {motes.map((m, i) => (
          <circle key={i} cx={m.x} cy={m.y} r={m.r + 0.5} fill={tint} opacity={Math.min(1, m.o * 1.4)} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** Foco de luz na protagonista: um halo da cor da cena atrás dela e o resto um pouco mais escuro. */
export const Spot: React.FC<{ geo: EnvGeo; accent: string }> = ({ geo, accent }) => {
  const [x, y, r] = geo.spot;
  const ring = useVisual().vivo ? 0.18 : 0.42;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle ${r * 0.75}px at ${x}px ${y}px, ${accent}3A 0%, ${accent}00 100%), radial-gradient(circle ${r * 1.6}px at ${x}px ${y}px, rgba(8,11,32,0) 0%, rgba(8,11,32,0) 45%, rgba(8,11,32,${ring}) 100%)`,
      }}
    />
  );
};

/**
 * Moldura fixa: topo escuro (sobrancelha legível) e base que funde no fundo (legenda legível).
 *
 * `aberta` (fase 3, `fase: 3` no spec): a base do quadro abre — o escuro fica só numa faixa atrás da
 * legenda (≈ 0,8 de 1420 a 1600, com degradê dos dois lados, some até 1920) e o piso, o balcão e o
 * primeiro plano continuam até a borda, como o quadro inteiro do Notebook. O que aparece ali é o
 * chão de cada lugar: um lugar novo desenha o piso claro até y ≈ 1000 + 900 (o "perto da câmera"). Antes, de 1480 pra baixo era navy chapado
 * (23% do quadro). Sem `aberta`, a de sempre (o vídeo publicado sai idêntico).
 */
export const Vinheta: React.FC<{ aberta?: boolean }> = ({ aberta = false }) => {
  // cor viva (visual.ts): as laterais escurecem 0,12 em vez de 0,35
  const lado = useVisual().vivo ? 0.12 : 0.35;
  return (
  <AbsoluteFill
    style={{
      background: aberta
        ? `linear-gradient(180deg, rgba(10,14,38,0.97) 0px, rgba(10,14,38,0.8) 170px, rgba(10,14,38,0) 380px, rgba(10,14,38,0) 1290px, rgba(10,14,38,0.8) 1420px, rgba(10,14,38,0.8) 1600px, rgba(10,14,38,0.3) 1680px, rgba(10,14,38,0.08) 1800px, rgba(10,14,38,0) 1920px), linear-gradient(90deg, rgba(10,14,38,${lado}) 0px, rgba(10,14,38,0) 140px, rgba(10,14,38,0) 940px, rgba(10,14,38,${lado}) 1080px)`
        : `linear-gradient(180deg, rgba(10,14,38,0.97) 0px, rgba(10,14,38,0.8) 170px, rgba(10,14,38,0) 380px, rgba(10,14,38,0) 1270px, rgba(10,14,38,0.82) 1410px, #0A0E26 1480px), linear-gradient(90deg, rgba(10,14,38,${lado}) 0px, rgba(10,14,38,0) 140px, rgba(10,14,38,0) 940px, rgba(10,14,38,${lado}) 1080px)`,
    }}
  />
  );
};

/**
 * Miniatura do ambiente pra dentro de um painel do `comparar` (só back + mid,
 * escalados). `horizon` = y do horizonte dentro do painel; `cx` = x do painel
 * onde cai o centro do cenário; `w`×`h` = o painel. `clear` (faixa da pessoa
 * do painel) e `busy` (a peça do painel) vêm em coordenadas do painel: nada
 * do cenário fica embaixo da peça, e o cenário não repete a peça (`show`).
 * Gente só na sala de aula (é o que diz "aula").
 */
export const AmbienteMini: React.FC<{
  tipo: AmbienteKind;
  hora?: Hora;
  t: number;
  accent: string;
  horizon: number;
  cx: number;
  scale: number;
  w: number;
  h: number;
  clear: [number, number];
  busy?: Rect[];
  show?: (string | undefined)[];
}> = ({ tipo, hora, t, accent, horizon, cx, scale, w, h, clear, busy = [], show }) => {
  const amb: AmbSpec = { tipo, hora, gente: tipo === 'treinamento' ? 'pouca' : 'nenhuma' };
  // painel → cenário (a miniatura tem o horizonte em 1000, sem deslocamento)
  const sx = (x: number) => (x - cx) / scale + 540;
  const sy = (y: number) => (y - horizon) / scale + 1000;
  const sr = (r: Rect): Rect => [sx(r[0]), sy(r[1]), sx(r[2]), sy(r[3])];
  const geo: EnvGeo = { ground: 1000 + depthOf(tipo), clear: [sx(clear[0]), sx(clear[1])], spot: [540, 860, 360], busy: busy.map(sr), show, view: sr([0, 0, w, h]) };
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
