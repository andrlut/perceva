// Molde genérico do vídeo de ideia — o formato que o render lê.
//
// O roteiro mora em learning-drops/video-specs/<slug>.json (bilíngue, revisado,
// versionado). `scripts/molde.mjs build` resolve um idioma e grava o spec
// RESOLVIDO em public/molde/<slug>.<idea>.<lang>/spec.json — é esse arquivo
// que a composição `Molde` lê. O catálogo de cenas e peças está em MOLDE.md.
import type { DimId } from '../theme';
import type { Line } from '../timeline';

export type Lang = 'pt' | 'en';
export type Mood = 'ok' | 'feliz' | 'cansado';

/** Peça do elenco (nome) ou ícone do app (`ion:<nome>`). */
export type PieceName = string;

/** Uma peça que entra na cena, opcionalmente quando a fala chega a `cue`. */
export type Obj = { p: PieceName; cue?: string; out?: string };

export type SceneKind = 'pessoa' | 'semana' | 'virada' | 'multidao' | 'comparar' | 'lista' | 'cena' | 'pensa' | 'verso';

/** Props de cada cena, já no idioma resolvido (os {pt,en} viraram string). */
export type SceneProps = {
  kicker?: string;
  // pessoa / virada / cena / pensa
  mood?: Mood;
  /** troca de humor quando a fala chega aqui (virada) */
  turn?: string;
  to?: Mood;
  arms?: 'none' | 'down' | 'up' | 'out';
  sweat?: boolean;
  objects?: Obj[];
  /** relógio: rápido (pressa), calmo, ou acalma no `turn` */
  clock?: 'rapido' | 'calmo' | 'acalma';
  /** a peça que a pessoa entrega (virada): vai pro ajudante ou some */
  gives?: PieceName;
  helper?: boolean;
  /** brilho em volta da pessoa quando a fala chega aqui */
  glow?: string;
  // semana
  from?: string;
  until?: string;
  // multidao
  lit?: 'poucos' | 'metade' | 'muitos';
  at?: string;
  // comparar
  left?: Panel;
  right?: Panel;
  winner?: 'left' | 'right';
  win?: string;
  pill?: { p?: PieceName; text: string };
  chips?: Chip[];
  // lista
  items?: Chip[];
  // cena
  setting?: 'sofa' | 'mesa' | 'cama' | 'chao';
  holding?: PieceName;
  // pensa
  thought?: PieceName;
};
export type Panel = { label: string; mood?: Mood; object?: PieceName; arrives?: string; leaves?: string };
export type Chip = { icon: string; text: string; cue: string };

export type MoldeLine = Line & { scene: SceneKind; props?: SceneProps };

export type MoldeSpec = {
  key: string;
  slug: string;
  idea: string;
  lang: Lang;
  dimension: DimId;
  /** rótulo da área (sobrancelha da 1ª cena) */
  dimensionLabel: string;
  title: string;
  claim: string;
  /** imagem 4:5 da ideia, relativa a public/ (frente do card no verso) — null = card sem imagem */
  image: string | null;
  lines: MoldeLine[];
};
