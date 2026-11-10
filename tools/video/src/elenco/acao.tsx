// Ações do elenco (fase 3): a pessoa FAZENDO o que a voz diz — anda, corre, salta, levanta peso,
// mistura e bebe. Contrato em design.json (bloco "acao") com os cortes do PLANO-FINAL.
//
//  - `poseAt` é o ciclo de cada ação (unidades da caixa 200×260 da Pessoa). `poseDe` lê as ações do
//    roteiro (cue/ate/reps/ritmo/de/para) e mistura: 6 q de uma ação pra seguinte, 8 q de volta ao
//    repouso depois do `ate` ou do fim das reps. `Ator` desenha a Pessoa da identidade com a pose,
//    a peça NA MÃO (a mão por cima da peça: lê "segurando", não "flutuando") e a poeira do correr.
//  - Regras: `correr` é no lugar, ou vindo pra câmera quando a ação tem `para` (escala até 1,25 na
//    cena, os pés descem ~40 px no Ator de 400); trajeto de lado só no `andar`. Beber com o braço na
//    FRENTE da cabeça (Pose.frente). Nenhum raio, rastro no corpo, brilho de "power-up": a velocidade
//    é dita pelo CHÃO que anda (`corridaDe` → EnvGeo.anda) e pela poeira no pé. Sem pose, a Pessoa
//    sai idêntica (diff 0 nos vídeos publicados).
//  - Acabamento: o salto é de ATLETA (régua da parceira: nada de braços em V, que lê comemoração) —
//    braços pra trás no agachamento, punhos no peito no voo (o cotovelo dobra, como na corrida).
//    `desce` na pose: quanto os pés descem ao vir pra câmera (o `faz` fechado passa menos).
//  - Rodada 2: a corrida LÊ como corrida de frente — joelho que vem pra câmera passando na frente da
//    roupa, a outra perna chutando pra trás, cotovelo dobrado (punho no peito × mão no quadril),
//    quique com voo (os dois pés no ar), cabelo atrasado, cabeça baixa. E ninguém congela: sem ação,
//    o Ator respira e troca o peso de pé (cansada, os ombros caem); `pronta` quica de leve.
//  - O rig é o da identidade: braço reto girando no ombro, perna girando no quadril e subindo
//    (`ergue`: o joelho vem pra câmera, a barra da roupa cobre o topo). Por isso o copo se segura
//    na frente do peito (a mão chega lá sem passar pelo quadril) e sobe reto até a boca.
//
// Importa só TIPOS de scenes.tsx (`import type { MS }`): sem ciclo de import.
import React from 'react';
import { spring } from 'remotion';
import { MOLA } from '../components';
import { vidaDe, type PoseRig } from '../identidade/options/hexa';
import { CORPO, type Arms, type Mood, type Pose } from '../identidade/types';
import { Peca, pieceBox } from '../molde/Peca';
import type { MS } from '../molde/scenes';
import type { AcaoKind, AcaoSpec, PieceName } from '../molde/spec';
import { C } from '../theme';
import { FPS, cue, speechEnd } from '../timeline';
import { Pessoa } from './cast';
import { FIG_ACCENT, SKINS } from './cenario';
import { SEGURA_V5, enquadraDe, v5, vistaDaCena } from '../boneco/ativo';
import { maoV5, pontoV5, type PoseV5Info } from '../boneco/naCaixa';

// ------------------------------------------------------------------ tipos

/**
 * A pose que o Ator recebe: a do corpo (`Pose`, que a identidade desenha, + os campos da corrida que
 * o rig Hexa lê — `PoseRig`: dobra, joelho, chuta, apoio, cabelo, curva) + o que o Ator desenha em
 * volta. Estruturalmente é uma `Pose` (dá pra passar direto pra `Pessoa`; os campos a mais ficam de fora).
 */
export type PoseAtor = PoseRig & {
  /** de que ação veio (a que mais pesa no quadro) */
  acao?: AcaoKind;
  /** 0..1: quanto da ação vale sobre o repouso (o Ator mistura com os braços da cena); sem = 1 */
  mistura?: number;
  /** escala em volta dos pés: o correr que vem pra câmera (fica depois que a ação termina) */
  escala?: number;
  /** quanto os pés descem ao crescer (× size × (escala − 1)); sem = VEM_DESCE. O `faz` no plano
   *  fechado passa menos: a câmera já está perto e os pés não entram na faixa da legenda */
  desce?: number;
  /** giro da peça da mão direita, graus (+ horário): o copo inclina na boca, mexe de leve */
  giro?: number;
  /** pousos recentes do correr — pé (0 esq, 1 dir) e quadros desde o pouso — pra poeira */
  pouso?: { pe: 0 | 1; f: number }[];
  /** boneco v5: a vista da cena e as ações pesadas do quadro (o v5 refaz a pose com a biblioteca dele) */
  v5?: PoseV5Info;
};

type Box = { left: number; top: number; size: number };
type Par = [number, number];

// ------------------------------------------------------------------ ciclos

/** Quadros por ciclo/rep, por ritmo (normal, lento, rápido). `laco` = roda até a próxima ação ou o `ate`. */
const CICLO: Record<AcaoKind, { n: number; lento: number; rapido: number; laco: boolean }> = {
  pronta: { n: 1, lento: 1, rapido: 1, laco: true },
  andar: { n: 26, lento: 32, rapido: 20, laco: true },
  correr: { n: 16, lento: 20, rapido: 12, laco: true },
  saltar: { n: 22, lento: 26, rapido: 18, laco: false },
  levantar: { n: 30, lento: 36, rapido: 22, laco: false },
  mexer: { n: 10, lento: 14, rapido: 8, laco: true },
  beber: { n: 34, lento: 40, rapido: 28, laco: false },
};

/** Quadros de uma rep da ação, no ritmo. */
export const cicloDe = (acao: AcaoKind, ritmo?: 'lento' | 'rapido') => {
  const c = CICLO[acao];
  return ritmo === 'lento' ? c.lento : ritmo === 'rapido' ? c.rapido : c.n;
};

const TAU = Math.PI * 2;
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** ease in-out (quadrática) */
const io = (x: number) => {
  const k = cl(x);
  return k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
};
/** smoothstep */
const sm = (x: number) => {
  const k = cl(x);
  return k * k * (3 - 2 * k);
};
const out2 = (x: number) => 1 - (1 - cl(x)) ** 2;
const repsDe = (a: Pick<AcaoSpec, 'reps'>) => Math.max(1, Math.min(4, Math.round(a.reps ?? 1)));

// Ângulos do braço direito com o copo (o rig não tem cotovelo: o braço reto que chega ao peito
// pela frente sobe reto até a boca; vindo do 'out' ele passaria pelo quadril — e some atrás do balcão)
/** copo na frente do peito (mexer): a mão em ~(95, 181), o copo do peito à barriga */
const COPO_PEITO = 62;
/** copo na boca (beber): a mão logo abaixo do queixo, a borda do copo na boca */
const COPO_BOCA = 110;
/** altura do salto (un.): com as pernas encolhidas, os pés sobem ~100 un. (≥ 180 px no Ator de 360) */
const SALTO = 94;
/**
 * Os braços do salto (graus no ombro, + = pra fora; `dobra` = o cotovelo, como na corrida): soltos
 * (16°, cotovelo quase reto), pra trás no agachamento (30°, retos — de frente, as mãos atrás do
 * quadril), pra frente no voo (12° com o cotovelo dobrado em 132°: o punho em ~(74, 172) da caixa,
 * na altura do peito, abaixo do ombro em 158) e `abre` = quanto voltam na queda (0,45 do caminho).
 */
