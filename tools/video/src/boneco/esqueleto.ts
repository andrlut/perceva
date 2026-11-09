// Boneco v5 — o esqueleto articulado que TODO estilo de pessoa desenha (2026-11-09).
//
// Por que existe: o André mostrou os vídeos pra 5 pessoas e ninguém percebeu o rosto hexa;
// o boneco antigo (cabeça grande, túnica, perninha) "tá muito South Park". O pedido é um
// boneco com mais graus de liberdade e mais detalhe. Daí: um esqueleto de verdade
// (ombro → cotovelo → punho, quadril → joelho → tornozelo, tronco, pescoço, cabeça),
// uma biblioteca de poses (poses.ts) e um guarda-roupa por contexto (elenco.ts), iguais pra
// todo estilo. O estilo (estilos/<id>.tsx) só DESENHA em cima das juntas.
//
// Coordenadas: unidades do boneco, chão em y = 0, y cresce PRA BAIXO (SVG), o boneco nasce
// centrado em x = 0. Em pé, a altura total (sola → topo da cabeça) é `alturaDe(prop)`.
//
// Ângulos (graus) são SEMPRE no plano da tela e ABSOLUTOS depois do FK:
//   0 = apontando pra baixo; + = gira na direção de +x (a direita da tela).
// Um boneco de perfil/três-quartos olha pra +x: aí "+" é "pra frente". Pra olhar pra
// esquerda, o desenho espelha inteiro (`espelho`), a pose não muda.
//
// Membros: índice 0 = o de TRÁS (desenhado antes do tronco) e 1 = o da FRENTE (depois do
// tronco). De frente, 0 = o da esquerda da tela, 1 = o da direita. De 3/4 e de perfil (olhando
// pra +x) o da FRENTE — o lado que vem pra câmera — fica em −x e o de TRÁS em +x, atrás do peito
// (rodada 2, 2026-11-09: era o contrário, e todo gesto no rosto saía com o cotovelo na altura do
// ombro; agora a mão da frente cruza o peito até a boca/queixo, com o cotovelo embaixo).

export type P = [number, number];
export type Vista = 'frente' | 'tres-quartos' | 'perfil';
export type Mao = 'solta' | 'fechada' | 'segura' | 'aponta' | 'aberta';
export type Humor = 'ok' | 'feliz' | 'cansado' | 'focado' | 'surpresa';

/** Medidas de um estilo (unidades). Cada estilo escolhe a sua proporção. */
export type Proporcao = {
  /** altura da cabeça (queixo → topo do crânio, sem cabelo) */
  cabeca: number;
  /** largura da cabeça de frente */
  cabecaLarg: number;
  /** base do pescoço (linha dos ombros) → queixo */
  pescoco: number;
  /** pélvis (centro do quadril) → linha dos ombros */
  tronco: number;
  /** meia largura dos ombros, de frente */
  ombros: number;
  /** meia largura do quadril (pivô das coxas), de frente */
  quadris: number;
  braco: number;
  antebraco: number;
  /** punho → ponta dos dedos */
  mao: number;
  coxa: number;
  canela: number;
  /** sola → tornozelo */
  tornozelo: number;
  /** calcanhar → ponta do pé */
  pe: number;
};

export const alturaDe = (p: Proporcao) => p.tornozelo + p.canela + p.coxa + p.tronco + p.pescoco + p.cabeca;

/**
 * Pose RELATIVA (o que a biblioteca de poses escreve). Tudo opcional: o que faltar é 0.
 *   tronco    inclinação da coluna em relação à vertical (+ = pra +x)
 *   cabeca    em relação ao tronco
 *   ombro     braço em relação ao eixo do tronco (0 = pendurado ao longo do corpo; + = mão pra +x).
 *             O braço é filho do PEITO: inclinar o tronco leva o braço junto.
 *   cotovelo  antebraço em relação ao braço (+ = dobra pra +x; o natural de perfil é +)
 *   punho     mão em relação ao antebraço
 *   quadril   coxa em relação à VERTICAL (0 = em pé; + = joelho pra +x). A perna é filha da
 *             pélvis, que não gira: inclinar o tronco é dobrar no quadril, os pés ficam onde estão.
 *   joelho    canela em relação à coxa, quanto DOBRA pra trás (sempre ≥ 0; a canela gira pra −x)
 *   pe        pé em relação à canela (0 = em ângulo reto, apontando pra +x; + = ponta SOBE)
 *   y, x      deslocamento do corpo todo (y negativo = sobe; a sombra fica no chão)
 *   amassa    0..1, pouso/agachar: achata 8% e alarga 5% (o estilo pode ignorar)
 */
