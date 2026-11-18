// ============================================================================
// "Sobre você" + setup checklist — the pure half of get_setup_checklist,
// update_about_me and get_self_knowledge.about_me (perceva-mcp 0.6.0).
//
// The data lives in two places: `profile.profession` / `profile.about`
// ("Trabalho ou estudo" / "Seu momento", migration 20260908000001) and the
// one-row `profile_context` (20261118000002). The closed lists below MIRROR
// that table's check constraints and app/lib/api/aboutMe.ts — a value outside
// them is refused by the database anyway; matching here is what turns a model
// that says "Filhos pequenos" into `small_kids` instead of a raw error.
//
// No I/O here: index.ts reads under the user's token (RLS is the boundary)
// and hands the rows in, so this file is testable without a database.
// ============================================================================

export const APP = 'rpgtasks';

// ─── Closed lists, with the app's pt/en labels ──────────────────────────────

type Options = Record<string, { pt: string; en: string }>;

export const AI_TONES: Options = {
  direct: { pt: 'Direta', en: 'Direct' },
  warm: { pt: 'Acolhedora', en: 'Warm' },
};
export const AI_PUSHES: Options = {
  none: { pt: 'Sem cobrar', en: 'No pushing' },
  light: { pt: 'Cobra leve', en: 'Light push' },
  firm: { pt: 'Cobra firme', en: 'Firm push' },
};
export const BEST_TIMES: Options = {
  morning: { pt: 'Manhã', en: 'Morning' },
  afternoon: { pt: 'Tarde', en: 'Afternoon' },
  evening: { pt: 'Noite', en: 'Evening' },
  night: { pt: 'Madrugada', en: 'Late night' },
};
export const LIFE_PHASES: Options = {
  studying: { pt: 'Estudando', en: 'Studying' },
  early_career: { pt: 'Começando a carreira', en: 'Starting out at work' },
  career_growth: { pt: 'Crescendo no trabalho', en: 'Growing at work' },
  changing_course: { pt: 'Mudando de rumo', en: 'Changing course' },
  between_jobs: { pt: 'Entre trabalhos', en: 'Between jobs' },
  small_kids: { pt: 'Filhos pequenos', en: 'Young kids' },
  caregiving: { pt: 'Cuidando de alguém', en: 'Caring for someone' },
  retired: { pt: 'Aposentadoria', en: 'Retired' },
};
export const LIVING_WITH: Options = {
  alone: { pt: 'Moro só', en: 'I live alone' },
  partner: { pt: 'Com parceiro(a)', en: 'With a partner' },
  kids: { pt: 'Com filhos', en: 'With kids' },
  family: { pt: 'Com pais ou família', en: 'With parents or family' },
  roommates: { pt: 'Com amigos', en: 'With friends' },
};
export const BLOCKERS: Options = {
  time: { pt: 'Falta de tempo', en: 'Not enough time' },
  energy: { pt: 'Cansaço', en: 'Tiredness' },
  money: { pt: 'Dinheiro', en: 'Money' },
  phone: { pt: 'Celular e telas', en: 'Phone and screens' },
  environment: { pt: 'O ambiente', en: 'My surroundings' },
  forgetting: { pt: 'Esqueço', en: 'I forget' },
  motivation: { pt: 'Falta de vontade', en: 'Low motivation' },
  perfectionism: { pt: 'Tudo ou nada', en: 'All or nothing' },
  other_people: { pt: 'Demandas dos outros', en: "Other people's demands" },
};

export const LIMITS = {
  profession: 80,
  about: 600,
  focus_90d: 140,
  ai_avoid_items: 5,
  ai_avoid_len: 40,
  life_phase: 2,
  blockers: 3,
} as const;

export const CONTEXT_COLUMNS =
  'ai_tone,ai_push,ai_avoid,wake_time,sleep_time,work_start,work_end,best_time,' +
  'focus_90d,focus_set_at,life_phase,living_with,blockers,updated_at';

