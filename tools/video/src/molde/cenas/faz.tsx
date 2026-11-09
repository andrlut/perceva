// Cena `faz` (fase 3): a pessoa FAZENDO o que a voz diz — uma sequência de 1–4 passos (ações) num
// lugar, presos às deixas, com rótulo por passo, o Medidor (o tanque pequeno) que gasta um gole por
// passo e até 3 figurantes do `elenco`, cada um num esforço diferente.
// Contrato em design.json → synth.blocks "faz", com os cortes do PLANO-FINAL: sem lugar por passo
// (montagem cortada), sem esteira, sem lapso, sem `trocar`.
//
//  - Ela: o Ator de 400 px (360 com elenco), pés em y 1300; x = o `de` do passo ativo (ou 540), e
//    só o `andar` atravessa o quadro — `correr` é no lugar, ou vindo pra câmera com `para` (acao.tsx).
//  - Passos: cada um começa na deixa (o 1º sem deixa, com a fala) e vale até a deixa do próximo ou
//    o seu `ate`. A peça sai da mão no `ate` (ou quando o passo seguinte não a usa): o halter CAI e
//    fica no chão; o resto some na mão.
//  - Medidor (acabamento): AO LADO DELA, do lado `lado`, 260 × 351 px, dourado (o mesmo tanque do
//    vídeo), na altura da cabeça dela (o centro da ficha no topo da cabeça, nunca acima de y 330):
//    fora do braço erguido do levantar e do salto. Cada passo que não é `pronta` solta um jato pela
//    válvula 4 q depois da deixa (22 q, os grãos caindo até o pé da ficha) e tira `gasta` (default
//    0,07) do nível. A ficha é da TELA (fora do zoom do plano fechado).
//  - `plano: "fechado"` (acabamento): a câmera perto — o mundo da cena (lugar, ela, figurantes,
//    peças) cresce 1,35× em volta de (540, 1014), sem redesenhar nada: os pés dela vão de 1300 a
//    1400 (logo acima da faixa da legenda), ela com 540 px na tela (520 com elenco), os figurantes
//    juntos. O `x` dos figurantes vira o x NA TELA (o roteiro pensa na tela: 160 e 900 ficam ao
//    lado dela, não cortados na borda). O correr que vem pra câmera cresce até 1,2 (não 1,25) e os
//    pés descem 1/2 do normal: a cabeça fica longe da sobrancelha e os pés fora da legenda.
//    Rótulos e medidor são achados na tela.
//  - Elenco: atrás dela, pés em y 1170, ≥ 200 px (default 240), pele e roupa pelo seed, filtro só de
//    saturação (não escurece pele). Cada um fica em `pronta` até a deixa, faz a ação até o `ate` e
//    volta a `pronta`. `reps`/`ritmo` valem como nos passos; saltar/levantar SEM `reps` repetem em
//    laço até o `ate` (sem `ate`, até o fim da fala — figurante não congela). Nunca cruza o corpo
//    dela: quem cairia em cima é empurrado pro lado. No parque, quem salta perto do caixote da
//    estação SOBE nele (e desce na rep seguinte: sobe, desce, sobe…).
//  - O chão anda (rodada 2): enquanto um passo `correr` vale, o lugar recebe `geo.anda`
//    (acao.tsx → corridaDe) e as raias/juntas do piso descem pra câmera.
//  - Rótulos: os da cena + o `rotulo` de cada passo (escrito na deixa do passo). A cena acha a vaga
//    de cada um (fora do medidor, do corpo dela no salto e dos figurantes) e põe as vagas no `busy`
//    do cenário: nada do lugar fica embaixo do medidor nem das palavras.
//  - turn/to: o humor vira na deixa; chime e brilho só pro feliz (focado vira sem brilho).
//  - Sem passos: o Ator parado no lugar.
//
// Ciclo de import: este arquivo importa do ../scenes e o scenes.tsx importa este. Só use o que vem
// de ../scenes DENTRO do componente (nunca no topo do módulo).
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ramp, sai } from '../../components';
import { Ator, VEM_DESCE, VEM_MAX, cicloDe, corridaDe, maoNaTela, pontoNaTela, poseDe, type AcaoPlano, type PoseAtor } from '../../elenco/acao';
import type { Zoom } from '../scenes';
import { Brilho } from '../../elenco/cast';
import { SHIRTS, SKINS } from '../../elenco/cenario';
import { Medidor } from '../../elenco/reservatorio';
import { useIdentity } from '../../identidade/context';
import { CORPO, type Arms } from '../../identidade/types';
import { C } from '../../theme';
import { cue } from '../../timeline';
import { free, hits, type EnvGeo, type Rect } from '../ambientes';
import { PARQUE_POSTOS, parque } from '../lugares/parque';
import { Peca, pieceBox } from '../Peca';
import { Rotulo, achaVaga, bochechaDoLado, cabecaDe, pontaNaCabeca, rotuloRect, useFontesDoRotulo, type Vaga } from '../rotulo';
import { Stage, at, useAccent, useProtagonista, useSpr, type MS } from '../scenes';
import { Sfx } from '../sfx';
import type { AcaoKind, AcaoSpec, Extra, MedidorSpec, Mood, Passo, PieceName, Regiao, RotuloSpec } from '../spec';

