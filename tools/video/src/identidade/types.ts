// Contrato de uma opção de identidade visual das pessoas do Elenco Perceva.
//
// Toda opção exporta um `Pessoa` com EXATAMENTE as props e a caixa do
// `Pessoa` de src/elenco/cast.tsx, pra que a vencedora troque a atual sem
// mexer em cena nenhuma:
//  - <svg width={size} height={size * 1.3} viewBox="0 0 200 260">
//  - pés/sombra no fundo (y ≈ 252), cabeça na metade de cima (centro ≈ 100,92)
//  - braços pivotam nos ombros (≈ 58,158 e 142,158); com arms="out" a mão
//    direita fica perto de (200,170) — é ali que as cenas põem a peça na mão
//  - `seed` escolhe a variação (cabelo, traço) — 0..5 devem ser pessoas
//    claramente diferentes; `skin` e `accent` vêm da cena
//  - `mood` ok/feliz/cansado tem que ler a 110 px; olhos piscam com `t`
import type React from 'react';

export type Arms = 'none' | 'down' | 'up' | 'out';
/** `focado` (fase 3): atenta sem ler brava. Identidade que não o desenha trata como `ok`. */
export type Mood = 'ok' | 'feliz' | 'cansado' | 'focado';

/**
 * Pose do corpo (fase 3, src/elenco/acao.tsx): a pessoa FAZENDO alguma coisa. Unidades da caixa
 * 200×260. Sem `pose`, a Pessoa sai idêntica à de antes (a régua dos vídeos publicados).
 */
export type Pose = {
  /** graus no ombro [esq, dir]; 0 = pendurado; + = horário na tela. Se existir, substitui `arms` */
  braco?: [number, number];
  /** graus no quadril [esq, dir]; 0 = em pé */
  perna?: [number, number];
  /** 0..14 un.: quanto cada perna sobe (o joelho vem pra câmera; a barra da roupa cobre o topo) */
  ergue?: [number, number];
  /** corpo todo, de -70 a +10 un. (negativo = sobe); a sombra fica no chão e encolhe */
  y?: number;
  /** -10..10 graus, girando em volta dos pés (100, 252) */
  inclina?: number;
  /** -10..10 graus, somados à inclinação do humor */
  cabeca?: number;
  /** 0..1: olhos fechados */
  fecha?: number;
  /** 0..1: pouso (achata 10%, alarga 8%) */
  amassa?: number;
  /** braço desenhado DEPOIS da cabeça (mão na boca ao beber): sem isto a mão some atrás do queixo */
  frente?: [boolean, boolean];
};

/** Pivôs e pontos do corpo na caixa 200×260 (o Ator e a cena `dentro` medem por aqui). */
export const CORPO = {
  ombro: [
    [58, 158],
    [142, 158],
  ] as [number, number][],
  /** do pivô do ombro ao centro da mão (r 9,5) */
  braco: 52,
  quadril: [
    [84.5, 212],
    [115.5, 212],
  ] as [number, number][],
  /** do pivô do quadril à sola */
  perna: 40,
  pes: [100, 252] as [number, number],
  pontos: {
    cabeca: [100, 62],
    rosto: [120, 104],
    boca: [100, 118],
    peito: [112, 176],
    tronco: [100, 188],
    barriga: [100, 208],
    braco: [147, 186],
    perna: [116, 232],
  } as Record<'cabeca' | 'rosto' | 'boca' | 'peito' | 'tronco' | 'barriga' | 'braco' | 'perna', [number, number]>,
  tronco: [
    [80, 147],
    [120, 147],
    [153, 162],
    [146, 222],
    [54, 222],
    [47, 162],
  ] as [number, number][],
};

export type PessoaProps = {
  t?: number;
  size?: number;
  accent?: string;
  skin?: string;
  mood?: Mood;
  seed?: number;
  arms?: Arms;
  still?: boolean;
  /**
   * Quadros desde que o humor atual começou (a cena passa na virada `turn`).
   * Sem ele, conta desde o início da cena (`t`). Identidades que reagem à
   * virada (o hexágono que acende atrás no feliz, o pulinho) usam isto.
   */
  since?: number;
  /**
   * O hexágono atrás no feliz: false = sem (figurante, fundo); 'cabeca' = menor e
   * em volta da cabeça (sentada atrás de mesa, onde o de corpo inteiro vira "casinha").
   * Padrão: com, atrás do corpo.
   */
  halo?: boolean | 'cabeca';
  cap?: string;
  sweat?: boolean;
  /** fase 3: a pessoa fazendo (src/elenco/acao.tsx). Sem pose = idêntica à de antes. */
  pose?: Pose;
};

export type IdentityOption = {
  id: string;
  name: string;
  /** Uma frase: o que faz essa pessoa ser reconhecível como Perceva. */
  pitch: string;
  Pessoa: React.FC<PessoaProps>;
  /**
   * Opcional: a mesma pessoa DE COSTAS (plateia, fila da frente), com a caixa
   * e as props do `Pessoa`: cabelo do seed visto de trás, gola por trás, nada
   * do peito (sem rosto, botão nem marca). Sem ela, o cenário cobre a frente
   * da `Pessoa` com cabelo e camisa lisa (src/elenco/cenario.tsx → DeCostas).
   */
  Costas?: React.FC<PessoaProps>;
  /**
   * Opcional: a pessoa ESPELHADA (quem aponta pro outro lado com arms="out"),
   * sem espelhar a marca do peito. Sem ela, o cenário vira a `Pessoa` com
   * scaleX(-1) (src/elenco/cenario.tsx → Figurante).
   */
  Virada?: React.FC<PessoaProps>;
  /** A própria Pessoa acende o hexágono no feliz: as cenas tiram o brilho (estrelinhas) pra não dizer "feliz" duas vezes. */
  halo?: boolean;
  /** A frente do card do verso é o Elenco (a pessoa feliz), não a imagem 4:5 gerada da ideia. */
  frenteElenco?: boolean;
  /** Opcional: motivo de fundo da identidade (atrás das pessoas, no palco). */
  Backdrop?: React.FC<{ t: number; width: number; height: number; accent: string }>;
};

export const SKINS = ['#F2C9A0', '#C68B5E', '#8D5A3B', '#E0AC7E', '#5C3A24', '#F5D5B8'];
