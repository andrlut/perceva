// Opção "gente" — Gente de verdade.
//
// Ilustração editorial chapada, de revista: pescoço, ombros, maxilar, cabelo
// de verdade (chanel, black power, tranças box braids, cachos, curto, longo
// grisalho) e roupa com gola e camada. Duas assinaturas, sempre no mesmo
// lugar em todo mundo:
//  1. O OLHAR do logo (principal) — íris violeta com anel claro, pupila e o
//     brilho dourado no canto de cima-esquerda; a pálpebra corta o topo do
//     olho (olhar calmo de adulto, nunca o olho arregalado de desenho infantil).
//  2. O TRAÇO do Topo Iris (secundária) — bordado no peito esquerdo, na
//     diagonal do glifo, afinando de baixo pra cima e terminando redondo como
//     o ponto do logo. Rente ao tecido: sem sombra, sem ponteira, nunca toca o
//     ombro (não é alça nem cinto).
// Sem contorno; sombra num lado só (luz de cima-esquerda) + um brilho pequeno.
// Três moldes de roupa (gola careca · camada aberta · camisa de gola); a
// variedade vem da cor e do cabelo. Abaixo de 160 px some o miúdo (botão,
// trança riscada, nervura da gola), abaixo de 130 px o olho perde o anel.
import React from 'react';
import { C, dimColor } from '../../theme';
import type { Arms, IdentityOption, Mood, PessoaProps } from '../types';

const SHADE = 'rgba(10,14,38,0.28)';
const SHINE = 'rgba(255,255,255,0.22)';
/** Cabeça um pouco menor que a do molde (proporção adulta), presa no queixo. */
const HEAD_K = 0.93;

const HEX = /^#[0-9a-f]{6}$/i;
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Mistura duas cores hex (k = 0 → a, 1 → b). Só deriva tons da paleta. */
const mix = (a: string, b: string, k: number) => {
  if (!HEX.test(a) || !HEX.test(b)) return a;
  const [x, y] = [rgb(a), rgb(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
const lum = (h: string) => {
  if (!HEX.test(h)) return 0.4;
  const [r, g, b] = rgb(h).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** A roupa é dourada demais pro traço dourado aparecer? */
const nearGold = (a: string) => {
  if (!HEX.test(a)) return false;
  const [x, g] = [rgb(a), rgb(C.gold)];
  return Math.hypot(x[0] - g[0], x[1] - g[1], x[2] - g[2]) < 110;
};

// cabelos: derivados das peles e da paleta (nada de preto puro — some no navy)
const BROWN = '#5C3A24';
const INK = mix(BROWN, C.deep, 0.45);
const BRAID = mix(BROWN, C.deep, 0.3);
const AUBURN = '#8D5A3B';
const HONEY = C.goldDeep;
const SILVER = mix(C.mid, C.hi, 0.35);
/** Cabelo que não se separa da pele (cabelo escuro em pele escura) escurece. */
const hairFor = (hair: string, skin: string) =>
  contrast(hair, skin) >= 1.35 ? hair : mix(hair, lum(skin) < 0.2 ? C.deep : C.hi, 0.4);

// parte de baixo: UM valor escuro e calmo pra todo mundo (não briga com chão nem móvel)
const PANTS = C.surface2;
const PANTS_SKIRT = mix(C.surface2, C.surface3, 0.5);
const SHOES = mix(C.faint, C.deep, 0.25);

type Top = 'crew' | 'open' | 'collar';
type Look = {
  hair: string;
  brow: string;
  ears: boolean;
  top: Top;
  /** gola careca alta (rulê) */
  high?: boolean;
  /** cor da camiseta por baixo da camada aberta */
  inner?: string;
  beard?: 'full' | 'goatee';
  glasses?: boolean;
  earrings?: boolean;
  skirt?: boolean;
};

const LOOKS: Look[] = [
  // 0 — chanel mel, blazer aberto sobre camiseta branca (a protagonista)
  { hair: HONEY, brow: mix(HONEY, C.deep, 0.45), ears: false, top: 'open', inner: C.hi },
  // 1 — black power + barba cheia, suéter de gola careca
  { hair: INK, brow: INK, ears: true, top: 'crew', beard: 'full' },
  // 2 — box braids presas no alto (coque) com tranças soltas, camisa de gola, brinco
  { hair: BRAID, brow: mix(BROWN, C.deep, 0.4), ears: true, top: 'collar', earrings: true },
  // 3 — cachos na altura do ombro, gola rulê
  { hair: AUBURN, brow: mix(AUBURN, C.deep, 0.4), ears: false, top: 'crew', high: true },
  // 4 — curto com topete, cavanhaque, sobrecamisa aberta sobre camiseta escura
  { hair: INK, brow: INK, ears: true, top: 'open', inner: C.surface2, beard: 'goatee' },
  // 5 — longo grisalho, óculos, camisa de gola + saia
  { hair: SILVER, brow: C.dim, ears: false, top: 'collar', glasses: true, skirt: true },
];

// ------------------------------------------------------------------ cabeça
// rosto oval com maxilar (queixo mais estreito que as maçãs) — não é bola
const HEAD = 'M100 50 C123 50 138 67 138 90 C138 108 133 121 122 130 C115 135.5 108 138 100 138 C92 138 85 135.5 78 130 C67 121 62 108 62 90 C62 67 77 50 100 50Z';
const HEAD_SHADE = 'M100 50 C123 50 138 67 138 90 C138 108 133 121 122 130 C115 135.5 108 138 100 138 C112 131 127 114 127 90 C127 70 117 55 100 50Z';

/** Uma trança: fio grosso + (em tamanho grande) os gomos riscados. */
const Braid: React.FC<{ d: string; c: string; detail: boolean; w?: number }> = ({ d, c, detail, w = 6.2 }) => (
  <g>
    <path d={d} stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    {detail && <path d={d} stroke={mix(c, C.deep, 0.45)} strokeWidth={w} strokeDasharray="1.6 3.4" fill="none" opacity={0.7} />}
  </g>
);

/** Cabelo de trás (atrás do rosto e do tronco). */
const HairBack: React.FC<{ seed: number; c: string; cap?: string; detail: boolean }> = ({ seed, c, cap, detail }) => {
  switch (seed) {
    case 0: // chanel reto, na linha do queixo
      return (
        <g>
          <path d="M100 40 C129 40 148 59 148 90 L148 126 Q148 134 140 134 L60 134 Q52 134 52 126 L52 90 C52 59 71 40 100 40Z" fill={c} />
          <path d="M126 46 C140 54 148 70 148 90 L148 126 Q148 134 140 134 L132 134 C138 110 138 70 126 46Z" fill={SHADE} />
        </g>
      );
    case 1: {
      // black power: volume redondo com borda macia
      const ring = [200, 225, 250, 275, 300, 325, 350, 15, 40].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return { x: 100 + Math.cos(r) * 46, y: 74 + Math.sin(r) * 40 };
      });
      return (
        <g>
          <ellipse cx={100} cy={76} rx={52} ry={46} fill={c} />
          {ring.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={15} fill={c} />
          ))}
          <path d="M128 36 C150 46 158 72 152 100 C150 110 146 116 140 120 C146 96 144 60 128 36Z" fill={SHADE} />
        </g>
      );
    }
    case 2: {
      // box braids: coque de tranças enrolado em anéis (eco discreto do Topo
      // Iris) + tranças compridas caindo atrás dos ombros
      const back = [
        'M58 78 C52 104 50 136 52 170',
        'M64 74 C58 104 57 138 59 164',
        'M142 78 C148 104 150 136 148 170',
        'M136 74 C142 104 143 138 141 164',
      ];
      return (
        <g>
          {back.map((d, i) => (
            <Braid key={i} d={d} c={i > 1 ? mix(c, C.deep, 0.18) : c} detail={detail} />
          ))}
          {!cap && (
            <g>
              <circle cx={100} cy={35} r={16} fill={c} />
              <circle cx={100} cy={35} r={10.5} fill="none" stroke={mix(c, C.deep, 0.4)} strokeWidth={2.4} />
              {detail && <circle cx={100} cy={35} r={5.2} fill="none" stroke={mix(c, C.deep, 0.4)} strokeWidth={2.2} />}
              <path d="M108 21 A16 16 0 0 1 104 50.5 A12 16 0 0 0 108 21Z" fill={SHADE} />
              <rect x={89} y={46} width={22} height={6} rx={3} fill={C.goldDeep} />
            </g>
          )}
        </g>
      );
    }
    case 3: {
      // cachos até o ombro: nuvem de círculos (com boné, os do alto somem: o boné assenta neles)
      const curls: [number, number, number][] = [
        [62, 70, 15], [56, 90, 14], [55, 110, 14], [58, 130, 13], [66, 144, 11],
        [138, 70, 15], [144, 90, 14], [145, 110, 14], [142, 130, 13], [134, 144, 11],
        ...(cap ? [] : ([[76, 50, 16], [100, 42, 17], [124, 50, 16]] as [number, number, number][])),
      ];
      return (
        <g>
          {curls.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={c} />
          ))}
          <path d="M146 76 C158 92 158 126 146 144 Q140 150 134 150 C146 126 148 98 140 74Z" fill={SHADE} />
        </g>
      );
    }
    case 5: // longo, liso, cai atrás dos ombros
      return (
        <g>
          <path d="M100 40 C130 40 150 62 150 96 L153 172 Q140 180 100 180 Q60 180 47 172 L50 96 C50 62 70 40 100 40Z" fill={c} />
          <path d="M128 46 C142 56 150 74 150 96 L153 172 Q148 176 140 177 C144 140 142 80 128 46Z" fill={SHADE} />
        </g>
      );
    default:
      return null;
  }
};

