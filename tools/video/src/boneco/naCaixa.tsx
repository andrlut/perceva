// Boneco v5 dentro da CAIXA 200×260 do molde (a mesma da Pessoa antiga: pés em (100, 252), topo da
// cabeça perto de y 20). É o que faz o boneco novo entrar em todas as cenas sem mexer nelas:
//  - `PessoaV5`: o componente da identidade (props da Pessoa antiga → pose, humor, roupa, peça)
//  - `pontoV5` / `maoV5`: os pontos do corpo e a mão, em unidades da caixa, pra pontoNaTela/maoNaTela
// Quem é: a protagonista do spec (seed igual ao dela) ou alguém do elenco pelo seed (figurante).
// A roupa sai da cena (CenaV5Context, que o Stage provê): ação + lugar → contexto (elenco.ts).
import React, { createContext, useContext, useId } from 'react';
import type { Arms, Mood, PessoaProps } from '../identidade/types';
import { type Humor, type Pose, type Proporcao, type Vista, fk, type Juntas } from './esqueleto';
import { type Pessoa, contextoDe, roupaDe } from './elenco';
import { type Acao, poseDe } from './poses';
import { ACAO_V5, type CenaV5, type Enquadra, SEGURA_V5, pessoaDoSeed, v5 } from './ativo';

/** A pose do molde vista pelo v5 (o Ator carimba isto na PoseAtor quando o v5 está ligado). */
export type PoseV5Info = {
  vista: Vista;
  /** o enquadramento da cena (ativo.ts → enquadraDe); sem = `corpo` */
  enquadra?: Enquadra;
  /** as ações que pesam no quadro: a do molde, os quadros desde que começou, o ritmo, o peso e o ciclo antigo (quadros por rep) */
  itens: { acao: string; f: number; ritmo?: 'lento' | 'rapido'; w: number; n: number }[];
};
type ComV5 = { v5?: PoseV5Info; escala?: number };

export const CenaV5Context = createContext<CenaV5>({ acoes: [] });

/** Altura de pé do boneco na caixa (pés em 252 → topo da cabeça em ~20). */
const ALT_CAIXA = 232;
const PES: [number, number] = [100, 252];

/**
 * Ações sem laço: o ciclo do v5 tem outra duração que o do molde (o salto atlético tem 42 q, o do
 * molde 22). O quadro é esticado pra rep do v5 caber inteira no tempo que o roteiro dá pra ela.
 */
const CICLO_V5: Partial<Record<Acao, number>> = { saltar: 42, rosca: 36, beber: 30 };

const HUMOR: Record<Mood, Humor> = { ok: 'ok', feliz: 'feliz', cansado: 'cansado', focado: 'focado' };

/** Média ponderada das poses (os ângulos e deslocamentos; o resto vem da de maior peso). */
const media = (ps: { p: Pose; w: number }[]): Pose => {
  const W = ps.reduce((a, b) => a + b.w, 0) || 1;
  const dom = ps.reduce((a, b) => (b.w > a.w ? b : a));
  const n = (k: 'tronco' | 'cabeca' | 'y' | 'x' | 'amassa' | 'fecha' | 'aperto' | 'marca') => ps.reduce((a, { p, w }) => a + (p[k] ?? 0) * w, 0) / W;
  const par = (k: 'ombro' | 'cotovelo' | 'punho' | 'quadril' | 'joelho' | 'pe' | 'encurta', d = 0): [number, number] => [
    ps.reduce((a, { p, w }) => a + (p[k]?.[0] ?? d) * w, 0) / W,
    ps.reduce((a, { p, w }) => a + (p[k]?.[1] ?? d) * w, 0) / W,
  ];
  return {
    ...dom.p,
    tronco: n('tronco'),
    cabeca: n('cabeca'),
    y: n('y'),
    x: n('x'),
    amassa: n('amassa'),
    fecha: n('fecha'),
    ombro: par('ombro'),
    cotovelo: par('cotovelo'),
    punho: par('punho'),
    quadril: par('quadril'),
    joelho: par('joelho'),
    pe: par('pe'),
    encurta: par('encurta', 1),
  };
};

/** Quem a Pessoa do molde é no v5: a protagonista (seed dela) ou um do elenco pelo seed, nunca a mesma. */
export const quemV5 = (seed: number | undefined, figurante?: boolean): Pessoa => {
  const at = v5();
  const prot = at?.protagonista;
  if (prot && !figurante && (seed === undefined || seed === at?.seedProtagonista)) return prot;
  let p = pessoaDoSeed(seed ?? 0);
  if (prot && p.id === prot.id) p = pessoaDoSeed((seed ?? 0) + 1);
  return p;
};

