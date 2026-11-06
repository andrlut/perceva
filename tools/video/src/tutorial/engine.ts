// O motor do tutorial: transforma as batidas do roteiro (deixas da fala) em
// quadros — o estado da tela (pelo comportamento da réplica, igual ao app),
// a câmera, o destaque, o dedo e a etiqueta. Tudo puro em função do quadro:
// o Remotion pode renderizar qualquer quadro fora de ordem.
import { FPS, cue, speechEnd } from '../timeline';
import type { Rect } from './ui';
import { Cam, HAND_ANGLE, Stage, focusCam, handBoxes, lerp, lerpCam, lerpRect, progress, project, projectRect, wideCam } from './overlays';
import { AnyScreen, HISTORY_START, Snap, stateAt } from './screens/types';
import type { Action, Beat, CameraSpec, TourScene, TourSpec } from './spec';

/** Tempos em quadros (30 fps). */
export const TIME = {
  /** a câmera leva isto pra chegar no alvo */
  CAM: 20,
  /** o destaque leva isto pra pular de alvo */
  SPOT: 14,
  /** câmera e destaque chegam isto ANTES do toque */
  LEAD: 3,
  /** o dedo viaja de um alvo pro outro */
  TRAVEL: 16,
  /** o app reage isto depois do toque */
  EFFECT: 3,
  /** segurar dura isto (o menu de segurar do RN abre em ~0,5 s) */
  HOLD: 26,
  /** o arrasto da rolagem */
  SWIPE: 22,
  /** o dedo espera parado até a próxima ação se ela vier antes disto; senão sai */
  LINGER: 50,
  /** o toque pôs outra coisa debaixo do dedo (TimedPatch.lift: um modal abriu ali, o Mirar
   *  tirou o cartão): a mão e a onda apagam nisto, a partir de 2 quadros depois do toque —
   *  somem em T+8, antes de o texto do que entrou aparecer (o da comemoração entra em T+10) */
  LEAVE: 6,
} as const;

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
  swipe?: { from: { x: number; y: number }; to: { x: number; y: number } };
  /** o toque põe outra coisa debaixo do dedo (TimedPatch.lift): a mão não fica em cima do que entrou */
  lifts: boolean;
};