/** Cabelo da frente (sobre a testa). */
const HairFront: React.FC<{ seed: number; c: string; skin: string; detail: boolean; cap?: string }> = ({ seed, c, skin, detail, cap }) => {
  switch (seed) {
    case 0: // franja lateral: risca à esquerda, varre pra direita
      return (
        <g>
          <path d="M60 102 C57 70 74 45 100 45 C127 45 144 64 141 102 C136 86 124 76 108 72 C96 70 87 66 82 59 C78 72 70 86 60 102Z" fill={c} />
          <path d="M120 50 C134 58 142 76 141 102 C137 90 131 82 124 77 C126 68 124 58 120 50Z" fill={SHADE} />
          <path d="M70 62 C76 54 84 50 92 49" stroke={SHINE} strokeWidth={3} strokeLinecap="round" fill="none" />
        </g>
      );
    case 1: // linha do cabelo arredondada
      return <path d="M63 92 C60 62 78 46 100 46 C122 46 140 62 137 92 C133 78 122 68 100 67 C78 68 67 78 63 92Z" fill={c} />;
    case 2: {
      // tranças puxadas pra trás (risca no meio, repartição do couro à mostra)
      // + três tranças soltas caindo pela frente do ombro direito do quadro
      const front = ['M57 90 C53 116 54 150 58 184', 'M63 94 C59 120 60 152 64 188', 'M69 101 C66 126 67 156 71 191'];
      return (
        <g>
          <path d="M62 94 C58 62 77 46 100 46 C123 46 142 62 138 94 C135 77 124 64 108 61 L100 66 L92 61 C76 64 65 77 62 94Z" fill={c} />
          <path d="M118 50 C132 58 140 74 138 94 C135 80 128 70 120 65Z" fill={SHADE} />
          {detail && (
            <g stroke={mix(skin, c, 0.35)} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.75}>
              <path d="M100 48 L100 65" />
              <path d="M86 52 C80 58 74 68 70 80" />
              <path d="M114 52 C120 58 126 68 130 80" />
            </g>
          )}
          {front.map((d, i) => (
            <Braid key={i} d={d} c={i === 1 ? mix(c, C.deep, 0.15) : c} detail={detail} w={6.4} />
          ))}
          <path d="M56 94 C54 110 54 124 55 134" stroke={SHINE} strokeWidth={1.8} strokeLinecap="round" fill="none" />
        </g>
      );
    }
    case 3: {
      // franja de cachos
      const fr: [number, number, number][] = [
        [70, 70, 10], [82, 60, 11], [96, 56, 11], [110, 57, 11], [123, 62, 11], [132, 72, 10],
      ];
      return (
        <g>
          <path d="M62 90 C60 62 78 46 100 46 C122 46 140 62 138 90 Q100 60 62 90Z" fill={c} />
          {fr.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={c} />
          ))}
          <circle cx={80} cy={56} r={3} fill={SHINE} />
        </g>
      );
    }
    case 4: // curto, laterais baixas, topete (o topete não fura o boné)
      return (
        <g>
          <path d="M62 90 C60 60 76 42 100 41 C124 40 141 56 139 88 L135 86 C133 74 126 66 116 64 C104 62 92 68 78 66 C70 70 66 80 65 90Z" fill={c} />
          {!cap && <path d="M70 52 C82 40 104 34 122 42 C112 42 96 44 86 52Z" fill={c} />}
          <path d="M120 44 C132 52 140 68 139 88 L135 86 C134 72 128 60 120 54Z" fill={SHADE} />
          {!cap && <path d="M84 47 C92 42 102 40 110 41" stroke={SHINE} strokeWidth={2.5} strokeLinecap="round" fill="none" />}
        </g>
      );
    case 5: // risca no meio + mecha pela frente do ombro esquerdo
      return (
        <g>
          <path d="M60 102 C57 66 76 44 100 45 C124 44 143 66 140 102 C136 82 120 62 101 55 C80 62 64 82 60 102Z" fill={c} />
          <path d="M62 86 C55 110 55 144 62 178 Q71 184 79 177 C71 150 69 118 71 96Z" fill={c} />
          <path d="M122 52 C134 62 141 80 140 102 C137 86 131 74 124 66Z" fill={SHADE} />
          <path d="M74 66 C80 56 88 50 96 48" stroke={SHINE} strokeWidth={3} strokeLinecap="round" fill="none" />
        </g>
      );
    default:
      return null;
  }
};

