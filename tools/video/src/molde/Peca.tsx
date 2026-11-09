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
import { Agenda, Caneca, Caneta, Envelope, Monitor, Papelada, Planta, Quadro } from '../elenco/objetos';
import { Calendario, Coqueteleira, Peso, Pote } from '../elenco/pecas3';
import { Reservatorio } from '../elenco/reservatorio';
import { Emblema } from '../Emblema';
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
  // v2 (objetos.tsx): trabalho, casa, rotina
  quadro: ({ size, accent, progress }) => <Quadro size={size} accent={accent} progress={progress ?? 1} />,
  caneca: ({ t, size, accent }) => <Caneca t={t} size={size * 0.85} accent={accent} />,
  planta: ({ t, size }) => <Planta t={t} size={size} />,
  caneta: ({ size, accent, progress }) => <Caneta size={size} accent={accent} progress={progress ?? 0} />,
  agenda: ({ size, accent, progress }) => <Agenda size={size} accent={accent} progress={progress ?? 1} />,
  monitor: ({ t, size, accent, progress }) => <Monitor t={t} size={size} accent={accent} progress={progress ?? 1} />,
  papelada: ({ size }) => <Papelada size={size} />,
  envelope: ({ t, size, accent }) => <Envelope t={t} size={size} accent={accent} />,
  // fase 3 (pecas3.tsx, reservatorio.tsx): o que a pessoa usa fazendo — nenhuma com marca nem texto
  peso: ({ size, accent }) => <Peso size={size} accent={accent} />,
  pote: ({ size, accent, progress }) => <Pote size={size} accent={accent} progress={progress} />,
  // `progress` = casas marcadas (o Obj.run do roteiro anda com ele)
  calendario: ({ size, accent, progress }) => <Calendario size={size} accent={accent} progress={progress ?? 0} />,
  coqueteleira: ({ t, size, accent, progress }) => <Coqueteleira t={t} size={size} accent={accent} progress={progress} />,
  // o copo de sempre com a bebida na cor dela (água / suco), não na cor da área
  'copo-agua': ({ t, size, progress }) => <Copo t={t} size={size} accent="#A9BCEB" stir={progress ?? 1} />,
  'copo-suco': ({ t, size, progress }) => <Copo t={t} size={size} accent="#FFA94D" stir={progress ?? 1} />,
  // `progress` = nível do estoque. Sempre dourado (o grão e o aro), sem a cor da área: é o MESMO
  // tanque da lente e do medidor no vídeo da creatina
  reservatorio: ({ t, size, progress }) => <Reservatorio t={t} size={size} nivel={progress ?? 1} />,
  // o Emblema do app (src/Emblema.tsx): anéis, braços e áreas acendem ao longo da cena — vídeo de marca
  emblema: ({ t, size, progress }) => {
    const p = progress ?? Math.max(0, Math.min(1, t / 150));
    const lit = Array.from({ length: 12 }, (_, i) => Math.max(0, Math.min(1, p * 2.2 - i * 0.1)));
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <Emblema size={size} cx={size / 2} cy={size / 2} rings={5 * p} tests={6 * Math.max(0, Math.min(1, p * 1.25 - 0.1))} halo={p} lit={lit} center={p > 0.55 ? 7 : null} />
      </div>
    );
  },
};

export const PIECE_NAMES = Object.keys(PIECES);
// o lint lê catalog.json; se as duas listas divergirem, o render quebra aqui (e não em silêncio)
if (PIECE_NAMES.slice().sort().join() !== catalog.pieces.slice().sort().join()) {
  throw new Error(`catalog.json e Peca.tsx divergem: ${PIECE_NAMES.join()} × ${catalog.pieces.join()}`);
}
export const isPiece = (name: string) =>
  name in PIECES || (name.startsWith('ion:') && name.slice(4) in (ions as Record<string, number>));

/** Caixa que cada peça ocupa (largura, altura), em frações de `size`. O que não está aqui é quadrado. */
const BOX: Record<string, [number, number]> = {
  celular: [0.48, 0.8],
  vassoura: [0.6, 1],
  cesto: [1, 0.85],
  louca: [1, 0.8],
  livro: [1, 0.7],
  cama: [1, 0.6],
  computador: [1, 0.72],
  caderno: [1, 1.1],
  lampada: [1, 1.2],
  copo: [0.8, 1],
  quadro: [1, 1.15],
  caneca: [0.85, 0.94],
  planta: [0.8, 1],
  caneta: [0.5, 1],
  agenda: [1, 1.1],
  monitor: [1, 0.9],
  papelada: [1, 0.95],
  envelope: [1, 0.78],
  peso: [1, 0.5],
  pote: [0.8, 1],
  calendario: [1, 1.05],
  coqueteleira: [0.55, 1],
  'copo-agua': [0.8, 1],
  'copo-suco': [0.8, 1],
  reservatorio: [1, 1.35],
};
/** Largura e altura que a peça ocupa na tela (ícone do app = a ficha redonda de 0,8 × size). */
export const pieceBox = (name: string, size: number): [number, number] => {
  if (name.startsWith('ion:')) return [size * 0.8, size * 0.8];
  const [w, h] = BOX[name] ?? [1, 1];
  return [size * w, size * h];
};

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