/** The card's seven fields, in the app's order. */
export const ABOUT_FIELDS = ['ai', 'rhythm', 'focus', 'phase', 'blockers', 'work', 'moment'] as const;
export type AboutField = (typeof ABOUT_FIELDS)[number];

export const FIELD_TITLE_PT: Record<AboutField, string> = {
  ai: 'Jeito da IA',
  rhythm: 'Seu ritmo',
  focus: 'Foco dos 90 dias',
  phase: 'Fase e casa',
  blockers: 'O que costuma travar',
  work: 'Trabalho ou estudo',
  moment: 'Seu momento',
};

export interface ProfileRow {
  profession?: string | null;
  about?: string | null;
  modules?: Record<string, boolean> | null;
  subscription_tier?: string | null;
}

export interface ContextRow {
  ai_tone: string | null;
  ai_push: string | null;
  ai_avoid: string[] | null;
  wake_time: string | null;
  sleep_time: string | null;
  work_start: string | null;
  work_end: string | null;
  best_time: string | null;
  focus_90d: string | null;
  focus_set_at: string | null;
  life_phase: string[] | null;
  living_with: string[] | null;
  blockers: string[] | null;
  updated_at: string | null;
}

/** Every writable key of update_about_me, in a stable order. */
export const WRITABLE = [
  'profession', 'about',
  'ai_tone', 'ai_push', 'ai_avoid',
  'wake_time', 'sleep_time', 'work_start', 'work_end', 'best_time',
  'focus_90d', 'life_phase', 'living_with', 'blockers',
] as const;
export type WritableKey = (typeof WRITABLE)[number];
export type AboutValues = Record<WritableKey, string | string[] | null>;

const PROFILE_KEYS: ReadonlySet<WritableKey> = new Set(['profession', 'about']);

export const KEY_LABEL_PT: Record<WritableKey, string> = {
  profession: 'Trabalho ou estudo',
  about: 'Seu momento',
  ai_tone: 'Tom da IA',
  ai_push: 'Quanto a IA cobra',
  ai_avoid: 'Assuntos que a IA não puxa',
  wake_time: 'Acordo',
  sleep_time: 'Durmo',
  work_start: 'Começo a trabalhar',
  work_end: 'Paro de trabalhar',
  best_time: 'Melhor hora',
  focus_90d: 'Foco dos 90 dias',
  life_phase: 'Fase',
  living_with: 'Com quem mora',
  blockers: 'O que costuma travar',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Casefold + strip accents, for matching "Filhos Pequenos" to small_kids. */
function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    .replace(/[\s-]+/g, '_');
}

/**
 * Free text written by the model on the user's behalf is replayed into
 * future model contexts by the read tools: normalize it and drop the
 * control/bidi characters that could reshape how it renders later.
 * `singleLine` also folds newlines (profession, focus, topics).
 */
function cleanText(s: string, singleLine: boolean): string {
  let out = s
    .normalize('NFC')
    // deno-lint-ignore no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[‎‏‪-‮⁦-⁩]/g, '');
  if (singleLine) out = out.replace(/\s+/g, ' ');
  return out.trim();
}

/** Accepts the slug or the pt/en label. */
function matchOption(opts: Options, raw: string): string | null {
  const k = fold(raw);
  for (const [slug, l] of Object.entries(opts)) {
    if (fold(slug) === k || fold(l.pt) === k || fold(l.en) === k) return slug;
  }
  return null;
}

/** `HH:MM[:SS]` from the database → `HH:MM`. */
function hhmm(t: string | null | undefined): string | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