const Beard: React.FC<{ kind: 'full' | 'goatee'; c: string }> = ({ kind, c }) =>
  kind === 'full' ? (
    <path
      d="M63 100 C64 116 70 126 79 132 C86 137 93 140 100 140 C107 140 114 137 121 132 C130 126 136 116 137 100 L133 101 C131 114 123 121 113 123 Q100 119 87 123 C77 121 69 114 67 101Z"
      fill={c}
    />
  ) : (
    <g fill={c}>
      <path d="M89 125 Q100 122 111 125 Q111 136 100 139 Q89 136 89 125Z" />
      <path d="M89 113.5 Q100 108.5 111 113.5 Q100 111.5 89 113.5Z" />
    </g>
  );

/** Bochecha: tom quente tirado da própria pele (nunca violeta em pele). */
const blushOf = (skin: string): { c: string; o: number } | null => {
  if (!HEX.test(skin)) return null;
  const l = lum(skin);
  if (l < 0.08) return null; // pele bem escura: sem blush (vira mancha)
  return l > 0.25 ? { c: mix(skin, '#E07A6A', 0.6), o: 0.34 } : { c: mix(skin, '#B0483E', 0.5), o: 0.26 };
};

/** O olho do logo: íris violeta, anel claro, pupila e brilho dourado. */
const Eye: React.FC<{ x: number; y: number; mood: Mood; closed: boolean; detail: boolean; skin: string; iris: [string, string] }> = ({
  x,
  y,
  mood,
  closed,
  detail,
  skin,
  iris,
}) => {
  if (closed) {
    return <path d={`M${x - 7} ${y - 0.5} Q${x} ${y + 3.5} ${x + 7} ${y - 0.5}`} stroke={C.deep} strokeWidth={2.8} strokeLinecap="round" fill="none" />;
  }
  const R = 7.4;
  const out = x < 100 ? -1 : 1; // lado de fora do rosto
  const tired = mood === 'cansado';
  // pálpebra de cima: calma (corta o topo do olho) ou pesada caindo pra fora
  const lidIn = tired ? y - 0.6 : y - 3.8;
  const lidOut = tired ? y + 1.8 : y - 3.8;
  const [lx, rx] = out < 0 ? [lidOut, lidIn] : [lidIn, lidOut];
  const ctrl = (lx + rx) / 2 - (tired ? 0 : 2);
  const L = x - R - 2;
  const Rr = x + R + 2;
  const lid = `M${L} ${y - R - 4} H${Rr} V${rx} Q${x} ${ctrl} ${L} ${lx} Z`;
  return (
    <g>
      <circle cx={x} cy={y} r={R} fill={C.deep} />
      {detail ? (
        <>
          <circle cx={x} cy={y} r={5.5} fill={iris[0]} />
          <circle cx={x} cy={y} r={3.9} fill="none" stroke={iris[1]} strokeWidth={1.1} />
          <circle cx={x} cy={y} r={2.3} fill={C.deep} />
          <circle cx={x - 2.4} cy={y - 2.1} r={1.6} fill={C.gold2} />
        </>
      ) : (
        <>
          <circle cx={x} cy={y} r={5.7} fill={iris[0]} />
          <circle cx={x} cy={y} r={2.5} fill={C.deep} />
          <circle cx={x - 2.3} cy={y - 2} r={2} fill={C.gold2} />
        </>
      )}
      <path d={lid} fill={skin} />
      {tired ? (
        <>
          <path d={lid} fill={SHADE} opacity={0.3} />
          <path d={`M${x - R - 0.5} ${lx} L${x + R + 0.5} ${rx}`} stroke={C.deep} strokeWidth={2.4} strokeLinecap="round" />
          <path d={`M${x - 5} ${y + 9} q5 2.4 10 0`} stroke={SHADE} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </>
      ) : (
        // linha dos cílios de cima: o olho amendoado de adulto
        detail && <path d={`M${x - R} ${lx + 0.4} Q${x} ${ctrl + 0.4} ${x + R} ${rx + 0.4}`} stroke={C.deep} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      )}
      {mood === 'feliz' && (
        <g>
          {/* a bochecha sobe: o olho vira meia-lua sorridente, a íris continua lá */}
          <ellipse cx={x} cy={y + 10.2} rx={11} ry={6.6} fill={skin} />
          {detail && (
            <path
              d={`M${x + out * (R + 2.4)} ${y - 1.5} l${out * 3} -1.6 M${x + out * (R + 2.4)} ${y + 1.8} l${out * 3} 1.4`}
              stroke={SHADE}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          )}
        </g>
      )}
    </g>
  );
};

