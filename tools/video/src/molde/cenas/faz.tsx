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
//  - Medidor: canto de cima do lado (`lado`), 180 × 243 px, dourado (o mesmo tanque do vídeo).
//    Cada passo que não é `pronta` solta um jato pela válvula 4 q depois da deixa e tira `gasta`
//    (default 0,07) do nível.
//  - Elenco: atrás dela, pés em y 1170, ≥ 200 px (default 240), pele e roupa pelo seed, filtro só de
//    saturação (não escurece pele). Cada um fica em `pronta` até a deixa, faz a ação até o `ate`
//    (saltar/levantar repetem até lá) e volta a `pronta`. Nunca cruza o corpo dela: quem cairia em
//    cima é empurrado pro lado. No parque, quem salta perto do caixote da estação SOBE nele.
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
import { Ator, cicloDe, maoNaTela, pontoNaTela, poseDe, type PoseAtor } from '../../elenco/acao';
import { Brilho } from '../../elenco/cast';
import { SHIRTS, SKINS } from '../../elenco/cenario';
import { JATO, Medidor } from '../../elenco/reservatorio';
import { useIdentity } from '../../identidade/context';
import { CORPO, type Arms } from '../../identidade/types';
import { C } from '../../theme';
import { cue } from '../../timeline';
import { free, hits, type EnvGeo, type Rect } from '../ambientes';
import { PARQUE_POSTOS, parque } from '../lugares/parque';
import { Peca, pieceBox } from '../Peca';
import { Rotulo, achaVaga, rotuloRect, useFontesDoRotulo, type Vaga } from '../rotulo';
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
  medidor: { w: 180, top: 316, margem: 56 },
};

/** A lista das palavras no alto (rótulos sem posição nem seta): de y 400 em diante, de 96 em 96 (a cápsula tem 86). */
const LISTA = { y: 400, passo: 96, fim: 820 };

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
    if (frame < a + JATO) jato = (frame - a) / JATO;
  }
  return { nivel: Math.max(0, nivel), jato };
};

// ------------------------------------------------------------------ onde ela pode estar

/** A faixa de x que ela percorre na cena inteira, a escala máxima (correr pra câmera) e se salta. */
const faixaDe = (passos: Passo[]) => {
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
    if (p.acao === 'correr' && p.para !== undefined) esc *= 1.1;
  }
  const dentro = xs.map((x) => cl(x, 0, 1080));
  return { x0: Math.min(...dentro), x1: Math.max(...dentro), esc: Math.min(1.2, esc), salta: passos.some((p) => p.acao === 'saltar') };
};

/**
 * Tudo que um corpo de pé em `y` ocupa entre x0 e x1, com os braços (`meia` × size pra cada lado) e
 * o salto (os pés sobem ~94 un.): o que um rótulo nunca cobre.
 */
const corpoRect = (x0: number, x1: number, y: number, size: number, esc = 1, salta = false, meia = 0.45): Rect => {
  const k = (size / 200) * esc;
  const drop = (esc - 1) * size * 0.4;
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
  plano: AcaoSpec[];
  mao?: PieceName;
  maos?: PieceName;
  /** salto no caixote: do chão (y) até o tampo (topo) durante o voo do 1º salto [quadros] */
  caixote?: { topo: number; voo: [number, number] };
};

/**
 * O plano de um figurante: `pronta` até a deixa, a ação até o `ate` (saltar/levantar repetem as reps
 * que cabem, até 4) e `pronta` de novo. Andar com `para` e sem `ate` anda até o fim da fala.
 */
