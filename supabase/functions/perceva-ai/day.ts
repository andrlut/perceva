// ============================================================================
// The local day and the recurrence contract — pure, no Deno APIs (testable
// with any runtime). A copy of the port in perceva-mcp/index.ts, which is
// itself a verbatim port of app/lib/recurrence.ts:
//
//   open(D) ⟺ scheduledOn(D) ∧ completionsOn(D) === 0 ∧ ¬skippedOn(D)
//
// Kept apart from the MCP on purpose: touching perceva-mcp means a redeploy
// of a live connector for no change of its own. If the contract changes,
// change all three.
// ============================================================================

export const TZ = 'America/Sao_Paulo';

const LOCAL_DATE_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });

/** YYYY-MM-DD for an instant, in the user's timezone. */
export function localDate(at: Date): string {
  return LOCAL_DATE_FMT.format(at);
}

export function isDateKey(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function daysBetween(from: string, to: string): number {
  const [ay, am, ad] = from.split('-').map(Number);
  const [by, bm, bd] = to.split('-').map(Number);
  return (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000;
}

/** "terça-feira, 10 de novembro" / "Tuesday, November 10". Noon UTC keeps
 *  the calendar day stable under the -03 shift. */
export function dateLabel(date: string, locale: 'pt' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date(`${date}T12:00:00Z`));
}

export type Recurrence =
  | { type: 'daily' }
  | { type: 'weekly'; days?: number[] }
  | { type: 'monthly'; day?: number };

export function parseRecurrence(raw: unknown): Recurrence {
  if (raw && typeof raw === 'object' && 'type' in raw) {
    const r = raw as { type: string; days?: number[]; day?: number };
    if (r.type === 'one_shot') return { type: 'weekly' };
    if (r.type === 'weekly') {
      const days = Array.isArray(r.days)
        ? r.days.filter((d) => d >= 0 && d <= 6)
        : undefined;
      return days && days.length > 0 ? { type: 'weekly', days } : { type: 'weekly' };
    }
    if (r.type === 'monthly') {
      const day = typeof r.day === 'number' && r.day >= 1 && r.day <= 31
        ? r.day
        : undefined;
      return day ? { type: 'monthly', day } : { type: 'monthly' };
    }
  }
  return { type: 'daily' };
}

/** Is the practice scheduled on this local calendar day? */
export function isScheduledOn(rec: Recurrence, date: string): boolean {
  const [y, m, d] = date.split('-').map(Number);
  switch (rec.type) {
    case 'daily':
      return true;
    case 'weekly':
      return Array.isArray(rec.days) &&
        rec.days.includes(new Date(Date.UTC(y, m - 1, d)).getUTCDay());
    case 'monthly': {
      if (typeof rec.day !== 'number') return false;
      if (d === rec.day) return true;
      if (rec.day > 28) {
        const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
        if (rec.day > lastDay && d === lastDay) return true;
      }
      return false;
    }
  }
}

/**
 * Transcribed speech: normalize and strip the control/bidi characters that
 * could reshape how it renders later; keep newlines.
 */
export function sanitizeText(s: string): string {
  return s
    .normalize('NFC')
    // deno-lint-ignore no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[‎‏‪-‮⁦-⁩]/g, '')
    .trim();
}
