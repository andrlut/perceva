// Traço editorial — cores. A sombra de cada forma é a MESMA cor, mais escura e um tico mais fria
// (roupa) ou mais quente/avermelhada (pele): cel por formas, nunca cinza nem filtro dessaturando.

type RGB = [number, number, number];

const hexRgb = (hex: string): RGB => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbHex = ([r, g, b]: RGB) =>
  '#' +
  [r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');

const rgbHsl = ([r, g, b]: RGB): RGB => {
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

const hslRgb = ([h, s, l]: RGB): RGB => {
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

/** mistura linear de duas cores hex (t = 0 → a, 1 → b) */
export const mix = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return rgbHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
};

/** gira o matiz em direção a `alvo` (graus) por no máximo `max` graus */
const giraPara = (h: number, alvo: number, max: number) => {
  let d = alvo - h;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return h + Math.max(-max, Math.min(max, d));
};

/** a sombra de uma ROUPA/cabelo/objeto: mais escura, puxada pro violeta-azul do mundo do app */
export const sombra = (cor: string, k = 1) => {
  const [h, s, l] = rgbHsl(hexRgb(cor));
  const hh = s < 0.08 ? h : giraPara(h, 250, 9 * k);
  // cor muito saturada perde um tico de saturação na sombra (senão vira néon)
  const ss = s < 0.08 ? s + 0.06 * k : Math.min(1, s * (s > 0.75 ? 1 - 0.14 * k : 1 + 0.06 * k));
  const ll = l - (0.12 + 0.1 * l) * k;
  // neutros claros (branco, bege) ganham um tom lavanda na sombra em vez de cinza
  if (s < 0.08) return mix(rgbHex(hslRgb([h, ss, Math.max(0.04, ll)])), '#5B4FA8', 0.18 * k);
  return rgbHex(hslRgb([hh, ss, Math.max(0.04, ll)]));
};

/** a sombra da PELE: mais escura e um tico mais quente, com um véu violeta (nunca laranja néon) */
export const sombraPele = (cor: string, k = 1) => {
  const [h, s, l] = rgbHsl(hexRgb(cor));
  const base = rgbHex(hslRgb([giraPara(h, 6, 7 * k), Math.min(1, s * (1 - 0.04 * k)), Math.max(0.05, l - (0.085 + 0.07 * l) * k)]));
  return mix(base, '#5A3A6E', 0.13 * k);
};

/** clareia mantendo a saturação (brilho de lábio, ponta do nariz, reflexo) */
export const clara = (cor: string, k = 0.2) => {
  const [h, s, l] = rgbHsl(hexRgb(cor));
  return rgbHex(hslRgb([h, s, Math.min(0.97, l + (1 - l) * k)]));
};

/** luminância 0..1 (pra escolher contraste) */
export const lum = (cor: string) => {
  const [r, g, b] = hexRgb(cor);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};