const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
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
};
export type SpotState = { rect: Rect; dim: number; pulse: number | null; tone: 'violet' | 'gold' };

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
  const actions: ActKey[] = [];
  /** os toques que põem outra coisa debaixo do dedo (TimedPatch.lift) */
  const lifting = new Set<Ev>();
  for (const ev of events) {
    const b = ev.beat;
    flush(ev.frame);
    if (b.set) push(ev.frame, b.set);
    flush(ev.frame);
    let scrollTo: number | null = null;
    if (b.scroll !== undefined) {
      scrollTo = typeof b.scroll === 'number' ? b.scroll : mod.scrollFor(b.scroll, state, ctx);
      push(ev.frame, { scroll: scrollTo });
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
  const layouts = new Map<number, { targets: Record<string, Rect> }>();
  const layoutAt = (f: number) => {
    const key = Math.round(f);
    let L = layouts.get(key);
    if (!L) {
      const v = mod.view(history, key);
      L = mod.layout(stateAt(history, key), v, ctx, history, key) as { targets: Record<string, Rect> };
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
  /** O alvo ainda vai aparecer (o Mirar só põe a meta no topo depois que o cartão apaga):
   *  onde ele entra, pra a câmera já sair rumo a ele em vez de abrir pra tela inteira. */
  const rectSoon = (target: string, f: number): { rect: Rect; lostAt: null } | undefined => {
    for (let g = Math.round(f) + 1; g <= f + 60; g++) {
      const q = rectAt(target, g);
      if (q) return { rect: q, lostAt: null };
    }
    return undefined;
  };

  // ---------------------------------------------------------------- trilhas: destaque, câmera, dedo, etiqueta
  const focusKeys: FocusKey[] = [];
  const camKeys: CamKey[] = [];
  const callKeys: CalloutKey[] = [];
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
      const arrive = T - 2;
      const prev = actions[actions.length - 1];
      const travelStart = Math.max(arrive - TIME.TRAVEL, prev ? Math.min(prev.end, arrive - 6) + 2 : -Infinity);
      const end = b.do === 'tap' ? T + 6 : b.do === 'hold' ? T + TIME.HOLD : b.do === 'swipe' ? T + TIME.SWIPE : Infinity;
      const a: ActKey = { type: b.do, target, focus: b.focus !== undefined ? b.focus : curFocus, T, arrive, travelStart, end, pose: HANDS.up, lifts: lifting.has(ev) };
      if (b.do === 'swipe') {
        const before = stateAt(history, T - 1) as { scroll?: number };
        const after = stateAt(history, T + 1) as { scroll?: number };
        const delta = (after.scroll ?? 0) - (before.scroll ?? 0);
        // em px do palco: rolar pra baixo = arrastar pra cima (e vice-versa), no meio do palco
        const x = stage.x + stage.w * 0.6;
        const len = stage.h * 0.3;
        const y0 = stage.y + stage.h * (delta >= 0 ? 0.66 : 0.3);
        a.swipe = { from: { x, y: y0 }, to: { x, y: delta >= 0 ? y0 - len : y0 + len } };
      }
      actions.push(a);
    }
  }
  // "point" fica até a próxima mudança de destaque ou a próxima ação
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.end !== Infinity) continue;
    const nextFocus = focusKeys.find((k) => k.start > a.T && k.target !== a.target)?.start ?? Infinity;
    const nextAct = actions[i + 1]?.travelStart ?? Infinity;
    a.end = Math.min(nextFocus, nextAct);
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
  for (const a of actions) {
    if (a.type !== 'tap' && a.type !== 'hold') continue;
    const up = covered(HANDS.up, a);
    if (up > 0 && covered(HANDS.side, a) < up * 0.25) a.pose = HANDS.side;
  }

  // ---------------------------------------------------------------- destaque
  /** quadros pro anel apagar quando o alvo dele some da tela */
  const LOST_FADE = 6;
  const NONE: SpotState = { rect: { x: d.w / 2, y: d.h / 2, w: 0, h: 0, r: 0 }, dim: 0, pulse: null, tone: 'violet' };
  const evalSpot = (i: number, f: number): SpotState => {
    if (i < 0) return NONE;
    const k = focusKeys[i];
    const prev = evalSpot(i - 1, Math.min(f, k.start));
    // a caminho do alvo que ainda vai aparecer, o anel mira onde ele entra (como a câmera);
    // depois de pousar, alvo ausente é erro
    const seen = k.target ? rectSeen(k.target, f) ?? (f < k.land ? rectSoon(k.target, f) : undefined) : undefined;
    if (k.target && !seen && f >= k.land) throw new Error(`alvo "${k.target}" não existe no quadro ${Math.round(f)} (a tela ainda não mostra esse elemento?)`);
    const pulse = k.pulse && f >= k.land ? ((f - k.land) % 36) / 36 : null;
    const e = progress(f, k.start, k.land);
    if (!k.target || !seen) {
      // apagando: o destaque anterior segue a própria vida (acompanha o alvo, e se o alvo
      // sumiu continua apagando) — congelado no início desta batida, ele ficava aceso
      // em volta do que ocupou o lugar do alvo (o Mirar tira o cartão e a grade desce)
      const now = evalSpot(i - 1, f);
      return { ...now, dim: Math.min(now.dim, prev.dim) * (1 - e), pulse: null };
    }
    // sumiu da tela depois de pousar: o anel fica onde estava e apaga (rápido: o que ocupa
    // o lugar dele não é o alvo)
    const gone = seen.lostAt == null ? 1 : 1 - progress(f, seen.lostAt, seen.lostAt + LOST_FADE);
    const r = seen.rect;
    if (prev.dim <= 0.001) return { rect: r, dim: e * gone, pulse, tone: k.tone };
    return { rect: lerpRect(prev.rect, r, e), dim: lerp(prev.dim, 1, e) * gone, pulse, tone: k.tone };
  };
  const spotAt = (f: number): SpotState => {
    let i = -1;
    for (let j = 0; j < focusKeys.length; j++) if (focusKeys[j].start <= f) i = j;
    return evalSpot(i, f);
  };

  // ---------------------------------------------------------------- dedo
  /** Ponta do dedo em px do vídeo. O arrasto mora no palco (sempre à vista, longe da legenda);
   *  o resto segue o alvo pela câmera do quadro. */
  const tipOf = (a: ActKey, f: number, cam: Cam) => {
    if (a.swipe) {
      const e = progress(f, a.T, a.T + TIME.SWIPE);
      return { x: lerp(a.swipe.from.x, a.swipe.to.x, e), y: lerp(a.swipe.from.y, a.swipe.to.y, e) };
    }
    // tocar/segurar: a posição congela no contato (o alvo pode sumir com o toque)
    const seen = rectSeen(a.target, a.type === 'point' ? f : Math.min(f, a.T));
    if (!seen) throw new Error(`dedo: alvo "${a.target}" não existe no quadro ${Math.round(f)}`);
    const r = seen.rect;
    // apontar: a ponta logo abaixo do alvo, pra mão não cobri-lo
    const p = a.type === 'point' ? { x: r.x + r.w / 2, y: r.y + r.h + 3 } : center(r);
    return project(stage, cam, p.x, p.y);
  };
  // a mão só espera parada pela próxima ação se chegar nela do mesmo jeito (mesma pose):
  // trocar de pose é sair e entrar de novo, pelo lado certo. Se o toque trocou a tela
  // debaixo dela, ela sai (ver TIME.LEAVE)
  const lingers = (i: number) =>
    i >= 0 &&
    i + 1 < actions.length &&
    !actions[i].lifts &&
    actions[i + 1].travelStart - actions[i].end < TIME.LINGER &&
    actions[i + 1].pose === actions[i].pose;
  // esperando entre ações a câmera anda e leva o alvo antigo pra borda: o dedo fica
  // dentro do palco, acima da legenda (a mão desce ~190 px abaixo da ponta)
  const rest = (p: { x: number; y: number }) => ({
    x: Math.max(stage.x + 70, Math.min(stage.x + stage.w - 70, p.x)),
    y: Math.max(stage.y + 70, Math.min(stage.y + stage.h - 190, p.y)),
  });
  /** Onde a ponta da ação i está no quadro f: no alvo até o fim e, depois do toque, levantando
   *  e saindo de cima dele (pra mostrar o que mudou ali); apontando, fica onde está. */
  const heldAt = (i: number, f: number, cam: Cam) => {
    const a = actions[i];
    const raw = tipOf(a, Math.min(f, a.end), cam);
    if (f <= a.end) return raw;
    const parked = rest(a.type === 'point' ? raw : { x: raw.x + a.pose.park.x, y: raw.y + a.pose.park.y });
    const settle = progress(f, a.end, a.end + 12);
    return { x: lerp(raw.x, parked.x, settle), y: lerp(raw.y, parked.y, settle) };
  };
  const fingerAt = (f: number): FingerState | null => {
    let j = -1;
    for (let i = 0; i < actions.length; i++) if (actions[i].travelStart <= f) j = i;
    if (j < 0) return null;
    const a = actions[j];
    const cam = camAt(f);
    // depois do fim: espera a próxima (se vier logo) ou sai em fade
    let opacity = 1;
    if (f > a.end && !lingers(j)) opacity = 1 - ramp(f, a.end + 8, a.end + 18);
    // o toque trocou a tela debaixo do dedo: mão e onda saem já (a onda mora no mesmo fade)
    if (a.lifts) opacity = Math.min(opacity, 1 - ramp(f, a.T + 2, a.T + 2 + TIME.LEAVE));
    if (opacity <= 0) return null;
    const raw = tipOf(a, Math.min(f, a.end), cam);
    const tip = heldAt(j, f, cam);
    let pos = tip;
    if (f < a.arrive) {
      const e = progress(f, a.travelStart, a.arrive);
      const prevVisible = j > 0 && lingers(j - 1);
      // sai de onde a mão anterior ESTÁ (já estacionada), não do ponto do toque: voltar ao
      // contato era um salto pra trás, em cima do que ocupou o lugar do alvo
      const from = prevVisible ? rest(heldAt(j - 1, a.travelStart, cam)) : { x: tip.x + a.pose.approach.x, y: tip.y + a.pose.approach.y };
      pos = { x: lerp(from.x, tip.x, e), y: lerp(from.y, tip.y, e) };
      if (!prevVisible) opacity = Math.min(opacity, e);
    }
    let press = 0;
    let ripple: number | null = null;
    let hold: number | null = null;
    const T = a.T;
    if (a.type === 'tap') {
      press = ramp(f, T - 4, T - 1) * (1 - ramp(f, T + 2, T + 6));
      if (f >= T && f <= T + 16) ripple = (f - T) / 16;
    } else if (a.type === 'hold') {
      press = ramp(f, T - 4, T - 1) * (1 - ramp(f, T + TIME.HOLD, T + TIME.HOLD + 4));
      if (f >= T && f <= T + TIME.HOLD + 4) hold = Math.min(1, (f - T) / TIME.HOLD);
      if (f >= T + TIME.HOLD && f <= T + TIME.HOLD + 16) ripple = (f - T - TIME.HOLD) / 16;
    } else if (a.type === 'swipe') {
      press = ramp(f, T - 3, T) * (1 - ramp(f, T + TIME.SWIPE - 2, T + TIME.SWIPE + 2));
    } else if (f >= a.arrive) {
      pos = { x: pos.x, y: pos.y + Math.sin((f - a.arrive) / 7) * 5 };
    }
    return { x: pos.x, y: pos.y, opacity, press, ripple, rippleAt: ripple != null ? raw : undefined, hold, angle: a.pose.angle };
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
  const titleAt = (f: number) => {
    const i = scenes.reduce((acc, s, idx) => (s.start <= f ? idx : acc), 0);
    const s = scenes[i];
    const prev = scenes.slice(0, i).reverse().find((x) => x.title);
    const t = ramp(f, s.start, s.start + 10);
    return { cur: s.title ?? prev?.title ?? '', prev: i > 0 ? (scenes[i - 1].title ?? prev?.title ?? '') : '', t };
  };

  const viewAt = (f: number) => {
    const s = stateAt(history, f);
    const v = mod.view(history, f);
    const L = mod.layout(s, v, ctx, history, f);
    return { s, v, L };
  };

  return { ctx, events, history, actions, focusKeys, camKeys, viewAt, rectAt, camAt, spotAt, fingerAt, pressedAt, calloutAt, titleAt, frameOf: (e: Ev) => e.frame };
};

export type Plan = ReturnType<typeof buildPlan>;
