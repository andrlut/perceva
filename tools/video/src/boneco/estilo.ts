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
  /** o que a mão `segura` carrega (o estilo desenha a peça) */
  segura?: 'halter' | 'copo';
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
