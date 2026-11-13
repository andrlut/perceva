// Boneco v5 — o contrato de um ESTILO de desenho de pessoa.
//
// Um estilo recebe as juntas já calculadas (esqueleto.ts → fk) e desenha a pessoa em SVG, nas
// unidades do boneco (chão em y = 0, x = 0 no meio, y pra baixo). Não calcula pose, não escolhe
// roupa: só desenha o que recebe. Três estilos foram feitos em paralelo pra o André escolher
// (estilos/<id>.tsx); o vencedor vira o Ator do molde.
import type React from 'react';
import type { Humor, Juntas, Proporcao } from './esqueleto';
import type { Pessoa, Roupa } from './elenco';

export type DesenhoProps = {
  j: Juntas;
  pessoa: Pessoa;
  roupa: Roupa;
  humor: Humor;
  /** quadro (piscar, respirar o cabelo, brilho) */
  t: number;
  /** prefixo único pros ids de gradiente/clip deste boneco no quadro */
  uid: string;
  /** cor da luz de recorte (a luz do lugar: janela dourada, céu frio); undefined = a do estilo */
  luz?: string;
  /**
   * o que a mão `segura` carrega (o estilo desenha a peça). Régua do revisor (rodada 6): peça na mão
   * com ≥ 120 px no quadro de 1080 — halter com anilhas de verdade, coqueteleira com tampa e bico
   */
  segura?: 'halter' | 'copo' | 'coqueteleira' | 'suco';
  /** a mão de TRÁS segura a mesma peça (os dois halteres da série de força) */
  seguraDuas?: boolean;
  /**
   * o dedo apertando a pele: ponto de contato (unidades), força 0..1 e a marca que fica depois (0..1).
   * O estilo desenha a pele cedendo ali (o detalhe do colágeno que o André elogiou: "o dedo tocando
   * na pele e ela amassando"). Régua do painel (rodada 3): a bochecha AFUNDA de verdade — meia-lua de
   * sombra do lado oposto à luz, borda de pele estufada pegando luz, a ponta do dedo achata no fundo,
   * o olho daquele lado aperta um pouco; a marca rosada FICA (`marca`) e some devagar. Nunca um anel
   * simétrico (lê espinha) nem ondas concêntricas.
   *
   * A MÃO que aperta (`mao[1] === 'aponta'`) é indicador + médio juntos, vistos pelo lado do polegar
   * (polegar à vista, anelar e mínimo dobrados com a linha dos nós). NUNCA o dorso da mão com um
   * dedo só em pé: 4 de 5 jurados leram "dedo do meio".
   */
  toque?: { ponto: [number, number]; forca: number; marca: number };
  /**
   * 0..1: o CORPO DE VIDRO da cena `dentro` (plano corpo). Com 1, tronco, braços e pernas — roupa e
   * pele — viram vidro: um preenchimento azul-noite translúcido e opaco o bastante pra o mapa de
   * dentro (órgãos, músculos, fluxos) ler por cima, um contorno claro e frio na silhueta, um reflexo
   * vertical do lado da luz. Cabeça, pescoço, mãos e pés ficam como são (o rosto continua vivo). Entre
   * 0 e 1, a roupa esmaece pro vidro (a cena entra em 10 quadros).
   */
  vidro?: number;
};

export type Estilo = {
  id: string;
  nome: string;
  /** uma frase: o que o estilo é (vai na folha de comparação) */
  descricao: string;
  /** a proporção base (adulto de corpo médio) */
  prop: Proporcao;
  /** a proporção de uma pessoa (corpo e idade mudam larguras e um pouco a altura) */
  propDe: (p: Pessoa) => Proporcao;
  Desenho: React.FC<DesenhoProps>;
};