export type Pose = {
  vista?: Vista;
  espelho?: boolean;
  tronco?: number;
  cabeca?: number;
  ombro?: [number, number];
  cotovelo?: [number, number];
  punho?: [number, number];
  quadril?: [number, number];
  joelho?: [number, number];
  pe?: [number, number];
  y?: number;
  x?: number;
  amassa?: number;
  mao?: [Mao, Mao];
  /** 0..1: olhos fechados (piscar, dormir, careta de esforço) */
  fecha?: number;
  /**
   * 0..1: o quanto o dedo afunda a pele em `bochecha` (só no `tocarRosto`). A pose diz a força; o
   * estilo desenha a pele cedendo (anel de sombra, a borda que estufa) proporcional a ela.
   */
  aperto?: number;
  /** 0..1: a marca rosada que FICA na pele depois do aperto e some devagar (só no `tocarRosto`) */
  marca?: number;
  /** o braço passa NA FRENTE da cabeça (mão na boca, dedo no rosto) */
  bracoNaFrente?: [boolean, boolean];
  /**
   * Escorço do BRAÇO (ombro → cotovelo), 0,45..1: o braço que aponta pra câmera aparece mais curto.
   * É o truque do 2D pra mão no rosto de frente (o cotovelo vem pra câmera); sem ele, o cotovelo
   * só tem como ir pra cima do ombro. O estilo desenha o braço entre as juntas como sempre (a
   * largura não muda) e pode escurecer um tico a dobra do cotovelo quando `encurta` < 0,8.
   */
  encurta?: [number, number];
};

/** Saída do FK: onde fica cada junta (unidades, chão y = 0) e o ângulo absoluto de cada osso. */
export type Juntas = {
  vista: Vista;
  espelho: boolean;
  /** centro do quadril */
  pelvis: P;
  /** centro da linha dos ombros (base do pescoço) */
  peito: P;
  /** queixo */
  queixo: P;
  /** centro da cabeça (meio caminho queixo → topo) */
  cabeca: P;
  /**
   * ÂNCORAS DO ROSTO — o estilo TEM que desenhar a boca em `boca` e a bochecha da frente em
   * `bochecha`: é ali que o copo encosta, que a mão do "pensar" apoia e que o dedo aperta a pele
   * (as poses miram estes pontos por IK). Já levam a vista (de 3/4 e perfil o rosto vai pra +x) e
   * o giro da cabeça.
   */
  boca: P;
  bochecha: P;
  /** meio da linha dos olhos */
  olhos: P;
  ombro: [P, P];
  cotovelo: [P, P];
  punho: [P, P];
  /** ponta dos dedos */
  dedos: [P, P];
  quadril: [P, P];
  joelho: [P, P];
  tornozelo: [P, P];
  /** calcanhar e ponta do pé (no plano da tela) */
  calcanhar: [P, P];
  ponta: [P, P];
  /** ângulos absolutos (graus, 0 = pra baixo, + = pra +x) de cada osso, pro estilo girar a peça */
  ang: {
    tronco: number;
    cabeca: number;
    braco: [number, number];
    antebraco: [number, number];
    mao: [number, number];
    coxa: [number, number];
    canela: [number, number];
    /** o pé: 90 = deitado apontando pra +x */
    pe: [number, number];
  };
  /** escala horizontal da largura (ombros/quadris) pela vista: frente 1, 3/4 0,55, perfil 0,18 */
  largura: number;
  amassa: number;
  mao: [Mao, Mao];
  fecha: number;
  /** 0..1: a força do dedo na bochecha (ver Pose.aperto) */
  aperto: number;
  /** 0..1: a marca que fica depois do aperto (ver Pose.marca) */
  marca: number;
  /** escorço de cada braço (ver Pose.encurta): 1 = comprimento inteiro */
  encurta: [number, number];
  bracoNaFrente: [boolean, boolean];
  /** altura de pé do boneco (unidades) — pra caixa do desenho */
  altura: number;
};

const RAD = Math.PI / 180;
/** ponto a `len` de `o`, na direção do ângulo absoluto `a` (0 = baixo, + = pra +x) */
export const ao = (o: P, a: number, len: number): P => [o[0] + Math.sin(a * RAD) * len, o[1] + Math.cos(a * RAD) * len];
/** ponto a `len` de `o` subindo (a coluna, o pescoço): ângulo `a` = inclinação da vertical pra +x */
export const acima = (o: P, a: number, len: number): P => [o[0] + Math.sin(a * RAD) * len, o[1] - Math.cos(a * RAD) * len];

export const LARGURA: Record<Vista, number> = { frente: 1, 'tres-quartos': 0.55, perfil: 0.18 };

