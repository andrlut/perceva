// Boneco v5 — a biblioteca de poses: o que a pessoa FAZ, em ângulos de junta (esqueleto.ts).
// Igual pra todo estilo: um estilo novo só desenha, nunca reinventa a corrida.
//
// Toda pose é função do quadro `t` (30 fps) e da proporção do estilo (as poses que miram um
// ponto do corpo — mão na boca, dedo no rosto — resolvem o braço por IK em cima dela).
// Regras de parceiro que moram aqui (Paker/ANVISA, fase 3): o salto é ATLÉTICO (braços pra
// trás no agachamento, punhos no peito no voo, nunca acima do ombro) — comemoração com
// braço pra cima é outra pose (`comemorar`) e o roteiro escolhe.
import { type Mao, type P, type Pose, type Proporcao, type Vista, ao, acima, alturaDe, fk } from './esqueleto';

export type Acao = 'parado' | 'andar' | 'correr' | 'saltar' | 'rosca' | 'beber' | 'tocarRosto' | 'acenar' | 'alongar' | 'comemorar' | 'pensar';

export type PoseOpts = {
  vista?: Vista;
  /** correr/andar: mais rápido */
  ritmo?: 'lento' | 'normal' | 'rapido';
  /** deslocamento de fase (quadros): duas pessoas na mesma ação não andam em sincronia */
  fase?: number;
  espelho?: boolean;
};

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** suave 0→1 */
const ease = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
/** ângulo (convenção dos ossos que descem: 0 = baixo, + = pra +x) do vetor a→b */
const angDe = (a: P, b: P) => Math.atan2(b[0] - a[0], b[1] - a[1]) / RAD;

/**
 * IK de dois ossos: do ombro `s` até o alvo `alvo`, com braço `a` e antebraço `b`.
 * Das duas soluções, fica a do cotovelo mais baixo (`'baixo'`), mais alto (`'cima'`) ou mais pra
 * +x/−x (`'mais-x'`: o braço da frente com o cotovelo pra FORA do corpo — mão no rosto, copo na boca).
 * Devolve os ângulos ABSOLUTOS do braço e do antebraço.
 */
export function ik2(s: P, alvo: P, a: number, b: number, pref: 'baixo' | 'cima' | 'mais-x' | 'menos-x' = 'baixo'): [number, number] {
  const dx = alvo[0] - s[0];
  const dy = alvo[1] - s[1];
  const n = Math.hypot(dx, dy) || 1e-6;
  const d = Math.max(Math.abs(a - b) + 0.01, Math.min(a + b - 0.01, n));
  const base = Math.atan2(dx, dy) / RAD;
  const alfa = Math.acos((a * a + d * d - b * b) / (2 * a * d)) / RAD;
  const fim: P = [s[0] + (dx * d) / n, s[1] + (dy * d) / n];
  const sol = [base - alfa, base + alfa].map((braco) => {
    const cot: P = ao(s, braco, a);
    return { braco, ante: angDe(cot, fim), y: cot[1], x: cot[0] };
  });
  const score = (o: { x: number; y: number }) => (pref === 'baixo' ? o.y : pref === 'cima' ? -o.y : pref === 'mais-x' ? o.x + 0.6 * o.y : -o.x + 0.6 * o.y);
  const pick = score(sol[0]) >= score(sol[1]) ? sol[0] : sol[1];
  return [pick.braco, pick.ante];
}

/** Respiração e balanço de quem está parado (sem ela, o boneco vira foto). */
const vida = (t: number, h: number) => ({
  y: Math.sin(t / 19) * h * 0.003,
  cabeca: Math.sin(t / 47) * 2,
  tronco: Math.sin(t / 61) * 0.8,
});

// ------------------------------------------------------------------ parado / acenar / pensar

function parado(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const h = alturaDe(prop);
  const v = vida(t, h);
  const vista = o.vista ?? 'frente';
  if (vista === 'frente') {
    // braços soltos, um tico afastados do quadril, cotovelo quase reto (dobra pra dentro)
    return { vista, ...v, ombro: [-7, 7], cotovelo: [7, -7], punho: [3, -3], mao: ['solta', 'solta'] };
  }
  // 3/4 e perfil: o braço da frente (lado −x) cai ao longo da coxa de perto, o de trás um tico à
  // frente atrás do peito; peso numa perna. (Rodada 3: com o lado novo, ombro +6 levava a mão da
  // frente pra frente da virilha.)
  return { vista, ...v, ombro: [4, -3], cotovelo: [10, 6], quadril: [-3, 4], joelho: [4, 0], mao: ['solta', 'solta'] };
}