/** Rosto: olhos do logo (piscam), sobrancelha, nariz, boca, bochecha quente. */
const Face: React.FC<{ t: number; seed: number; mood: Mood; brow: string; skin: string; detail: boolean; cheer: boolean; iris: [string, string] }> = ({
  t,
  seed,
  mood,
  brow,
  skin,
  detail,
  cheer,
  iris,
}) => {
  const k = (t + seed * 37) % 96;
  const blink = k < 4;
  const ey = 94;
  const lift = mood === 'feliz' ? -2.5 : 0;
  const brows =
    mood === 'cansado'
      ? ['M78 86 Q85 83 92 80.5', 'M108 80.5 Q115 83 122 86']
      : [`M78 ${84 + lift} Q85 ${79.5 + lift} 92 ${82 + lift}`, `M108 ${82 + lift} Q115 ${79.5 + lift} 122 ${84 + lift}`];
  const blush = mood === 'cansado' ? null : blushOf(skin);
  return (
    <g>
      {blush && (
        <g fill={blush.c} opacity={mood === 'feliz' ? Math.min(0.7, blush.o * 1.45) : blush.o}>
          <ellipse cx={78} cy={110} rx={8} ry={4.4} />
          <ellipse cx={122} cy={110} rx={8} ry={4.4} />
        </g>
      )}
      {brows.map((d, i) => (
        <path key={i} d={d} stroke={brow} strokeWidth={3.6} strokeLinecap="round" fill="none" />
      ))}
      {[86, 114].map((x) => (
        <Eye key={x} x={x} y={ey} mood={mood} closed={blink} detail={detail} skin={skin} iris={iris} />
      ))}
      {/* nariz: só a sombra do lado direito */}
      <path d="M101 98 C103 104 105 107 104 109 Q101 111 97 110" stroke={SHADE} strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* boca */}
      {mood === 'feliz' ? (
        cheer || !detail ? (
          // vitória grande (braços pra cima) — e em multidão, onde o fechado
          // não se separa do "ok": sorriso aberto com dentes
          <g>
            <path d="M87 115 Q100 134 113 115 Q100 119 87 115Z" fill={C.deep} />
            <path d="M90.2 116 Q100 119.8 109.8 116 L108.8 119 Q100 122 91.2 119Z" fill={C.hi} />
          </g>
        ) : (
          // contente: sorriso fechado, largo
          <path d="M86.5 115 Q100 128 113.5 115 Q100 120 86.5 115Z" fill={C.deep} />
        )
      ) : mood === 'cansado' ? (
        <path d="M91 123 Q100 115.5 109 123" stroke={C.deep} strokeWidth={3.8} strokeLinecap="round" fill="none" />
      ) : (
        <path d="M93 118.5 Q100 121.5 107 118.5" stroke={C.deep} strokeWidth={3.6} strokeLinecap="round" fill="none" />
      )}
    </g>
  );
};

// ------------------------------------------------------------------ corpo
const TORSO =
  'M86 146 C72 147 61 150 56 157 C52 163 52 171 53 180 L59 205 Q100 211 141 205 L147 180 C148 171 148 163 144 157 C139 150 128 147 114 146 Q100 154 86 146Z';
const TORSO_SHADE =
  'M128 147 C137 149 142 152 144 157 C148 163 148 171 147 180 L141 205 Q135 206.5 127 207.5 C133 188 135 166 128 147Z';

/** Detalhes da roupa por cima do tronco — só três moldes. */
const Garment: React.FC<{ look: Look; accent: string; detail: boolean }> = ({ look, accent, detail }) => {
  const deep = mix(accent, C.deep, 0.32);
  switch (look.top) {
    case 'open': // camada aberta (blazer / sobrecamisa): camiseta em V + lapelas
      return (
        <g>
          <path d="M86 146 Q100 152 114 146 L100 189Z" fill={look.inner ?? C.hi} />
          <path d="M84 147 L99 191 L94 188 L80 162 L80 152Z" fill={deep} />
          <path d="M116 147 L101 191 L106 188 L120 162 L120 152Z" fill={deep} />
        </g>
      );
    case 'crew': // gola careca (ou rulê, se `high`)
      return look.high ? (
        <g>
          <path d="M88 126 L112 126 L114 147 Q100 153 86 147Z" fill={accent} />
          <path d="M104 127 L112 126 L114 147 Q109 149 105 150Z" fill={SHADE} />
          {detail &&
            [134, 140].map((y) => <path key={y} d={`M88 ${y} Q100 ${y + 3} 112 ${y}`} stroke={deep} strokeWidth={1.8} fill="none" opacity={0.7} />)}
        </g>
      ) : (
        <g>
          <path d="M85 146 Q100 156 115 146" stroke={deep} strokeWidth={5} strokeLinecap="round" fill="none" />
          {detail && <path d="M58 200 Q100 206 142 200 L141 205 Q100 211 59 205Z" fill={deep} />}
        </g>
      );
    case 'collar': // camisa: pontas da gola + carcela (botões só em tamanho grande)
      return (
        <g>
          <path d="M100 156 L100 208" stroke={deep} strokeWidth={2.4} />
          {detail &&
            [170, 196].map((y) => <circle key={y} cx={103.5} cy={y} r={1.8} fill={C.hi} opacity={0.8} />)}
          <path d="M86 145 L100 157 L89 165Z" fill={mix(accent, C.hi, 0.4)} />
          <path d="M114 145 L100 157 L111 165Z" fill={mix(accent, C.hi, 0.25)} />
        </g>
      );
  }
};