/** Pés dela e dos figurantes; tamanhos; a ficha do Medidor (largura; altura = 1,35 ×). */
const FAZ = {
  ground: 1300,
  size: 400,
  sizeElenco: 360,
  fundo: 1170,
  extra: 240,
  extraMin: 200,
  /** a ficha do Medidor (na tela): largura, margem da borda, o mais alto que ela sobe */
  medidor: { w: 260, margem: 40, topo: 330 },
  /**
   * O plano fechado: o mundo da cena cresce `k` em volta de `o` (pés 1300 → 1400 na tela); ela com
   * 400 un. (385 com elenco: 540/520 px na tela); o correr pra câmera até `vem` com os pés descendo
   * `desce` (× size × (escala − 1)).
   */
  fechado: { k: 1.35, o: [540, (1.35 * 1300 - 1400) / 0.35] as [number, number], size: 400, sizeElenco: 385, vem: 1.2, desce: 0.2 },
};

// o zoom do plano fechado (o mesmo do Stage: o mundo da cena → a tela, e a volta)
const zPt = (z: Zoom | undefined, [x, y]: [number, number]): [number, number] => (z ? [z.o[0] + (x - z.o[0]) * z.k, z.o[1] + (y - z.o[1]) * z.k] : [x, y]);
const zRect = (z: Zoom | undefined, r: Rect): Rect => (z ? [...zPt(z, [r[0], r[1]]), ...zPt(z, [r[2], r[3]])] : r);
const unPt = (z: Zoom | undefined, [x, y]: [number, number]): [number, number] => (z ? [z.o[0] + (x - z.o[0]) / z.k, z.o[1] + (y - z.o[1]) / z.k] : [x, y]);
const unRect = (z: Zoom | undefined, r: Rect): Rect => (z ? [...unPt(z, [r[0], r[1]]), ...unPt(z, [r[2], r[3]])] : r);
/** O jato do Medidor dura mais que o do tanque grande (12 q): na ficha, o gole tem que dar pra ver. */
const JATO_MED = 22;
/** Do topo da cabeça aos pés, em un. da caixa (o cabelo começa em ~14 de 260; os pés em 252). */
const ALTURA_UN = 238;

/**
 * A lista das palavras (rótulos sem posição nem seta, os dos passos inclusive): uma embaixo da outra,
 * na ordem da fala, na MESMA coluna — 14 px entre cápsulas (100 px de linha a linha com a cápsula de
 * uma linha, 86). A coluna é escolhida pra cena inteira: o centro no alto; não cabendo (ela saltando
 * na escala de quem veio pra câmera ocupa o alto), o lado sem o medidor; por último embaixo do medidor.
 * No plano fechado a lista começa em y 340 e a coluna do lado tem 220 px (ela ocupa o meio do quadro).
 * Em cada coluna tenta 54, 48 e 44 px. A palavra que entra quando a anterior SAI (`out` na deixa
 * dela) fica no lugar dela (troca); senão entra embaixo da última que está na tela.
 */
const LISTA = { y: 400, yFechado: 340, passo: 96, folga: 14, topo: 290, fundo: 1340, margem: 36, coluna: 300, colunaFechado: 220, sizes: [54, 48, 44] };

const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sm = (x: number) => {
  const k = cl(x);
  return k * k * (3 - 2 * k);
};
const repsDe = (p: Pick<AcaoSpec, 'reps'>) => Math.max(1, Math.min(4, Math.round(p.reps ?? 1)));

// ------------------------------------------------------------------ quando cada passo começa

/** As ações em laço (rodam até a próxima ou o `ate`) — o mesmo `laco` do CICLO do acao.tsx. */
const LACO = new Set<AcaoKind>(['pronta', 'andar', 'correr', 'mexer']);
/** Passo sem deixa depois de um laço sem `ate`: 1,5 s depois (o LACO_SEM_DEIXA do acao.tsx). */
const LACO_SEM_DEIXA = 45;

/** Quadro local em que cada passo começa (a mesma regra do poseDe). */
const iniciosDe = (s: MS, passos: AcaoSpec[]) => {
  const ini: number[] = [];
  passos.forEach((p, i) => {
    let f: number;
    if (p.cue) f = cue(s, p.cue);
    else if (i === 0) f = s.lead;
    else {
      const q = passos[i - 1];
      f = q.ate ? cue(s, q.ate) : LACO.has(q.acao) ? ini[i - 1] + LACO_SEM_DEIXA : ini[i - 1] + cicloDe(q.acao, q.ritmo) * repsDe(q);
    }
    ini.push(i ? Math.max(f, ini[i - 1] + 2) : f);
  });
  return ini;
};

// ------------------------------------------------------------------ o medidor

/** O gole: o nível desce em 10 q (ease-out) a partir de 4 q depois da deixa, junto com o jato. */
const GOLE = { atraso: 4, desce: 10, padrao: 0.07 };

/** Nível e fase do jato no quadro: um gole por passo começado (o `pronta` não gasta). */
const medidorAt = (m: MedidorSpec, goles: number[], frame: number) => {
  const gasta = m.gasta ?? GOLE.padrao;
  let nivel = cl(m.nivel);
  let jato = 0;
  for (const g of goles) {
    const a = g + GOLE.atraso;
    if (frame < a) continue;
    const k = cl((frame - a) / GOLE.desce);
    nivel -= gasta * (1 - (1 - k) ** 3);
    if (frame < a + JATO_MED) jato = (frame - a) / JATO_MED;
  }
  return { nivel: Math.max(0, nivel), jato };
};

// ------------------------------------------------------------------ onde ela pode estar

