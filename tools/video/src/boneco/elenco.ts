// Boneco v5 — quem é quem, e a ROUPA PELA CENA.
//
// Pedido do André (2026-11-09): "tem tipo uma velhinha correndo, ou uma pessoa de terno
// correndo — a vestimenta precisa mudar também pro personagem casar com a cena". Daí:
//  1. cada pessoa tem um guarda-roupa por CONTEXTO (esporte, casa, trabalho, rua, dormir),
//     com as cores dela — a mesma pessoa troca de roupa entre a cozinha e o parque;
//  2. o contexto sai da cena (ação + lugar), nunca do roteiro escolhendo peça a peça;
//  3. `cabe()` diz se a pessoa combina com o que o roteiro manda ela fazer (quem faz tiro de
//     corrida não é a avó de cardigã) — o diretor escolhe a protagonista por aqui.
import type { Acao } from './poses';

export type Idade = 'jovem' | 'adulto' | 'maduro' | 'idoso';
export type Corpo = 'esguio' | 'medio' | 'forte' | 'largo';
export type Cabelo =
  | 'chanel' // liso até o queixo
  | 'curto' // curto liso (masculino comum)
  | 'fade' // degradê crespo baixinho
  | 'cacheado' // volume de cachos até o ombro
  | 'black' // black power
  | 'trancas' // tranças compridas (box braids)
  | 'coque' // preso no alto
  | 'rabo' // rabo de cavalo
  | 'ondulado' // ondulado até a nuca
  | 'calvo' // entradas/careca com laterais
  | 'grisalho' // curto branco/cinza
  | 'longo'; // liso comprido

export type Pessoa = {
  id: string;
  nome: string;
  genero: 'f' | 'm';
  idade: Idade;
  corpo: Corpo;
  pele: string;
  cabelo: Cabelo;
  corCabelo: string;
  barba?: 'rala' | 'cheia' | 'bigode';
  oculos?: boolean;
  brinco?: boolean;
  /** a cor "dela" — puxa as roupas (a área que ela representa na paleta) */
  cor: string;
};

export type Contexto = 'esporte' | 'casa' | 'trabalho' | 'rua' | 'dormir';

export type Cima = {
  tipo: 'top' | 'regata' | 'camiseta' | 'manga-longa' | 'moletom' | 'camisa' | 'blusa' | 'blazer' | 'pijama';
  cor: string;
  /** detalhe: listra, gola, zíper, viés, a camisa por baixo do blazer */
  cor2?: string;
};
export type Baixo = { tipo: 'short' | 'legging' | 'calca' | 'jeans' | 'moletom' | 'saia' | 'pijama'; cor: string; cor2?: string };
export type Calcado = { tipo: 'tenis' | 'sapato' | 'chinelo' | 'meia' | 'bota'; cor: string; sola?: string };
export type Extra = 'relogio' | 'fone' | 'bone' | 'faixa' | 'avental' | 'cracha' | 'garrafa';
/**
 * Uma roupa completa. Régua do painel (rodada 3) pro estilo desenhar: cada contexto tem que ler À
 * PRIMEIRA VISTA, pequeno — pijama tem estampa (listra ou poá), carcela de botões e viés, e cai
 * folgado (nunca agasalho nem jaleco); blazer vai SOBRE uma blusa/camisa (`cor2`), nunca sobre a
 * pele; tecido cai reto com 1–2 dobras (sem balão inflado, sem brilho no meio da barriga).
 */
export type Roupa = { contexto: Contexto; cima: Cima; baixo: Baixo; calcado: Calcado; extras?: Extra[] };

// Paleta: as 6 áreas e o violeta do app + neutros de roupa (jeans, branco, grafite, bege).
// VIVAS de propósito (o André: "as cores poderiam parecer mais vivas").
export const COR = {
  saude: '#FF6B7A',
  corpo: '#FF8A3D',
  mente: '#B07BFF',
  prosperidade: '#FFC83D',
  vinculos: '#4DD0FF',
  oficio: '#2EC4B6',
  violeta: '#7B5CFF',
  violetaFundo: '#4B2FCC',
  branco: '#F4F5FF',
  grafite: '#2B3050',
  // clareado na rodada 2: #1C2350 sumia nos fundos #0A0E26–#1A1F44 (os três estilos clareavam por conta)
  marinho: '#283272',
  jeans: '#3E5BA8',
  jeansClaro: '#6F8FD6',
  bege: '#E9D8B8',
  cinza: '#9AA0C4',
  vinho: '#A23B62',
  verde: '#3FB27F',
} as const;

