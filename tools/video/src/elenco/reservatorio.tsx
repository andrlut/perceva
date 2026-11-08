// Reservatório (fase 3): o tanque de estoque — peça `reservatorio`, conteúdo da lente e Medidor do
// `faz`. STUB da fundação: retângulo de vidro com nível, API final do design.json.
// Dono: agente C (tanque de vidro em prisma hexagonal, grãos dourados assentando com MOLA.pousa,
// jato pela válvula, fio que pinga, Medidor com ficha navy atrás).
//
// Régua do parceiro: estoque, nunca "carregando". O nível sobe em ≥ 1,5 s; dourado só nos grãos e
// no aro, vidro e fundo à vista; nada de raio, bateria, glow em volta.
//
// Importa só TIPOS de scenes.tsx (sem ciclo de import).
import React from 'react';
import { interpolate } from 'remotion';
import { C } from '../theme';
import { cue } from '../timeline';
import type { MS } from '../molde/scenes';
import type { ReservaSpec } from '../molde/spec';

const SHADE = 'rgba(10,14,38,0.28)';

/**
 * O tanque. `size` = largura; altura = 1,35 × size. `nivel` 0..1. `jato`/`pinga` 0..1 = fase de um
 * jato pela válvula / de um fio caindo no topo (0 = nada). `assenta` = quadros desde a última mudança.
 */
export const Reservatorio: React.FC<{
  t: number;
  size: number;
  nivel: number;
  accent?: string;
  conteudo?: 'grao' | 'liquido';
  jato?: number;
  pinga?: number;
  assenta?: number;
}> = ({ size, nivel, accent = C.gold, jato = 0, pinga = 0 }) => {
  const n = Math.max(0, Math.min(1, nivel));
  const top = 40;
  const bottom = 250;
  const y = bottom - (bottom - top) * n;
  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 200 270" style={{ overflow: 'visible' }}>
      <ellipse cx={100} cy={264} rx={80} ry={6} fill="rgba(0,0,0,0.25)" />
      {/* vidro */}
      <rect x={30} y={top - 10} width={140} height={bottom - top + 20} rx={22} fill="rgba(255,255,255,0.10)" />
      {/* conteúdo */}
      {n > 0 ? <rect x={38} y={y} width={124} height={bottom - y + 2} rx={14} fill={accent} opacity={0.9} /> : null}
      {n > 0 ? <rect x={100} y={y} width={62} height={bottom - y + 2} rx={14} fill={SHADE} /> : null}
      {/* aro */}
      <rect x={24} y={top - 18} width={152} height={16} rx={8} fill={accent} />
      {/* válvula + jato */}
      <rect x={168} y={bottom - 30} width={22} height={16} rx={5} fill={C.mid} />
      {jato > 0 && jato < 1 ? <rect x={190} y={bottom - 26} width={30 * Math.sin(Math.PI * jato)} height={8} rx={4} fill={accent} /> : null}
      {/* fio que pinga no topo */}
      {pinga > 0 && pinga < 1 ? <rect x={96} y={top - 70} width={8} height={60 * Math.sin(Math.PI * pinga)} rx={4} fill={accent} /> : null}
    </svg>
  );
};

/** Duração da subida do nível entre dois valores (≥ 1,5 s: estoque enchendo, não "carregando"). */
const SOBE = 45;
const JATO = 12;

/**
 * Estado do tanque no quadro: o nível vai de um valor pro seguinte em `SOBE` quadros a partir da
 * deixa de cada um (o 1º sem deixa vale desde o começo); cada `gasta` solta um jato; cada `pinga`
 * um fio. O agente C faz o jato baixar o nível sem esvaziar.
 */
export const reservaAt = (s: MS, spec: ReservaSpec, frame: number): { nivel: number; jato: number; pinga: number; assenta: number } => {
  const steps = spec.nivel.map((n, i) => ({ v: n.v, at: n.cue ? cue(s, n.cue) : i === 0 ? -1e9 : s.lead }));
  let nivel = steps[0]?.v ?? 0;
  let last = -1e9;
  for (let i = 1; i < steps.length; i++) {
    const { v, at } = steps[i];
    if (frame < at) break;
    nivel = interpolate(frame, [at, at + SOBE], [nivel, v], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    last = at;
  }
  const phase = (list?: { cue: string }[]) => {
    for (const g of list ?? []) {
      const a = cue(s, g.cue);
      if (frame >= a && frame < a + JATO) return (frame - a) / JATO;
    }
    return 0;
  };
  return { nivel, jato: phase(spec.gasta), pinga: phase(spec.pinga), assenta: frame - last };
};

/** O tanque pequeno do `faz` (com ficha navy atrás). `x`,`y` = canto de cima à esquerda da ficha; `size` = largura da ficha. */
export const Medidor: React.FC<{ t: number; x: number; y: number; size: number; nivel: number; jato: number; accent?: string }> = ({ t, x, y, size, nivel, jato, accent }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size * 1.35,
      borderRadius: 24,
      background: 'rgba(10,14,38,0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Reservatorio t={t} size={size * 0.72} nivel={nivel} jato={jato} accent={accent} />
  </div>
);
