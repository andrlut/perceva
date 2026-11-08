// Peças da fase 3 — STUB da fundação (formas simples, já registradas no Peca.tsx e no catalog.json).
// Dono: agente E. Mesmas regras do cast.tsx/objetos.tsx: chapado, sem contorno, sombra num lado
// só, paleta de src/theme.ts, `accent` = cor da área, animação por `t` ou `progress`, NENHUM texto
// nem marca (pote e coqueteleira sem rótulo, calendário sem algarismo).
//
// Caixas (BOX no Peca.tsx, em frações de `size`): peso [1, 0.5] · pote [0.8, 1] ·
// calendario [1, 1.05] · coqueteleira [0.55, 1].
import React from 'react';
import { C } from '../theme';

const SHADE = 'rgba(10,14,38,0.28)';

/** Halter: barra curta + 2 anilhas hexagonais com aro na cor da área. */
export const Peso: React.FC<{ size: number; accent?: string }> = ({ size, accent = C.gold }) => {
  const hex = (cx: number) => {
    const pts = [0, 60, 120, 180, 240, 300].map((a) => {
      const r = (a * Math.PI) / 180;
      return `${(cx + Math.cos(r) * 26).toFixed(1)},${(50 + Math.sin(r) * 40).toFixed(1)}`;
    });
    return pts.join(' ');
  };
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 200 100" style={{ overflow: 'visible' }}>
      <ellipse cx={100} cy={96} rx={80} ry={5} fill="rgba(0,0,0,0.25)" />
      <rect x={44} y={43} width={112} height={14} rx={7} fill={C.mid} />
      {[44, 156].map((x) => (
        <g key={x}>
          <polygon points={hex(x)} fill={C.surface3} stroke={accent} strokeWidth={6} strokeLinejoin="round" />
          <polygon points={hex(x)} fill={SHADE} opacity={x > 100 ? 1 : 0.4} />
        </g>
      ))}
    </svg>
  );
};

/** Pote branco sem marca, tampa na cor da área. `progress`: a colher dosadora sai do pote. */
export const Pote: React.FC<{ size: number; accent?: string; progress?: number }> = ({ size, accent = C.gold, progress = 0 }) => (
  <svg width={size * 0.8} height={size} viewBox="0 0 160 200" style={{ overflow: 'visible' }}>
    <ellipse cx={80} cy={194} rx={60} ry={6} fill="rgba(0,0,0,0.25)" />
    {progress > 0 ? <rect x={96} y={40 - 50 * progress} width={12} height={70} rx={6} fill={C.mid} /> : null}
    <rect x={22} y={60} width={116} height={132} rx={18} fill={C.hi} />
    <rect x={80} y={60} width={58} height={132} rx={18} fill={SHADE} opacity={0.35} />
    <rect x={16} y={36} width={128} height={32} rx={10} fill={accent} />
    <rect x={80} y={36} width={64} height={32} rx={10} fill={SHADE} />
  </svg>
);

/**
 * Calendário 7×4 sem algarismo: `progress` 0..1 marca as casas (ponto da cor da área), uma a uma.
 * (O agente E faz a casa nova pousar e a grade rolar uma linha quando enche.)
 */
export const Calendario: React.FC<{ size: number; accent?: string; progress?: number }> = ({ size, accent = C.gold, progress = 0 }) => {
  const marked = Math.round(Math.max(0, Math.min(1, progress)) * 28);
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 200 210" style={{ overflow: 'visible' }}>
      <ellipse cx={100} cy={206} rx={84} ry={5} fill="rgba(0,0,0,0.25)" />
      <rect x={10} y={10} width={180} height={192} rx={16} fill={C.surface3} />
      <rect x={10} y={10} width={180} height={36} rx={16} fill={accent} />
      <rect x={10} y={30} width={180} height={16} fill={accent} />
      {Array.from({ length: 28 }, (_, i) => {
        const x = 22 + (i % 7) * 23.5;
        const y = 60 + Math.floor(i / 7) * 34;
        return (
          <g key={i}>
            <rect x={x} y={y} width={18} height={26} rx={5} fill={C.surface2} />
            {i < marked ? <circle cx={x + 9} cy={y + 13} r={6} fill={accent} /> : null}
          </g>
        );
      })}
      <rect x={100} y={10} width={90} height={192} rx={16} fill={SHADE} opacity={0.35} />
    </svg>
  );
};

/** Coqueteleira sem marca: copo translúcido, tampa e bico na cor da área. */
export const Coqueteleira: React.FC<{ t: number; size: number; accent?: string; progress?: number }> = ({ size, accent = C.gold }) => (
  <svg width={size * 0.55} height={size} viewBox="0 0 110 200" style={{ overflow: 'visible' }}>
    <ellipse cx={55} cy={195} rx={44} ry={5} fill="rgba(0,0,0,0.25)" />
    <path d="M14 56 H96 L88 186 a8 8 0 0 1 -8 8 H30 a8 8 0 0 1 -8 -8 Z" fill="rgba(255,255,255,0.18)" />
    <path d="M18 100 H92 L88 186 a8 8 0 0 1 -8 8 H30 a8 8 0 0 1 -8 -8 Z" fill={C.text} opacity={0.75} />
    <rect x={10} y={30} width={90} height={30} rx={8} fill={accent} />
    <rect x={40} y={10} width={30} height={24} rx={6} fill={accent} />
    <rect x={55} y={30} width={45} height={30} rx={8} fill={SHADE} />
    <rect x={55} y={10} width={15} height={24} rx={4} fill={SHADE} />
  </svg>
);
