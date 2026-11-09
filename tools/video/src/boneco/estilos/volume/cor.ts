// Volume suave — cor. Sombra e luz mexem na LUMINOSIDADE em HSL com a saturação mantida
// (escurecer misturando com preto/cinza acinzenta; o André lê cor como vida). A sombra puxa o
// matiz pro violeta/vermelho (sombra quente na pele, fria no tecido) e a luz pro dourado.

type RGB = [number, number, number];

const hexRgb = (h: string): RGB => {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const rgbHex = ([r, g, b]: RGB) => `#${[r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')}`;

const rgbHsl = ([r, g, b]: RGB): [number, number, number] => {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const mx = Math.max(R, G, B);
  const mn = Math.min(R, G, B);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
  h *= 60;
  return [h, s, l];
};
const hslRgb = (h: number, s: number, l: number): RGB => {
  const hh = (((h % 360) + 360) % 360) / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [f(hh + 1 / 3) * 255, f(hh) * 255, f(hh - 1 / 3) * 255];
};

/** gira o matiz `h` até `alvo` por no máximo `graus` (pelo caminho curto) */
const rumo = (h: number, alvo: number, graus: number) => {
  let d = (((alvo - h) % 360) + 540) % 360 - 180;
  d = Math.max(-graus, Math.min(graus, d));
  return h + d;
};

/** ajusta luminosidade (dl), saturação (ds) e matiz (rumo a `alvo`, `dh` graus) */
export function ajusta(c: string, dl: number, ds = 0, alvo?: number, dh = 0): string {
  const [h, s, l] = rgbHsl(hexRgb(c));
  const h2 = alvo == null ? h : rumo(h, alvo, dh);
  return rgbHex(hslRgb(h2, Math.max(0, Math.min(1, s + ds)), Math.max(0.02, Math.min(0.97, l + dl))));
}

export const mistura = (a: string, b: string, k: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return rgbHex([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k]);
};

export const lum = (c: string) => rgbHsl(hexRgb(c))[2];

/** O material: as 5 cores de uma peça com volume. */
export type Mat = { luz: string; base: string; sombra: string; fundo: string; rebate: string };

/**
 * `pele` puxa a sombra pro vermelho (sangue sob a pele) e é mais contida;
 * `tecido` puxa pro violeta; `cabelo` tem mais contraste (brilho).
 * `longe` escurece o material inteiro (o membro de trás, atrás do tronco).
 */
export function material(c: string, tipo: 'pele' | 'tecido' | 'cabelo' | 'metal' = 'tecido', longe = 0): Mat {
  const L = lum(c);
  const base = longe ? ajusta(c, -0.07 * longe, 0.02, tipo === 'pele' ? 10 : 255, 6 * longe) : c;
  if (tipo === 'pele') {
    return {
      luz: ajusta(base, 0.07, 0.04, 35, 4),
      base,
      sombra: ajusta(base, -0.13, 0.1, 352, 12),
      fundo: ajusta(base, -0.22, 0.12, 345, 16),
      rebate: ajusta(base, -0.06, 0.06, 330, 10),
    };
  }
  if (tipo === 'cabelo') {
    return {
      luz: ajusta(base, L < 0.2 ? 0.16 : 0.12, 0.02, 35, 6),
      base,
      sombra: ajusta(base, L < 0.2 ? -0.06 : -0.16, 0.05, 280, 8),
      fundo: ajusta(base, L < 0.2 ? -0.09 : -0.26, 0.05, 280, 10),
      rebate: ajusta(base, L < 0.2 ? 0.02 : -0.08, 0.05, 260, 12),
    };
  }
  // tecido: tons muito claros escurecem menos (branco vira lavanda, não cinza)
  const ds = L > 0.85 ? -0.1 : -0.17;
  return {
    luz: ajusta(base, L > 0.85 ? 0.04 : L < 0.25 ? 0.12 : 0.1, 0.03, 45, 5),
    base,
    sombra: ajusta(base, ds, 0.06, 262, L > 0.85 ? 18 : 10),
    fundo: ajusta(base, ds - 0.1, 0.06, 262, 14),
    rebate: ajusta(base, ds * 0.45, 0.08, 255, 16),
  };
}