/**
 * Onde ficam boca, bochecha e olhos, em frações da cabeça (x × cabecaLarg a partir do centro,
 * y × cabeca a partir do centro, pra baixo). De 3/4 o rosto gira pra +x; de perfil, mais.
 * `bochecha` é a que a MÃO DA FRENTE (1) aperta: de frente, a maçã do rosto da direita da tela
 * (rodada 3: em 0,36 o painel via o dedo "colado na orelha"); de 3/4 e perfil, a bochecha que vem
 * pra câmera, entre o nariz e a orelha. De frente na altura da asa do nariz, meio olho abaixo da
 * versão anterior (0,21; rodada 4: em 0,17 ainda encostava no olho), nunca colada no olho.
 */
export const ROSTO: Record<Vista, { boca: P; bochecha: P; olhos: P }> = {
  frente: { boca: [0, 0.27], bochecha: [0.29, 0.21], olhos: [0, 0.02] },
  'tres-quartos': { boca: [0.2, 0.27], bochecha: [-0.08, 0.17], olhos: [0.16, 0.02] },
  perfil: { boca: [0.4, 0.27], bochecha: [0.2, 0.17], olhos: [0.3, 0.02] },
};

/** Pose → juntas. Puro e barato (chamado a cada quadro). */
export function fk(prop: Proporcao, pose: Pose = {}): Juntas {
  const vista = pose.vista ?? 'frente';
  const w = LARGURA[vista];
  const amassa = Math.max(0, Math.min(1, pose.amassa ?? 0));
  const sy = 1 - 0.08 * amassa;
  const z = (v?: [number, number]): [number, number] => v ?? [0, 0];
  const ombroR = z(pose.ombro);
  const cotov = z(pose.cotovelo);
  const punhoR = z(pose.punho);
  const quadR = z(pose.quadril);
  const joel = z(pose.joelho);
  const peR = z(pose.pe);

  // pélvis na altura da perna esticada; a pose sobe/desce o corpo todo
  const pernaH = prop.tornozelo + prop.canela + prop.coxa;
  const pelvis: P = [pose.x ?? 0, -pernaH * sy + (pose.y ?? 0)];
  const tronco = pose.tronco ?? 0;
  const peito = acima(pelvis, tronco, prop.tronco * sy);
  const cabecaA = tronco + (pose.cabeca ?? 0);
  const queixo = acima(peito, cabecaA, prop.pescoco);
  const cabeca = acima(queixo, cabecaA, prop.cabeca / 2);
  // rosto: em coordenadas da cabeça (lx pra +x, ly pra baixo), giradas com ela
  const W = prop.cabecaLarg;
  const Hc = prop.cabeca;
  const rosto = ROSTO[vista];
  const naCabeca = (lx: number, ly: number): P => {
    const a = cabecaA * RAD;
    return [cabeca[0] + lx * Math.cos(a) - ly * Math.sin(a), cabeca[1] + lx * Math.sin(a) + ly * Math.cos(a)];
  };
  const boca = naCabeca(rosto.boca[0] * W, rosto.boca[1] * Hc);
  const bochecha = naCabeca(rosto.bochecha[0] * W, rosto.bochecha[1] * Hc);
  const olhos = naCabeca(rosto.olhos[0] * W, rosto.olhos[1] * Hc);

  // ombros e quadris: perpendiculares à coluna, abertos pela vista. De frente, 0 à esquerda e 1
  // à direita; de 3/4 e perfil (olhando pra +x) o da frente (1) vem pra câmera do lado −x e o de
  // trás (0) fica em +x, atrás do peito.
  // a linha dos ombros é perpendicular à coluna (gira com o tronco); a dos quadris é horizontal
  const lado = vista === 'frente' ? 1 : -1;
  const perp = (o: P, half: number, i: number, giro: number): P => {
    const s = (i === 0 ? -1 : 1) * lado;
    return [o[0] + Math.cos(giro * RAD) * half * s, o[1] + Math.sin(giro * RAD) * half * s];
  };
  const halfO = prop.ombros * w * (1 + 0.05 * amassa);
  const halfQ = prop.quadris * w * (1 + 0.05 * amassa);
  // o ombro fica um pouco abaixo da base do pescoço (a curva do trapézio)
  const baseOmbro = ao(peito, -tronco, prop.pescoco * 0.25);
  const ombro: [P, P] = [perp(baseOmbro, halfO, 0, tronco), perp(baseOmbro, halfO, 1, tronco)];
  const quadril: [P, P] = [perp(pelvis, halfQ, 0, 0), perp(pelvis, halfQ, 1, 0)];

  // ângulo de osso que desce (ao): + = ponta pra +x. Inclinar o tronco +t (topo pra +x) leva o
  // eixo "pra baixo" do peito pra −x — daí o braço ser ombro − tronco.
  const braco: [number, number] = [ombroR[0] - tronco, ombroR[1] - tronco];
  const antebraco: [number, number] = [braco[0] + cotov[0], braco[1] + cotov[1]];
  const mao: [number, number] = [antebraco[0] + punhoR[0], antebraco[1] + punhoR[1]];
  const enc: [number, number] = [Math.max(0.45, Math.min(1, pose.encurta?.[0] ?? 1)), Math.max(0.45, Math.min(1, pose.encurta?.[1] ?? 1))];
  const cotovelo: [P, P] = [ao(ombro[0], braco[0], prop.braco * enc[0]), ao(ombro[1], braco[1], prop.braco * enc[1])];
  const punho: [P, P] = [ao(cotovelo[0], antebraco[0], prop.antebraco), ao(cotovelo[1], antebraco[1], prop.antebraco)];
  const dedos: [P, P] = [ao(punho[0], mao[0], prop.mao), ao(punho[1], mao[1], prop.mao)];

  const coxa: [number, number] = [quadR[0], quadR[1]];
  const canela: [number, number] = [coxa[0] - Math.max(0, joel[0]), coxa[1] - Math.max(0, joel[1])];
  const pe: [number, number] = [canela[0] + 90 + peR[0], canela[1] + 90 + peR[1]];
  const joelho: [P, P] = [ao(quadril[0], coxa[0], prop.coxa * sy), ao(quadril[1], coxa[1], prop.coxa * sy)];
  const tornozelo: [P, P] = [ao(joelho[0], canela[0], prop.canela * sy), ao(joelho[1], canela[1], prop.canela * sy)];
  // o tornozelo fica acima do meio do pé: calcanhar um quarto pra trás, ponta três quartos pra frente
  const planta = (i: 0 | 1): [P, P] => {
    const sola = ao(tornozelo[i], canela[i], prop.tornozelo);
    return [ao(sola, pe[i], -prop.pe * 0.25), ao(sola, pe[i], prop.pe * 0.75)];
  };
  const [c0, p0] = planta(0);
  const [c1, p1] = planta(1);

  return {
    vista,
    espelho: !!pose.espelho,
    pelvis,
    peito,
    queixo,
    cabeca,
    boca,
    bochecha,
    olhos,
    ombro,
    cotovelo,
    punho,
    dedos,
    quadril,
    joelho,
    tornozelo,
    calcanhar: [c0, c1],
    ponta: [p0, p1],
    ang: { tronco, cabeca: cabecaA, braco, antebraco, mao, coxa, canela, pe },
    largura: w,
    amassa,
    mao: pose.mao ?? ['solta', 'solta'],
    fecha: pose.fecha ?? 0,
    aperto: pose.aperto ?? 0,
    marca: pose.marca ?? 0,
    encurta: enc,
    bracoNaFrente: pose.bracoNaFrente ?? [false, false],
    altura: alturaDe(prop),
  };
}