type P2 = [number, number];

/** O Topo Iris bordado no peito esquerdo: anéis tom-sobre-tom no tecido e o
 *  traço dourado com os dois pontos, na diagonal do glifo. Rente ao tecido
 *  (sem sombra), do tamanho de um logo de camisa, longe do ombro. Abaixo de
 *  160 px sobra só o traço, mais grosso — é o que ainda se lê. */
const MARK_C: P2 = [119.5, 176];
const MARK_A: P2 = [109.8, 182.4];
const MARK_B: P2 = [129.2, 169.6];
const Mark: React.FC<{ accent: string; detail: boolean }> = ({ accent, detail }) => {
  const onGold = nearGold(accent);
  const ink = onGold ? C.violetDeep : C.gold;
  const [a, b, c] = [MARK_A, MARK_B, MARK_C];
  if (!detail) {
    return <path d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={ink} strokeWidth={4.6} strokeLinecap="round" />;
  }
  const ring = onGold ? mix(accent, C.goldDeep, 0.7) : mix(accent, C.hi, 0.42);
  return (
    <g>
      <g fill="none" stroke={ring} strokeWidth={1.3}>
        <circle cx={c[0]} cy={c[1]} r={8.6} />
        <circle cx={c[0]} cy={c[1]} r={5.2} opacity={0.8} />
      </g>
      <path d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={a[0]} cy={a[1]} r={2.1} fill={ink} />
      <circle cx={b[0]} cy={b[1]} r={2.7} fill={ink} />
    </g>
  );
};

const Arm: React.FC<{ side: 'l' | 'r'; angle: number; accent: string; skin: string }> = ({ side, angle, accent, skin }) => {
  const px = side === 'l' ? 58 : 142;
  const inner = side === 'l' ? 1 : -1; // lado do polegar (pro corpo)
  // cabeça da manga rente à linha do ombro (sem "manga bufante" de boneca)
  const sleeve = `M${px - 8.5} 160 Q${px - 8.6} 152 ${px} 152 Q${px + 8.6} 152 ${px + 8.5} 160 L${px + 6.6} 204 Q${px} 207 ${px - 6.6} 204Z`;
  const halfR = `M${px} 152 Q${px + 8.6} 152 ${px + 8.5} 160 L${px + 6.6} 204 Q${px + 3} 206 ${px} 206Z`;
  const tx = px + inner * 5;
  return (
    <g transform={`rotate(${angle} ${px} 158)`}>
      <path d={sleeve} fill={accent} />
      <rect x={px - 7} y={198} width={14} height={6} rx={3} fill={mix(accent, C.deep, 0.32)} />
      <path d={halfR} fill={SHADE} opacity={side === 'r' ? 1 : 0.5} />
      {/* mão de luva: palma alongada + polegar com o vão */}
      <ellipse cx={tx} cy={208.5} rx={2.7} ry={4.6} fill={skin} transform={`rotate(${-inner * 24} ${tx} 208.5)`} />
      <ellipse cx={px} cy={212.5} rx={5.9} ry={8.6} fill={skin} />
      <path d={`M${px + 1.5} 204.3 Q${px + 6.2} 207 ${px + 5.9} 212.5 Q${px + 5.6} 219.5 ${px + 1.5} 221`} fill={SHADE} opacity={0.5} />
    </g>
  );
};

const Legs: React.FC<{ skirt?: boolean }> = ({ skirt }) => (
  <g>
    {skirt ? (
      <g>
        <path d="M80 230 L97 230 L97 244 L80 244Z M103 230 L120 230 L120 244 L103 244Z" fill={PANTS} />
        <path d="M60 196 L140 196 L149 234 Q100 242 51 234Z" fill={PANTS_SKIRT} />
        <path d="M122 196 L140 196 L149 234 Q140 236 130 237.5 C132 222 128 206 122 196Z" fill={SHADE} />
      </g>
    ) : (
      <g>
        <path d="M60 196 L140 196 L139 206 L124 244 L103 244 L100 217 L97 244 L76 244 L61 206Z" fill={PANTS} />
        <path d="M118 206 L139 206 L124 244 L113 244Z" fill={SHADE} />
      </g>
    )}
    <path d="M78 241 L97 241 L98 248 Q98 252 94 252 L71 252 Q67 252 68 248 Q70 242 78 241Z" fill={SHOES} />
    <path d="M103 241 L122 241 Q130 242 132 248 Q133 252 129 252 L106 252 Q102 252 102 248Z" fill={SHOES} />
    <path d="M114 241 L122 241 Q130 242 132 248 Q133 252 129 252 L114 252Z" fill={SHADE} />
    <path d="M73 245 Q77 243 81 243" stroke={SHINE} strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </g>
);

