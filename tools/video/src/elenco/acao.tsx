// Ações do elenco (fase 3): a pessoa FAZENDO o que a voz diz. STUB da fundação — API final do
// design.json (bloco "acao"), desenho mínimo: o Ator é a Pessoa da identidade PARADA, com a peça na
// mão. Dono: agente A (os ciclos de poseAt, a mistura de 6 q do poseDe, a pose no hexa.tsx, a
// poeira do correr, o rosto `focado`).
//
// Regras (PLANO-FINAL): 7 ações (sem trocar/bocejar). `correr` = no lugar ou vindo pra câmera
// (escala 0,9→1,05) com poeira no pé que pousa; trajeto de lado só no `andar`. Beber com o braço
// na frente da cabeça (Pose.frente). Nenhum raio, rastro ou linha de velocidade. Sem pose, a Pessoa
// sai idêntica (diff 0 nos vídeos publicados).
//
// Importa só TIPOS de scenes.tsx (`import type { MS }`): sem ciclo de import.
import React from 'react';
import { Pessoa } from './cast';
import { FIG_ACCENT, SKINS } from './cenario';
import { Peca, pieceBox } from '../molde/Peca';
import { C } from '../theme';
import { cue, speechEnd } from '../timeline';
import { CORPO, type Arms, type Mood, type Pose } from '../identidade/types';
import type { MS } from '../molde/scenes';
import type { AcaoKind, AcaoSpec, PieceName } from '../molde/spec';

/** Quadros por ciclo/rep, por ritmo (normal, lento, rápido). Sem período = laço (só termina na próxima ação ou no `ate`). */
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

/** A pose da ação `f` quadros depois de começar. STUB: a pose-chave parada de cada ação. */
export function poseAt(acao: AcaoKind, f: number, o: { ritmo?: 'lento' | 'rapido'; dir?: 1 | -1; reps?: number } = {}): Pose & { fim: boolean } {
  const c = CICLO[acao];
  const fim = !c.laco && f >= cicloDe(acao, o.ritmo) * Math.max(1, Math.min(4, o.reps ?? 1));
  const key: Record<AcaoKind, Pose> = {
    pronta: { braco: [24, -24], perna: [7, -7], y: 2 },
    andar: { braco: [14, -14], inclina: 3 * (o.dir ?? 1) },
    correr: { braco: [40, -40], y: -4 },
    saltar: { braco: [150, -150], y: -40 },
    levantar: { braco: [70, -70] },
    mexer: { braco: [12, -78] },
    beber: { braco: [12, 128], cabeca: -6, frente: [false, true] },
  };
  return { ...key[acao], fim };
}

/** Começo de cada ação (quadro local): a deixa; sem deixa, a 1ª começa com a fala e as outras logo depois da anterior. */
const inicios = (s: MS, acoes: AcaoSpec[]) => {
  const out: number[] = [];
  for (const [i, a] of acoes.entries()) {
    if (a.cue) out.push(cue(s, a.cue));
    else if (i === 0) out.push(s.lead);
    else {
      const p = acoes[i - 1];
      out.push(out[i - 1] + (CICLO[p.acao].laco ? 30 : cicloDe(p.acao, p.ritmo) * Math.max(1, p.reps ?? 1)));
    }
  }
  return out;
};

/**
 * A pose do quadro a partir das ações do roteiro. STUB: sem mistura entre ações (o agente A põe os
 * 6 q de mistura e a volta ao repouso 8 q depois do `ate`). `x` = deslocamento do trajeto em px,
 * relativo ao `de` da ação ativa (0 sem trajeto): a cena desenha em `(ativa.de ?? x da cena) + x`.
 */
export function poseDe(
  s: MS,
  acoes: AcaoSpec[] | undefined,
  frame: number,
): { pose?: Pose; peca?: PieceName; maos?: PieceName; x: number; ativa?: AcaoSpec; ciclo0: number } {
  if (!acoes?.length) return { x: 0, ciclo0: 0 };
  const ini = inicios(s, acoes);
  let i = -1;
  for (let k = 0; k < acoes.length; k++) if (frame >= ini[k]) i = k;
  if (i < 0) return { x: 0, ciclo0: 0 };
  const a = acoes[i];
  const f = frame - ini[i];
  const fimAte = a.ate ? cue(s, a.ate) : null;
  const pose = poseAt(a.acao, f, { ritmo: a.ritmo, reps: a.reps, dir: a.de !== undefined && a.para !== undefined && a.para < a.de ? -1 : 1 });
  if (pose.fim || (fimAte !== null && frame >= fimAte)) return { x: 0, ativa: undefined, ciclo0: ini[i] };
  // trajeto (só andar): de → para entre a deixa e a próxima ação (ou o ate, ou o fim da fala)
  let x = 0;
  if (a.acao === 'andar' && a.de !== undefined && a.para !== undefined) {
    const end = fimAte ?? ini[i + 1] ?? speechEnd(s);
    const k = Math.max(0, Math.min(1, f / Math.max(1, end - ini[i])));
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    x = (a.para - a.de) * e;
  }
  const { fim: _fim, ...p } = pose;
  return { pose: p, peca: a.acao === 'levantar' ? undefined : a.peca, maos: a.acao === 'levantar' ? (a.peca ?? 'peso') : undefined, x, ativa: a, ciclo0: ini[i] };
}