const SALTO_BRACO = { solto: 16, tras: 30, frente: 12, dobraSolta: 6, dobraPeito: 132, abre: 0.45 };

/** Quadros que a poeira de um pouso dura no chão. */
const POEIRA = 14;
/** Pousos de quem corre há `f` quadros num ciclo de `n`: o direito pousa na metade, o esquerdo no fim (u = 0 é o pouso dele). */
const poususDe = (f: number, n: number, ate = Infinity) => {
  const out: { pe: 0 | 1; f: number }[] = [];
  const half = n / 2;
  for (let j = Math.max(1, Math.floor((f - POEIRA) / half)); j * half <= Math.min(f, ate); j++) {
    const age = f - j * half;
    if (age >= 0 && age < POEIRA) out.push({ pe: j % 2 ? 1 : 0, f: age });
  }
  return out;
};

/** Sobe de 0 a 1 entre a e b, desce de 1 a 0 entre b e c (smoothstep nas duas pontas). */
const bump = (u: number, a: number, b: number, c: number) => (u <= a || u >= c ? 0 : u < b ? sm((u - a) / (b - a)) : 1 - sm((u - b) / (c - b)));
/** cos² centrado em c, meia largura w (0 fora). */
const sino = (u: number, c: number, w: number) => (Math.abs(u - c) >= w ? 0 : Math.cos((Math.PI / 2) * ((u - c) / w)) ** 2);

/**
 * A corrida de frente, por perna, na fase u ∈ [0, 1) da perna (u = 0 é o pouso dela; a outra perna
 * está meio ciclo à frente). Apoio de 0 a 0,35 (o pé plantado; a perna estica enquanto o corpo sobe),
 * chute pra trás de 0,35 a 0,78 (pico 0,52), joelho pra câmera de 0,55 a 1 (pico 0,85, desce pro
 * pouso). Nunca há um quadro com os dois pés plantados: no pouso de uma, a outra está no alto do chute.
 */
const pernaCorre = (u: number) => ({
  joelho: bump(u, 0.55, 0.85, 1.001),
  chuta: 0.85 * bump(u, 0.35, 0.52, 0.78),
  apoio: u < 0.35 ? 1 : u < 0.4 ? 1 - (u - 0.35) / 0.05 : u > 0.97 ? (u - 0.97) / 0.03 : 0,
});
/** O quique do corpo na fase u da perna esquerda: no alto nos dois voos (0,425 e 0,925), embaixo no meio dos apoios. */
const quiqueCorre = (u: number) => Math.max(sino(u, 0.425, 0.17), sino(u, 0.925, 0.17), sino(u, -0.075, 0.17));

/**
 * A pose da ação `f` quadros depois de começar (sem mistura). `dir` = lado do trajeto (andar: inclina
 * 3° pra lá; 0 = no lugar). `peca` = o que está na mão (a coqueteleira SACODE no mexer, o copo gira).
 * Ações sem laço passam do fim com a última pose (o pouso do salto continua assentando).
 */