const PELE = { p1: '#F6D2B0', p2: '#E9B98F', p3: '#D29A6C', p4: '#B07A4E', p5: '#8A5634', p6: '#5E3824' } as const;

/** O elenco. A ordem é estável: o roteiro guarda o `id`, não o índice. */
export const PESSOAS: Pessoa[] = [
  { id: 'marina', nome: 'Marina', genero: 'f', idade: 'adulto', corpo: 'medio', pele: PELE.p2, cabelo: 'chanel', corCabelo: '#5A3420', cor: COR.violeta },
  { id: 'caio', nome: 'Caio', genero: 'm', idade: 'jovem', corpo: 'forte', pele: PELE.p5, cabelo: 'fade', corCabelo: '#1E1410', barba: 'rala', cor: COR.corpo },
  { id: 'bia', nome: 'Bia', genero: 'f', idade: 'jovem', corpo: 'esguio', pele: PELE.p6, cabelo: 'trancas', corCabelo: '#1A100C', brinco: true, cor: COR.oficio },
  { id: 'theo', nome: 'Theo', genero: 'm', idade: 'adulto', corpo: 'medio', pele: PELE.p3, cabelo: 'ondulado', corCabelo: '#3B2416', barba: 'cheia', cor: COR.vinculos },
  { id: 'lucia', nome: 'Lúcia', genero: 'f', idade: 'maduro', corpo: 'largo', pele: PELE.p4, cabelo: 'cacheado', corCabelo: '#2C1A12', brinco: true, cor: COR.saude },
  { id: 'rafa', nome: 'Rafa', genero: 'm', idade: 'adulto', corpo: 'largo', pele: PELE.p1, cabelo: 'curto', corCabelo: '#2A2A33', oculos: true, cor: COR.prosperidade },
  { id: 'celia', nome: 'Dona Célia', genero: 'f', idade: 'idoso', corpo: 'medio', pele: PELE.p5, cabelo: 'grisalho', corCabelo: '#E4E4EE', oculos: true, cor: COR.mente },
  { id: 'antonio', nome: 'Seu Antônio', genero: 'm', idade: 'idoso', corpo: 'esguio', pele: PELE.p2, cabelo: 'calvo', corCabelo: '#CFCFD8', barba: 'bigode', oculos: true, cor: COR.verde },
];

export const pessoa = (id: string): Pessoa => {
  const p = PESSOAS.find((x) => x.id === id);
  if (!p) throw new Error(`pessoa desconhecida: ${id} (tem: ${PESSOAS.map((x) => x.id).join(', ')})`);
  return p;
};

// ------------------------------------------------------------------ guarda-roupa

