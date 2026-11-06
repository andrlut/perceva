// O motor do tutorial: transforma as batidas do roteiro (deixas da fala) em
// quadros — o estado da tela (pelo comportamento da réplica, igual ao app),
// a câmera, o destaque, o dedo e a etiqueta. Tudo puro em função do quadro:
// o Remotion pode renderizar qualquer quadro fora de ordem.
import { FPS, cue, speechEnd } from '../timeline';
import type { Rect } from './ui';
import { Cam, HAND_ANGLE, Stage, focusCam, handBoxes, lerp, lerpCam, progress, project, projectRect, wideCam } from './overlays';
import { AnyScreen, HISTORY_START, Snap, SwipeMotion, matchKey, stateAt, swipeFrames, swipeMotion } from './screens/types';
import type { Action, Beat, CameraSpec, TourScene, TourSpec } from './spec';

/** Tempos em quadros (30 fps). */
export const TIME = {
  /** a câmera leva isto pra chegar no alvo */
  CAM: 20,
  /** o destaque leva isto pra trocar de alvo (o novo abre na 1ª metade, o velho fecha na 2ª) */
  SPOT: 14,
  /** câmera e destaque chegam isto ANTES do toque */
  LEAD: 3,
  /** o dedo viaja de um alvo pro outro (quando espera entre dois gestos) */
  TRAVEL: 16,
  /** a mão que (re)aparece acende e anda HAND.ENTRY nisto */
  ENTRY: 12,
  /** o app reage isto depois do toque */
  EFFECT: 3,
  /** segurar dura isto (o menu de segurar do RN abre em ~0,5 s) */
  HOLD: 26,
  /** o arrasto APERTADO (1:1 com o conteúdo); a inércia vem depois (SWIPE) */
  DRAG: 14,
  /** o dedo espera parado até a próxima ação se ela vier antes disto; senão sai */
  LINGER: 50,
  /** o toque pôs outra coisa debaixo do dedo (TimedPatch.lift: um modal abriu ou fechou ali, o
   *  Mirar tirou o cartão): a mão, o disco e a onda apagam nisto, a partir de 2 quadros depois do
   *  toque — somem em T+8, antes de o texto do que entrou aparecer e antes de a loja reaparecer */
  LEAVE: 6,
  /** apontar: quando não segue pra outro gesto, a mão apaga NO LUGAR nisto, terminando antes de a
   *  câmera ou o destaque saírem (parada na tela com a câmera abrindo, ela caía em outro botão) */
  POINT_OUT: 8,
  /** depois de soltar o arrasto, a mão segue no embalo e apaga nisto (nunca estaciona) */
  LIFT_OFF: 8,
  /** o título do topo: o velho sai nisto e só então o novo entra (nunca dois títulos juntos) */
  TITLE_OUT: 5,
  TITLE_IN: 7,
} as const;

/**
 * O arrasto (screens/types.ts → swipeProgress): o conteúdo anda EXATAMENTE o que o dedo anda
 * enquanto ele aperta (78% do caminho, em TIME.DRAG quadros), e o resto é inércia curta depois que
 * solta, com a velocidade da soltura. A rolagem da tela e o dedo leem a mesma conta.
 */
export const SWIPE: SwipeMotion = swipeMotion(TIME.DRAG, 0.78, 1.0);

/**
 * A régua da mão, em px do vídeo (1080 de largura):
 * - `CLEAR`: a ponta parada (esperando, estacionada) e o dedo APERTADO no arrasto ficam pelo menos
 *   isto longe de qualquer controle tocável (`ScreenModule.controls`). Mão parada em cima ou ao lado
 *   de um botão lê como "vai tocar aqui"; o arrasto que aperta perto do Resgatar lê como um toque.
 * - `TRANSIT`: andando, a ponta nunca passa a menos disto de um controle que não é o dela (o alvo de
 *   onde vem ou pra onde vai) — o caminho é planejado contra os controles, não é linha reta às cegas.
 * - `ENTRY`: quando (re)aparece, a mão anda só isto, acendendo, já DENTRO do palco e perto do
 *   primeiro alvo. Ela nunca vem de fora (atravessava a legenda vinda de baixo).
 * - `EXIT`: quando não espera a próxima ação, depois do toque ela volta isto pelo lado de onde veio,
 *   apagando (em vez de estacionar ao lado do que tocou).
 * - `ZONE_PAD`: folga da mão inteira até a borda do palco (a sombra dela). O palco é o único lugar
 *   da mão: ela nunca entra na faixa da legenda nem no cabeçalho.
 */
export const HAND = { CLEAR: 60, TRANSIT: 24, ENTRY: 150, EXIT: 90, ZONE_PAD: 6 } as const;
/** o salto máximo (px) de um alvo entre dois quadros sem que a tela tenha rolado: acima disso é corte */
const JUMP_MAX = 60;
/** o embalo depois de soltar o arrasto: a mão freia nisto (quadros, decaimento exponencial) */
const FT_TAU = 1.2;

type Ev = { frame: number; order: number; line: number; beat: Beat };
type FocusKey = { start: number; land: number; target: string | null; pulse: boolean; tone: 'violet' | 'gold' };
type CamKey = { start: number; land: number; mode: CameraSpec; target: string | null };

/**
 * Como a mão chega (px do vídeo, relativos à ponta): `angle` inclina a mão, `approach` é de
 * onde ela vem, `park` é pra onde ela sai depois do toque. `up` = em pé, vindo de baixo
 * (o padrão). `side` = deitada, vindo da direita: o motor escolhe sozinho quando, vinda de
 * baixo, ela cobriria o que o destaque mostra além do botão tocado (ex.: tocar no + com a
 * quantidade E o total destacados — de baixo, a mão senta em cima do total que acabou de mudar).
 * Deitada, ela fica toda acima da ponta + ~100 px, e chega e sai na horizontal.
 */
type HandPose = { name: 'up' | 'side'; angle: number; approach: { x: number; y: number }; park: { x: number; y: number } };
const HANDS: Record<HandPose['name'], HandPose> = {
  up: { name: 'up', angle: HAND_ANGLE, approach: { x: 230, y: 360 }, park: { x: 150, y: 40 } },
  side: { name: 'side', angle: -62, approach: { x: 420, y: 20 }, park: { x: 160, y: 10 } },
};

type Pt = { x: number; y: number };
type Drag = {
  /** o ponto do CONTEÚDO debaixo do dedo (dp da tela no quadro do contato): o dedo fica nele até soltar */
  P: Pt;
  /** contato e soltura, em px do vídeo */
  from: Pt;
  to: Pt;
  /** -1 = o dedo sobe (a lista desce no conteúdo), 1 = desce */
  dir: number;
  /** a rolagem no contato */
  s0: number;
  /** o embalo depois de soltar (px) */
  ft: number;
};
type ActKey = {
  type: Action;
  target: string;
  /** o alvo do destaque quando a ação acontece (pra mão não cobri-lo) */
  focus: string | null;
  T: number;
  arrive: number;
  travelStart: number;
  end: number;
  pose: HandPose;
  /** o arrasto: contato num ponto neutro do conteúdo, o dedo preso nele até soltar ("o arrasto", na seção do dedo) */
  swipe?: Drag;
  /** pra onde a ponta vai depois do gesto, se espera a próxima ação (px, somado ao ponto do gesto) */
  park: Pt;
  /** o toque põe outra coisa debaixo do dedo (TimedPatch.lift): a mão não fica em cima do que entrou */
  lifts: boolean;
  /** apontar: o quadro em que a mão termina de apagar no lugar (antes da câmera/destaque andarem) */
  leaveAt: number;
  /** a viagem desde o gesto anterior (mão esperando): desvio da curva, em px (0 = reta) */
  bend: number;
  /** o planejador desistiu de esperar (nenhum caminho limpo até o próximo gesto): sai e reentra */
  noLinger?: boolean;
};