const planoExtra = (s: MS, e: Extra): AcaoSpec[] => {
  const ini = cue(s, e.cue);
  const n = cicloDe(e.acao);
  const reps = !LACO.has(e.acao) && e.ate ? cl(Math.round((cue(s, e.ate) - ini) / n), 1, 4) : 1;
  // figurante corre NO LUGAR (nunca na mesma direção que ela: leria corrida, comparação); só o andar atravessa
  const trajeto = e.acao === 'andar' ? { de: e.x, para: e.para } : e.acao === 'correr' ? { de: e.x } : {};
  const acao: AcaoSpec = { acao: e.acao, cue: e.cue, ate: e.ate, reps, ...trajeto };
  const anda = e.acao === 'andar' && e.para !== undefined && !e.ate;
  return [{ acao: 'pronta' }, acao, ...(anda ? [] : [{ acao: 'pronta' } as AcaoSpec])];
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
  const size = elenco.length ? FAZ.sizeElenco : FAZ.size;
  const ground = FAZ.ground;
  const ini = iniciosDe(s, passos);
  const faixa = faixaDe(passos);
  const boxAt = (pd: ReturnType<typeof poseDe>) => {
    const x = (pd.ativa?.de ?? 540) + pd.x;
    return { x, box: { left: x - size / 2, top: ground - size * 1.26, size } };
  };

  /** As peças na mão no quadro `f`: as do passo ativo, menos a do passo que já passou do `ate`. */
  const pecasAt = (f: number): Pecas & { pd: ReturnType<typeof poseDe> } => {
    const pd = poseDe(s, passos, f);
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

  // ---------------------------------------------------------------- o medidor
  const m = pr.medidor;
  const mx = m?.lado === 'esquerda' ? FAZ.medidor.margem : 1080 - FAZ.medidor.margem - FAZ.medidor.w;
  const medRect: Rect | null = m ? [mx, FAZ.medidor.top, mx + FAZ.medidor.w, FAZ.medidor.top + FAZ.medidor.w * 1.35] : null;
  const goles = passos.map((p, i) => (p.acao === 'pronta' ? null : ini[i])).filter((g): g is number => g !== null);
  const med = m ? medidorAt(m, goles, frame) : null;

  // ---------------------------------------------------------------- o cenário
  const clearMeia = 0.3 * size * faixa.esc + 40;
  const clear: [number, number] = [Math.max(0, faixa.x0 - clearMeia), Math.min(1080, faixa.x1 + clearMeia)];
  // o corpo dela (com o salto mais alto e o correr pra câmera): rótulo e figurante nunca em cima
  const ela = corpoRect(faixa.x0, faixa.x1, ground, size, faixa.esc, faixa.salta);

  // ---------------------------------------------------------------- o elenco
  const amb = pr.ambiente;
  const shiftParque = ground - parque.depth - 1000;
  const estacao: Rect = [ESTACAO_PARQUE[0], ESTACAO_PARQUE[1] + shiftParque, ESTACAO_PARQUE[2], ESTACAO_PARQUE[3] + shiftParque];
  const corpoDela: [number, number] = [faixa.x0 - 0.36 * size * faixa.esc, faixa.x1 + 0.36 * size * faixa.esc];
  const figs: Fig[] = elenco.map((e) => {
    const fs = Math.max(FAZ.extraMin, e.size ?? FAZ.extra);
    let fx = e.x;
    // nunca cruza o corpo dela: quem cairia em cima vai pro lado mais perto (sem sair do quadro)
    const meia = 0.36 * fs;
    if (!(e.acao === 'andar' && e.para !== undefined) && fx + meia > corpoDela[0] && fx - meia < corpoDela[1]) {
      const esq = corpoDela[0] - meia - 8;
      const dir = corpoDela[1] + meia + 8;
      fx = cl(Math.abs(fx - esq) <= Math.abs(fx - dir) ? esq : dir, 0.3 * fs, 1080 - 0.3 * fs);
    }
    const plano = planoExtra(s, e);
    const pecas: Pick<Fig, 'mao' | 'maos'> = e.acao === 'levantar' ? { maos: 'peso' } : e.acao === 'mexer' || e.acao === 'beber' ? { mao: pr.holding ?? 'copo-agua' } : {};
    const fig: Fig = { e, x: fx, y: FAZ.fundo, size: fs, plano, ...pecas };
    // no parque, quem salta perto do caixote sobe nele (box jump): do chão na frente dele até o tampo
    const cx = PARQUE_POSTOS.caixote.x;
    const estacaoAli = free(clear, estacao[0], estacao[2]) && !hits(medRect ? [medRect] : [], [estacao[0] - 10, estacao[1] - 10, estacao[2] + 10, estacao[3] + 10]);
    if (amb === 'parque' && e.acao === 'saltar' && Math.abs(e.x - cx) <= 100 && estacaoAli) {
      const q = cicloDe('saltar') / 22;
      const a = cue(s, e.cue);
      fig.x = cx;
      fig.y = CAIXOTE_CHAO + shiftParque;
      fig.caixote = { topo: PARQUE_POSTOS.caixote.topo + shiftParque, voo: [a + 5 * q, a + 18 * q] };
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
  // o que um rótulo evita: o medidor, ela de pé e os figurantes sempre; ela no ar só enquanto salta
  const busyRot: Rect[] = [...(medRect ? [medRect] : []), corpoRect(faixa.x0, faixa.x1, ground, size, faixa.esc), ...figRects];
  // o voo: o salto agacha 5/22 do ciclo e pousa em 18/22 (o poseAt do saltar); a última rep pousa ali
  const saltos: [number, number][] = passos.flatMap((p, i) => {
    if (p.acao !== 'saltar') return [];
    const n = cicloDe('saltar', p.ritmo);
    return [[ini[i] + (5 * n) / 22, ini[i] + n * (repsDe(p) - 1) + (18 * n) / 22 + 2] as [number, number]];
  });
  const placed: { v: Vaga; win: [number, number] }[] = [];
  const vagas = rotulos.map((r) => {
    const win: [number, number] = [r.at, r.out ? cue(s, r.out) + 8 : Infinity];
    const cruza = ([a, b]: [number, number]) => a < win[1] && win[0] < b;
    const outros = placed.filter((p) => cruza(p.win)).map((p) => p.v.rect);
    const busy = [...busyRot, ...(saltos.some(cruza) ? [ela] : []), ...outros];
    let v: Vaga | null = null;
    if (r.x !== undefined || r.y !== undefined) {
      const rx = r.x ?? 540;
      const ry = r.y ?? 480;
      v = { x: rx, y: ry, align: 'center', max: 620, rect: rotuloRect(r.text, rx, ry) };
    } else if (!r.seta) {
      // sem seta, as palavras dos passos viram uma LISTA no alto, centrada, uma embaixo da outra
      // (a ordem da fala); não coube, a fila de sempre (achaVaga)
      for (let y = LISTA.y; y <= LISTA.fim && !v; y += LISTA.passo) {
        const rect = rotuloRect(r.text, 540, y);
        if (!hits(busy, rect)) v = { x: 540, y, align: 'center', max: 620, rect };
      }
    }
    if (!v) {
      // a vaga não pode depender do quadro: o alvo da seta é onde ela está quando a palavra entra
      const p0 = r.seta && !Array.isArray(r.seta) && r.seta in CORPO.pontos ? poseDe(s, passos, r.at) : null;
      const alvo = Array.isArray(r.seta) ? r.seta : p0 ? pontoNaTela(r.seta as keyof typeof CORPO.pontos, boxAt(p0).box, p0.pose) : undefined;
      v = achaVaga(r.text, busy, { alvo });
    }
    placed.push({ v, win });
    return v;
  });
  // rótulo que caiu em cima da estação tira ela do lugar (o `decor`): ninguém salta num caixote que sumiu
  for (const g of figs) {
    if (g.caixote && hits(vagas.map((v) => v.rect), [estacao[0] - 10, estacao[1] - 10, estacao[2] + 10, estacao[3] + 10])) {
      g.caixote = undefined;
      g.y = FAZ.fundo;
    }
  }

  // ---------------------------------------------------------------- geometria pro Stage
  const pontos = Object.fromEntries((Object.keys(CORPO.pontos) as (keyof typeof CORPO.pontos)[]).map((r) => [r, pontoNaTela(r, box, pd.pose)])) as Partial<Record<Regiao, [number, number]>>;
  // a ponta da seta acompanha ela (a vaga do rótulo, não)
  const setaDe = (r: Rot): [number, number] | undefined => (Array.isArray(r.seta) ? r.seta : r.seta ? pontos[r.seta] : undefined);
  const show = [...passos.map((p) => p.peca), ...(passos.some((p) => p.acao === 'levantar') ? ['peso'] : []), pr.holding];
  const geo: EnvGeo = {
    ground,
    clear,
    spot: [x, ground - size * 0.7, size],
    busy: [...(medRect ? [medRect] : []), ...vagas.map((v) => v.rect)],
    show,
  };
  // com elenco, o lugar fica sem a gente dele (o corredor da trilha cruzaria os figurantes)
  const sx: MS = { ...s, props: { ...pr, rotulos: undefined, ...(elenco.length ? { gente: 'nenhuma' as const } : {}) } };

  // ---------------------------------------------------------------- entradas
  const enter = corte ? 1 : spr(s.lead - 4);
  const medIn = corte ? 1 : spr(s.lead + 2);

  const pecaAparece = passos.flatMap((p, i) => (i > 0 && ini[i] > s.lead + 2 && (p.peca || p.acao === 'levantar') ? [ini[i]] : []));

  return (
    <Stage s={sx} geo={geo} focus={{ pessoa: pontos.rosto, peca: medRect ? [(medRect[0] + medRect[2]) / 2, (medRect[1] + medRect[3]) / 2] : undefined }} pontos={pontos}>
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
          // o salto no caixote: os pés vão do chão ao tampo durante o voo do 1º salto
          const fy = g.caixote ? g.y + (g.caixote.topo - g.y) * sm((frame - g.caixote.voo[0]) / (g.caixote.voo[1] - g.caixote.voo[0])) : g.y;
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
      {m && medRect && med ? (
        <div style={{ position: 'absolute', inset: 0, opacity: medIn, transform: medIn < 1 ? `scale(${(0.92 + 0.08 * medIn).toFixed(4)})` : undefined, transformOrigin: `${(medRect[0] + medRect[2]) / 2}px ${medRect[1]}px` }}>
          <Medidor t={frame} x={medRect[0]} y={medRect[1]} size={FAZ.medidor.w} nivel={med.nivel} jato={med.jato} />
        </div>
      ) : null}
      {rotulos.map((r, i) => {
        const v = vagas[i];
        return <Rotulo key={i} s={s} text={r.text} cue={r.cue} out={r.out} x={v.x} y={v.y} align={v.align} max={v.max} tom={r.tom} seta={setaDe(r)} accent={accent} />;
      })}
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
        const chao = ground + (esc - 1) * size * 0.4 + 4 - h;
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