/** O guarda-roupa de cada pessoa: a cor dela aparece em todo contexto (é como a gente a reconhece). */
const GUARDA: Record<string, Record<Contexto, Roupa>> = {
  marina: {
    esporte: { contexto: 'esporte', cima: { tipo: 'regata', cor: COR.violeta, cor2: COR.branco }, baixo: { tipo: 'legging', cor: COR.marinho, cor2: COR.violeta }, calcado: { tipo: 'tenis', cor: COR.branco, sola: COR.violeta }, extras: ['relogio'] },
    // rodada 3 (painel): os 4 contextos da Marina eram todos violeta e a roupa não contava a cena;
    // o violeta dela fica no esporte e na rua, a casa é mescla clara, o trabalho é marinho com branco e
    // o pijama é azul-claro listrado
    casa: { contexto: 'casa', cima: { tipo: 'moletom', cor: COR.bege, cor2: COR.mente }, baixo: { tipo: 'moletom', cor: COR.cinza }, calcado: { tipo: 'meia', cor: COR.branco } },
    trabalho: { contexto: 'trabalho', cima: { tipo: 'blazer', cor: COR.marinho, cor2: COR.branco }, baixo: { tipo: 'calca', cor: COR.marinho }, calcado: { tipo: 'sapato', cor: COR.grafite }, extras: ['cracha'] },
    rua: { contexto: 'rua', cima: { tipo: 'blusa', cor: COR.violeta }, baixo: { tipo: 'jeans', cor: COR.jeans }, calcado: { tipo: 'tenis', cor: COR.branco, sola: COR.cinza } },
    dormir: { contexto: 'dormir', cima: { tipo: 'pijama', cor: COR.jeansClaro, cor2: COR.branco }, baixo: { tipo: 'pijama', cor: COR.jeansClaro, cor2: COR.branco }, calcado: { tipo: 'meia', cor: COR.branco } },
  },
  caio: {
    esporte: { contexto: 'esporte', cima: { tipo: 'camiseta', cor: COR.corpo, cor2: COR.marinho }, baixo: { tipo: 'short', cor: COR.marinho, cor2: COR.corpo }, calcado: { tipo: 'tenis', cor: COR.corpo, sola: COR.branco }, extras: ['fone'] },
    // camiseta (não regata): no busto, a regata de decote fundo com a dobra na diagonal lia camisola
    casa: { contexto: 'casa', cima: { tipo: 'camiseta', cor: COR.cinza }, baixo: { tipo: 'short', cor: COR.grafite }, calcado: { tipo: 'chinelo', cor: COR.corpo } },
    trabalho: { contexto: 'trabalho', cima: { tipo: 'camisa', cor: COR.branco, cor2: COR.corpo }, baixo: { tipo: 'calca', cor: COR.grafite }, calcado: { tipo: 'sapato', cor: '#5A3A2A' } },
    rua: { contexto: 'rua', cima: { tipo: 'moletom', cor: COR.corpo }, baixo: { tipo: 'jeans', cor: COR.jeans }, calcado: { tipo: 'tenis', cor: COR.branco, sola: COR.corpo }, extras: ['bone'] },
    dormir: { contexto: 'dormir', cima: { tipo: 'camiseta', cor: COR.grafite }, baixo: { tipo: 'short', cor: COR.cinza }, calcado: { tipo: 'meia', cor: COR.cinza } },
  },
  bia: {
    // regata (não top curto): barriga de fora ao lado de "o efeito vem do estoque" puxava pro "suplemento → corpo"
    esporte: { contexto: 'esporte', cima: { tipo: 'regata', cor: COR.oficio, cor2: COR.branco }, baixo: { tipo: 'legging', cor: COR.grafite, cor2: COR.oficio }, calcado: { tipo: 'tenis', cor: COR.oficio, sola: COR.branco }, extras: ['relogio', 'faixa'] },
    casa: { contexto: 'casa', cima: { tipo: 'camiseta', cor: COR.oficio }, baixo: { tipo: 'short', cor: COR.bege }, calcado: { tipo: 'meia', cor: COR.branco } },
    trabalho: { contexto: 'trabalho', cima: { tipo: 'blusa', cor: COR.branco, cor2: COR.oficio }, baixo: { tipo: 'saia', cor: COR.oficio }, calcado: { tipo: 'sapato', cor: COR.grafite } },
    rua: { contexto: 'rua', cima: { tipo: 'camiseta', cor: COR.prosperidade }, baixo: { tipo: 'jeans', cor: COR.jeansClaro }, calcado: { tipo: 'tenis', cor: COR.branco, sola: COR.oficio } },
    dormir: { contexto: 'dormir', cima: { tipo: 'pijama', cor: COR.oficio, cor2: COR.branco }, baixo: { tipo: 'pijama', cor: COR.oficio, cor2: COR.branco }, calcado: { tipo: 'meia', cor: COR.branco } },
  },
  theo: {
    esporte: { contexto: 'esporte', cima: { tipo: 'regata', cor: COR.vinculos, cor2: COR.marinho }, baixo: { tipo: 'short', cor: COR.grafite, cor2: COR.vinculos }, calcado: { tipo: 'tenis', cor: COR.grafite, sola: COR.vinculos } },
    casa: { contexto: 'casa', cima: { tipo: 'moletom', cor: COR.vinculos }, baixo: { tipo: 'moletom', cor: COR.grafite }, calcado: { tipo: 'chinelo', cor: COR.grafite } },
    trabalho: { contexto: 'trabalho', cima: { tipo: 'camisa', cor: COR.vinculos, cor2: COR.branco }, baixo: { tipo: 'calca', cor: COR.bege }, calcado: { tipo: 'sapato', cor: '#5A3A2A' } },
    rua: { contexto: 'rua', cima: { tipo: 'camiseta', cor: COR.branco, cor2: COR.vinculos }, baixo: { tipo: 'jeans', cor: COR.jeans }, calcado: { tipo: 'tenis', cor: COR.vinculos, sola: COR.branco } },
    dormir: { contexto: 'dormir', cima: { tipo: 'camiseta', cor: COR.vinculos }, baixo: { tipo: 'pijama', cor: COR.grafite, cor2: COR.vinculos }, calcado: { tipo: 'meia', cor: COR.cinza } },
  },
  lucia: {
    esporte: { contexto: 'esporte', cima: { tipo: 'camiseta', cor: COR.saude, cor2: COR.branco }, baixo: { tipo: 'legging', cor: COR.marinho, cor2: COR.saude }, calcado: { tipo: 'tenis', cor: COR.branco, sola: COR.saude }, extras: ['garrafa'] },
    casa: { contexto: 'casa', cima: { tipo: 'blusa', cor: COR.saude }, baixo: { tipo: 'moletom', cor: COR.bege }, calcado: { tipo: 'chinelo', cor: COR.saude } },
    trabalho: { contexto: 'trabalho', cima: { tipo: 'blazer', cor: COR.vinho, cor2: COR.branco }, baixo: { tipo: 'calca', cor: COR.grafite }, calcado: { tipo: 'sapato', cor: COR.vinho } },
    rua: { contexto: 'rua', cima: { tipo: 'blusa', cor: COR.saude, cor2: COR.prosperidade }, baixo: { tipo: 'saia', cor: COR.marinho }, calcado: { tipo: 'sapato', cor: COR.bege } },
    dormir: { contexto: 'dormir', cima: { tipo: 'pijama', cor: COR.saude, cor2: COR.branco }, baixo: { tipo: 'pijama', cor: COR.saude, cor2: COR.branco }, calcado: { tipo: 'meia', cor: COR.branco } },
  },
  rafa: {
    esporte: { contexto: 'esporte', cima: { tipo: 'camiseta', cor: COR.prosperidade, cor2: COR.grafite }, baixo: { tipo: 'short', cor: COR.grafite }, calcado: { tipo: 'tenis', cor: COR.grafite, sola: COR.prosperidade }, extras: ['relogio'] },
    casa: { contexto: 'casa', cima: { tipo: 'camiseta', cor: COR.prosperidade }, baixo: { tipo: 'moletom', cor: COR.marinho }, calcado: { tipo: 'chinelo', cor: COR.grafite } },
    trabalho: { contexto: 'trabalho', cima: { tipo: 'blazer', cor: COR.marinho, cor2: COR.branco }, baixo: { tipo: 'calca', cor: COR.marinho }, calcado: { tipo: 'sapato', cor: '#3A2A22' }, extras: ['relogio'] },
    rua: { contexto: 'rua', cima: { tipo: 'camisa', cor: COR.prosperidade, cor2: COR.grafite }, baixo: { tipo: 'calca', cor: COR.bege }, calcado: { tipo: 'tenis', cor: COR.grafite, sola: COR.branco } },
    dormir: { contexto: 'dormir', cima: { tipo: 'pijama', cor: COR.jeansClaro, cor2: COR.branco }, baixo: { tipo: 'pijama', cor: COR.jeansClaro, cor2: COR.branco }, calcado: { tipo: 'meia', cor: COR.cinza } },
  },
  celia: {
    esporte: { contexto: 'esporte', cima: { tipo: 'manga-longa', cor: COR.mente, cor2: COR.branco }, baixo: { tipo: 'legging', cor: COR.marinho }, calcado: { tipo: 'tenis', cor: COR.branco, sola: COR.mente } },
    casa: { contexto: 'casa', cima: { tipo: 'blusa', cor: COR.mente, cor2: COR.branco }, baixo: { tipo: 'calca', cor: COR.bege }, calcado: { tipo: 'chinelo', cor: COR.mente }, extras: ['avental'] },
    trabalho: { contexto: 'trabalho', cima: { tipo: 'blusa', cor: COR.mente, cor2: COR.prosperidade }, baixo: { tipo: 'saia', cor: COR.marinho }, calcado: { tipo: 'sapato', cor: COR.grafite } },
    rua: { contexto: 'rua', cima: { tipo: 'blusa', cor: COR.mente, cor2: COR.prosperidade }, baixo: { tipo: 'calca', cor: COR.marinho }, calcado: { tipo: 'sapato', cor: COR.bege } },
    dormir: { contexto: 'dormir', cima: { tipo: 'pijama', cor: COR.mente, cor2: COR.branco }, baixo: { tipo: 'pijama', cor: COR.mente, cor2: COR.branco }, calcado: { tipo: 'chinelo', cor: COR.mente } },
  },
  antonio: {
    esporte: { contexto: 'esporte', cima: { tipo: 'camiseta', cor: COR.verde, cor2: COR.branco }, baixo: { tipo: 'moletom', cor: COR.grafite }, calcado: { tipo: 'tenis', cor: COR.branco, sola: COR.cinza }, extras: ['bone'] },
    casa: { contexto: 'casa', cima: { tipo: 'camisa', cor: COR.verde, cor2: COR.bege }, baixo: { tipo: 'calca', cor: COR.bege }, calcado: { tipo: 'chinelo', cor: '#5A3A2A' } },
    trabalho: { contexto: 'trabalho', cima: { tipo: 'blazer', cor: COR.grafite, cor2: COR.branco }, baixo: { tipo: 'calca', cor: COR.grafite }, calcado: { tipo: 'sapato', cor: '#3A2A22' } },
    rua: { contexto: 'rua', cima: { tipo: 'camisa', cor: COR.verde, cor2: COR.bege }, baixo: { tipo: 'calca', cor: COR.bege }, calcado: { tipo: 'sapato', cor: '#5A3A2A' }, extras: ['bone'] },
    dormir: { contexto: 'dormir', cima: { tipo: 'pijama', cor: COR.jeansClaro, cor2: COR.branco }, baixo: { tipo: 'pijama', cor: COR.jeansClaro, cor2: COR.branco }, calcado: { tipo: 'chinelo', cor: '#5A3A2A' } },
  },
};