function acenar(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const base = parado(t, prop, o);
  const w = Math.sin(t / 3.2);
  // braço da frente/direita em cima, antebraço balançando em volta do cotovelo
  return { ...base, ombro: [base.ombro![0], 150], cotovelo: [base.cotovelo![0], 18 + w * 22], punho: [0, w * 8], mao: ['solta', 'aberta'] };
}

function pensar(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const vista = o.vista ?? 'tres-quartos';
  const base = parado(t, prop, { ...o, vista });
  // mão no queixo: IK do braço da frente até um ponto logo abaixo do queixo
  const pose: Pose = { ...base, vista, cabeca: 9 + Math.sin(t / 40) * 2, tronco: 3 };
  const j = fk(prop, pose);
  // o punho logo abaixo do queixo (o nó dos dedos encosta nele); de 3/4 a mão da frente vem do
  // lado −x, cruza o peito, e o cotovelo fica embaixo
  const alvo: P = [j.boca[0], j.queixo[1] + prop.mao * 0.7];
  const [b, a] = ik2(j.ombro[1], alvo, prop.braco, prop.antebraco, 'baixo');
  // o outro braço solto ao lado do corpo
  return { ...pose, ombro: [4, b + (pose.tronco ?? 0)], cotovelo: [10, a - b], punho: [0, -25], mao: ['solta', 'fechada'], bracoNaFrente: [false, true] };
}

// ------------------------------------------------------------------ andar / correr

function andar(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const h = alturaDe(prop);
  const T = o.ritmo === 'lento' ? 40 : o.ritmo === 'rapido' ? 26 : 32;
  const f = ((t + (o.fase ?? 0)) / T) * TAU;
  const leg = (i: 0 | 1) => {
    const p = f + i * Math.PI;
    const coxa = 22 * Math.sin(p);
    // o joelho dobra quando a perna passa por baixo vindo de trás (balanço)
    const joelho = 6 + 38 * Math.max(0, Math.cos(p + 0.5)) ** 1.6;
    const pe = -10 * Math.max(0, Math.cos(p + 0.2));
    return { coxa, joelho, pe };
  };
  const l0 = leg(0);
  const l1 = leg(1);
  return {
    vista: o.vista ?? 'tres-quartos',
    espelho: o.espelho,
    tronco: 3,
    cabeca: -2 + Math.sin(f * 2) * 1,
    y: -Math.abs(Math.cos(f)) * h * 0.012 + h * 0.006,
    quadril: [l0.coxa, l1.coxa],
    joelho: [l0.joelho, l1.joelho],
    pe: [l0.pe, l1.pe],
    // braço balança contra a perna do mesmo lado
    ombro: [-18 * Math.sin(f), -18 * Math.sin(f + Math.PI)],
    cotovelo: [16 + 8 * Math.max(0, -Math.sin(f)), 16 + 8 * Math.max(0, -Math.sin(f + Math.PI))],
    mao: ['solta', 'solta'],
  };
}

/**
 * Corrida (vista de 3/4 ou perfil), por QUADROS-CHAVE de uma passada de tiro de verdade (rodada 3,
 * painel às cegas: a versão senoidal lia "salto de balé" — perna da frente esticada lá na frente,
 * a de trás na horizontal, braço de bandeja na cintura). Fase u de cada perna (0..1, a outra em
 * u + 0,5):
 *   0,00 contato   — o pé pousa quase embaixo do quadril (nunca esticado lá na frente)
 *   0,10 apoio     — o joelho cede e o corpo está no ponto mais baixo
 *   0,25 impulso   — a perna de trás estica, ~25° pra trás, ponta do pé empurrando
 *   0,45 calcanhar — o calcanhar sobe até perto do glúteo
 *   0,60 joelho    — o joelho vem alto na frente, canela dobrada
 *   0,75–0,90      — a canela abre e "pata" pra trás antes do contato
 * Braço contrário à perna, cotovelo sempre dobrado: na frente a mão chega à altura do queixo
 * (~100°), atrás o cotovelo abre (~55°) e a mão passa ATRÁS do quadril, nunca na frente dele.
 */