export function poseAt(
  acao: AcaoKind,
  f: number,
  o: { ritmo?: 'lento' | 'rapido'; dir?: 1 | -1 | 0; reps?: number; peca?: PieceName; laco?: boolean } = {},
): PoseAtor & { fim: boolean } {
  const n = cicloDe(acao, o.ritmo);
  // `laco` (figurante do faz): a ação que tem fim repete a rep sem parar, até a próxima ação
  const reps = o.laco ? Infinity : repsDe(o);
  const fim = !CICLO[acao].laco && f >= n * reps;
  const dir = o.dir ?? 0;
  switch (acao) {
    case 'pronta': {
      // de prontidão: braços um tico abertos, pés afastados, joelho solto (o corpo baixa 2) — e o peso
      // quica de leve nas pontas dos pés (quem está pronto não congela); em f = 0, a pose de sempre
      const b = Math.sin((TAU * f) / 26);
      const w = Math.sin((TAU * f) / 96);
      return { acao, braco: [24 + 3 * b, -24 - 3 * b], perna: [7, -7], y: 2 + 1.6 * b, inclina: 0.9 * w, cabeca: -0.6 * w, fim };
    }
    case 'andar': {
      const s = Math.sin((TAU * f) / n);
      return {
        acao,
        // pêndulo: o braço do lado da perna que sobe vai pra fora, o outro vem pra dentro (vai à frente)
        braco: [12 + 14 * s, -12 + 14 * s],
        ergue: [6 * Math.max(0, s), 6 * Math.max(0, -s)],
        perna: [-2 * Math.max(0, s), 2 * Math.max(0, -s)],
        // quica a cada passo (mais alto no meio do passo)
        y: -2 * Math.abs(s),
        inclina: 3 * dir,
        cabeca: 1.2 * s,
        fim: false,
      };
    }
    case 'correr': {
      // de FRENTE (vindo pra câmera ou no lugar, com o chão andando): u = fase da perna esquerda
      const u = (((f / n) % 1) + 1) % 1;
      const pe = pernaCorre(u);
      const pd = pernaCorre((u + 0.5) % 1);
      const h = quiqueCorre(u);
      // o braço oposto à perna que vem: o direito no pico quando o joelho esquerdo sobe (u 0,85)
      const aR = (1 + Math.cos(TAU * (u - 0.85))) / 2;
      const aL = 1 - aR;
      return {
        acao,
        // cotovelo dobrado: o braço da frente quase reto pra baixo e o antebraço subindo até o peito
        // (punho na frente do peito); o de trás abre no ombro e a mão desce até o quadril
        braco: [lerp(44, 2, aL), -lerp(44, 2, aR)],
        dobra: [lerp(40, 154, aL), lerp(40, 154, aR)],
        joelho: [pe.joelho, pd.joelho],
        chuta: [pe.chuta, pd.chuta],
        apoio: [pe.apoio, pd.apoio],
        // voo: no alto os dois pés saem do chão (≥ 60 px o pé do joelho, no Ator de 400)
        y: -16 * h,
        // os ombros balançam com os braços; a cabeça segura o eixo
        inclina: 2.6 * (aR - aL) + 5 * dir,
        cabeca: -2 * (aR - aL),
        curva: 1,
        // o cabelo atrasa no quique: sobe o corpo, ele fica; desce, ele sobe
        cabelo: 3.4 * Math.sin(TAU * 2 * (u - 0.17) - 0.9),
        // o pé que pousa amassa o corpo no meio do apoio
        amassa: 0.2 * (1 - sm(h / 0.3)),
        pouso: poususDe(f, n),
        fim: false,
      };
    }
    case 'saltar': {
      // salto de ATLETA, não de comemoração (régua da parceira: nada de braços em V no ar). No
      // agachamento os braços vão pra trás (retos, um tico abertos, as mãos atrás do quadril) e o
      // tronco vem pra frente; no voo eles vêm pra frente com o cotovelo dobrado — os punhos na
      // altura do PEITO, na frente do tronco (o impulso de quem salta pra cima) — e abrem um tico na
      // queda pra pousar. As mãos nunca passam da linha do ombro (muito menos da cabeça).
      const q = n / 22;
      const rep = Math.min(reps - 1, Math.floor(f / n));
      const g = f - rep * n;
      const A0 = 5 * q;
      const A1 = 18 * q;
      // o pouso da rep anterior ainda assentando (entra no agachamento da seguinte sem pular)
      const sobra = rep > 0 ? 1 - spring({ frame: g + n - A1, fps: FPS, config: MOLA.peso }) : 0;
      if (g < A0) {
        const k = sm(g / A0);
        return {
          acao,
          braco: [lerp(SALTO_BRACO.solto, SALTO_BRACO.tras, k), -lerp(SALTO_BRACO.solto, SALTO_BRACO.tras, k)],
          dobra: [SALTO_BRACO.dobraSolta, SALTO_BRACO.dobraSolta],
          y: 7 * k,
          curva: 0.7 * k,
          amassa: Math.max(sobra, 0.35 * k),
          fim,
        };
      }
      if (g < A1) {
        const tau = (g - A0) / (A1 - A0);
        const h = 4 * tau * (1 - tau);
        // os braços vêm pra frente rápido no impulso (punhos no peito) e abrem um tico na queda
        const up = tau < 0.4 ? out2(tau / 0.4) : 1 - SALTO_BRACO.abre * sm((tau - 0.55) / 0.45);
        const a = lerp(SALTO_BRACO.tras, SALTO_BRACO.frente, up);
        const d = lerp(SALTO_BRACO.dobraSolta, SALTO_BRACO.dobraPeito, up);
        const tuck = 13 * Math.sin(Math.PI * tau);
        return {
          acao,
          braco: [a, -a],
          dobra: [d, d],
          y: -SALTO * h,
          ergue: [tuck, tuck],
          perna: [-3 * h, 3 * h],
          // o tronco endireita na decolagem
          curva: 0.7 * (1 - sm(tau / 0.3)),
          // estica na decolagem
          amassa: tau < 0.2 ? -0.25 * (1 - tau / 0.2) : 0,
          fim,
        };
      }
      // pouso: amassa e assenta na mola de peso (MOLA.peso), os braços descem soltos
      const gl = g - A1;
      const am = 1 - spring({ frame: gl, fps: FPS, config: MOLA.peso });
      const k = sm(gl / (4 * q));
      const a0 = lerp(SALTO_BRACO.tras, SALTO_BRACO.frente, 1 - SALTO_BRACO.abre);
      const d0 = lerp(SALTO_BRACO.dobraSolta, SALTO_BRACO.dobraPeito, 1 - SALTO_BRACO.abre);
      const a = lerp(a0, SALTO_BRACO.solto, k);
      const d = lerp(d0, SALTO_BRACO.dobraSolta, k);
      return { acao, braco: [a, -a], dobra: [d, d], y: 5 * Math.max(0, am), curva: 0.25 * Math.max(0, am), amassa: am, fim };
    }
    case 'levantar': {
      // os dois halteres sobem do lado do ombro até o V acima da cabeça (nunca por cima do rosto)
      const rep = Math.min(reps - 1, Math.floor(f / n));
      const q = cl((f - rep * n) / n);
      const up = q < 0.4 ? io(q / 0.4) : q < 0.5 ? 1 : q < 0.9 ? 1 - io((q - 0.5) / 0.4) : 0;
      // no topo (127°) o halter em pé fica todo acima da linha do ombro e fora do rosto (faceRect)
      const a = lerp(80, 127, up);
      return { acao, braco: [a, -a], perna: [5, -5], y: 1.5 * (1 - up), cabeca: 0, fim };
    }
    case 'mexer': {
      if (o.peca === 'coqueteleira') {
        // a coqueteleira SACODE na vertical, na frente do peito; o corpo acompanha um tico
        const s = Math.sin((TAU * f) / 8);
        return { acao, braco: [14, COPO_PEITO - 2 + 12 * s], y: 0.8 * s, cabeca: 0.5 * s, giro: 0, fim: false };
      }
      // o copo na frente do peito, a mão gira ±5° a 3 Hz (a bebida faz o redemoinho)
      const s = Math.sin((TAU * f) / n);
      const c = Math.cos((TAU * f) / n);
      return { acao, braco: [14, COPO_PEITO + 5 * s], y: 0.5 * c, giro: 4 * c, fim: false };
    }
    case 'beber': {
      // sobe em 10 q (do peito até a boca), segura 14 q com a cabeça pra trás, desce em 10 q
      const q = n / 34;
      const rep = Math.min(reps - 1, Math.floor(f / n));
      const g = f - rep * n;
      const T1 = 10 * q;
      const T2 = 24 * q;
      const k = g < T1 ? io(g / T1) : g < T2 ? 1 : 1 - io((g - T2) / (n - T2));
      const a = lerp(COPO_PEITO, COPO_BOCA, k);
      return { acao, braco: [14, a], cabeca: -6 * sm(k), giro: -16 * sm((k - 0.3) / 0.7), fecha: 0.2 * sm((k - 0.6) / 0.4), fim };
    }
  }
}

/** O mesmo ciclo em laço (figurante, `Ator laco`): ação sem laço repete a rep sem parar. */
const poseLaco = (acao: AcaoKind, f: number) => {
  const n = cicloDe(acao);
  const ff = CICLO[acao].laco ? f : ((f % n) + n) % n;
  const p: PoseAtor = poseAt(acao, Math.max(0, ff));
  return v5() ? { ...p, v5: { vista: vistaDaCena([acao]), itens: [{ acao, f: Math.max(0, ff), w: 1, n }] } } : p;
};

// ------------------------------------------------------------------ roteiro → pose

/** Laço sem deixa e sem `ate`, seguido de ação sem deixa: dura 1,5 s. */
const LACO_SEM_DEIXA = 45;
/** entra (e troca de ação) em 6 q; volta ao repouso em 8 q */
const ENTRA = 6;
const SAI = 8;
/** passada (2 passos) do andar com trajeto, em px — a cadência acompanha a velocidade */
const PASSADA = 150;
/**
 * O correr com `para` vem pra câmera: a escala vai até VEM_MAX na cena (com duas arrancadas, cada
 * uma cresce a raiz quadrada — as duas leem "vindo") e os pés descem VEM_DESCE × size × (escala − 1)
 * (≈ 40 px no Ator de 400). A cena `faz` mede o espaço dela com os mesmos números.
 */
export const VEM_MAX = 1.25;
export const VEM_DESCE = 0.4;

/**
 * Ação do roteiro + o que só a cena põe: `laco` (figurante do `faz`) faz saltar/levantar repetirem
 * a rep até a próxima ação (o `ate` dele), sem o teto de 4 reps.
 */
export type AcaoPlano = AcaoSpec & { laco?: boolean };
const emLaco = (a: AcaoPlano) => CICLO[a.acao].laco || !!a.laco;

type Plano = { a: AcaoPlano; ini: number; fim: number; contig: boolean; traj?: { ate: number } };