/** A pose v5 do quadro: o repouso dos braços da cena + as ações do Ator (pesadas e misturadas). */
export const poseV5 = (pessoa: Pessoa, props: { t: number; pose?: unknown; arms?: Arms; still?: boolean; segura?: string }): Pose => {
  const at = v5();
  if (!at) throw new Error('poseV5 sem o v5 ligado');
  const prop = at.estilo.propDe(pessoa);
  const t = props.still ? 0 : props.t;
  const info = (props.pose as ComV5 | undefined)?.v5;
  const vista: Vista = info?.vista ?? 'frente';
  // repouso: os braços da cena (out = segura algo pra fora; up = os dois pra cima)
  let base = poseDe('parado', t, prop, { vista });
  if (props.arms === 'up') base = poseDe('comemorar', t, prop, { vista: 'frente' });
  if (props.arms === 'out') base = { ...base, ombro: [base.ombro?.[0] ?? 0, vista === 'frente' ? 58 : 34], cotovelo: [base.cotovelo?.[0] ?? 0, vista === 'frente' ? 26 : 70], mao: ['solta', props.segura ? 'segura' : 'aberta'] };
  const itens = info?.itens ?? [];
  const W = Math.min(1, itens.reduce((a, b) => a + b.w, 0));
  if (!itens.length || W <= 0.001) return props.segura ? { ...base, mao: [base.mao?.[0] ?? 'solta', 'segura'] } : base;
  const ps = itens.map((it) => {
    const acao = ACAO_V5[it.acao] ?? 'parado';
    const ciclo = CICLO_V5[acao];
    const f = ciclo ? (it.f * ciclo) / Math.max(1, it.n) : it.f;
    const ritmo = it.ritmo === 'lento' ? 'lento' : it.ritmo === 'rapido' ? 'rapido' : 'normal';
    return { p: poseDe(acao, f, prop, { vista, ritmo }), w: it.w };
  });
  const p = media([{ p: base, w: 1 - W }, ...ps]);
  return props.segura ? { ...p, mao: [p.mao?.[0] ?? 'solta', 'segura'] } : p;
};

/**
 * Como o boneco cabe na caixa: escala e origem (onde o (0, 0) do boneco — o chão no meio — cai na
 * caixa). `corpo`: pés em (100, 252), altura de pé = ALT_CAIXA. `busto`: a cintura (um tico abaixo da
 * pélvis) em (100, BUSTO_CINTURA) e o topo da cabeça em BUSTO_TOPO — fica ~1,6× maior e as pernas
 * passam da caixa (o balcão, a faixa da legenda ou o corte do quadro escondem).
 */
const BUSTO_TOPO = 26;
const BUSTO_CINTURA = 214;
type Encaixe = { s: number; o: [number, number] };
const encaixe = (j: Juntas, prop: Proporcao, enquadra: Enquadra | undefined): Encaixe => {
  if (enquadra !== 'busto') return { s: ALT_CAIXA / j.altura, o: PES };
  // pela proporção de pé (não pela pose do quadro): a respiração não muda a escala nem a origem
  const perna = prop.tornozelo + prop.canela + prop.coxa;
  const s = (BUSTO_CINTURA - BUSTO_TOPO) / Math.max(1, j.altura - perna);
  return { s, o: [PES[0], BUSTO_CINTURA + perna * s] };
};

/** Um ponto do boneco (unidades dele) na caixa. */
const naCaixa = (j: Juntas, pt: [number, number], e: Encaixe): [number, number] => [e.o[0] + (j.espelho ? -1 : 1) * pt[0] * e.s, e.o[1] + pt[1] * e.s];

const juntasV5 = (pose: unknown, arms: Arms | undefined, t = 0) => {
  const at = v5();
  if (!at) throw new Error('juntasV5 sem o v5 ligado');
  const pessoa = at.protagonista;
  const prop = at.estilo.propDe(pessoa);
  const p = poseV5(pessoa, { t, pose, arms });
  const j = fk(prop, p);
  const e = encaixe(j, prop, (pose as ComV5 | undefined)?.v5?.enquadra);
  return { j, e, prop };
};

/**
 * Todas as juntas da protagonista em unidades da CAIXA (pra quem desenha por cima do corpo: o corpo
 * de vidro da cena `dentro`, setas, lentes). Mesma pose e mesmo encaixe que a PessoaV5 desenha.
 */