/** A faixa de x que ela percorre na cena inteira, a escala máxima (correr pra câmera) e se salta. */
const faixaDe = (passos: Passo[], vemMax = VEM_MAX) => {
  let cur = passos[0]?.de ?? 540;
  const xs = [cur];
  let esc = 1;
  for (const p of passos) {
    if (p.de !== undefined) {
      cur = p.de;
      xs.push(cur);
    }
    if (p.acao === 'andar' && p.para !== undefined) {
      cur = p.para;
      xs.push(cur);
    }
    // as arrancadas pra câmera dividem o caminho até VEM_MAX (acao.tsx): o espaço é o do fim
    if (p.acao === 'correr' && p.para !== undefined) esc = vemMax;
  }
  const dentro = xs.map((x) => cl(x, 0, 1080));
  return { x0: Math.min(...dentro), x1: Math.max(...dentro), esc, salta: passos.some((p) => p.acao === 'saltar') };
};

/**
 * Tudo que um corpo de pé em `y` ocupa entre x0 e x1, com os braços (`meia` × size pra cada lado) e
 * o salto (os pés sobem ~94 un.): o que um rótulo nunca cobre.
 */
const corpoRect = (x0: number, x1: number, y: number, size: number, esc = 1, salta = false, meia = 0.45, desce = VEM_DESCE): Rect => {
  const k = (size / 200) * esc;
  const drop = (esc - 1) * size * desce;
  return [x0 - meia * size * esc, y + drop - (252 + (salta ? 94 : 0)) * k, x1 + meia * size * esc, y + drop + 12];
};

// ------------------------------------------------------------------ o elenco

/**
 * A estação do parque (barra fixa + caixote), em coordenadas do cenário — a mesma ESTACAO de
 * lugares/parque.tsx (que não a exporta). Quem salta perto do caixote só sobe nele se a estação
 * está desenhada (fora do `clear` dela e sem nada da cena em cima, a regra do `decor`).
 */
const ESTACAO_PARQUE: Rect = [8, 780, 334, 1102];
/** O chão na frente do caixote (cenário): a frente dele vai até y 1098. */
const CAIXOTE_CHAO = 1104;

type Fig = {
  e: Extra;
  x: number;
  y: number;
  size: number;
  plano: AcaoPlano[];
  mao?: PieceName;
  maos?: PieceName;
  /** salto no caixote: do chão (y) ao tampo (topo) no voo da 1ª rep, de volta ao chão na 2ª, e assim
   *  por diante; `a` = quadro do começo do salto, `n` = quadros por rep, `reps` = quantas (Infinity em laço),
   *  `fim` = o `ate` dele (Infinity sem) */
  caixote?: { topo: number; a: number; n: number; reps: number; fim: number };
};

/**
 * O plano de um figurante: `pronta` até a deixa, a ação até o `ate` e `pronta` de novo. `ritmo` e
 * `reps` valem como nos passos dela. Saltar/levantar sem `reps` repetem EM LAÇO até o `ate` (a última
 * rep não volta pra `pronta` antes da deixa final); sem `ate`, até o fim da fala. Andar com `para` e
 * sem `ate` anda até o fim da fala.
 */
const planoExtra = (e: Extra): AcaoPlano[] => {
  // figurante corre NO LUGAR (nunca na mesma direção que ela: leria corrida, comparação); só o andar atravessa
  const trajeto = e.acao === 'andar' ? { de: e.x, para: e.para } : e.acao === 'correr' ? { de: e.x } : {};
  const laco = !LACO.has(e.acao) && e.reps === undefined;
  const acao: AcaoPlano = {
    acao: e.acao,
    cue: e.cue,
    ate: e.ate,
    ...(e.ritmo ? { ritmo: e.ritmo } : {}),
    ...(e.reps !== undefined ? { reps: e.reps } : {}),
    ...(laco ? { laco: true } : {}),
    ...trajeto,
  };
  const anda = e.acao === 'andar' && e.para !== undefined && !e.ate;
  // em laço sem `ate`, ele não para (sem a `pronta` do fim: ela entraria 1,5 s depois)
  const semFim = anda || ((laco || LACO.has(e.acao)) && !e.ate);
  return [{ acao: 'pronta' }, acao, ...(semFim ? [] : [{ acao: 'pronta' } as AcaoPlano])];
};

/**
 * Onde estão os pés de quem salta no caixote: a rep par sobe do chão ao tampo, a ímpar desce do tampo
 * ao chão, sempre durante o voo do salto (5/22 a 18/22 da rep: o poseAt do saltar). O `ate` corta a
 * pose, não o lugar — quem estava em cima fica em cima.
 */
const caixoteY = (c: NonNullable<Fig['caixote']>, chao: number, frame: number) => {
  const f = frame - c.a;
  if (f <= 0) return chao;
  // a última rep que decola antes do `ate` (a que o `ate` pega ainda no agachamento não conta)
  const gFim = c.fim - c.a;
  const ultima = Math.min(c.reps - 1, Number.isFinite(gFim) ? Math.floor(gFim / c.n) - (gFim % c.n < (5 * c.n) / 22 ? 1 : 0) : Infinity);
  if (ultima < 0) return chao;
  const r = Math.floor(f / c.n);
  const rep = Math.min(ultima, r);
  // passou da última: pousado onde ela deixou
  const g = r > rep ? c.n : f - rep * c.n;
  const k = sm((g - (5 * c.n) / 22) / ((13 * c.n) / 22));
  const [de, para] = rep % 2 ? [c.topo, chao] : [chao, c.topo];
  return de + (para - de) * k;
};

// ------------------------------------------------------------------ a peça que sai da mão