/** Quando cada ação começa e termina, no quadro local da fala. */
const planoDe = (s: MS, acoes: AcaoPlano[]): Plano[] => {
  const L = acoes.slice(0, 6);
  const ini: number[] = [];
  L.forEach((a, i) => {
    let f: number;
    if (a.cue) f = cue(s, a.cue);
    else if (i === 0) f = s.lead;
    else {
      const p = L[i - 1];
      f = p.ate ? cue(s, p.ate) : emLaco(p) ? ini[i - 1] + LACO_SEM_DEIXA : ini[i - 1] + cicloDe(p.acao, p.ritmo) * repsDe(p);
    }
    // deixas fora de ordem: a seguinte nunca começa antes da anterior
    ini.push(i ? Math.max(f, ini[i - 1] + 2) : f);
  });
  return L.map((a, i) => {
    const next = ini[i + 1] as number | undefined;
    let fim = emLaco(a) ? Infinity : ini[i] + cicloDe(a.acao, a.ritmo) * repsDe(a);
    if (a.ate) fim = Math.min(fim, Math.max(ini[i] + 1, cue(s, a.ate)));
    let traj: Plano['traj'];
    if (a.acao === 'andar' && a.para !== undefined) {
      // x vai de `de` a `para` entre a deixa e a próxima deixa (ou o `ate`, ou o fim da fala); chegou, para
      const end = a.ate ? cue(s, a.ate) : (next ?? speechEnd(s));
      traj = { ate: Math.max(ini[i] + 12, end) };
      fim = Math.min(fim, traj.ate);
    }
    if (next !== undefined) fim = Math.min(fim, next);
    return { a, ini: ini[i], fim, contig: next !== undefined && fim >= next, traj };
  });
};

const pesoDe = (p: Plano, frame: number) => {
  if (frame < p.ini) return 0;
  const entra = cl((frame - p.ini) / ENTRA);
  const sai = frame < p.fim ? 1 : 1 - cl((frame - p.fim) / (p.contig ? ENTRA : SAI));
  return entra * sai;
};

/** Mistura campo a campo (pesos já normalizados). */
const PARES = ['braco', 'perna', 'ergue'] as const;
const NUMS = ['y', 'inclina', 'cabeca', 'fecha', 'amassa', 'giro'] as const;
/** Os campos da corrida (PoseRig): só entram na mistura quando alguma ação do quadro os tem. */
const PARES_RIG = ['dobra', 'joelho', 'chuta', 'apoio'] as const;
const NUMS_RIG = ['cabelo', 'curva'] as const;
const misturar = (ps: { p: PoseAtor; w: number }[], rest: Par): PoseAtor => {
  const W = ps.reduce((a, b) => a + b.w, 0) || 1;
  const out: PoseAtor = {};
  for (const k of PARES) {
    const v: Par = [0, 0];
    for (const { p, w } of ps) {
      const x = p[k] ?? (k === 'braco' ? rest : [0, 0]);
      v[0] += (x[0] * w) / W;
      v[1] += (x[1] * w) / W;
    }
    out[k] = v;
  }
  for (const k of NUMS) out[k] = ps.reduce((a, { p, w }) => a + ((p[k] ?? 0) * w) / W, 0);
  for (const k of PARES_RIG) {
    if (!ps.some(({ p }) => p[k])) continue;
    const v: Par = [0, 0];
    for (const { p, w } of ps) {
      const x = p[k] ?? [0, 0];
      v[0] += (x[0] * w) / W;
      v[1] += (x[1] * w) / W;
    }
    out[k] = v;
  }
  for (const k of NUMS_RIG) if (ps.some(({ p }) => p[k] !== undefined)) out[k] = ps.reduce((a, { p, w }) => a + ((p[k] ?? 0) * w) / W, 0);
  return out;
};

/**
 * A pose do quadro a partir das ações do roteiro.
 *  - `pose`: PoseAtor (com `mistura` < 1 entrando/saindo do repouso — o Ator completa com os braços
 *    da cena); undefined antes da 1ª deixa e depois que tudo voltou ao repouso.
 *  - `x`: deslocamento do trajeto em px, relativo a `ativa.de`. Desenhe em `(ativa?.de ?? x da cena) + x`.
 *  - `ativa`: a ação que manda no quadro (a que mais pesa; antes da 1ª deixa, a 1ª; depois do fim, a
 *    última), com `de` = onde ela está ancorada — depois de andar até `para`, ela FICA lá.
 *  - `peca` (mão direita) / `maos` (as duas, o halter do levantar). Mexer e beber herdam a peça da
 *    ação anterior, depois o `holding` da cena, e por fim um copo d'água (não se bebe de mão vazia).
 */