/** "6:30", "06:30", "6h30", "6h", "18:00:00" → "HH:MM"; anything else null. */
export function parseTime(raw: string): string | null {
  const m = /^\s*(\d{1,2})\s*(?:[:h]\s*(\d{2})?)?(?::\d{2})?\s*$/i.exec(raw);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// ─── Current state ──────────────────────────────────────────────────────────

/** The current values, in the shape update_about_me speaks. */
export function currentValues(p: ProfileRow, c: ContextRow | null): AboutValues {
  return {
    profession: p.profession ?? null,
    about: p.about ?? null,
    ai_tone: c?.ai_tone ?? null,
    ai_push: c?.ai_push ?? null,
    ai_avoid: c?.ai_avoid ?? [],
    wake_time: hhmm(c?.wake_time),
    sleep_time: hhmm(c?.sleep_time),
    work_start: hhmm(c?.work_start),
    work_end: hhmm(c?.work_end),
    best_time: c?.best_time ?? null,
    focus_90d: c?.focus_90d ?? null,
    life_phase: c?.life_phase ?? [],
    living_with: c?.living_with ?? [],
    blockers: c?.blockers ?? [],
  };
}

function isEmpty(v: string | string[] | null): boolean {
  return v == null || (Array.isArray(v) ? v.length === 0 : v.trim() === '');
}

/** Which of the card's seven fields have something in them (the app's rule). */
export function filledFields(v: AboutValues): Set<AboutField> {
  const s = new Set<AboutField>();
  if (!isEmpty(v.ai_tone) || !isEmpty(v.ai_push) || !isEmpty(v.ai_avoid)) s.add('ai');
  if (['wake_time', 'sleep_time', 'work_start', 'work_end', 'best_time']
    .some((k) => !isEmpty(v[k as WritableKey]))) s.add('rhythm');
  if (!isEmpty(v.focus_90d)) s.add('focus');
  if (!isEmpty(v.life_phase) || !isEmpty(v.living_with)) s.add('phase');
  if (!isEmpty(v.blockers)) s.add('blockers');
  if (!isEmpty(v.profession)) s.add('work');
  if (!isEmpty(v.about)) s.add('moment');
  return s;
}

const label = (opts: Options, slug: string | null) =>
  slug ? { value: slug, label_pt: opts[slug]?.pt ?? slug } : null;
const labels = (opts: Options, slugs: string[] | null) =>
  (slugs ?? []).map((s) => ({ value: s, label_pt: opts[s]?.pt ?? s }));

/** get_self_knowledge.about_me — structured, with the pt labels the app shows. */
export function aboutMeView(p: ProfileRow, c: ContextRow | null, today: string) {
  const v = currentValues(p, c);
  const filled = filledFields(v);
  const focusDays = c?.focus_set_at
    ? Math.floor((Date.parse(`${today}T12:00:00Z`) - Date.parse(c.focus_set_at)) / 86_400_000)
    : null;
  return {
    filled: filled.size,
    total: ABOUT_FIELDS.length,
    ai_style: {
      tone: label(AI_TONES, v.ai_tone as string | null),
      push: label(AI_PUSHES, v.ai_push as string | null),
      avoid_topics: v.ai_avoid,
    },
    rhythm: {
      wake: v.wake_time,
      sleep: v.sleep_time,
      work: v.work_start && v.work_end ? { from: v.work_start, to: v.work_end } : null,
      best_time: label(BEST_TIMES, v.best_time as string | null),
    },
    focus_90d: v.focus_90d
      ? {
        text: v.focus_90d,
        set_at: c?.focus_set_at ?? null,
        days_ago: focusDays,
        // Past 90 days the focus may be stale: ask, do not assume.
        stale: focusDays != null && focusDays > 90,
      }
      : null,
    life_phase: labels(LIFE_PHASES, v.life_phase as string[]),
    living_with: labels(LIVING_WITH, v.living_with as string[]),
    blockers: labels(BLOCKERS, v.blockers as string[]),
  };
}

// ─── update_about_me: validate a patch against the current state ────────────

export type PatchInput = Partial<Record<WritableKey, string | string[] | null | undefined>>;

export interface PatchResult {
  next: AboutValues;
  changes: Array<{ key: WritableKey; label_pt: string; from: string | string[] | null; to: string | string[] | null }>;
  errors: Array<{ key: string; error: string; allowed?: string[]; max?: number }>;
}

/** "slug (Rótulo)" — the model can map either back. */
function allowed(opts: Options): string[] {
  return Object.entries(opts).map(([slug, l]) => `${slug} (${l.pt})`);
}

function sameValue(a: string | string[] | null, b: string | string[] | null): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Applies the patch: an omitted key stays as is, null (or [] / "") clears.
 * Every list is matched against the closed options; free text is cleaned
 * and NEVER truncated (an over-long value is an error the model fixes with
 * the user, not a silent cut). Returns the full next state, the diff and
 * the errors — nothing is written when errors is non-empty.
 */
export function applyPatch(current: AboutValues, input: PatchInput): PatchResult {
  const next: AboutValues = { ...current };
  const errors: PatchResult['errors'] = [];

  const text = (key: 'profession' | 'about' | 'focus_90d', max: number, singleLine: boolean) => {
    const raw = input[key];
    if (raw === undefined) return;
    if (raw === null) { next[key] = null; return; }
    if (typeof raw !== 'string') { errors.push({ key, error: 'expected_text' }); return; }
    const v = cleanText(raw, singleLine);
    if (v.length > max) { errors.push({ key, error: 'too_long', max }); return; }
    next[key] = v || null;
  };
  text('profession', LIMITS.profession, true);
  text('about', LIMITS.about, false);
  text('focus_90d', LIMITS.focus_90d, true);

  const one = (key: 'ai_tone' | 'ai_push' | 'best_time', opts: Options) => {
    const raw = input[key];
    if (raw === undefined) return;
    if (raw === null || (typeof raw === 'string' && raw.trim() === '')) { next[key] = null; return; }
    const slug = typeof raw === 'string' ? matchOption(opts, raw) : null;
    if (!slug) { errors.push({ key, error: 'unknown_option', allowed: allowed(opts) }); return; }
    next[key] = slug;
  };
  one('ai_tone', AI_TONES);
  one('ai_push', AI_PUSHES);
  one('best_time', BEST_TIMES);

  const many = (key: 'life_phase' | 'living_with' | 'blockers', opts: Options, max: number) => {
    const raw = input[key];
    if (raw === undefined) return;
    if (raw === null) { next[key] = []; return; }
    const list = Array.isArray(raw) ? raw : [raw];
    const out: string[] = [];
    for (const item of list) {
      const slug = typeof item === 'string' ? matchOption(opts, item) : null;
      if (!slug) { errors.push({ key, error: `unknown_option: ${String(item)}`, allowed: allowed(opts) }); return; }
      if (!out.includes(slug)) out.push(slug);
    }
    if (out.length > max) { errors.push({ key, error: 'too_many', max }); return; }
    next[key] = out;
  };
  many('life_phase', LIFE_PHASES, LIMITS.life_phase);
  many('living_with', LIVING_WITH, Object.keys(LIVING_WITH).length);
  many('blockers', BLOCKERS, LIMITS.blockers);
  const living = next.living_with as string[];
  if (living.includes('alone') && living.length > 1) {
    errors.push({ key: 'living_with', error: '"alone" cannot be combined with anyone else' });
  }

  if (input.ai_avoid !== undefined) {
    const raw = input.ai_avoid;
    const list = raw === null ? [] : Array.isArray(raw) ? raw : [raw];
    const out: string[] = [];
    const seen = new Set<string>();
    let bad = false;
    for (const item of list) {
      if (typeof item !== 'string') { bad = true; break; }
      const v = cleanText(item, true);
      if (!v) continue;
      if (v.length > LIMITS.ai_avoid_len) {
        errors.push({ key: 'ai_avoid', error: `topic too long: ${v}`, max: LIMITS.ai_avoid_len });
        bad = true;
        break;
      }
      if (seen.has(v.toLowerCase())) continue;
      seen.add(v.toLowerCase());
      out.push(v);
    }
    if (!bad && out.length > LIMITS.ai_avoid_items) {
      errors.push({ key: 'ai_avoid', error: 'too_many', max: LIMITS.ai_avoid_items });
    } else if (!bad) {
      next.ai_avoid = out;
    }
  }

  for (const key of ['wake_time', 'sleep_time', 'work_start', 'work_end'] as const) {
    const raw = input[key];
    if (raw === undefined) continue;
    if (raw === null || (typeof raw === 'string' && raw.trim() === '')) { next[key] = null; continue; }
    const v = typeof raw === 'string' ? parseTime(raw) : null;
    if (!v) { errors.push({ key, error: 'expected HH:MM (24h, local)' }); continue; }
    next[key] = v;
  }
  if ((next.work_start == null) !== (next.work_end == null)) {
    errors.push({ key: 'work_start/work_end', error: 'work hours are a pair: send both, or clear both' });
  }

  const changes = WRITABLE
    .filter((k) => !sameValue(current[k], next[k]))
    .map((k) => ({ key: k, label_pt: KEY_LABEL_PT[k], from: current[k], to: next[k] }));
  return { next, changes, errors };
}

/** The rows to write: profile columns and profile_context columns, changed only. */
export function splitWrite(changes: PatchResult['changes']) {
  const profile: Record<string, string | null> = {};
  const context: Record<string, string | string[] | null> = {};
  for (const c of changes) {
    if (PROFILE_KEYS.has(c.key)) profile[c.key] = c.to as string | null;
    else context[c.key] = c.to;
  }
  return { profile, context };
}

/**
 * The confirmation code binds a write to the exact preview the user saw:
 * a hash of the user, the proposed values and the state they were computed
 * against. Change any field, or let the profile change in between, and the
 * code no longer matches — the model has to preview (and ask) again.
 */
export async function confirmCode(
  userId: string,
  changes: PatchResult['changes'],
  stateStamp: string,
): Promise<string> {
  const payload = JSON.stringify([userId, stateStamp, changes.map((c) => [c.key, c.to])]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return [...new Uint8Array(digest)].slice(0, 4)
    .map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ─── get_setup_checklist ────────────────────────────────────────────────────

export const INSTRUMENTS: Array<{ id: string; title_pt: string; route: string; premium: boolean; minutes: number }> = [
  { id: 'disc', title_pt: 'DISC', route: 'disc', premium: false, minutes: 5 },
  { id: 'tipos', title_pt: 'Tipos', route: 'types', premium: false, minutes: 8 },
  { id: 'strengths', title_pt: 'Forças', route: 'strengths', premium: true, minutes: 10 },
  { id: 'schwartz_pvq', title_pt: 'Valores', route: 'schwartz', premium: true, minutes: 10 },
  { id: 'ecr_r', title_pt: 'Apego', route: 'ecr-r', premium: true, minutes: 8 },
  { id: 'big_five_120', title_pt: 'Big Five', route: 'big-five', premium: true, minutes: 15 },
];

export interface ChecklistInput {
  isPremium: boolean;
  modules: Record<string, boolean>;
  sessions: Array<{ instrument_id: string; taken_at: string }>;
  selfAssessed: boolean;
  hasDesired: boolean;
  lifeVisionVersions: number;
  about: AboutValues;
}

export function buildChecklist(i: ChecklistInput) {
  const latest = new Map<string, string>();
  for (const s of i.sessions) {
    const prev = latest.get(s.instrument_id);
    if (!prev || prev < s.taken_at) latest.set(s.instrument_id, s.taken_at);
  }
  const avaliacaoAt = [latest.get('avaliacao_v2'), latest.get('avaliacao_v1')]
    .filter(Boolean).sort().pop() ?? null;

  type Item = {
    key: string;
    title_pt: string;
    status: 'done' | 'missing' | 'partial' | 'optional';
    why_pt: string;
    needs_premium: boolean;
    available: boolean;
    open_in_app: string;
    [extra: string]: unknown;
  };

  const items: Item[] = [];

  items.push({
    key: 'avaliacao',
    title_pt: 'Avaliação',
    status: avaliacaoAt || i.selfAssessed ? 'done' : 'missing',
    why_pt: 'Como você se vê hoje em cada área. Abre a aba Eu e é a base do resto.',
    needs_premium: false,
    available: true,
    done_at: avaliacaoAt,
    open_in_app: `${APP}://self-assessment`,
    full_version_in_app: `${APP}://questionnaire`,
  });

  for (const inst of INSTRUMENTS) {
    const at = latest.get(inst.id) ?? null;
    items.push({
      key: `instrument:${inst.id}`,
      title_pt: inst.title_pt,
      status: at ? 'done' : 'missing',
      why_pt: `Teste de autoconhecimento (~${inst.minutes} min). O resultado muda como a IA fala com você.`,
      needs_premium: inst.premium,
      available: !inst.premium || i.isPremium,
      done_at: at,
      open_in_app: `${APP}://${inst.route}`,
    });
  }

  items.push({
    key: 'norte',
    title_pt: 'Norte',
    status: i.hasDesired ? 'done' : 'missing',
    why_pt: 'Onde você quer estar em cada área, de 0 a 5. É a Identidade Desejada.',
    needs_premium: false,
    available: true,
    open_in_app: `${APP}://self-assessment?mode=desired`,
  });

  const vidaOn = i.isPremium && i.modules.vida === true;
  items.push({
    key: 'vida',
    title_pt: 'A vida que eu quero',
    status: i.lifeVisionVersions > 0 ? 'done' : 'missing',
    why_pt: 'As 3 coisas que você veria na sua vida se dinheiro e tempo não fossem problema. O porquê por trás das práticas.',
    needs_premium: true,
    available: vidaOn,
    module_on: vidaOn,
    // Module off → the switch lives in Ajustes › Módulos.
    open_in_app: vidaOn ? `${APP}://vida` : `${APP}://profile`,
  });

  const filled = filledFields(i.about);
  items.push({
    key: 'about_me',
    title_pt: 'Sobre você',
    status: filled.size === ABOUT_FIELDS.length ? 'done' : filled.size === 0 ? 'missing' : 'partial',
    why_pt: 'O jeito da IA, seu ritmo, o foco dos 90 dias, sua fase, o que trava, trabalho e momento.',
    needs_premium: false,
    available: true,
    filled: filled.size,
    total: ABOUT_FIELDS.length,
    fields: ABOUT_FIELDS.map((f) => ({
      key: f,
      title_pt: FIELD_TITLE_PT[f],
      filled: filled.has(f),
      open_in_app: `${APP}://sobre-voce?field=${f}`,
    })),
    open_in_app: `${APP}://perfil`,
    can_write_here: 'update_about_me',
  });

  const MODULE_TITLES: Record<string, string> = {
    missoes: 'Missões', metas: 'Metas', semana: 'Minha Semana', skills: 'Habilidades', vida: 'A vida que eu quero',
  };
  items.push({
    key: 'modules',
    title_pt: 'Módulos',
    status: 'optional',
    why_pt: 'Telas extras que ligam e desligam em Ajustes › Módulos. Opcionais de propósito: o app é simples por padrão.',
    needs_premium: true,
    available: i.isPremium,
    modules: Object.entries(MODULE_TITLES).map(([key, title_pt]) => ({
      key, title_pt, on: i.isPremium && i.modules[key] === true,
    })),
    open_in_app: `${APP}://profile`,
  });

  const counted = items.filter((it) => it.status !== 'optional');
  const done = counted.filter((it) => it.status === 'done').length;
  // The first thing still missing that this user can actually open.
  const next = counted.find((it) => it.status !== 'done' && it.available) ?? null;

  return {
    plan: i.isPremium ? 'premium' : 'free',
    summary: { done, total: counted.length },
    next_suggestion: next ? { key: next.key, title_pt: next.title_pt, open_in_app: next.open_in_app } : null,
    items,
  };
}