const ANGLES: Record<Arms, (wave: number) => [number, number]> = {
  none: () => [3, -3],
  down: () => [8, -8],
  up: (w) => [150 + w, -150 - w],
  out: () => [14, -78],
};

/** Íris do logo (violeta) ou natural (castanho/mel/verde-escuro por seed) — o brilho dourado fica nas duas. */
const IRIS_LOGO: [string, string] = [C.violet, C.violet2];
const IRIS_NATURAL: [string, string][] = [
  ['#5A3A22', '#7A5434'],
  ['#3B2416', '#5A3A24'],
  ['#4A3220', '#6B4A2E'],
  ['#6E5230', '#8E7046'],
  ['#3B2416', '#5A3A24'],
  ['#4E5A3E', '#6C7A56'],
];

/** Boné (do ajudante): copa acima da sobrancelha, aba pro lado sem tampar o olho. */
const CAP_DOME = 'M57 84 C57 56 76 39 100 39 C124 39 143 56 143 84 Q100 74 57 84Z';
const CAP_SHADE = 'M113 40 C131 45 143 61 143 84 Q133 82 123 81 C125 68 121 52 113 40Z';

/** Postura do humor: cansado pende a cabeça, feliz levanta um tico. */
const headTransform = (mood: Mood) => {
  const pose = mood === 'cansado' ? 'translate(0 2.5) rotate(-5 100 134)' : mood === 'feliz' ? 'translate(0 -1.5)' : '';
  return `${pose} translate(100 132) scale(${HEAD_K}) translate(-100 -132)`;
};

/**
 * `mirror` desenha a pessoa espelhada (apontando pro outro lado com arms="out")
 * SEM espelhar o Topo Iris: o bordado troca de lado junto com o corpo, mas o
 * glifo continua na diagonal do logo. É o que o figurante virado usa no lugar
 * de um scaleX(-1) por fora (que espelharia a marca).
 */
