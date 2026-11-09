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
  // 3/4 e perfil: o braço da frente um pouco à frente, o de trás atrás; peso numa perna
  return { vista, ...v, ombro: [-6, 6], cotovelo: [10, 14], quadril: [-3, 4], joelho: [4, 0], mao: ['solta', 'solta'] };
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
  // o punho logo abaixo do queixo, o nó dos dedos no queixo
  const alvo: P = [j.boca[0] + prop.cabecaLarg * 0.25, j.queixo[1] + prop.mao * 0.6];
  const [b, a] = ik2(j.ombro[1], alvo, prop.braco, prop.antebraco, 'mais-x');
  // o outro braço cruza o peito (segura o cotovelo)
  return { ...pose, ombro: [12, b + (pose.tronco ?? 0)], cotovelo: [70, a - b], punho: [0, -20], mao: ['solta', 'fechada'], bracoNaFrente: [false, true] };
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
 * Corrida (vista de 3/4 ou perfil). Ciclo clássico: contato → apoio (o joelho de apoio dobra,
 * o corpo desce) → impulso (perna de trás estica) → voo (os dois pés no ar, o corpo no alto).
 * O calcanhar da perna que volta sobe até perto do glúteo; braço a ~90°, contra a perna.
 */
function correr(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const h = alturaDe(prop);
  const rapido = o.ritmo === 'rapido';
  const T = rapido ? 15 : o.ritmo === 'lento' ? 22 : 18;
  const f = ((t + (o.fase ?? 0)) / T) * TAU;
  const leg = (i: 0 | 1) => {
    const p = f + i * Math.PI;
    const amp = rapido ? 44 : 36;
    const coxa = amp * Math.sin(p) + 6;
    // balanço: dobra muito logo antes de passar por baixo (calcanhar no glúteo)
    const balanco = (rapido ? 112 : 96) * Math.max(0, Math.cos(p + 0.45)) ** 1.35;
    // apoio: dobra um pouco no meio (amortece)
    const apoio = 24 * Math.max(0, -Math.cos(p)) ** 2;
    const joelho = 10 + balanco + apoio;
    // pé: ponta caída no balanço, plano no apoio
    const pe = -22 * Math.max(0, Math.cos(p + 0.2)) + 6 * Math.max(0, -Math.cos(p));
    return { coxa, joelho, pe };
  };
  const l0 = leg(0);
  const l1 = leg(1);
  const arm = (i: 0 | 1) => {
    const p = f + i * Math.PI;
    // braço do lado i vai pra frente quando a perna i vai pra trás
    const ombro = -(rapido ? 50 : 40) * Math.sin(p) + 8;
    const cotovelo = 82 + 18 * Math.max(0, -Math.sin(p));
    return { ombro, cotovelo };
  };
  const a0 = arm(0);
  const a1 = arm(1);
  // corpo: mais baixo no apoio (sin(p)≈0 com a perna de apoio embaixo), no alto no voo
  const bob = (Math.cos(2 * f) * 0.5 + 0.5) * (rapido ? 0.03 : 0.024);
  return {
    vista: o.vista ?? 'tres-quartos',
    espelho: o.espelho,
    tronco: rapido ? 13 : 9,
    cabeca: rapido ? -8 : -6,
    y: -h * (rapido ? 0.03 : 0.024) + h * bob,
    quadril: [l0.coxa, l1.coxa],
    joelho: [l0.joelho, l1.joelho],
    pe: [l0.pe, l1.pe],
    ombro: [a0.ombro, a1.ombro],
    cotovelo: [a0.cotovelo, a1.cotovelo],
    mao: ['fechada', 'fechada'],
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
    ombro: [-4, 6 + u * 10],
    cotovelo: [12, 8 + u * 132],
    punho: [0, -u * 10],
    mao: ['solta', 'segura'],
    fecha: esforco * 0.35,
  };
}

/** Alongamento em pé (braços pra cima, inclina pro lado) — o movimento de quem não corre. */
function alongar(t: number, prop: Proporcao, o: PoseOpts): Pose {
  const base = parado(t, prop, { ...o, vista: o.vista ?? 'frente' });
  const s = Math.sin(t / 24);
  return { ...base, tronco: s * 9, cabeca: s * 4, ombro: [-168 + s * 6, 168 + s * 6], cotovelo: [18, -18], mao: ['aberta', 'aberta'], fecha: 0.6 };
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
  const [b, a] = ik2(j.ombro[1], alvo, prop.braco, prop.antebraco, 'mais-x');
  return { ...pose, ombro: [base.ombro![0], b + tr], cotovelo: [base.cotovelo![0], a - b], punho: [0, -50 * u - 10], mao: ['solta', 'segura'], bracoNaFrente: [false, u > 0.3] };
}

/**
 * Tocar o rosto (o dedo que aperta a pele e ela cede — o detalhe que o André elogiou no
 * colágeno). Ciclo de 48 quadros: a mão sobe, o indicador encosta na bochecha, aperta 2 vezes
 * (a pele afunda e volta), a mão desce. `toque` (0..1) sai em `fecha`? Não: o estilo lê a
 * força do aperto pela distância do dedo ao ponto da bochecha (`pontoBochecha`).
 */
function tocarRosto(t: number, prop: Proporcao, o: PoseOpts): Pose {
  // de 3/4: de frente o cotovelo teria que vir pra câmera (o 2D não encurta osso)
  const vista = o.vista ?? 'tres-quartos';
  const base = parado(t, prop, { ...o, vista });
  const T = 48;
  const k = (((t + (o.fase ?? 0)) % T) + T) % T;
  const sobe = k < 10 ? ease(k / 10) : k < 40 ? 1 : 1 - ease((k - 40) / 8);
  const aperto = k >= 12 && k < 38 ? Math.max(0, Math.sin(((k - 12) / 13) * Math.PI)) : 0;
  const pose: Pose = { ...base, vista, cabeca: -3 - aperto * 2 };
  const j = fk(prop, pose);
  const alvoBochecha = j.bochecha;
  // o dedo para 5% da cabeça FORA da bochecha e entra até 3% quando aperta
  const fora = prop.cabecaLarg * (0.05 - 0.08 * aperto);
  const alvo: P = [alvoBochecha[0] + fora, alvoBochecha[1] + prop.cabeca * 0.02];
  const baixo: P = ao(j.ombro[1], 8, prop.braco + prop.antebraco + prop.mao * 0.6);
  const meta: P = [lerp(baixo[0], alvo[0], sobe), lerp(baixo[1], alvo[1], sobe)];
  // IK até a PONTA do dedo: o antebraço + a mão viram um osso só (punho reto)
  const [b, a] = ik2(j.ombro[1], meta, prop.braco, prop.antebraco + prop.mao * 0.85, 'mais-x');
  return { ...pose, ombro: [base.ombro![0], b + (pose.tronco ?? 0)], cotovelo: [base.cotovelo![0], a - b], punho: [base.punho?.[0] ?? 0, 0], mao: ['solta', sobe > 0.6 ? 'aponta' : 'solta'], bracoNaFrente: [false, sobe > 0.2] };
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