type Chave = [number, number];
/** valor periódico por quadros-chave [fase, valor] (fase 0..1, ordenadas), cúbico suave (Catmull-Rom) */
const ciclo = (ks: Chave[], u: number) => {
  const n = ks.length;
  const x = ((u % 1) + 1) % 1;
  let i = n - 1;
  for (let k = 0; k < n; k++) if (ks[k][0] <= x) i = k;
  const k0 = ks[(i - 1 + n) % n];
  const k1 = ks[i];
  const k2 = ks[(i + 1) % n];
  const k3 = ks[(i + 2) % n];
  const span = (((k2[0] - k1[0]) % 1) + 1) % 1 || 1;
  const tt = ((((x - k1[0]) % 1) + 1) % 1) / span;
  const [p0, p1, p2, p3] = [k0[1], k1[1], k2[1], k3[1]];
  const t2 = tt * tt;
  const t3 = t2 * tt;
  return 0.5 * (2 * p1 + (-p0 + p2) * tt + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};
// rodada 4 (painel final: "perna da frente esticada, tronco em pé"): o pé pousa mais embaixo do corpo,
// o joelho da frente sobe mais e a canela só abre perto do contato
const COXA: Chave[] = [[0, 18], [0.1, 4], [0.25, -24], [0.35, -20], [0.45, -4], [0.6, 56], [0.75, 58], [0.9, 32]];
const JOELHO: Chave[] = [[0, 24], [0.1, 40], [0.25, 14], [0.35, 74], [0.45, 120], [0.6, 112], [0.75, 72], [0.9, 32]];
const PE: Chave[] = [[0, 4], [0.1, 0], [0.25, -32], [0.35, -22], [0.45, -14], [0.6, 8], [0.75, 6], [0.9, 6]];
/** quanto o braço do MESMO lado está à frente (1) ou atrás (0): à frente quando a perna dele está no apoio */
const BRACO_FRENTE: Chave[] = [[0, 0.9], [0.1, 1], [0.25, 0.75], [0.45, 0.15], [0.6, 0], [0.75, 0.2], [0.9, 0.6]];

function correr(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const h = alturaDe(prop);
  const rapido = o.ritmo === 'rapido';
  const lento = o.ritmo === 'lento';
  const T = rapido ? 16 : lento ? 24 : 20;
  // amplitude: tiro = passada inteira; corrida normal 80%; trote 62%
  const amp = rapido ? 1 : lento ? 0.62 : 0.8;
  const u0 = (((t + (o.fase ?? 0)) / T) % 1 + 1) % 1;
  const perna = (u: number) => ({
    coxa: ciclo(COXA, u) * amp,
    joelho: Math.max(4, ciclo(JOELHO, u) * (0.55 + 0.45 * amp)),
    pe: ciclo(PE, u) * amp,
  });
  const braco = (u: number) => {
    const f = Math.max(0, Math.min(1, ciclo(BRACO_FRENTE, u)));
    // cotovelo perto de 90° o ciclo todo (atrás 78°, na frente 104°): o braço nunca estica
    return { ombro: lerp(-50, 46, f) * (0.7 + 0.3 * amp), cotovelo: lerp(78, 104, f) };
  };
  // perna 1 (a da frente, lado da câmera) em u0, a de trás em u0 + 0,5; cada braço acompanha a perna do mesmo lado
  const l0 = perna(u0 + 0.5);
  const l1 = perna(u0);
  const a0 = braco(u0 + 0.5);
  const a1 = braco(u0);
  // corpo: no ponto mais baixo no meio do apoio (u = 0,1 de qualquer perna), no alto no voo (0,35 / 0,85)
  const sobe = 0.5 - 0.5 * Math.cos((u0 - 0.1) * 2 * Math.PI * 2);
  const bob = h * (rapido ? 0.022 : 0.016) * amp;
  return {
    vista: o.vista ?? 'tres-quartos',
    espelho: o.espelho,
    tronco: rapido ? 18 : lento ? 8 : 12,
    cabeca: rapido ? -9 : -6,
    y: -bob * sobe,
    quadril: [l0.coxa, l1.coxa],
    joelho: [l0.joelho, l1.joelho],
    pe: [l0.pe, l1.pe],
    ombro: [a0.ombro, a1.ombro],
    cotovelo: [a0.cotovelo, a1.cotovelo],
    mao: ['fechada', 'fechada'],
    // esforço: a boca entreabre no tiro (o estilo lê `fecha` baixo como olho atento; nada de careta)
  };
}

// ------------------------------------------------------------------ saltar (atlético)

/**
 * Salto atlético em ciclo de 42 quadros: prepara (agacha, braços pra TRÁS) → impulso (braços
 * vêm pra frente) → voo (joelhos dobrados, punhos na altura do peito) → pouso (amassa) → volta.
 */
function saltar(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const h = alturaDe(prop);
  const T = 42;
  const k = (((t + (o.fase ?? 0)) % T) + T) % T;
  const vista = o.vista ?? 'tres-quartos';
  const agacha: Pose = { tronco: 26, cabeca: -14, quadril: [48, 52], joelho: [88, 92], pe: [10, 10], ombro: [-48, -40], cotovelo: [12, 14], y: 0, amassa: 0.6 };
  // voo: punhos na frente do PEITO (braço ~20° pra frente, antebraço subindo ~40° acima da horizontal)
  const voo: Pose = { tronco: 6, cabeca: -4, quadril: [40, 52], joelho: [70, 64], pe: [-18, -16], ombro: [20, 28], cotovelo: [116, 120], y: -h * 0.26 };
  const pouso: Pose = { tronco: 16, cabeca: -8, quadril: [30, 34], joelho: [52, 56], pe: [6, 6], ombro: [24, 30], cotovelo: [70, 74], y: 0, amassa: 1 };
  const pe: Pose = parado(t, prop, { vista });
  let p: Pose;
  if (k < 10) p = mix(pe, agacha, ease(k / 10));
  else if (k < 14) p = mix(agacha, voo, ease((k - 10) / 4));
  else if (k < 26) {
    // voo: parábola (sobe e desce), pose de voo segura
    const u = (k - 14) / 12;
    p = { ...voo, y: -h * 0.26 * (1 - (2 * u - 1) ** 2) - h * 0.02 };
  } else if (k < 30) p = mix({ ...voo, y: -h * 0.02 }, pouso, ease((k - 26) / 4));
  else p = mix(pouso, pe, ease((k - 30) / 12));
  return { ...p, vista, espelho: o.espelho, mao: ['fechada', 'fechada'] };
}

// ------------------------------------------------------------------ rosca / alongar / comemorar

/** Rosca bíceps com halter na mão da frente (a outra segura no quadril). Ciclo de 36 quadros. */
function rosca(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const vista = o.vista ?? 'tres-quartos';
  const base = parado(t, prop, { ...o, vista });
  const T = 36;
  const u = 0.5 - 0.5 * Math.cos((((t + (o.fase ?? 0)) % T) / T) * TAU);
  const esforco = u > 0.7 ? (u - 0.7) / 0.3 : 0;
  return {
    ...base,
    vista,
    espelho: o.espelho,
    tronco: -2 - esforco * 2,
    // o cotovelo da frente colado no lado de perto (com ombro positivo a rosca cruzava o peito)
    // no alto o antebraço fica quase em pé NA FRENTE do mesmo ombro (com 140° ele cruzava o peito no 3/4)
    ombro: [4, -5 + u * 11],
    cotovelo: [10, 8 + u * 146],
    punho: [0, -u * 10],
    mao: ['solta', 'segura'],
    fecha: esforco * 0.35,
  };
}

/** Alongamento em pé (braços pra cima, inclina pro lado) — o movimento de quem não corre. */
function alongar(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const base = parado(t, prop, { ...o, vista: o.vista ?? 'frente' });
  const s = Math.sin(t / 24);
  // as mãos se encontram em cima da cabeça (V aberto com riso lia como comemoração)
  // as mãos se ENCONTRAM em cima da cabeça (braço quase em pé, antebraço fechando pra dentro): com as
  // mãos afastadas o painel leu comemoração; inclinação lateral calma
  return { ...base, tronco: s * 8, cabeca: s * 4, ombro: [-172 + s * 4, 172 + s * 4], cotovelo: [-46, 46], punho: [-20, 20], mao: ['aberta', 'aberta'], fecha: 0.6 };
}

/** Comemorar: braços pra cima e um pulinho curto. NÃO usar onde o tema veta euforia (pré-treino). */
function comemorar(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const h = alturaDe(prop);
  const base = parado(t, prop, { ...o, vista: o.vista ?? 'frente' });
  const hop = Math.max(0, Math.sin(t / 4.5)) * h * 0.035;
  return { ...base, y: -hop, ombro: [-150, 150], cotovelo: [-20 + Math.sin(t / 3) * 8, 20 - Math.sin(t / 3) * 8], mao: ['aberta', 'aberta'] };
}

// ------------------------------------------------------------------ beber / tocar o rosto (IK)

/** Beber: a mão da frente leva o copo até a boca e volta (ciclo de 60 quadros, 2 goles). */
function beber(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const vista = o.vista ?? 'tres-quartos';
  const base = parado(t, prop, { ...o, vista });
  const T = 60;
  const k = (((t + (o.fase ?? 0)) % T) + T) % T;
  // 0–14 sobe, 14–40 bebe (cabeça inclina pra trás), 40–56 desce, 56–60 parado embaixo
  const u = k < 14 ? ease(k / 14) : k < 40 ? 1 : k < 56 ? 1 - ease((k - 40) / 16) : 0;
  const pose: Pose = { ...base, vista, cabeca: -u * 12, tronco: -u * 2 };
  const j = fk(prop, pose);
  // o punho fica à frente e abaixo da boca: o copo (na mão) é que encosta nela
  const boca: P = [j.boca[0] + prop.mao * 0.5, j.boca[1] + prop.mao * 0.55];
  const baixo: P = ao(j.ombro[1], 18, prop.braco + prop.antebraco * 0.75);
  const alvo: P = [lerp(baixo[0], boca[0], u), lerp(baixo[1], boca[1], u)];
  const tr = pose.tronco ?? 0;
  // cotovelo EMBAIXO (com 'mais-x' ele subia até o ombro e o gole virava brinde)
  const [b, a] = ik2(j.ombro[1], alvo, prop.braco, prop.antebraco, 'baixo');
  return { ...pose, ombro: [base.ombro![0], b + tr], cotovelo: [base.cotovelo![0], a - b], punho: [0, -50 * u - 10], mao: ['solta', 'segura'], bracoNaFrente: [false, u > 0.3] };
}

/**
 * Tocar o rosto (o dedo que aperta a pele e ela cede — o detalhe que o André elogiou no
 * colágeno). Ciclo de 48 quadros: a mão sobe, o indicador encosta na bochecha, aperta 2 vezes
 * (a pele afunda e volta; mais fundo nos quadros 18 e 31), a mão desce. A força sai em
 * `Pose.aperto` e a ponta do dedo (`j.dedos[1]`, punho reto) cai EXATAMENTE na bochecha: 5% da
 * cabeça fora com o dedo parado, 3% pra dentro no fundo do aperto, na direção do centro da cabeça.
 */
function tocarRosto(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const vista = o.vista ?? 'frente';
  const base = parado(t, prop, { ...o, vista });
  const T = 48;
  const k = (((t + (o.fase ?? 0)) % T) + T) % T;
  const sobe = k < 10 ? ease(k / 10) : k < 40 ? 1 : 1 - ease((k - 40) / 8);
  // dois apertos (fundo nos quadros ~18 e ~31)
  const aperto = k >= 12 && k < 38 ? Math.abs(Math.sin(((k - 12) / 13) * Math.PI)) : 0;
  // a marca que FICA: depois de cada fundo, o rubor some em ~10 quadros (o painel: o aperto "piscava")
  const marca = Math.max(aperto * 0.85, ...[18.5, 31.5].map((pk) => (k >= pk && k < 46 ? 0.75 * Math.exp(-(k - pk) / 10) : 0)));
  const pose: Pose = { ...base, vista, cabeca: -3 - aperto * 2 };
  const j = fk(prop, pose);
  const bo = j.bochecha;
  // pra fora = do centro da cabeça pra bochecha (de frente, pra +x; de 3/4, a bochecha que vem
  // pra câmera fica no meio do rosto: o "fora" é pra câmera, que no 2D é ficar em cima do ponto)
  const nx = bo[0] - j.cabeca[0];
  const ny = bo[1] - j.cabeca[1];
  const nn = Math.hypot(nx, ny) || 1;
  const borda = vista === 'frente' ? 1 : 0.35;
  const fora = prop.cabecaLarg * (0.05 - 0.08 * aperto) * borda;
  const alvo: P = [bo[0] + (nx / nn) * fora, bo[1] + (ny / nn) * fora];
  // A pose do braço NO ROSTO (sobe = 1) e a de repouso; o caminho entre as duas interpola os
  // ÂNGULOS (o IK de um alvo intermediário trocava de solução no meio e o cotovelo balançava).
  let ombroAbs: number;
  let anteAbs: number;
  let dobra = 0;
  const encFim = vista === 'frente' ? 0.55 : 1;
  if (vista === 'frente') {
    // De frente: o braço aponta pra câmera (escorço 0,55), o cotovelo fica um pouco pra fora e
    // abaixo do ombro, o PUNHO abaixo e pra fora da bochecha e a mão dobra pra cima até ela. Sem o
    // escorço, o cotovelo só tinha como subir acima do ombro.
    const inc = 32 * (Math.PI / 180);
    const punhoAlvo: P = [alvo[0] + Math.sin(inc) * prop.mao, alvo[1] + Math.cos(inc) * prop.mao];
    [ombroAbs, anteAbs] = ik2(j.ombro[1], punhoAlvo, prop.braco * encFim, prop.antebraco, 'mais-x');
    const punhoP: P = ao(ao(j.ombro[1], ombroAbs, prop.braco * encFim), anteAbs, prop.antebraco);
    dobra = angDe(punhoP, alvo) - anteAbs;
  } else {
    // De 3/4: a mão da frente (lado −x) cruza o peito com o cotovelo embaixo; punho reto, IK até a
    // ponta do dedo (antebraço + mão inteira viram um osso só, j.dedos cai na bochecha)
    [ombroAbs, anteAbs] = ik2(j.ombro[1], alvo, prop.braco, prop.antebraco + prop.mao, 'baixo');
  }
  const tr = pose.tronco ?? 0;
  const perto = (de: number, para: number) => de + ((((para - de + 180) % 360) + 360) % 360) - 180;
  const ombroFim = perto(base.ombro![1], ombroAbs + tr);
  const cotFim = perto(base.cotovelo![1], anteAbs - ombroAbs);
  const punhoFim = perto(base.punho?.[1] ?? 0, dobra);
  return {
    ...pose,
    ombro: [base.ombro![0], lerp(base.ombro![1], ombroFim, sobe)],
    cotovelo: [base.cotovelo![0], lerp(base.cotovelo![1], cotFim, sobe)],
    punho: [base.punho?.[0] ?? 0, lerp(base.punho?.[1] ?? 0, punhoFim, sobe)],
    encurta: [1, lerp(1, encFim, sobe)],
    // o indicador só estica quando a mão já está no rosto (no meio do caminho, dedo em riste
    // com o dorso pra câmera lê como gesto feio)
    mao: ['solta', sobe > 0.9 ? 'aponta' : 'solta'],
    bracoNaFrente: [false, sobe > 0.2],
    aperto: sobe > 0.9 ? aperto : 0,
    marca: sobe > 0.5 ? marca : 0,
  };
}

// ------------------------------------------------------------------ util

function mix(a: Pose, b: Pose, k: number): Pose {
  const n = (x?: number, y?: number) => lerp(x ?? 0, y ?? 0, k);
  const par = (x?: [number, number], y?: [number, number]): [number, number] => [n(x?.[0], y?.[0]), n(x?.[1], y?.[1])];
  return {
    ...b,
    tronco: n(a.tronco, b.tronco),
    cabeca: n(a.cabeca, b.cabeca),
    ombro: par(a.ombro, b.ombro),
    cotovelo: par(a.cotovelo, b.cotovelo),
    punho: par(a.punho, b.punho),
    quadril: par(a.quadril, b.quadril),
    joelho: par(a.joelho, b.joelho),
    pe: par(a.pe, b.pe),
    y: n(a.y, b.y),
    amassa: n(a.amassa, b.amassa),
  };
}

const TABELA: Record<Acao, (t: number, prop: Proporcao, o: PoseOpts) => Pose> = {
  parado,
  andar,
  correr,
  saltar,
  rosca,
  beber,
  tocarRosto,
  acenar,
  alongar,
  comemorar,
  pensar,
};

/** A pose da ação no quadro `t`. */
export const poseDe = (acao: Acao, t: number, prop: Proporcao, o: PoseOpts = {}): Pose => {
  const p = TABELA[acao](t, prop, o);
  return o.espelho != null ? { ...p, espelho: o.espelho } : p;
};

/** Mão: o que cada ação segura (o estilo desenha a peça na mão `segura`). */
export const SEGURA: Partial<Record<Acao, 'halter' | 'copo'>> = { rosca: 'halter', beber: 'copo' };

export type { Mao };
// acima é reexportado pra quem precisa calcular pontos no corpo (setas de rótulo, lente)
export { acima };