export function poseDe(
  s: MS,
  acoes: AcaoPlano[] | undefined,
  frame: number,
): { pose?: PoseAtor; peca?: PieceName; maos?: PieceName; x: number; ativa?: AcaoSpec; ciclo0: number } {
  if (!acoes?.length) return { x: 0, ciclo0: 0 };
  const plano = planoDe(s, acoes);
  const holding = s.props?.holding;

  const pecaDe = (i: number): { peca?: PieceName; maos?: PieceName } => {
    const a = plano[i].a;
    if (a.acao === 'levantar') return { maos: a.peca ?? 'peso' };
    if (a.peca) return { peca: a.peca };
    if (a.acao === 'mexer' || a.acao === 'beber') {
      for (let j = i - 1; j >= 0; j--) {
        const b = plano[j].a;
        if (b.peca && b.acao !== 'levantar') return { peca: b.peca };
        if (b.acao !== 'mexer' && b.acao !== 'beber' && b.acao !== 'pronta') break;
      }
      return { peca: holding ?? 'copo-agua' };
    }
    return {};
  };

  // onde ela está: a âncora (o `de`, ou onde o último trajeto deixou) e o x absoluto
  let anchor: number | undefined = plano[0].a.de;
  let pos: number | undefined = anchor;
  let dir: 1 | -1 | 0 = 0;
  const fAndar: number[] = plano.map(() => 0);
  for (const [i, p] of plano.entries()) {
    if (frame < p.ini) break;
    if (p.a.de !== undefined) pos = p.a.de;
    anchor = pos;
    if (p.traj) {
      const from = pos ?? 540;
      const D = p.a.para! - from;
      const T = p.traj.ate - p.ini;
      anchor = from;
      pos = from + D * io((frame - p.ini) / T);
      if (frame < p.traj.ate) dir = D > 0 ? 1 : D < 0 ? -1 : 0;
      // a cadência acompanha a velocidade (passo lento saindo e chegando): fase integrada quadro a quadro
      const n0 = cicloDe('andar', p.a.ritmo);
      const f = frame - p.ini;
      let ph = 0;
      for (let j = 0; j < f; j++) {
        const v = Math.abs(D) * (io((j + 1) / T) - io(j / T));
        ph += 1 / (j < T && Math.abs(D) >= 1 ? cl(PASSADA / Math.max(v, 1e-3), 18, 34) : n0);
      }
      fAndar[i] = ph * n0;
    }
  }

  // os pesos de cada ação no quadro (somam ≤ 1; o que falta é repouso)
  const ws = plano.map((p) => pesoDe(p, frame));
  const W = ws.reduce((a, b) => a + b, 0);
  let dom = -1;
  for (let i = 0; i < plano.length; i++) if (ws[i] > 0 && (dom < 0 || ws[i] > ws[dom])) dom = i;
  let last = -1;
  for (let i = 0; i < plano.length; i++) if (frame >= plano[i].ini) last = i;
  const ref = dom >= 0 ? dom : last;

  // o que sobrevive ao fim da ação: a escala de quem correu pra câmera e a poeira no chão
  // (N arrancadas com `para` dividem o caminho até VEM_MAX: cada uma cresce VEM_MAX^(1/N))
  let escala = 1;
  const nVem = plano.filter((p) => p.a.acao === 'correr' && p.a.para !== undefined).length;
  const passo = nVem ? VEM_MAX ** (1 / nVem) - 1 : 0;
  const pouso: { pe: 0 | 1; f: number }[] = [];
  for (const p of plano) {
    if (p.a.acao !== 'correr' || frame < p.ini) continue;
    const n = cicloDe('correr', p.a.ritmo);
    pouso.push(...poususDe(frame - p.ini, n, p.fim - p.ini));
    if (p.a.para !== undefined) {
      const dur = (Number.isFinite(p.fim) ? p.fim : speechEnd(s)) - p.ini;
      if (dur >= 18) escala *= 1 + passo * io((Math.min(frame, p.fim) - p.ini) / dur);
    }
  }
  escala = Math.min(VEM_MAX, escala);
  // boneco v5: a vista é da CENA (sem estalo no meio). Correndo no lugar ou vindo pra câmera = DE
  // FRENTE (o chão anda pra câmera); andar com trajeto segura 3/4
  const vista5 = v5() ? vistaDaCena(plano.map((p) => p.a.acao), { trajeto: plano.some((p) => p.traj) }) : undefined;
  // de 3/4 crescer lia "deslizando" (cresce um quarto do caminho); de frente, vindo pra câmera, crescer
  // é o que diz que ela vem — mais da metade (os pés não descem no plano fechado do v5: faz.tsx)
  if (vista5) escala = 1 + (escala - 1) * (vista5 === 'frente' ? 0.6 : 0.25);

  const ativa = ref >= 0 ? { ...plano[ref].a, de: anchor } : { ...plano[0].a, de: anchor };
  const x = pos !== undefined && anchor !== undefined ? pos - anchor : 0;
  const pecas = ref >= 0 ? pecaDe(ref) : {};
  const ciclo0 = ref >= 0 ? plano[ref].ini : plano[0].ini;

  if (W <= 0) {
    if (vista5) return { pose: { mistura: 0, escala, pouso, v5: { vista: vista5, enquadra: enquadraDe(s.scene, s.props), itens: [] } }, ...pecas, x, ativa, ciclo0 };
    const resto: PoseAtor | undefined = escala !== 1 || pouso.length ? { mistura: 0, escala, pouso } : undefined;
    return { pose: resto, ...pecas, x, ativa, ciclo0 };
  }
  const ps = plano
    .map((p, i) => ({ p, i, w: ws[i] }))
    .filter((e) => e.w > 0)
    .map(({ p, i, w }) => {
      const f = p.a.acao === 'andar' && p.traj ? fAndar[i] : frame - p.ini;
      const { fim: _fim, ...pose } = poseAt(p.a.acao, f, { ritmo: p.a.ritmo, reps: p.a.reps, laco: p.a.laco, dir: p.a.acao === 'andar' ? dir : 0, peca: pecaDe(i).peca });
      return { p: pose as PoseAtor, w };
    });
  const pose: PoseAtor = { ...misturar(ps, [12, -12]), acao: plano[ref].a.acao, mistura: Math.min(1, W), escala, pouso };
  if (vista5) {
    pose.v5 = {
      vista: vista5,
      enquadra: enquadraDe(s.scene, s.props),
      itens: plano
        .map((p, i) => ({ p, i, w: ws[i] }))
        .filter((e) => e.w > 0)
        .map(({ p, i, w }) => ({ acao: p.a.acao, f: p.a.acao === 'andar' && p.traj ? fAndar[i] : frame - p.ini, ritmo: p.a.ritmo, w, n: cicloDe(p.a.acao, p.a.ritmo) })),
    };
  }
  return { pose, ...pecas, x, ativa, ciclo0 };
}

/**
 * O chão que anda (fase 3, rodada 2): quem corre no lugar (ou vindo pra câmera) tem a câmera indo
 * junto — então é o CHÃO que passa. `v` = quanto a corrida vale no quadro (0..1, com as mesmas
 * entradas/saídas da pose) e `d` = os quadros-de-corrida acumulados até aqui (∑ v): o lugar anda
 * `d × a velocidade dele` (contínuo, sem pulo quando a corrida entra ou sai). Sem `correr` nas
 * ações, undefined (o chão fica parado como sempre).
 */
export function corridaDe(s: MS, acoes: AcaoSpec[] | undefined, frame: number): { v: number; d: number } | undefined {
  // boneco v5: andar NO LUGAR (sem `para`) também é vir pra câmera, de frente — o chão anda devagar
  // (sem isso ela andava parada no piso, e o "sai de casa e chega" lia esteira)
  const andaV5 = (a: AcaoPlano) => v5() && a.acao === 'andar' && a.para === undefined;
  if (!acoes?.some((a) => a.acao === 'correr' || andaV5(a))) return undefined;
  const corre = planoDe(s, acoes).filter((p) => p.a.acao === 'correr' || andaV5(p.a));
  // no tiro (v5, `rapido`) as raias passam mais rápido que no trote: é metade do que diz "arrancada"
  const vel = (p: Plano) => (p.a.acao === 'correr' ? (v5() && p.a.ritmo === 'rapido' ? 1.35 : 1) : 0.45);
  const vAt = (f: number) => Math.min(1, corre.reduce((a, p) => a + pesoDe(p, f) * vel(p), 0));
  const ini = Math.min(...corre.map((p) => p.ini));
  let d = 0;
  for (let f = Math.ceil(ini); f < frame; f++) d += vAt(f);
  // boneco v5 correndo DE FRENTE (vindo pra câmera): a câmera recua junto, então o chão RECUA pro fundo
  // (as marcas sobem). Descendo pra câmera, como no boneco antigo, ela lia "correndo de costas" (André)
  const frente = v5() && vistaDaCena(acoes.map((a) => a.acao), { trajeto: planoDe(s, acoes).some((p) => p.traj) }) === 'frente';
  return { v: vAt(frame), d: frente ? -d : d };
}

// ------------------------------------------------------------------ geometria (o mesmo caminho do hexa.tsx)

/** Braços sem pose (os do hexa.tsx), com o aceno do 'up' quando há `t`. */
const repouso = (arms: Arms, t?: number, seed = 0): Par => {
  const wave = arms === 'up' && t !== undefined ? Math.sin((t + seed * 7) / 5) * 10 : 0;
  return arms === 'down' ? [12, -12] : arms === 'up' ? [150 + wave, -150 - wave] : arms === 'out' ? [14, -78] : [0, 0];
};

/**
 * Quem não está fazendo nada nunca congela (rodada 2): o Ator respira (os ombros sobem um tico com a
 * respiração do Hexa) e o peso troca de pé a cada ~1,5 s — o corpo pende pro pé de apoio, o outro
 * joelho solta e a cabeça segura o eixo. Cansada: os braços pendem mais perto do corpo e ela suspira
 * (enche devagar, os ombros caem de uma vez), sem troca de pé. Nada fica 1 s parado (o buraco do
 * ritmo.mjs). Sem braços na cena (`arms` none), só o corpo. Fase pelo seed: dois figurantes nunca
 * trocam de pé juntos.
 */
