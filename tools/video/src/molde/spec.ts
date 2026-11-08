// Molde genérico do vídeo de ideia — o formato que o render lê.
//
// O roteiro mora em learning-drops/video-specs/<slug>.json (bilíngue, revisado,
// versionado). `scripts/molde.mjs build` resolve um idioma e grava o spec
// RESOLVIDO em public/molde/<slug>.<idea>.<lang>/spec.json — é esse arquivo
// que a composição `Molde` lê. O catálogo de cenas e peças está em MOLDE.md.
import type { DimId } from '../theme';
import type { Line } from '../timeline';

export type Lang = 'pt' | 'en';
/** `focado` (fase 3): atenta, sem ler brava — sobrancelha reta, olho aberto, boca reta. */
export type Mood = 'ok' | 'feliz' | 'cansado' | 'focado';

/** Peça do elenco (nome) ou ícone do app (`ion:<nome>`). */
export type PieceName = string;

/** Uma peça que entra na cena, opcionalmente quando a fala chega a `cue`. */
/** `stay`: a peça já estava em cena na fala anterior (mesmo encaixe) — aparece pousada, sem cair de novo. */
/**
 * `run` (fase 3): a peça anda no intervalo da fala — `progress` vai de 0 a 1 entre a deixa `cue`
 * (default: a deixa da própria peça, ou o começo da fala) e a deixa `ate` (default: o fim da fala).
 * O calendário marca casas, o reservatório enche: é como o tempo passa sem lapso.
 */
export type Obj = { p: PieceName; cue?: string; out?: string; stay?: boolean; run?: { cue?: string; ate?: string } };

export type SceneKind = 'pessoa' | 'semana' | 'virada' | 'multidao' | 'comparar' | 'lista' | 'cena' | 'pensa' | 'mapa' | 'caderno' | 'dentro' | 'faz' | 'verso';

// ------------------------------------------------------------ câmera, passagem, ambiente

export type CameraMove = 'push' | 'pull' | 'pan-left' | 'pan-right' | 'drift' | 'dolly' | 'still';
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
export type Transicao = 'fade' | 'zoom' | 'desliza' | 'corte' | 'hexa' | 'chicote';

/** Os 4 primeiros moram em ambientes.tsx; os da fase 3 são lugares registrados (src/molde/lugares/). */
export type AmbienteKind = 'escritorio' | 'treinamento' | 'casa' | 'cidade' | 'cozinha' | 'banheiro' | 'parque' | 'academia';
export type Gente = 'nenhuma' | 'pouca' | 'muita';
export type Hora = 'manha' | 'dia' | 'noite';

// ------------------------------------------------------------ mapa do dia

export type Feel = 'drena' | 'neutro' | 'energiza';
/** Um bloco do dia: o ícone diz O QUE é, a cor diz COMO pesa. Nunca hora nem número. */
export type Bloco = {
  /** Ionicons — no caderno é opcional (lá quem diz o que é a tarefa é o nome) */
  icon: string;
  /** o NOME da tarefa (fase 2, "demonstrar a ideia"): escrito no caderno e dentro do bloco do mapa; ≤ 16 caracteres */
  label?: string;
  feel: Feel;
  /** comprimento relativo no dia (1..3, default 1) */
  size?: number;
  /** deixa em que o bloco cai no dia */
  cue?: string;
  /** segunda batida (na deixa `turn` da cena): o bloco vira outro peso/tamanho/ícone */
  then?: { feel?: Feel; size?: number; icon?: string };
};

// ------------------------------------------------------------ fase 3: a tela demonstra o que a voz diz
//
// Contratos em design.json (synth.blocks) com os cortes do PLANO-FINAL: sem lapso, sem esteira,
// sem `trocar`/`bocejar`, sem `pulsa`, sem lugar por passo, sem cor `mista`, lente só com as
// texturas abaixo. Quem desenha: acao.tsx (Ator), rotulo.tsx, lente.tsx, reservatorio.tsx,
// cenas/dentro.tsx, cenas/faz.tsx, lugares/*.

/** O que a pessoa FAZ (src/elenco/acao.tsx). `correr` é no lugar ou vindo pra câmera; trajeto de lado só no `andar`. */
export type AcaoKind = 'pronta' | 'andar' | 'correr' | 'saltar' | 'levantar' | 'mexer' | 'beber';
export type AcaoSpec = {
  acao: AcaoKind;
  /** deixa em que a ação começa (sem deixa: com a fala) */
  cue?: string;
  /** deixa em que a ação termina (sem: ao fim das reps, ou até a próxima ação) */
  ate?: string;
  /** repetições (1..4) */
  reps?: number;
  ritmo?: 'lento' | 'rapido';
  /** x na tela de onde sai e aonde chega (só andar) */
  de?: number;
  para?: number;
  /** a peça na mão direita (levantar usa `peso` nas duas) */
  peca?: PieceName;
};

/** Parte do corpo (pontos em CORPO, src/identidade/types.ts) ou sistema (vasos, músculos, pele). */
export type Regiao = 'cabeca' | 'rosto' | 'boca' | 'peito' | 'tronco' | 'barriga' | 'braco' | 'perna' | 'vasos' | 'musculos' | 'pele';
/** Cor de fluxo/região: a cor de uma área, ou ouro. */
export type CorFluxo = DimId | 'ouro';

