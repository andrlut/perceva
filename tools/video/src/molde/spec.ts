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

export type SceneKind = 'pessoa' | 'semana' | 'virada' | 'multidao' | 'comparar' | 'lista' | 'cena' | 'pensa' | 'mapa' | 'verso';

// ------------------------------------------------------------ câmera, passagem, ambiente

export type CameraMove = 'push' | 'pull' | 'pan-left' | 'pan-right' | 'drift' | 'still';
/** pessoa/peca/mapa = o que a cena desenha; o resto = região fixa do palco. */
export type CameraFocus = 'pessoa' | 'peca' | 'mapa' | 'centro' | 'esquerda' | 'direita' | 'topo' | 'base';
export type CameraSpec = {
  move: CameraMove;
  /** pra onde a câmera aproxima/afasta (default: a pessoa) */
  focus?: CameraFocus;
  /** deixa: parada até aqui, depois o movimento em ~1,3 s; sem deixa = a cena inteira */
  cue?: string;
  /** leve ≈ metade, forte ≈ quase o dobro */
  forca?: 'leve' | 'forte';
};
/** Como esta cena ENTRA (a passagem da anterior pra ela). */
export type Transicao = 'fade' | 'zoom' | 'desliza' | 'corte';

export type AmbienteKind = 'escritorio' | 'treinamento' | 'casa' | 'cidade';
export type Gente = 'nenhuma' | 'pouca' | 'muita';
export type Hora = 'manha' | 'dia' | 'noite';

// ------------------------------------------------------------ mapa do dia

export type Feel = 'drena' | 'neutro' | 'energiza';
/** Um bloco do dia: o ícone diz O QUE é, a cor diz COMO pesa. Nunca hora nem número. */
export type Bloco = {
  icon: string;
  feel: Feel;
  /** comprimento relativo no dia (1..3, default 1) */
  size?: number;
  /** deixa em que o bloco cai no dia */
  cue?: string;
  /** segunda batida (na deixa `turn` da cena): o bloco vira outro peso/tamanho/ícone */
  then?: { feel?: Feel; size?: number; icon?: string };
};

/** Props de cada cena, já no idioma resolvido (os {pt,en} viraram string). */
export type SceneProps = {
  kicker?: string;
  // valem pra todas as cenas (menos verso): câmera e passagem
  camera?: CameraSpec;
  transicao?: Transicao;
  // pessoa / virada / cena / pensa / lista / semana / mapa: o lugar atrás da pessoa
  ambiente?: AmbienteKind;
  gente?: Gente;
  hora?: Hora;
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
  // mapa
  blocks?: Bloco[];
  /** mapa: de que lado a pessoa fica (default esquerda) */
  side?: 'left' | 'right';
  // verso: o selo dourado depois da leitura (default "IDEIA ABSORVIDA"; as portas trocam)
  done?: string;
};
export type Panel = { label: string; mood?: Mood; object?: PieceName; arrives?: string; leaves?: string; ambiente?: AmbienteKind; hora?: Hora };
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
  /** prévia sem voz (`build --silent`): tempos estimados, nenhum <Audio> */
  silent?: boolean;
  lines: MoldeLine[];
};
