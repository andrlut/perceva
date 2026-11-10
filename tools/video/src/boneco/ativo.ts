// Boneco v5 no molde — o que está ATIVO neste vídeo e a tradução do vocabulário do molde.
//
// O molde inteiro fala na caixa 200×260 do boneco antigo (src/identidade/types.ts): pontos do corpo,
// mão que segura a peça, ações do roteiro (AcaoKind). Com `boneco: "serie"` no spec, o Molde liga o
// v5 (setV5) e as poucas portas do molde (Pessoa da identidade, pontoNaTela, maoNaTela, Ator) passam
// a perguntar AQUI. Sem a chave, nada disto roda: os vídeos publicados saem idênticos.
//
// Por que um registro de módulo e não contexto: pontoNaTela/maoNaTela são funções puras chamadas em
// dezenas de pontos das cenas. O Molde chama setV5 no topo de CADA render (cada aba do Remotion
// renderiza a mesma composição com as mesmas props), então o valor é determinístico por vídeo.
import type { Contexto, Lugar, Pessoa } from './elenco';
import { PESSOAS, pessoa as pessoaPorId } from './elenco';
import type { Estilo } from './estilo';
import type { Acao } from './poses';
import type { Vista } from './esqueleto';
import { ESTILOS } from './estilos';

export type V5 = { estilo: Estilo; protagonista: Pessoa; seedProtagonista: number };
let atual: V5 | null = null;

/** Liga (ou desliga, com null) o boneco v5 pro render deste vídeo. Chamado pelo Molde. */
export const setV5 = (v: V5 | null) => {
  atual = v;
};
export const v5 = () => atual;

/** O que o spec escreve → o v5 do vídeo. */
export const v5De = (spec: { boneco?: string; protagonista?: { seed: number; pessoa?: string } } | null | undefined): V5 | null => {
  if (!spec?.boneco) return null;
  const estilo = ESTILOS[spec.boneco];
  if (!estilo) throw new Error(`boneco desconhecido: ${spec.boneco} (tem: ${Object.keys(ESTILOS).join(', ')})`);
  const p = spec.protagonista?.pessoa ? pessoaPorId(spec.protagonista.pessoa) : pessoaDoSeed(spec.protagonista?.seed ?? 0);
  return { estilo, protagonista: p, seedProtagonista: spec.protagonista?.seed ?? 0 };
};

/** Figurantes e quem não tem `pessoa`: o seed escolhe alguém do elenco (estável). */
export const pessoaDoSeed = (seed: number): Pessoa => PESSOAS[((seed % PESSOAS.length) + PESSOAS.length) % PESSOAS.length];

/** As ações do molde (AcaoKind) → as da biblioteca v5. */
export const ACAO_V5: Record<string, Acao> = {
  pronta: 'pronta',
  andar: 'andar',
  correr: 'correr',
  saltar: 'saltar',
  levantar: 'rosca',
  mexer: 'mexer',
  beber: 'beber',
};

/** Ações que pedem a vista de três-quartos (o corpo de lado mostra o movimento). */
const DE_LADO = new Set(['andar', 'correr', 'saltar', 'levantar', 'mexer', 'beber']);
/** A vista da cena: com qualquer ação de movimento, 3/4 a cena inteira (trocar no meio estala). */
export const vistaDaCena = (acoes: string[]): Vista => (acoes.some((a) => DE_LADO.has(a)) ? 'tres-quartos' : 'frente');

/** Peças do molde que a mão do v5 segura desenhando ela mesma (o estilo põe os dedos por cima). */
export const SEGURA_V5: Record<string, 'halter' | 'copo' | 'coqueteleira'> = {
  peso: 'halter',
  copo: 'copo',
  'copo-agua': 'copo',
  'copo-suco': 'copo',
  coqueteleira: 'coqueteleira',
  caneca: 'copo',
};

/** O lugar do molde (AmbienteKind) → o Lugar do guarda-roupa. */
export const lugarDe = (amb?: string): Lugar | undefined => (amb ? (amb as Lugar) : undefined);

/**
 * O enquadramento da protagonista na caixa. `corpo` = de pé inteira (pés em 252). `busto` = da cintura
 * pra cima, maior (o tampo do balcão passa pela cintura; a pessoa grande da lupa): o boneco antigo tinha
 * a cabeça enorme e as cenas fechadas foram compostas pra ela — o v5 de corpo inteiro na mesma caixa
 * ficava com o rosto pequeno e as pernas na frente do balcão.
 */
export type Enquadra = 'corpo' | 'busto';
/** Quais cenas pedem o busto: pensa/cena fechadas (atrás do balcão) e a pessoa grande da lupa. */
export const enquadraDe = (scene: string, props: { plano?: string; pessoa?: string } | undefined): Enquadra =>
  ((scene === 'pensa' || scene === 'cena') && props?.plano === 'fechado') || (scene === 'dentro' && props?.plano === 'lupa' && props?.pessoa === 'grande') ? 'busto' : 'corpo';

/** A cena que a Pessoa está (o Molde provê): o lugar, as ações, a roupa forçada e o enquadramento. */
export type CenaV5 = { lugar?: Lugar; hora?: 'manha' | 'dia' | 'tarde' | 'noite'; acoes: string[]; roupa?: Contexto; enquadra?: Enquadra };
