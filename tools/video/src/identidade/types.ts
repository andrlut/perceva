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
export type Mood = 'ok' | 'feliz' | 'cansado';

export type PessoaProps = {
  t?: number;
  size?: number;
  accent?: string;
  skin?: string;
  mood?: Mood;
  seed?: number;
  arms?: Arms;
  still?: boolean;
  cap?: string;
  sweat?: boolean;
};

export type IdentityOption = {
  id: string;
  name: string;
  /** Uma frase: o que faz essa pessoa ser reconhecível como Perceva. */
  pitch: string;
  Pessoa: React.FC<PessoaProps>;
  /** Opcional: motivo de fundo da identidade (atrás das pessoas, no palco). */
  Backdrop?: React.FC<{ t: number; width: number; height: number; accent: string }>;
};

export const SKINS = ['#F2C9A0', '#C68B5E', '#8D5A3B', '#E0AC7E', '#5C3A24', '#F5D5B8'];