const ocio = (t: number, seed: number, mood: Mood, arms: Arms): PoseAtor => {
  // a mesma respiração do Hexa (lifeOf): os ombros sobem quando o peito enche
  const r = Math.sin((t + seed * 13) / 17);
  const temBraco = arms !== 'none';
  if (mood === 'cansado') {
    // suspiro a cada ~1,8 s: enche devagar (o corpo e os ombros sobem, a cabeça levanta) e solta de uma
    // vez (os ombros CAEM, a cabeça pende) — o cansaço é o que se mexe; por baixo, um balanço lento
    const P = 54;
    const ph = ((((t + seed * 23) % P) + P) % P) / P;
    const enche = ph < 0.55 ? sm(ph / 0.55) : ph < 0.78 ? 1 - sm((ph - 0.55) / 0.23) : 0;
    const w = Math.sin((t + seed * 31) / 24);
    return {
      ...(temBraco ? { braco: [-6 + 5 * enche, 6 - 5 * enche] as Par } : {}),
      y: 2.4 - 3.4 * enche,
      inclina: 0.9 * w,
      cabeca: 3 - 3 * enche - 0.6 * w,
    };
  }
  // troca de pé: uma onda quadrada suavizada — troca em ~0,5 s e segura ~1 s (nunca mais de 1 s
  // parada); a cabeça vem uns quadros depois do corpo (segura o eixo), os braços balançam junto
  const P = 90;
  const T = 16;
  const onda = (k: number) => {
    const ph = (((k % P) + P) % P);
    return ph < P / 2 ? 2 * sm(ph / T) - 1 : 1 - 2 * sm((ph - P / 2) / T);
  };
  const w = onda(t + seed * 47);
  const wc = onda(t + seed * 47 - 5);
  // no meio de cada apoio, o corpo assenta (solta o ar: desce um tico, os ombros caem, a cabeça acena)
  const meio = sino(((((t + seed * 47) % (P / 2)) + P / 2) % (P / 2)), T + (P / 2 - T) / 2, 8);
  const solto = (k: number) => 2.4 * Math.max(0, k);
  return {
    ...(temBraco ? { braco: [1.6 * r - 2 * w - 1.8 * meio, -1.6 * r - 2 * w + 1.8 * meio] as Par } : {}),
    ergue: [solto(w), solto(-w)],
    y: 0.4 * r + 2.4 * meio,
    inclina: 1.6 * w,
    cabeca: -1.4 * wc + 0.4 * r + 2 * meio,
  };
};

/**
 * A pose que a identidade desenha: a da ação misturada com o repouso pela `mistura` (o resto da
 * PoseAtor fica de fora). `frente` liga sozinho quando a mão cruza pra perto do rosto (braço
 * direito > 98°, esquerdo < -98°): sem isso a mão some atrás do queixo.
 * Com `mood` (o Ator), o repouso é o ÓCIO (respira, troca o peso de pé): sem ação nenhuma, a pose é
 * só ele; entrando/saindo de uma ação, mistura. Sem `mood` (as medidas de geometria), o repouso
 * parado de antes.
 */
const efetiva = (pose: PoseAtor | undefined, arms: Arms, t?: number, seed?: number, mood?: Mood): PoseRig | undefined => {
  const m = pose ? (pose.mistura ?? 1) : 0;
  const idle = mood !== undefined && t !== undefined && m < 0.999 ? ocio(t, seed ?? 0, mood, arms) : null;
  if (!pose && !idle) return undefined;
  if (m <= 0.001 && !idle) return undefined;
  const r0 = repouso(arms, t, seed);
  const rest: Par = idle?.braco ? [r0[0] + idle.braco[0], r0[1] + idle.braco[1]] : r0;
  const b = pose?.braco ?? rest;
  const braco: Par = [lerp(rest[0], b[0], m), lerp(rest[1], b[1], m)];
  const par = (v: Par | undefined, i?: Par): Par => [lerp(i?.[0] ?? 0, v?.[0] ?? 0, m), lerp(i?.[1] ?? 0, v?.[1] ?? 0, m)];
  const num = (v: number | undefined, i?: number) => lerp(i ?? 0, v ?? 0, m);
  const out: PoseRig = {
    // sem braços na cena e sem braço na ação: continua sem braço (o ócio não inventa um)
    ...(pose?.braco || arms !== 'none' ? { braco } : {}),
    perna: par(pose?.perna, idle?.perna),
    ergue: par(pose?.ergue, idle?.ergue),
    y: num(pose?.y, idle?.y),
    inclina: num(pose?.inclina, idle?.inclina),
    cabeca: num(pose?.cabeca, idle?.cabeca),
    fecha: num(pose?.fecha),
    amassa: num(pose?.amassa),
    frente: [(pose?.frente?.[0] ?? false) || braco[0] < -98, (pose?.frente?.[1] ?? false) || braco[1] > 98],
  };
  // a corrida (só quando a ação tem: sem eles, o rig desenha como antes)
  if (pose?.dobra) out.dobra = par(pose.dobra);
  if (pose?.joelho) out.joelho = par(pose.joelho);
  if (pose?.chuta) out.chuta = par(pose.chuta);
  if (pose?.apoio) out.apoio = pose.apoio;
  if (pose?.cabelo !== undefined) out.cabelo = num(pose.cabelo);
  if (pose?.curva !== undefined) out.curva = num(pose.curva);
  return out;
};

type Vida = { lift: number; sx: number; sy: number };
const SEM_VIDA: Vida = { lift: 0, sx: 1, sy: 1 };

/** Um ponto do tronco (caixa 200×260) depois da vida (sobe-desce, respiração) e da pose. */
const noCorpo = ([px, py]: Par, pose: Pose | undefined, vida: Vida = SEM_VIDA): Par => {
  let x = 100 + (px - 100) * vida.sx;
  let y = 244 + (py + vida.lift - 244) * vida.sy;
  if (!pose) return [x, y];
  const a = pose.amassa ?? 0;
  x = 100 + (x - 100) * (1 + 0.08 * a);
  y = 252 + (y - 252) * (1 - 0.1 * a);
  const inc = ((pose.inclina ?? 0) * Math.PI) / 180;
  const dx = x - 100;
  const dy = y - 252;
  x = 100 + dx * Math.cos(inc) - dy * Math.sin(inc);
  y = 252 + dx * Math.sin(inc) + dy * Math.cos(inc) + (pose.y ?? 0) - 34 * Math.sin(Math.abs(inc));
  return [x, y];
};

/** Braço com cotovelo (a `dobra` da corrida): o de cima e o antebraço, como o hexa.tsx desenha. */
const BRACO_CIMA = 27;
const BRACO_BAIXO = 25;