/** Ângulos dos ombros [esq, dir] sem pose (os mesmos do hexa.tsx, sem o aceno do 'up'). */
const ARMS: Record<Arms, [number, number]> = { none: [0, 0], down: [12, -12], up: [150, -150], out: [14, -78] };

type Box = { left: number; top: number; size: number };

/** Centro da mão `lado` (0 = esq, 1 = dir) na tela, e o ângulo do braço. */
export function maoNaTela(pose: Pose | undefined, arms: Arms, lado: 0 | 1, box: Box): { x: number; y: number; ang: number } {
  const ang = pose?.braco?.[lado] ?? ARMS[arms][lado];
  const [px, py] = CORPO.ombro[lado];
  const r = (ang * Math.PI) / 180;
  const ux = px - CORPO.braco * Math.sin(r);
  const uy = py + CORPO.braco * Math.cos(r) + (pose?.y ?? 0);
  const k = box.size / 200;
  return { x: box.left + ux * k, y: box.top + uy * k, ang };
}

/** Um ponto do corpo (CORPO.pontos) na tela. */
export function pontoNaTela(r: keyof typeof CORPO.pontos, box: Box, pose?: Pose): [number, number] {
  const [ux, uy] = CORPO.pontos[r];
  const k = box.size / 200;
  return [box.left + ux * k, box.top + (uy + (pose?.y ?? 0)) * k];
}

export type AtorProps = {
  t: number;
  /** centro x na tela */
  x: number;
  /** linha dos pés na tela */
  y: number;
  size: number;
  pose?: Pose;
  /** figurante em laço: roda poseAt(laco, t + fase) sem parar */
  laco?: AcaoKind;
  fase?: number;
  mood?: Mood;
  since?: number;
  seed?: number;
  skin?: string;
  accent?: string;
  cap?: string;
  /** braços sem pose (default: 'out' com peça na mão, 'down' sem) */
  arms?: Arms;
  /** a peça na mão direita */
  mao?: { p: PieceName; progress?: number };
  /** a mesma peça nas duas mãos (o halter do levantar) */
  maos?: PieceName;
  figurante?: boolean;
  halo?: boolean | 'cabeca';
  /** poeira no pé que pousa (correr) */
  poeira?: boolean;
};

/**
 * A pessoa fazendo: a Pessoa da identidade com os pés em (x, y) e a peça na mão. Figurante: roupa
 * apagada (FIG_ACCENT), pele pelo seed, filtro só de saturação (não escurece pele), sem halo.
 */
export const Ator: React.FC<AtorProps> = ({ t, x, y, size, pose, laco, fase = 0, mood = 'ok', since, seed = 0, skin, accent = C.violet, cap, arms, mao, maos, figurante = false, halo }) => {
  const p = pose ?? (laco ? poseAt(laco, t + fase) : undefined);
  const box: Box = { left: x - size / 2, top: y - size * 1.26, size };
  const armsIn: Arms = arms ?? (mao || maos ? 'out' : 'down');
  const pecaEm = (name: PieceName, lado: 0 | 1, progress?: number) => {
    const h = maoNaTela(p, armsIn, lado, box);
    const ps = size * 0.5;
    const [w, hh] = pieceBox(name, ps);
    return (
      <div key={`${name}-${lado}`} style={{ position: 'absolute', left: h.x - w * (lado ? 0.3 : 0.7), top: h.y - hh * 0.75 }}>
        <Peca name={name} t={t} size={ps} accent={figurante ? FIG_ACCENT : accent} progress={progress} />
      </div>
    );
  };
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, filter: figurante ? 'saturate(0.75)' : undefined }}>
      <div style={{ position: 'absolute', left: box.left, top: box.top }}>
        <Pessoa
          t={t}
          size={size}
          mood={mood}
          since={since}
          seed={seed}
          {...(skin || figurante ? { skin: skin ?? SKINS[seed % SKINS.length] } : {})}
          accent={figurante ? FIG_ACCENT : accent}
          cap={cap}
          arms={armsIn}
          pose={p}
          halo={figurante ? false : halo}
        />
      </div>
      {maos ? [pecaEm(maos, 0), pecaEm(maos, 1)] : null}
      {mao ? pecaEm(mao.p, 1, mao.progress) : null}
    </div>
  );
};