/** Tamanho (× o tamanho do Ator) e onde a mão pega, por peça — o PEGA do acao.tsx (resumido). */
const PEGA: Record<string, { k: number; g: [number, number] }> = {
  peso: { k: 0.3, g: [0.5, 0.5] },
  coqueteleira: { k: 0.32, g: [0.5, 0.6] },
  copo: { k: 0.3, g: [0.25, 0.72] },
  'copo-agua': { k: 0.3, g: [0.25, 0.72] },
  'copo-suco': { k: 0.3, g: [0.25, 0.72] },
};
const PEGA_PADRAO = { k: 0.3, g: [0.5, 0.6] as [number, number] };
/** O halter cai e FICA no chão (largou); o resto some na mão em 8 q. */
const CAI = { queda: 9, some: 8 };

type Largada = { p: PieceName; lado: 0 | 1; at: number };
type Pecas = { mao?: PieceName; maos?: PieceName };

// ------------------------------------------------------------------ a cena

export const Faz: React.FC<{ s: MS }> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const accent = useAccent();
  const idHalo = !!useIdentity().halo;
  // a vaga de cada rótulo é medida na fonte de verdade (o quadro espera ela carregar)
  useFontesDoRotulo();
  const pr = s.props ?? {};
  const passos: Passo[] = (pr.passos ?? []).slice(0, 4);
  const elenco = (pr.elenco ?? []).slice(0, 3);
  const corte = pr.transicao === 'corte';

  // humor: vira na deixa `turn`; chime e brilho só pro feliz
  const turnAt = at(s, pr.turn, 1e9);
  const turned = frame >= turnAt;
  const to: Mood = pr.to ?? 'feliz';
  const mood: Mood = turned ? to : (pr.mood ?? 'ok');
  const since = pr.turn ? (turned ? frame - turnAt : frame) : undefined;
  const feliz = !!pr.turn && to === 'feliz';

  // ---------------------------------------------------------------- ela
  const who = useProtagonista();
  // plano fechado: a câmera perto (o mundo da cena com zoom); a cena mede no mundo e acha na tela
  const z: Zoom | undefined = pr.plano === 'fechado' ? { k: FAZ.fechado.k, o: FAZ.fechado.o } : undefined;
  const size = z ? (elenco.length ? FAZ.fechado.sizeElenco : FAZ.fechado.size) : elenco.length ? FAZ.sizeElenco : FAZ.size;
  const ground = FAZ.ground;
  const vemMax = z ? FAZ.fechado.vem : VEM_MAX;
  const desce = z ? FAZ.fechado.desce : VEM_DESCE;
  const ini = iniciosDe(s, passos);
  const faixa = faixaDe(passos, vemMax);
  /** A pose dela no quadro: no plano fechado o correr pra câmera cresce até `vem` (não VEM_MAX) e os pés descem menos. */
  const poseDela = (f: number): ReturnType<typeof poseDe> => {
    const p = poseDe(s, passos, f);
    if (!z || !p.pose) return p;
    const e = p.pose.escala ?? 1;
    return { ...p, pose: { ...p.pose, escala: 1 + ((e - 1) * (vemMax - 1)) / (VEM_MAX - 1), desce } };
  };
  const boxAt = (pd: ReturnType<typeof poseDe>) => {
    const x = (pd.ativa?.de ?? 540) + pd.x;
    return { x, box: { left: x - size / 2, top: ground - size * 1.26, size } };
  };

  /** As peças na mão no quadro `f`: as do passo ativo, menos a do passo que já passou do `ate`. */
  const pecasAt = (f: number): Pecas & { pd: ReturnType<typeof poseDe> } => {
    const pd = poseDela(f);
    let k = -1;
    for (let i = 0; i < passos.length; i++) if (f >= ini[i]) k = i;
    const solta = k >= 0 && !!passos[k].ate && f >= cue(s, passos[k].ate!);
    return solta ? { pd } : { pd, mao: pd.peca, maos: pd.maos };
  };
  const agora = pecasAt(frame);
  const pd = agora.pd;
  const { x } = boxAt(pd);
  const box = { left: x - size / 2, top: ground - size * 1.26, size };
  const armsDe = (p: Pecas): Arms | undefined => pr.arms ?? (p.maos ? 'down' : undefined);

  // a peça que sai da mão: no `ate` do passo, ou quando o passo seguinte não a usa
  const largadas: Largada[] = [];
  const trocas = [...passos.flatMap((p) => (p.ate ? [cue(s, p.ate)] : [])), ...ini.slice(1)];
  for (const t0 of trocas) {
    for (let f = t0 - 1; f <= t0 + 8; f++) {
      const a = pecasAt(f - 1);
      const b = pecasAt(f);
      const antes = [...(a.maos ? [[a.maos, 0], [a.maos, 1]] : []), ...(a.mao ? [[a.mao, 1]] : [])] as [PieceName, 0 | 1][];
      const depois = new Set([...(b.maos ? [`${b.maos}:0`, `${b.maos}:1`] : []), ...(b.mao ? [`${b.mao}:1`] : [])]);
      const foi = antes.filter(([p, l]) => !depois.has(`${p}:${l}`));
      if (foi.length) {
        for (const [p, lado] of foi) if (!largadas.some((g) => g.p === p && g.lado === lado && g.at === f)) largadas.push({ p, lado, at: f });
        break;
      }
    }
  }

  // ---------------------------------------------------------------- o medidor (na tela, ao lado dela)
  const m = pr.medidor;
  const medW = FAZ.medidor.w;
  const medH = medW * 1.35;
  const mx = m?.lado === 'esquerda' ? FAZ.medidor.margem : 1080 - FAZ.medidor.margem - medW;
  // na altura da cabeça dela (de pé, na escala máxima do correr): o centro da ficha no topo da
  // cabeça — acima do halter erguido e do braço aberto do agachamento, ao lado do rosto
  const topoCabeca = zPt(z, [540, ground + (faixa.esc - 1) * size * desce - ALTURA_UN * (size / 200) * faixa.esc])[1];
  const my = Math.max(FAZ.medidor.topo, Math.round(topoCabeca - medH / 2));
  const medRect: Rect | null = m ? [mx, my, mx + medW, my + medH] : null;
  const goles = passos.map((p, i) => (p.acao === 'pronta' ? null : ini[i])).filter((g): g is number => g !== null);
  const med = m ? medidorAt(m, goles, frame) : null;

  // ---------------------------------------------------------------- o cenário
  const clearMeia = 0.3 * size * faixa.esc + 40;
  const clear: [number, number] = [Math.max(0, faixa.x0 - clearMeia), Math.min(1080, faixa.x1 + clearMeia)];
  // o corpo dela no ar (o salto mais alto, na escala do correr pra câmera): no voo os braços estão no
  // peito (o salto de atleta), então a largura é a da cabeça e do tronco (0,3), não a dos braços abertos
  const ela = corpoRect(faixa.x0, faixa.x1, ground, size, faixa.esc, faixa.salta, 0.3, desce);

  // ---------------------------------------------------------------- o elenco
  const amb = pr.ambiente;
  const shiftParque = ground - parque.depth - 1000;
  const estacao: Rect = [ESTACAO_PARQUE[0], ESTACAO_PARQUE[1] + shiftParque, ESTACAO_PARQUE[2], ESTACAO_PARQUE[3] + shiftParque];
  const corpoDela: [number, number] = [faixa.x0 - 0.36 * size * faixa.esc, faixa.x1 + 0.36 * size * faixa.esc];
  // no plano fechado o x do figurante é o x NA TELA (o roteiro pensa na tela): o mundo leva de volta
  const naCena = (xt: number) => unPt(z, [xt, 0])[0];
  const figs: Fig[] = elenco.map((e0) => {
    const e: Extra = z ? { ...e0, x: naCena(e0.x), ...(e0.para !== undefined ? { para: naCena(e0.para) } : {}) } : e0;
    const fs = Math.max(FAZ.extraMin, e.size ?? FAZ.extra);
    let fx = e.x;
    // nunca cruza o corpo dela: quem cairia em cima vai pro lado mais perto (sem sair do quadro)
    const meia = 0.36 * fs;
    if (!(e.acao === 'andar' && e.para !== undefined) && fx + meia > corpoDela[0] && fx - meia < corpoDela[1]) {
      const esq = corpoDela[0] - meia - 8;
      const dir = corpoDela[1] + meia + 8;
      fx = cl(Math.abs(fx - esq) <= Math.abs(fx - dir) ? esq : dir, 0.3 * fs, 1080 - 0.3 * fs);
    }
    // plano fechado: o figurante inteiro (com o halter no alto) fica DENTRO do quadro — vale mais que
    // a folga do corpo dela (ele está atrás: ela cobre um ombro dele, nunca o contrário)
    if (z && !(e.acao === 'andar' && e.para !== undefined)) {
      const borda = (e.acao === 'levantar' ? 0.6 : 0.42) * fs * z.k + 12;
      fx = naCena(cl(zPt(z, [fx, 0])[0], borda, 1080 - borda));
    }
    // o trajeto parte de onde ele ficou (o correr ancora no `de`: sem isso ele pularia de volta pro x do roteiro)
    const plano = planoExtra({ ...e, x: fx });
    const pecas: Pick<Fig, 'mao' | 'maos'> = e.acao === 'levantar' ? { maos: 'peso' } : e.acao === 'mexer' || e.acao === 'beber' ? { mao: pr.holding ?? 'copo-agua' } : {};
    const fig: Fig = { e, x: fx, y: FAZ.fundo, size: fs, plano, ...pecas };
    // no parque, quem salta perto do caixote sobe nele (box jump): do chão na frente dele até o tampo
    const cx = PARQUE_POSTOS.caixote.x;
    const estacaoAli = free(clear, estacao[0], estacao[2]) && !hits(medRect ? [unRect(z, medRect)] : [], [estacao[0] - 10, estacao[1] - 10, estacao[2] + 10, estacao[3] + 10]);
    if (amb === 'parque' && e.acao === 'saltar' && Math.abs(e.x - cx) <= 100 && estacaoAli) {
      fig.x = cx;
      fig.y = CAIXOTE_CHAO + shiftParque;
      const reps = e.reps !== undefined ? Math.max(1, Math.min(4, Math.round(e.reps))) : Infinity;
      fig.caixote = { topo: PARQUE_POSTOS.caixote.topo + shiftParque, a: cue(s, e.cue), n: cicloDe('saltar', e.ritmo), reps, fim: e.ate ? cue(s, e.ate) : Infinity };
    }
    return fig;
  });
  const figRects = figs.map((f) => corpoRect(f.x, f.x, Math.min(f.y, f.caixote?.topo ?? f.y), f.size, 1, f.e.acao === 'saltar'));

  // ---------------------------------------------------------------- os rótulos
  type Rot = Omit<RotuloSpec, 'cue'> & { cue?: string; at: number };
  const rotulos: Rot[] = [
    ...(pr.rotulos ?? []).map((r) => ({ ...r, at: cue(s, r.cue) })),
    ...passos.flatMap((p, i) => (p.rotulo ? [{ text: p.rotulo, cue: p.cue, at: ini[i] }] : [])),
  ].sort((a, b) => a.at - b.at);
  // o que um rótulo evita (tudo NA TELA: os rótulos são da tela): o medidor, ela de pé e os
  // figurantes sempre; ela no ar só enquanto salta
  const elaT = zRect(z, ela);
  const busyRot: Rect[] = [...(medRect ? [medRect] : []), zRect(z, corpoRect(faixa.x0, faixa.x1, ground, size, faixa.esc, false, 0.45, desce)), ...figRects.map((r) => zRect(z, r))];
  // o voo: o salto agacha 5/22 do ciclo e pousa em 18/22 (o poseAt do saltar); a última rep pousa ali
  const saltos: [number, number][] = passos.flatMap((p, i) => {
    if (p.acao !== 'saltar') return [];
    const n = cicloDe('saltar', p.ritmo);
    return [[ini[i] + (5 * n) / 22, ini[i] + n * (repsDe(p) - 1) + (18 * n) / 22 + 2] as [number, number]];
  });
  type VagaL = Vaga & { size?: number };
  type Janela = [number, number];
  const cruzaJ = (a: Janela, b: Janela) => a[0] < b[1] && b[0] < a[1];
  /** na tela da deixa até a saída (+8 q da saída, `cauda`); sem `out`, até o fim */
  const janelaDe = (r: Rot, cauda = 8): Janela => [r.at, r.out ? cue(s, r.out) + cauda : Infinity];
  const noAr = (w: Janela) => saltos.some((j) => cruzaJ(j, w));
  /** os rótulos que dividem a tela não encostam (a mesma folga de 16 px da fila do Stage) */
  const folga = (r: Rect): Rect => [r[0] - 16, r[1] - 16, r[2] + 16, r[3] + 16];
  // no plano fechado ela ocupa o meio do quadro até mais alto: a lista começa mais perto do topo
  const listaY = z ? LISTA.yFechado : LISTA.y;
  const vagas: (VagaL | null)[] = rotulos.map(() => null);
  const placed: { v: Vaga; win: Janela }[] = [];
  // 1) as de posição fixa
  rotulos.forEach((r, i) => {
    if (r.x === undefined && r.y === undefined) return;
    const rx = r.x ?? 540;
    const ry = r.y ?? 480;
    vagas[i] = { x: rx, y: ry, align: 'center', max: 620, rect: rotuloRect(r.text, rx, ry) };
    placed.push({ v: vagas[i]!, win: janelaDe(r) });
  });
  // 2) a lista (sem posição nem seta): uma coluna pra cena inteira
  const lista = rotulos.map((r, i) => i).filter((i) => rotulos[i].x === undefined && rotulos[i].y === undefined && !rotulos[i].seta);
  if (lista.length) {
    const ladoLivre = m?.lado === 'esquerda' ? 'direita' : 'esquerda';
    // no plano fechado o corpo dela chega perto da borda: a coluna do lado é mais estreita (quebra antes)
    const colunaMax = z ? LISTA.colunaFechado : LISTA.coluna;
    const colDe = (lado: 'esquerda' | 'direita', y0: number) =>
      lado === 'esquerda'
        ? { x: LISTA.margem, align: 'left' as const, max: colunaMax, y0 }
        : { x: 1080 - LISTA.margem, align: 'right' as const, max: colunaMax, y0 };
    const cols = [
      { x: 540, align: 'center' as const, max: 620, y0: listaY },
      colDe(ladoLivre, listaY),
      ...(medRect ? [colDe(ladoLivre === 'esquerda' ? 'direita' : 'esquerda', medRect[3] + 24)] : []),
    ];
    const tenta = (c: (typeof cols)[number], size: number) => {
      const out: { i: number; v: VagaL; vivo: Janela }[] = [];
      for (const i of lista) {
        const r = rotulos[i];
        const win = janelaDe(r);
        const vivo = janelaDe(r, 0);
        // entra embaixo da última que ainda está na tela; a que SAI na deixa desta libera o lugar (troca)
        const acima = out.filter((o) => cruzaJ(o.vivo, vivo));
        const y = acima.length ? Math.max(...acima.map((o) => o.v.rect[3])) + LISTA.folga : c.y0;
        const rect = rotuloRect(r.text, c.x, y, size, c.align, c.max);
        const busy = [...busyRot, ...(noAr(win) ? [elaT] : []), ...placed.filter((p) => cruzaJ(p.win, win)).map((p) => folga(p.v.rect))];
        if (rect[1] < LISTA.topo || rect[3] > LISTA.fundo || rect[0] < LISTA.margem - 8.5 || rect[2] > 1080 - LISTA.margem + 8.5 || hits(busy, rect)) return null;
        out.push({ i, v: { x: c.x, y, align: c.align, max: c.max, rect, size }, vivo });
      }
      return out;
    };
    let achou: ReturnType<typeof tenta> = null;
    for (const c of cols) {
      for (const size of LISTA.sizes) if ((achou = tenta(c, size))) break;
      if (achou) break;
    }
    if (achou) {
      for (const o of achou) {
        vagas[o.i] = o.v;
        placed.push({ v: o.v, win: janelaDe(rotulos[o.i]) });
      }
    }
  }
  // 3) o resto (com seta, ou a lista que não coube em coluna nenhuma): uma por uma, como antes
  rotulos.forEach((r, i) => {
    if (vagas[i]) return;
    const win = janelaDe(r);
    const busy = [...busyRot, ...(noAr(win) ? [elaT] : []), ...placed.filter((p) => cruzaJ(p.win, win)).map((p) => folga(p.v.rect))];
    let v: VagaL | null = null;
    if (!r.seta) {
      for (let y = listaY; y + 86 <= LISTA.fundo && !v; y += LISTA.passo) {
        const rect = rotuloRect(r.text, 540, y);
        if (!hits(busy, rect)) v = { x: 540, y, align: 'center', max: 620, rect };
      }
    }
    if (!v) {
      // a vaga não pode depender do quadro: o alvo da seta é onde ela está quando a palavra entra
      const p0 = r.seta && !Array.isArray(r.seta) && r.seta in CORPO.pontos ? poseDela(r.at) : null;
      const alvo = Array.isArray(r.seta) ? r.seta : p0 ? zPt(z, pontoNaTela(r.seta as keyof typeof CORPO.pontos, boxAt(p0).box, p0.pose)) : undefined;
      v = achaVaga(r.text, busy, { alvo });
    }
    vagas[i] = v;
    placed.push({ v, win });
  });
  const vagasOk = vagas as VagaL[];
  // rótulo que caiu em cima da estação tira ela do lugar (o `decor`): ninguém salta num caixote que sumiu
  for (const g of figs) {
    if (g.caixote && hits(vagasOk.map((v) => unRect(z, v.rect)), [estacao[0] - 10, estacao[1] - 10, estacao[2] + 10, estacao[3] + 10])) {
      g.caixote = undefined;
      g.y = FAZ.fundo;
    }
  }

  // ---------------------------------------------------------------- geometria pro Stage
  const pontos = Object.fromEntries((Object.keys(CORPO.pontos) as (keyof typeof CORPO.pontos)[]).map((r) => [r, pontoNaTela(r, box, pd.pose)])) as Partial<Record<Regiao, [number, number]>>;
  // os mesmos pontos NA TELA (com o zoom do plano fechado): a seta é da tela, como o rótulo
  const pontosT = z ? (Object.fromEntries(Object.entries(pontos).map(([k, p]) => [k, zPt(z, p)])) as typeof pontos) : pontos;
  // a ponta da seta acompanha ela (a vaga do rótulo, não)
  // cabeca: a ponta pousa no contorno do lado do rótulo; rosto/pele: a bochecha do lado do rótulo
  const setaDe = (r: Rot, v: Vaga): [number, number] | undefined => {
    if (Array.isArray(r.seta)) return r.seta;
    if (!r.seta) return undefined;
    if (r.seta === 'cabeca') {
      const cab = cabecaDe(pontosT);
      return cab ? pontaNaCabeca(cab, v.rect) : pontosT.cabeca;
    }
    if (r.seta === 'rosto' || r.seta === 'pele') return bochechaDoLado(pontosT, v.rect);
    return pontosT[r.seta];
  };
  const show = [...passos.map((p) => p.peca), ...(passos.some((p) => p.acao === 'levantar') ? ['peso'] : []), pr.holding];
  // o chão que anda: enquanto um passo `correr` vale, a câmera vai junto e o lugar passa por baixo
  const anda = corridaDe(s, passos, frame);
  const geo: EnvGeo = {
    ground,
    clear,
    spot: [x, ground - size * 0.7, size],
    // o medidor e as palavras são da tela: o lugar mede no mundo da cena
    busy: [...(medRect ? [unRect(z, medRect)] : []), ...vagasOk.map((v) => unRect(z, v.rect))],
    show,
    ...(anda ? { anda } : {}),
  };
  // com elenco, o lugar fica sem a gente dele (o corredor da trilha cruzaria os figurantes)
  const sx: MS = { ...s, props: { ...pr, rotulos: undefined, ...(elenco.length ? { gente: 'nenhuma' as const } : {}) } };

  // ---------------------------------------------------------------- entradas
  const enter = corte ? 1 : spr(s.lead - 4);
  const medIn = corte ? 1 : spr(s.lead + 2);

  const pecaAparece = passos.flatMap((p, i) => (i > 0 && ini[i] > s.lead + 2 && (p.peca || p.acao === 'levantar') ? [ini[i]] : []));

  return (
    <Stage
      s={sx}
      geo={geo}
      focus={{ pessoa: pontos.rosto, peca: medRect ? unPt(z, [(medRect[0] + medRect[2]) / 2, (medRect[1] + medRect[3]) / 2]) : undefined }}
      pontos={pontos}
      zoom={z}
      // o medidor é da TELA (fora do zoom do plano fechado), por cima dela
      overlay={
        m && medRect && med ? (
          <div style={{ position: 'absolute', inset: 0, opacity: medIn, transform: medIn < 1 ? `scale(${(0.92 + 0.08 * medIn).toFixed(4)})` : undefined, transformOrigin: `${(medRect[0] + medRect[2]) / 2}px ${medRect[1]}px` }}>
            <Medidor t={frame} x={medRect[0]} y={medRect[1]} size={medW} nivel={med.nivel} jato={med.jato} />
          </div>
        ) : undefined
      }
      // os rótulos são da tela: fora da câmera (um push não corta a palavra), por cima do primeiro plano
      tela={
        rotulos.length
          ? rotulos.map((r, i) => {
              const v = vagasOk[i];
              return <Rotulo key={i} s={s} text={r.text} cue={r.cue} out={r.out} x={v.x} y={v.y} size={v.size} align={v.align} max={v.max} tom={r.tom} seta={setaDe(r, v)} accent={accent} />;
            })
          : undefined
      }
    >
      {feliz ? <Sfx at={turnAt} name="chime" /> : null}
      {pecaAparece.map((f, i) => (
        <Sfx key={`a${i}`} at={f} name="pop2" gain={0.8} />
      ))}
      {largadas
        .filter((g) => g.p === 'peso' && g.lado === 1)
        .map((g, i) => (
          <Sfx key={`c${i}`} at={g.at + CAI.queda} name="pop0" gain={0.6} />
        ))}
      {/* o elenco, atrás dela */}
      <div style={{ position: 'absolute', inset: 0, opacity: enter }}>
        {figs.map((g, i) => {
          const ed = poseDe(s, g.plano, frame);
          const fx = (ed.ativa?.de ?? g.x) + ed.x;
          const fy = g.caixote ? caixoteY(g.caixote, g.y, frame) : g.y;
          return (
            <div key={i} style={{ position: 'absolute', inset: 0, filter: 'saturate(0.75)' }}>
              <Ator
                t={frame}
                x={g.caixote ? g.x : fx}
                y={fy}
                size={g.size}
                pose={ed.pose}
                seed={g.e.seed}
                skin={SKINS[g.e.seed % SKINS.length]}
                accent={SHIRTS[g.e.seed % SHIRTS.length]}
                corPeca={SHIRTS[(g.e.seed + 2) % SHIRTS.length]}
                halo={false}
                arms={g.maos ? 'down' : undefined}
                mao={g.mao ? { p: g.mao } : undefined}
                maos={g.maos}
              />
            </div>
          );
        })}
      </div>
      {/* ela */}
      <div style={{ position: 'absolute', inset: 0, opacity: enter, transform: enter < 1 ? `translateY(${((1 - enter) * 30).toFixed(2)}px)` : undefined }}>
        <PecasNoChao s={s} largadas={largadas} pecasAt={pecasAt} boxAt={boxAt} armsDe={armsDe} size={size} ground={ground} frame={frame} accent={accent} />
        <Ator
          t={frame}
          x={x}
          y={ground}
          size={size}
          pose={pd.pose}
          mood={mood}
          since={since}
          seed={who.seed}
          skin={who.skin}
          accent={C.violet}
          corPeca={accent}
          arms={armsDe(agora)}
          mao={agora.mao ? { p: agora.mao } : undefined}
          maos={agora.maos}
        />
        {feliz && !idHalo ? (
          <div style={{ position: 'absolute', top: ground - size * 1.3, left: x - size / 2 }}>
            <Brilho t={frame} size={size} on={ramp(frame, turnAt, 10)} />
          </div>
        ) : null}
      </div>
    </Stage>
  );
};

