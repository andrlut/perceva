// ============================================================================
// perceva-ai — the app's native AI. First feature: "Conte seu dia".
//
// The person dictates their day (the phone's own speech recognizer, so only
// TEXT reaches this server); Claude Haiku 5.5 turns it into a DRAFT — mood,
// tags, note, practices done or skipped today — through proposal-only tools,
// and this function validates every line and returns it WITHOUT WRITING.
// The app shows the draft on a card and writes only after the tap on
// Registrar, with the RPCs it already has (complete_task, task_skip, the
// merging mood write) — so the existing Desfazer covers every line.
//
// Guards, in order:
//   1. JWT checked server-side with auth.getUser() (same as perceva-mcp and
//      delete-account). The uid never comes from the body.
//   2. ai_begin (service_role): the `ai` row of app_config (on/off,
//      allowlist, model, caps), 6/minute and 30/day per person, a global
//      daily US$ cap summed from the ledger, and the reservation itself —
//      all under one per-person advisory lock.
//   3. Size: the transcript is capped (config max_chars), max_tokens 2048.
//   4. ai_settle writes the real usage; when the model failed or proposed
//      nothing, the day's credit comes back (refund row).
//
// Privacy: the transcript is never stored and never logged. The ledger keeps
// numbers only (tokens, cost, latency, line counts). Logs carry the request
// ref and numbers, never content.
//
// Deploy with --no-verify-jwt, like perceva-mcp: the gateway check is tied to
// the legacy signing secret, and the function verifies the JWT itself
// (getUser) before anything else.
// Secret: ANTHROPIC_API_KEY (supabase secrets set …). Without it the function
// answers `not_configured` before reserving anything.
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { publishableKey, secretKey } from '../_shared/keys.ts';
import {
  dateLabel,
  daysBetween,
  isDateKey,
  isScheduledOn,
  localDate,
  parseRecurrence,
  sanitizeText,
} from './day.ts';
import {
  buildTools,
  buildUserMessage,
  costMicros,
  extractDraft,
  SYSTEM_PROMPT,
  type DayCtx,
  type PracticeCtx,
  type TagCatalogEntry,
} from './logic.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

/** Hard ceiling before the config is even read (the config's max_chars,
 *  1500 by default, is checked after the reservation). */
const HARD_MAX_CHARS = 4000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function userClient(token: string): SupabaseClient {
  return createClient(SUPABASE_URL, publishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY || 'missing',
  timeout: 30_000,
  maxRetries: 1,
});

// ─── The day, read under RLS ─────────────────────────────────────────────────