/** O centro da mão na caixa, e o ângulo do braço (o do antebraço, com cotovelo). */
const maoUn = (eff: PoseRig | undefined, arms: Arms, lado: 0 | 1, vida?: Vida, t?: number, seed?: number) => {
  const ang = eff?.braco?.[lado] ?? repouso(arms, t, seed)[lado];
  const [px, py] = CORPO.ombro[lado];
  const r = (ang * Math.PI) / 180;
  const d = eff?.dobra?.[lado] ?? 0;
  if (eff?.dobra) {
    // o cotovelo a 27 un. do ombro; o antebraço dobra pra dentro (esquerdo −, direito +)
    const ex = px - BRACO_CIMA * Math.sin(r);
    const ey = py + BRACO_CIMA * Math.cos(r);
    const a2 = ang + (lado ? d : -d);
    const r2 = (a2 * Math.PI) / 180;
    const p = noCorpo([ex - BRACO_BAIXO * Math.sin(r2), ey + BRACO_BAIXO * Math.cos(r2)], eff, vida);
    return { p, ang: a2 + (eff?.inclina ?? 0) };
  }
  const p = noCorpo([px - CORPO.braco * Math.sin(r), py + CORPO.braco * Math.cos(r)], eff, vida);
  return { p, ang: ang + (eff?.inclina ?? 0) };
};

/** A escala do correr (em volta dos pés, que descem um tico) aplicada a um ponto da tela. */
const naEscala = ([X, Y]: Par, box: Box, escala = 1, desce = VEM_DESCE): Par => {
  if (escala === 1) return [X, Y];
  const fx = box.left + box.size / 2;
  const fy = box.top + box.size * 1.26;
  return [fx + (X - fx) * escala, fy + (escala - 1) * box.size * desce + (Y - fy) * escala];
};

/** Centro da mão `lado` (0 = esq, 1 = dir) na tela, e o ângulo do braço (graus, com a inclinação do corpo). */
export function maoNaTela(pose: Pose | undefined, arms: Arms, lado: 0 | 1, box: Box): { x: number; y: number; ang: number } {
  const pa = pose as PoseAtor | undefined;
  if (v5()) {
    const m = maoV5(pa, arms, lado);
    const k5 = box.size / 200;
    const [x5, y5] = naEscala([box.left + m.p[0] * k5, box.top + m.p[1] * k5], box, pa?.escala, pa?.desce);
    return { x: x5, y: y5, ang: m.ang };
  }
  const { p, ang } = maoUn(efetiva(pa, arms), arms, lado);
  const k = box.size / 200;
  const [x, y] = naEscala([box.left + p[0] * k, box.top + p[1] * k], box, pa?.escala, pa?.desce);
  return { x, y, ang };
}

/** Um ponto do corpo (CORPO.pontos) na tela, com a pose (a cabeça gira com `cabeca`). */
export function pontoNaTela(r: keyof typeof CORPO.pontos, box: Box, pose?: Pose): [number, number] {
  const pa = pose as PoseAtor | undefined;
  if (v5()) {
    const p5 = pontoV5(r, pa, 'down');
    const k5 = box.size / 200;
    return naEscala([box.left + p5[0] * k5, box.top + p5[1] * k5], box, pa?.escala, pa?.desce);
  }
  const eff = efetiva(pa, 'down');
  let pt = CORPO.pontos[r];
  if (eff?.cabeca && (r === 'cabeca' || r === 'rosto' || r === 'boca')) {
    const c = (eff.cabeca * Math.PI) / 180;
    const dx = pt[0] - 100;
    const dy = pt[1] - 142;
    pt = [100 + dx * Math.cos(c) - dy * Math.sin(c), 142 + dx * Math.sin(c) + dy * Math.cos(c)];
  }
  // a cabeça baixa na corrida (`curva`, como o hexa.tsx desenha)
  if (eff?.curva && (r === 'cabeca' || r === 'rosto' || r === 'boca')) pt = [pt[0], pt[1] + 5 * eff.curva];
  const p = noCorpo(pt, eff);
  const k = box.size / 200;
  return naEscala([box.left + p[0] * k, box.top + p[1] * k], box, pa?.escala, pa?.desce);
}

// ------------------------------------------------------------------ Ator

/**
 * Como cada peça se segura: tamanho (× o tamanho do Ator), onde a mão pega (fração da caixa da peça)
 * e se gira com o braço. O copo é de verdade (mais ou menos metade do rosto), não o de 150 px da r2:
 * na boca ele cobre a boca e o queixo, nunca os olhos.
 */
const PEGA: Record<string, { k: number; g: Par }> = {
  // a mão no pé do copo, do lado de dentro: no peito o copo fica no meio do corpo; na boca, inclinado
  // 16°, a superfície da bebida cai na boca (a mão não alcança mais à direita: o braço é reto)
  copo: { k: 0.3, g: [0.25, 0.72] },
  'copo-agua': { k: 0.3, g: [0.25, 0.72] },
  'copo-suco': { k: 0.3, g: [0.25, 0.72] },
  caneca: { k: 0.3, g: [0.3, 0.7] },
  coqueteleira: { k: 0.32, g: [0.5, 0.6] },
  pote: { k: 0.3, g: [0.5, 0.6] },
  peso: { k: 0.3, g: [0.5, 0.5] },
};
/** Copos com colher: subindo pra boca, a colher afunda no copo (senão ela cutuca o olho). */
const COM_COLHER = new Set(['copo', 'copo-agua', 'copo-suco']);
const PEGA_PADRAO = { k: 0.36, g: [0.4, 0.62] as Par };

export type AtorProps = {
  t: number;
  /** centro x na tela */
  x: number;
  /** linha dos pés na tela */
  y: number;
  size: number;
  /** a pose (de poseDe/poseAt); uma `Pose` simples também serve */
  pose?: PoseAtor;
  /** figurante em laço: roda poseAt(laco, t + fase) sem parar */
  laco?: AcaoKind;
  fase?: number;
  mood?: Mood;
  since?: number;
  seed?: number;
  skin?: string;
  /** a roupa (o violeta da marca, pra protagonista) */
  accent?: string;
  /** a cor da peça da mão (a cor da área: tampa do pote, da coqueteleira); sem = `accent` */
  corPeca?: string;
  cap?: string;
  /** braços sem pose / do repouso (default: 'out' com peça na mão, 'down' sem) */
  arms?: Arms;
  /** a peça na mão direita */
  mao?: { p: PieceName; progress?: number };
  /** a mesma peça nas duas mãos (o halter do levantar) */
  maos?: PieceName;
  figurante?: boolean;
  halo?: boolean | 'cabeca';
  /** poeira no pé que pousa (correr); default: sim */
  poeira?: boolean;
  /** boneco v5: 0..1, o corpo de vidro (cena `dentro`, plano corpo) — a Pessoa v5 desenha o vidro */
  vidro?: number;
};

/** A cor da pele que a Pessoa vai usar (pra mão por cima da peça). */
const PELE_PADRAO = '#F2C9A0';
const SHADE = 'rgba(10,14,38,0.28)';

/**
 * A pessoa fazendo: a Pessoa da identidade com os pés em (x, y), a pose, a peça na mão (com a mão
 * POR CIMA da peça) e a poeira do correr. Figurante: roupa apagada (FIG_ACCENT), pele pelo seed,
 * filtro só de saturação (não escurece pele), sem halo.
 */