/**
 * A peça que saiu da mão. O halter cai (gravidade, 9 q) até o chão do lado do pé e fica lá, deitado;
 * o resto desce um tico e some em 8 q. A posição de partida é a mão no quadro anterior à saída.
 */
const PecasNoChao: React.FC<{
  s: MS;
  largadas: Largada[];
  pecasAt: (f: number) => Pecas & { pd: ReturnType<typeof poseDe> };
  boxAt: (pd: ReturnType<typeof poseDe>) => { x: number; box: { left: number; top: number; size: number } };
  armsDe: (p: Pecas) => Arms | undefined;
  size: number;
  ground: number;
  frame: number;
  accent: string;
}> = ({ largadas, pecasAt, boxAt, armsDe, size, ground, frame, accent }) => (
  <>
    {largadas.map((g, i) => {
      const age = frame - g.at;
      if (age < 0) return null;
      const fica = g.p === 'peso';
      if (!fica && age >= CAI.some) return null;
      const antes = pecasAt(g.at - 1);
      const pose = antes.pd.pose as PoseAtor | undefined;
      const { box } = boxAt(antes.pd);
      const arms: Arms = armsDe(antes) ?? (antes.mao || antes.maos ? 'out' : 'down');
      const mao = maoNaTela(pose, arms, g.lado, box);
      const esc = pose?.escala ?? 1;
      const pg = PEGA[g.p] ?? PEGA_PADRAO;
      const ps = size * pg.k * esc;
      const [w, h] = pieceBox(g.p, ps);
      // o halter em pé com o braço erguido, deitado com o braço pra baixo (como na mão)
      const giro0 = g.p === 'peso' ? 90 * sm((Math.abs(mao.ang) - 40) / 40) : 0;
      let left = mao.x - w * pg.g[0];
      let top = mao.y - h * pg.g[1];
      let giro = giro0;
      let opacity = 1;
      if (fica) {
        // cai até o chão (pés + o que a escala desce), deitado, do lado de fora do pé
        const chao = ground + (esc - 1) * size * (pose?.desce ?? VEM_DESCE) + 4 - h;
        const k = cl(age / CAI.queda);
        top = top + (chao - top) * k * k;
        // pra fora do pé: ela ainda vai se mexer (e crescer, se correr pra câmera) sem pisar nele
        left = left + (g.lado ? 1 : -1) * 0.12 * size * esc * k;
        giro = giro0 * (1 - sm(age / CAI.queda));
      } else {
        top += 22 * sai(frame, g.at, CAI.some);
        opacity = 1 - sai(frame, g.at, CAI.some);
      }
      return (
        <div key={i} style={{ position: 'absolute', left, top, opacity, transformOrigin: `${w / 2}px ${h / 2}px`, transform: giro ? `rotate(${giro.toFixed(2)}deg)` : undefined }}>
          <Peca name={g.p} t={frame} size={ps} accent={accent} />
        </div>
      );
    })}
  </>
);
