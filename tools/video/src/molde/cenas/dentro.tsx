// Cena `dentro` (fase 3): o corpo por dentro (plano `corpo`) e a lupa sobre ela num lugar (plano
// `lupa`). STUB da fundação: desenha o Stage com a pessoa (grande no corpo, no centro na lupa), a
// Lente e o reservatório nas posições do contrato, pra compilar e provar a fiação.
// Dono: agente B (o corpo de vidro, os fluxos de partículas da origem às regiões, `divide`, as
// regiões que acendem com rótulo, o tanque crescendo do músculo; na lupa, ela deslizando pro canto
// e o lugar escurecendo). Contrato em design.json → synth.blocks "dentro", com os cortes do
// PLANO-FINAL (efeitos só `acende` e `anel`; sem lapso).
//
// Ciclo de import: este arquivo importa do ../scenes e o scenes.tsx importa este. Só use o que vem
// de ../scenes DENTRO do componente (nunca no topo do módulo).
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MOLA } from '../../components';
import { Ator, maoNaTela, pontoNaTela, poseDe } from '../../elenco/acao';
import { Reservatorio, reservaAt } from '../../elenco/reservatorio';
import { CORPO, SKINS } from '../../identidade/types';
import { C } from '../../theme';
import type { EnvGeo } from '../ambientes';
import { Lente, lenteRect } from '../lente';
import { Stage, at, useAccent, useSpec, type MS } from '../scenes';
import type { Mood, Regiao } from '../spec';

type Box = { left: number; top: number; size: number };
type Ponto = keyof typeof CORPO.pontos;
/** Região → ponto do corpo (os sistemas caem num ponto de referência até o agente B desenhar as rotas). */
const PONTO: Record<Regiao, Ponto> = {
  cabeca: 'cabeca',
  rosto: 'rosto',
  boca: 'boca',
  peito: 'peito',
  tronco: 'tronco',
  barriga: 'barriga',
  braco: 'braco',
  perna: 'perna',
  vasos: 'peito',
  musculos: 'braco',
  pele: 'rosto',
};
const pontosDe = (box: Box): Partial<Record<Regiao, [number, number]>> =>
  Object.fromEntries((Object.keys(PONTO) as Regiao[]).map((r) => [r, pontoNaTela(PONTO[r], box)]));

export const Dentro: React.FC<{ s: MS }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = useAccent();
  const spec = useSpec();
  const pr = s.props ?? {};
  const turnAt = at(s, pr.turn, 1e9);
  const mood: Mood = frame >= turnAt ? (pr.to ?? 'feliz') : (pr.mood ?? 'ok');
  const who = { seed: spec.protagonista?.seed ?? 0, skin: spec.protagonista?.skin };
  const pele = who.skin ?? SKINS[0];

  if (pr.plano !== 'lupa') {
    // PLANO CORPO: ela grande, de frente, pés em 1200 (caixa ≥ 820 px de altura)
    const size = 660;
    const box: Box = { left: 540 - size / 2, top: 1200 - size * 1.26, size };
    const pontos = pontosDe(box);
    const centro: [number, number] = pr.lente?.tamanho === 'grande' ? [540, 760] : [760, 560];
    const diam = pr.lente?.tamanho === 'grande' ? 760 : 520;
    const res = pr.reserva ? reservaAt(s, pr.reserva, frame) : null;
    const braco = pontos.braco ?? [700, 700];
    return (
      <Stage s={s} focus={{ pessoa: pontos.rosto, peca: centro }} pontos={pontos} busy={pr.lente ? [lenteRect(centro, diam)] : []}>
        <Ator t={frame} x={540} y={1200} size={size} pose={{ braco: [16, -16] }} mood={mood} seed={who.seed} skin={who.skin} accent={C.violet} />
        {res ? (
          <div style={{ position: 'absolute', left: braco[0] - 60, top: braco[1] - 160 }}>
            <Reservatorio t={frame} size={120} nivel={res.nivel} jato={res.jato} pinga={res.pinga} assenta={res.assenta} conteudo={pr.reserva?.conteudo} />
          </div>
        ) : null}
        {pr.lente ? <Lente s={s} spec={pr.lente} ancora={pontos[pr.lente.sobre === 'peca' ? 'braco' : pr.lente.sobre] ?? braco} centro={centro} diametro={diam} accent={accent} pele={pele} /> : null}
      </Stage>
    );
  }

  // PLANO LUPA: ela no lugar com a peça e a ação; na deixa da lente, ela desliza pro canto e a lente
  // grande abre da âncora (a peça da mão ou a região dela)
  const cueAt = pr.lente?.cue ? at(s, pr.lente.cue, 0) : -1e9;
  const k = pr.lente ? (pr.lente.cue ? spring({ frame: frame - cueAt, fps, config: MOLA.entra }) : 1) : 0;
  const x = 540 + (230 - 540) * k;
  const y = 1340 + (1370 - 1340) * k;
  const size = 360 + (330 - 360) * k;
  const pd = poseDe(s, pr.acoes, frame);
  const box: Box = { left: x - size / 2, top: y - size * 1.26, size };
  const pontos = pontosDe(box);
  const centro: [number, number] = [610, 720];
  const diam = 760;
  const lr = lenteRect(centro, diam);
  const mao = pd.peca ?? pr.holding;
  const ancora: [number, number] =
    pr.lente?.sobre === 'peca' || !pr.lente ? ((h) => [h.x, h.y] as [number, number])(maoNaTela(pd.pose, mao ? 'out' : 'down', 1, box)) : (pontos[pr.lente.sobre] ?? [x, y - size]);
  const geo: EnvGeo = { ground: 1340, clear: [340, 740], spot: [540, 1000, 380], busy: pr.lente ? [lr] : [], show: [mao] };
  return (
    <Stage s={s} geo={geo} focus={{ pessoa: pontos.rosto, peca: centro }} pontos={pontos} busy={pr.lente ? [lr] : []}>
      {k > 0 ? <div style={{ position: 'absolute', inset: 0, background: `rgba(10,14,38,${(0.55 * Math.min(1, k)).toFixed(3)})` }} /> : null}
      <Ator
        t={frame}
        x={x}
        y={y}
        size={size}
        pose={pd.pose}
        mood={mood}
        seed={who.seed}
        skin={who.skin}
        accent={C.violet}
        mao={mao ? { p: mao } : undefined}
        maos={pd.maos}
      />
      {pr.lente ? <Lente s={s} spec={pr.lente} ancora={ancora} centro={centro} diametro={diam} accent={accent} pele={pele} /> : null}
    </Stage>
  );
};
