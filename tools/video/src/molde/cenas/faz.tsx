// Cena `faz` (fase 3): a pessoa fazendo uma sequência de 1–4 passos num lugar, presos às deixas,
// com rótulo por passo, Medidor opcional que gasta um gole por passo e até 3 figurantes (cada um
// num esforço diferente). STUB da fundação: desenha o Stage com ela no centro (ou no `de` do passo),
// o Medidor no canto e os figurantes atrás, pra compilar e provar a fiação.
// Dono: agente F (fase 2 da leva). Contrato em design.json → synth.blocks "faz", com os cortes do
// PLANO-FINAL: sem lugar por passo (montagem cortada), sem esteira, sem lapso.
//
// Ciclo de import: este arquivo importa do ../scenes e o scenes.tsx importa este. Só use o que vem
// de ../scenes DENTRO do componente (nunca no topo do módulo).
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Ator, pontoNaTela, poseDe } from '../../elenco/acao';
import { Medidor } from '../../elenco/reservatorio';
import { CORPO } from '../../identidade/types';
import { C } from '../../theme';
import { cue } from '../../timeline';
import type { EnvGeo, Rect } from '../ambientes';
import { Stage, at, useAccent, useSpec, type MS } from '../scenes';
import type { Mood, Regiao, RotuloSpec } from '../spec';

/** Pés dela e dos figurantes; tamanho dela (menor com elenco); a ficha do Medidor. */
const FAZ = { ground: 1300, size: 400, sizeElenco: 360, fundo: 1170, extra: 240, medidor: { w: 180, top: 300, margem: 60 } };

export const Faz: React.FC<{ s: MS }> = ({ s }) => {
  const frame = useCurrentFrame();
  const accent = useAccent();
  const spec = useSpec();
  const pr = s.props ?? {};
  const passos = (pr.passos ?? []).slice(0, 4);
  const elenco = (pr.elenco ?? []).slice(0, 3);
  const turnAt = at(s, pr.turn, 1e9);
  const mood: Mood = frame >= turnAt ? (pr.to ?? 'feliz') : (pr.mood ?? 'ok');
  const who = { seed: spec.protagonista?.seed ?? 0, skin: spec.protagonista?.skin };
  const pd = poseDe(s, passos, frame);
  const size = elenco.length ? FAZ.sizeElenco : FAZ.size;
  const x = (pd.ativa?.de ?? 540) + pd.x;
  // o Medidor: no canto de cima do lado; um gole a menos por passo já começado
  const m = pr.medidor;
  const mx = m?.lado === 'esquerda' ? FAZ.medidor.margem : 1080 - FAZ.medidor.margem - FAZ.medidor.w;
  const medRect: Rect | null = m ? [mx, FAZ.medidor.top, mx + FAZ.medidor.w, FAZ.medidor.top + FAZ.medidor.w * 1.35] : null;
  const started = passos.filter((p, i) => frame >= (p.cue ? cue(s, p.cue) : i === 0 ? s.lead : 1e9)).length;
  const nivel = m ? Math.max(0, m.nivel - (m.gasta ?? 0.07) * started) : 0;
  // o rótulo de cada passo entra na mesma fila dos rótulos da cena (o Stage desenha)
  const rotulos: RotuloSpec[] = [...(pr.rotulos ?? []), ...passos.filter((p) => p.rotulo && p.cue).map((p) => ({ text: p.rotulo!, cue: p.cue! }))];
  const sx: MS = rotulos.length ? { ...s, props: { ...pr, rotulos } } : s;
  const box = { left: x - size / 2, top: FAZ.ground - size * 1.26, size };
  const pontos = Object.fromEntries((Object.keys(CORPO.pontos) as (keyof typeof CORPO.pontos)[]).map((r) => [r, pontoNaTela(r, box, pd.pose)])) as Partial<Record<Regiao, [number, number]>>;
  const geo: EnvGeo = { ground: FAZ.ground, clear: [x - size * 0.45, x + size * 0.45], spot: [x, FAZ.ground - size * 0.7, size], busy: medRect ? [medRect] : [] };
  return (
    <Stage s={sx} geo={geo} focus={{ pessoa: pontos.rosto, peca: medRect ? [(medRect[0] + medRect[2]) / 2, (medRect[1] + medRect[3]) / 2] : undefined }} pontos={pontos}>
      {elenco.map((e, i) => {
        const ed = poseDe(s, [{ acao: e.acao, cue: e.cue, ate: e.ate, de: e.x, para: e.para }], frame);
        return <Ator key={i} t={frame} x={e.x + ed.x} y={FAZ.fundo} size={Math.max(200, e.size ?? FAZ.extra)} pose={ed.pose} seed={e.seed} figurante />;
      })}
      <Ator t={frame} x={x} y={FAZ.ground} size={size} pose={pd.pose} mood={mood} seed={who.seed} skin={who.skin} accent={C.violet} mao={pd.peca ? { p: pd.peca } : undefined} maos={pd.maos} />
      {m ? <Medidor t={frame} x={mx} y={FAZ.medidor.top} size={FAZ.medidor.w} nivel={nivel} jato={0} accent={accent} /> : null}
    </Stage>
  );
};