const makePessoa = (natural: boolean, mirror = false): React.FC<PessoaProps> => ({
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
  const L = LOOKS[s];
  const detail = size >= 160;
  const eyeDetail = size >= 130;
  const hair = hairFor(L.hair, skin);
  const brow = hairFor(L.brow, skin);
  const bob = still ? 0 : Math.sin((t + seed * 11) / 14) * 3;
  const wave = arms === 'up' ? Math.sin((t + seed * 7) / 5) * 10 : 0;
  const [la, ra] = ANGLES[arms](wave);
  const headT = headTransform(mood);
  // a gota de suor escorre pela borda do rosto/cabelo (encostada na cabeça, não solta no ar)
  const drip = (t + seed * 9) % 30;
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260" style={{ overflow: 'visible' }}>
      <ellipse cx={100} cy={252} rx={46} ry={5.5} fill="rgba(0,0,0,0.28)" />
      <g transform={mirror ? 'matrix(-1 0 0 1 200 0)' : undefined}>
      <g transform={`translate(0 ${bob})`}>
        <g transform={headT}>
          <HairBack seed={s} c={hair} cap={cap} detail={detail} />
        </g>
        <Legs skirt={L.skirt} />
        {/* pescoço */}
        <rect x={90} y={122} width={20} height={32} rx={8} fill={skin} />
        <rect x={90} y={122} width={20} height={32} rx={8} fill={SHADE} opacity={0.7} />
        {/* tronco */}
        <path d={TORSO} fill={accent} />
        <Garment look={L} accent={accent} detail={detail} />
        <path d={TORSO_SHADE} fill={SHADE} />
        <g transform={mirror ? `matrix(-1 0 0 1 ${2 * MARK_C[0]} 0)` : undefined}>
          <Mark accent={accent} detail={detail} />
        </g>
        <Arm side="l" angle={la} accent={accent} skin={skin} />
        <Arm side="r" angle={ra} accent={accent} skin={skin} />
        {/* cabeça */}
        <g transform={headT}>
          {L.ears && (
            <g>
              <ellipse cx={62} cy={98} rx={6} ry={8.5} fill={skin} />
              <ellipse cx={138} cy={98} rx={6} ry={8.5} fill={skin} />
              <ellipse cx={139} cy={98} rx={4} ry={7} fill={SHADE} />
            </g>
          )}
          {L.earrings && (
            <g fill={C.gold}>
              <circle cx={61} cy={109} r={2.8} />
              <circle cx={139} cy={109} r={2.8} />
            </g>
          )}
          <path d={HEAD} fill={skin} />
          <path d={HEAD_SHADE} fill={SHADE} opacity={0.55} />
          <circle cx={80} cy={74} r={6} fill={SHINE} />
          {L.beard && <Beard kind={L.beard} c={hair} />}
          <Face t={t} seed={seed} mood={mood} brow={brow} skin={skin} detail={eyeDetail} cheer={arms === 'up'} iris={natural ? IRIS_NATURAL[s] : IRIS_LOGO} />
          {L.glasses && (
            <g fill="none" stroke={C.deep} strokeWidth={2.4} opacity={0.85}>
              <circle cx={86} cy={94} r={10} fill="rgba(255,255,255,0.10)" />
              <circle cx={114} cy={94} r={10} fill="rgba(255,255,255,0.10)" />
              <path d="M96 93 Q100 90 104 93" />
            </g>
          )}
          <HairFront seed={s} c={hair} skin={skin} detail={detail} cap={cap} />
          {cap && (
            <g>
              <path d={CAP_DOME} fill={cap} />
              <path d={CAP_SHADE} fill={SHADE} />
              <rect x={122} y={75} width={50} height={10} rx={5} fill={cap} />
              <rect x={122} y={81} width={50} height={4} rx={2} fill={SHADE} />
            </g>
          )}
          {sweat && (
            <g opacity={1 - drip / 30}>
              <path d={`M144 ${62 + drip} q10 14 0 21 q-10 -7 0 -21z`} fill={dimColor('bonds')} />
              <circle cx={141.6} cy={76 + drip} r={1.7} fill={SHINE} />
            </g>
          )}
        </g>
      </g>
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------ de costas
// A MESMA pessoa vista de trás (plateia, nuca do primeiro plano): cabelo do
// seed cobrindo a cabeça inteira, gola por trás do pescoço, nenhum rosto e
// nenhum Topo Iris (o bordado é no peito). Mesma caixa 200×260 e mesmas props.

/** O cabelo visto de trás (por cima da cabeça). */
const HairRear: React.FC<{ seed: number; c: string; cap?: string; detail: boolean }> = ({ seed, c, cap, detail }) => {
  const dark = mix(c, C.deep, 0.4);
  switch (seed) {
    case 0: // chanel: a mesma caixa reta, vista de trás; a nuca aparece embaixo
      return (
        <g>
          <path d="M100 40 C129 40 148 59 148 90 L148 126 Q148 134 140 134 L60 134 Q52 134 52 126 L52 90 C52 59 71 40 100 40Z" fill={c} />
          <path d="M126 46 C140 54 148 70 148 90 L148 126 Q148 134 140 134 L132 134 C138 110 138 70 126 46Z" fill={SHADE} />
          <path d="M66 72 C71 58 82 49 95 46" stroke={SHINE} strokeWidth={3} strokeLinecap="round" fill="none" />
        </g>
      );
    case 1: // black power: o mesmo volume, fechado até a nuca
      return (
        <g>
          <HairBack seed={1} c={c} cap={cap} detail={detail} />
          <ellipse cx={100} cy={112} rx={40} ry={20} fill={c} />
        </g>
      );
    case 2: // tranças: couro coberto, repartições que sobem pro coque
      return (
        <g>
          <path d={HEAD} fill={c} />
          <path d={HEAD_SHADE} fill={SHADE} />
          {detail && (
            <g stroke={dark} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.7}>
              <path d="M100 52 L100 134" />
              <path d="M90 52 C82 72 78 100 80 130" />
              <path d="M110 52 C118 72 122 100 120 130" />
            </g>
          )}
          {!cap && (
            <g>
              <circle cx={100} cy={35} r={16} fill={c} />
              <circle cx={100} cy={35} r={10.5} fill="none" stroke={dark} strokeWidth={2.4} />
              <path d="M108 21 A16 16 0 0 1 104 50.5 A12 16 0 0 0 108 21Z" fill={SHADE} />
              <rect x={89} y={46} width={22} height={6} rx={3} fill={C.goldDeep} />
            </g>
          )}
        </g>
      );
    case 3: {
      // cachos até o ombro: a nuvem cheia, fechando embaixo na nuca
      const curls: [number, number, number][] = [
        [62, 70, 15], [56, 90, 14], [55, 110, 14], [58, 130, 13], [66, 144, 11],
        [138, 70, 15], [144, 90, 14], [145, 110, 14], [142, 130, 13], [134, 144, 11],
        [82, 146, 12], [100, 149, 13], [118, 146, 12],
        ...(cap ? [] : ([[76, 50, 16], [100, 42, 17], [124, 50, 16]] as [number, number, number][])),
      ];
      return (
        <g>
          <ellipse cx={100} cy={96} rx={44} ry={50} fill={c} />
          {curls.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={c} />
          ))}
          <path d="M146 76 C158 92 158 126 146 144 Q140 150 134 150 C146 126 148 98 140 74Z" fill={SHADE} />
          {detail && (
            <g stroke={dark} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.55}>
              <path d="M80 80 q6 -6 12 0" />
              <path d="M104 96 q6 -6 12 0" />
              <path d="M84 118 q6 -6 12 0" />
            </g>
          )}
        </g>
      );
    }
    case 4: // curto: cobre até a linha da nuca; o topete vira o volume de cima
      return (
        <g>
          <path d="M62 90 C62 60 78 41 100 41 C122 41 138 60 138 90 C138 104 136 113 132 121 Q100 129 68 121 C64 113 62 104 62 90Z" fill={c} />
          {!cap && <path d="M70 52 C82 40 104 34 122 42 C112 42 96 44 86 52Z" fill={c} />}
          <path d="M120 44 C132 52 138 68 138 90 C138 104 136 113 132 121 Q128 122 124 123 C130 100 130 64 120 44Z" fill={SHADE} />
        </g>
      );
    case 5: // longo: a cabeça coberta (a parte que desce pelas costas é a RearDrape)
    default:
      return (
        <g>
          {/* desce até cobrir a nuca: a pele não pode aparecer por cima do cabelo que cai nas costas */}
          <path d="M100 40 C130 40 150 62 150 96 L150 130 Q100 152 50 130 L50 96 C50 62 70 40 100 40Z" fill={c} />
          <path d="M128 46 C142 56 150 74 150 96 L150 130 Q145 132.5 138 134.5 C142 110 140 74 128 46Z" fill={SHADE} />
          <path d="M66 70 C72 56 84 48 96 46" stroke={SHINE} strokeWidth={3} strokeLinecap="round" fill="none" />
        </g>
      );
  }
};

/** O que desce pelas costas, por cima da roupa e por baixo dos braços (tranças, cabelo longo). */
const RearDrape: React.FC<{ seed: number; c: string; detail: boolean }> = ({ seed, c, detail }) => {
  if (seed === 2) {
    const braids = [
      'M76 118 C74 140 75 166 78 192',
      'M86 122 C85 146 86 170 88 196',
      'M96 124 C96 148 97 172 98 199',
      'M106 124 C106 148 105 172 104 199',
      'M116 122 C117 146 116 170 114 196',
      'M126 118 C128 140 127 166 124 192',
    ];
    return (
      <g>
        {braids.map((d, i) => (
          <Braid key={i} d={d} c={i % 2 ? mix(c, C.deep, 0.15) : c} detail={detail} />
        ))}
      </g>
    );
  }
  if (seed === 5) {
    return (
      <g>
        <path d="M58 112 C56 142 64 166 70 186 Q100 194 130 186 C136 166 144 142 142 112Z" fill={c} />
        <path d="M128 114 C138 134 136 164 130 186 Q125 187.5 119 188.5 C127 162 129 134 122 114Z" fill={SHADE} />
      </g>
    );
  }
  return null;
};