async function loadDay(
  db: SupabaseClient,
  today: string,
  locale: 'pt' | 'en',
): Promise<{ ctx: DayCtx; tags: TagCatalogEntry[] }> {
  const [tasksRes, compRes, skipRes, moodRes, tagRes] = await Promise.all([
    db.from('task')
      .select('id,title,icon,recurrence,sort_order,created_at')
      .eq('is_archived', false)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    db.from('task_completion').select('task_id').eq('completed_local_date', today),
    db.from('task_skip').select('task_id').eq('skipped_for', today),
    db.from('mood_log').select('mood,note,tags').eq('logged_for', today).limit(1),
    db.from('mood_tag')
      .select('slug,label_pt,label_en')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);
  for (const r of [tasksRes, compRes, skipRes, moodRes, tagRes]) {
    if (r.error) throw new Error(`read: ${r.error.message}`);
  }

  const done = new Set((compRes.data ?? []).map((c) => c.task_id as string));
  const skipped = new Set((skipRes.data ?? []).map((s) => s.task_id as string));

  // Open ones first (they get the low refs), then the rest — the order the
  // person sees them on the Home.
  const rows = (tasksRes.data ?? []).map((t) => {
    const id = t.id as string;
    const isDone = done.has(id);
    const isSkipped = skipped.has(id);
    const open = !isDone && !isSkipped && isScheduledOn(parseRecurrence(t.recurrence), today);
    return { id, title: t.title as string, icon: (t.icon as string | null) ?? null, open, done: isDone, skipped: isSkipped };
  });
  rows.sort((a, b) => Number(b.open) - Number(a.open));
  const practices: PracticeCtx[] = rows.map((r, i) => ({ ref: `p${i + 1}`, ...r }));

  const m = moodRes.data?.[0] as { mood: number; note: string | null; tags: string[] | null } | undefined;
  return {
    ctx: {
      today,
      dateLabel: dateLabel(today, locale),
      practices,
      mood: m ? { mood: m.mood, tags: m.tags ?? [], note: m.note } : null,
    },
    tags: (tagRes.data ?? []) as TagCatalogEntry[],
  };
}

// ─── HTTP ────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { ok: false, reason: 'method' });

  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return json(401, { ok: false, reason: 'unauthorized' });
  const token = auth.slice(7).trim();
  const db = userClient(token);
  const { data: who, error: whoErr } = await db.auth.getUser();
  if (whoErr || !who?.user) return json(401, { ok: false, reason: 'unauthorized' });
  const uid = who.user.id;

  let body: { action?: unknown; text?: unknown; today?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, reason: 'bad_request' });
  }
  if (body.action !== 'day_voice') return json(400, { ok: false, reason: 'bad_request' });

  const text = typeof body.text === 'string' ? sanitizeText(body.text) : '';
  if (!text) return json(200, { ok: false, reason: 'empty_text' });
  if (text.length > HARD_MAX_CHARS) return json(200, { ok: false, reason: 'too_long', max_chars: 1500 });
  const locale: 'pt' | 'en' = body.locale === 'en' ? 'en' : 'pt';

  // The app's "today" is the device's local day (the Home's). Trust it within
  // a day of the server's own reading, so a stale clock can't reach back.
  const serverToday = localDate(new Date());
  const today = isDateKey(body.today) && Math.abs(daysBetween(serverToday, body.today)) <= 1
    ? body.today
    : serverToday;

  if (!ANTHROPIC_API_KEY) return json(200, { ok: false, reason: 'not_configured' });

  // ── Reserve ────────────────────────────────────────────────────────────────
  const admin = adminClient();
  const ref = crypto.randomUUID();
  const { data: begin, error: beginErr } = await admin.rpc('ai_begin', {
    p_user: uid,
    p_ref: ref,
    p_feature: 'day_voice',
  });
  if (beginErr) {
    console.error('perceva-ai: ai_begin failed', beginErr.code ?? '', beginErr.message);
    return json(500, { ok: false, reason: 'server' });
  }
  const gate = begin as {
    ok: boolean; reason?: string; model?: string; max_chars?: number;
    used_today?: number; per_day?: number;
  };
  if (!gate.ok) {
    return json(200, { ok: false, reason: gate.reason ?? 'disabled', used_today: gate.used_today, per_day: gate.per_day });
  }

  const started = Date.now();
  const model = gate.model ?? 'claude-haiku-5-5';
  let usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

  const settle = async (status: 'ok' | 'empty' | 'failed') => {
    const { error } = await admin.rpc('ai_settle', {
      p_ref: ref,
      p_status: status,
      p_tokens_in: usage.input_tokens,
      p_tokens_out: usage.output_tokens,
      p_cache_read: usage.cache_read_input_tokens,
      p_cache_write: usage.cache_creation_input_tokens,
      p_cost_micros: costMicros(model, usage),
      p_latency_ms: Date.now() - started,
    });
    if (error) console.error('perceva-ai: ai_settle failed', ref, error.message);
    // Numbers only — never the transcript or the draft.
    console.log(JSON.stringify({
      ref, status, model,
      in: usage.input_tokens, out: usage.output_tokens,
      cr: usage.cache_read_input_tokens, cw: usage.cache_creation_input_tokens,
      ms: Date.now() - started,
    }));
  };

  if (text.length > (gate.max_chars ?? 1500)) {
    await settle('failed');
    return json(200, { ok: false, reason: 'too_long', max_chars: gate.max_chars ?? 1500, refunded: true });
  }

  try {
    const { ctx, tags } = await loadDay(db, today, locale);

    const response = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: buildTools(tags),
      tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content: buildUserMessage(ctx, text, tags) }],
    });

    usage = {
      input_tokens: response.usage.input_tokens ?? 0,
      output_tokens: response.usage.output_tokens ?? 0,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? 0,
    };

    if (response.stop_reason === 'refusal') {
      await settle('failed');
      return json(200, { ok: false, reason: 'ai_failed', refunded: true });
    }

    const { draft, remark, lines, dropped } = extractDraft(response.content, ctx, tags);
    if (lines === 0) {
      await settle('empty');
      return json(200, { ok: false, reason: 'not_understood', remark, refunded: true });
    }

    await settle('ok');
    return json(200, {
      ok: true,
      request_id: ref,
      draft,
      remark,
      lines,
      dropped,
      used_today: gate.used_today,
      per_day: gate.per_day,
    });
  } catch (err) {
    const status = err instanceof Anthropic.APIError ? err.status : undefined;
    console.error('perceva-ai: failed', ref, status ?? '', err instanceof Error ? err.name : 'unknown');
    await settle('failed');
    return json(200, { ok: false, reason: 'ai_failed', refunded: true });
  }
});
