// Lente (fase 3): a lupa redonda que mostra o que acontece DENTRO (da pele, do copo, do músculo).
// STUB da fundação: círculo com aro, ligado à âncora por um traço, abrindo na deixa; o conteúdo é
// o Reservatorio (estoque) ou camadas chapadas. Dono: agente C (camadas `liso|rede|dobras|fluxo|agua`,
// then `rareia|renova`, partículas `ponto|cordao`, o cone até a parte do corpo, ≥ 1 rótulo dentro).
//
// Não confundir com a `Lente` de src/components.tsx (vinheta redonda presa ao quadro).
// Importa só TIPOS de scenes.tsx (sem ciclo de import).
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MOLA } from '../components';
import { Reservatorio, reservaAt } from '../elenco/reservatorio';
import { C } from '../theme';
import { cue } from '../timeline';
import type { Rect } from './ambientes';
import type { MS } from './scenes';
import type { Camada, LenteSpec, Particulas } from './spec';

/** O quadrado que a lente ocupa (vai pro `busy` da cena: rótulo e cenário saem dali). */
export const lenteRect = (centro: [number, number], diametro: number): Rect => [centro[0] - diametro / 2, centro[1] - diametro / 2, centro[0] + diametro / 2, centro[1] + diametro / 2];

const TOM: Record<NonNullable<Camada['tom']>, string> = { pele: '#E0AC7E', area: C.violet2, violeta: C.violet, fundo: C.surface, ouro: C.gold };

/** As camadas de dentro (w × h do círculo). STUB: faixas chapadas, uma por camada. */
export const Camadas: React.FC<{
  s: MS;
  camadas: Camada[];
  particulas?: Particulas;
  toque?: string;
  ritmo?: 'devagar' | 'normal';
  turnAt: number;
  w: number;
  h: number;
  accent: string;
  pele: string;
}> = ({ camadas, w, h, accent, pele }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
    <rect width={w} height={h} fill={C.deep} />
    {camadas.map((c, i) => {
      const fill = c.tom === 'pele' ? pele : c.tom === 'area' ? accent : TOM[c.tom ?? 'violeta'];
      const band = h / camadas.length;
      return <rect key={i} x={0} y={i * band} width={w} height={band} fill={fill} opacity={0.35 + 0.2 * (c.peso ?? 2)} />;
    })}
  </svg>
);

export const Lente: React.FC<{ s: MS; spec: LenteSpec; ancora: [number, number]; centro: [number, number]; diametro: number; accent: string; pele: string }> = ({
  s,
  spec,
  ancora,
  centro,
  diametro,
  accent,
  pele,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = spec.cue ? cue(s, spec.cue) : -1e9;
  const open = spec.cue ? spring({ frame: frame - at, fps, config: MOLA.entra }) : 1;
  if (open <= 0.001) return null;
  const d = diametro * open;
  const cx = ancora[0] + (centro[0] - ancora[0]) * open;
  const cy = ancora[1] + (centro[1] - ancora[1]) * open;
  const turnAt = spec.turn ? cue(s, spec.turn) : 1e9;
  const conteudo = spec.conteudo;
  const res = 'reserva' in conteudo ? reservaAt(s, conteudo.reserva, frame) : null;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={ancora[0]} y1={ancora[1]} x2={cx} y2={cy} stroke={C.mid} strokeWidth={4} opacity={0.6} />
        <circle cx={ancora[0]} cy={ancora[1]} r={10} fill={accent} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: cx - d / 2,
          top: cy - d / 2,
          width: d,
          height: d,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `8px solid ${C.violet2}`,
          boxSizing: 'border-box',
          background: C.deep,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {res && 'reserva' in conteudo ? (
          <Reservatorio t={frame} size={d * 0.5} nivel={res.nivel} jato={res.jato} pinga={res.pinga} assenta={res.assenta} conteudo={conteudo.reserva.conteudo} />
        ) : 'camadas' in conteudo ? (
          <Camadas s={s} camadas={conteudo.camadas} particulas={conteudo.particulas} toque={conteudo.toque} ritmo={conteudo.ritmo} turnAt={turnAt} w={d} h={d} accent={accent} pele={pele} />
        ) : null}
      </div>
    </div>
  );
};