export const roupaDe = (p: Pessoa, c: Contexto): Roupa => GUARDA[p.id][c];

// ------------------------------------------------------------------ a roupa pela cena

export type Lugar = 'cozinha' | 'banheiro' | 'parque' | 'academia' | 'escritorio' | 'casa' | 'cidade' | 'quarto' | 'treinamento';
const ATIVAS: Acao[] = ['correr', 'saltar', 'rosca', 'alongar'];

/**
 * O contexto da roupa sai da CENA: ação de treino ou academia = esporte; escritório e
 * treinamento = trabalho; cozinha/banheiro/casa = casa (de noite no quarto = dormir);
 * parque/cidade sem treino = rua. O roteiro só força (`roupa`) quando a história pede
 * (ex.: "chega do trabalho e vai correr" — duas cenas, duas roupas).
 */
export function contextoDe(cena: { acoes?: Acao[]; lugar?: Lugar; hora?: 'manha' | 'dia' | 'tarde' | 'noite' }): Contexto {
  const acoes = cena.acoes ?? [];
  if (acoes.some((a) => ATIVAS.includes(a)) || cena.lugar === 'academia') return 'esporte';
  if (cena.lugar === 'escritorio' || cena.lugar === 'treinamento') return 'trabalho';
  if (cena.lugar === 'quarto') return cena.hora === 'noite' ? 'dormir' : 'casa';
  if (cena.lugar === 'cozinha' || cena.lugar === 'banheiro' || cena.lugar === 'casa') return 'casa';
  return 'rua';
}

/**
 * A pessoa combina com o que a cena manda fazer? Devolve o motivo quando não.
 * Régua (André, 2026-11-09): o elenco tem que parecer quem FAZ aquilo — tiro de corrida e
 * salto pedem alguém jovem/adulto de corpo atlético; idosos aparecem andando, alongando,
 * cozinhando, dormindo, pensando (e nos temas deles: sono, equilíbrio, memória).
 */
export function cabe(p: Pessoa, acoes: Acao[], ritmo?: 'lento' | 'normal' | 'rapido'): string | null {
  const intensa = acoes.includes('saltar') || (acoes.includes('correr') && ritmo === 'rapido');
  if (p.idade === 'idoso' && (intensa || acoes.includes('correr'))) return `${p.nome} é idosa/o: corrida e salto pedem alguém jovem ou adulto`;
  if (intensa && p.corpo === 'largo') return `${p.nome}: tiro e salto pedem corpo atlético (esguio/médio/forte)`;
  return null;
}