/** Interpola duas poses (t 0..1) — pra emendar uma ação na outra sem salto. */
export function mistura(a: Pose, b: Pose, t: number): Pose {
  const k = Math.max(0, Math.min(1, t));
  const n = (x?: number, y?: number) => (x ?? 0) + ((y ?? 0) - (x ?? 0)) * k;
  const par = (x?: [number, number], y?: [number, number]): [number, number] => [n(x?.[0], y?.[0]), n(x?.[1], y?.[1])];
  return {
    vista: k < 0.5 ? a.vista : b.vista,
    espelho: k < 0.5 ? a.espelho : b.espelho,
    tronco: n(a.tronco, b.tronco),
    cabeca: n(a.cabeca, b.cabeca),
    ombro: par(a.ombro, b.ombro),
    cotovelo: par(a.cotovelo, b.cotovelo),
    punho: par(a.punho, b.punho),
    quadril: par(a.quadril, b.quadril),
    joelho: par(a.joelho, b.joelho),
    pe: par(a.pe, b.pe),
    y: n(a.y, b.y),
    x: n(a.x, b.x),
    amassa: n(a.amassa, b.amassa),
    mao: k < 0.5 ? a.mao : b.mao,
    fecha: n(a.fecha, b.fecha),
    aperto: n(a.aperto, b.aperto),
    marca: n(a.marca, b.marca),
    encurta: [n(a.encurta?.[0] ?? 1, b.encurta?.[0] ?? 1), n(a.encurta?.[1] ?? 1, b.encurta?.[1] ?? 1)],
    bracoNaFrente: k < 0.5 ? a.bracoNaFrente : b.bracoNaFrente,
  };
}