/** As costas da roupa: só a gola por trás do pescoço e uma costura (nada do peito). */
const GarmentBack: React.FC<{ look: Look; accent: string; detail: boolean }> = ({ look, accent, detail }) => {
  const deep = mix(accent, C.deep, 0.32);
  switch (look.top) {
    case 'open':
      return (
        <g>
          <path d="M84 147 Q100 141 116 147 L115 153 Q100 148 85 153Z" fill={deep} />
          {detail && <path d="M100 176 L100 208" stroke={deep} strokeWidth={1.8} opacity={0.6} />}
        </g>
      );
    case 'crew':
      return look.high ? (
        <g>
          <path d="M88 126 L112 126 L114 147 Q100 153 86 147Z" fill={accent} />
          <path d="M104 127 L112 126 L114 147 Q109 149 105 150Z" fill={SHADE} />
        </g>
      ) : (
        <g>
          <path d="M86 146 Q100 151 114 146" stroke={deep} strokeWidth={5} strokeLinecap="round" fill="none" />
          {detail && <path d="M58 200 Q100 206 142 200 L141 205 Q100 211 59 205Z" fill={deep} />}
        </g>
      );
    case 'collar':
      return (
        <g>
          <path d="M83 146 Q100 139 117 146 L116 154 Q100 149 84 154Z" fill={mix(accent, C.hi, 0.3)} />
          {detail && <path d="M60 168 Q100 174 140 168" stroke={deep} strokeWidth={1.6} fill="none" opacity={0.6} />}
        </g>
      );
  }
};

const makeCostas = (): React.FC<PessoaProps> => ({ t = 0, size = 260, accent = C.violet, skin = '#F2C9A0', mood = 'ok', seed = 0, arms = 'none', still = false, cap }) => {
  const s = ((seed % 6) + 6) % 6;
  const L = LOOKS[s];
  const detail = size >= 160;
  const hair = hairFor(L.hair, skin);
  const bob = still ? 0 : Math.sin((t + seed * 11) / 14) * 3;
  const wave = arms === 'up' ? Math.sin((t + seed * 7) / 5) * 10 : 0;
  // de costas, o braço da esquerda do quadro é o esquerdo da pessoa: mesma conta
  const [la, ra] = ANGLES[arms](wave);
  const headT = headTransform(mood);
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260" style={{ overflow: 'visible' }}>
      <ellipse cx={100} cy={252} rx={46} ry={5.5} fill="rgba(0,0,0,0.28)" />
      <g transform={`translate(0 ${bob})`}>
        <Legs skirt={L.skirt} />
        {/* nuca */}
        <rect x={90} y={122} width={20} height={32} rx={8} fill={skin} />
        <rect x={90} y={122} width={20} height={32} rx={8} fill={SHADE} opacity={0.3} />
        <path d={TORSO} fill={accent} />
        <GarmentBack look={L} accent={accent} detail={detail} />
        <path d={TORSO_SHADE} fill={SHADE} />
        <g transform={headT}>
          <RearDrape seed={s} c={hair} detail={detail} />
        </g>
        <Arm side="l" angle={la} accent={accent} skin={skin} />
        <Arm side="r" angle={ra} accent={accent} skin={skin} />
        <g transform={headT}>
          {L.ears && (
            <g>
              <ellipse cx={62} cy={98} rx={6} ry={8.5} fill={skin} />
              <ellipse cx={138} cy={98} rx={6} ry={8.5} fill={skin} />
              <ellipse cx={139} cy={98} rx={4} ry={7} fill={SHADE} />
            </g>
          )}
          <path d={HEAD} fill={skin} />
          <path d={HEAD_SHADE} fill={SHADE} opacity={0.55} />
          <HairRear seed={s} c={hair} cap={cap} detail={detail} />
          {L.earrings && (
            <g fill={C.gold}>
              <circle cx={60} cy={110} r={2.8} />
              <circle cx={140} cy={110} r={2.8} />
            </g>
          )}
          {cap && (
            <g>
              <path d={CAP_DOME} fill={cap} />
              <path d={CAP_SHADE} fill={SHADE} />
              <path d="M91 82 Q100 72 109 82Z" fill={mix(cap, C.deep, 0.35)} />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};

/**
 * Vistas opcionais do contrato (`IdentityOption.Costas` / `.Virada`, em
 * ../types.ts): `Costas` — a mesma pessoa de trás; `Virada` — espelhada sem
 * espelhar a marca. O cenário (src/elenco/cenario.tsx) usa as da identidade
 * ativa; uma identidade sem elas cai no desenho genérico.
 */
const Costas = makeCostas();

export const option: IdentityOption = {
  id: 'gente',
  name: 'Gente de verdade',
  pitch: 'Gente adulta, de roupa de verdade, que olha com o olho do logo (íris violeta, brilho dourado) e veste o Topo Iris bordado no peito.',
  Pessoa: makePessoa(false),
  Costas,
  Virada: makePessoa(false, true),
};

export const optionNatural: IdentityOption = {
  id: 'gente-natural',
  name: 'Gente · olho natural',
  pitch: 'A mesma gente adulta e o Topo Iris bordado no peito, com olhos de cor natural: a marca fica no brilho dourado do olhar.',
  Pessoa: makePessoa(true),
  Costas,
  Virada: makePessoa(true, true),
};