export function corpoV5(pose: unknown, arms: Arms = 'down') {
  const { j, e, prop } = juntasV5(pose, arms);
  const c = (p: [number, number]) => naCaixa(j, p, e);
  const par = (ps: [[number, number], [number, number]]): [[number, number], [number, number]] => [c(ps[0]), c(ps[1])];
  return {
    escala: e.s,
    espelho: j.espelho,
    vista: j.vista,
    cabeca: c(j.cabeca),
    raioCabeca: (prop.cabeca / 2) * e.s,
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
    /** meia largura dos ombros e do quadril, já com a vista (unidades da caixa) */
    ombros: Math.hypot(j.ombro[1][0] - j.ombro[0][0], j.ombro[1][1] - j.ombro[0][1]) * e.s / 2,
    quadris: Math.hypot(j.quadril[1][0] - j.quadril[0][0], j.quadril[1][1] - j.quadril[0][1]) * e.s / 2,
  };
}

/**
 * Os pontos do corpo (os nomes de CORPO.pontos) em unidades da caixa. `cabeca` e `boca` ficam
 * simétricos em volta do centro da cabeça (o rotulo.tsx tira o círculo da cabeça deles).
 */
export function pontoV5(r: string, pose: unknown, arms?: Arms): [number, number] {
  const { j, e, prop } = juntasV5(pose, arms);
  const lerp = (a: [number, number], b: [number, number], k: number): [number, number] => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const meio = (a: [number, number], b: [number, number]) => lerp(a, b, 0.5);
  const c = j.cabeca;
  const pt: Record<string, [number, number]> = {
    cabeca: [c[0], c[1] - prop.cabeca * 0.27],
    rosto: j.bochecha,
    boca: [c[0], c[1] + prop.cabeca * 0.27],
    peito: lerp(j.peito, j.pelvis, 0.22),
    tronco: lerp(j.peito, j.pelvis, 0.42),
    barriga: lerp(j.peito, j.pelvis, 0.74),
    braco: meio(j.ombro[1], j.cotovelo[1]),
    perna: meio(j.quadril[1], j.joelho[1]),
    ombro: j.ombro[1],
  };
  return naCaixa(j, pt[r] ?? lerp(j.peito, j.pelvis, 0.42), e);
}

/** A mão `lado` (0 de trás, 1 da frente) em unidades da caixa, e o ângulo do antebraço (graus). */
export function maoV5(pose: unknown, arms: Arms, lado: 0 | 1): { p: [number, number]; ang: number } {
  const { j, e } = juntasV5(pose, arms);
  const m: [number, number] = [j.punho[lado][0] + (j.dedos[lado][0] - j.punho[lado][0]) * 0.45, j.punho[lado][1] + (j.dedos[lado][1] - j.punho[lado][1]) * 0.45];
  return { p: naCaixa(j, m, e), ang: (j.espelho ? -1 : 1) * j.ang.antebraco[lado] };
}

/** A Pessoa do molde desenhada pelo v5 (mesma caixa e props da antiga). */
export const PessoaV5: React.FC<PessoaProps & { segura?: string; vidro?: number; figurante?: boolean }> = (props) => {
  const at = v5();
  const cena = useContext(CenaV5Context);
  const uid = `v5${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (!at) return null;
  const { size = 260, mood = 'ok', seed, t = 0, segura, vidro, figurante } = props;
  const pessoa = quemV5(seed, figurante);
  const prop = at.estilo.propDe(pessoa);
  const pose = poseV5(pessoa, { t, pose: props.pose, arms: props.arms, still: props.still, segura });
  const j = fk(prop, pose);
  // o enquadramento: o da pose (Ator) ou o da cena; figurante é sempre de corpo inteiro
  const prot = !figurante && pessoa.id === at.protagonista.id;
  const e = encaixe(j, prop, prot ? ((props.pose as ComV5 | undefined)?.v5?.enquadra ?? cena.enquadra) : 'corpo');
  const s = e.s;
  const acoes = cena.acoes.map((a) => ACAO_V5[a] ?? 'parado');
  const contexto = cena.roupa ?? contextoDe({ acoes, lugar: cena.lugar, hora: cena.hora });
  const roupa = roupaDe(pessoa, contexto);
  const D = at.estilo.Desenho;
  const elev = Math.max(0, -(pose.y ?? 0)) / j.altura;
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260" style={{ overflow: 'visible', display: 'block' }}>
      {e.o[1] === PES[1] ? <ellipse cx={PES[0] + (pose.x ?? 0) * s} cy={PES[1] + 1} rx={34 * (1 - Math.min(0.5, elev))} ry={5} fill="#05071A" opacity={0.4 - Math.min(0.25, elev)} /> : null}
      <g transform={`translate(${e.o[0]} ${e.o[1]}) scale(${(j.espelho ? -1 : 1) * s} ${s})`}>
        <D
          j={j}
          pessoa={pessoa}
          roupa={roupa}
          humor={HUMOR[mood] ?? 'ok'}
          t={t}
          uid={uid}
          segura={segura ? SEGURA_V5[segura] : undefined}
          vidro={vidro}
        />
      </g>
    </svg>
  );
};