/** Palavra escrita na imagem (src/molde/rotulo.tsx), como o Notebook faz. Toda cena aceita; quem desenha é o Stage. */
export type RotuloSpec = {
  text: string;
  /** deixa em que ela se escreve */
  cue: string;
  /** deixa em que ela sai */
  out?: string;
  /** posição na tela (sem: a fila do Stage empilha a partir de y 480) */
  x?: number;
  y?: number;
  /** seta até uma região do corpo ou um ponto da tela */
  seta?: Regiao | [number, number];
  tom?: 'claro' | 'ouro' | 'area';
};

/** Fluxo de partículas da origem até uma região (cena dentro, plano corpo). */
export type Fluxo = { para: Regiao; cor?: CorFluxo; particula?: 'grao' | 'ponto'; cue?: string };
/** Região que acende na deixa (cena dentro). `pulsa` saiu (lia "pump"). */
export type RegiaoFx = { parte: Regiao; cue: string; efeito?: 'acende' | 'anel'; cor?: CorFluxo; rotulo?: string };

/** Camadas de dentro da lente (src/molde/lente.tsx). */
export type Textura = 'liso' | 'rede' | 'dobras' | 'fluxo' | 'agua';
export type Camada = {
  textura: Textura;
  tom?: 'pele' | 'area' | 'violeta' | 'fundo' | 'ouro';
  peso?: 1 | 2 | 3;
  cresce?: string;
  /** na deixa `turn` da lente: a camada rareia ou se renova */
  then?: 'rareia' | 'renova';
  rotulo?: { text: string; cue: string };
};
export type Particulas = {
  forma: 'ponto' | 'cordao';
  /** uma cor, ou uma lista (as frentes da fala seguinte); sem `mista` */
  cor?: CorFluxo | CorFluxo[];
  /** 6..24 */
  n?: number;
  de?: 'topo' | number;
  cue?: string;
  quebra?: string;
  rotulo?: { text: string; cue: string };
  atravessa?: { camada: number; cue: string };
  correnteza?: boolean;
  destaque?: { cue: string; rotulo: string };
  boiam?: boolean;
};
/** O tanque de estoque (src/elenco/reservatorio.tsx): nível por deixa, jatos que gastam, fio que pinga. */
export type ReservaSpec = {
  conteudo?: 'grao' | 'liquido';
  nivel: { v: number; cue?: string }[];
  gasta?: { cue: string }[];
  pinga?: { cue: string }[];
  rotulo?: { text: string; cue: string };
};
export type LenteSpec = {
  sobre: Regiao | 'peca';
  cue?: string;
  cresce?: string;
  fecha?: string;
  turn?: string;
  tamanho?: 'callout' | 'grande';
  conteudo: { camadas: Camada[]; particulas?: Particulas; toque?: string; ritmo?: 'devagar' | 'normal' } | { reserva: ReservaSpec };
};

/** Um passo do `faz`: uma ação presa à deixa, com rótulo opcional. Sem lugar por passo (cortado). */
export type Passo = AcaoSpec & { rotulo?: string };
/** Figurante do `faz`: cada um num esforço diferente, atrás dela, sem cruzar a caixa dela. */
export type Extra = { seed: number; x: number; acao: AcaoKind; cue: string; ate?: string; para?: number; size?: number };
/** Medidor do `faz`: o tanque pequeno que gasta um gole por passo. */
export type MedidorSpec = { nivel: number; gasta?: number; lado?: 'esquerda' | 'direita' };

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
  /** caderno: os títulos das três colunas (tarefa, tempo, energia); default no idioma */
  heads?: string[];
  /** caderno: deixa em que a faixa da semana acende no alto da página */
  semana?: string;
  // verso: o selo dourado depois da leitura (default "IDEIA ABSORVIDA"; as portas trocam)
  done?: string;
  // ---------------------------------------------------------------- fase 3
  /** pessoa / cena / dentro (lupa): o que ela FAZ, preso às deixas — sem acoes, a cena sai como antes */
  acoes?: AcaoSpec[];
  /** toda cena: palavras escritas na imagem (o Stage desenha) */
  rotulos?: RotuloSpec[];
  /** dentro: `corpo` (o corpo de vidro) ou `lupa` (a lente sobre ela num lugar); cena: `fechado` (do peito pra cima) */
  plano?: 'corpo' | 'lupa' | 'fechado';
  /** dentro (corpo): de onde os fluxos nascem */
  origem?: 'boca' | 'tronco' | 'barriga';
  fluxos?: Fluxo[];
  /** dentro (corpo): deixa em que o fio único se abre nos caminhos de cada fluxo */
  divide?: string;
  regioes?: RegiaoFx[];
  /** dentro e cena: a lupa redonda */
  lente?: LenteSpec;
  /** dentro (corpo): o tanque que cresce do músculo */
  reserva?: ReservaSpec;
  /** faz: 1..4 passos */
  passos?: Passo[];
  medidor?: MedidorSpec;
  /** faz: até 3 figurantes */
  elenco?: Extra[];
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
  /** régua do molde (fase 3 = base do quadro aberta, Vinheta só atrás da legenda); sem = a de antes */
  fase?: number;
  /** a protagonista do vídeo (Pessoa e Ator de todas as cenas); sem = seed 0 com a pele de sempre */
  protagonista?: { seed: number; skin?: string };
  lines: MoldeLine[];
};