const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
/** distância (px) de um ponto até um retângulo (0 dentro dele) */
const rectDist = (p: Pt, r: Rect) => Math.hypot(Math.max(r.x - p.x, 0, p.x - (r.x + r.w)), Math.max(r.y - p.y, 0, p.y - (r.y + r.h)));
const sameRect = (a: Rect, b: Rect) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.w - b.w) < 1 && Math.abs(a.h - b.h) < 1;
/** a caixa que a mão ocupa em volta da ponta, por pose (px relativos à ponta) */
const extentOf = (angle: number) => {
  const bs = handBoxes(0, 0, angle);
  return { l: Math.min(...bs.map((b) => b.x)), r: Math.max(...bs.map((b) => b.x + b.w)), t: Math.min(...bs.map((b) => b.y)), b: Math.max(...bs.map((b) => b.y + b.h)) };
};
const bezier = (a: Pt, b: Pt, bend: number, t: number): Pt => {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const c = { x: (a.x + b.x) / 2 + (-(b.y - a.y) / len) * bend, y: (a.y + b.y) / 2 + ((b.x - a.x) / len) * bend };
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
};

/** O que o audit do movimento encontrou (ver `plan.audit`): cada item é um quadro que quebra uma regra. */
export type MotionIssue = {
  frame: number;
  to?: number;
  rule: 'stage' | 'rest' | 'contact' | 'pop' | 'title' | 'path' | 'ring' | 'drag' | 'jump';
  what: string;
};
type CalloutKey = { start: number; end: number; text: string; target: string };

export type FingerState = {
  x: number;
  y: number;
  opacity: number;
  press: number;
  ripple: number | null;
  /** a onda fica no ponto do contato, mesmo com a mão já levantando */
  rippleAt?: { x: number; y: number };
  hold: number | null;
  /** inclinação da mão (graus) — ver HANDS */
  angle: number;
  /** arrastando: o rastro vai deste ponto até a ponta (o arrasto não tem onda nem disco de toque) */
  trail?: Pt | null;
};
/**
 * Um anel do destaque, sempre EM CIMA do alvo dele (`target`): `hole` é o quanto o buraco no véu está
 * aberto (0..1), `ring` a opacidade do anel. Trocar de alvo nunca estica nem desliza o anel pela tela
 * (de passagem ele emoldurava chips, títulos e o calendário): o novo abre no alvo novo e o velho
 * fecha no alvo velho (ver evalSpot).
 */
export type SpotLayer = { target: string; rect: Rect; hole: number; ring: number; pulse: number | null; tone: 'violet' | 'gold'; lostAt: number | null };
export type SpotState = { dim: number; layers: SpotLayer[] };

export const beatFrame = (s: TourScene, b: Beat) => {
  const local = b.at === '@start' ? 0 : b.at === '@end' ? speechEnd(s) : cue(s, b.at);
  return s.start + local + Math.round((b.after ?? 0) * FPS);
};

const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const ramp = (f: number, a: number, b: number) => progress(f, a, b, (t) => t);

