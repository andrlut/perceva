import React from 'react';
import { C } from '../theme';
import { FONT } from '../theme';
import {
  Caderno,
  Cama,
  Casa,
  Celular,
  Cesto,
  Computador,
  Copo,
  Coracao,
  Lampada,
  Livro,
  Louca,
  Moeda,
  Relogio,
  Sacola,
  Vassoura,
} from '../elenco/cast';
import ions from './ionicons-full.json';
import catalog from './catalog.json';

// Uma peça por nome: elenco (desenhado) ou ícone do app (`ion:<nome>`).
// `size` = largura aproximada na tela. Peça desconhecida = erro no render
// (o lint do molde.mjs barra antes, com a lista do que existe).
// `progress` 0..1 anima o que a peça tem de animável (caderno sendo escrito, tela/lâmpada acendendo)
type Draw = (p: { t: number; size: number; accent?: string; progress?: number }) => React.ReactElement;

const PIECES: Record<string, Draw> = {
  casa: ({ size, accent }) => <Casa size={size} accent={accent} />,
  relogio: ({ t, size }) => <Relogio t={t} size={size} speed={1} />,
  moeda: ({ t, size }) => <Moeda t={t} size={size} />,
  celular: ({ size, accent }) => <Celular size={size * 0.8} accent={accent} />,
  sacola: ({ size }) => <Sacola size={size} />,
  vassoura: ({ size }) => <Vassoura size={size} />,
  cesto: ({ size }) => <Cesto size={size} />,
  louca: ({ size }) => <Louca size={size} />,
  livro: ({ size, accent }) => <Livro size={size} accent={accent} />,
  cama: ({ size, accent }) => <Cama size={size} accent={accent} />,
  computador: ({ size, accent, progress }) => <Computador size={size} accent={accent} glow={progress ?? 1} />,
  coracao: ({ t, size, accent }) => <Coracao t={t} size={size} accent={accent} />,
  caderno: ({ size, accent, progress }) => <Caderno size={size} accent={accent} write={progress ?? 1} />,
  lampada: ({ size, progress }) => <Lampada size={size} on={progress ?? 1} />,
  copo: ({ t, size, accent, progress }) => <Copo t={t} size={size} accent={accent} stir={progress ?? 1} />,
};

export const PIECE_NAMES = Object.keys(PIECES);
// o lint lê catalog.json; se as duas listas divergirem, o render quebra aqui (e não em silêncio)
if (PIECE_NAMES.slice().sort().join() !== catalog.pieces.slice().sort().join()) {
  throw new Error(`catalog.json e Peca.tsx divergem: ${PIECE_NAMES.join()} × ${catalog.pieces.join()}`);
}
export const isPiece = (name: string) =>
  name in PIECES || (name.startsWith('ion:') && name.slice(4) in (ions as Record<string, number>));

/** Ficha redonda com o ícone do app — pra o que o elenco ainda não desenhou. */
const IonToken: React.FC<{ name: string; size: number; accent: string }> = ({ name, size, accent }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: `linear-gradient(150deg, ${C.surface3} 0%, ${C.surface2} 100%)`,
      boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span style={{ fontFamily: FONT.icon, fontSize: size * 0.56, lineHeight: 1, color: accent }}>
      {String.fromCodePoint((ions as Record<string, number>)[name] ?? 63)}
    </span>
  </div>
);

export const Peca: React.FC<{ name: string; t: number; size: number; accent?: string; progress?: number }> = ({ name, t, size, accent = C.gold, progress }) => {
  if (name.startsWith('ion:')) return <IonToken name={name.slice(4)} size={size * 0.8} accent={accent} />;
  const draw = PIECES[name];
  if (!draw) throw new Error(`peça desconhecida: "${name}" (existem: ${PIECE_NAMES.join(', ')}, ou ion:<nome>)`);
  return draw({ t, size, accent, progress });
};

/** Ícone solto (chips). */
export const Ion: React.FC<{ name: string; size: number; color: string }> = ({ name, size, color }) => (
  <span style={{ fontFamily: FONT.icon, fontSize: size, lineHeight: 1, color, width: size, display: 'inline-block', textAlign: 'center' }}>
    {String.fromCodePoint((ions as Record<string, number>)[name] ?? 63)}
  </span>
);