export const Ator: React.FC<AtorProps> = ({
  t,
  x,
  y,
  size,
  pose,
  laco,
  fase = 0,
  mood = 'ok',
  since,
  seed = 0,
  skin,
  accent = C.violet,
  corPeca,
  cap,
  arms,
  mao,
  maos,
  figurante = false,
  halo,
  poeira = true,
  vidro,
}) => {
  const pa: PoseAtor | undefined = pose ?? (laco ? poseLaco(laco, t + fase) : undefined);
  const armsIn: Arms = arms ?? (mao || maos ? 'out' : 'down');
  // com o humor, o repouso é o ócio (respira, troca o peso de pé): sem ação, ela nunca congela
  const eff = efetiva(pa, armsIn, t, seed, mood);
  const k = size / 200;
  const box: Box = { left: x - size / 2, top: y - size * 1.26, size };
  const escala = pa?.escala ?? 1;
  const desce = pa?.desce ?? VEM_DESCE;
  const drop = (escala - 1) * size * desce;
  const pele = skin ?? (figurante ? SKINS[seed % SKINS.length] : PELE_PADRAO);
  const tinta = figurante ? FIG_ACCENT : accent;
  const tintaPeca = figurante ? FIG_ACCENT : (corPeca ?? accent);
  // a vida do tronco (a mão de verdade sobe e desce com ela)
  const vida = vidaDe(t, seed, mood, since ?? t);

  const pecaEm = (name: PieceName, lado: 0 | 1, progress?: number) => {
    const { p, ang } = maoUn(eff, armsIn, lado, vida, t, seed);
    const hx = box.left + p[0] * k;
    const hy = box.top + p[1] * k;
    const pg = PEGA[name] ?? PEGA_PADRAO;
    const ps = size * pg.k;
    const [w, h] = pieceBox(name, ps);
    const gx = w * pg.g[0];
    const gy = h * pg.g[1];
    // o halter: deitado com o braço pra baixo, em pé com o braço erguido (a barra nunca aponta pro rosto)
    const giro = name === 'peso' ? 90 * sm((Math.abs(ang) - 40) / 40) : lado === 1 ? (pa?.giro ?? 0) * (pa?.mistura ?? 1) : 0;
    const colher = lado === 1 && COM_COLHER.has(name) ? 7 * sm((ang - 72) / 26) : 0;
    // o braço que cruza o tronco vai claro no hexa (sem a sombra do lado direito): a mão também
    const cruza = lado === 1 ? ang > 30 && ang < 150 : ang < -30 && ang > -150;
    return (
      <React.Fragment key={`${name}-${lado}`}>
        <div
          style={{
            position: 'absolute',
            left: hx - gx,
            top: hy - gy,
            transformOrigin: `${gx}px ${gy}px`,
            transform: giro ? `rotate(${giro.toFixed(2)}deg)` : undefined,
            clipPath: colher > 0.05 ? `polygon(-60% ${colher.toFixed(2)}%, 160% ${colher.toFixed(2)}%, 160% 160%, -60% 160%)` : undefined,
          }}
        >
          <Peca name={name} t={t} size={ps} accent={tintaPeca} progress={progress} />
        </div>
        {/* a mão por cima da peça: os dedos fecham em volta (o mesmo círculo da mão do hexa) */}
        <svg style={{ position: 'absolute', left: hx - 10 * k, top: hy - 10 * k, overflow: 'visible' }} width={20 * k} height={20 * k} viewBox="-10 -10 20 20">
          <circle r={9.5} fill={pele} />
          {lado === 1 && !cruza ? <circle r={9.5} fill={SHADE} opacity={0.35} /> : null}
        </svg>
      </React.Fragment>
    );
  };

  // boneco v5: a peça que o estilo não sabe segurar vai no centro da mão dele, sem a mão por cima
  const pecaV5 = (name: PieceName, progress?: number) => {
    const m = maoV5(pa, armsIn, 1);
    const pg = PEGA[name] ?? PEGA_PADRAO;
    const ps = size * pg.k;
    const [w, h] = pieceBox(name, ps);
    return (
      <div key={`v5-${name}`} style={{ position: 'absolute', left: box.left + m.p[0] * k - w * pg.g[0], top: box.top + m.p[1] * k - h * pg.g[1] }}>
        <Peca name={name} t={t} size={ps} accent={tintaPeca} progress={progress} />
      </div>
    );
  };

  // poeira: o pé que pousa levanta um tufo — 4 bolotas claras que abrem pra fora e pra trás, crescem
  // e somem em POEIRA quadros (fica no chão, não segue o corpo; cresce com a escala de quem vem)
  const dust =
    poeira && pa?.pouso?.length
      ? pa.pouso.map(({ pe, f }, i) => {
          const [fx, fy] = naEscala([box.left + (pe ? 117.5 : 82.5) * k, y], box, escala, desce);
          const e = out2(f / POEIRA);
          const o = 0.3 * (1 - sm(f / POEIRA)) * Math.min(1, (f + 1) / 2);
          const lado = pe ? 1 : -1;
          const sk = k * escala;
          const bolas: [number, number, number][] = [
            [-16 - 22 * e, -3 - 4 * e, 6 + 7 * e],
            [lado * (4 + 6 * e), -6 - 12 * e, 5 + 6 * e],
            [16 + 22 * e, -3 - 4 * e, 6 + 7 * e],
            [lado * (20 + 30 * e), -1 - 2 * e, 4 + 4 * e],
          ];
          return (
            <g key={i} opacity={o} fill={C.mid}>
              {/* borda macia: um halo mais claro em volta de cada bolota (tufo, não bolinha de sabão) */}
              {bolas.map(([dx, dy, r], j) => (
                <React.Fragment key={j}>
                  <ellipse cx={fx + dx * sk} cy={fy + dy * sk} rx={r * 1.45 * sk} ry={r * 1.05 * sk} opacity={0.35} />
                  <ellipse cx={fx + dx * sk} cy={fy + dy * sk} rx={r * sk} ry={r * 0.75 * sk} opacity={0.6} />
                </React.Fragment>
              ))}
            </g>
          );
        })
      : null;

  return (
    <div style={{ position: 'absolute', inset: 0, filter: figurante ? (v5() ? 'saturate(0.6) brightness(0.92)' : 'saturate(0.75)') : undefined }}>
      {dust ? (
        <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
          {dust}
        </svg>
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: `${x}px ${y}px`,
          transform: escala !== 1 ? `translate(0px, ${drop.toFixed(2)}px) scale(${escala.toFixed(4)})` : undefined,
        }}
      >
        <div style={{ position: 'absolute', left: box.left, top: box.top }}>
          <Pessoa
            t={t}
            size={size}
            mood={mood}
            since={since}
            seed={seed}
            {...(skin || figurante ? { skin: pele } : {})}
            accent={tinta}
            cap={cap}
            arms={armsIn}
            pose={v5() ? (pa ?? { mistura: 0 }) : eff}
            halo={figurante ? false : halo}
            {...(v5() ? { segura: mao?.p ?? maos, seguraDuas: !!maos, figurante, vidro } : {})}
          />
        </div>
        {v5() ? (
          // boneco v5: halter e copo a mão do estilo desenha (os dedos por cima); o resto vai na mão sem a bolinha
          <>
            {mao && !SEGURA_V5[mao.p] ? pecaV5(mao.p, mao.progress) : null}
          </>
        ) : (
          <>
            {maos ? [pecaEm(maos, 0), pecaEm(maos, 1)] : null}
            {mao ? pecaEm(mao.p, 1, mao.progress) : null}
          </>
        )}
      </div>
    </div>
  );
};
