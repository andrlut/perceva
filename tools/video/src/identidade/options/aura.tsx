// Opção "aura" — direção Órbita.
//
// A assinatura: cada pessoa carrega a órbita do Emblema em volta da coroa da
// cabeça — um anel fino, inclinado no mesmo sentido do traço dourado do glyph
// (sobe pra direita), na cor de destaque da cena. A metade de trás passa ATRÁS
// da cabeça e a da frente passa NA FRENTE, então lê como órbita (profundidade),
// nunca como auréola de santo (horizontal, solta em cima) nem como planeta
// (anel no equador de uma esfera). Um satélite dourado percorre o anel com `t`.
//
// Embaixo da órbita, gente adulta: cabeça menor que a do molde atual, pescoço,
// pernas curtas e tênis, sobrancelhas, nariz, seis cortes de cabelo e traços
// (barba, óculos, grisalho) que separam as pessoas de longe.
import React from 'react';
import { C, dimColor } from '../../theme';
import type { IdentityOption, PessoaProps } from '../types';

const shade = 'rgba(10,14,38,0.28)';
const shine = 'rgba(255,255,255,0.22)';

// ------------------------------------------------------------------ cor
const rgb = (hex: string) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
/** Mistura duas cores da paleta (t = 0 → a, 1 → b). */
const mix = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};
const lum = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const isWarmYellow = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return r > 190 && g > 130 && b < 120;
};

// Cabelo: tons tirados das peles + navy da marca (escurecer), cobre e prata.
const HAIR = {
  castanho: mix('#5C3A24', C.deep, 0.2),
  preto: mix('#5C3A24', C.deep, 0.48),
  cobre: mix(C.goldDeep, '#8D5A3B', 0.5),
  prata: mix(C.text, C.mid, 0.45),
};

// ------------------------------------------------------------------ órbita
const ORBIT = { cx: 100, cy: 57, rx: 76, ry: 14, tilt: -20 };
const orbitPt = (theta: number, tilt: number) => {
  const x = ORBIT.rx * Math.cos(theta);
  const y = ORBIT.ry * Math.sin(theta);
  const a = (tilt * Math.PI) / 180;
  return { x: ORBIT.cx + x * Math.cos(a) - y * Math.sin(a), y: ORBIT.cy + x * Math.sin(a) + y * Math.cos(a), front: Math.sin(theta) > 0, depth: Math.sin(theta) };
};