export const buildPlan = (spec: TourSpec, scenes: TourScene[], mod: AnyScreen, stage: Stage) => {
  const ctx = mod.makeCtx({ fixture: spec.fixture, lang: spec.lang });
  const d = mod.device;

  // ---------------------------------------------------------------- eventos
  const events: Ev[] = [];
  scenes.forEach((s, li) => (s.beats ?? []).forEach((b, bi) => events.push({ frame: beatFrame(s, b), order: li * 100 + bi, line: li, beat: b })));
  events.sort((a, b) => a.frame - b.frame || a.order - b.order);
  const where = (e: Ev) => `fala "${scenes[e.line].id}", batida em "${e.beat.at}"`;

  // ---------------------------------------------------------------- estado (simulação pelo comportamento da tela)
  let state = mod.initial(ctx, spec.state ?? {});
  const history: Snap<unknown>[] = [{ frame: HISTORY_START, state }];
  const pending: { frame: number; patch: Record<string, unknown> }[] = [];
  const push = (frame: number, patch: Record<string, unknown>) => {
    pending.push({ frame, patch });
    pending.sort((a, b) => a.frame - b.frame);
  };
  const flush = (upto: number) => {
    while (pending.length && pending[0].frame <= upto) {
      const p = pending.shift()!;
      state = { ...(state as object), ...p.patch };
      history.push({ frame: p.frame, state });
    }
  };
  /** os toques que põem outra coisa debaixo do dedo (TimedPatch.lift) */
  const lifting = new Set<Ev>();
  for (const ev of events) {
    const b = ev.beat;
    flush(ev.frame);
    if (b.set) push(ev.frame, b.set);
    flush(ev.frame);
    if (b.scroll !== undefined) {
      const scrollTo = typeof b.scroll === 'number' ? b.scroll : mod.scrollFor(b.scroll, state, ctx);
      // com dedo, a rolagem anda na conta do arrasto (1:1 + inércia); sem, na SCROLL_EASE
      push(ev.frame, { scroll: scrollTo, scrollMotion: b.do === 'swipe' ? SWIPE : null });
    }
    if (b.do === 'tap' || b.do === 'hold') {
      const target = b.target ?? b.focus;
      if (!target) throw new Error(`${where(ev)}: "${b.do}" sem alvo`);
      const fx = b.do === 'tap' ? mod.tap(target, state, ctx) : mod.hold?.(target, state, ctx) ?? null;
      if (!fx) throw new Error(`${where(ev)}: ${b.do} em "${target}" não faz nada no app neste estado — use "point" ou mude a ordem`);
      const base = ev.frame + (b.do === 'tap' ? TIME.EFFECT : TIME.HOLD);
      for (const p of fx) push(base + (p.delay ?? 0), p.patch as Record<string, unknown>);
      if (b.do === 'tap' && fx.some((p) => p.lift)) lifting.add(ev);
    }
  }
  flush(Infinity);

  // ---------------------------------------------------------------- layout por quadro (memo)
  const layouts = new Map<number, { targets: Record<string, Rect>; scroll?: number }>();
  const layoutAt = (f: number) => {
    const key = Math.round(f);
    let L = layouts.get(key);
    if (!L) {
      const v = mod.view(history, key);
      L = mod.layout(stateAt(history, key), v, ctx, history, key) as { targets: Record<string, Rect>; scroll?: number };
      layouts.set(key, L);
    }
    return L;
  };
  const rectAt = (target: string, f: number): Rect | undefined => layoutAt(f).targets[target];
  /** O alvo some quando a tela muda (Mirar tira o cartão da grade): o último retângulo
   *  visto e o quadro em que sumiu, pra o destaque sair em fade em vez de quebrar. */
  const rectSeen = (target: string, f: number): { rect: Rect; lostAt: number | null } | undefined => {
    const r = rectAt(target, f);
    if (r) return { rect: r, lostAt: null };
    for (let g = Math.round(f) - 1; g >= f - 120; g--) {
      const q = rectAt(target, g);
      if (q) return { rect: q, lostAt: g + 1 };
    }
    return undefined;
  };
  /** O alvo ainda vai aparecer (a meta só entra no topo depois que o cartão mirado apaga):
   *  onde ele entra, pra a câmera já sair rumo a ele em vez de abrir pra tela inteira. */
  const rectSoon = (target: string, f: number): { rect: Rect; lostAt: null } | undefined => {
    for (let g = Math.round(f) + 1; g <= f + 60; g++) {
      const q = rectAt(target, g);
      if (q) return { rect: q, lostAt: null };
    }
    return undefined;
  };
  const scrollOf = (f: number) => layoutAt(f).scroll ?? ((stateAt(history, f) as { scroll?: number }).scroll ?? 0);

  // ---------------------------------------------------------------- trilhas: destaque, câmera, dedo, etiqueta
  const focusKeys: FocusKey[] = [];
  const camKeys: CamKey[] = [];
  const callKeys: CalloutKey[] = [];
  const actions: ActKey[] = [];
  let curFocus: string | null = null;
  let prevSpotLand = -Infinity;
  let prevCamStart = -Infinity;
  for (const ev of events) {
    const b = ev.beat;
    const acted = !!b.do;
    if (b.focus !== undefined) {
      let start = acted ? ev.frame - TIME.LEAD - TIME.SPOT : ev.frame - 4;
      start = Math.max(start, prevSpotLand);
      const land = Math.max(start + 6, acted ? ev.frame - TIME.LEAD : start + TIME.SPOT);
      focusKeys.push({ start, land, target: b.focus, pulse: !!b.pulse, tone: b.tone ?? 'violet' });
      prevSpotLand = land;
      curFocus = b.focus;
    }
    if (b.camera !== undefined || b.focus !== undefined) {
      const mode: CameraSpec = b.camera ?? (b.focus === null ? 'hold' : 'focus');
      if (mode !== 'hold') {
        const target = b.focus !== undefined ? b.focus : curFocus;
        if (mode !== 'wide' && !target) throw new Error(`${where(ev)}: câmera "${mode}" sem alvo de destaque`);
        let start = acted ? ev.frame - TIME.LEAD - TIME.CAM : ev.frame - 6;
        start = Math.max(start, prevCamStart + 2);
        const land = Math.max(start + 8, acted ? ev.frame - TIME.LEAD : start + TIME.CAM);
        camKeys.push({ start, land, mode, target });
        prevCamStart = start;
      }
    }
    if (b.callout !== undefined) {
      const start = b.focus !== undefined ? focusKeys[focusKeys.length - 1].land : ev.frame;
      if (callKeys.length) callKeys[callKeys.length - 1].end = Math.min(callKeys[callKeys.length - 1].end, start);
      if (b.callout) {
        const target = b.focus ?? curFocus;
        if (!target) throw new Error(`${where(ev)}: etiqueta sem alvo`);
        callKeys.push({ start, end: Infinity, text: b.callout, target });
      }
    } else if (b.focus !== undefined && callKeys.length) {
      // o destaque mudou de alvo: a etiqueta do alvo anterior sai
      const last = callKeys[callKeys.length - 1];
      if (last.end === Infinity && last.target !== b.focus) last.end = focusKeys[focusKeys.length - 1].start;
    }
    if (b.do) {
      const target = b.target ?? b.focus ?? curFocus ?? (b.do === 'swipe' ? 'screen' : null);
      if (!target) throw new Error(`${where(ev)}: "${b.do}" sem alvo`);
      const T = ev.frame;
      // o arrasto não espera no ponto de contato: a mão encosta e o conteúdo já sai junto com ela
      const arrive = b.do === 'swipe' ? T : T - 2;
      const prev = actions[actions.length - 1];
      const travelStart = Math.max(arrive - TIME.TRAVEL, prev ? Math.min(prev.end, arrive - 6) + 2 : -Infinity);
      const end = b.do === 'tap' ? T + 6 : b.do === 'hold' ? T + TIME.HOLD : b.do === 'swipe' ? T + TIME.DRAG : Infinity;
      const pose = HANDS.up;
      actions.push({
        type: b.do,
        target,
        focus: b.focus !== undefined ? b.focus : curFocus,
        T,
        arrive,
        travelStart,
        end,
        pose,
        park: pose.park,
        lifts: lifting.has(ev),
        leaveAt: Infinity,
        bend: 0,
      });
    }
  }
  // "point" fica até a próxima mudança de destaque ou a próxima ação
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.end !== Infinity) continue;
    const nextFocus = focusKeys.find((k) => k.start > a.T && k.target !== a.target)?.start ?? Infinity;
    const next = actions[i + 1];
    a.end = Math.min(nextFocus, next?.travelStart ?? Infinity);
    // o destaque saiu do alvo apontado: a mão parte já pro próximo gesto (esperando, ela ficava
    // apontando o Desfazer com o anel já no Aproveita!, parada em cima de um controle)
    if (next && a.end < next.travelStart) next.travelStart = Math.max(a.end, next.arrive - 2 * TIME.TRAVEL);
  }

  // ---------------------------------------------------------------- câmera
  const camMemo = new Map<string, Cam>();
  const camForKey = (k: CamKey, f: number): Cam => {
    if (k.mode === 'wide' || !k.target) return wideCam(stage);
    const seen = rectSeen(k.target, f) ?? rectSoon(k.target, f);
    if (!seen) return wideCam(stage);
    return focusCam(stage, seen.rect, typeof k.mode === 'number' ? k.mode : undefined);
  };
  const evalCam = (i: number, f: number): Cam => {
    if (i < 0) return wideCam(stage);
    const memo = `${i}:${Math.round(f)}`;
    const hit = camMemo.get(memo);
    if (hit) return hit;
    const k = camKeys[i];
    const target = camForKey(k, f);
    const out = f >= k.land ? target : lerpCam(evalCam(i - 1, k.start), target, progress(f, k.start, k.land));
    camMemo.set(memo, out);
    return out;
  };
  const camAt = (f: number): Cam => {
    let i = -1;
    for (let j = 0; j < camKeys.length; j++) if (camKeys[j].start <= f) i = j;
    return evalCam(i, f);
  };
  const unproject = (cam: Cam, p: Pt): Pt => ({ x: cam.cx + (p.x - stage.x - stage.w / 2) / cam.k, y: cam.cy + (p.y - stage.y - stage.h / 2) / cam.k });

  // ---------------------------------------------------------------- pose da mão
  // A mão pode cobrir o entorno do que toca (até um tamanho do alvo pra cada lado), mas não o
  // resto do destaque — é o que a fala manda olhar. Se em pé ela cobre o destaque e deitada
  // cobre bem menos (< 1/4), ela entra deitada.
  const SPOT_PAD = 6; // o respiro do Spotlight, em dp
  const covered = (pose: HandPose, a: ActKey) => {
    if (!a.focus || a.focus === a.target) return 0;
    const f = rectAt(a.focus, a.T);
    const t = rectAt(a.target, a.T);
    if (!f || !t) return 0;
    const cam = camAt(a.T);
    const fr = projectRect(stage, cam, { x: f.x - SPOT_PAD, y: f.y - SPOT_PAD, w: f.w + SPOT_PAD * 2, h: f.h + SPOT_PAD * 2 });
    const tr = projectRect(stage, cam, t);
    const nx = Math.max(fr.x, tr.x - tr.w);
    const ny = Math.max(fr.y, tr.y - tr.h);
    const near: Rect = { x: nx, y: ny, w: Math.max(0, Math.min(fr.x + fr.w, tr.x + tr.w * 2) - nx), h: Math.max(0, Math.min(fr.y + fr.h, tr.y + tr.h * 2) - ny) };
    return handBoxes(tr.x + tr.w / 2, tr.y + tr.h / 2, pose.angle).reduce((sum, b) => sum + Math.max(0, overlap(b, fr) - overlap(b, near)), 0);
  };
  // O palco é o lugar da mão: com a ponta em p, a mão inteira (caixas de handBoxes + a sombra)
  // cabe no palco? `zone` é o retângulo de pontas possíveis pra cada pose (o palco é convexo, então
  // viajar em linha reta entre duas pontas dentro da zona nunca atravessa a legenda nem o cabeçalho).
  const EXT = { up: extentOf(HANDS.up.angle), side: extentOf(HANDS.side.angle) };
  const zone = (pose: HandPose) => {
    const e = EXT[pose.name];
    const pad = HAND.ZONE_PAD;
    return { x0: stage.x + pad - e.l, x1: stage.x + stage.w - pad - e.r, y0: stage.y + pad - e.t, y1: stage.y + stage.h - pad - e.b };
  };
  const inZone = (p: Pt, pose: HandPose) => {
    const z = zone(pose);
    return p.x >= z.x0 - 0.5 && p.x <= z.x1 + 0.5 && p.y >= z.y0 - 0.5 && p.y <= z.y1 + 0.5;
  };
  const clampZone = (p: Pt, pose: HandPose): Pt => {
    const z = zone(pose);
    return { x: Math.max(z.x0, Math.min(z.x1, p.x)), y: Math.max(z.y0, Math.min(z.y1, p.y)) };
  };
  for (const a of actions) {
    if (a.type !== 'tap' && a.type !== 'hold') continue;
    const up = covered(HANDS.up, a);
    if (up > 0 && covered(HANDS.side, a) < up * 0.25) a.pose = HANDS.side;
    // em pé, num alvo rente ao pé do palco, a mão desceria na legenda: deitada, se couber
    const t = rectAt(a.target, a.T);
    if (a.pose === HANDS.up && t) {
      const p = project(stage, camAt(a.T), t.x + t.w / 2, t.y + t.h / 2);
      if (!inZone(p, HANDS.up) && inZone(p, HANDS.side)) a.pose = HANDS.side;
    }
    a.park = a.pose.park;
  }

  // ---------------------------------------------------------------- controles (o que a mão evita)
  // Os controles tocáveis do quadro f (px do vídeo): os alvos do layout que a tela declara como
  // controle (`ScreenModule.controls`). Um modal aberto apaga os alvos da loja, então os botões
  // tapados pelo véu não contam; os do modal que está fechando também não; nem os do modal que
  // ainda vai abrir (`L.hidden`: só a geometria, pra mirar — não estão na tela).
  type Ctl = { key: string; r: Rect };
  const ctlMemo = new Map<number, Ctl[]>();
  const controlsAt = (f: number): Ctl[] => {
    const key = Math.round(f);
    let out = ctlMemo.get(key);
    if (!out) {
      const cam = camAt(key);
      const pats = mod.controls ?? [];
      const L = layoutAt(key) as { targets: Record<string, Rect>; hidden?: string[] };
      const hidden = new Set(L.hidden ?? []);
      out = Object.entries(L.targets)
        .filter(([k]) => !hidden.has(k) && pats.some((p) => matchKey(p, k)))
        .map(([k, r]) => ({ key: k, r: projectRect(stage, cam, r) }));
      ctlMemo.set(key, out);
    }
    return out;
  };
  /** px da ponta até o controle mais perto, no quadro f */
  const clearance = (p: Pt, f: number) => controlsAt(f).reduce((m, c) => Math.min(m, rectDist(p, c.r)), Infinity);
  /** Com a ponta em p no quadro f: a distância até o controle mais perto que NÃO é dela (`dF`) e até
   *  o alvo dela mais perto (`dO`; `own` = o alvo de onde vem e o pra onde vai). Apelidos do mesmo
   *  botão (card0.cta = o cta do 1º cartão) contam como dela. */
  const foreign = (p: Pt, f: number, own: string[]) => {
    const cam = camAt(f);
    const ownR = own.map((k) => rectSeen(k, f)?.rect).filter((r): r is Rect => !!r).map((r) => projectRect(stage, cam, r));
    let dF = Infinity;
    let dO = Infinity;
    for (const o of ownR) dO = Math.min(dO, rectDist(p, o));
    for (const c of controlsAt(f)) {
      const mine = own.includes(c.key) || ownR.some((o) => sameRect(o, c.r));
      if (!mine) dF = Math.min(dF, rectDist(p, c.r));
    }
    return { dF, dO };
  };
  /** andando: a ponta não passa por cima de um controle alheio (mais perto dele que do próprio alvo) */
  const transitOk = (p: Pt, f: number, own: string[]) => {
    const { dF, dO } = foreign(p, f, own);
    return !(dF < HAND.TRANSIT && dF < dO);
  };
  /** a tela rolável do quadro f, em px (o arrasto precisa apertar EM CIMA do que rola) */
  const viewportAt = (f: number): Rect => {
    const r = projectRect(stage, camAt(f), { x: 0, y: d.statusBar, w: d.w, h: d.h - d.statusBar });
    return { x: r.x + 16, y: r.y + 16, w: r.w - 32, h: r.h - 32 };
  };
  const inside = (p: Pt, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

  // ---------------------------------------------------------------- o arrasto: contato num ponto neutro, 1:1
  // Rolar pra baixo = arrastar pra cima. Enquanto aperta, o dedo fica em cima do MESMO ponto do
  // conteúdo (`glued`): o conteúdo anda exatamente o que o dedo anda (a curva SWIPE, a mesma da tela),
  // e o que estava debaixo do dedo vai junto com ele. O contato é escolhido do layout: o ponto mais
  // perto do natural (arrasto centrado no palco) em que, quadro a quadro do arrasto, a mão inteira cabe
  // no palco, o dedo está em cima do que rola e fica a HAND.CLEAR de qualquer controle — como o dedo
  // segue o conteúdo, isso vale pro caminho inteiro (antes só o contato e a soltura eram checados, e o
  // conteúdo andava 2–3× o dedo: a lista escorregava debaixo dele e o rastro cruzava os Resgatar).
  const glued = (P: Pt, s0: number, f: number) => project(stage, camAt(f), P.x, P.y - (scrollOf(f) - s0));
  for (const a of actions) {
    if (a.type !== 'swipe') continue;
    const T = a.T;
    const R = a.end;
    const s0 = scrollOf(T);
    const sEnd = scrollOf(T + Math.ceil(swipeFrames(SWIPE)) + 1);
    const dir = sEnd >= s0 ? -1 : 1;
    const camT = camAt(T);
    const D = Math.abs(sEnd - s0) * SWIPE.frac * camT.k;
    const z = zone(a.pose);
    const pref = { x: stage.x + stage.w * 0.45, y: stage.y + stage.h / 2 - (dir * D) / 2 };
    const vT = viewportAt(T);
    // HAND.CLEAR é o mínimo; entre os que passam, ganha o mais ABERTO perto do natural (cada px de
    // folga, até 200, vale 6 px de distância): rente ao mínimo a ponta caía no rodapé do cartão
    let best: { s: Pt; P: Pt; score: number } | null = null;
    let widest: { s: Pt; P: Pt; c: number } | null = null;
    for (let y = z.y0; y <= z.y1; y += 8) {
      for (let x = z.x0; x <= z.x1; x += 10) {
        const s = { x, y };
        if (!inside(s, vT)) continue;
        const P = unproject(camT, s);
        let c = clearance(s, T - 2);
        let ok = true;
        for (let f = T; f <= R; f++) {
          const p = glued(P, s0, f);
          if (!inZone(p, a.pose) || !inside(p, viewportAt(f))) {
            ok = false;
            break;
          }
          c = Math.min(c, clearance(p, f));
          if (c < HAND.CLEAR && widest && c <= widest.c) break;
        }
        if (!ok) continue;
        if (!widest || c > widest.c) widest = { s, P, c };
        if (c < HAND.CLEAR) continue;
        const score = Math.hypot(x - pref.x, y - pref.y) - 6 * Math.min(c, 200);
        if (!best || score < best.score) best = { s, P, score };
      }
    }
    const pick = best ?? widest ?? { s: clampZone(pref, a.pose), P: unproject(camT, clampZone(pref, a.pose)) };
    const to = glued(pick.P, s0, R);
    const v = Math.abs(to.y - glued(pick.P, s0, R - 1).y);
    const room = dir < 0 ? to.y - z.y0 : z.y1 - to.y;
    a.swipe = { P: pick.P, from: pick.s, to, dir, s0, ft: Math.max(0, Math.min(v * FT_TAU, room)) };
  }

  // ---------------------------------------------------------------- dedo: posição base
  /** Ponta do dedo em px do vídeo, no alvo (tocar/segurar congela no contato; apontar segue o alvo). */
  const tipOf = (a: ActKey, f: number, cam: Cam) => {
    if (a.swipe) return a.swipe.from;
    // tocar/segurar: a posição congela no contato (o alvo pode sumir com o toque)
    const seen = rectSeen(a.target, a.type === 'point' ? f : Math.min(f, a.T));
    if (!seen) throw new Error(`dedo: alvo "${a.target}" não existe no quadro ${Math.round(f)}`);
    const r = seen.rect;
    // apontar: a ponta logo abaixo do alvo, pra mão não cobri-lo
    const p = a.type === 'point' ? { x: r.x + r.w / 2, y: r.y + r.h + 3 } : center(r);
    return project(stage, cam, p.x, p.y);
  };
  /** onde a mão encosta no gesto (px, na câmera da chegada) */
  const destOf = (a: ActKey) => (a.swipe ? a.swipe.from : tipOf(a, a.arrive, camAt(a.arrive)));
  // a mão só espera parada pela próxima ação se chegar nela do mesmo jeito (mesma pose):
  // trocar de pose é sair e entrar de novo, pelo lado certo. Se o toque trocou a tela debaixo
  // dela, ela sai (ver TIME.LEAVE); depois de um arrasto ela sai no embalo (nunca estaciona)
  const lingers = (i: number) =>
    i >= 0 &&
    i + 1 < actions.length &&
    !actions[i].lifts &&
    !actions[i].noLinger &&
    actions[i].type !== 'swipe' &&
    actions[i + 1].travelStart - actions[i].end < TIME.LINGER &&
    actions[i + 1].pose === actions[i].pose;
  /** os alvos "dela" numa viagem: o de onde vem (se veio esperando) e o pra onde vai */
  const ownOf = (j: number, f: number) => {
    const a = actions[j];
    const own = a.type === 'swipe' ? [] : [a.target];
    if (f < a.arrive && j > 0 && lingers(j - 1) && actions[j - 1].type !== 'swipe') own.push(actions[j - 1].target);
    return own;
  };

  /** De que lado a mão vem quando (re)aparece (vetor unitário, da ponta pra fora). No arrasto ela
   *  vem do lado oposto ao do arrasto: chega e segue no mesmo sentido. O lado é o mais perto do
   *  natural em que o caminho INTEIRO (quadro a quadro, com a câmera andando) cabe no palco, nasce a
   *  HAND.CLEAR de outros controles e nunca passa por cima de um (HAND.TRANSIT) — o + da confirmação,
   *  rente à direita, entra por baixo; o Resgatar da confirmação nasce longe do Cancelar. */
  const entryMemo = new Map<number, Pt>();
  const entryPath = (a: ActKey, dir: Pt) => {
    const dest = destOf(a);
    const from = clampZone({ x: dest.x + dir.x * HAND.ENTRY, y: dest.y + dir.y * HAND.ENTRY }, a.pose);
    return { from, at: (f: number) => clampZone({ x: lerp(from.x, dest.x, progress(f, a.travelStart, a.arrive)), y: lerp(from.y, dest.y, progress(f, a.travelStart, a.arrive)) }, a.pose) };
  };
  const TURNS = [0, ...Array.from({ length: 14 }, (_, i) => [(i + 1) * 12.5, -(i + 1) * 12.5]).flat(), 180];
  const entryDir = (a: ActKey): Pt => {
    const hit = entryMemo.get(a.T);
    if (hit) return hit;
    const j = actions.indexOf(a);
    const v = a.swipe ? { x: 0.4, y: -a.swipe.dir } : a.pose.approach;
    const base = Math.atan2(v.y, v.x);
    const dest = destOf(a);
    let best = { x: Math.cos(base), y: Math.sin(base) };
    let bestScore = -Infinity;
    for (const turn of TURNS) {
      const ang = base + (turn * Math.PI) / 180;
      const dir = { x: Math.cos(ang), y: Math.sin(ang) };
      const path = entryPath(a, dir);
      const len = Math.hypot(path.from.x - dest.x, path.from.y - dest.y);
      const full = len >= HAND.ENTRY * 0.9;
      // onde ela acende, longe de outros controles: no quadro em que começa e no da chegada (a câmera
      // pode estar andando — o que a pessoa vê assentado é o da chegada)
      const own0 = ownOf(j, a.travelStart);
      const startClear = Math.min(foreign(path.from, a.travelStart, own0).dF, foreign(path.from, a.arrive, own0).dF);
      const free = startClear >= HAND.CLEAR;
      // e o caminho inteiro, já desde quase invisível, nunca por cima de um controle alheio
      let clean = true;
      for (let f = a.travelStart; f < a.arrive && clean; f++) if (progress(f, a.travelStart, a.arrive) > 0.05 && !transitOk(path.at(f), f, ownOf(j, f))) clean = false;
      if (full && free && clean) {
        best = dir;
        break;
      }
      // sem um lado perfeito: o caminho limpo, depois o inteiro, depois o que nasce mais longe de controles
      const score = (clean ? 1000 : 0) + (full ? 500 : 3 * Math.min(len, HAND.ENTRY)) + 2 * Math.min(startClear, HAND.CLEAR) - 0.2 * Math.abs(turn);
      if (score > bestScore) {
        best = dir;
        bestScore = score;
      }
    }
    entryMemo.set(a.T, best);
    return best;
  };

  /** Onde a ponta da ação i está no quadro f: no alvo até o fim; no arrasto, presa ao ponto do
   *  conteúdo e, solta, seguindo no embalo; depois do toque, levantando — pro ponto de estacionar se
   *  ela espera a próxima ação, ou de volta pelo lado de onde veio se ela sai; apontando, fica. */
  const heldAt = (i: number, f: number, cam: Cam): Pt => {
    const a = actions[i];
    if (a.swipe) {
      const s = a.swipe;
      if (f <= a.T) return s.from;
      if (f <= a.end) return glued(s.P, s.s0, f);
      return { x: s.to.x, y: s.to.y + s.dir * s.ft * (1 - Math.exp(-(f - a.end) / FT_TAU)) };
    }
    const raw = tipOf(a, Math.min(f, a.end), cam);
    if (f <= a.end) return raw;
    // a câmera pode levar o alvo pra fora do palco enquanto a mão aponta: ela fica na borda
    if (a.type === 'point') return clampZone(raw, a.pose);
    const settle = progress(f, a.end, a.end + 12);
    let to: Pt;
    if (lingers(i)) to = { x: raw.x + a.park.x, y: raw.y + a.park.y };
    else {
      const dir = entryDir(a);
      to = { x: raw.x + dir.x * HAND.EXIT, y: raw.y + dir.y * HAND.EXIT };
    }
    const parked = clampZone(to, a.pose);
    return clampZone({ x: lerp(raw.x, parked.x, settle), y: lerp(raw.y, parked.y, settle) }, a.pose);
  };

  // ---- onde a mão estaciona depois do gesto (e espera a próxima ação, se vier logo)
  // O natural é o `park` da pose (levanta e sai de cima do que tocou, pra mostrar o que mudou). Mas
  // ela fica parada ali: o ponto escolhido é o mais perto do natural que, em todo o tempo parado,
  // fica a HAND.CLEAR de qualquer controle e com a mão inteira no palco. A câmera pode andar enquanto
  // ela espera, então a conta é feita quadro a quadro, do jeito que heldAt vai desenhar.
  const restEnd = (i: number) => (lingers(i) ? actions[i + 1].travelStart + 6 : actions[i].end + 18);
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (!lingers(i) || a.type === 'point' || a.end === Infinity) continue;
    const frames: number[] = [];
    for (let f = a.end + 4; f <= Math.max(a.end + 12, restEnd(i)); f += 2) frames.push(f);
    let best: { off: Pt; score: number } | null = null;
    let widest: { off: Pt; c: number } | null = null;
    for (let dy = -320; dy <= 320; dy += 20) {
      for (let dx = -320; dx <= 320; dx += 20) {
        const off = { x: a.pose.park.x + dx, y: a.pose.park.y + dy };
        let c = Infinity;
        for (const f of frames) {
          const raw = tipOf(a, a.end, camAt(f));
          c = Math.min(c, clearance(clampZone({ x: raw.x + off.x, y: raw.y + off.y }, a.pose), f));
          if (c < HAND.CLEAR && widest && c <= widest.c) break;
        }
        if (!widest || c > widest.c) widest = { off, c };
        if (c < HAND.CLEAR) continue;
        const score = Math.hypot(dx, dy) - 2 * Math.min(c, 200);
        if (!best || score < best.score) best = { off, score };
      }
    }
    a.park = (best ?? widest)?.off ?? a.pose.park;
  }

  // ---- a viagem de um gesto pro outro (mão esperando): reta se for limpa; senão uma curva que
  // contorna os controles (desvio pros dois lados, crescendo); sem nenhuma limpa, a mão sai e reentra
  for (let j = 1; j < actions.length; j++) {
    if (!lingers(j - 1)) continue;
    const a = actions[j];
    const from = heldAt(j - 1, a.travelStart, camAt(a.travelStart));
    const dest = destOf(a);
    let found: number | null = null;
    for (const bend of [0, 60, -60, 120, -120, 180, -180, 240, -240]) {
      let ok = true;
      for (let f = a.travelStart; f <= a.arrive && ok; f++) {
        const p = bezier(from, dest, bend, progress(f, a.travelStart, a.arrive));
        if (!inZone(p, a.pose) || !transitOk(p, f, ownOf(j, f))) ok = false;
      }
      if (ok) {
        found = bend;
        break;
      }
    }
    if (found === null) actions[j - 1].noLinger = true;
    else a.bend = found;
  }
  // quem aparece (não vinha esperando) acende e anda só TIME.ENTRY quadros, já perto do alvo
  for (let j = 0; j < actions.length; j++) {
    if (j > 0 && lingers(j - 1)) continue;
    const a = actions[j];
    a.travelStart = Math.max(a.travelStart, a.arrive - TIME.ENTRY);
  }
  // apontar sem seguir pra outro gesto: a mão apaga no lugar ANTES de a câmera ou o destaque andarem
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.type !== 'point' || lingers(i)) continue;
    const cam = camKeys.find((k) => k.start > a.arrive)?.start ?? Infinity;
    a.leaveAt = Math.max(a.arrive + TIME.POINT_OUT, Math.min(a.end, cam));
  }

  // ---------------------------------------------------------------- destaque
  /** quadros pro anel apagar quando o alvo dele some da tela */
  const LOST_FADE = 6;
  const NONE: SpotState = { dim: 0, layers: [] };
  /** o quadro em que o alvo da batida existe (a meta só entra depois que o cartão mirado apaga) */
  const appearMemo = new Map<number, number>();
  const appearAt = (i: number) => {
    const hit = appearMemo.get(i);
    if (hit !== undefined) return hit;
    const k = focusKeys[i];
    let at = k.start;
    if (k.target && !rectAt(k.target, k.start)) {
      at = Infinity;
      for (let g = k.start + 1; g <= k.start + 120; g++) {
        if (rectAt(k.target, g)) {
          at = g;
          break;
        }
      }
    }
    appearMemo.set(i, at);
    return at;
  };
  /** O alvo sumiu (o cartão mirado apagou, o modal tapou o botão): o anel e o buraco ficam onde ele
   *  estava e apagam na MESMA curva do cartão que sai (ease-out: rápido no começo) — linear, o anel
   *  sobrevivia ao cartão e emoldurava o vazio por 2 quadros. */
  const goneAt = (lostAt: number | null, f: number) => (lostAt == null ? 1 : Math.pow(1 - Math.max(0, Math.min(1, (f - lostAt) / LOST_FADE)), 3));
  const layerOf = (k: FocusKey, f: number, land: number): SpotLayer | null => {
    if (!k.target) return null;
    const seen = rectSeen(k.target, f);
    if (!seen) return null;
    const pulse = k.pulse && f >= land ? ((f - land) % 36) / 36 : null;
    const g = goneAt(seen.lostAt, f);
    return { target: k.target, rect: seen.rect, hole: g, ring: g, pulse, tone: k.tone, lostAt: seen.lostAt };
  };
  const goneOf = (L: SpotLayer | null, f: number) => (L ? goneAt(L.lostAt, f) : 1);
  const evalSpot = (i: number, f: number): SpotState => {
    if (i < 0) return NONE;
    const k = focusKeys[i];
    if (!k.target) {
      // apagando: o destaque anterior segue a própria vida (acompanha o alvo e, se o alvo sumiu,
      // continua apagando) enquanto o véu desce
      if (f >= k.land) return NONE;
      const prev = evalSpot(i - 1, f);
      return { dim: prev.dim * (1 - progress(f, k.start, k.land)), layers: prev.layers };
    }
    const ap = appearAt(i);
    if (ap === Infinity) throw new Error(`alvo "${k.target}" não existe perto do quadro ${k.start} (a tela ainda não mostra esse elemento?)`);
    const s = Math.max(k.start, ap);
    const l = Math.max(k.land, ap + 8);
    const me = f >= ap ? layerOf(k, f, l) : null;
    const gone = goneOf(me, f);
    const prev = f < l ? evalSpot(i - 1, f) : NONE;
    if (prev.dim <= 0.001) {
      // do nada: o véu desce com o buraco já no alvo (e, se o alvo sumir, o véu inteiro apaga com ele
      // e o buraco fecha junto — senão, quando o destaque seguinte sobe o véu, o buraco do alvo que
      // já saiu reaparecia aceso em volta do botão que o modal tapou)
      return me ? { dim: progress(f, s, l) * gone, layers: [me] } : NONE;
    }
    // troca de alvo: o anel novo acende NO alvo novo enquanto o velho apaga NO alvo velho (nunca um
    // anel esticado pela tela); o buraco novo abre na 1ª metade e o velho fecha na 2ª, então onde os
    // dois se sobrepõem (o cartão e o botão dele) a tela nunca escurece no meio da troca
    const e = progress(f, s, l);
    const mid = s + (l - s) / 2;
    const open = ramp(f, s, mid);
    const close = ramp(f, mid, l);
    const old = prev.layers.filter((L) => !me || L.target !== me.target).map((L) => ({ ...L, hole: L.hole * (1 - close), ring: L.ring * (1 - e) }));
    const same = me ? prev.layers.find((L) => L.target === me.target) : undefined;
    const layers = me ? [...old, { ...me, hole: Math.max(same?.hole ?? 0, open * gone), ring: Math.max(same?.ring ?? 0, e * gone) }] : old;
    return { dim: lerp(prev.dim, me ? gone : prev.dim, e), layers: layers.filter((L) => L.hole > 0.001 || L.ring > 0.001) };
  };
  const spotAt = (f: number): SpotState => {
    let i = -1;
    for (let j = 0; j < focusKeys.length; j++) if (focusKeys[j].start <= f) i = j;
    return evalSpot(i, f);
  };

  // ---------------------------------------------------------------- dedo
  const travelPos = (j: number, f: number): Pt => {
    const a = actions[j];
    const dest = destOf(a);
    const e = progress(f, a.travelStart, a.arrive);
    if (j > 0 && lingers(j - 1)) {
      // sai de onde a mão anterior ESTÁ (estacionada ou apontando), na curva planejada
      const from = heldAt(j - 1, a.travelStart, camAt(a.travelStart));
      return clampZone(bezier(from, dest, a.bend, e), a.pose);
    }
    // aparecendo: acende já dentro do palco, a HAND.ENTRY do alvo, pelo lado planejado. A mão viaja
    // pra onde o alvo VAI estar quando ela chegar (a câmera do quadro da chegada)
    return entryPath(a, entryDir(a)).at(f);
  };
  /** o rastro do arrasto: atrás da ponta, até 120 px, encurtado pra nunca cruzar um controle */
  const trailOf = (a: ActKey, tip: Pt, f: number): Pt => {
    const s = a.swipe!;
    let len = Math.min(120, Math.hypot(tip.x - s.from.x, tip.y - s.from.y));
    // atrás da ponta = do lado de onde ela veio (o dedo sobe: o rastro fica embaixo)
    for (let l = 10; l <= len; l += 10) {
      if (clearance({ x: tip.x, y: tip.y - s.dir * l }, f) < 14) {
        len = l - 10;
        break;
      }
    }
    return { x: tip.x, y: tip.y - s.dir * len };
  };
  const fingerAt = (f: number): FingerState | null => {
    let j = -1;
    for (let i = 0; i < actions.length; i++) if (actions[i].travelStart <= f) j = i;
    if (j < 0) return null;
    const a = actions[j];
    const cam = camAt(f);
    const T = a.T;
    let opacity = 1;
    if (a.type === 'swipe') opacity = 1 - ramp(f, a.end + 1, a.end + TIME.LIFT_OFF);
    else if (a.type === 'point') {
      if (!lingers(j)) opacity = 1 - ramp(f, a.leaveAt - TIME.POINT_OUT, a.leaveAt);
    } else if (f > a.end && !lingers(j)) opacity = 1 - ramp(f, a.end + 2, a.end + 12);
    // o toque trocou a tela debaixo do dedo: mão, disco e onda saem já (moram no mesmo fade)
    if (a.lifts) opacity = Math.min(opacity, 1 - ramp(f, T + 2, T + 2 + TIME.LEAVE));
    if (opacity <= 0) return null;
    let pos = heldAt(j, f, cam);
    if (f < a.arrive) {
      pos = travelPos(j, f);
      if (!(j > 0 && lingers(j - 1))) opacity = Math.min(opacity, progress(f, a.travelStart, a.arrive));
    }
    let press = 0;
    let ripple: number | null = null;
    let hold: number | null = null;
    let trail: Pt | null = null;
    if (a.type === 'tap') {
      press = ramp(f, T - 4, T - 1) * (1 - ramp(f, T + 2, T + 6));
      if (f >= T && f <= T + 16) ripple = (f - T) / 16;
    } else if (a.type === 'hold') {
      press = ramp(f, T - 4, T - 1) * (1 - ramp(f, T + TIME.HOLD, T + TIME.HOLD + 4));
      if (f >= T && f <= T + TIME.HOLD + 4) hold = Math.min(1, (f - T) / TIME.HOLD);
      if (f >= T + TIME.HOLD && f <= T + TIME.HOLD + 16) ripple = (f - T - TIME.HOLD) / 16;
    } else if (a.type === 'swipe' && a.swipe) {
      // encosta e já sai junto com o conteúdo: sem onda, sem disco de toque — o que se vê é o rastro
      // do arrasto, que apaga quando o dedo solta
      press = ramp(f, T - 2, T + 1) * (1 - ramp(f, a.end - 1, a.end + 2));
      if (press > 0 && f >= T) trail = trailOf(a, pos, f);
    } else if (f >= a.arrive) {
      pos = { x: pos.x, y: pos.y + Math.sin((f - a.arrive) / 7) * 5 };
    }
    const rippleAt = ripple != null ? tipOf(a, Math.min(f, a.end), cam) : undefined;
    return { x: pos.x, y: pos.y, opacity, press, ripple, rippleAt, hold, angle: a.pose.angle, trail };
  };
  const pressedAt = (f: number): string | null => {
    for (const a of actions) {
      if (a.type === 'tap' && f >= a.T - 2 && f <= a.T + 4) return a.target;
      if (a.type === 'hold' && f >= a.T - 1 && f <= a.T + TIME.HOLD) return a.target;
    }
    return null;
  };

  // ---------------------------------------------------------------- etiqueta e título
  const calloutAt = (f: number) => {
    const k = [...callKeys].reverse().find((c) => c.start <= f);
    if (!k || f > k.end) return null;
    const t = ramp(f, k.start, k.start + 8) * (1 - ramp(f, k.end - 6, k.end));
    const r = rectAt(k.target, f);
    if (!r) return null;
    return { text: k.text, t, rect: projectRect(stage, camAt(f), r) };
  };
  /** O título do topo troca em sequência: o velho sai (TITLE_OUT) e só então o novo entra
   *  (TITLE_IN) — `prevO`/`curO` nunca são os dois > 0 no mesmo quadro. */
  const titleAt = (f: number) => {
    const i = scenes.reduce((acc, s, idx) => (s.start <= f ? idx : acc), 0);
    const s = scenes[i];
    const prev = scenes.slice(0, i).reverse().find((x) => x.title);
    const cur = s.title ?? prev?.title ?? '';
    const before = i > 0 ? (scenes[i - 1].title ?? prev?.title ?? '') : '';
    const out = before && before !== cur ? ramp(f, s.start, s.start + TIME.TITLE_OUT) : 1;
    const inAt = before && before !== cur ? s.start + TIME.TITLE_OUT : s.start;
    const t = before === cur ? 1 : ramp(f, inAt, inAt + TIME.TITLE_IN);
    return { cur, prev: before, t, prevO: before && before !== cur ? 1 - out : 0, curO: t };
  };

  const viewAt = (f: number) => {
    const s = stateAt(history, f);
    const v = mod.view(history, f);
    const L = mod.layout(s, v, ctx, history, f);
    return { s, v, L };
  };

  // ---------------------------------------------------------------- audit do movimento
  // Varre o filme quadro a quadro e devolve o que quebra as regras (TOUR.md):
  // `stage` = a mão saiu do palco (entrou na legenda ou no cabeçalho); `rest` = a mão parada a
  // menos de HAND.CLEAR de um controle (fora do próprio gesto); `path` = a mão andando por cima de um
  // controle que não é o dela; `contact` = o dedo apertado do arrasto perto de um controle (o caminho
  // inteiro, não só contato e soltura); `drag` = o conteúdo não anda o que o dedo anda (1:1) ou a
  // inércia passa de 30% do caminho; `ring` = um anel fora do próprio alvo (esticado, deslizando, ou
  // aceso em volta de onde o alvo já saiu); `jump` = um alvo salta mais que JUMP_MAX px num quadro sem
  // a tela ter rolado (corte); `pop` = a mão aparece/some num salto; `title` = dois títulos juntos.
  // Também lista cada aparição da mão e cada arrasto, pra conferência.
  const total = Math.max(...scenes.map((s) => s.start + s.frames));
  const audit = () => {
    const issues: MotionIssue[] = [];
    const add = (frame: number, rule: MotionIssue['rule'], what: string) => {
      const last = [...issues].reverse().find((x) => x.rule === rule);
      // quadros seguidos com o mesmo problema viram um item só (o quadro do começo + a contagem)
      if (last && last.what.split(' · ')[0] === what.split(' · ')[0] && frame - (last.to ?? last.frame) <= 2) {
        last.to = frame;
        return;
      }
      issues.push({ frame, rule, what });
    };
    const fmt = (p: Pt) => `${Math.round(p.x)},${Math.round(p.y)}`;
    const idxAt = (f: number) => {
      let j = -1;
      for (let i = 0; i < actions.length; i++) if (actions[i].travelStart <= f) j = i;
      return j;
    };
    let prevO = 0;
    const tips: (Pt | null)[] = [];
    let prevTargets: Record<string, Rect> | null = null;
    const moves: Record<string, Map<number, number>> = {};
    for (let f = 0; f < total; f++) {
      const fi = fingerAt(f);
      const o = fi?.opacity ?? 0;
      if (Math.abs(o - prevO) > 0.34) add(f, 'pop', `a mão ${o > prevO ? 'aparece' : 'some'} num salto · ${prevO.toFixed(2)} → ${o.toFixed(2)}`);
      prevO = o;
      tips.push(fi && o > 0.02 ? { x: fi.x, y: fi.y } : null);
      const tt = titleAt(f);
      if (tt.prevO > 0.01 && tt.curO > 0.01) add(f, 'title', `"${tt.prev}" e "${tt.cur}" juntos`);

      // o anel: sempre em cima do próprio alvo
      const sp = spotAt(f);
      for (const L of sp.layers) {
        const vis = sp.dim * Math.max(L.ring, L.hole);
        if (vis < 0.15) continue;
        const r = rectAt(L.target, f);
        if (r) {
          const off = Math.max(Math.abs(r.x - L.rect.x), Math.abs(r.y - L.rect.y), Math.abs(r.w - L.rect.w), Math.abs(r.h - L.rect.h));
          if (off > 2) add(f, 'ring', `anel de "${L.target}" fora do alvo · ${off.toFixed(0)} dp`);
        } else if (L.lostAt == null || f - L.lostAt > LOST_FADE / 2) add(f, 'ring', `anel de "${L.target}" aceso sem o alvo na tela · ${f - (L.lostAt ?? f)} quadros depois de ele sair`);
      }

      // a tela: quanto cada alvo andou na tela desde o quadro anterior (px); o salto é julgado no fim
      const Lf = layoutAt(f);
      if (prevTargets) {
        const k = camAt(f).k;
        for (const [key, r] of Object.entries(Lf.targets)) {
          const q = prevTargets[key];
          if (!q || key === 'screen') continue;
          const moved = Math.max(Math.abs(r.x - q.x), Math.abs(r.y - q.y), Math.abs(r.w - q.w), Math.abs(r.h - q.h)) * k;
          (moves[key] ??= new Map()).set(f, moved);
        }
      }
      prevTargets = Lf.targets;

      if (!fi || o <= 0.02) continue;
      const j = idxAt(f);
      const a = actions[j];
      const out = handBoxes(fi.x, fi.y, fi.angle).some((b) => b.y < stage.y || b.y + b.h > stage.y + stage.h || b.x < stage.x || b.x + b.w > stage.x + stage.w);
      if (out) add(f, 'stage', `mão fora do palco (${a.type} "${a.target}") · ponta ${fmt(fi)}`);

      // andando (ou levantando): a ponta nunca por cima de um controle alheio. O contato do toque e o
      // arrasto apertado são o próprio gesto (o arrasto tem a régua dele, `contact`)
      const pressing = fi.press > 0.05 || (a.type !== 'swipe' && f >= a.arrive - 2 && f <= a.end);
      if (o >= 0.3 && !pressing && !transitOk(fi, f, ownOf(j, f))) {
        const { dF } = foreign(fi, f, ownOf(j, f));
        add(f, 'path', `mão andando por cima de um controle (${a.type} "${a.target}") · a ${Math.round(dF)} px, ponta ${fmt(fi)}`);
      }

      // parada = andou menos de 30 px nos últimos 6 quadros (pairar devagar perto de um botão lê
      // como esperar pra tocar nele), fora de um gesto: do contato até 6 quadros depois (tocar,
      // apontar, arrastar, e o levantar logo depois). Chegando pra tocar/apontar, o próprio alvo
      // não conta — é nele que ela vai encostar
      const back = tips[f - 6];
      if (!back || o < 0.5 || Math.hypot(fi.x - back.x, fi.y - back.y) >= 30) continue;
      if (actions.some((b) => f >= b.arrive - 2 && f <= b.end + 6)) continue;
      // os últimos quadros da chegada pra tocar/apontar: ela desacelera no próprio alvo, e o que
      // está colado nele (o FAB de cima, a barra de abas embaixo do botão apontado) vem junto
      if (a.type !== 'swipe' && f >= a.arrive - 8) continue;
      const c = foreign(fi, f, f < a.arrive && a.type !== 'swipe' ? [a.target] : []).dF;
      if (c < HAND.CLEAR - 0.5) add(f, 'rest', `mão parada perto de um controle (depois de ${a.type} "${a.target}") · a ${Math.round(c)} px, ponta ${fmt(fi)}`);
    }

    // o salto: um alvo anda mais que JUMP_MAX num quadro E bem mais (2,5×) que nos quadros vizinhos —
    // um corte (a lista que pulava ~340 px no Mirar, sem causa), não uma animação rápida e contínua
    // (o vão que fecha, a rolagem do arrasto)
    const jumps: { frame: number; key: string; px: number }[] = [];
    for (const [key, m] of Object.entries(moves)) {
      for (const [f, px] of m) {
        const near = Math.max(m.get(f - 1) ?? 0, m.get(f + 1) ?? 0, 8);
        if (px > JUMP_MAX && px > 2.5 * near) jumps.push({ frame: f, key, px });
      }
    }
    jumps.sort((a, b) => a.frame - b.frame);
    for (const jmp of jumps) add(jmp.frame, 'jump', `"${jmp.key}" salta ${Math.round(jmp.px)} px num quadro (corte, sem animação)`);

    // o arrasto: o dedo apertado preso ao conteúdo (1:1), longe de controles no caminho inteiro
    const swipes = actions
      .filter((a) => a.swipe)
      .map((a) => {
        const s = a.swipe!;
        const camT = camAt(a.T);
        const P = unproject(camT, s.from);
        const s0 = scrollOf(a.T);
        let worst = 0;
        let clear = Infinity;
        for (let f = a.T; f <= a.end; f++) {
          const fi = fingerAt(f);
          if (!fi) continue;
          const content = project(stage, camAt(f), P.x, P.y - (scrollOf(f) - s0));
          const miss = Math.hypot(fi.x - content.x, fi.y - content.y);
          worst = Math.max(worst, miss);
          clear = Math.min(clear, clearance(fi, f));
          if (miss > 2) add(f, 'drag', `o conteúdo não anda com o dedo (arrasto em ${a.T}) · ${miss.toFixed(1)} px de diferença`);
        }
        const finger = Math.abs(s.to.y - s.from.y);
        const settle = a.T + Math.ceil(swipeFrames(SWIPE)) + 1;
        const content = Math.abs(scrollOf(settle) - s0) * camT.k;
        const momentum = content > 0 ? 1 - finger / content : 0;
        if (momentum > 0.3) add(a.T, 'drag', `inércia longa no arrasto em ${a.T} · o conteúdo anda ${Math.round(content)} px e o dedo ${Math.round(finger)} px`);
        if (clear < HAND.CLEAR) add(a.T, 'contact', `arrasto a ${Math.round(clear)} px de um controle (${fmt(s.from)} → ${fmt(s.to)})`);
        return { frame: a.T, release: a.end, from: fmt(s.from), to: fmt(s.to), fingerPx: Math.round(finger), contentPx: Math.round(content), momentum: +momentum.toFixed(2), clearPath: Math.round(clear), worstMissPx: +worst.toFixed(2) };
      });
    const entries = actions
      .map((a, j) => ({ a, j }))
      .filter(({ j }) => !(j > 0 && lingers(j - 1)))
      .map(({ a }) => {
        const p0 = fingerAt(a.travelStart + 1);
        return { frame: a.travelStart, gesture: `${a.type} ${a.target}`, from: p0 ? fmt(p0) : null, at: a.arrive };
      });
    // onde a mão espera entre dois gestos (estacionada): o deslocamento em px a partir do gesto
    const rests = actions
      .map((a, i) => ({ a, i }))
      .filter(({ a, i }) => lingers(i) && a.type !== 'point')
      .map(({ a, i }) => ({ after: `${a.type} ${a.target}`, from: a.end, until: actions[i + 1].travelStart, park: fmt(a.park) }));
    const travels = actions
      .map((a, j) => ({ a, j }))
      .filter(({ j }) => j > 0 && lingers(j - 1))
      .map(({ a, j }) => ({ from: `${actions[j - 1].type} ${actions[j - 1].target}`, to: `${a.type} ${a.target}`, frames: [a.travelStart, a.arrive], bend: a.bend }));
    const exits = actions.filter((a) => a.type === 'point' && a.leaveAt !== Infinity).map((a) => ({ point: a.target, fadeFrom: a.leaveAt - TIME.POINT_OUT, gone: a.leaveAt }));
    return { total, issues, entries, swipes, rests, travels, exits };
  };

  return { ctx, events, history, actions, focusKeys, camKeys, viewAt, rectAt, camAt, spotAt, fingerAt, pressedAt, calloutAt, titleAt, audit, frameOf: (e: Ev) => e.frame };
};

export type Plan = ReturnType<typeof buildPlan>;