const Ring: React.FC<{ half: 'back' | 'front'; color: string; tilt: number }> = ({ half, color, tilt }) => {
  const { cx, cy, rx, ry } = ORBIT;
  const d = half === 'back' ? `M ${-rx} 0 A ${rx} ${ry} 0 0 1 ${rx} 0` : `M ${rx} 0 A ${rx} ${ry} 0 0 1 ${-rx} 0`;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${tilt})`}>
      <path d={d} fill="none" stroke={color} strokeWidth={half === 'back' ? 3.2 : 4.2} strokeLinecap="round" opacity={half === 'back' ? 0.5 : 1} />
    </g>
  );
};

const TRAIL = 9;
const Satellite: React.FC<{ half: 'back' | 'front'; theta: number; color: string; tilt: number }> = ({ half, theta, color, tilt }) => {
  // rastro de cometa: segmentos do anel logo atrás do satélite (ele anda com
  // θ decrescendo), cada um afinando e sumindo; cada pedaço vai pra camada
  // certa (frente/trás), então o rastro também some atrás da cabeça.
  const mine = (front: boolean) => (half === 'front' ? front : !front);
  const pts = Array.from({ length: TRAIL + 1 }, (_, k) => orbitPt(theta + k * 0.085, tilt));
  const head = pts[0];
  const r = 5.4 + 1.6 * head.depth;
  return (
    <g>
      {pts.slice(0, TRAIL).map((p, k) => {
        const q = pts[k + 1];
        if (!mine(Math.sin(theta + (k + 0.5) * 0.085) > 0)) return null;
        const f = 1 - k / TRAIL;
        return (
          <path
            key={k}
            d={`M${p.x} ${p.y} L${q.x} ${q.y}`}
            stroke={color}
            strokeWidth={1.2 + 4.4 * f}
            strokeLinecap="round"
            opacity={0.7 * f * (p.front ? 1 : 0.55)}
          />
        );
      })}
      {mine(head.front) && (
        <g opacity={head.front ? 1 : 0.6}>
          <circle cx={head.x} cy={head.y} r={r} fill={color} />
          <circle cx={head.x - r * 0.32} cy={head.y - r * 0.32} r={r * 0.38} fill={C.hi} opacity={0.85} />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ cabelo
type HairProps = { style: number; color: string; cap: boolean };

/** Camada de trás do cabelo (volume atrás da cabeça). */
const HairBack: React.FC<HairProps> = ({ style, color, cap }) => {
  if (style === 0)
    return (
      <g>
        <path d="M51 82 Q51 38 100 38 Q149 38 149 82 L149 124 Q149 133 140 133 L60 133 Q51 133 51 124 Z" fill={color} />
        <path d="M100 38 Q149 38 149 82 L149 124 Q149 133 140 133 L118 133 Q140 90 100 38Z" fill={shade} />
      </g>
    );
  if (style === 1 && !cap) {
    // black power: nuvem de cachos (círculos em volta de um miolo)
    const bumps = Array.from({ length: 11 }, (_, i) => {
      const a = Math.PI * (0.92 + (i / 10) * 1.16);
      return { x: 100 + 50 * Math.cos(a), y: 76 + 46 * Math.sin(a) };
    });
    return (
      <g>
        <ellipse cx={100} cy={74} rx={56} ry={50} fill={color} />
        {bumps.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={15} fill={color} />
        ))}
        <path d="M100 18 Q160 22 156 80 Q152 116 128 126 Q150 80 100 18Z" fill={shade} />
        <ellipse cx={74} cy={40} rx={12} ry={7} fill={shine} transform="rotate(-30 74 40)" />
      </g>
    );
  }
  if (style === 1 && cap)
    // de boné, os cachos escapam dos lados
    return (
      <g>
        <circle cx={58} cy={92} r={17} fill={color} />
        <circle cx={142} cy={92} r={17} fill={color} />
        <circle cx={142} cy={92} r={17} fill={shade} />
      </g>
    );
  if (style === 3 && !cap)
    return (
      <g>
        <circle cx={104} cy={34} r={17} fill={color} />
        <path d="M104 17 a17 17 0 0 1 0 34 a11 17 0 0 0 0 -34z" fill={shade} />
        <circle cx={98} cy={28} r={4} fill={shine} />
      </g>
    );
  return null;
};

/** Camada da frente do cabelo (por cima da testa) + barba/óculos. */
const HairFront: React.FC<HairProps & { brow: string }> = ({ style, color, cap }) => {
  const s = style;
  if (cap) {
    // com boné, só o que aparece por baixo (costeleta / pontas do bob)
    return s === 0 || s === 5 ? <path d="M57 86 Q56 104 60 112 L66 110 Q62 98 64 86Z" fill={color} /> : null;
  }
  if (s === 0)
    // bob com franja lateral (repartido à direita, a franja varre pra esquerda)
    return (
      <g>
        <path d="M56 100 C50 58 72 41 100 41 C130 41 150 58 144 98 C140 82 134 70 124 62 C112 72 88 72 70 76 C62 82 58 90 56 100Z" fill={color} />
        <path d="M124 62 C134 70 140 82 144 98 C150 58 130 41 100 41 C122 46 126 54 124 62Z" fill={shade} />
        <ellipse cx={78} cy={52} rx={13} ry={5} fill={shine} transform="rotate(-18 78 52)" />
      </g>
    );
  if (s === 1)
    // linha dos cachos na testa
    return (
      <g>
        <path d="M59 84 C58 60 76 48 100 48 C124 48 142 60 141 84 C130 70 116 64 100 64 C84 64 70 70 59 84Z" fill={color} />
        {[66, 80, 94, 108, 122, 134].map((x, i) => (
          <circle key={i} cx={x} cy={i === 0 || i === 5 ? 74 : 66} r={7} fill={color} />
        ))}
      </g>
    );
  if (s === 2)
    // curto com topete + barba
    return (
      <g>
        <path d="M58 88 C54 52 76 38 104 40 C130 42 146 58 142 88 C138 74 132 66 124 63 C110 58 92 58 76 64 C66 70 60 78 58 88Z" fill={color} />
        <path d="M76 46 Q100 30 124 44 Q104 40 86 52Z" fill={color} />
        <path d="M124 63 C132 66 138 74 142 88 C146 58 130 42 104 40 C124 48 126 56 124 63Z" fill={shade} />
        {/* barba: contorna o queixo e deixa a boca livre */}
        <path d="M58 96 Q60 132 100 140 Q140 132 142 96 L136 98 Q134 128 100 130 Q66 128 64 98Z" fill={color} />
        <path d="M100 140 Q140 132 142 96 L136 98 Q134 128 100 130Z" fill={shade} />
      </g>
    );
  if (s === 3)
    // puxado pra trás, risca no meio (o coque fica na camada de trás)
    return (
      <g>
        <path d="M58 92 C55 56 76 44 100 44 C124 44 145 56 142 92 C138 72 122 60 100 60 C78 60 62 72 58 92Z" fill={color} />
        <path d="M100 44 C124 44 145 56 142 92 C138 72 122 60 100 60Z" fill={shade} />
        <ellipse cx={80} cy={52} rx={11} ry={4} fill={shine} transform="rotate(-20 80 52)" />
      </g>
    );
  if (s === 4) {
    // twists curtos: borda de cima ondulada
    const tw = Array.from({ length: 9 }, (_, i) => {
      const a = Math.PI * (1.08 + (i / 8) * 0.84);
      return { x: 100 + 44 * Math.cos(a), y: 88 + 44 * Math.sin(a) };
    });
    return (
      <g>
        <path d="M58 86 C56 56 76 44 100 44 C124 44 144 56 142 86 C134 72 120 66 100 66 C80 66 66 72 58 86Z" fill={color} />
        {tw.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={9} fill={color} />
        ))}
        <path d="M124 48 Q146 60 142 86 C138 74 132 70 126 68Z" fill={shade} />
      </g>
    );
  }
  // 5: grisalho curto, varrido pro lado
  return (
    <g>
      <path d="M57 94 C52 56 74 40 102 40 C132 40 148 60 143 94 C142 80 136 70 128 64 C116 68 96 64 84 56 C78 66 68 74 60 84 Z" fill={color} />
      <path d="M128 64 C136 70 142 80 143 94 C148 60 132 40 102 40 C124 46 130 56 128 64Z" fill={shade} />
      <ellipse cx={86} cy={48} rx={12} ry={4} fill={shine} transform="rotate(-12 86 48)" />
    </g>
  );
};

// ------------------------------------------------------------------ rosto
const Face: React.FC<{ t: number; seed: number; mood: 'ok' | 'feliz' | 'cansado'; skin: string; brow: string; glasses: boolean }> = ({ t, seed, mood, skin, brow, glasses }) => {
  const k = (t + seed * 37) % 96;
  const blink = k < 4;
  const ey = 98;
  const ex = [85, 115];
  const browD =
    mood === 'feliz'
      ? ['M77 85 Q85 79 93 83', 'M107 83 Q115 79 123 85']
      : mood === 'cansado'
        ? ['M77 89 Q85 87 93 84', 'M107 84 Q115 87 123 89']
        : ['M77 87 Q85 83 93 85', 'M107 85 Q115 83 123 87'];
  return (
    <g>
      {/* olhos */}
      {ex.map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={ey} rx={5.2} ry={blink ? 1.1 : 6} fill={C.deep} />
          {mood === 'feliz' && !blink && <path d={`M${x - 7} ${ey + 7.5} Q${x} ${ey + 1} ${x + 7} ${ey + 7.5} V${ey + 9} H${x - 7}Z`} fill={skin} />}
          {mood === 'cansado' && !blink && (
            <g>
              <rect x={x - 7} y={ey - 8} width={14} height={7.5} fill={skin} />
              <path d={`M${x - 6.5} ${ey - 0.6} H${x + 6.5}`} stroke={C.deep} strokeWidth={2.6} strokeLinecap="round" />
              <path d={`M${x - 5} ${ey + 9} q5 2.6 10 0`} stroke={shade} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            </g>
          )}
        </g>
      ))}
      {/* sobrancelhas */}
      {browD.map((d) => (
        <path key={d} d={d} stroke={brow} strokeWidth={3.8} strokeLinecap="round" fill="none" />
      ))}
      {/* nariz */}
      <path d="M102 101 Q107 108 101 110" stroke="rgba(10,14,38,0.24)" strokeWidth={3.2} strokeLinecap="round" fill="none" />
      {/* boca */}
      {mood === 'feliz' ? (
        <path d="M86 113 Q100 135 114 113 Q100 118 86 113Z" fill={C.deep} />
      ) : mood === 'cansado' ? (
        <path d="M92 121 Q100 116 108 121" stroke={C.deep} strokeWidth={4.2} strokeLinecap="round" fill="none" />
      ) : (
        <path d="M93 118 Q100 120 107 118" stroke={C.deep} strokeWidth={4.2} strokeLinecap="round" fill="none" />
      )}
      {glasses && (
        <g fill="rgba(255,255,255,0.10)" stroke={C.deep} strokeWidth={2.8}>
          <circle cx={85} cy={98} r={10} />
          <circle cx={115} cy={98} r={10} />
          <path d="M95 97 Q100 94 105 97" fill="none" />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ pessoa
const Pessoa: React.FC<PessoaProps> = ({
  t = 0,
  size = 260,
  accent = C.violet,
  skin = '#F2C9A0',
  mood = 'ok',
  seed = 0,
  arms = 'none',
  still = false,
  cap,
  sweat = false,
}) => {
  const s = ((seed % 6) + 6) % 6;
  const alt = Math.floor(seed / 6) % 2 === 1; // seeds 6+ : espelha o cabelo
  const hairColor = [HAIR.castanho, HAIR.preto, HAIR.castanho, HAIR.cobre, HAIR.preto, HAIR.prata][alt ? (s + 2) % 6 : s];
  const brow = s === 5 && !alt ? mix(HAIR.prata, C.dim, 0.5) : mix(hairColor, C.deep, 0.25);
  const ringColor = lum(accent) < 0.08 ? C.dim : accent;
  const satColor = isWarmYellow(accent) ? C.hi : C.goldLight;

  const bob = still ? 0 : Math.sin((t + seed * 11) / 14) * 3;
  const wave = arms === 'up' ? Math.sin((t + seed * 7) / 5) * 10 : 0;
  const [la, ra] =
    arms === 'down' ? [14, -14] : arms === 'up' ? [150 + wave, -150 - wave] : arms === 'out' ? [14, -78] : [4, -4];

  const tilt = ORBIT.tilt + Math.sin((t + seed * 19) / 40) * 1.5;
  const theta = -2 * Math.PI * (((t + seed * 23) % 110) / 110) + 0.6;

  const trouser = mix(accent, C.deep, 0.55);
  const sleeve = (side: 'l' | 'r', a: number) => {
    const px = side === 'l' ? 58 : 142;
    // manga afinando do ombro ao punho
    const armD = `M${px - 9.5} 157 Q${px - 9.5} 147 ${px} 147 Q${px + 9.5} 147 ${px + 9.5} 157 L${px + 7.5} 201 Q${px + 7.5} 206 ${px} 206 Q${px - 7.5} 206 ${px - 7.5} 201Z`;
    return (
      <g transform={`rotate(${a} ${px} 158)`}>
        <path d={armD} fill={accent} />
        <path d={armD} fill={shade} opacity={side === 'r' ? 1 : 0.45} />
        <circle cx={px} cy={210} r={9.5} fill={skin} />
        <path d={`M${px} 200.5 a9.5 9.5 0 0 1 0 19 a6.5 9.5 0 0 0 0 -19z`} fill={shade} opacity={0.5} />
      </g>
    );
  };
  const hp = { style: s, color: hairColor, cap: !!cap };

  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260">
      <ellipse cx={100} cy={252} rx={52} ry={7} fill="rgba(0,0,0,0.25)" />
      {/* pernas e tênis: ficam no chão; só o tronco respira */}
      <path d="M76 206 H97 L96 242 H78Z" fill={trouser} />
      <path d="M103 206 H124 L122 242 H104Z" fill={trouser} />
      <path d="M103 206 H124 L122 242 H104Z" fill={shade} />
      <rect x={70} y={239} width={29} height={12} rx={6} fill={C.text} />
      <rect x={101} y={239} width={29} height={12} rx={6} fill={C.text} />
      <rect x={116} y={239} width={14} height={12} rx={6} fill={shade} />
      <g transform={`translate(0 ${bob})`}>
        {/* órbita: metade de trás e satélite quando está atrás */}
        <Ring half="back" color={ringColor} tilt={tilt} />
        <Satellite half="back" theta={theta} color={satColor} tilt={tilt} />

        {/* tronco */}
        <path d="M78 145 H122 Q146 146 149 172 L144 213 Q143 222 134 222 H66 Q57 222 56 213 L51 172 Q54 146 78 145Z" fill={accent} />
        <path d="M114 145 H122 Q146 146 149 172 L144 213 Q143 222 134 222 H120 Q130 182 114 145Z" fill={shade} />
        {/* pescoço + gola */}
        <rect x={89} y={124} width={22} height={30} rx={9} fill={skin} />
        <rect x={100} y={124} width={11} height={30} rx={5} fill={shade} opacity={0.55} />
        {s % 3 === 2 ? (
          <g>
            <path d="M86 146 L100 160 L114 146Z" fill={skin} />
            <path d="M84 144 L99 162 L90 166 L78 148Z" fill={mix(accent, C.hi, 0.45)} />
            <path d="M116 144 L101 162 L110 166 L122 148Z" fill={mix(accent, C.hi, 0.3)} />
          </g>
        ) : s % 3 === 1 ? (
          <path d="M86 146 L100 166 L114 146Z" fill={skin} />
        ) : (
          <path d="M86 146 Q100 160 114 146Z" fill={skin} />
        )}

        {/* braços (os dois na frente do tronco) */}
        {sleeve('l', la)}
        {sleeve('r', ra)}

        {/* cabeça */}
        <g transform={alt ? 'translate(200 0) scale(-1 1)' : undefined}>
          <HairBack {...hp} />
        </g>
        {(s !== 0 || cap) && (
          <g>
            <circle cx={60} cy={100} r={8} fill={skin} />
            <circle cx={140} cy={100} r={8} fill={skin} />
            <circle cx={140} cy={100} r={8} fill={shade} />
          </g>
        )}
        <ellipse cx={100} cy={92} rx={40} ry={46} fill={skin} />
        <path d="M100 46 a40 46 0 0 1 0 92 a30 46 0 0 0 0 -92z" fill={shade} opacity={0.5} />
        <circle cx={80} cy={70} r={7} fill={shine} />
        <Face t={t} seed={seed} mood={mood === 'focado' ? 'ok' : mood} skin={skin} brow={brow} glasses={s === 5 && !alt} />
        <g transform={alt ? 'translate(200 0) scale(-1 1)' : undefined}>
          <HairFront {...hp} brow={brow} />
        </g>

        {cap && (
          <g>
            <path d="M55 84 a45 44 0 0 1 90 0 q-45 -9 -90 0z" fill={cap} />
            <path d="M100 40 a45 44 0 0 1 45 44 q-22 -4.5 -45 -5z" fill={shade} />
            <rect x={118} y={74} width={54} height={11} rx={5.5} fill={cap} />
            <rect x={140} y={74} width={32} height={11} rx={5.5} fill={shade} />
          </g>
        )}

        {/* órbita: metade da frente e satélite quando está na frente */}
        <Ring half="front" color={ringColor} tilt={tilt} />
        <Satellite half="front" theta={theta} color={satColor} tilt={tilt} />

        {sweat && (
          <path
            d={`M148 ${66 + ((t + seed * 9) % 30)} q8 12 0 18 q-8 -6 0 -18z`}
            fill={dimColor('bonds')}
            opacity={1 - ((t + seed * 9) % 30) / 30}
          />
        )}
      </g>
    </svg>
  );
};

/** Fundo: a mesma órbita em escala de palco — três anéis finos com a mesma
 *  inclinação das pessoas e um satélite lento. Bem apagado: é atmosfera. */
const Backdrop: React.FC<{ t: number; width: number; height: number; accent: string }> = ({ t, width, height, accent }) => {
  const cx = width / 2;
  const cy = height * 0.46;
  const rings = [0.26, 0.37, 0.48].map((k) => ({ rx: width * k, ry: width * k * 0.2 }));
  const a = (ORBIT.tilt * Math.PI) / 180;
  const sat = (i: number, speed: number, off: number) => {
    const { rx, ry } = rings[i];
    const th = -t / speed + off;
    const x = rx * Math.cos(th);
    const y = ry * Math.sin(th);
    return { x: cx + x * Math.cos(a) - y * Math.sin(a), y: cy + x * Math.sin(a) + y * Math.cos(a) };
  };
  const s1 = sat(2, 70, 1.2);
  const s2 = sat(0, 46, 3.6);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(${cx} ${cy}) rotate(${ORBIT.tilt})`} fill="none">
        {rings.map((r, i) => (
          <ellipse
            key={i}
            rx={r.rx}
            ry={r.ry}
            stroke={i === 1 ? accent : C.faint}
            strokeWidth={i === 1 ? 2 : 1.5}
            opacity={i === 1 ? 0.22 : 0.3}
            strokeDasharray={i === 2 ? '2 10' : undefined}
            strokeLinecap="round"
          />
        ))}
      </g>
      <circle cx={s1.x} cy={s1.y} r={5} fill={C.goldLight} opacity={0.45} />
      <circle cx={s2.x} cy={s2.y} r={3.5} fill={accent} opacity={0.5} />
    </svg>
  );
};

export const option: IdentityOption = {
  id: 'aura',
  name: 'Órbita',
  pitch: 'Cada pessoa carrega a órbita do Emblema em volta da cabeça, com um satélite dourado girando: dá pra reconhecer o Perceva só pela silhueta.',
  Pessoa,
  Backdrop,
};
